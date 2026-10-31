/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Lead, DripConfig, LandingPageSite } from './types/lead';
import { AppUser, INITIAL_SEED_USERS } from './types/user';
import { LANDING_PAGE_DOMAINS, getDomainForResort } from './data/landingPages';
import { INITIAL_SEED_LEADS, INITIAL_SEED_QUEUE } from './data/initialLeads';
import { playLiveLeadChime } from './utils/audio';
import { exportLeadsToExcel } from './utils/export';
import { LoginPage } from './components/LoginPage';
import { Navbar } from './components/Navbar';
import { LeadsDashboard } from './components/LeadsDashboard';
import { AdminSpreadsheetPanel } from './components/AdminSpreadsheetPanel';
import { AdminLoginModal } from './components/AdminLoginModal';
import { LiveNotificationToast } from './components/LiveNotificationToast';
import { LeadDetailModal } from './components/LeadDetailModal';
import { Lock, FileSpreadsheet, X, ArrowRight } from 'lucide-react';
import { saveMasterQueueToIDB, getMasterQueueFromIDB, clearMasterQueueFromIDB, saveUsersToIDB, getUsersFromIDB } from './utils/dbStorage';

function mergeUserLists(serverUsers: AppUser[], localUsers: AppUser[]): { merged: AppUser[]; hasNewLocalUsers: boolean } {
  const userMap = new Map<string, AppUser>();
  for (const u of INITIAL_SEED_USERS) {
    userMap.set(u.username.trim().toLowerCase(), u);
  }
  for (const u of serverUsers) {
    if (u && u.username) userMap.set(u.username.trim().toLowerCase(), u);
  }
  let hasNewLocalUsers = false;
  for (const u of localUsers) {
    if (u && u.username && !userMap.has(u.username.trim().toLowerCase())) {
      userMap.set(u.username.trim().toLowerCase(), u);
      hasNewLocalUsers = true;
    }
  }
  return { merged: Array.from(userMap.values()), hasNewLocalUsers };
}

// Safe localStorage write helper that prevents QuotaExceededError from crashing React
function safeLocalStorageSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    console.warn(`[Storage] Failed to store "${key}" in localStorage:`, err);
    // Graceful fallback for large lead datasets: store only recent 50 items so localStorage stays within quota
    try {
      if (key === '1click_uploaded_leads' || key === '1click_uploaded_queue') {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed) && parsed.length > 50) {
          localStorage.setItem(key, JSON.stringify(parsed.slice(0, 50)));
        }
      }
    } catch {
      // Ignore secondary error
    }
  }
}

function getDeletedClaimedIds(): Set<string> {
  try {
    const stored = localStorage.getItem('1click_deleted_claimed_ids');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return new Set(parsed.map(String));
    }
  } catch {}
  return new Set<string>();
}

function addDeletedClaimedIds(ids: string[]): void {
  try {
    const existing = getDeletedClaimedIds();
    ids.forEach((id) => existing.add(String(id)));
    safeLocalStorageSet('1click_deleted_claimed_ids', JSON.stringify(Array.from(existing)));
  } catch {}
}

function mergeServerClaimedLeads(serverClaimed: Lead[], currentMap: Record<string, Lead[]>): Record<string, Lead[]> {
  const deletedIds = getDeletedClaimedIds();
  const nextMap: Record<string, Lead[]> = {};

  for (const raw of serverClaimed) {
    if (deletedIds.has(raw.id)) continue;
    const cleanLead: Lead = {
      ...raw,
      claimedBy:
        typeof raw.claimedBy === 'object' && raw.claimedBy !== null
          ? ((raw.claimedBy as any).username || (raw.claimedBy as any).name || 'Current Closer')
          : String(raw.claimedBy || 'Current Closer'),
    };
    const userKey: string = cleanLead.claimedBy || 'Current Closer';
    if (!nextMap[userKey]) nextMap[userKey] = [];
    nextMap[userKey].push(cleanLead);
  }

  for (const [userKey, list] of Object.entries(currentMap)) {
    if (!nextMap[userKey]) nextMap[userKey] = [];
    for (const lead of list) {
      if (deletedIds.has(lead.id)) continue;
      if (!nextMap[userKey].some((l: Lead) => l.id === lead.id)) {
        nextMap[userKey].push(lead);
      }
    }
  }

  return nextMap;
}

// Helper to extract unique contact identity key for client-side lead deduplication
function getLeadClientDedupeKey(lead: any): string {
  if (!lead) return '';
  const phone = String(lead.phone || '').replace(/\D/g, '');
  const email = String(lead.email || '').trim().toLowerCase();
  const name = String(lead.fullName || `${lead.firstName || ''} ${lead.lastName || ''}`).trim().toLowerCase();
  
  return `key:${name.slice(0, 10)}:${phone.slice(-10)}:${email.slice(0, 10)}`;
}

