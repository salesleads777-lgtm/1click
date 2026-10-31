import React from 'react';
import { Lead } from '../types/lead';
import { Globe, DollarSign, BellRing, X, ArrowUpRight, ShieldAlert, Sparkles } from 'lucide-react';

interface LiveNotificationToastProps {
  lead: Lead | null;
  onDismiss: () => void;
  onViewLead: (lead: Lead) => void;
  onClaimLead: (lead: Lead) => void;
}

export const LiveNotificationToast: React.FC<LiveNotificationToastProps> = ({
  lead,
  onDismiss,
  onViewLead,
  onClaimLead,
}) => {
  if (!lead) return null;

  return (
    <div className="fixed top-5 right-4 sm:right-6 z-50 max-w-md w-full animate-bounce-short transition-all duration-300">
      {/* Real Gold & Emerald Card Container */}
      <div className="relative rounded-2xl p-[2px] bg-gradient-to-r from-amber-400 via-yellow-400 to-emerald-600 shadow-[0_12px_36px_rgba(217,119,6,0.35)]">
        <div className="bg-white rounded-[14px] p-4 sm:p-5 relative overflow-hidden">
          {/* Subtle real gold foil corner accent */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-400/20 to-transparent pointer-events-none rounded-tr-[14px]" />

          {/* Top Bar with Live Indicator */}
          <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-amber-200/60">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-gradient-to-r from-amber-500 to-yellow-500" />
              </span>
              <div className="flex items-center gap-1.5">
                <BellRing className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider text-emerald-950">
                  LIVE INCOMING LEAD ARRIVED!
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                Just now
              </span>
              <button
                onClick={onDismiss}
                className="text-slate-400 hover:text-slate-700 p-0.5 rounded-md hover:bg-slate-100 transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Prominent Landing Page Source Domain Badge */}
          <div className="mb-3">
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-900 mb-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Source Landing Page Domain:
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/10 via-yellow-400/15 to-emerald-500/10 border-2 border-amber-400 text-slate-900 font-bold text-xs sm:text-sm">
              <Globe className="w-4 h-4 text-emerald-700 shrink-0" />
              <span className="font-mono text-emerald-950 truncate tracking-tight">
                {lead.sourceDomain}
              </span>
              <span className="ml-auto shrink-0 px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-xs">
                VERIFIED SOURCE
              </span>
            </div>
          </div>

          {/* Lead Information Snippet */}
          <div className="space-y-1.5 text-xs">
            <div className="flex items-baseline justify-between">
              <span className="font-extrabold text-slate-900 text-sm">
                {lead.fullName}
              </span>
              <span className="text-slate-500 font-medium">
                {lead.city}, {lead.state}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-bold text-[11px] border border-emerald-300">
                {lead.resortDeveloper}
              </span>
              <span className="inline-flex items-center gap-0.5 text-amber-900 font-bold text-[11px] bg-amber-50 px-2 py-0.5 rounded-md border border-amber-300">
                <DollarSign className="w-3 h-3 text-amber-600" />
                ${lead.annualMaintenanceFee.toLocaleString()}/yr Fee
              </span>
              {lead.mortgageBalance > 0 ? (
                <span className="text-[11px] text-red-700 font-semibold bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                  Owes ${lead.mortgageBalance.toLocaleString()}
                </span>
              ) : (
                <span className="text-[11px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Paid Off Deed
                </span>
              )}
            </div>

            <div className="text-[11px] text-slate-600 line-clamp-1 italic pt-1 border-t border-slate-100">
              "{lead.disputeReason}"
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-3.5 pt-2 flex items-center gap-2">
            <button
              onClick={() => onClaimLead(lead)}
              className="flex-1 py-2 px-3 rounded-lg bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-extrabold text-xs uppercase tracking-wider shadow-sm border border-amber-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Claim Lead</span>
            </button>
            <button
              onClick={() => onViewLead(lead)}
              className="py-2 px-3 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold text-xs border border-amber-400 flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <span>View Dossier</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-amber-700" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
