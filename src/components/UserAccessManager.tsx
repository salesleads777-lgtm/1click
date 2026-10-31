import React, { useState } from 'react';
import { AppUser } from '../types/user';
import {
  Users,
  UserPlus,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  Eye,
  EyeOff,
  Trash2,
  Edit2,
  Lock,
  User,
  Sparkles,
  Search,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Power,
  X,
} from 'lucide-react';

interface UserAccessManagerProps {
  users: AppUser[];
  onAddUser: (user: {
    username: string;
    password: string;
    role: 'buyer' | 'admin';
    name?: string;
    notes?: string;
  }) => Promise<{ success: boolean; message?: string }>;
  onUpdateUser: (
    id: string,
    updates: Partial<AppUser>
  ) => Promise<{ success: boolean; message?: string }>;
  onDeleteUser: (id: string) => Promise<{ success: boolean; message?: string }>;
}

export const UserAccessManager: React.FC<UserAccessManagerProps> = ({
  users,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
}) => {
  // New user form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'buyer' | 'admin'>('buyer');
  const [notes, setNotes] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formFeedback, setFormFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'buyer' | 'admin'>('all');

  // Password visibility for existing users
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  // Copy feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edit user modal
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [editPassword, setEditPassword] = useState('');
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<'buyer' | 'admin'>('buyer');
  const [editStatus, setEditStatus] = useState<'active' | 'suspended'>('active');
  const [editNotes, setEditNotes] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editFeedback, setEditFeedback] = useState<string | null>(null);

  // Delete confirm modal
  const [deletingUser, setDeletingUser] = useState<AppUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const generateRandomPassword = () => {
    const prefixes = ['Closer', 'Exit', 'Prime', 'Titan', 'Apex', 'Falcon'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(1000 + Math.random() * 9000);
    const symbols = ['!', '@', '#', '$'];
    const sym = symbols[Math.floor(Math.random() * symbols.length)];
    const gen = `${prefix}${num}${sym}`;
    setPassword(gen);
    setShowNewPassword(true);
  };

  const handleCopyCredentials = (u: AppUser) => {
    const loginUrl = window.location.origin;
    const text = `1CLICK EXITS - PORTAL LOGIN CREDENTIALS
URL: ${loginUrl}
Role: ${u.role === 'admin' ? 'Administrator' : 'Client / Closer'}
Username: ${u.username}
Password: ${u.password}`;

    navigator.clipboard.writeText(text);
    setCopiedId(u.id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2500);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormFeedback(null);

    const cleanUser = username.trim();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setFormFeedback({ type: 'error', message: 'Username and password are required.' });
      return;
    }

    if (cleanUser.length < 3) {
      setFormFeedback({ type: 'error', message: 'Username must be at least 3 characters.' });
      return;
    }

    if (cleanPass.length < 4) {
      setFormFeedback({ type: 'error', message: 'Password must be at least 4 characters.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onAddUser({
        username: cleanUser,
        password: cleanPass,
        role,
        name: name.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      if (result.success) {
        setFormFeedback({
          type: 'success',
          message: `User "${cleanUser}" created! They can now log into the main site immediately.`,
        });
        setUsername('');
        setPassword('');
        setName('');
        setNotes('');
        setRole('buyer');
        setShowNewPassword(false);
        setTimeout(() => setFormFeedback(null), 6000);
      } else {
        setFormFeedback({
          type: 'error',
          message: result.message || 'Failed to create user. Username may already exist.',
        });
      }
    } catch {
      setFormFeedback({ type: 'error', message: 'Error adding user. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (u: AppUser) => {
    setEditingUser(u);
    setEditPassword(u.password);
    setEditName(u.name || '');
    setEditRole(u.role);
    setEditStatus(u.status);
    setEditNotes(u.notes || '');
    setEditFeedback(null);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    setIsSavingEdit(true);
    setEditFeedback(null);

    try {
      const result = await onUpdateUser(editingUser.id, {
        password: editPassword.trim() || undefined,
        name: editName.trim() || undefined,
        role: editRole,
        status: editStatus,
        notes: editNotes.trim() || undefined,
      });

      if (result.success) {
        setEditingUser(null);
      } else {
        setEditFeedback(result.message || 'Failed to update user.');
      }
    } catch {
      setEditFeedback('Error saving changes.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    setIsDeleting(true);

    try {
      const result = await onDeleteUser(deletingUser.id);
      if (result.success) {
        setDeletingUser(null);
      } else {
        alert(result.message || 'Failed to delete user.');
      }
    } catch {
      alert('Error deleting user.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (u: AppUser) => {
    const nextStatus = u.status === 'active' ? 'suspended' : 'active';
    await onUpdateUser(u.id, { status: nextStatus });
  };

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        u.username.toLowerCase().includes(q) ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.notes && u.notes.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const totalClosers = users.filter((u) => u.role === 'buyer').length;
  const totalAdmins = users.filter((u) => u.role === 'admin').length;
  const activeCount = users.filter((u) => u.status === 'active').length;

  return (
    <div className="bg-white rounded-3xl border-2 border-emerald-100 shadow-sm overflow-hidden font-['Plus_Jakarta_Sans']">
      {/* Top Banner Header */}
      <div className="p-6 sm:p-8 bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white relative">
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-amber-400/20 border border-amber-300/40 text-amber-300 shrink-0 shadow-inner">
              <KeyRound className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950">
                  Site Access & Security
                </span>
                <span className="text-xs text-emerald-300 font-medium">
                  Direct Live Login Provisioning
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Authorized Client Logins & User Management
              </h3>
              <p className="text-xs text-emerald-200 mt-1 max-w-2xl">
                Add usernames and passwords to grant immediate access to the main 1ClickExits portal. Credentials created here allow your closers and clients to log in from the main login screen.
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <div className="px-3.5 py-2 rounded-xl bg-emerald-900/80 border border-emerald-700/60 text-center min-w-[70px]">
              <div className="text-[10px] font-bold uppercase text-emerald-300">Active</div>
              <div className="text-lg font-black text-amber-300">{activeCount}</div>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-emerald-900/80 border border-emerald-700/60 text-center min-w-[70px]">
              <div className="text-[10px] font-bold uppercase text-emerald-300">Closers</div>
              <div className="text-lg font-black text-white">{totalClosers}</div>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-emerald-900/80 border border-emerald-700/60 text-center min-w-[70px]">
              <div className="text-[10px] font-bold uppercase text-emerald-300">Admins</div>
              <div className="text-lg font-black text-amber-400">{totalAdmins}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-8">
        {/* ADD USER CARD */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-50/70 via-white to-amber-50/50 border-2 border-emerald-200/80 shadow-sm relative">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-emerald-100">
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-800" />
              <h4 className="text-base font-extrabold text-emerald-950">
                Add New User (Grant Main Site Access)
              </h4>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-100/60 px-2.5 py-1 rounded-full border border-emerald-200">
              Live Instantly
            </span>
          </div>

          {formFeedback && (
            <div
              className={`mb-4 p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 animate-fade-in ${
                formFeedback.type === 'success'
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : 'bg-red-50 text-red-900 border border-red-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {formFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>{formFeedback.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setFormFeedback(null)}
                className="text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Username Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-950 mb-1.5">
                  Username / Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-700">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. closer_dan or dan@closerdesk.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border-2 border-emerald-100 text-slate-900 placeholder-slate-400 font-semibold text-xs focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-300/30 transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-emerald-950">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[10px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1 cursor-pointer hover:underline"
                  >
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    <span>Auto-Generate</span>
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-700">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-white border-2 border-emerald-100 text-slate-900 placeholder-slate-400 font-semibold text-xs focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-300/30 transition-all shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Closer Display Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-950 mb-1.5">
                  Closer / Client Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dan Miller (Desk 1)"
                  className="w-full px-3 py-2.5 rounded-xl bg-white border-2 border-emerald-100 text-slate-900 placeholder-slate-400 font-semibold text-xs focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-300/30 transition-all shadow-sm"
                />
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-950 mb-1.5">
                  Portal Access Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'buyer' | 'admin')}
                  className="w-full px-3 py-2.5 rounded-xl bg-white border-2 border-emerald-100 text-slate-900 font-bold text-xs focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-300/30 transition-all shadow-sm cursor-pointer"
                >
                  <option value="buyer">Closer / Client (Main Site)</option>
                  <option value="admin">Administrator (Site + Admin Panel)</option>
                </select>
              </div>
            </div>

            {/* Optional Notes & Submit Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes (e.g. VIP closer, Florida branch, daily quota, etc.)"
                className="flex-1 px-3 py-2 rounded-xl bg-white border border-emerald-100 text-slate-700 placeholder-slate-400 text-xs focus:outline-none focus:border-emerald-300"
              />

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-900 hover:from-emerald-700 hover:to-emerald-800 text-white font-extrabold text-xs uppercase tracking-wider shadow-md border-2 border-amber-300 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                    <span>Authorizing User...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 text-amber-300" />
                    <span>Create User & Grant Access</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* USERS LIST TABLE SECTION */}
        <div>
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-800" />
              <h4 className="text-base font-extrabold text-emerald-950">
                Active Authorized Users ({filteredUsers.length})
              </h4>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Search input */}
              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search user or closer..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Role filter */}
              <div className="flex rounded-xl bg-slate-100 p-0.5 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setRoleFilter('all')}
                  className={`px-2.5 py-1 rounded-lg cursor-pointer transition-colors ${
                    roleFilter === 'all'
                      ? 'bg-white text-emerald-950 shadow-sm font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({users.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter('buyer')}
                  className={`px-2.5 py-1 rounded-lg cursor-pointer transition-colors ${
                    roleFilter === 'buyer'
                      ? 'bg-white text-emerald-950 shadow-sm font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Closers ({totalClosers})
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter('admin')}
                  className={`px-2.5 py-1 rounded-lg cursor-pointer transition-colors ${
                    roleFilter === 'admin'
                      ? 'bg-white text-emerald-950 shadow-sm font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Admins ({totalAdmins})
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] uppercase tracking-wider font-extrabold text-slate-600">
                  <th className="py-3 px-4">User / Closer</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Password</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created / Last Login</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 font-medium">
                      No authorized users found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isVisible = visiblePasswords[u.id];
                    const isCopied = copiedId === u.id;
                    const isMasterAdmin = u.username.toLowerCase() === 'salesleads777@gmail.com';

                    return (
                      <tr
                        key={u.id}
                        className={`hover:bg-emerald-50/40 transition-colors ${
                          u.status === 'suspended' ? 'bg-slate-50/60 opacity-75' : ''
                        }`}
                      >
                        {/* User / Closer */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                                u.role === 'admin'
                                  ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-sm'
                                  : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              }`}
                            >
                              {(u.name || u.username).charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                                <span>{u.username}</span>
                                {isMasterAdmin && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300">
                                    Owner
                                  </span>
                                )}
                              </div>
                              {u.name && (
                                <div className="text-[11px] text-slate-500 font-medium">
                                  {u.name}
                                </div>
                              )}
                              {u.notes && (
                                <div className="text-[10px] text-slate-400 italic">
                                  {u.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="py-3 px-4">
                          {u.role === 'admin' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[10px] uppercase tracking-wider">
                              <ShieldCheck className="w-3 h-3 text-amber-700" />
                              Administrator
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[10px] uppercase tracking-wider">
                              <User className="w-3 h-3 text-emerald-600" />
                              Closer / Client
                            </span>
                          )}
                        </td>

                        {/* Password */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-900 font-bold select-all min-w-[90px] text-center">
                              {isVisible ? u.password : '••••••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility(u.id)}
                              className="p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                              title={isVisible ? 'Hide password' : 'View password'}
                            >
                              {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopyCredentials(u)}
                              className={`p-1 rounded-md transition-colors cursor-pointer ${
                                isCopied
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'text-slate-400 hover:text-amber-700'
                              }`}
                              title="Copy Login Credentials"
                            >
                              {isCopied ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(u)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-colors cursor-pointer ${
                              u.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                                : 'bg-red-100 text-red-800 hover:bg-red-200 border border-red-300'
                            }`}
                            title="Click to toggle status"
                          >
                            <Power className="w-2.5 h-2.5" />
                            <span>{u.status === 'active' ? 'Active' : 'Suspended'}</span>
                          </button>
                        </td>

                        {/* Dates */}
                        <td className="py-3 px-4 text-[11px] text-slate-500">
                          <div>Added: {new Date(u.createdAt).toLocaleDateString()}</div>
                          {u.lastLoginAt ? (
                            <div className="text-[10px] text-emerald-700 font-semibold">
                              Last Login: {new Date(u.lastLoginAt).toLocaleDateString()}
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-400 italic">Never logged in</div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditModal(u)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-800 hover:bg-emerald-50 transition-colors cursor-pointer"
                              title="Edit User"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {!isMasterAdmin && (
                              <button
                                type="button"
                                onClick={() => setDeletingUser(u)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                                title="Delete User"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
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
      </div>

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border-2 border-emerald-500 overflow-hidden flex flex-col">
            <div className="p-5 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-white relative">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500" />
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-black text-white">Edit User Credentials</h4>
                  <p className="text-xs text-emerald-300">User: {editingUser.username}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="p-1 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {editFeedback && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 border border-red-200">
                  {editFeedback}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-800 mb-1">Display / Closer Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Change Password</label>
                <input
                  type="text"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Access Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as 'buyer' | 'admin')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="buyer">Closer / Client</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Account Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as 'active' | 'suspended')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Notes</label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={isSavingEdit}
                  className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold uppercase tracking-wider cursor-pointer border border-amber-300"
                >
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border-2 border-red-500 overflow-hidden flex flex-col">
            <div className="p-5 bg-gradient-to-r from-red-950 via-slate-900 to-red-950 text-white relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-400" />
                  <h4 className="text-base font-black text-white">Revoke User Access?</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setDeletingUser(null)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-700 leading-relaxed">
                Are you sure you want to permanently delete user{' '}
                <strong className="text-slate-950 font-black">{deletingUser.username}</strong>?
                This user will no longer be able to log into the main site.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingUser(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-wider cursor-pointer"
                >
                  {isDeleting ? 'Deleting...' : 'Delete User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
