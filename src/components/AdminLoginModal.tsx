import React, { useState } from 'react';
import { ShieldCheck, Lock, User, Eye, EyeOff, AlertCircle, X, CheckCircle2 } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    // Verification check for administrator credentials via backend API
    try {
      const res = await fetch('/api/auth/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUser, password: cleanPass }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsSuccess(true);
        setTimeout(() => {
          setIsLoading(false);
          setIsSuccess(false);
          onSuccess();
        }, 500);
        return;
      }
    } catch {
      // Offline fallback
    }

    // Local cached users check
    try {
      const cachedUsersStr = localStorage.getItem('1click_users');
      if (cachedUsersStr) {
        const cachedUsers = JSON.parse(cachedUsersStr);
        if (Array.isArray(cachedUsers)) {
          const matched = cachedUsers.find(
            (u: { username: string; password: string; role?: string; status?: string }) =>
              u.username.trim().toLowerCase() === cleanUser &&
              u.password === cleanPass &&
              u.role === 'admin' &&
              u.status === 'active'
          );
          if (matched) {
            setIsSuccess(true);
            setTimeout(() => {
              setIsLoading(false);
              setIsSuccess(false);
              onSuccess();
            }, 500);
            return;
          }
        }
      }
    } catch {
      // ignore
    }

    // Master fallback
    if (cleanUser === 'salesleads777@gmail.com' && cleanPass === 'Mafioso2356$') {
      setIsSuccess(true);
      setTimeout(() => {
        setIsLoading(false);
        setIsSuccess(false);
        onSuccess();
      }, 500);
      return;
    }

    setTimeout(() => {
      setIsLoading(false);
      setErrorMessage('Access Denied: Invalid administrator username or password.');
    }, 350);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn font-['Plus_Jakarta_Sans']">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border-2 border-amber-400 overflow-hidden">
        {/* Luxury Gold & Emerald Top Header Accent */}
        <div className="h-2 w-full bg-gradient-to-r from-emerald-800 via-amber-400 to-yellow-500" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8">
          {/* Header Icon & Title */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-900 to-emerald-800 text-amber-400 flex items-center justify-center shadow-md border border-amber-300">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-emerald-950">Admin Login</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                  Protected
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Restricted access for authorized administrators only
              </p>
            </div>
          </div>



          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span className="font-semibold">{errorMessage}</span>
            </div>
          )}

          {/* Success Banner */}
          {isSuccess && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 flex items-center gap-2 font-bold animate-pulse">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Admin verification successful! Entering control room...</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Admin Username / Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter administrator username or email"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 text-sm font-semibold text-slate-800 bg-white transition-all outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Admin Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter administrator password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 text-sm font-semibold text-slate-800 bg-white transition-all outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-800 hover:from-emerald-700 hover:to-emerald-800 text-white font-extrabold text-xs uppercase tracking-wider shadow-md border border-amber-300 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Verifying...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-amber-300" />
                    <span>Enter Admin</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
