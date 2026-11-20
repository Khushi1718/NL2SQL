import React from 'react';
import {
  LayoutDashboard,
  Terminal,
  Database,
  History,
  Cpu,
  Settings,
  Sparkles,
  Server,
  ExternalLink
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, healthInfo }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'playground', label: 'SQL Playground', icon: Terminal, highlight: true },
    { id: 'explorer', label: 'Database Explorer', icon: Database },
    { id: 'history', label: 'Query History', icon: History },
    { id: 'prompt', label: 'Prompt Engineering', icon: Cpu },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800/80 gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
          <Terminal className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-white tracking-tight text-base">NL2SQL</span>
            <span className="text-[10px] font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded">v1.0</span>
          </div>
          <p className="text-[11px] text-slate-400">NL to SQL Engine</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Main Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.highlight && !isActive && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Status Card */}
      <div className="p-3 border-t border-slate-800/80">
        <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Server className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs font-medium text-slate-200">SQLite Engine</span>
            </div>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Active
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>AI Provider:</span>
            <span className="text-slate-300 font-medium">
              {healthInfo?.gemini_configured ? 'Gemini 2.5' : 'Demo Mode'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
