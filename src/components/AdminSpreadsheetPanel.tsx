import React, { useState, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Lead, DripConfig, LandingPageSite } from '../types/lead';
import {
  USER_LANDING_PAGES,
  LANDING_PAGE_DOMAINS,
  getDomainForResort,
} from '../data/landingPages';
import {
  ColumnMapping,
  autoDetectColumns,
  convertRowToLead,
  isLikelyCityOrLocation,
} from '../utils/columnDetector';
import {
  Upload,
  FileSpreadsheet,
  Play,
  Pause,
  Clock,
  Sparkles,
  Download,
  Globe,
  Trash2,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ExternalLink,
  Search,
  Check,
  X,
  ArrowRight,
  UserCheck,
  RotateCcw,
  KeyRound,
} from 'lucide-react';
import { AppUser } from '../types/user';
import { UserAccessManager } from './UserAccessManager';

interface AdminSpreadsheetPanelProps {
  queue: Omit<Lead, 'id' | 'timestamp' | 'receivedAgo' | 'isNewArrival'>[];
  queueCount?: number;
  masterQueueCount?: number;
  onAddToQueue: (
    newLeads: Omit<Lead, 'id' | 'timestamp' | 'receivedAgo' | 'isNewArrival'>[],
    fullMasterQueue?: Omit<Lead, 'id' | 'timestamp' | 'receivedAgo' | 'isNewArrival'>[]
  ) => void;
  onClearQueue: () => void;
  onTriggerInstantDrop: () => void;
  dripConfig: DripConfig;
  onUpdateDripConfig: (config: Partial<DripConfig>) => void;
  domains: LandingPageSite[];
  onAddDomain: (newDomain: LandingPageSite) => void;
  droppedCount: number;
  onImportDirectlyToFeed?: (newLeads: Lead[]) => void;
  onSwitchToFeed?: () => void;
  onLockAdmin?: () => void;
  liveLeadsCount?: number;
  onClearFeed?: () => Promise<void> | void;
  onClearAllLists?: () => Promise<void> | void;
  onShuffleQueue?: () => void;
  onUploadSpreadsheetComplete?: (
    initialFeed: Lead[],
    restQueue: Omit<Lead, 'id' | 'timestamp' | 'receivedAgo' | 'isNewArrival'>[],
    masterQueue: Omit<Lead, 'id' | 'timestamp' | 'receivedAgo' | 'isNewArrival'>[]
  ) => void;
  users?: AppUser[];
  onAddUser?: (user: {
    username: string;
    password: string;
    role: 'buyer' | 'admin';
    name?: string;
    notes?: string;
  }) => Promise<{ success: boolean; message?: string }>;
  onUpdateUser?: (
    id: string,
    updates: Partial<AppUser>
  ) => Promise<{ success: boolean; message?: string }>;
  onDeleteUser?: (id: string) => Promise<{ success: boolean; message?: string }>;
}

