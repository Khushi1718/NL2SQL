import React, { useState } from 'react';
import { Check, Database, Zap, Layers, Server, Sparkles, RefreshCw } from 'lucide-react';

export default function DatabaseHeroGraphic({ onNavigateToPlayground }) {
  const [activePromptIndex, setActivePromptIndex] = useState(0);

  const heroDemos = [
    {
      q: "Show top 5 performers in IPL 2024",
      table: "players",
      sql: `SELECT player, runs\nFROM players\nORDER BY runs DESC\nLIMIT 5;`,
      time: "1.1ms",
      rows: 5
    },
    {
      q: "Find top 5 customers by purchase amount",
      table: "customers",
      sql: `SELECT name, total_spend\nFROM customers\nORDER BY total_spend DESC\nLIMIT 5;`,
      time: "1.4ms",
      rows: 5
    },
    {
      q: "Show all students scoring more than 80 marks",
      table: "students",
      sql: `SELECT first_name, major, score\nFROM students\nWHERE score > 80\nORDER BY score DESC;`,
      time: "0.9ms",
      rows: 7
    }
  ];

  const current = heroDemos[activePromptIndex];

  return (
    <div className="relative w-full max-w-xl mx-auto flex flex-col items-center">
      {/* Ambient background glow and sparkle stars */}
      <div className="absolute -top-10 -right-8 w-64 h-64 bg-zinc-200/40 rounded-full blur-3xl pointer-events-none" />
      <span className="absolute -top-6 right-6 text-zinc-900 font-bold text-lg select-none pointer-events-none animate-pulse">✦</span>
      <span className="absolute bottom-4 -left-6 text-zinc-600 font-bold text-sm select-none pointer-events-none">✦</span>
      <span className="absolute top-1/2 -right-8 text-zinc-700 font-bold text-xs select-none pointer-events-none">✦</span>

      {/* Top Floating Prompt Pill with Interactive Switcher */}
      <div className="w-full max-w-md mb-4 z-20">
        <div
          onClick={() => setActivePromptIndex((prev) => (prev + 1) % heroDemos.length)}
          className="group flex items-center justify-between gap-3 px-4 py-2.5 rounded-full bg-white/90 backdrop-blur-xl border border-black/[0.08] shadow-[0_8px_20px_-4px_rgba(0,0,0,0.06)] hover:border-black/25 hover:shadow-[0_12px_28px_-6px_rgba(0,0,0,0.1)] transition-all cursor-pointer select-none"
          title="Click to cycle example natural language queries"
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <span className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center text-xs shrink-0 text-zinc-700">
              👤
            </span>
            <span className="font-medium text-xs text-zinc-800 truncate">
              {current.q}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 text-zinc-400 group-hover:text-zinc-800 transition-colors">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider">Cycle</span>
            <RefreshCw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" />
          </div>
        </div>
      </div>

      {/* Main Vector Stage: Database Node + Terminal Cluster */}
      <div className="w-full rounded-3xl bg-white/60 backdrop-blur-2xl border border-white/90 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.03)] p-5 sm:p-6 space-y-4 relative overflow-hidden">
        
        {/* Header Ribbon of the cluster */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200/70 text-xs">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-300"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-300"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-400"></span>
            </div>
            <span className="font-mono text-[11px] font-semibold text-zinc-700 ml-1">
              nl2sql-relational-cluster
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span>LIVE</span>
            </span>
            <span className="text-[11px] font-mono text-zinc-400">SQLite + GridFS</span>
          </div>
        </div>

        {/* Dual Component Composition: Left Database Architecture Vector, Right Live Terminal */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
          
          {/* Left: Vector Handcrafted Database Isometric Stack */}
          <div className="sm:col-span-5 flex flex-col items-center justify-center py-2 relative">
            <div className="relative w-44 h-48 flex items-center justify-center animate-disk-glow">
              <svg viewBox="0 0 180 200" className="w-full h-full overflow-visible drop-shadow-[0_12px_24px_rgba(0,0,0,0.08)]">
                <defs>
                  {/* Metallic Precision Silver/Chrome Gradients */}
                  <linearGradient id="dbPlateGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="35%" stopColor="#e8edf5" />
                    <stop offset="70%" stopColor="#cbd5e1" />
                    <stop offset="100%" stopColor="#94a3b8" />
                  </linearGradient>

                  <linearGradient id="dbBodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#64748b" />
                    <stop offset="20%" stopColor="#cbd5e1" />
                    <stop offset="50%" stopColor="#f1f5f9" />
                    <stop offset="80%" stopColor="#94a3b8" />
                    <stop offset="100%" stopColor="#475569" />
                  </linearGradient>

                  <linearGradient id="specularGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.4" />
                  </linearGradient>

                  <linearGradient id="dataBusLine" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#09090b" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>

                {/* Base Platter Ring */}
                <ellipse cx="90" cy="172" rx="76" ry="18" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
                <ellipse cx="90" cy="170" rx="74" ry="16" fill="url(#dbPlateGrad)" />

                {/* Connecting Relational Bus Lines with animated pulses */}
                <path
                  d="M 90 25 C 145 25, 160 85, 175 95"
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  className="animate-dash-flow"
                />
                <circle cx="175" cy="95" r="3.5" fill="#10b981" className="animate-data-pulse" />

                {/* TIER 3 (Bottom Disk) */}
                <path d="M 32 120 A 58 16 0 0 0 148 120 V 146 A 58 16 0 0 1 32 146 Z" fill="url(#dbBodyGrad)" />
                <ellipse cx="90" cy="120" rx="58" ry="16" fill="url(#dbPlateGrad)" stroke="#94a3b8" strokeWidth="0.8" />
                {/* Micro Activity LED */}
                <circle cx="50" cy="133" r="2" fill="#10b981" className="animate-led-blink" />
                <line x1="58" y1="133" x2="128" y2="133" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" />

                {/* TIER 2 (Middle Disk) */}
                <path d="M 32 80 A 58 16 0 0 0 148 80 V 106 A 58 16 0 0 1 32 106 Z" fill="url(#dbBodyGrad)" />
                <ellipse cx="90" cy="80" rx="58" ry="16" fill="url(#dbPlateGrad)" stroke="#94a3b8" strokeWidth="0.8" />
                {/* Micro Activity LED */}
                <circle cx="50" cy="93" r="2" fill="#3b82f6" className="animate-led-blink" />
                <line x1="58" y1="93" x2="128" y2="93" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" />

                {/* TIER 1 (Top Disk) */}
                <path d="M 32 40 A 58 16 0 0 0 148 40 V 66 A 58 16 0 0 1 32 66 Z" fill="url(#dbBodyGrad)" />
                <ellipse cx="90" cy="40" rx="58" ry="16" fill="url(#dbPlateGrad)" stroke="#94a3b8" strokeWidth="0.8" />
                {/* Top glossy specular reflection */}
                <ellipse cx="88" cy="38" rx="48" ry="12" fill="url(#specularGlow)" />
                {/* Micro Activity LED */}
                <circle cx="50" cy="53" r="2" fill="#10b981" className="animate-led-blink" />
                <line x1="58" y1="53" x2="128" y2="53" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" />

                {/* Center Relational Core Spindle */}
                <circle cx="90" cy="39" r="6" fill="#475569" stroke="#ffffff" strokeWidth="1.5" />
              </svg>
            </div>

            {/* Orbiting Metadata Badges below database */}
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2.5 py-0.5 rounded-full bg-zinc-900 text-white font-mono text-[10px] font-bold shadow-xs">
                {current.table}
              </span>
              <span className="text-[10px] font-mono text-zinc-500 font-medium">
                Indexed in SQLite
              </span>
            </div>
          </div>

          {/* Right: Sleek Obsidian Terminal with Syntax Highlighting */}
          <div className="sm:col-span-7 space-y-2 text-left">
            <div className="rounded-2xl bg-[#0c0c10] border border-white/[0.14] p-4 shadow-[0_15px_30px_-5px_rgba(0,0,0,0.3)] relative overflow-hidden font-mono text-xs">
              {/* Terminal Title Bar */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800 text-[10px] text-zinc-400">
                <span className="text-zinc-500">&gt;_ SQLite Engine</span>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Validated</span>
                  </span>
                </div>
              </div>

              {/* Code with Line Numbers and Keywords */}
              <div className="space-y-1 text-[11px] leading-relaxed">
                <div className="flex items-start gap-3">
                  <span className="text-zinc-600 select-none text-[10px] w-3 text-right">1</span>
                  <div className="text-zinc-200">
                    <span className="text-sky-400 font-bold">SELECT</span> player, runs
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-zinc-600 select-none text-[10px] w-3 text-right">2</span>
                  <div className="text-zinc-200">
                    <span className="text-sky-400 font-bold">FROM</span> <span className="text-purple-300 font-semibold">"{current.table}"</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-zinc-600 select-none text-[10px] w-3 text-right">3</span>
                  <div className="text-zinc-200">
                    <span className="text-sky-400 font-bold">ORDER BY</span> runs <span className="text-emerald-400 font-bold">DESC</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-zinc-600 select-none text-[10px] w-3 text-right">4</span>
                  <div className="text-zinc-200">
                    <span className="text-sky-400 font-bold">LIMIT</span> <span className="text-amber-300 font-bold">{current.rows}</span>;
                  </div>
                </div>
              </div>

              {/* Bottom Result Pill inside terminal */}
              <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-400">
                <span className="flex items-center gap-1 text-zinc-300">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>Executed in {current.time}</span>
                </span>
                <span className="text-emerald-400 font-semibold">{current.rows} rows returned</span>
              </div>
            </div>

            {/* Quick Run in Playground Button */}
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] text-zinc-500 font-medium">Safe read-only execution</span>
              <button
                onClick={onNavigateToPlayground}
                className="text-xs font-bold text-zinc-950 hover:text-black flex items-center gap-1 group py-1"
              >
                <span>Open in Playground</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