// Helper to detect and reject synthetic or automated test leads
function isTestLead(lead: any): boolean {
  if (!lead) return false;
  const name = String(lead.fullName || lead.name || '').trim().toLowerCase();
  const email = String(lead.email || '').trim().toLowerCase();
  const phone = String(lead.phone || '').trim();
  const notes = String(lead.notes || '').trim().toLowerCase();
  return (
    name.includes('excel lead') ||
    name.includes('test lead') ||
    name.includes('owner lead') ||
    name.includes('client lead') ||
    /\(\d+\)$/.test(String(lead.fullName || lead.name || '').trim()) ||
    email.includes('realexitclient.com') ||
    email.includes('testleads.com') ||
    email.includes('timeshare-exit.com') ||
    email.includes('example.com') ||
    phone.includes('(407) 800-') ||
    phone.includes('(555) 777-') ||
    phone.includes('(555) 000-') ||
    notes.includes('imported from timeshare exit spreadsheet row') ||
    notes.includes('spreadsheet row') ||
    notes.includes('test lead') ||
    notes.includes('excel lead')
  );
}

// Client-side deduplication helper to ensure duplicate leads never render simultaneously
function dedupeLeadListClient(list: Lead[]): Lead[] {
  if (!Array.isArray(list)) return [];
  const seenIds = new Set<string>();
  const out: Lead[] = [];
  for (const l of list) {
    if (!l || !l.id || isTestLead(l)) continue;
    if (!seenIds.has(l.id)) {
      seenIds.add(l.id);
      out.push(l);
    }
  }
  return out;
}