export const AdminSpreadsheetPanel: React.FC<AdminSpreadsheetPanelProps> = ({
  queue,
  queueCount,
  masterQueueCount,
  onAddToQueue,
  onUploadSpreadsheetComplete,
  onClearQueue,
  onShuffleQueue,
  onTriggerInstantDrop,
  dripConfig,
  onUpdateDripConfig,
  domains,
  onAddDomain,
  droppedCount,
  onImportDirectlyToFeed,
  onSwitchToFeed,
  onLockAdmin,
  liveLeadsCount = 0,
  onClearFeed,
  onClearAllLists,
  users = [],
  onAddUser,
  onUpdateUser,
  onDeleteUser,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const effectiveQueueCount = typeof queueCount === 'number' ? queueCount : queue.length;
  const effectiveMasterCount = typeof masterQueueCount === 'number' ? masterQueueCount : effectiveQueueCount;

  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [taggingStrategy, setTaggingStrategy] = useState<'smart' | 'round_robin' | 'fixed'>('smart');
  const [selectedFixedDomain, setSelectedFixedDomain] = useState<string>(domains[0]?.domain || '');
  const [newDomainInput, setNewDomainInput] = useState('');
  const [newDomainNiche, setNewDomainNiche] = useState('');
  const [landingPageFilter, setLandingPageFilter] = useState<string>('ALL');
  const [landingPageSearch, setLandingPageSearch] = useState<string>('');

  // Clear live feed confirmation state
  const [showClearFeedConfirm, setShowClearFeedConfirm] = useState(false);
  const [isClearingFeed, setIsClearingFeed] = useState(false);
  const [clearFeedNotice, setClearFeedNotice] = useState<string | null>(null);

  // Clear all uploaded lists confirmation state
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);

  const handleConfirmClearFeed = async () => {
    if (!onClearFeed) return;
    setIsClearingFeed(true);
    try {
      await onClearFeed();
      setShowClearFeedConfirm(false);
      setClearFeedNotice('All leads were cleared from the live feed successfully.');
      setTimeout(() => setClearFeedNotice(null), 5000);
    } catch {
      setClearFeedNotice('Failed to clear leads from feed. Please try again.');
    } finally {
      setIsClearingFeed(false);
    }
  };

  const handleConfirmClearAllLists = async () => {
    if (!onClearAllLists) return;
    setIsClearingAll(true);
    try {
      await onClearAllLists();
      setShowClearAllConfirm(false);
      setClearFeedNotice('All uploaded lists, queue, and live feeds were cleared successfully. You can now add new leads.');
      setTimeout(() => setClearFeedNotice(null), 6000);
    } catch {
      setClearFeedNotice('Failed to clear lists. Please try again.');
    } finally {
      setIsClearingAll(false);
    }
  };

  // Interactive Mapping Modal State
  const [rawRows, setRawRows] = useState<Record<string, unknown>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [parsingProgress, setParsingProgress] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState('');

  const filteredLandingPages = useMemo(() => {
    return USER_LANDING_PAGES.filter((page) => {
      if (landingPageFilter !== 'ALL' && page.category !== landingPageFilter) return false;
      if (landingPageSearch.trim()) {
        const q = landingPageSearch.toLowerCase();
        return (
          page.slug.toLowerCase().includes(q) ||
          page.title.toLowerCase().includes(q) ||
          page.displayUrl.toLowerCase().includes(q) ||
          page.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [landingPageFilter, landingPageSearch]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse Excel file (.xlsx, .xls, .csv) with high-speed chunked parsing
  const handleFileUpload = (file: File) => {
    if (!file) return;
    setUploadStatus(null);
    setUploadError(null);
    setIsParsingFile(true);
    setParsingProgress('Reading spreadsheet file...');

    const reader = new FileReader();

    reader.onerror = () => {
      setIsParsingFile(false);
      setUploadError('Failed to read file from disk. Please try again.');
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.onload = (e) => {
      // Defer execution slightly to let React render the parsing indicator
      setTimeout(() => {
        try {
          setParsingProgress('Parsing Excel workbook sheets...');
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, {
            type: 'array',
            cellDates: true,
            cellFormula: false,
          });

          // Find worksheet with the most data
          let worksheet: XLSX.WorkSheet | null = null;
          let maxRows = 0;
          for (const sheetName of workbook.SheetNames) {
            const ws = workbook.Sheets[sheetName];
            if (ws && ws['!ref']) {
              const range = XLSX.utils.decode_range(ws['!ref']);
              const rowCount = range.e.r - range.s.r + 1;
              if (rowCount > maxRows) {
                maxRows = rowCount;
                worksheet = ws;
              }
            }
          }
          // Fallback to first sheet if no data detected
          if (!worksheet && workbook.SheetNames.length > 0) {
            worksheet = workbook.Sheets[workbook.SheetNames[0]];
          }

          if (!worksheet) {
            setIsParsingFile(false);
            setUploadError('The uploaded workbook contains no active worksheets with data.');
            return;
          }

          setParsingProgress('Detecting column headers...');
          // Fast header scan using the first 20 rows to be safer
          const allScanRows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
            header: 1,
            defval: '',
          });
          const headerScanRows = allScanRows.slice(0, 20);

          let bestHeaderRowIndex = 0;
          let maxHeaderMatches = 0;
          const knownHeaderKeywords = [
            'name', 'first', 'last', 'fname', 'lname', 'client', 'customer', 'owner',
            'contact', 'lead', 'phone', 'cell', 'tel', 'mobile', 'resort', 'developer',
            'timeshare', 'city', 'town', 'location', 'loc', 'state', 'zip', 'email',
            'mail', 'fee', 'dues', 'mortgage', 'balance', 'loan', 'years', 'dispute',
            'notes', 'status', 'urgency', 'deed', 'points'
          ];

          for (let r = 0; r < Math.min(10, headerScanRows.length); r++) {
            const rowCells = (headerScanRows[r] || []).map((c) => String(c ?? '').trim().toLowerCase());
            let count = 0;
            for (const cell of rowCells) {
              if (knownHeaderKeywords.some((kw) => cell.includes(kw))) {
                count++;
              }
            }
            if (count > maxHeaderMatches) {
              maxHeaderMatches = count;
              bestHeaderRowIndex = r;
            }
          }

          setParsingProgress('Extracting valid lead rows...');
          // Convert worksheet to JSON rows using detected header row range
          const parsedJson = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
            range: bestHeaderRowIndex,
            defval: '',
            raw: false,
          });

          // Filter out completely blank or empty rows
          const validRows = (parsedJson || []).filter((r) =>
            r && Object.values(r).some((v) => v !== null && v !== undefined && String(v).trim().length > 0)
          );

          if (!validRows || validRows.length === 0) {
            setIsParsingFile(false);
            setUploadError('The uploaded spreadsheet contains no data rows.');
            return;
          }

          // Preserve exact header order from original header row, plus any keys in valid rows
          const rawHeaderRow = (headerScanRows[bestHeaderRowIndex] || []).map((c) => String(c ?? '').trim());
          const detectedHeaders: string[] = [];
          for (const h of rawHeaderRow) {
            if (h && !h.startsWith('__EMPTY') && !detectedHeaders.includes(h)) {
              detectedHeaders.push(h);
            }
          }

          const headerSet = new Set<string>();
          for (const r of validRows.slice(0, 15)) {
            for (const key of Object.keys(r)) {
              if (key && !key.startsWith('__EMPTY') && key.trim().length > 0) {
                headerSet.add(key.trim());
              }
            }
          }
          for (const h of headerSet) {
            if (!detectedHeaders.includes(h)) {
              detectedHeaders.push(h);
            }
          }

          if (detectedHeaders.length === 0) {
            setIsParsingFile(false);
            setUploadError('Could not detect any column headers in the spreadsheet.');
            return;
          }

          setParsingProgress('Matching timeshare exit fields...');
          // Run intelligent multi-stage column detection with strict negative matching on sample rows
          const detectedMapping = autoDetectColumns(detectedHeaders, validRows.slice(0, 30));

          setRawRows(validRows);
          setHeaders(detectedHeaders);
          setMapping(detectedMapping);
          setUploadFileName(file.name);
          setIsParsingFile(false);
          setIsMappingModalOpen(true);
        } catch (err: unknown) {
          console.error('Spreadsheet parse error:', err);
          setIsParsingFile(false);
          const message = err instanceof Error ? err.message : 'Failed to parse file';
          setUploadError(`Failed to parse spreadsheet file: ${message}. Ensure it is a valid .xlsx, .xls, or .csv.`);
        } finally {
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      }, 30);
    };

    reader.readAsArrayBuffer(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Check if City was inadvertently selected or detected as Name or First Name
  const isCityMistakenForName = useMemo(() => {
    if (!rawRows || rawRows.length === 0) return false;
    const testCol = mapping.nameColumn || mapping.firstNameColumn;
    if (!testCol) return false;
    const norm = testCol.toLowerCase().replace(/[^a-z0-9]/g, '');
    const genuineNameHeaders = [
      'firstname', 'first', 'fname', 'fullname', 'name', 'clientname', 'leadname',
      'ownername', 'customername', 'contactname', 'client', 'customer', 'lead',
      'owner', 'contact', 'borrower', 'prospect', 'applicant'
    ];
    if (genuineNameHeaders.includes(norm)) {
      return false;
    }
    const samples = rawRows.slice(0, 10).map((r) => String(r[testCol] ?? '').trim()).filter(Boolean);
    if (samples.length === 0) return false;
    // Only flag if >= 60% of samples match strict city/location pattern
    const cityMatches = samples.filter((v) => isLikelyCityOrLocation(v)).length;
    return cityMatches >= Math.ceil(samples.length * 0.6);
  }, [rawRows, mapping.nameColumn, mapping.firstNameColumn]);

  // Fix helper: Reassign the mistaken column to City, and clear Name so realistic names are generated
  const handleFixCityNameMisdetection = () => {
    setMapping((prev) => {
      const wrongCol = prev.nameColumn || prev.firstNameColumn;
      return {
        ...prev,
        cityColumn: prev.cityColumn || wrongCol,
        nameColumn: undefined,
        firstNameColumn: undefined,
      };
    });
  };

  // Re-run auto-detector helper
  const handleReRunAutoDetection = () => {
    if (!rawRows || rawRows.length === 0 || !headers) return;
    const refreshed = autoDetectColumns(headers, rawRows.slice(0, 30));
    setMapping(refreshed);
  };

  // Real-time preview leads (only first 5 rows) - INSTANT without blocking main thread
  const previewLeads = useMemo(() => {
    if (!rawRows || rawRows.length === 0) return [];
    return rawRows.slice(0, 5).map((row, idx) =>
      convertRowToLead(row, mapping, idx, taggingStrategy, selectedFixedDomain, domains)
    );
  }, [rawRows, mapping, taggingStrategy, selectedFixedDomain, domains]);

  // Execute Import: Start 24/7 Live Drip (Queue all leads, drip one-by-one in exact spreadsheet order)
  const handleStartLiveDrip = () => {
    console.log('handleStartLiveDrip: rawRows length =', rawRows?.length);
    if (!rawRows || rawRows.length === 0) return;
    setIsImporting(true);
    setImportProgress('Converting leads and preparing 24/7 one-by-one drip queue...');

    setTimeout(() => {
      try {
        const fullConverted = rawRows.map((row, idx) =>
          convertRowToLead(row, mapping, idx, taggingStrategy, selectedFixedDomain, domains)
        );

        if (fullConverted.length === 0) return;

        // Atomic upload to server: live feed starts clean; ALL leads go into masterQueue & queue
        fetch('/api/leads/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leads: [], // Do NOT drop 500 leads in live feed at a time!
            queue: fullConverted,
            masterQueue: fullConverted,
            replace: true,
          }),
        })
          .then(() => {
            if (onUploadSpreadsheetComplete) {
              onUploadSpreadsheetComplete([], fullConverted, fullConverted);
            } else {
              onAddToQueue(fullConverted, fullConverted);
            }
          })
          .catch((err) => console.error('Failed to upload spreadsheet to server:', err));

        // Make sure drip config is enabled
        onUpdateDripConfig({ isEnabled: true });

        setUploadStatus(
          `Successfully loaded all ${fullConverted.length.toLocaleString()} leads from "${uploadFileName}"! Leads are now dripping one-by-one into the live feed in exact spreadsheet order, looping infinitely 24/7.`
        );
        setIsMappingModalOpen(false);
      } catch (err) {
        console.error('Import drip error:', err);
        setUploadError('Failed to convert leads for drip. Please verify column assignments.');
      } finally {
        setIsImporting(false);
        setImportProgress('');
      }
    }, 25);
  };

  // Alias for backward compatibility if invoked
  const handleImportAllToFeed = handleStartLiveDrip;

  const handleDownloadTemplate = () => {
    const templateHeaders = [
      {
        'Full Name': '',
        'Phone': '',
        'Timeshare Developer': '',
        'Resort Name': '',
        'Email': '',
        'City': '',
        'State': '',
        'Zip Code': '',
        'Annual Maintenance Fee': '',
        'Mortgage Balance': '',
        'Years Owned': '',
        'Ownership Type': 'Points / Deeded / Floating',
        'Dispute Reason': '',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateHeaders);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Timeshare Leads Import');
    XLSX.writeFile(workbook, '1ClickLeads_Blank_Import_Template.xlsx');
  };

  const handleAddNewDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomainInput.trim()) return;

    let clean = newDomainInput.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (!clean.includes('.')) clean += '.com';

    const newSite: LandingPageSite = {
      domain: clean,
      title: `${clean} Intake Portal`,
      niche: newDomainNiche.trim() || 'Timeshare Contract Cancellation',
      preferredResorts: ['All Major Developers'],
      activeCampaigns: 2,
      monthlyTraffic: '18,500 visits',
    };

    onAddDomain(newSite);
    setNewDomainInput('');
    setNewDomainNiche('');
    setUploadStatus(`Added landing page domain: ${clean}`);
  };

  return (
    <div className="space-y-8 font-['Plus_Jakarta_Sans']">
      {/* Top Admin Executive Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white border-2 border-amber-400 shadow-xl relative overflow-hidden">
        {/* Real Gold Top Glow */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950">
                Admin Control Room
              </span>
              <span className="text-xs text-amber-200 font-medium">
                Excel Spreadsheet Drip & Landing Page Attributor
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono bg-emerald-950/80 text-amber-300 border border-emerald-700/80 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Administrator
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Slow-Drip Live Incoming Lead Engine
            </h2>
            <p className="text-sm text-emerald-200 mt-1 max-w-2xl font-medium">
              Upload spreadsheets of timeshare owner records. The system auto-detects Name, Phone, and Resort, fills realistic data for missing fields, and feeds leads into the live closers' dashboard!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onLockAdmin && (
              <button
                onClick={onLockAdmin}
                className="px-3.5 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-900 border border-amber-400/60 text-amber-300 hover:text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                title="Lock admin session and return to live feed"
              >
                <span>Lock Admin</span>
              </button>
            )}

            <a
              href="#user-access-section"
              className="px-3.5 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-900 border border-emerald-400/80 text-emerald-300 hover:text-white font-extrabold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              title="Add or manage client/closer usernames and passwords"
            >
              <KeyRound className="w-4 h-4 text-amber-300" />
              <span>User Logins ({users.length})</span>
            </a>

            {onClearFeed && (
              <button
                type="button"
                onClick={() => setShowClearFeedConfirm(true)}
                className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-600 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg hover:shadow-red-950/40 active:scale-95 transition-all flex items-center gap-2 cursor-pointer border border-red-400/50"
                title="Clear all leads from the closers' live dispatch feed"
              >
                <Trash2 className="w-4 h-4 text-white" />
                <span>Clear All Leads From Feed {typeof liveLeadsCount === 'number' ? `(${liveLeadsCount})` : ''}</span>
              </button>
            )}

            <button
              onClick={onTriggerInstantDrop}
              disabled={effectiveQueueCount === 0}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>Drop Next Lead Right Now</span>
            </button>

            <button
              onClick={() => onUpdateDripConfig({ isEnabled: !dripConfig.isEnabled })}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider border-2 transition-all flex items-center gap-2 cursor-pointer ${
                dripConfig.isEnabled
                  ? 'bg-emerald-700/80 border-emerald-400 text-white'
                  : 'bg-amber-900/60 border-amber-500 text-amber-200'
              }`}
            >
              {dripConfig.isEnabled ? (
                <>
                  <Pause className="w-4 h-4 text-amber-300" />
                  <span>Drip Engine: ACTIVE (Click to Pause)</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 text-emerald-400" />
                  <span>Drip Engine: PAUSED (Click to Start)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Clear Feed Success Notice */}
        {clearFeedNotice && (
          <div className="mt-4 p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-100 text-xs font-bold flex items-center justify-between gap-2 animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{clearFeedNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setClearFeedNotice(null)}
              className="text-emerald-300 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Live Counters */}
        <div className="mt-6 pt-4 border-t border-emerald-800/80 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 text-xs">
          <div className="bg-emerald-900/60 p-3 rounded-xl border border-emerald-700/50 flex flex-col justify-between">
            <div>
              <div className="text-emerald-300 uppercase font-bold text-[10px] flex items-center justify-between">
                <span>Active Live Feed</span>
                {liveLeadsCount > 0 && onClearFeed && (
                  <button
                    type="button"
                    onClick={() => setShowClearFeedConfirm(true)}
                    className="text-[10px] font-black text-red-300 hover:text-white uppercase tracking-wider underline cursor-pointer"
                  >
                    Clear Feed
                  </button>
                )}
              </div>
              <div className="text-2xl font-black text-amber-300 mt-0.5">
                {liveLeadsCount} Leads Live
              </div>
            </div>
            {onSwitchToFeed && (
              <button
                type="button"
                onClick={onSwitchToFeed}
                className="mt-2 text-[10px] font-extrabold text-emerald-300 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <span>View Dashboard</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="bg-emerald-900/60 p-3 rounded-xl border border-emerald-700/50">
            <div className="text-emerald-300 uppercase font-bold text-[10px]">Queue Pending</div>
            <div className="text-2xl font-black text-amber-400 mt-0.5">
              {effectiveQueueCount.toLocaleString()} Leads Waiting
            </div>
            {effectiveMasterCount > 0 && (
              <div className="text-[10px] text-emerald-300/80 mt-0.5 font-medium">
                {effectiveMasterCount.toLocaleString()} in master list (looping)
              </div>
            )}
          </div>
          <div className="bg-emerald-900/60 p-3 rounded-xl border border-emerald-700/50">
            <div className="text-emerald-300 uppercase font-bold text-[10px]">Live Drops Sent</div>
            <div className="text-2xl font-black text-white mt-0.5">
              {droppedCount.toLocaleString()} Leads Delivered
            </div>
          </div>
          <div className="bg-emerald-900/60 p-3 rounded-xl border border-emerald-700/50">
            <div className="text-emerald-300 uppercase font-bold text-[10px]">Drip Interval</div>
            <div className="text-2xl font-black text-amber-300 mt-0.5">
              Every {dripConfig.intervalSeconds}s
            </div>
          </div>
          <div className="bg-emerald-900/60 p-3 rounded-xl border border-emerald-700/50">
            <div className="text-emerald-300 uppercase font-bold text-[10px]">Connected Domains</div>
            <div className="text-2xl font-black text-white mt-0.5">
              {domains.length} Landing Pages
            </div>
          </div>
          <div className="bg-emerald-900/60 p-3 rounded-xl border border-emerald-700/50 flex flex-col justify-between">
            <div>
              <div className="text-emerald-300 uppercase font-bold text-[10px]">User Logins</div>
              <div className="text-2xl font-black text-amber-300 mt-0.5">
                {users.length} Authorized
              </div>
            </div>
            <a
              href="#user-access-section"
              className="mt-2 text-[10px] font-extrabold text-emerald-300 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <span>Manage Users</span>
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Grid: Upload Area on Left, Drip Engine Config on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload Excel Spreadsheets */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl p-6 border-2 border-emerald-100 shadow-sm relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
                <h3 className="text-lg font-black text-emerald-950 uppercase tracking-tight">
                  Upload Excel (.XLSX / .CSV) File
                </h3>
              </div>
              <div className="flex items-center gap-3">
                {onClearAllLists && (
                  <button
                    onClick={() => setShowClearAllConfirm(true)}
                    className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                    title="Clear all uploaded lists, queue, and live feeds to add a new Excel list"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All Uploaded Lists</span>
                  </button>
                )}
                <button
                  onClick={handleDownloadTemplate}
                  className="text-xs font-bold text-amber-800 hover:text-amber-900 flex items-center gap-1.5 underline decoration-amber-400 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-amber-600" />
                  <span>Download Blank Template</span>
                </button>
              </div>
            </div>

            {/* Drag & Drop File Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => {
                if (!isParsingFile) fileInputRef.current?.click();
              }}
              className={`p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center relative overflow-hidden ${
                dragActive
                  ? 'border-amber-500 bg-amber-50/60 scale-[1.01]'
                  : isParsingFile
                  ? 'border-amber-400 bg-amber-50/40 cursor-wait'
                  : 'border-emerald-200 hover:border-amber-400 bg-slate-50/60 hover:bg-emerald-50/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              {isParsingFile ? (
                <div className="flex flex-col items-center justify-center py-3 animate-fade-in">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 p-[2px] shadow-lg mb-3 animate-pulse">
                    <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center">
                      <div className="w-7 h-7 border-3 border-emerald-800 border-t-transparent rounded-full animate-spin" />
                    </div>
                  </div>
                  <div className="text-sm font-black text-emerald-950">
                    Fast Processing Excel Workbook...
                  </div>
                  <div className="text-xs font-bold text-amber-800 mt-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block" />
                    <span>{parsingProgress || 'Detecting columns and data rows...'}</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 p-[2px] shadow-md mb-3">
                    <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center">
                      <Upload className="w-8 h-8 text-emerald-800" />
                    </div>
                  </div>

                  <div className="text-sm font-extrabold text-emerald-950">
                    Click to browse or drag & drop your Excel spreadsheet here
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Supports Microsoft Excel (.xlsx, .xls) and CSV spreadsheets
                  </div>
                  <div className="mt-3 px-3 py-1 rounded-full bg-emerald-100/70 text-emerald-800 text-[11px] font-bold">
                    Fast Auto-detection: Name, Phone, Resort • Automatically enriches missing fields!
                  </div>
                </>
              )}
            </div>

            {/* Status Messages */}
            {uploadStatus && (
              <div className="mt-4 p-4 rounded-xl bg-emerald-50 border-2 border-emerald-400 text-emerald-950 text-xs font-bold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{uploadStatus}</span>
                </div>
                {onSwitchToFeed && (
                  <button
                    type="button"
                    onClick={onSwitchToFeed}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                  >
                    <span>View in Live Feed</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {uploadError && (
              <div className="mt-4 p-3.5 rounded-xl bg-red-50 border border-red-300 text-red-800 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Upload Guidance */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-slate-600 font-medium">
                The engine accurately distinguishes Name from City, auto-detects Phone & Resort, and synthesizes missing fields realistically.
              </span>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-300 text-emerald-900 font-bold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-700" />
                <span>Get Blank Excel Template</span>
              </button>
            </div>
          </div>

          {/* Feeder Queue Preview Table */}
          <div className="bg-white rounded-2xl p-6 border-2 border-emerald-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-700" />
                <h4 className="text-sm font-black text-emerald-950 uppercase tracking-wider">
                  Leads Waiting in Queue ({effectiveQueueCount.toLocaleString()})
                </h4>
              </div>
              {effectiveQueueCount > 0 && (
                <div className="flex items-center gap-2">
                  {onShuffleQueue && (
                    <button
                      onClick={onShuffleQueue}
                      title="Reshuffle leads in the queue randomly"
                      className="px-2.5 py-1 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Randomize Queue Order</span>
                    </button>
                  )}
                  <button
                    onClick={onClearQueue}
                    className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer ml-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Queue</span>
                  </button>
                </div>
              )}
            </div>

            {effectiveQueueCount === 0 ? (
              <div className="p-8 text-center rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-sm font-bold text-slate-700">The slow drip queue is currently empty.</div>
                <div className="text-xs text-slate-500 mt-1">
                  Upload an Excel spreadsheet above to load your real leads and start the live stream!
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-60 overflow-y-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-emerald-950 font-bold sticky top-0">
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">Client</th>
                      <th className="p-2.5">Resort</th>
                      <th className="p-2.5">Fee</th>
                      <th className="p-2.5">Tagged Source Domain</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {queue.slice(0, 15).map((qLead, idx) => (
                      <tr key={idx} className="hover:bg-amber-50/40">
                        <td className="p-2.5 text-slate-400 font-mono">#{idx + 1}</td>
                        <td className="p-2.5 font-bold text-slate-800">
                          {qLead.fullName} <span className="text-[10px] text-slate-500">({qLead.state})</span>
                        </td>
                        <td className="p-2.5 font-semibold text-emerald-800">{qLead.resortDeveloper}</td>
                        <td className="p-2.5 font-mono font-bold text-amber-900">
                          ${(Number(qLead.annualMaintenanceFee) || 0).toLocaleString()}
                        </td>
                        <td className="p-2.5 font-mono text-[11px] text-emerald-900 font-medium">
                          {qLead.sourceDomain}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {effectiveQueueCount > queue.slice(0, 15).length && (
                  <div className="p-2.5 text-center text-[11px] text-emerald-800 bg-emerald-50 border-t border-emerald-100 font-semibold">
                    + {(effectiveQueueCount - queue.slice(0, 15).length).toLocaleString()} more leads queued in continuous 24/7 drip feed (auto-restarts from beginning of spreadsheet)
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Drip Engine Controls & Landing Page Domains */}
        <div className="lg:col-span-5 space-y-6">
          {/* Drip Speed & Timing Controller */}
          <div className="bg-white rounded-2xl p-6 border-2 border-amber-300 shadow-sm space-y-5">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-600" />
              <h3 className="text-base font-black text-emerald-950 uppercase tracking-tight">
                Slow-Drip Interval & Speed
              </h3>
            </div>

            {/* Speed Presets */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-emerald-950 mb-2">
                Drop Frequency Preset:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Instant Test (3s)', sec: 3 },
                  { label: 'Demo Fast (8s)', sec: 8 },
                  { label: 'Turbo (12s)', sec: 12 },
                  { label: 'Normal Fast (18s)', sec: 18 },
                  { label: 'Standard (35s)', sec: 35 },
                  { label: 'Organic (60s)', sec: 60 },
                  { label: 'Realistic (120s)', sec: 120 },
                  { label: 'Slow (180s)', sec: 180 },
                ].map((preset) => (
                  <button
                    key={preset.sec}
                    type="button"
                    onClick={() => onUpdateDripConfig({ intervalSeconds: preset.sec, isEnabled: true })}
                    className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all border cursor-pointer ${
                      dripConfig.intervalSeconds === preset.sec
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 border-amber-500 shadow-sm'
                        : 'bg-white hover:bg-amber-50/50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-emerald-950 mb-1">
                <span>Custom Seconds Interval:</span>
                <span className="font-mono text-amber-800 text-sm font-extrabold">
                  {dripConfig.intervalSeconds} seconds
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="300"
                step="1"
                value={dripConfig.intervalSeconds}
                onChange={(e) =>
                  onUpdateDripConfig({
                    intervalSeconds: Math.max(1, parseInt(e.target.value, 10) || 1),
                    isEnabled: true,
                  })
                }
                className="w-full accent-amber-500 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                <span>1 sec</span>
                <span>60 sec</span>
                <span>300 sec (5 min)</span>
              </div>
            </div>

            {/* Jitter Traffic Simulator Toggle */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-emerald-950">Natural Organic Traffic Jitter</div>
                <div className="text-[11px] text-slate-500">
                  Adds ±5 to 15s random variance so leads feel realistic
                </div>
              </div>
              <button
                type="button"
                onClick={() => onUpdateDripConfig({ enableJitter: !dripConfig.enableJitter })}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                  dripConfig.enableJitter ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>

            {/* Audio Bell Notification Toggle */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-emerald-950">Audio Ping Sound on Lead Drop</div>
                <div className="text-[11px] text-slate-500">
                  Plays dual-tone executive gold chime when new lead arrives
                </div>
              </div>
              <button
                type="button"
                onClick={() => onUpdateDripConfig({ soundEnabled: !dripConfig.soundEnabled })}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                  dripConfig.soundEnabled ? 'bg-amber-500 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>
          </div>

          {/* Landing Page Tagging Strategy */}
          <div className="bg-white rounded-2xl p-6 border-2 border-emerald-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-700" />
              <h3 className="text-base font-black text-emerald-950 uppercase tracking-tight">
                Landing Page Source Tagging Rule
              </h3>
            </div>

            <p className="text-xs text-slate-600 font-medium">
              When leads drop and when users download the list, which landing page domain will be tagged?
            </p>

            <div className="space-y-2">
              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                <input
                  type="radio"
                  name="tagging"
                  checked={taggingStrategy === 'smart'}
                  onChange={() => setTaggingStrategy('smart')}
                  className="mt-0.5 accent-emerald-600"
                />
                <div>
                  <span className="font-extrabold text-emerald-950 block">
                    Smart Match by Resort & Grievance (Recommended)
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    Wyndham leads tag to <code className="text-emerald-800">timeshare.click/wyndham-exit</code>, Westgate to <code className="text-emerald-800">timeshare.click/westgate-cancellation</code>, etc.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                <input
                  type="radio"
                  name="tagging"
                  checked={taggingStrategy === 'round_robin'}
                  onChange={() => setTaggingStrategy('round_robin')}
                  className="mt-0.5 accent-emerald-600"
                />
                <div>
                  <span className="font-extrabold text-emerald-950 block">
                    Round-Robin Rotation
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    Evenly rotates across all {domains.length} connected landing page sites.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                <input
                  type="radio"
                  name="tagging"
                  checked={taggingStrategy === 'fixed'}
                  onChange={() => setTaggingStrategy('fixed')}
                  className="mt-0.5 accent-emerald-600"
                />
                <div className="w-full">
                  <span className="font-extrabold text-emerald-950 block">
                    Specific Dedicated Domain
                  </span>
                  {taggingStrategy === 'fixed' && (
                    <select
                      value={selectedFixedDomain}
                      onChange={(e) => setSelectedFixedDomain(e.target.value)}
                      className="mt-2 w-full p-2 text-xs font-bold rounded-lg border border-amber-300 bg-white"
                    >
                      {domains.map((d) => (
                        <option key={d.domain} value={d.domain}>
                          {d.domain}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Add Custom Landing Page Domain */}
          <div className="bg-white rounded-2xl p-6 border-2 border-emerald-100 shadow-sm space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Add Custom Landing Page Domain to Feed</span>
            </h4>
            <form onSubmit={handleAddNewDomain} className="space-y-2">
              <input
                type="text"
                placeholder="e.g. MyNewTimeshareRelief.com"
                value={newDomainInput}
                onChange={(e) => setNewDomainInput(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
              />
              <input
                type="text"
                placeholder="Niche (e.g. Vacation Club Cancellation)"
                value={newDomainNiche}
                onChange={(e) => setNewDomainNiche(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Add Domain to Network
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* COMPREHENSIVE LANDING PAGES DIRECTORY (101 SITES) */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-amber-300 shadow-md space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-amber-200/70">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-800 text-amber-300 border border-amber-400">
                Managed Network
              </span>
              <span className="text-xs font-bold text-emerald-900">
                timeshare.click & Partner Landing Pages ({USER_LANDING_PAGES.length} Sites)
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-emerald-950 tracking-tight">
              Your Connected Timeshare Exit Landing Pages
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              All incoming leads and exported spreadsheets are tagged with these specific URLs. Click any page to copy or set as active feeder tag.
            </p>
          </div>

          {/* Search box for landing pages */}
          <div className="relative min-w-[260px]">
            <Search className="w-4 h-4 text-emerald-700 absolute inset-y-0 left-3 my-auto pointer-events-none" />
            <input
              type="text"
              placeholder="Filter landing pages by resort, city, or niche..."
              value={landingPageSearch}
              onChange={(e) => setLandingPageSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border-2 border-emerald-100 focus:border-amber-400 focus:outline-none bg-slate-50 focus:bg-white font-medium"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {[
            { id: 'ALL', label: `All Sites (${USER_LANDING_PAGES.length})` },
            { id: 'Legal & Situational', label: 'Legal & Situational' },
            { id: 'Developer & Resort', label: 'Developer & Resort' },
            { id: 'Location & Destination', label: 'Destinations & Cities' },
            { id: 'State Law', label: 'State Law Funnels' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setLandingPageFilter(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                landingPageFilter === cat.id
                  ? 'bg-gradient-to-r from-emerald-800 to-emerald-700 text-amber-300 shadow-sm border border-amber-400'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Landing Page Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[520px] overflow-y-auto pr-1">
          {filteredLandingPages.map((lp) => (
            <div
              key={lp.slug}
              className="p-3.5 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/30 transition-all flex flex-col justify-between group bg-white shadow-2xs"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {lp.category}
                  </span>
                  <a
                    href={lp.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-amber-600 transition-colors"
                    title="Open landing page"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <div className="font-extrabold text-xs text-emerald-950 line-clamp-1 group-hover:text-amber-900">
                  {lp.title}
                </div>
                <div className="font-mono text-[11px] text-slate-600 font-semibold mt-1 truncate">
                  {lp.displayUrl}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-[10px]">
                <button
                  type="button"
                  onClick={() => {
                    setTaggingStrategy('fixed');
                    setSelectedFixedDomain(lp.displayUrl);
                    setUploadStatus(`Active tagging locked to: ${lp.displayUrl}`);
                  }}
                  className="font-bold text-emerald-800 hover:text-emerald-950 underline decoration-amber-400 cursor-pointer"
                >
                  Set as Active Tag
                </button>
                <span className="text-slate-400 font-medium">Auto-Tagged</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION: AUTHORIZED USER & CLOSER ACCESS MANAGEMENT */}
      <div id="user-access-section" className="scroll-mt-6">
        <UserAccessManager
          users={users}
          onAddUser={onAddUser || (async () => ({ success: false, message: 'User service unavailable' }))}
          onUpdateUser={onUpdateUser || (async () => ({ success: false, message: 'User service unavailable' }))}
          onDeleteUser={onDeleteUser || (async () => ({ success: false, message: 'User service unavailable' }))}
        />
      </div>

      {/* INTERACTIVE COLUMN MAPPING & PREVIEW MODAL */}
      {isMappingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-sm animate-fade-in font-['Plus_Jakarta_Sans']">
          <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border-2 border-amber-400 overflow-hidden max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white relative">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500" />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950">
                      Smart Column Mapper
                    </span>
                    <span className="text-xs text-amber-200 font-medium">
                      File: {uploadFileName} ({rawRows.length} leads detected)
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Review & Confirm Lead Columns
                  </h3>
                  <p className="text-xs text-emerald-200 mt-1">
                    The engine auto-detected your fields. Confirm Name, Phone, and Resort below. Any missing fields are automatically enriched with realistic exit data.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMappingModalOpen(false)}
                  className="p-1.5 rounded-lg bg-emerald-800/80 hover:bg-emerald-700 text-amber-200 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-white">
              {/* City-As-Name Warning & 1-Click Fix Banner */}
              {isCityMistakenForName && (
                <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-pulse">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                      <div className="text-xs font-black text-amber-950 uppercase tracking-wide">
                        City Detected in Name Field
                      </div>
                      <div className="text-xs text-amber-800 font-medium">
                        The column selected for Client Name contains cities (e.g. {rawRows.slice(0, 2).map(r => String(r[mapping.nameColumn || mapping.firstNameColumn || ''] || '')).join(', ')}). Click below to assign it to City and auto-generate executive client names.
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleFixCityNameMisdetection}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-extrabold text-xs uppercase tracking-wider shrink-0 shadow-sm border border-amber-300 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />
                    <span>Fix: Assign to City</span>
                  </button>
                </div>
              )}

              {/* Column Mapping Selectors Grid */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div className="text-xs font-black uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-700" />
                    <span>Auto-Detected Field Assignments</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleReRunAutoDetection}
                    className="px-3 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer w-fit"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Re-Run Smart Auto-Detect</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                  {/* FIRST NAME */}
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-emerald-950 mb-1 flex items-center justify-between">
                      <span>First Name:</span>
                      {mapping.firstNameColumn && (
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          Detected
                        </span>
                      )}
                    </label>
                    <select
                      value={mapping.firstNameColumn || ''}
                      onChange={(e) => setMapping((m) => ({ ...m, firstNameColumn: e.target.value || undefined }))}
                      className="w-full p-2 text-xs font-bold rounded-xl border-2 border-emerald-300 bg-white text-slate-900 focus:outline-none focus:border-amber-500"
                    >
                      <option value="">-- (None / In Combined Full Name) --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h} {mapping.firstNameColumn === h ? '✓ (Detected First Name)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* LAST NAME */}
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-emerald-950 mb-1 flex items-center justify-between">
                      <span>Last Name:</span>
                      {mapping.lastNameColumn && (
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          Detected
                        </span>
                      )}
                    </label>
                    <select
                      value={mapping.lastNameColumn || ''}
                      onChange={(e) => setMapping((m) => ({ ...m, lastNameColumn: e.target.value || undefined }))}
                      className="w-full p-2 text-xs font-bold rounded-xl border-2 border-emerald-300 bg-white text-slate-900 focus:outline-none focus:border-amber-500"
                    >
                      <option value="">-- (None / In Combined Full Name) --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h} {mapping.lastNameColumn === h ? '✓ (Detected Last Name)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* COMBINED FULL NAME */}
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-emerald-950 mb-1 flex items-center justify-between">
                      <span>Full Name (Single Column):</span>
                      {mapping.nameColumn && (
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          Detected
                        </span>
                      )}
                    </label>
                    <select
                      value={mapping.nameColumn || ''}
                      onChange={(e) => setMapping((m) => ({ ...m, nameColumn: e.target.value || undefined }))}
                      className="w-full p-2 text-xs font-bold rounded-xl border-2 border-emerald-300 bg-white text-slate-900 focus:outline-none focus:border-amber-500"
                    >
                      <option value="">-- (None / Use First + Last Name) --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h} {mapping.nameColumn === h ? '✓ (Detected Full Name)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* PHONE NUMBER */}
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-emerald-950 mb-1 flex items-center justify-between">
                      <span>Phone Number:</span>
                      {mapping.phoneColumn && (
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          Detected
                        </span>
                      )}
                    </label>
                    <select
                      value={mapping.phoneColumn || ''}
                      onChange={(e) => setMapping((m) => ({ ...m, phoneColumn: e.target.value || undefined }))}
                      className="w-full p-2 text-xs font-bold rounded-xl border-2 border-emerald-300 bg-white text-slate-900 focus:outline-none focus:border-amber-500"
                    >
                      <option value="">-- (Auto-generate Realistic Phone) --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h} {mapping.phoneColumn === h ? '✓ (Detected Phone)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* TIMESHARE RESORT */}
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-emerald-950 mb-1 flex items-center justify-between">
                      <span>Resort / Developer:</span>
                      {mapping.resortColumn && (
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          Detected
                        </span>
                      )}
                    </label>
                    <select
                      value={mapping.resortColumn || ''}
                      onChange={(e) => setMapping((m) => ({ ...m, resortColumn: e.target.value || undefined }))}
                      className="w-full p-2 text-xs font-bold rounded-xl border-2 border-emerald-300 bg-white text-slate-900 focus:outline-none focus:border-amber-500"
                    >
                      <option value="">-- (Auto-assign Major Resort) --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h} {mapping.resortColumn === h ? '✓ (Detected Resort)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* CITY */}
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-emerald-950 mb-1 flex items-center justify-between">
                      <span>City / Location:</span>
                      {mapping.cityColumn && (
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          Detected
                        </span>
                      )}
                    </label>
                    <select
                      value={mapping.cityColumn || ''}
                      onChange={(e) => setMapping((m) => ({ ...m, cityColumn: e.target.value || undefined }))}
                      className="w-full p-2 text-xs font-bold rounded-xl border-2 border-emerald-300 bg-white text-slate-900 focus:outline-none focus:border-amber-500"
                    >
                      <option value="">-- (Auto-fill Realistic City) --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h} {mapping.cityColumn === h ? '✓ (Detected City)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* STATE */}
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-emerald-950 mb-1 flex items-center justify-between">
                      <span>State:</span>
                      {mapping.stateColumn && (
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          Detected
                        </span>
                      )}
                    </label>
                    <select
                      value={mapping.stateColumn || ''}
                      onChange={(e) => setMapping((m) => ({ ...m, stateColumn: e.target.value || undefined }))}
                      className="w-full p-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-amber-500"
                    >
                      <option value="">-- (Auto-fill Realistic State) --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h} {mapping.stateColumn === h ? '✓ (Detected State)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* ANNUAL MAINTENANCE FEE */}
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-emerald-950 mb-1 flex items-center justify-between">
                      <span>Annual Maint. Fee:</span>
                      {mapping.feeColumn && (
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          Detected
                        </span>
                      )}
                    </label>
                    <select
                      value={mapping.feeColumn || ''}
                      onChange={(e) => setMapping((m) => ({ ...m, feeColumn: e.target.value || undefined }))}
                      className="w-full p-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-amber-500"
                    >
                      <option value="">-- (Auto-fill Realistic $1,980 - $3,780) --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h} {mapping.feeColumn === h ? '✓ (Detected Fee)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* MORTGAGE BALANCE */}
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-emerald-950 mb-1 flex items-center justify-between">
                      <span>Mortgage Balance:</span>
                      {mapping.mortgageColumn && (
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          Detected
                        </span>
                      )}
                    </label>
                    <select
                      value={mapping.mortgageColumn || ''}
                      onChange={(e) => setMapping((m) => ({ ...m, mortgageColumn: e.target.value || undefined }))}
                      className="w-full p-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-amber-500"
                    >
                      <option value="">-- (Auto-fill $0 Paid Off / Loan) --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h} {mapping.mortgageColumn === h ? '✓ (Detected Mortgage)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* CLOSER / INTAKE NOTES */}
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-emerald-950 mb-1 flex items-center justify-between">
                      <span>Notes / Remarks:</span>
                      {mapping.notesColumn && (
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          Detected
                        </span>
                      )}
                    </label>
                    <select
                      value={mapping.notesColumn || ''}
                      onChange={(e) => setMapping((m) => ({ ...m, notesColumn: e.target.value || undefined }))}
                      className="w-full p-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-amber-500"
                    >
                      <option value="">-- (Auto-generate Verified Inquiry Note) --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h} {mapping.notesColumn === h ? '✓ (Detected Notes)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Converted Preview Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-black uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Real-Time Converted Preview (First 3 Rows):</span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Ready to Import
                  </span>
                </div>

                <div className="overflow-x-auto border-2 border-amber-200 rounded-xl shadow-xs">
                  <table className="w-full text-left text-xs bg-white">
                    <thead className="bg-emerald-950 text-white font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5">Client Full Name</th>
                        <th className="p-2.5">Phone Number</th>
                        <th className="p-2.5">Timeshare Resort</th>
                        <th className="p-2.5">Location</th>
                        <th className="p-2.5">Maint. Fee</th>
                        <th className="p-2.5">Tagged Landing Page</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {previewLeads.slice(0, 3).map((lead, idx) => (
                        <tr key={idx} className="hover:bg-amber-50/50">
                          <td className="p-2.5 font-black text-slate-900">
                            {lead.fullName}
                          </td>
                          <td className="p-2.5 font-bold text-emerald-800 font-mono">
                            {lead.phone}
                          </td>
                          <td className="p-2.5 font-semibold text-slate-800">
                            {lead.resortDeveloper}
                          </td>
                          <td className="p-2.5 text-slate-600">
                            {lead.city}, {lead.state}
                          </td>
                          <td className="p-2.5 font-bold text-amber-900 font-mono">
                            ${(Number(lead.annualMaintenanceFee) || 0).toLocaleString()}/yr
                          </td>
                          <td className="p-2.5 font-mono text-[11px] text-emerald-900 font-bold">
                            {lead.sourceDomain}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 sm:p-6 bg-slate-50 border-t border-amber-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsMappingModalOpen(false)}
                disabled={isImporting}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleStartLiveDrip}
                  disabled={isImporting}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-black text-xs uppercase tracking-wider shadow-lg border-2 border-amber-400 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isImporting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{importProgress || 'Starting 24/7 Drip Engine...'}</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                      <span>Start 24/7 Live Drip (Drip One-by-One in Spreadsheet Order)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CLEAR ALL LEADS FROM FEED CONFIRMATION MODAL */}
      {showClearFeedConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in font-['Plus_Jakarta_Sans']">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border-2 border-red-500 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-red-950 via-slate-900 to-red-950 text-white relative">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-red-500 via-rose-400 to-red-500" />
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-red-600/30 border border-red-500/50 text-red-400">
                    <Trash2 className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white tracking-tight">
                      Clear All Leads From Feed?
                    </h3>
                    <p className="text-xs text-red-200">
                      Administrative Live Feed Reset
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowClearFeedConfirm(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-950 text-xs leading-relaxed space-y-2">
                <div className="font-extrabold flex items-center gap-1.5 text-red-900">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>Warning: This removes all leads currently live</span>
                </div>
                <p>
                  Are you sure you want to remove all <strong className="font-black text-red-900">{liveLeadsCount} active lead(s)</strong> currently displaying in the live closers dispatch feed?
                </p>
                <div className="pt-2 border-t border-red-200 text-[11px] text-red-800 space-y-1">
                  <div>• Claimed leads in the closed vault will <strong className="text-emerald-800">NOT</strong> be deleted.</div>
                  <div>• Leads queued in the slow drip engine ({queue.length} pending) will remain ready to drip.</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClearFeedConfirm(false)}
                  disabled={isClearingFeed}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancel / Keep Feed
                </button>
                <button
                  type="button"
                  onClick={handleConfirmClearFeed}
                  disabled={isClearingFeed}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-red-900/30 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  {isClearingFeed ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Clearing Live Feed...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Yes, Clear All Live Leads</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CLEAR ALL UPLOADED LISTS & QUEUE CONFIRMATION MODAL */}
      {showClearAllConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in font-['Plus_Jakarta_Sans']">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border-2 border-red-500 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-red-950 via-slate-900 to-red-950 text-white relative">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-red-500 via-rose-400 to-red-500" />
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-red-600/30 border border-red-500/50 text-red-400">
                    <Trash2 className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white tracking-tight">
                      Clear All Uploaded Lists & Feeds?
                    </h3>
                    <p className="text-xs text-red-200">
                      Master Reset for New Spreadsheet Uploads
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowClearAllConfirm(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-950 text-xs leading-relaxed space-y-2">
                <div className="font-extrabold flex items-center gap-1.5 text-red-900">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>Complete Database Reset</span>
                </div>
                <p>
                  This action will permanently clear <strong className="font-black text-red-900">all uploaded master lists, queued records, and active live feed leads</strong> so you can cleanly upload your new Excel spreadsheet.
                </p>
                <div className="pt-2 border-t border-red-200 text-[11px] text-red-800 space-y-1">
                  <div>• Master upload spreadsheet queue will be wiped clean.</div>
                  <div>• Active live feed and pending queue will be emptied.</div>
                  <div>• Authorized user logins and claimed vaults will remain safe.</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClearAllConfirm(false)}
                  disabled={isClearingAll}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmClearAllLists}
                  disabled={isClearingAll}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-red-900/30 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  {isClearingAll ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Clearing All Lists...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Yes, Clear All Lists & Queue</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
