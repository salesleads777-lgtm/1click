import React from 'react';
import { BrandLogo } from './BrandLogo';
import {
  Bell,
  BellOff,
  Sliders,
  Radio,
  Lock,
  LogOut,
  FileSpreadsheet,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { Lead } from '../types/lead';

interface NavbarProps {
  currentTab: 'feed' | 'admin';
  onTabChange: (tab: 'feed' | 'admin') => void;
  isAdminAuthenticated?: boolean;
  onOpenAdminLogin?: () => void;
  onLockAdmin?: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onLogout: () => void;
  totalLeadsCount: number;
  newLeadsCount: number;
  leads: Lead[];
  claimedLeadsCount?: number;
  onExportClaimed?: () => void;
  onOpenClaimedVault?: () => void;
  queueCount: number;
  isDripActive: boolean;
  domainsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  isAdminAuthenticated = false,
  onOpenAdminLogin,
  onLockAdmin,
  soundEnabled,
  onToggleSound,
  onLogout,
  totalLeadsCount,
  newLeadsCount,
  leads,
  claimedLeadsCount = 0,
  onExportClaimed,
  onOpenClaimedVault,
  queueCount,
  isDripActive,
  domainsCount = 101,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b-2 border-amber-300 shadow-sm font-['Plus_Jakarta_Sans']">
      {/* Luxury Real Gold Thin Top Line */}
      <div className="h-1 w-full bg-gradient-to-r from-emerald-800 via-amber-400 to-yellow-500" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Brand Logo in Rich Green & Real Gold */}
          <div className="flex items-center gap-4">
            <BrandLogo size="md" />

            {/* Live Radar Pill */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-300 text-xs font-bold text-emerald-900 shadow-xs">
              <span className="relative flex h-2.5 w-2.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isDripActive ? 'bg-amber-400' : 'bg-slate-400'} opacity-75`} />
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isDripActive ? 'bg-emerald-600' : 'bg-slate-500'}`} />
              </span>
              <span>{isDripActive ? 'LIVE DISPATCH STREAM ACTIVE' : 'STREAM STANDBY'}</span>
              <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded font-mono font-black">
                {domainsCount} SITES ONLINE
              </span>
            </div>
          </div>

          {/* Navigation Mode Switcher: Live Exit Leads Feed vs Admin Login */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200">
            <button
              onClick={() => onTabChange('feed')}
              className={`px-3.5 sm:px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                currentTab === 'feed'
                  ? 'bg-gradient-to-r from-emerald-800 to-emerald-700 text-white shadow-md border border-amber-400/50'
                  : 'text-slate-600 hover:text-emerald-950 hover:bg-white/60'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-amber-400" />
              <span>Live Exit Leads Feed</span>
              {newLeadsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-400 text-slate-950 font-black">
                  {newLeadsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                if (isAdminAuthenticated) {
                  onTabChange('admin');
                } else if (onOpenAdminLogin) {
                  onOpenAdminLogin();
                }
              }}
              title={isAdminAuthenticated ? 'Admin Portal Active' : 'Admin Login (Protected with Password)'}
              className={`px-3.5 sm:px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                currentTab === 'admin'
                  ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 shadow-md border border-amber-500 font-black'
                  : 'text-slate-600 hover:text-emerald-950 hover:bg-white/60'
              }`}
            >
              {isAdminAuthenticated ? (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-900" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-amber-600" />
              )}
              <span>{isAdminAuthenticated ? 'Admin Portal' : 'Admin Login'}</span>
              {queueCount > 0 && isAdminAuthenticated && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-900 text-amber-300 font-bold">
                  {queueCount} Q
                </span>
              )}
            </button>
          </div>

          {/* Right Action Tools: Audio Ping, Export Claimed, Logout (Notice: Drop Lead Now button removed from user page!) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* If in admin tab and authenticated, provide quick lock option */}
            {currentTab === 'admin' && isAdminAuthenticated && onLockAdmin && (
              <button
                onClick={onLockAdmin}
                title="Lock Admin Session & Return to Live Feed"
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                <span>Lock Admin</span>
              </button>
            )}

            {/* Export Claimed Vault button */}
            {claimedLeadsCount > 0 && onExportClaimed && (
              <button
                onClick={onExportClaimed}
                title="Download Excel (.xlsx) for your Claimed Vault leads"
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-extrabold text-xs uppercase tracking-wider border border-amber-300 shadow-xs transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-amber-300" />
                <span>Export Vault ({claimedLeadsCount})</span>
              </button>
            )}

            {/* Refresh Site Button */}
            <button
              onClick={() => window.location.reload()}
              title="Refresh Site"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-emerald-800" />
            </button>

            {/* Sound chime toggle */}
            <button
              onClick={onToggleSound}
              title={soundEnabled ? 'Lead Arrival Chime: ON' : 'Lead Arrival Chime: MUTED'}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                soundEnabled
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
              }`}
            >
              {soundEnabled ? (
                <Bell className="w-4 h-4 text-amber-600" />
              ) : (
                <BellOff className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-2 rounded-xl text-slate-500 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
