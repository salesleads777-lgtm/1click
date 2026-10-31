import React, { useState } from 'react';
import { Lead } from '../types/lead';
import {
  X,
  Phone,
  Mail,
  MapPin,
  Building,
  DollarSign,
  Calendar,
  Globe,
  Sparkles,
  CheckCircle,
  Clock,
  Shield,
  Copy,
  ExternalLink,
  MessageSquare,
  FileSpreadsheet,
  Trash2,
} from 'lucide-react';
import { exportLeadsToExcel } from '../utils/export';

interface LeadDetailModalProps {
  lead: Lead | null;
  onClose: () => void;
  onUpdateStatus: (leadId: string, newStatus: Lead['status']) => void;
  onClaimLead: (lead: Lead) => void;
  onDeleteClaimedLead?: (leadId: string) => void;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  lead,
  onClose,
  onUpdateStatus,
  onClaimLead,
  onDeleteClaimedLead,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'closer_script' | 'attribution'>('details');

  if (!lead) return null;

  const handleCopy = () => {
    const text = `
=== 1CLICKEXITS TIMESHARE EXIT DOSSIER ===
LEAD ID: ${lead.id}
CLIENT: ${lead.fullName}
PHONE: ${lead.phone}
EMAIL: ${lead.email}
LOCATION: ${lead.city}, ${lead.state} ${lead.zipCode}

TIMESHARE DETAILS:
DEVELOPER: ${lead.resortDeveloper} (${lead.resortName || 'Contract Deed'})
ANNUAL MAINTENANCE FEE: $${lead.annualMaintenanceFee.toLocaleString()}/yr
MORTGAGE BALANCE: $${lead.mortgageBalance.toLocaleString()}
YEARS OWNED: ${lead.yearsOwned} Years
TYPE: ${lead.timeshareType}

LANDING PAGE ATTRIBUTION:
SOURCE DOMAIN: ${lead.sourceDomain}
CAMPAIGN URL: ${lead.landingPageUrl}
CAMPAIGN SOURCE: ${lead.campaignSource}
IP ADDRESS: ${lead.ipAddress}

CLIENT DISPUTE / STATEMENT:
"${lead.disputeReason}"

INTENT RATING: ${lead.intentScore}%
URGENCY: ${lead.urgency}
STATUS: ${lead.status}
NOTES: ${lead.notes || 'None'}
=========================================
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 10-year projected fees at 7.5% annual compounded increase
  const projected10Years = Math.round(
    lead.annualMaintenanceFee * ((Math.pow(1.075, 10) - 1) / 0.075)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in font-['Plus_Jakarta_Sans']">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border-2 border-amber-400 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Top Metallic Gold & Green Banner */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-950 text-white relative">
          {/* Gold highlight accent line */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500" />

          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-black/40 text-amber-300 border border-amber-400/40 font-bold">
                  {lead.id}
                </span>
                <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950">
                  {lead.urgency} URGENCY
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-700/80 text-emerald-100 border border-emerald-500/30">
                  {lead.intentScore}% Exit Viability Score
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>{lead.fullName}</span>
                <span className="text-sm font-semibold text-amber-200">
                  ({lead.city}, {lead.state})
                </span>
              </h2>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-emerald-800/80 hover:bg-emerald-700 text-amber-200 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Contact Bar */}
          <div className="mt-4 pt-3 border-t border-emerald-700/60 flex flex-wrap items-center gap-3 text-xs">
            <a
              href={`tel:${lead.phone}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-emerald-950 font-bold hover:bg-amber-50 border border-amber-300 transition-colors shadow-xs"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-700" />
              <span>{lead.phone}</span>
            </a>
            <a
              href={`mailto:${lead.email}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-emerald-950 font-bold hover:bg-amber-50 border border-amber-300 transition-colors shadow-xs"
            >
              <Mail className="w-3.5 h-3.5 text-emerald-700" />
              <span>{lead.email}</span>
            </a>
            <div className="flex items-center gap-1.5 text-emerald-200 ml-auto">
              <Clock className="w-3.5 h-3.5 text-amber-300" />
              <span>Received: {new Date(lead.timestamp).toLocaleTimeString()} ({lead.receivedAgo || 'Live feed'})</span>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-50 border-b border-amber-200/80 px-4 sm:px-6 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-2 py-2">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'details'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-emerald-900 hover:bg-emerald-100/60'
              }`}
            >
              Timeshare & Financial Details
            </button>
            <button
              onClick={() => setActiveTab('attribution')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'attribution'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-emerald-900 hover:bg-amber-100/60'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Source Landing Page Tag</span>
            </button>
            <button
              onClick={() => setActiveTab('closer_script')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'closer_script'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-emerald-900 hover:bg-emerald-100/60'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
              <span>Closer Objection Script</span>
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="text-xs font-bold text-emerald-900 hover:text-emerald-950 px-2.5 py-1 rounded-md border border-amber-300 bg-white hover:bg-amber-50 flex items-center gap-1.5 transition-colors shrink-0"
          >
            <Copy className="w-3.5 h-3.5 text-amber-600" />
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Dossier'}</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-white">
          {/* TAB 1: DETAILS */}
          {activeTab === 'details' && (
            <>
              {/* Prominent Tagged Source Landing Page Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 via-yellow-50 to-emerald-50 border-2 border-amber-400 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>ORIGINATING LANDING PAGE SOURCE DOMAIN (VERIFIED)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-700 text-amber-200">
                    Lead Tagged
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="font-mono font-bold text-sm text-emerald-950 bg-white px-2.5 py-1 rounded border border-amber-300">
                      {lead.sourceDomain}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 font-medium">
                    Campaign: <span className="font-semibold text-slate-800">{lead.campaignSource}</span>
                  </div>
                </div>
              </div>

              {/* Financial & Contract Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-emerald-900 tracking-wider">
                    Developer
                  </div>
                  <div className="text-base font-extrabold text-slate-900 mt-0.5 truncate">
                    {lead.resortDeveloper}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {lead.resortName || 'Deeded Club'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-300">
                  <div className="text-[10px] uppercase font-bold text-amber-900 tracking-wider">
                    Annual Maintenance
                  </div>
                  <div className="text-base font-extrabold text-amber-900 mt-0.5">
                    ${lead.annualMaintenanceFee.toLocaleString()}/yr
                  </div>
                  <div className="text-[11px] text-amber-800 font-medium">
                    +7-10% typical hike
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-emerald-900 tracking-wider">
                    Mortgage Balance
                  </div>
                  <div className="text-base font-extrabold mt-0.5">
                    {lead.mortgageBalance > 0 ? (
                      <span className="text-red-700">${lead.mortgageBalance.toLocaleString()}</span>
                    ) : (
                      <span className="text-emerald-700">$0 (Paid Off)</span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {lead.mortgageBalance > 0 ? 'Active Loan Note' : 'Clean Title / Deed'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-emerald-900 tracking-wider">
                    Years Owned
                  </div>
                  <div className="text-base font-extrabold text-slate-900 mt-0.5">
                    {lead.yearsOwned} Years
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Type: {lead.timeshareType}
                  </div>
                </div>
              </div>

              {/* 10-Year Compounded Financial Burden Analysis (Closer Leverage) */}
              <div className="p-4 rounded-xl bg-emerald-950 text-white relative overflow-hidden border border-amber-400">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-amber-400" />
                    <span>Client's 10-Year Maintenance Bleed Risk (If Not Exited)</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-300">
                    Calculated Compounded Total:
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <div>
                    <div className="text-2xl sm:text-3xl font-black text-amber-400">
                      ${projected10Years.toLocaleString()}
                    </div>
                    <div className="text-xs text-emerald-200 mt-1">
                      Based on current ${lead.annualMaintenanceFee.toLocaleString()}/yr fee escalating at conservative 7.5% annual developer assessment rate.
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-1 rounded bg-amber-400/20 text-amber-300 text-xs font-extrabold border border-amber-400/40">
                      High Closer Leverage
                    </span>
                  </div>
                </div>
              </div>

              {/* Client Statement / Dispute Reason */}
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-950 mb-2">
                  Client Stated Grievance & Reason for Exit:
                </h4>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 leading-relaxed font-medium">
                  "{lead.disputeReason}"
                </div>
              </div>

              {/* Status and Closer Assignment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-emerald-950 mb-1.5">
                    Update Pipeline Status:
                  </label>
                  <select
                    value={lead.status}
                    onChange={(e) => onUpdateStatus(lead.id, e.target.value as Lead['status'])}
                    className="w-full px-3 py-2 rounded-xl bg-white border-2 border-emerald-200 text-sm font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                  >
                    <option value="NEW">NEW LEAD (Uncontacted)</option>
                    <option value="CLAIMED">CLAIMED (Assigned)</option>
                    <option value="CONTACTED">CONTACTED (Spoke with Client)</option>
                    <option value="IN_PROGRESS">IN PROGRESS (Contract Review)</option>
                    <option value="EXIT_SIGNED">EXIT RETAINER SIGNED 🏆</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-emerald-950 mb-1.5">
                    Assigned Closer:
                  </label>
                  <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 flex items-center justify-between">
                    <span>
                      {typeof lead.claimedBy === 'object' && lead.claimedBy !== null
                        ? ((lead.claimedBy as any).username || (lead.claimedBy as any).name || 'Assigned Closer')
                        : (lead.claimedBy || 'Unclaimed / Available to All')}
                    </span>
                    {!lead.claimedBy && (
                      <button
                        onClick={() => onClaimLead(lead)}
                        className="text-xs font-bold text-amber-900 bg-amber-300 hover:bg-amber-400 px-2 py-0.5 rounded cursor-pointer transition-colors"
                      >
                        Claim for Me
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: LANDING PAGE ATTRIBUTION */}
          {activeTab === 'attribution' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <h3 className="text-sm font-black text-emerald-950 uppercase tracking-wider flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-700" />
                  <span>Landing Page Lead Source Provenance</span>
                </h3>
                <p className="text-xs text-emerald-800 mt-1">
                  This lead completed an opt-in questionnaire specifically on your managed exit network. When downloaded to Excel, it will be tagged with this domain.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-[11px] font-bold text-slate-500 uppercase">Tagged Domain:</div>
                  <div className="text-base font-mono font-bold text-emerald-900 mt-0.5 flex items-center justify-between">
                    <span>{lead.sourceDomain}</span>
                    <a
                      href={`https://${lead.sourceDomain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-amber-700 hover:text-amber-800 flex items-center gap-1 font-sans"
                    >
                      <span>Preview Domain</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-[11px] font-bold text-slate-500 uppercase">Landing Page URL with Tracking:</div>
                  <div className="text-xs font-mono text-slate-700 mt-1 break-all bg-white p-2 rounded border border-slate-200">
                    {lead.landingPageUrl}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="text-[11px] font-bold text-slate-500 uppercase">Campaign Medium:</div>
                    <div className="text-sm font-semibold text-slate-800 mt-0.5">{lead.campaignSource}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="text-[11px] font-bold text-slate-500 uppercase">User IP & Geolocation:</div>
                    <div className="text-sm font-mono font-semibold text-slate-800 mt-0.5">{lead.ipAddress}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CLOSER OBJECTION SCRIPT */}
          {activeTab === 'closer_script' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-300">
                <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm uppercase">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Recommended Opening Pitch for {lead.resortDeveloper} Owner</span>
                </div>
                <p className="text-xs text-amber-800 mt-1">
                  Reference their specific intake from <span className="font-bold underline">{lead.sourceDomain}</span> for instant rapport.
                </p>
              </div>

              <div className="space-y-3 text-xs sm:text-sm">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="font-bold text-emerald-950 mb-1 uppercase text-xs">
                    Step 1: The Trust Opener (Verifying Lead Intake)
                  </div>
                  <div className="italic text-slate-700 leading-relaxed bg-white p-2.5 rounded border border-slate-200">
                    "Hello {lead.firstName}, I'm following up regarding the timeshare relief inquiry you submitted just a few moments ago on our <span className="font-semibold text-emerald-800">{lead.sourceDomain}</span> portal concerning your {lead.resortDeveloper} contract. You noted your annual fees are at ${lead.annualMaintenanceFee.toLocaleString()} and continuing to climb. Is this still the best number to reach you?"
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="font-bold text-emerald-950 mb-1 uppercase text-xs">
                    Step 2: Perpetuity & 10-Year Bleed Contrast
                  </div>
                  <div className="italic text-slate-700 leading-relaxed bg-white p-2.5 rounded border border-slate-200">
                    "Most {lead.resortDeveloper} owners don't realize that in just 10 years, you will have paid over <span className="font-bold text-amber-900">${projected10Years.toLocaleString()}</span> in escalating maintenance fees and special assessments for a property you can't even book when you want. Our legal divestment team specializes in complete, permanent deed release so your family is never burdened with this debt."
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="font-bold text-emerald-950 mb-1 uppercase text-xs">
                    Step 3: The Close to Retainer
                  </div>
                  <div className="italic text-slate-700 leading-relaxed bg-white p-2.5 rounded border border-slate-200">
                    "Because your contract has strong grounds for misrepresentation based on your statement '{lead.disputeReason}', our legal team can take over communication immediately. Let's send over our guaranteed divestment engagement so we can halt any further billing cycles."
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-amber-200/80 flex flex-wrap items-center justify-between gap-3">
          {lead.status === 'CLAIMED' || lead.claimedBy ? (
            <button
              onClick={() => exportLeadsToExcel([lead], `1ClickLeads_Claimed_${lead.id}_Export`)}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-900 font-bold text-xs border border-emerald-300 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>Export Claimed Lead (Excel .XLSX)</span>
            </button>
          ) : (
            <button
              onClick={() => {
                onClaimLead(lead);
                exportLeadsToExcel(
                  [{ ...lead, status: 'CLAIMED', claimedBy: 'Current Closer', claimedAt: new Date().toISOString() }],
                  `1ClickLeads_Claimed_${lead.id}_Export`
                );
              }}
              title="Claims lead, removes it from live database, and downloads Excel (.xlsx)"
              className="px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 font-extrabold text-xs border border-amber-400 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-700" />
              <span>Claim & Export to Excel (.XLSX)</span>
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
            >
              Close Dossier
            </button>
            {lead.status !== 'CLAIMED' && !lead.claimedBy ? (
              <button
                onClick={() => {
                  onClaimLead(lead);
                  onClose();
                }}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-extrabold text-xs uppercase tracking-wider shadow-md border border-amber-300 flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4 text-amber-300" />
                <span>Claim & Remove from Database</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="px-3.5 py-2 rounded-xl bg-emerald-100 text-emerald-950 font-black text-xs border border-emerald-300 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-700" />
                  <span>Claimed in Your Vault</span>
                </span>

                <button
                  type="button"
                  onClick={() => {
                    exportLeadsToExcel([lead], `1ClickLeads_${lead.id}_Claimed`);
                  }}
                  className="px-3 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider border border-amber-300 flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Export lead to Excel (.xlsx)"
                >
                  <FileSpreadsheet className="w-4 h-4 text-amber-300" />
                  <span>Export</span>
                </button>

                {onDeleteClaimedLead && (
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteClaimedLead(lead.id);
                      onClose();
                    }}
                    className="px-3 py-2 rounded-xl bg-white hover:bg-red-50 text-red-700 font-extrabold text-xs uppercase tracking-wider border border-red-300 flex items-center gap-1.5 cursor-pointer transition-colors"
                    title="Remove/clear this lead from your Claimed Vault"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                    <span>Clear from Vault</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
