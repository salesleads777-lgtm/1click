import React, { useState } from 'react';
import { BrandLogo } from './BrandLogo';
import { ShieldCheck, Lock, User, ArrowRight, CheckCircle2, Globe2, Sparkles, Building2 } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (username: string, role: 'buyer' | 'admin') => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUser, password: cleanPass }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const usernameStr =
          typeof data.user === 'object' && data.user !== null
            ? (data.user.username || data.user.name || cleanUser)
            : (typeof data.user === 'string' ? data.user : cleanUser);
        const userRole: 'buyer' | 'admin' = data.role === 'admin' ? 'admin' : 'buyer';
        sessionStorage.setItem('1click_current_user', JSON.stringify(usernameStr));
        onLoginSuccess(usernameStr, userRole);
        return;
      } else if (res.status === 403) {
        setErrorMessage(data.message || 'Account suspended. Contact administrator.');
        setIsLoading(false);
        return;
      }
    } catch {
      // Backend request error - check local users cache
    }

    // Local cached users fallback verification
    try {
      const cachedUsersStr = localStorage.getItem('1click_users');
      if (cachedUsersStr) {
        const cachedUsers = JSON.parse(cachedUsersStr);
        if (Array.isArray(cachedUsers)) {
          const matched = cachedUsers.find(
            (u: { username: string; password: string; status?: string; role?: 'buyer' | 'admin' }) =>
              (u.username.trim().toLowerCase() === cleanUser || u.username.trim() === username.trim()) &&
              (u.password === cleanPass || u.password.trim() === cleanPass)
          );
          if (matched) {
            if (matched.status === 'suspended') {
              setErrorMessage('Account suspended. Contact administrator.');
              setIsLoading(false);
              return;
            }
            const usernameStr = matched.username.trim();
            const userRole: 'buyer' | 'admin' = matched.role === 'admin' ? 'admin' : 'buyer';
            sessionStorage.setItem('1click_current_user', JSON.stringify(usernameStr));
            onLoginSuccess(usernameStr, userRole);
            return;
          }
        }
      }
    } catch {
      // ignore
    }

    // Hardcoded master fallbacks
    if (cleanUser === 'salesleads777@gmail.com' && cleanPass === 'Mafioso2356$') {
      sessionStorage.setItem('1click_current_user', JSON.stringify('salesleads777@gmail.com'));
      onLoginSuccess('salesleads777@gmail.com', 'admin');
      return;
    }
    if (cleanUser === '1clickleads' && cleanPass === '1clickadmin') {
      sessionStorage.setItem('1click_current_user', JSON.stringify('1clickleads'));
      onLoginSuccess('1clickleads', 'buyer');
      return;
    }

    setErrorMessage('Invalid username or password. Please try again.');
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col justify-between selection:bg-emerald-100 selection:text-emerald-900 relative overflow-hidden font-['Plus_Jakarta_Sans']">
      {/* Decorative Gold & Emerald Top Border */}
      <div className="h-2 w-full bg-gradient-to-r from-emerald-800 via-amber-400 to-emerald-700 shadow-md" />

      {/* Subtle luxury geometric grid background on pure white */}
      <div className="absolute inset-0 bg-[radial-gradient(#059669_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.035] pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between border-b border-amber-200/50 bg-white/80 backdrop-blur-sm">
        <BrandLogo size="md" />
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>100+ Live Landing Page Feeds Online</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-300 text-amber-900 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Exclusive Exit Dispatch</span>
          </div>
        </div>
      </header>

      {/* Main Login Card Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Executive Gold Foil Surrounding Glow */}
          <div className="relative rounded-3xl p-1 bg-gradient-to-b from-amber-300 via-amber-200 to-emerald-600 shadow-[0_20px_50px_rgba(217,119,6,0.18)]">
            <div className="bg-white rounded-[22px] p-8 sm:p-10 relative">
              {/* Gold luxury ribbon top tag */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 text-[11px] font-black uppercase tracking-wider shadow-md flex items-center gap-1.5 border border-amber-300">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-950" />
                Timeshare Exit Portal
              </div>

              {/* Title Header */}
              <div className="text-center mt-2 mb-8">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-950 tracking-tight">
                  Client Login
                </h1>
                <p className="text-sm text-emerald-800/80 mt-2 font-medium">
                  Direct real-time stream from certified cancellation landing pages
                </p>
              </div>

              {/* Error Notice */}
              {errorMessage && (
                <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2.5 animate-shake">
                  <div className="w-2 h-2 rounded-full bg-red-500 mt-1 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-emerald-950 mb-1.5">
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-700">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter username"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border-2 border-emerald-100 text-slate-900 placeholder-slate-400 font-medium text-sm focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-400/20 transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-emerald-950 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-700">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border-2 border-emerald-100 text-slate-900 placeholder-slate-400 font-medium text-sm focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-400/20 transition-all shadow-sm"
                    />
                  </div>
                </div>

                {/* Submit Button in Rich Green & Real Gold Border */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-4 py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-900 hover:from-emerald-700 hover:to-emerald-800 text-white font-extrabold text-sm uppercase tracking-wider shadow-[0_4px_20px_rgba(5,150,105,0.35)] border-2 border-amber-400/60 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-amber-300 border-t-transparent rounded-full animate-spin" />
                      <span>Verifying Portal Access...</span>
                    </div>
                  ) : (
                    <>
                      <span>Enter Live Dispatch</span>
                      <ArrowRight className="w-4 h-4 text-amber-300" />
                    </>
                  )}
                </button>
              </form>

              {/* Security & Features Guarantee */}
              <div className="mt-8 pt-6 border-t border-slate-100 space-y-2.5">
                <div className="flex items-center gap-2 text-xs text-emerald-900 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Verified 100% Timeshare Exit Qualified Traffic</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-900 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Direct Attribution to 100+ High-Intent Exit Domains</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-900 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Password-Protected Admin Portal Included</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick note for user */}
          <div className="mt-6 text-center text-xs text-slate-500 font-medium">
            Protected Timeshare Relinquishment Network • 256-Bit SSL Feed
          </div>
        </div>
      </main>

      {/* Footer with Supported Resort Networks */}
      <footer className="relative z-10 border-t border-amber-200/50 bg-slate-50/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-emerald-950 font-bold">
            <Building2 className="w-4 h-4 text-amber-600" />
            <span>Active Exit Developer Funnels:</span>
            <span className="text-emerald-800 font-medium">
              Wyndham • Westgate • Diamond Resorts • Marriott Vacation Club • Bluegreen • Hilton • Holiday Inn Club • Disney Vacation Club
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-600 font-semibold">
            <Globe2 className="w-4 h-4 text-emerald-700" />
            <span>Landing Page Source Tagging Active on All Exports</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
