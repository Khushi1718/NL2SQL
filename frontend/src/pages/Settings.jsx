import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Key,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Database,
  RefreshCw,
  Eye,
  EyeOff,
  Server,
  Save,
  RotateCcw
} from 'lucide-react';
import {
  fetchSettings,
  updateSettings,
  testApiKey,
  resetDatabase
} from '../services/api';

export default function Settings({ onSettingsUpdated }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [model, setModel] = useState('gemini-2.5-flash');
  const [demoMode, setDemoMode] = useState(false);

  // Status feedback
  const [saveStatus, setSaveStatus] = useState(null);
  const [testStatus, setTestStatus] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await fetchSettings();
      setSettings(data);
      setModel(data.gemini_model || 'gemini-2.5-flash');
      setDemoMode(data.demo_mode ?? true);
    } catch (err) {
      console.error('Failed to load settings', err);
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
      setSaveStatus({ type: 'success', message: 'Settings saved successfully!' });
      setSettings((prev) => ({ ...prev, ...res.settings }));
      setApiKey('');
      if (onSettingsUpdated) onSettingsUpdated();
    } catch (err) {
      setSaveStatus({ type: 'error', message: err.message || 'Failed to save settings' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestKey = async () => {
    const keyToTest = apiKey.trim() || (settings?.masked_api_key ? 'EXISTING' : '');
    if (!keyToTest) {
      setTestStatus({ type: 'error', message: 'Please enter a Gemini API key to test.' });
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
        message: err.response?.data?.detail || err.message || 'API test request failed',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleResetDb = async () => {
    if (!window.confirm('Reset database? This will clear any uploaded tables and restore standard sample records for Students, Courses, Enrollments, Employees, Departments, Customers, and Orders.')) {
      return;
    }

    setIsResetting(true);
    try {
      await resetDatabase();
      alert('Database successfully reset to realistic sample records.');
      if (onSettingsUpdated) onSettingsUpdated();
    } catch (err) {
      alert('Error resetting database: ' + err.message);
    } finally {
      setIsResetting(false);
    }
  };

  if (loading && !settings) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">System & AI Settings</h2>
        <p className="text-sm text-slate-500">
          Manage Google Gemini API connection, execution modes, security parameters, and database state.
        </p>
      </div>

      {saveStatus && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
            saveStatus.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {saveStatus.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{saveStatus.message}</span>
        </div>
      )}

      {/* AI Configuration Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">LLM Provider Configuration</h3>
            <p className="text-xs text-slate-500">Connect to Google Gemini API or use the built-in Intelligent Demo Mode</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* API Key */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">Google Gemini API Key:</label>
              {settings?.gemini_api_key_configured && (
                <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium border border-emerald-200">
                  Configured: {settings.masked_api_key}
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={settings?.gemini_api_key_configured ? 'Enter new key to update...' : 'Enter your AIza... Gemini API key'}
                className="w-full px-3 py-2 pr-10 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500 font-mono text-xs"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              API keys are kept strictly in backend memory and environment variables. Never exposed to frontend clients.
            </p>
          </div>

          {/* Model selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Gemini Model:</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500 bg-white"
              >
                {(settings?.supported_models || ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro']).map((m) => (
                  <option key={m} value={m}>
                    {m} (Recommended)
                  </option>
                ))}
              </select>
            </div>

            {/* Demo Mode Toggle */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Execution Mode:</label>
              <div className="flex items-center gap-3 pt-1">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={demoMode}
                    onChange={(e) => setDemoMode(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  <span className="ml-2 text-xs font-medium text-slate-700">
                    {demoMode ? 'Intelligent Demo Mode (Active)' : 'Live LLM API Calls'}
                  </span>
                </label>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                In Demo Mode, queries are answered using built-in heuristic and few-shot engines without requiring an API key.
              </p>
            </div>
          </div>

          {/* Test Status feedback */}
          {testStatus && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                testStatus.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {testStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{testStatus.message}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleTestKey}
              disabled={isTesting}
              className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold shadow-sm transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Safety & Execution Limits Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4 text-xs">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">SQL Safety & Execution Guardrails</h3>
            <p className="text-slate-500">Enforced by backend AST validators and database driver</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
            <span className="font-semibold text-slate-700">Query Timeout:</span>
            <p className="text-slate-500">{settings?.query_timeout_seconds || 5} seconds maximum</p>
          </div>
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
            <span className="font-semibold text-slate-700">Max Row Limit:</span>
            <p className="text-slate-500">Clamped to {settings?.max_rows_limit || 500} rows per query</p>
          </div>
        </div>

        <ul className="list-disc pl-5 text-slate-600 space-y-1 text-[11px]">
          <li>Strictly SELECT statements permitted. Modifying statements (INSERT, UPDATE, DELETE, DROP, ALTER) are blocked before driver execution.</li>
          <li>Multiple queries chained via semicolons are parsed and rejected.</li>
          <li>Tables referenced in generated SQL must exist in the live SQLite schema.</li>
        </ul>
      </div>

      {/* Database Maintenance Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4 text-xs">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Database Management</h3>
            <p className="text-slate-500">Reset sample tables and re-populate benchmark datasets</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-slate-800">Restore Benchmark Data:</p>
            <p className="text-[11px] text-slate-500">
              Restores Students, Courses, Enrollments, Employees, Departments, Customers, and Orders.
            </p>
          </div>
          <button
            onClick={handleResetDb}
            disabled={isResetting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold shadow-sm transition-colors"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span>{isResetting ? 'Resetting...' : 'Reset Database'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
