import React, { useState, useEffect } from 'react';
import {
  User,
  Shield,
  Key,
  Database,
  Server,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Save,
  Clock,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  fetchSettings,
  updateSettings,
  testApiKey,
  fetchAllDatabases
} from '../services/api';

export default function Account({ onNavigateToDatabases, onNavigateToPlayground }) {
  const [settings, setSettings] = useState(null);
  const [databases, setDatabases] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [model, setModel] = useState('gemini-2.5-flash');
  const [demoMode, setDemoMode] = useState(true);

  // Status feedback
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
        fetchSettings(),
        fetchAllDatabases()
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

  const handleSave = async (e) => {
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
      setSaveStatus({ type: 'success', message: 'Account & AI configuration updated successfully!' });
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
        message: err.response?.data?.detail || err.message || 'Verification request failed',
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (loading && !settings) {
    return (
      <div className="flex-1 p-12 flex flex-col items-center justify-center gap-3 text-zinc-500 text-xs">
        <RefreshCw className="w-6 h-6 animate-spin text-zinc-800" />
        <span>Loading account profile...</span>
      </div>
    );
  }

  const totalRecords = databases.reduce((acc, db) => acc + (db.record_count || 0), 0);

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-8 overflow-y-auto max-w-5xl mx-auto w-full text-left">
      {/* Header Banner */}
      <div className="pb-3 border-b border-zinc-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-700 bg-white border border-zinc-200 px-2.5 py-0.5 rounded-full shadow-xs">
              Account Management
            </span>
            <span className="text-xs text-zinc-400">•</span>
            <span className="text-xs text-zinc-600 font-medium">Developer Workspace Profile</span>
          </div>
          <h2 className="text-2xl font-serif font-bold text-zinc-950 tracking-tight">Account & AI Settings</h2>
          <p className="text-sm text-zinc-600">
            Manage your account identity, connected MongoDB Atlas storage, and Google Gemini API credentials.
          </p>
        </div>

        <button
          onClick={loadAccountData}
          className="glass-button-secondary flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold shadow-xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Account Profile Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-zinc-200/90 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-zinc-950 text-white flex items-center justify-center font-bold text-xl shadow-md">
              <User className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-zinc-950">Developer Workspace</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Active
                </span>
              </div>
              <p className="text-xs text-zinc-500 font-mono">admin@nl2sql.local • Pro Engineer</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateToPlayground}
              className="glass-button-primary px-4 py-2 rounded-full text-xs font-bold"
            >
              Start Querying
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-zinc-200/80">
          <div className="p-3.5 rounded-2xl bg-zinc-50/80 border border-zinc-200/80">
            <span className="text-[11px] text-zinc-500 block">Managed Databases</span>
            <span className="text-xl font-bold text-zinc-950">{databases.length}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-50/80 border border-zinc-200/80">
            <span className="text-[11px] text-zinc-500 block">Total Stored Records</span>
            <span className="text-xl font-bold text-zinc-950">{totalRecords.toLocaleString()}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-50/80 border border-zinc-200/80">
            <span className="text-[11px] text-zinc-500 block">Persistence Storage</span>
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              MongoDB GridFS
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-50/80 border border-zinc-200/80">
            <span className="text-[11px] text-zinc-500 block">SQL Safety Policy</span>
            <span className="text-xs font-bold text-zinc-900 flex items-center gap-1 mt-1">
              <Shield className="w-3.5 h-3.5 text-zinc-700" />
              SELECT-Only
            </span>
          </div>
        </div>
      </div>

      {/* AI Credentials Configuration Form */}
      <form onSubmit={handleSave} className="glass-card rounded-3xl p-6 sm:p-8 border border-zinc-200/90 shadow-xs space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-zinc-800" />
            <h4 className="text-base font-bold text-zinc-950">AI & Prompt Engineering Provider</h4>
          </div>
          <p className="text-xs text-zinc-500">
            Configure Google Gemini API key or toggle intelligent heuristic Demo Mode.
          </p>
        </div>

        {saveStatus && (
          <div className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
            saveStatus.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            {saveStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
            <span>{saveStatus.message}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* API Key */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-800 mb-1.5">
              Google Gemini API Key:
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={settings?.masked_api_key ? `Existing Key: ${settings.masked_api_key}` : 'Enter your Gemini API key...'}
                className="glass-input w-full pl-4 pr-10 py-2.5 rounded-xl text-xs font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Your key is saved in backend environment variables and never exposed to client-side browsers.
            </p>
          </div>

          {/* Model Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-800 mb-1.5">
                Gemini Model:
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="glass-input w-full px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended - Fastest)</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep Relational Reasoning)</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Standard)</option>
              </select>
            </div>

            {/* Demo Mode Toggle */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-800 mb-1.5">
                Execution Mode:
              </label>
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setDemoMode(!demoMode)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    demoMode ? 'bg-zinc-950' : 'bg-zinc-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      demoMode ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className="text-xs text-zinc-700 font-medium">
                  {demoMode ? 'Intelligent Heuristic Demo Mode' : 'Live Gemini Cloud API'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-zinc-200/80">
          <button
            type="button"
            onClick={handleTestKey}
            disabled={isTesting}
            className="glass-button-secondary px-4 py-2 rounded-full text-xs font-semibold shadow-xs flex items-center gap-1.5"
          >
            {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5 text-zinc-600" />}
            <span>{isTesting ? 'Testing Key...' : 'Verify API Key'}</span>
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="glass-button-primary px-6 py-2 rounded-full text-xs font-bold flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>

        {testStatus && (
          <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
            testStatus.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            {testStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
            <span>{testStatus.message}</span>
          </div>
        )}
      </form>
    </div>
  );
}