export default function App() {
  // Authentication State: First page is login with 1clickleads / 1clickadmin or admin
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('1click_authenticated') === 'true';
  });

  // Administrator authorization state - password protected (salesleads777@gmail.com / Mafioso2356$)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('1click_admin_authenticated') === 'true';
  });
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    try {
      const saved = sessionStorage.getItem('1click_current_user');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      if (typeof parsed === 'string') return parsed;
      if (parsed && typeof parsed === 'object') {
        const u = parsed.username || parsed.name || parsed.id;
        return typeof u === 'string' ? u : String(u || '');
      }
      return String(parsed);
    } catch {
      const saved = sessionStorage.getItem('1click_current_user');
      return saved || null;
    }
  });
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);

  // Mode: Buyer/Closer Live Feed vs Admin Login Portal
  const [activeTab, setActiveTab] = useState<'feed' | 'admin'>('feed');

  // Active leads in live database pool - starts empty until real spreadsheet is uploaded
  const [leads, setLeads] = useState<Lead[]>(() => {
    const saved = localStorage.getItem('1click_uploaded_leads');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const clean = parsed.filter((l) => !isTestLead(l));
          if (clean.length > 0) return clean;
        }
      } catch {
        // fallback
      }
    }
    return [];
  });

  // User's Claimed Leads Vault - permanently removed from database pool and eligible for Excel export
  const [claimedLeadsMap, setClaimedLeadsMap] = useState<Record<string, Lead[]>>(() => {
    const saved = localStorage.getItem('1click_claimed_leads_map');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          const cleanMap: Record<string, Lead[]> = {};
          for (const [key, list] of Object.entries(parsed)) {
            if (Array.isArray(list)) {
              cleanMap[key] = list.map((l: any) => ({
                ...l,
                claimedBy:
                  typeof l.claimedBy === 'object' && l.claimedBy !== null
                    ? (l.claimedBy.username || l.claimedBy.name || key)
                    : String(l.claimedBy || key),
              }));
            }
          }
          return cleanMap;
        }
      } catch {
        // fallback
      }
    }
    // Migration: if old 1click_claimed_leads exists, move it to default user
    const oldSaved = localStorage.getItem('1click_claimed_leads');
    if (oldSaved) {
       try {
         const parsed = JSON.parse(oldSaved);
         if (Array.isArray(parsed)) {
           return {
             '1clickleads': parsed.map((l: any) => ({
               ...l,
               claimedBy:
                 typeof l.claimedBy === 'object' && l.claimedBy !== null
                   ? (l.claimedBy.username || '1clickleads')
                   : String(l.claimedBy || '1clickleads'),
             })),
           };
         }
       } catch {}
    }
    return {};
  });

  // Isolated per user so each user ONLY sees their own claimed leads in the vault
  const claimedLeads = useMemo<Lead[]>(() => {
    const userKey =
      typeof currentUser === 'object' && currentUser !== null
        ? ((currentUser as any).username || (currentUser as any).name || 'Current Closer')
        : (currentUser || 'Current Closer');
    return claimedLeadsMap[userKey] || [];
  }, [currentUser, claimedLeadsMap]);

  const updateClaimedLeads = (updater: (prev: Lead[]) => Lead[]) => {
    const userKey =
      typeof currentUser === 'object' && currentUser !== null
        ? ((currentUser as any).username || (currentUser as any).name || 'Current Closer')
        : (currentUser || 'Current Closer');

    setClaimedLeadsMap((prevMap) => {
      const prev = prevMap[userKey] || [];
      const next = updater(prev);
      const nextMap = { ...prevMap, [userKey]: next };
      safeLocalStorageSet('1click_claimed_leads_map', JSON.stringify(nextMap));
      return nextMap;
    });
  };

  // Feeder Queue - leads waiting to drip into the live feed
  const [queue, setQueue] = useState<Omit<Lead, 'id' | 'timestamp' | 'receivedAgo' | 'isNewArrival'>[]>(() => {
    const savedQ = localStorage.getItem('1click_uploaded_queue');
    if (savedQ) {
      try {
        const parsed = JSON.parse(savedQ);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const clean = parsed.filter((l) => !isTestLead(l));
          if (clean.length > 0) return clean;
        }
      } catch {
        // fallback
      }
    }
    return [];
  });

  // Track real queue total length & master queue length (supports 13,000+ leads without browser lag)
  const [queueCount, setQueueCount] = useState<number>(() => queue.length);
  const [masterQueueCount, setMasterQueueCount] = useState<number>(() => queue.length);

  // Landing Page Domains list
  const [landingPages, setLandingPages] = useState<LandingPageSite[]>(() => {
    const savedDomains = localStorage.getItem('1click_domains');
    if (savedDomains) {
      try {
        const parsed = JSON.parse(savedDomains);
        if (Array.isArray(parsed) && parsed.length >= LANDING_PAGE_DOMAINS.length) {
          return parsed;
        }
      } catch {
        // fallback
      }
    }
    return LANDING_PAGE_DOMAINS;
  });

  // Drip Engine Configuration
  const [dripConfig, setDripConfig] = useState<DripConfig>(() => {
    const savedConfig = localStorage.getItem('1click_drip_config');
    if (savedConfig) {
      try {
        return JSON.parse(savedConfig);
      } catch {
        // fallback
      }
    }
    return {
      isEnabled: true,
      intervalSeconds: 8,
      enableJitter: false, // Jitter off by default so drip strictly follows speed settings
      soundEnabled: true,
      soundVolume: 0.7,
      autoClaimNew: false,
      showToasts: true,
    };
  });

  // Authorized Users List - for client logins and admin access
  const [users, setUsers] = useState<AppUser[]>(() => {
    const savedUsers = localStorage.getItem('1click_users');
    if (savedUsers) {
      try {
        const parsed = JSON.parse(savedUsers);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch {
        // fallback
      }
    }
    return INITIAL_SEED_USERS;
  });

  // Live Toast for animated incoming lead notification
  const [activeToastLead, setActiveToastLead] = useState<Lead | null>(null);

  // Selected lead for full details modal
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Modal alert when attempting to export without claiming
  const [showExportRestrictedModal, setShowExportRestrictedModal] = useState(false);

  // Total dropped counter
  const [droppedCount, setDroppedCount] = useState<number>(() => {
    return parseInt(localStorage.getItem('1click_uploaded_dropped_count') || '10', 10);
  });

  // Track known lead IDs to trigger chime and toast on new arrivals
  const previousLeadIdsRef = useRef<Set<string>>(new Set(leads.map((l) => l.id)));

  // Synchronize state from Centralized Backend Server on mount and via SSE & Polling
  const syncWithServer = useCallback(async () => {
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const data = await res.json();
        if (data.state) {
          const s = data.state;
          if (Array.isArray(s.leads)) {
            // Check for new arrivals to show toast & chime
            const currentIds = previousLeadIdsRef.current;
            const newArrival = s.leads.find((l: Lead) => !currentIds.has(l.id) && l.isNewArrival);
            if (newArrival && dripConfig.soundEnabled) {
              playLiveLeadChime(dripConfig.soundVolume);
            }
            if (newArrival && dripConfig.showToasts) {
              setActiveToastLead(newArrival);
            }
            const cleanLeads = dedupeLeadListClient(s.leads);
            setLeads(cleanLeads);
          }
          if (Array.isArray(s.claimedLeads)) {
            setClaimedLeadsMap((prevMap) => {
              const nextMap = mergeServerClaimedLeads(s.claimedLeads, prevMap);
              safeLocalStorageSet('1click_claimed_leads_map', JSON.stringify(nextMap));
              return nextMap;
            });
          }
          if (typeof s.queueCount === 'number') {
            setQueueCount(s.queueCount);
          } else if (Array.isArray(s.queue)) {
            setQueueCount(s.queue.length);
          }
          if (typeof s.masterQueueCount === 'number') {
            setMasterQueueCount(s.masterQueueCount);
          }
          if (Array.isArray(s.queue)) {
            setQueue(s.queue);
          }
          if (Array.isArray(s.landingPages) && s.landingPages.length >= LANDING_PAGE_DOMAINS.length) {
            setLandingPages(s.landingPages);
          }
          if (Array.isArray(s.users) && s.users.length > 0) {
            setUsers((prevUsers) => {
              const { merged, hasNewLocalUsers } = mergeUserLists(s.users, prevUsers);
              if (hasNewLocalUsers) {
                // If local client had authorized users missing on server, push immediately
                fetch('/api/users/sync', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ clientUsers: prevUsers }),
                }).catch(() => {});
              }
              return merged;
            });
          }
          if (s.dripConfig) {
            setDripConfig(s.dripConfig);
          }
          if (typeof s.droppedCount === 'number') {
            setDroppedCount(s.droppedCount);
          }
        }
      }
    } catch {
      // Backend handshake handled gracefully
    }
  }, [dripConfig.soundEnabled, dripConfig.soundVolume, dripConfig.showToasts]);

  // Initial boot: fetch server state + push any local cached leads to server so nothing is ever lost
  useEffect(() => {
    syncWithServer();

    // Purge any synthetic test data from local storage so it never reappears
    const purgeTestFromStorage = (key: string) => {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          const parsed = JSON.parse(item);
          if (Array.isArray(parsed)) {
            const cleaned = parsed.filter((l: any) => !isTestLead(l));
            localStorage.setItem(key, JSON.stringify(cleaned));
            return cleaned;
          }
        }
      } catch {}
      return [];
    };

    const cleanLeads = purgeTestFromStorage('1click_uploaded_leads');
    const cleanClaimed = purgeTestFromStorage('1click_claimed_leads');
    const cleanQueue = purgeTestFromStorage('1click_uploaded_queue');
    const localUsers = localStorage.getItem('1click_users');

    getMasterQueueFromIDB()
      .then((idbMaster) => {
        let cleanMaster = Array.isArray(idbMaster) ? idbMaster.filter((l) => !isTestLead(l)) : [];
        if (Array.isArray(idbMaster) && cleanMaster.length !== idbMaster.length) {
          saveMasterQueueToIDB(cleanMaster);
        }

        const parsedUsers = localUsers ? JSON.parse(localUsers) : [];
        fetch('/api/leads/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientLeads: cleanLeads,
            clientClaimed: cleanClaimed,
            clientQueue: cleanQueue.length > 0 ? cleanQueue : cleanMaster,
            clientUsers: parsedUsers,
          }),
        }).catch(() => {});
      })
      .catch(() => {
        try {
          const parsedUsers = localUsers ? JSON.parse(localUsers) : [];
          fetch('/api/leads/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clientLeads: cleanLeads,
              clientClaimed: cleanClaimed,
              clientQueue: cleanQueue,
              clientUsers: parsedUsers,
            }),
          }).catch(() => {});
        } catch {}
      });
  }, [syncWithServer]);

  // Connect to Server-Sent Events (SSE) for Real-Time Cross-Window Synchronization
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    const connectSSE = () => {
      try {
        eventSource = new EventSource('/api/stream');

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.state) {
              const s = data.state;
              if (Array.isArray(s.leads)) {
                // Check if a brand new lead arrived
                const currentIds = previousLeadIdsRef.current;
                const newArrival = s.leads.find((l: Lead) => !currentIds.has(l.id) && l.isNewArrival);
                if (newArrival) {
                  if (dripConfig.soundEnabled) playLiveLeadChime(dripConfig.soundVolume);
                  if (dripConfig.showToasts) setActiveToastLead(newArrival);
                }
                previousLeadIdsRef.current = new Set(s.leads.map((l: Lead) => l.id));
                const cleanLeads = dedupeLeadListClient(s.leads);
                setLeads(cleanLeads);
              }
              if (Array.isArray(s.claimedLeads)) {
                setClaimedLeadsMap((prevMap) => {
                  const nextMap = mergeServerClaimedLeads(s.claimedLeads, prevMap);
                  safeLocalStorageSet('1click_claimed_leads_map', JSON.stringify(nextMap));
                  return nextMap;
                });
              }
              if (typeof s.queueCount === 'number') setQueueCount(s.queueCount);
              if (typeof s.masterQueueCount === 'number') setMasterQueueCount(s.masterQueueCount);
              if (Array.isArray(s.queue)) setQueue(s.queue);
              if (Array.isArray(s.users) && s.users.length > 0) {
                setUsers((prevUsers) => {
                  const { merged } = mergeUserLists(s.users, prevUsers);
                  return merged;
                });
              }
              if (typeof s.droppedCount === 'number') setDroppedCount(s.droppedCount);
              if (s.dripConfig) setDripConfig((prev) => ({ ...prev, ...s.dripConfig }));
            }
          } catch {
            // handle error
          }
        };

        eventSource.onerror = () => {
          if (eventSource) eventSource.close();
          // Attempt reconnection after 3 seconds
          reconnectTimeout = setTimeout(connectSSE, 3000);
        };
      } catch {
        reconnectTimeout = setTimeout(connectSSE, 4000);
      }
    };

    connectSSE();

    // Fallback polling interval every 3.5 seconds ensures instant sync even in restrictive browsers
    const pollingInterval = setInterval(syncWithServer, 3500);

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      clearInterval(pollingInterval);
    };
  }, [syncWithServer, dripConfig.soundEnabled, dripConfig.soundVolume, dripConfig.showToasts]);

  // Keep localStorage & IndexedDB as local backup cache
  useEffect(() => {
    safeLocalStorageSet('1click_uploaded_leads', JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    safeLocalStorageSet('1click_claimed_leads', JSON.stringify(claimedLeads));
  }, [claimedLeads]);

  useEffect(() => {
    // Only store up to 50 preview items in localStorage to prevent 5MB browser quota crashes
    safeLocalStorageSet('1click_uploaded_queue', JSON.stringify(queue.slice(0, 50)));
  }, [queue]);

  useEffect(() => {
    safeLocalStorageSet('1click_drip_config', JSON.stringify(dripConfig));
  }, [dripConfig]);

  useEffect(() => {
    safeLocalStorageSet('1click_domains', JSON.stringify(landingPages));
  }, [landingPages]);

  useEffect(() => {
    safeLocalStorageSet('1click_users', JSON.stringify(users));
    saveUsersToIDB(users);
  }, [users]);

  useEffect(() => {
    safeLocalStorageSet('1click_uploaded_dropped_count', String(droppedCount));
  }, [droppedCount]);

  // Login handler
  const handleLogin = (rawUser: any, role: 'buyer' | 'admin') => {
    const username =
      typeof rawUser === 'object' && rawUser !== null
        ? (rawUser.username || rawUser.name || 'Authorized Closer')
        : String(rawUser || 'Authorized Closer');
    sessionStorage.setItem('1click_authenticated', 'true');
    sessionStorage.setItem('1click_current_user', JSON.stringify(username));
    setCurrentUser(username);
    setIsAuthenticated(true);
    if (role === 'admin') {
      sessionStorage.setItem('1click_admin_authenticated', 'true');
      setIsAdminAuthenticated(true);
      setActiveTab('admin');
    } else {
      setActiveTab('feed');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('1click_authenticated');
    sessionStorage.removeItem('1click_admin_authenticated');
    sessionStorage.removeItem('1click_current_user');

    setIsAuthenticated(false);
    setIsAdminAuthenticated(false);
    setCurrentUser(null);
    setActiveTab('feed');
  };

  const handleLockAdmin = () => {
    sessionStorage.removeItem('1click_admin_authenticated');
    setIsAdminAuthenticated(false);
    setActiveTab('feed');
  };

  const handleTabChange = (targetTab: 'feed' | 'admin') => {
    if (targetTab === 'admin') {
      if (isAdminAuthenticated) {
        setActiveTab('admin');
      } else {
        setIsAdminModalOpen(true);
      }
    } else {
      setActiveTab('feed');
    }
  };

  const handleAdminAuthSuccess = () => {
    sessionStorage.setItem('1click_admin_authenticated', 'true');
    setIsAdminAuthenticated(true);
    setIsAdminModalOpen(false);
    setActiveTab('admin');
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#059669', '#d97706', '#f59e0b', '#10b981'],
    });
  };

  // Helper function to dispatch a single lead from queue to the live stream
  const dispatchNextLead = useCallback(() => {
    // 1. Trigger on server so all sessions receive it immediately
    fetch('/api/leads/drop-next', { method: 'POST' })
      .then((res) => res.json())
      .then((data) => {
        if (data.lead) {
          if (dripConfig.soundEnabled) playLiveLeadChime(dripConfig.soundVolume);
          if (dripConfig.showToasts) setActiveToastLead(data.lead);
        }
      })
      .catch(() => {
        // Fallback local dispatch if server unreachable
        if (queue.length === 0) return;
        setQueue((prevQueue) => {
          if (prevQueue.length === 0) return prevQueue;
          const [nextRaw, ...rest] = prevQueue;
          const newId = `TS-${Math.floor(849000 + Math.random() * 9999)}`;
          const now = new Date();

          const newLead: Lead = {
            ...nextRaw,
            id: newId,
            timestamp: now.toISOString(),
            receivedAgo: 'Just now',
            isNewArrival: true,
            sourceDomain: nextRaw.sourceDomain || getDomainForResort(nextRaw.resortDeveloper),
          };

          if (dripConfig.soundEnabled) playLiveLeadChime(dripConfig.soundVolume);
          if (dripConfig.showToasts) setActiveToastLead(newLead);

          setLeads((prev) => [newLead, ...prev.map((l) => ({ ...l, isNewArrival: false }))]);
          setDroppedCount((c) => c + 1);
          return rest;
        });
      });
  }, [queue.length, dripConfig]);

  // Periodic updater for "receivedAgo" strings
  useEffect(() => {
    const interval = setInterval(() => {
      setLeads((prev) =>
        prev.map((lead) => {
          const diffMs = Date.now() - new Date(lead.timestamp).getTime();
          const diffSec = Math.floor(diffMs / 1000);
          let label = 'Just now';
          if (diffSec < 20) label = 'Just now';
          else if (diffSec < 60) label = `${diffSec}s ago`;
          else if (diffSec < 3600) label = `${Math.floor(diffSec / 60)}m ago`;
          else label = `${Math.floor(diffSec / 3600)}h ago`;

          return { ...lead, receivedAgo: label };
        })
      );
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Update lead status across both database and claimed leads
  const handleUpdateStatus = (leadId: string, newStatus: Lead['status']) => {
    if (newStatus === 'EXIT_SIGNED') {
      confetti({
        particleCount: 85,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#d97706', '#fbbf24', '#047857', '#10b981'],
      });
    }

    // If changing a live database lead to CLAIMED, claim it!
    const targetLive = leads.find((l) => l.id === leadId);
    if (targetLive && newStatus === 'CLAIMED') {
      handleClaimLead(targetLive);
      return;
    }

    // Call server to persist status across all tabs
    fetch('/api/leads/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId, status: newStatus, username: currentUser }),
    }).catch(() => {});

    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)));
    updateClaimedLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)));

    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  // Claim lead: removes from active database and adds to private claimed vault
  const handleClaimLead = (lead: Lead) => {
    const closerName =
      typeof currentUser === 'object' && currentUser !== null
        ? ((currentUser as any).username || (currentUser as any).name || 'Current Closer')
        : (currentUser || 'Current Closer');
    const now = new Date().toISOString();
    const claimedLead: Lead = {
      ...lead,
      status: 'CLAIMED',
      claimedBy: closerName,
      claimedAt: now,
      notes: lead.notes || `Claimed on ${new Date().toLocaleDateString()}`,
    };

    // Optimistic UI updates
    setLeads((prev) => prev.filter((l) => l.id !== lead.id));
    updateClaimedLeads((prev) => [claimedLead, ...prev.filter((l) => l.id !== lead.id)]);

    confetti({
      particleCount: 75,
      spread: 65,
      origin: { y: 0.6 },
      colors: ['#047857', '#10b981', '#f59e0b', '#fbbf24'],
    });

    if (selectedLead && selectedLead.id === lead.id) {
      setSelectedLead(claimedLead);
    }

    // Persist claim on server so lead is removed from the database for ALL other sessions!
    fetch('/api/leads/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId: lead.id, claimedBy: closerName }),
    }).catch(() => {});
  };

  // Bulk claim multiple leads: removes all from database and adds to claimed vault
  const handleClaimMultipleLeads = (leadIds: string[]) => {
    const idSet = new Set(leadIds);
    const leadsToClaim = leads.filter((l) => idSet.has(l.id));
    if (leadsToClaim.length === 0) return;

    const closerName =
      typeof currentUser === 'object' && currentUser !== null
        ? ((currentUser as any).username || (currentUser as any).name || 'Current Closer')
        : (currentUser || 'Current Closer');
    const now = new Date().toISOString();
    const newClaimed: Lead[] = leadsToClaim.map((l) => ({
      ...l,
      status: 'CLAIMED',
      claimedBy: closerName,
      claimedAt: now,
      notes: l.notes || `Claimed in bulk on ${new Date().toLocaleDateString()}`,
    }));

    setLeads((prev) => prev.filter((l) => !idSet.has(l.id)));
    updateClaimedLeads((prev) => [...newClaimed, ...prev.filter((l) => !idSet.has(l.id))]);

    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.6 },
      colors: ['#047857', '#10b981', '#f59e0b', '#fbbf24'],
    });

    // Call server to claim on backend
    fetch('/api/leads/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadIds, claimedBy: closerName }),
    }).catch(() => {});
  };

  // Release a lead back to the live database pool
  const handleReleaseLeadBackToDatabase = (leadId: string) => {
    const target = claimedLeads.find((l: Lead) => l.id === leadId);
    if (!target) return;

    updateClaimedLeads((prev) => prev.filter((l) => l.id !== leadId));

    const restored: Lead = {
      ...target,
      status: 'NEW',
      claimedBy: undefined,
      claimedAt: undefined,
    };

    setLeads((prev) => [restored, ...prev]);

    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead(restored);
    }

    fetch('/api/leads/release', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId }),
    }).catch(() => {});
  };

  // Clear claimed leads: clears specific IDs or all claimed leads for the current user
  const handleClearClaimedLeads = (leadIds?: string[]) => {
    const userKey =
      typeof currentUser === 'object' && currentUser !== null
        ? ((currentUser as any).username || (currentUser as any).name || 'Current Closer')
        : (currentUser || 'Current Closer');

    const idsToDelete = leadIds && leadIds.length > 0 ? new Set(leadIds) : null;
    const currentList = claimedLeadsMap[userKey] || [];
    const idsToRecord = idsToDelete ? Array.from(idsToDelete) : currentList.map((l) => l.id);

    addDeletedClaimedIds(idsToRecord);

    updateClaimedLeads((prev) => {
      if (idsToDelete) {
        return prev.filter((l) => !idsToDelete.has(l.id));
      }
      return [];
    });

    if (selectedLead && (idsToDelete ? idsToDelete.has(selectedLead.id) : true)) {
      setSelectedLead(null);
    }

    fetch('/api/leads/clear-claimed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leadIds: idsToDelete ? Array.from(idsToDelete) : undefined,
        username: userKey,
      }),
    }).catch(() => {});
  };

  // Delete/archive single claimed lead
  const handleDeleteClaimedLead = (leadId: string) => {
    handleClearClaimedLeads([leadId]);
  };

  // Export claimed leads directly from Navbar
  const handleExportClaimedFromNavbar = () => {
    if (claimedLeads.length === 0) {
      setShowExportRestrictedModal(true);
      return;
    }
    exportLeadsToExcel(claimedLeads, '1ClickLeads_Claimed_Timeshare_List');
  };

  // Add parsed spreadsheet leads to queue with master queue infinite looping support
  const handleAddToQueue = (
    newLeads: Omit<Lead, 'id' | 'timestamp' | 'receivedAgo' | 'isNewArrival'>[],
    fullMasterQueue?: Omit<Lead, 'id' | 'timestamp' | 'receivedAgo' | 'isNewArrival'>[]
  ) => {
    // Keep 100% of all uploaded leads directly in the queue and master queue
    const queueList = [...newLeads];
    const masterList = fullMasterQueue && fullMasterQueue.length > 0 ? [...fullMasterQueue] : queueList;
    saveMasterQueueToIDB(masterList);

    setQueue(queueList.slice(0, 50));
    setQueueCount(queueList.length);
    setMasterQueueCount(masterList.length);

    fetch('/api/leads/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        queue: queueList,
        masterQueue: masterList,
        replace: true,
      }),
    })
      .then(() => syncWithServer())
      .catch((err) => {
        console.error('Failed to upload leads to server:', err);
      });
  };

  // Reshuffle queue order randomly
  const handleShuffleQueue = () => {
    fetch('/api/leads/shuffle-queue', { method: 'POST' })
      .then((res) => res.json())
      .then(() => syncWithServer())
      .catch(() => {});
  };

  const handleClearQueue = () => {
    setQueue([]);
    setQueueCount(0);
    setMasterQueueCount(0);
    fetch('/api/leads/clear-queue', { method: 'POST' }).catch(() => {});
  };

  const handleClearAllLists = async () => {
    setQueue([]);
    setQueueCount(0);
    setMasterQueueCount(0);
    setLeads([]);
    setSelectedLead(null);
    safeLocalStorageSet('1click_uploaded_leads', JSON.stringify([]));
    safeLocalStorageSet('1click_uploaded_queue', JSON.stringify([]));
    safeLocalStorageSet('1click_master_queue', JSON.stringify([]));
    clearMasterQueueFromIDB().catch(() => {});
    try {
      await fetch('/api/leads/clear-all-lists', { method: 'POST' });
    } catch (e) {
      console.error('Failed to clear all lists:', e);
    }
  };

  // Clear all leads from the live dispatch feed
  const handleClearFeed = async () => {
    setLeads([]);
    setSelectedLead(null);
    safeLocalStorageSet('1click_uploaded_leads', JSON.stringify([]));
    try {
      await fetch('/api/leads/clear-feed', { method: 'POST' });
    } catch (e) {
      console.error('Failed to clear feed:', e);
    }
  };

  const handleImportDirectlyToFeed = (newLeads: Lead[]) => {
    setLeads((prev) => [...newLeads, ...prev]);
    setDroppedCount((c) => c + newLeads.length);

    fetch('/api/leads/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leads: newLeads, toFeed: true }),
    }).catch(() => {});
  };

  const handleUploadSpreadsheetComplete = (
    initialFeedLeads: Lead[],
    restQueue: Omit<Lead, 'id' | 'timestamp' | 'receivedAgo' | 'isNewArrival'>[],
    masterQueue: Omit<Lead, 'id' | 'timestamp' | 'receivedAgo' | 'isNewArrival'>[]
  ) => {
    setLeads(initialFeedLeads);
    setQueue(restQueue.slice(0, 50));
    setQueueCount(restQueue.length);
    setMasterQueueCount(masterQueue.length);
    setDroppedCount(initialFeedLeads.length);
    saveMasterQueueToIDB(masterQueue);
    safeLocalStorageSet('1click_uploaded_leads', JSON.stringify(initialFeedLeads));
    safeLocalStorageSet('1click_uploaded_queue', JSON.stringify(restQueue.slice(0, 100)));
    safeLocalStorageSet('1click_master_queue', JSON.stringify(masterQueue.slice(0, 100)));
    syncWithServer();
  };

  const handleAddDomain = (newDomain: LandingPageSite) => {
    setLandingPages((prev) => [newDomain, ...prev]);
  };

  // User Access Handlers
  const handleAddUser = async (newUserData: {
    username: string;
    password: string;
    role: 'buyer' | 'admin';
    name?: string;
    notes?: string;
  }): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserData),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (Array.isArray(data.users)) {
          setUsers(data.users);
          safeLocalStorageSet('1click_users', JSON.stringify(data.users));
        } else if (data.user) {
          setUsers((prev) => {
            const next = [data.user, ...prev.filter((u) => u.username.toLowerCase() !== data.user.username.toLowerCase())];
            safeLocalStorageSet('1click_users', JSON.stringify(next));
            return next;
          });
        }
        return { success: true };
      }
      return { success: false, message: data.message || 'Failed to add user' };
    } catch {
      // Local fallback
      const localNewUser: AppUser = {
        id: `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        username: newUserData.username.trim(),
        password: newUserData.password.trim(),
        role: newUserData.role,
        name: newUserData.name?.trim() || newUserData.username.trim(),
        status: 'active',
        createdAt: new Date().toISOString(),
        notes: newUserData.notes?.trim(),
      };
      setUsers((prev) => {
        const next = [localNewUser, ...prev.filter((u) => u.username.toLowerCase() !== localNewUser.username.toLowerCase())];
        safeLocalStorageSet('1click_users', JSON.stringify(next));
        return next;
      });
      return { success: true };
    }
  };

  const handleUpdateUser = async (
    id: string,
    updates: Partial<AppUser>
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (Array.isArray(data.users)) {
          setUsers(data.users);
          safeLocalStorageSet('1click_users', JSON.stringify(data.users));
        } else if (data.user) {
          setUsers((prev) => {
            const next = prev.map((u) => (u.id === id ? data.user : u));
            safeLocalStorageSet('1click_users', JSON.stringify(next));
            return next;
          });
        }
        return { success: true };
      }
      return { success: false, message: data.message || 'Failed to update user' };
    } catch {
      setUsers((prev) => {
        const next = prev.map((u) => (u.id === id ? { ...u, ...updates } : u));
        safeLocalStorageSet('1click_users', JSON.stringify(next));
        return next;
      });
      return { success: true };
    }
  };

  const handleDeleteUser = async (id: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (Array.isArray(data.users)) {
          setUsers(data.users);
          safeLocalStorageSet('1click_users', JSON.stringify(data.users));
        } else {
          setUsers((prev) => {
            const next = prev.filter((u) => u.id !== id);
            safeLocalStorageSet('1click_users', JSON.stringify(next));
            return next;
          });
        }
        return { success: true };
      }
      return { success: false, message: data.message || 'Failed to delete user' };
    } catch {
      setUsers((prev) => {
        const next = prev.filter((u) => u.id !== id);
        safeLocalStorageSet('1click_users', JSON.stringify(next));
        return next;
      });
      return { success: true };
    }
  };

  // If not logged in, render the login page first!
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLogin} />;
  }

  const newLeadsCount = leads.filter((l) => l.status === 'NEW').length;

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col font-['Plus_Jakarta_Sans'] selection:bg-emerald-100 selection:text-emerald-900">
      {/* Executive Navbar */}
      <Navbar
        currentTab={activeTab}
        onTabChange={handleTabChange}
        isAdminAuthenticated={isAdminAuthenticated}
        onOpenAdminLogin={() => setIsAdminModalOpen(true)}
        onLockAdmin={handleLockAdmin}
        soundEnabled={dripConfig.soundEnabled}
        onToggleSound={() => {
          const nextVal = !dripConfig.soundEnabled;
          setDripConfig((c) => ({ ...c, soundEnabled: nextVal }));
          fetch('/api/drip/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ soundEnabled: nextVal }),
          }).catch(() => {});
        }}
        onLogout={handleLogout}
        totalLeadsCount={leads.length}
        newLeadsCount={newLeadsCount}
        leads={leads}
        claimedLeadsCount={claimedLeads.length}
        onExportClaimed={handleExportClaimedFromNavbar}
        queueCount={queueCount || queue.length}
        isDripActive={dripConfig.isEnabled && (queueCount > 0 || queue.length > 0)}
        domainsCount={landingPages.length}
      />

      {/* Main Content Area on Pure White Background */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'feed' ? (
          <LeadsDashboard
            leads={leads}
            claimedLeads={claimedLeads}
            landingPages={landingPages}
            onSelectLead={(lead) => setSelectedLead(lead)}
            onClaimLead={handleClaimLead}
            onClaimMultipleLeads={handleClaimMultipleLeads}
            onReleaseLead={handleReleaseLeadBackToDatabase}
            onDeleteClaimedLead={handleDeleteClaimedLead}
            onClearClaimedLeads={handleClearClaimedLeads}
            onUpdateStatus={handleUpdateStatus}
            onInstantDrop={dispatchNextLead}
            onOpenAdmin={() => handleTabChange('admin')}
            currentUser={currentUser}
          />
        ) : (
          <AdminSpreadsheetPanel
            queue={queue}
            queueCount={queueCount}
            masterQueueCount={masterQueueCount}
            onAddToQueue={handleAddToQueue}
            onUploadSpreadsheetComplete={handleUploadSpreadsheetComplete}
            onClearQueue={handleClearQueue}
            onShuffleQueue={handleShuffleQueue}
            onTriggerInstantDrop={dispatchNextLead}
            dripConfig={dripConfig}
            onUpdateDripConfig={(partial) => {
              setDripConfig((c) => ({ ...c, ...partial }));
              fetch('/api/drip/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(partial),
              }).catch(() => {});
            }}
            domains={landingPages}
            onAddDomain={handleAddDomain}
            droppedCount={droppedCount}
            onImportDirectlyToFeed={handleImportDirectlyToFeed}
            onSwitchToFeed={() => setActiveTab('feed')}
            onLockAdmin={handleLockAdmin}
            liveLeadsCount={leads.length}
            onClearFeed={handleClearFeed}
            onClearAllLists={handleClearAllLists}
            users={users}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
          />
        )}
      </main>

      {/* Admin Login Modal (Password-protected with salesleads777@gmail.com / Mafioso2356$) */}
      <AdminLoginModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onSuccess={handleAdminAuthSuccess}
      />

      {/* Live Animated Incoming Notification Toast Banner */}
      <LiveNotificationToast
        lead={activeToastLead}
        onDismiss={() => setActiveToastLead(null)}
        onViewLead={(lead) => {
          setSelectedLead(lead);
          setActiveToastLead(null);
        }}
        onClaimLead={(lead) => {
          handleClaimLead(lead);
          setActiveToastLead(null);
        }}
      />

      {/* Full Lead Dossier & Closer Script Modal */}
      <LeadDetailModal
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onUpdateStatus={handleUpdateStatus}
        onClaimLead={handleClaimLead}
        onDeleteClaimedLead={handleDeleteClaimedLead}
      />

      {/* Modal: Export Restricted to Claimed Leads */}
      {showExportRestrictedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full border-2 border-amber-300 shadow-2xl p-6 relative">
            <button
              onClick={() => setShowExportRestrictedModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Export Restricted to Claimed Leads
                </h3>
                <p className="text-xs text-amber-800 font-semibold">
                  Rule Enforcement: Claim First to Export
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-5">
              To prevent duplicate contact and preserve lead assignment integrity, you can only export leads that you have claimed. Claimed leads are automatically removed from the live database pool and reserved exclusively in your vault.
            </p>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-950 mb-5 flex items-start gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <span>
                Click the <strong>Claim</strong> button on any lead in the table, or use checkboxes to select multiple leads and click <strong>Claim & Remove</strong>.
              </span>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowExportRestrictedModal(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>Understood — Go to Live Leads</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer in crisp executive styling */}
      <footer className="border-t border-amber-200/50 bg-white py-6 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-emerald-950">1ClickLeads Enterprise</span>
            <span>•</span>
            <span className="text-amber-800 font-medium">Real-Time Timeshare Exit Lead Infrastructure</span>
          </div>
          <div className="flex items-center gap-3 text-slate-600 font-semibold">
            <span>
              Session:{' '}
              <code className="text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                {isAdminAuthenticated && activeTab === 'admin' ? 'Administrator' : 'Authorized Closer'}
              </code>
            </span>
            <span>•</span>
            <span>Only Claimed Leads Exportable to Excel</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
