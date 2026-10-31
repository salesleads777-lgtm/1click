import React, { useState, useMemo } from 'react';
import { Lead, LandingPageSite } from '../types/lead';
import { LANDING_PAGE_DOMAINS } from '../data/landingPages';
import {
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  Globe,
  DollarSign,
  Phone,
  Copy,
  Check,
  Building,
  Sparkles,
  ArrowUpDown,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Layers,
  Zap,
  Radio,
  Lock,
  Unlock,
  CheckCircle2,
  RotateCcw,
  Trash2,
  X,
  AlertCircle,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { exportLeadsToExcel, exportLeadsToCSV } from '../utils/export';

interface LeadsDashboardProps {
  leads: Lead[];
  claimedLeads?: Lead[];
  landingPages?: LandingPageSite[];
  onSelectLead: (lead: Lead) => void;
  onClaimLead: (lead: Lead) => void;
  onClaimMultipleLeads?: (leadIds: string[]) => void;
  onReleaseLead?: (leadId: string) => void;
  onDeleteClaimedLead?: (leadId: string) => void;
  onClearClaimedLeads?: (leadIds?: string[]) => void;
  onUpdateStatus: (leadId: string, status: Lead['status'], username?: string) => void;
  onInstantDrop: () => void;
  onOpenAdmin?: () => void;
  currentUser: string | null;
}

export const LeadsDashboard: React.FC<LeadsDashboardProps> = ({
  leads,
  claimedLeads = [],
  landingPages,
  onSelectLead,
  onClaimLead,
  onClaimMultipleLeads,
  onReleaseLead,
  onDeleteClaimedLead,
  onClearClaimedLeads,
  onUpdateStatus,
  onInstantDrop,
  onOpenAdmin,
  currentUser,
}) => {
  const filteredClaimed = useMemo(() => {
    return claimedLeads;
  }, [claimedLeads]);
  
  // Use filteredClaimed directly for display and export counts
  const exportableLeadsCount = filteredClaimed.length;
  
  // Replace references to claimedLeads with filteredClaimed in render...
  // View mode: 'database' (available live leads pool) vs 'claimed' (user's claimed leads vault)
  const [viewMode, setViewMode] = useState<'database' | 'claimed'>('database');

  // Multi-select state
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [selectedClaimedIds, setSelectedClaimedIds] = useState<Set<string>>(new Set());

  // Filter states for live database
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeveloper, setSelectedDeveloper] = useState<string>('ALL');
  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Filter states for claimed vault
  const [claimedSearchQuery, setClaimedSearchQuery] = useState('');
  const [claimedSelectedStatus, setClaimedSelectedStatus] = useState<string>('ALL');

  // Copy & modal state
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Post-export clear prompt state: allows users to clear claimed leads immediately after export
  const [postExportPrompt, setPostExportPrompt] = useState<{
    isOpen: boolean;
    leadIds: string[];
    count: number;
    title: string;
  } | null>(null);

  // Clear confirmation modal state for manual vault clearing
  const [clearConfirmModal, setClearConfirmModal] = useState<{
    isOpen: boolean;
    mode: 'all' | 'selected' | 'single';
    leadIds?: string[];
    leadName?: string;
    count: number;
  } | null>(null);

  const showNotification = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Over 100 connected landing page funnels
  const allLandingPages = useMemo(() => {
    if (landingPages && landingPages.length >= 100) {
      return landingPages;
    }
    return LANDING_PAGE_DOMAINS;
  }, [landingPages]);

  const totalSourceCount = allLandingPages.length; // 101+ active sites

  // Distinct developers for live leads filter
  const developerList = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => set.add(l.resortDeveloper));
    return Array.from(set).sort();
  }, [leads]);

  // Lead count per domain in current live database
  const domainLeadCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach((l) => {
      if (l.sourceDomain) {
        counts[l.sourceDomain] = (counts[l.sourceDomain] || 0) + 1;
      }
    });
    return counts;
  }, [leads]);

  // Distinct landing page domains list (includes all 101+ landing page sites)
  const domainList = useMemo(() => {
    const set = new Set<string>();
    allLandingPages.forEach((lp) => set.add(lp.domain));
    leads.forEach((l) => {
      if (l.sourceDomain) set.add(l.sourceDomain);
    });
    return Array.from(set).sort();
  }, [allLandingPages, leads]);

  // Filtered live database leads strictly deduplicated so identical leads never appear together
  const filteredLeads = useMemo(() => {
    const seen = new Set<string>();
    return leads.filter((l) => {
      // Deduplication check
      const phone = (l.phone || '').replace(/\D/g, '');
      const email = (l.email || '').trim().toLowerCase();
      const name = (l.fullName || `${l.firstName || ''} ${l.lastName || ''}`).trim().toLowerCase();
      const dedupeKey = `key:${name.slice(0, 10)}:${phone.slice(-10)}:${email.slice(0, 10)}`;
      if (seen.has(dedupeKey)) return false;
      seen.add(dedupeKey);

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          l.fullName.toLowerCase().includes(q) ||
          l.phone.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          l.city.toLowerCase().includes(q) ||
          l.state.toLowerCase().includes(q) ||
          l.resortDeveloper.toLowerCase().includes(q) ||
          l.sourceDomain.toLowerCase().includes(q);
        if (!match) return false;
      }

      if (selectedDeveloper !== 'ALL' && l.resortDeveloper !== selectedDeveloper) {
        return false;
      }

      if (selectedDomain !== 'ALL' && l.sourceDomain !== selectedDomain) {
        return false;
      }

      if (selectedUrgency !== 'ALL' && l.urgency !== selectedUrgency) {
        return false;
      }

      if (selectedStatus !== 'ALL' && l.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [leads, searchQuery, selectedDeveloper, selectedDomain, selectedUrgency, selectedStatus]);

  // Filtered claimed leads
  const filteredClaimedLeads = useMemo(() => {
    return claimedLeads.filter((l) => {
      if (claimedSearchQuery.trim()) {
        const q = claimedSearchQuery.toLowerCase();
        const match =
          l.fullName.toLowerCase().includes(q) ||
          l.phone.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          l.city.toLowerCase().includes(q) ||
          l.state.toLowerCase().includes(q) ||
          l.resortDeveloper.toLowerCase().includes(q) ||
          l.sourceDomain.toLowerCase().includes(q);
        if (!match) return false;
      }

      if (claimedSelectedStatus !== 'ALL' && l.status !== claimedSelectedStatus) {
        return false;
      }

      return true;
    });
  }, [claimedLeads, claimedSearchQuery, claimedSelectedStatus]);

  // High-level portfolio metrics (combining live pool and claimed vault)
  const totalLeadsCombined = leads.length + claimedLeads.length;
  const totalMaintenanceFee = useMemo(
    () => [...leads, ...claimedLeads].reduce((acc, l) => acc + l.annualMaintenanceFee, 0),
    [leads, claimedLeads]
  );
  const avgMaintenanceFee = useMemo(
    () => (totalLeadsCombined > 0 ? Math.round(totalMaintenanceFee / totalLeadsCombined) : 0),
    [totalLeadsCombined, totalMaintenanceFee]
  );
  const totalMortgageDebt = useMemo(
    () => [...leads, ...claimedLeads].reduce((acc, l) => acc + l.mortgageBalance, 0),
    [leads, claimedLeads]
  );
  const newCount = useMemo(
    () => leads.filter((l) => l.status === 'NEW').length,
    [leads]
  );

  const handleCopyQuick = (e: React.MouseEvent, lead: Lead) => {
    e.stopPropagation();
    const clip = `${lead.fullName} | ${lead.phone} | ${lead.email} | ${lead.resortDeveloper} ($${lead.annualMaintenanceFee}/yr) | Source: ${lead.sourceDomain}`;
    navigator.clipboard.writeText(clip);
    setCopiedId(lead.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Toggle selection for live leads
  const handleToggleSelectLead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedLeadIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllLiveLeads = () => {
    if (selectedLeadIds.size === filteredLeads.length) {
      setSelectedLeadIds(new Set());
    } else {
      setSelectedLeadIds(new Set(filteredLeads.map((l) => l.id)));
    }
  };

  // Bulk Claim handler
  const handleBulkClaim = () => {
    if (selectedLeadIds.size === 0) return;
    const ids = Array.from(selectedLeadIds);
    if (onClaimMultipleLeads) {
      onClaimMultipleLeads(ids);
    } else {
      ids.forEach((id) => {
        const target = leads.find((l) => l.id === id);
        if (target) onClaimLead(target);
      });
    }
    showNotification(`✓ ${ids.length} Leads Claimed! Removed from database and transferred to your Claimed Vault.`);
    setSelectedLeadIds(new Set());
    setViewMode('claimed');
  };

  // Toggle selection for claimed leads
  const handleToggleSelectClaimed = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedClaimedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllClaimed = () => {
    if (selectedClaimedIds.size === filteredClaimedLeads.length) {
      setSelectedClaimedIds(new Set());
    } else {
      setSelectedClaimedIds(new Set(filteredClaimedLeads.map((l) => l.id)));
    }
  };

  // Execution handler for clearing leads from vault
  const executeClearLeads = (leadIds?: string[]) => {
    if (leadIds && leadIds.length > 0) {
      if (onClearClaimedLeads) {
        onClearClaimedLeads(leadIds);
      } else if (onDeleteClaimedLead) {
        leadIds.forEach((id) => onDeleteClaimedLead(id));
      }
      setSelectedClaimedIds((prev) => {
        const next = new Set(prev);
        leadIds.forEach((id) => next.delete(id));
        return next;
      });
      showNotification(`✓ Cleared ${leadIds.length} lead${leadIds.length > 1 ? 's' : ''} from your Claimed Vault.`);
    } else {
      if (onClearClaimedLeads) {
        onClearClaimedLeads();
      } else if (onDeleteClaimedLead) {
        filteredClaimed.forEach((l) => onDeleteClaimedLead(l.id));
      }
      setSelectedClaimedIds(new Set());
      showNotification('✓ Cleared all leads from your Claimed Vault.');
    }
  };

  // Export handlers (strictly claimed leads) with post-export clear option
  const handleExportClaimedToExcel = () => {
    if (exportableLeadsCount === 0) {
      setShowExportModal(true);
      return;
    }
    const leadsToExport = [...filteredClaimed];
    exportLeadsToExcel(leadsToExport, '1ClickLeads_Claimed_Timeshare_List');
    showNotification(`✓ Downloaded Excel (.xlsx) for ${leadsToExport.length} claimed leads!`);

    // Prompt user to clear claimed leads after export
    setPostExportPrompt({
      isOpen: true,
      leadIds: leadsToExport.map((l) => l.id),
      count: leadsToExport.length,
      title: `All ${leadsToExport.length} Exported Claimed Leads`,
    });
  };

  const handleExportClaimedToCSV = () => {
    if (exportableLeadsCount === 0) {
      setShowExportModal(true);
      return;
    }
    const leadsToExport = [...filteredClaimed];
    exportLeadsToCSV(leadsToExport, '1ClickLeads_Claimed_Tagged');
    showNotification(`✓ Downloaded CSV for ${leadsToExport.length} claimed leads!`);

    // Prompt user to clear claimed leads after export
    setPostExportPrompt({
      isOpen: true,
      leadIds: leadsToExport.map((l) => l.id),
      count: leadsToExport.length,
      title: `All ${leadsToExport.length} Exported Claimed Leads`,
    });
  };

  const handleExportSelectedClaimed = () => {
    const selected = claimedLeads.filter((l) => selectedClaimedIds.has(l.id));
    if (selected.length === 0) return;
    exportLeadsToExcel(selected, `1ClickLeads_Selected_${selected.length}_Claimed`);
    showNotification(`✓ Downloaded Excel for ${selected.length} selected claimed leads!`);

    // Prompt user to clear the selected exported leads after export
    setPostExportPrompt({
      isOpen: true,
      leadIds: selected.map((l) => l.id),
      count: selected.length,
      title: `${selected.length} Selected Exported Lead${selected.length > 1 ? 's' : ''}`,
    });
  };

  const handleExportSingleClaimed = (lead: Lead) => {
    exportLeadsToExcel([lead], `1ClickLeads_${lead.id}_Claimed`);
    showNotification(`✓ Exported ${lead.fullName} to Excel!`);

    // Prompt user to clear this single lead after export
    setPostExportPrompt({
      isOpen: true,
      leadIds: [lead.id],
      count: 1,
      title: lead.fullName,
    });
  };

  const handleBulkReleaseSelected = () => {
    if (!onReleaseLead || selectedClaimedIds.size === 0) return;
    const count = selectedClaimedIds.size;
    selectedClaimedIds.forEach((id) => onReleaseLead(id));
    setSelectedClaimedIds(new Set());
    showNotification(`✓ ${count} Leads returned to live database pool.`);
  };

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans']">
      {/* Toast Notice Banner */}
      {actionNotice && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-900 text-white px-5 py-3 rounded-2xl shadow-xl border-2 border-amber-300 font-extrabold text-xs flex items-center gap-2 animate-bounce-short">
          <CheckCircle2 className="w-4 h-4 text-amber-300" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Top Real-Time KPI Cards (White background, Green & Real Gold typography) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-2xl border-2 border-emerald-100 shadow-sm relative overflow-hidden group hover:border-amber-400 transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-emerald-500/10 to-transparent pointer-events-none" />
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1">
            <span>Database Lead Pool</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <div className="text-3xl font-black text-emerald-950 mt-1 flex items-baseline gap-2">
            <span>{leads.length}</span>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-300">
              {claimedLeads.length} Claimed
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>Streaming from 100+ exit landing pages</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-2xl border-2 border-emerald-100 shadow-sm relative overflow-hidden group hover:border-amber-400 transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-amber-400/15 to-transparent pointer-events-none" />
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1">
            Avg Annual Maint. Fee
          </div>
          <div className="text-3xl font-black bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 bg-clip-text text-transparent mt-1">
            ${(Number(avgMaintenanceFee) || 0).toLocaleString()}
            <span className="text-xs font-bold text-slate-400 font-sans ml-1">/yr</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2 font-medium">
            High pain point = High closing rate
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-2xl border-2 border-emerald-100 shadow-sm relative overflow-hidden group hover:border-amber-400 transition-all">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1">
            Total Debt Cancel Volume
          </div>
          <div className="text-3xl font-black text-slate-900 mt-1">
            ${(Number(totalMortgageDebt + totalMaintenanceFee * 5) || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-2 font-medium">
            Mortgage + 5-yr projected fee bleed
          </div>
        </div>

        {/* Metric 4: Verified Landing Page Sources */}
        <div className="bg-white p-5 rounded-2xl border-2 border-amber-300 shadow-sm relative overflow-hidden bg-gradient-to-br from-white via-white to-amber-50/50">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-950 mb-1 flex items-center justify-between">
            <span>Landing Page Sources</span>
            <Globe className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-3xl font-black text-emerald-900 mt-1 flex items-baseline gap-2">
            <span>{totalSourceCount} Active</span>
            <span className="text-xs font-black text-amber-700 bg-amber-100/90 px-1.5 py-0.5 rounded font-mono">
              100+ Sites
            </span>
          </div>
          <div className="text-[11px] text-amber-800 font-bold mt-2 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Over 100 Connected Funnels</span>
            </span>
            <span className="text-[10px] text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded font-mono font-bold">
              100% Tagged
            </span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-2xl border-2 border-emerald-100 shadow-sm p-5 sm:p-6 space-y-5">
        {/* VIEW MODE TABS: Live Database Pool vs My Claimed Leads Vault */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-1.5 rounded-2xl bg-slate-100/90 border border-slate-200">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('database')}
              className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer hover:scale-105 ${
                viewMode === 'database'
                  ? 'bg-gradient-to-r from-emerald-800 to-emerald-700 text-white shadow-md border border-amber-400/50'
                  : 'text-slate-600 hover:text-emerald-950 hover:bg-white/80'
              }`}
            >
              <Radio className="w-4 h-4 text-amber-400" />
              <span>Live Leads Database</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950 text-amber-300 font-bold">
                {leads.length} Available
              </span>
            </button>

            <button
              onClick={() => setViewMode('claimed')}
              className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer hover:scale-105 ${
                viewMode === 'claimed'
                  ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 shadow-md border border-amber-500 font-black'
                  : 'text-slate-600 hover:text-emerald-950 hover:bg-white/80'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-900" />
              <span>My Claimed Leads Vault</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  viewMode === 'claimed' ? 'bg-slate-950 text-amber-300' : 'bg-amber-100 text-amber-900'
                }`}
              >
                {claimedLeads.length} Claimed
              </span>
            </button>
          </div>

          <div className="text-[11px] font-semibold text-slate-600 px-3 hidden lg:flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-amber-600" />
            <span>Excel export unlocked exclusively for your claimed leads.</span>
          </div>
        </div>

        {/* Action Header: Search & Downloads */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-700">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder={
                viewMode === 'database'
                  ? 'Search live database by name, phone, resort, city, domain...'
                  : 'Search claimed vault by name, phone, resort...'
              }
              value={viewMode === 'database' ? searchQuery : claimedSearchQuery}
              onChange={(e) =>
                viewMode === 'database'
                  ? setSearchQuery(e.target.value)
                  : setClaimedSearchQuery(e.target.value)
              }
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/70 focus:bg-white border-2 border-slate-200 focus:border-amber-500 text-slate-900 text-xs font-medium focus:outline-none transition-all"
            />
            {(viewMode === 'database' ? searchQuery : claimedSearchQuery) && (
              <button
                onClick={() =>
                  viewMode === 'database' ? setSearchQuery('') : setClaimedSearchQuery('')
                }
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Export Buttons: Explicitly only exports Claimed Leads */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportClaimedToExcel}
              title={
                exportableLeadsCount > 0
                  ? `Download Excel (.XLSX) for ${exportableLeadsCount} claimed leads with source domains tagged`
                  : 'Only claimed leads can be exported to Excel. Claim leads from the live database first.'
              }
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer ${
                exportableLeadsCount > 0
                  ? 'bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-900 hover:from-emerald-700 hover:to-emerald-800 text-white border border-amber-300'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300'
              }`}
            >
              <FileSpreadsheet
                className={`w-4 h-4 ${exportableLeadsCount > 0 ? 'text-amber-300' : 'text-slate-400'}`}
              />
              <span>Download Excel (.XLSX) — Claimed Leads ({exportableLeadsCount})</span>
            </button>

            <button
              onClick={handleExportClaimedToCSV}
              title={
                exportableLeadsCount > 0
                  ? `Download CSV for ${exportableLeadsCount} claimed leads`
                  : 'Only claimed leads can be exported. Claim leads first to export.'
              }
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-amber-50 text-emerald-950 font-bold text-xs border border-amber-300 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-amber-600" />
              <span>Download CSV ({filteredClaimed.length})</span>
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* VIEW 1: LIVE LEADS DATABASE (Unassigned leads pool) */}
        {/* ============================================================== */}
        {viewMode === 'database' && (
          <div className="space-y-4">
            {/* Filter Toolbar */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-950 font-bold uppercase tracking-wider text-[11px]">
                <Filter className="w-3.5 h-3.5 text-amber-600" />
                <span>Filter By:</span>
              </div>

              {/* Resort Developer Filter */}
              <select
                value={selectedDeveloper}
                onChange={(e) => setSelectedDeveloper(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-800 hover:border-amber-400 focus:outline-none text-xs cursor-pointer"
              >
                <option value="ALL">All Developers ({leads.length})</option>
                {developerList.map((dev) => (
                  <option key={dev} value={dev}>
                    {dev}
                  </option>
                ))}
              </select>

              {/* Landing Page Source Domain Filter */}
              <select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50/50 font-bold text-emerald-950 hover:border-amber-500 focus:outline-none text-xs cursor-pointer max-w-xs truncate"
              >
                <option value="ALL">All Connected Sources ({totalSourceCount} Active Sites)</option>
                {domainList.map((dom) => {
                  const count = domainLeadCounts[dom];
                  return (
                    <option key={dom} value={dom}>
                      {dom} {count ? `(${count} in feed)` : ''}
                    </option>
                  );
                })}
              </select>

              {/* Urgency Filter */}
              <select
                value={selectedUrgency}
                onChange={(e) => setSelectedUrgency(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-800 hover:border-amber-400 focus:outline-none text-xs cursor-pointer"
              >
                <option value="ALL">All Urgencies</option>
                <option value="CRITICAL">Critical Urgency</option>
                <option value="HIGH">High Urgency</option>
                <option value="MEDIUM">Medium Urgency</option>
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-800 hover:border-amber-400 focus:outline-none text-xs cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="NEW">New Leads Only</option>
                <option value="CONTACTED">Contacted</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="EXIT_SIGNED">Exit Retainer Signed</option>
              </select>

              {/* Reset Filters */}
              {(selectedDeveloper !== 'ALL' ||
                selectedDomain !== 'ALL' ||
                selectedUrgency !== 'ALL' ||
                selectedStatus !== 'ALL' ||
                searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedDeveloper('ALL');
                    setSelectedDomain('ALL');
                    setSelectedUrgency('ALL');
                    setSelectedStatus('ALL');
                    setSearchQuery('');
                  }}
                  className="text-xs font-bold text-amber-700 hover:underline cursor-pointer"
                >
                  Reset Filters
                </button>
              )}

              <div className="ml-auto text-xs font-semibold text-slate-500">
                Showing <span className="font-bold text-emerald-900">{filteredLeads.length}</span> of {leads.length} live leads in database
              </div>
            </div>

            {/* Bulk Claim Selection Action Bar */}
            {selectedLeadIds.size > 0 && (
              <div className="p-3 bg-gradient-to-r from-amber-50 via-yellow-50 to-emerald-50 rounded-xl border-2 border-amber-400 flex flex-wrap items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-950">
                    {selectedLeadIds.size} Lead{selectedLeadIds.size > 1 ? 's' : ''} Selected
                  </span>
                  <span className="text-xs text-slate-600 font-medium hidden sm:inline">
                    Claiming will remove from the database and unlock Excel download in your vault
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedLeadIds(new Set())}
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-300 cursor-pointer"
                  >
                    Clear Selection
                  </button>

                  <button
                    onClick={handleBulkClaim}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-extrabold text-xs uppercase tracking-wider shadow-md border border-amber-300 flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-amber-300" />
                    <span>Claim & Remove Selected ({selectedLeadIds.size}) from Database</span>
                  </button>
                </div>
              </div>
            )}

            {/* Live Leads Table */}
            <div className="overflow-x-auto rounded-xl border-2 border-slate-100">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white font-bold uppercase tracking-wider text-[11px]">
                    <th className="p-3.5 pl-4 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={
                          filteredLeads.length > 0 &&
                          selectedLeadIds.size === filteredLeads.length
                        }
                        onChange={handleSelectAllLiveLeads}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-amber-500 cursor-pointer"
                        title="Select all visible leads"
                      />
                    </th>
                    <th className="p-3.5">Lead / Owner</th>
                    <th className="p-3.5">Developer / Resort</th>
                    <th className="p-3.5">Maint. Fee / Loan</th>
                    <th className="p-3.5">
                      <div className="flex items-center gap-1 text-amber-300">
                        <Globe className="w-3.5 h-3.5" />
                        <span>Originating Landing Page</span>
                      </div>
                    </th>
                    <th className="p-3.5">Intent / Urgency</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right pr-4">Closer Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-slate-500">
                        <div className="max-w-md mx-auto space-y-3">
                          <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-50 border border-amber-300 flex items-center justify-center">
                            <Globe className="w-6 h-6 text-amber-600" />
                          </div>
                          <div className="text-base font-extrabold text-emerald-950">
                            {leads.length === 0
                              ? 'Awaiting Spreadsheet Leads'
                              : 'No leads match your filter'}
                          </div>
                          <div className="text-xs text-slate-500 leading-relaxed font-medium">
                            {leads.length === 0 ? (
                              <div className="space-y-3">
                                <p>
                                  Upload your spreadsheet in the Admin panel. Leads drip one-by-one into the live feed in original spreadsheet order, looping infinitely 24/7.
                                </p>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenAdmin?.();
                                  }}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer"
                                >
                                  <span>Open Admin Upload</span>
                                </button>
                              </div>
                            ) : (
                              'Try resetting your developer, domain, or urgency filters above.'
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredLeads.map((lead) => {
                      const isSelected = selectedLeadIds.has(lead.id);
                      return (
                        <tr
                          key={lead.id}
                          onClick={() => onSelectLead(lead)}
                          className={`hover:bg-amber-50/40 transition-colors cursor-pointer group ${
                            isSelected ? 'bg-amber-50/60' : ''
                          } ${
                            lead.isNewArrival
                              ? 'bg-gradient-to-r from-amber-50/60 via-yellow-50/40 to-white animate-pulse-once border-l-4 border-l-amber-500'
                              : ''
                          }`}
                        >
                          {/* Selection Checkbox */}
                          <td
                            className="p-3.5 pl-4 text-center"
                            onClick={(e) => handleToggleSelectLead(lead.id, e)}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="rounded border-slate-300 text-emerald-600 focus:ring-amber-500 cursor-pointer"
                            />
                          </td>

                          {/* Column 1: Client & Phone */}
                          <td className="p-3.5">
                            <div className="flex items-start gap-2.5">
                              <div className="mt-0.5">
                                {lead.isNewArrival ? (
                                  <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                                  </span>
                                ) : (
                                  <div className="w-2 h-2 rounded-full bg-emerald-600 mt-1" />
                                )}
                              </div>
                              <div>
                                <div className="font-extrabold text-slate-900 group-hover:text-emerald-950 flex items-center gap-1.5">
                                  <span>{lead.fullName}</span>
                                  {lead.isNewArrival && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-xs">
                                      JUST IN
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1 mt-0.5">
                                  <Phone className="w-3 h-3 text-amber-600" />
                                  <span>{lead.phone}</span>
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {lead.city}, {lead.state} {lead.zipCode} • {lead.receivedAgo || 'Recently'}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Column 2: Developer & Timeshare Info */}
                          <td className="p-3.5">
                            <div className="font-bold text-slate-900 flex items-center gap-1">
                              <Building className="w-3.5 h-3.5 text-emerald-700" />
                              <span>{lead.resortDeveloper}</span>
                            </div>
                            <div className="text-[11px] text-slate-600 truncate max-w-[150px]">
                              {lead.resortName || 'Contract Property'}
                            </div>
                            <div className="text-[10px] text-amber-800 font-semibold mt-0.5">
                              {lead.timeshareType} • {lead.yearsOwned} yrs owned
                            </div>
                          </td>

                          {/* Column 3: Maintenance Fee & Mortgage */}
                          <td className="p-3.5">
                            <div className="font-black text-slate-900 flex items-center gap-1">
                              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                              <span>${(Number(lead.annualMaintenanceFee) || 0).toLocaleString()}</span>
                              <span className="text-[10px] font-normal text-slate-500">/yr</span>
                            </div>
                            {Number(lead.mortgageBalance || 0) > 0 ? (
                              <div className="text-[10px] font-bold text-red-700 bg-red-50 px-1.5 py-0.2 rounded inline-block mt-0.5">
                                Loan: ${(Number(lead.mortgageBalance) || 0).toLocaleString()}
                              </div>
                            ) : (
                              <div className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded inline-block mt-0.5">
                                Deed Paid Off
                              </div>
                            )}
                          </td>

                          {/* Column 4: Originating Landing Page Source */}
                          <td className="p-3.5">
                            <div className="flex flex-col gap-1 max-w-[210px]">
                              <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50/80 border border-amber-300 text-emerald-950 font-bold text-[11px]">
                                <Globe className="w-3 h-3 text-amber-600 shrink-0" />
                                <span className="font-mono truncate">{lead.sourceDomain}</span>
                              </div>
                              <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                                <span className="truncate">{lead.campaignSource}</span>
                              </div>
                            </div>
                          </td>

                          {/* Column 5: Intent Score & Urgency */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                  lead.urgency === 'CRITICAL'
                                    ? 'bg-red-100 text-red-900 border border-red-300 animate-pulse-once'
                                    : lead.urgency === 'HIGH'
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : 'bg-slate-100 text-slate-700 border border-slate-300'
                                }`}
                              >
                                {lead.urgency}
                              </span>
                            </div>
                            <div className="text-[10px] font-semibold text-emerald-900">
                              {lead.intentScore}% Exit Viability
                            </div>
                          </td>

                          {/* Column 6: Status */}
                          <td className="p-3.5" onClick={(e) => e.stopPropagation()}>
                            <select
                              value={lead.status}
                              onChange={(e) => onUpdateStatus(lead.id, e.target.value as Lead['status'], currentUser || undefined)}
                              className="px-2 py-1 rounded-md text-[11px] font-bold border border-emerald-200 bg-white text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer"
                            >
                              <option value="NEW">NEW</option>
                              <option value="CLAIMED">CLAIM (Take & Remove)</option>
                              <option value="CONTACTED">CONTACTED</option>
                              <option value="IN_PROGRESS">IN PROGRESS</option>
                              <option value="EXIT_SIGNED">SIGNED 🏆</option>
                              <option value="ARCHIVED">ARCHIVED</option>
                            </select>
                          </td>

                          {/* Column 7: Actions */}
                          <td className="p-3.5 pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={(e) => handleCopyQuick(e, lead)}
                                title="Copy Lead Info"
                                className="p-1.5 rounded-lg border border-slate-200 hover:border-amber-400 hover:bg-amber-50 text-slate-600 hover:text-emerald-950 transition-colors cursor-pointer"
                              >
                                {copiedId === lead.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>

                              <button
                                onClick={() => {
                                  onClaimLead(lead);
                                  showNotification(`✓ Claimed ${lead.fullName}! Removed from database.`);
                                }}
                                title="Claim lead — removes from live database and unlocks Excel export in your vault"
                                className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold text-[11px] uppercase tracking-wider border border-amber-300 shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />
                                <span>Claim</span>
                              </button>

                              <button
                                onClick={() => onSelectLead(lead)}
                                className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-colors cursor-pointer"
                                title="View Full Dossier"
                              >
                                <ChevronRight className="w-4 h-4 text-amber-700" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 2: MY CLAIMED LEADS VAULT (Exclusive user portfolio) */}
        {/* ============================================================== */}
        {viewMode === 'claimed' && (
          <div className="space-y-4">
            {/* Vault Info & Status Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-amber-50 to-emerald-50 border-2 border-emerald-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-900 border border-amber-300 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <div className="text-sm font-black text-emerald-950 uppercase tracking-tight flex items-center gap-2">
                    <span>Exclusive Claimed Leads Portfolio</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-900 text-amber-300 font-bold">
                      {filteredClaimed.length} Secured Leads
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 font-medium mt-0.5">
                    These leads have been permanently removed from the shared database. Only you can work and export them.
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleExportClaimedToExcel}
                  disabled={filteredClaimed.length === 0}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-extrabold text-xs uppercase tracking-wider shadow-md border border-amber-300 transition-all cursor-pointer disabled:opacity-50"
                >
                  <FileSpreadsheet className="w-4 h-4 text-amber-300" />
                  <span>Export All to Excel ({filteredClaimed.length})</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportClaimedToCSV}
                  disabled={filteredClaimed.length === 0}
                  className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-emerald-950 font-bold text-xs uppercase tracking-wider border border-slate-300 hover:border-amber-400 transition-all cursor-pointer disabled:opacity-50"
                  title="Download CSV format"
                >
                  <Download className="w-3.5 h-3.5 text-amber-600" />
                  <span>CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setClearConfirmModal({
                      isOpen: true,
                      mode: 'all',
                      count: filteredClaimed.length,
                    })
                  }
                  disabled={filteredClaimed.length === 0}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-red-50 text-red-700 hover:text-red-800 font-extrabold text-xs uppercase tracking-wider shadow-xs border border-red-200 hover:border-red-400 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Clear all claimed leads from your portfolio vault"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                  <span>Clear Vault ({filteredClaimed.length})</span>
                </button>
              </div>
            </div>

            {/* Filter toolbar for claimed vault */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-950 font-bold uppercase tracking-wider text-[11px]">
                <Filter className="w-3.5 h-3.5 text-amber-600" />
                <span>Filter Claimed:</span>
              </div>

              <select
                value={claimedSelectedStatus}
                onChange={(e) => setClaimedSelectedStatus(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-800 hover:border-amber-400 focus:outline-none text-xs cursor-pointer"
              >
                <option value="ALL">All Statuses ({filteredClaimed.length})</option>
                <option value="CLAIMED">Claimed (New in Vault)</option>
                <option value="CONTACTED">Contacted</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="EXIT_SIGNED">Retainer Signed 🏆</option>
                <option value="ARCHIVED">Archived</option>
              </select>

              {selectedClaimedIds.size > 0 && (
                <div className="flex flex-wrap items-center gap-2 ml-auto">
                  <span className="text-xs font-bold text-emerald-950">
                    {selectedClaimedIds.size} Selected
                  </span>
                  <button
                    onClick={handleExportSelectedClaimed}
                    className="px-3 py-1 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs border border-amber-300 flex items-center gap-1 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-amber-300" />
                    <span>Export Selected</span>
                  </button>
                  <button
                    onClick={() =>
                      setClearConfirmModal({
                        isOpen: true,
                        mode: 'selected',
                        leadIds: Array.from(selectedClaimedIds),
                        count: selectedClaimedIds.size,
                      })
                    }
                    className="px-3 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs border border-red-300 flex items-center gap-1 cursor-pointer transition-colors"
                    title="Clear selected leads from vault"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    <span>Clear Selected</span>
                  </button>
                  {onReleaseLead && (
                    <button
                      onClick={handleBulkReleaseSelected}
                      className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-800 font-bold text-xs border border-slate-300 flex items-center gap-1 cursor-pointer"
                      title="Return selected leads back to the live database pool"
                    >
                      <RotateCcw className="w-3 h-3 text-amber-700" />
                      <span>Return to Database</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Claimed Leads Table */}
            <div className="overflow-x-auto rounded-xl border-2 border-slate-100">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white font-bold uppercase tracking-wider text-[11px]">
                    <th className="p-3.5 pl-4 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={
                          filteredClaimedLeads.length > 0 &&
                          selectedClaimedIds.size === filteredClaimedLeads.length
                        }
                        onChange={handleSelectAllClaimed}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-amber-500 cursor-pointer"
                        title="Select all claimed leads"
                      />
                    </th>
                    <th className="p-3.5">Lead / Client</th>
                    <th className="p-3.5">Resort / Developer</th>
                    <th className="p-3.5">Fee & Mortgage Debt</th>
                    <th className="p-3.5">
                      <div className="flex items-center gap-1 text-amber-300">
                        <Globe className="w-3.5 h-3.5" />
                        <span>Source Funnel</span>
                      </div>
                    </th>
                    <th className="p-3.5">Pipeline Status</th>
                    <th className="p-3.5 text-right pr-4">Vault Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredClaimedLeads.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-slate-500">
                        <div className="max-w-md mx-auto space-y-3">
                          <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-50 border border-amber-300 flex items-center justify-center">
                            <Lock className="w-6 h-6 text-amber-600" />
                          </div>
                          <div className="text-base font-extrabold text-emerald-950">
                            {filteredClaimed.length === 0
                              ? 'Your Claimed Vault is Empty'
                              : 'No claimed leads match your filter'}
                          </div>
                          <div className="text-xs text-slate-500 leading-relaxed font-medium">
                            {filteredClaimed.length === 0
                              ? 'You can only export leads that you have claimed. Click "Claim" on any lead in the Live Leads Database to remove it from the pool and unlock Excel export.'
                              : 'Try resetting your filter.'}
                          </div>
                          {filteredClaimed.length === 0 && (
                            <div className="pt-2">
                              <button
                                type="button"
                                onClick={() => setViewMode('database')}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-extrabold text-xs uppercase tracking-wider shadow-sm border border-amber-300 transition-all cursor-pointer"
                              >
                                <Radio className="w-4 h-4 text-amber-300" />
                                <span>Browse Live Database to Claim Leads</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredClaimedLeads.map((lead) => {
                      const isSelected = selectedClaimedIds.has(lead.id);
                      return (
                        <tr
                          key={lead.id}
                          onClick={() => onSelectLead(lead)}
                          className={`hover:bg-amber-50/40 transition-colors cursor-pointer group ${
                            isSelected ? 'bg-amber-50/60' : ''
                          }`}
                        >
                          {/* Checkbox */}
                          <td
                            className="p-3.5 pl-4 text-center"
                            onClick={(e) => handleToggleSelectClaimed(lead.id, e)}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="rounded border-slate-300 text-emerald-600 focus:ring-amber-500 cursor-pointer"
                            />
                          </td>

                          {/* Client */}
                          <td className="p-3.5">
                            <div className="font-extrabold text-slate-900 group-hover:text-emerald-950">
                              {lead.fullName}
                            </div>
                            <div className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-amber-600" />
                              <span>{lead.phone}</span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {lead.city}, {lead.state} • {lead.email}
                            </div>
                          </td>

                          {/* Resort */}
                          <td className="p-3.5">
                            <div className="font-bold text-slate-900 flex items-center gap-1">
                              <Building className="w-3.5 h-3.5 text-emerald-700" />
                              <span>{lead.resortDeveloper}</span>
                            </div>
                            <div className="text-[10px] text-amber-800 font-semibold mt-0.5">
                              {lead.timeshareType} • {lead.yearsOwned} yrs owned
                            </div>
                          </td>

                          {/* Fees & Debt */}
                          <td className="p-3.5">
                            <div className="font-black text-slate-900">
                              ${(Number(lead.annualMaintenanceFee) || 0).toLocaleString()}/yr
                            </div>
                            {Number(lead.mortgageBalance || 0) > 0 ? (
                              <div className="text-[10px] font-bold text-red-700">
                                Loan: ${(Number(lead.mortgageBalance) || 0).toLocaleString()}
                              </div>
                            ) : (
                              <div className="text-[10px] font-bold text-emerald-800">
                                Paid Off
                              </div>
                            )}
                          </td>

                          {/* Source Domain */}
                          <td className="p-3.5">
                            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50/80 border border-amber-300 text-emerald-950 font-bold text-[11px] max-w-[200px]">
                              <Globe className="w-3 h-3 text-amber-600 shrink-0" />
                              <span className="font-mono truncate">{lead.sourceDomain}</span>
                            </div>
                          </td>

                          {/* Pipeline Status */}
                          <td className="p-3.5" onClick={(e) => e.stopPropagation()}>
                            <select
                              value={lead.status}
                              onChange={(e) => onUpdateStatus(lead.id, e.target.value as Lead['status'], currentUser || undefined)}
                              className="px-2 py-1 rounded-md text-[11px] font-bold border border-emerald-300 bg-emerald-50 text-emerald-950 focus:outline-none cursor-pointer"
                            >
                              <option value="CLAIMED">CLAIMED</option>
                              <option value="CONTACTED">CONTACTED</option>
                              <option value="IN_PROGRESS">IN PROGRESS</option>
                              <option value="EXIT_SIGNED">SIGNED 🏆</option>
                              <option value="ARCHIVED">ARCHIVED</option>
                            </select>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {typeof lead.claimedBy === 'object' && lead.claimedBy !== null
                                ? ((lead.claimedBy as any).username || (lead.claimedBy as any).name || 'Assigned to You')
                                : (lead.claimedBy || 'Assigned to You')}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="p-3.5 pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={(e) => handleCopyQuick(e, lead)}
                                title="Copy Lead Info"
                                className="p-1.5 rounded-lg border border-slate-200 hover:border-amber-400 hover:bg-amber-50 text-slate-600 hover:text-emerald-950 transition-colors cursor-pointer"
                              >
                                {copiedId === lead.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>

                              <button
                                onClick={() => handleExportSingleClaimed(lead)}
                                title="Download Excel (.xlsx) for this claimed lead"
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-[11px] border border-amber-300 flex items-center gap-1 cursor-pointer shadow-xs"
                              >
                                <FileSpreadsheet className="w-3 h-3 text-amber-300" />
                                <span>Export</span>
                              </button>

                              <button
                                onClick={() =>
                                  setClearConfirmModal({
                                    isOpen: true,
                                    mode: 'single',
                                    leadIds: [lead.id],
                                    leadName: lead.fullName,
                                    count: 1,
                                  })
                                }
                                title="Clear from Claimed Vault"
                                className="p-1.5 rounded-lg border border-slate-200 hover:border-red-400 hover:bg-red-50 text-slate-500 hover:text-red-700 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                              {onReleaseLead && (
                                <button
                                  onClick={() => {
                                    onReleaseLead(lead.id);
                                    showNotification(`✓ Returned ${lead.fullName} to live database pool.`);
                                  }}
                                  title="Release back to live database pool"
                                  className="p-1.5 rounded-lg border border-slate-200 hover:border-amber-400 hover:bg-amber-50 text-slate-600 hover:text-amber-800 transition-colors cursor-pointer"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <button
                                onClick={() => onSelectLead(lead)}
                                className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-colors cursor-pointer"
                                title="View Full Dossier"
                              >
                                <ChevronRight className="w-4 h-4 text-amber-700" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* EXPORT RESTRICTION EXPLANATION MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full border-2 border-amber-400 shadow-2xl p-6 sm:p-7 relative overflow-hidden">
            {/* Decorative gold foil accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-400/20 to-transparent pointer-events-none rounded-tr-2xl" />

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0">
                <Lock className="w-6 h-6 text-amber-700" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black text-emerald-950 uppercase tracking-tight">
                  Export Restricted to Claimed Leads
                </h3>
                <p className="text-xs text-amber-800 font-bold mt-0.5">
                  You can only export leads that you have claimed
                </p>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed space-y-2.5">
              <p>
                To maintain exclusive broker assignment and lead governance,{' '}
                <strong className="text-emerald-950">Excel (.xlsx) and CSV exports are strictly restricted to your Claimed Leads</strong>.
              </p>
              <div className="p-3 rounded-lg bg-amber-50/80 border border-amber-300 text-amber-950">
                <div className="font-bold uppercase text-[11px] mb-1 text-emerald-950 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>How It Works:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 font-semibold text-[11.5px]">
                  <li>
                    When you claim leads, they are <strong className="text-emerald-900">automatically removed from the live database</strong> so no one else can take them.
                  </li>
                  <li>
                    Claimed leads are placed into your <strong className="text-emerald-900">My Claimed Leads Vault</strong>.
                  </li>
                  <li>
                    You can then export them to Excel (.xlsx) with all 100+ originating landing page sources tagged!
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-2.5">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Got It
              </button>

              {leads.length > 0 && (
                <button
                  onClick={() => {
                    const top5Ids = leads.slice(0, 5).map((l) => l.id);
                    if (onClaimMultipleLeads) {
                      onClaimMultipleLeads(top5Ids);
                    } else {
                      leads.slice(0, 5).forEach((l) => onClaimLead(l));
                    }
                    setShowExportModal(false);
                    setViewMode('claimed');
                    showNotification(`✓ Claimed top ${Math.min(5, leads.length)} leads! Removed from database.`);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-extrabold text-xs uppercase tracking-wider shadow-md border border-amber-300 flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Claim First {Math.min(5, leads.length)} Leads Now</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: POST-EXPORT CLEAR CLAIMED LEADS PROMPT */}
      {postExportPrompt && postExportPrompt.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full border-2 border-amber-400 shadow-2xl p-6 sm:p-7 relative overflow-hidden">
            {/* Decorative gold foil accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-400/20 to-transparent pointer-events-none rounded-tr-2xl" />

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-800 to-emerald-950 border border-amber-300 flex items-center justify-center text-amber-300 shadow-md shrink-0">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-extrabold text-emerald-950">Export Successful!</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    File Downloaded
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Portfolio Claimed Leads Vault
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-slate-800 text-xs space-y-2 mb-5">
              <p className="font-bold text-emerald-950 text-sm">
                Would you like to clear these exported leads from your Claimed Vault now?
              </p>
              <p className="text-slate-600 leading-relaxed">
                Clearing <strong className="text-emerald-900">{postExportPrompt.title}</strong> ({postExportPrompt.count} lead{postExportPrompt.count > 1 ? 's' : ''}) will empty them from your claimed portfolio so you can keep your workspace clean and claim fresh opportunities from the live feed.
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setPostExportPrompt(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer text-center"
              >
                Keep in Vault
              </button>

              <button
                type="button"
                onClick={() => {
                  executeClearLeads(postExportPrompt.leadIds);
                  setPostExportPrompt(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-extrabold text-xs uppercase tracking-wider shadow-md border border-red-400 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-white" />
                <span>Clear Exported Leads ({postExportPrompt.count})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: MANUAL CLEAR VAULT CONFIRMATION */}
      {clearConfirmModal && clearConfirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full border-2 border-red-300 shadow-2xl p-6 relative overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-red-100 border border-red-300 flex items-center justify-center text-red-600 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {clearConfirmModal.mode === 'all'
                    ? 'Clear All Claimed Leads?'
                    : clearConfirmModal.mode === 'selected'
                    ? `Clear ${clearConfirmModal.count} Selected Leads?`
                    : `Remove ${clearConfirmModal.leadName || 'Lead'}?`}
                </h3>
                <p className="text-xs text-red-700 font-semibold mt-0.5">
                  Portfolio Vault Clean-Up
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              {clearConfirmModal.mode === 'all'
                ? `Are you sure you want to clear all ${clearConfirmModal.count} leads from your Claimed Leads Vault? This will empty your claimed portfolio.`
                : clearConfirmModal.mode === 'selected'
                ? `Are you sure you want to remove the ${clearConfirmModal.count} selected leads from your Claimed Leads Vault?`
                : `Are you sure you want to remove ${clearConfirmModal.leadName} from your Claimed Leads Vault?`}
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setClearConfirmModal(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  if (clearConfirmModal.mode === 'all') {
                    executeClearLeads();
                  } else {
                    executeClearLeads(clearConfirmModal.leadIds);
                  }
                  setClearConfirmModal(null);
                }}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4 text-white" />
                <span>Confirm Clear</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
