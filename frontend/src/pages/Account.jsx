import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Lock,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Key,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import {
  fetchSettings,
  updateSettings,
  testApiKey,
  fetchAllDatabases
} from '../services/api';

export default function Account({ onNavigateToDatabases, onNavigateToPlayground, onOpenAuth }) {
  const [settings, setSettings] = useState(null);
  const [databases, setDatabases] = useState([]);
  const [loading, setLoading] = useState(true);

  // User Profile State
  const [name, setName] = useState('Khushi');
  const [email, setEmail] = useState('khushi@nl2sql.local');
  const [memberSince] = useState('November 2024');

  // Change Email State
  const [newEmailInput, setNewEmailInput] = useState('');
  const [emailStatus, setEmailStatus] = useState(null);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Logout State
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggedOut, setLoggedOut] = useState(false);

  // AI & API Key Drawer (Optional / Collapsed)
  const [showAiSettings, setShowAiSettings] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [model, setModel] = useState('gemini-2.5-flash');
  const [demoMode, setDemoMode] = useState(true);
  const [saveStatus, setSaveStatus] = useState(null);
  const [testStatus, setTestStatus] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadAccountData();
  }, []);

  const loadAccountData = async () => {
    try {
      setLoading(true);
      const [settingsData, dbData] = await Promise.all([
        fetchSettings().catch(() => ({})),
        fetchAllDatabases().catch(() => ({ databases: [] }))
      ]);
      setSettings(settingsData);
      setModel(settingsData.gemini_model || 'gemini-2.5-flash');
      setDemoMode(settingsData.demo_mode ?? true);
      setDatabases(dbData.databases || []);
    } catch (err) {
      console.error('Failed to load account settings', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Change Email
  const handleChangeEmail = (e) => {
    e.preventDefault();
    setEmailStatus(null);

    const trimmed = newEmailInput.trim();
    if (!trimmed) {
      setEmailStatus({ type: 'error', message: 'Please enter a valid email address.' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailStatus({ type: 'error', message: 'Please enter a properly formatted email.' });
      return;
    }

    setIsUpdatingEmail(true);
    setTimeout(() => {
      setEmail(trimmed);
      setNewEmailInput('');
      setIsUpdatingEmail(false);
      setEmailStatus({ type: 'success', message: 'Email address updated successfully!' });
    }, 450);
  };

  // Handle Change Password
  const handleChangePassword = (e) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (!currentPassword) {
      setPasswordStatus({ type: 'error', message: 'Please enter your current password.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordStatus({ type: 'error', message: 'New password must be at least 6 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'New passwords do not match. Please verify.' });
      return;
    }

    setIsUpdatingPassword(true);
    setTimeout(() => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsUpdatingPassword(false);
      setPasswordStatus({ type: 'success', message: 'Password changed successfully!' });
    }, 500);
  };

  // Handle Logout
  const handleLogout = () => {
    setLoggedOut(true);
    setShowLogoutConfirm(false);
  };

  // Handle AI Key Save
  const handleSaveAi = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus(null);

    try {
      const payload = {
        gemini_model: model,
        demo_mode: demoMode,
      };
      if (apiKey.trim()) {
        payload.gemini_api_key = apiKey.trim();
      }

      const res = await updateSettings(payload);
      setSaveStatus({ type: 'success', message: 'AI configuration updated successfully!' });
      setSettings((prev) => ({ ...prev, ...res.settings }));
      setApiKey('');
    } catch (err) {
      setSaveStatus({ type: 'error', message: err.message || 'Failed to update settings' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestKey = async () => {
    const keyToTest = apiKey.trim() || (settings?.masked_api_key ? 'EXISTING' : '');
    if (!keyToTest) {
      setTestStatus({ type: 'error', message: 'Please enter a Gemini API key to verify.' });
      return;
    }

    setIsTesting(true);
    setTestStatus(null);

    try {
      const res = await testApiKey(apiKey.trim() || 'EXISTING', model);
      if (res.valid) {
        setTestStatus({ type: 'success', message: res.message });
      } else {
        setTestStatus({ type: 'error', message: res.message });
      }
    } catch (err) {
      setTestStatus({
        type: 'error',
        message: err.response?.data?.detail || err.message || 'Verification failed',
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (loggedOut) {
    return (
      <div className="flex-1 px-4 py-20 flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-950 flex items-center justify-center mx-auto shadow-2xs">
          <LogOut className="w-6 h-6 text-zinc-700" />
        </div>
        <h3 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-zinc-950">
          Signed Out Successfully
        </h3>
        <p className="text-xs sm:text-sm text-zinc-500 font-normal leading-relaxed">
          Your workspace session has been terminated safely.
        </p>
        <button
          onClick={() => {
            setLoggedOut(false);
            if (onOpenAuth) onOpenAuth('login');
          }}
          className="px-6 py-2.5 rounded-full bg-black hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
        >
          Sign Back In
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 px-4 sm:px-8 lg:px-12 pt-1 pb-6 space-y-4 max-w-6xl mx-auto w-full text-left">
      {/* Header Banner */}
      <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-medium text-zinc-950 tracking-tight">
            Account Settings
          </h2>
          <p className="text-xs text-zinc-500 font-normal">
            Manage your personal profile, credentials, and security.
          </p>
        </div>

        <button
          onClick={loadAccountData}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white hover:bg-zinc-50 text-zinc-800 border border-zinc-200 shadow-2xs transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin text-zinc-800' : 'text-zinc-500'}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Main 2-Column Content Layout (Zero Scroll Viewport Fit) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* ======================================================== */}
        {/* LEFT COLUMN: Clean Profile Card                          */}
        {/* ======================================================== */}
        <div className="lg:col-span-4 bg-white border border-zinc-200/80 rounded-2xl p-5 flex flex-col items-center text-center shadow-2xs space-y-4">
          
          {/* Circular Account Picture */}
          <div className="relative group">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-zinc-950 via-zinc-800 to-zinc-700 text-white flex items-center justify-center font-serif text-2xl font-medium shadow-md border-3 border-white ring-1 ring-zinc-200/80">
              {name.charAt(0).toUpperCase()}
            </div>
            <div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white absolute bottom-0.5 right-0.5" title="Online" />
          </div>

          {/* Name & Mail */}
          <div className="space-y-0.5">
            <h3 className="font-serif text-xl font-medium text-zinc-950 tracking-tight">
              {name}
            </h3>
            <p className="text-xs text-zinc-500 font-normal font-sans">
              {email}
            </p>
          </div>

          {/* Status Badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-[10px] font-semibold text-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            <span>Active Member</span>
          </div>

          {/* Account Meta List */}
          <div className="w-full pt-3 border-t border-zinc-100 space-y-2 text-xs text-left">
            <div className="flex items-center justify-between text-zinc-500 text-[11px]">
              <span className="font-normal">Member Since</span>
              <span className="font-medium text-zinc-900">{memberSince}</span>
            </div>
            <div className="flex items-center justify-between text-zinc-500 text-[11px]">
              <span className="font-normal">Connected DBs</span>
              <span className="font-medium text-zinc-900">{databases.length}</span>
            </div>
            <div className="flex items-center justify-between text-zinc-500 text-[11px]">
              <span className="font-normal">Storage</span>
              <span className="font-medium text-zinc-900">MongoDB GridFS</span>
            </div>
          </div>

          {/* Quick Logout Button */}
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full py-2 rounded-full border border-rose-200 text-rose-700 hover:bg-rose-50 hover:border-rose-300 text-xs font-semibold shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: Change Email & Change Password             */}
        {/* ======================================================== */}
        <div className="lg:col-span-8 space-y-3.5">
          
          {/* CARD 1: CHANGE EMAIL */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 sm:p-5 space-y-3 shadow-2xs text-left">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-zinc-800" />
                <h4 className="font-serif text-base sm:text-lg font-medium tracking-tight text-zinc-950">
                  Change Email Address
                </h4>
              </div>
              <p className="text-[11px] text-zinc-500 font-normal leading-relaxed">
                Update the primary email address associated with your account.
              </p>
            </div>

            {emailStatus && (
              <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                emailStatus.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
                  : 'bg-rose-50 text-rose-800 border border-rose-200/80'
              }`}>
                {emailStatus.type === 'success' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                )}
                <span>{emailStatus.message}</span>
              </div>
            )}

            <form onSubmit={handleChangeEmail} className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-800 mb-1">
                  Current Email:
                </label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-500 font-sans cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-800 mb-1">
                  New Email Address:
                </label>
                <input
                  type="email"
                  value={newEmailInput}
                  onChange={(e) => setNewEmailInput(e.target.value)}
                  placeholder="e.g. khushi.new@example.com"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 bg-white text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 shadow-2xs transition-all"
                />
              </div>

              <div className="flex justify-end pt-0.5">
                <button
                  type="submit"
                  disabled={isUpdatingEmail || !newEmailInput.trim()}
                  className="px-5 py-1.5 rounded-full bg-black hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-40 active:scale-95"
                >
                  {isUpdatingEmail ? 'Updating...' : 'Change Email'}
                </button>
              </div>
            </form>
          </div>

          {/* CARD 2: CHANGE PASSWORD */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 sm:p-5 space-y-3 shadow-2xs text-left">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-zinc-800" />
                <h4 className="font-serif text-base sm:text-lg font-medium tracking-tight text-zinc-950">
                  Change Password
                </h4>
              </div>
              <p className="text-[11px] text-zinc-500 font-normal leading-relaxed">
                Ensure your account is protected with a strong, confidential password.
              </p>
            </div>

            {passwordStatus && (
              <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                passwordStatus.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
                  : 'bg-rose-50 text-rose-800 border border-rose-200/80'
              }`}>
                {passwordStatus.type === 'success' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                )}
                <span>{passwordStatus.message}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-800 mb-1">
                  Current Password:
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password..."
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 bg-white text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 shadow-2xs transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-800 mb-1">
                    New Password:
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters..."
                      className="w-full px-3 pr-8 py-1.5 text-xs rounded-lg border border-zinc-200 bg-white text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 shadow-2xs transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-800 mb-1">
                    Confirm New Password:
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password..."
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 bg-white text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 shadow-2xs transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-0.5">
                <button
                  type="submit"
                  disabled={isUpdatingPassword || !currentPassword || !newPassword}
                  className="px-5 py-1.5 rounded-full bg-black hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-40 active:scale-95"
                >
                  {isUpdatingPassword ? 'Updating...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-zinc-200/80 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <LogOut className="w-5 h-5" />
            </div>
            <h4 className="font-serif text-xl font-medium tracking-tight text-zinc-950">
              Sign Out of Account?
            </h4>
            <p className="text-xs text-zinc-500 font-normal leading-relaxed">
              Are you sure you want to log out of your current workspace session?
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 rounded-full border border-zinc-200 text-zinc-700 text-xs font-semibold hover:bg-zinc-50 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
