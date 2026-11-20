import React, { useState, useEffect } from 'react';
import { Database, Zap, Layers, Terminal, Check, RefreshCw, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export default function IsometricDatabaseHero({ onStartQuerying }) {
  const [activeQueryIndex, setActiveQueryIndex] = useState(0);

  const queryFlows = [
    {
      nl: "Show top 5 performers in IPL 2024",
      table: "players",
      foreignTable: "matches",
      sql: `SELECT player, runs\nFROM players\nORDER BY runs DESC\nLIMIT 5;`,
      metrics: "5 rows • 1.1ms",
      cols: ["player", "runs", "strike_rate"]
    },
    {
      nl: "Find top 5 customers by purchase amount",
      table: "customers",
      foreignTable: "orders",
      sql: `SELECT name, total_spend\nFROM customers\nORDER BY total_spend DESC\nLIMIT 5;`,
      metrics: "5 rows • 1.4ms",
      cols: ["name", "email", "total_spend"]
    },
    {
      nl: "Show students scoring more than 80 marks",
      table: "students",
      foreignTable: "enrollments",
      sql: `SELECT first_name, score\nFROM students\nWHERE score > 80\nORDER BY score DESC;`,
      metrics: "7 rows • 0.9ms",
      cols: ["first_name", "score", "grade"]
    }
  ];

  const current = queryFlows[activeQueryIndex];

  return (
    <div className="relative w-full max-w-[620px] mx-auto select-none">
      
      {/* ======================================================== */}
      {/* 1. TOP FLOATING NATURAL LANGUAGE PROMPT INPUT */}
      {/* ======================================================== */}
      <div className="relative z-30 mb-4 max-w-lg mx-auto">
        <div
          onClick={() => setActiveQueryIndex((prev) => (prev + 1) % queryFlows.length)}
          className="group flex items-center justify-between gap-3 px-5 py-3 rounded-full bg-white/90 backdrop-blur-2xl border border-black/[0.08] shadow-[0_12px_32px_-6px_rgba(0,0,0,0.08),0_0_0_1px_rgba(255,255,255,0.8)] hover:border-black/20 hover:shadow-[0_18px_38px_-6px_rgba(0,0,0,0.12)] transition-all cursor-pointer"
          title="Click to cycle prompt questions"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="w-6 h-6 rounded-full bg-zinc-950 text-white flex items-center justify-center text-[10px] font-bold shadow-xs shrink-0">
              NL
            </span>
            <div className="text-left truncate">
              <span className="text-[10px] font-mono text-zinc-400 block -mb-0.5 uppercase tracking-wider">
                Natural Language Input
              </span>
              <span className="font-medium text-xs text-zinc-900 truncate block">
                "{current.nl}"
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 text-zinc-400 group-hover:text-zinc-900 transition-colors">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider hidden sm:inline">Next</span>
            <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500 text-zinc-700" />
          </div>
        </div>

        {/* Downward Animated Data Pulse Arrow indicating transformation */}
        <div className="w-0.5 h-6 mx-auto bg-gradient-to-b from-black/40 via-emerald-500 to-transparent relative">
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. ARCHITECTURAL ISOMETRIC 3D STAGE */}
      {/* ======================================================== */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-white/90 via-zinc-50/70 to-zinc-100/80 backdrop-blur-3xl border border-white/90 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.03)] overflow-hidden">
        
        {/* Subtle raking sunlight & architectural grid floor with alignment pegs */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="w-full h-full bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]"></div>
          {/* Raking sunlight diagonal beam */}
          <div className="absolute -top-32 -left-32 w-[600px] h-[300px] bg-gradient-to-br from-white/80 via-white/20 to-transparent rotate-12 blur-2xl"></div>
        </div>

        {/* Status Header Bar of Isometric Engine */}
        <div className="relative z-10 flex items-center justify-between pb-4 mb-4 border-b border-zinc-200/80 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="font-mono text-[11px] font-bold text-zinc-800">
              SCHEMA-GROUNDED PROMPT TRANSFORMER
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
            AST VERIFIED • ZERO MUTATION
          </span>
        </div>

        {/* Central Geometric Composition */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          
          {/* LEFT: 3D Isometric Database Monolith & Relational Table Blocks */}
          <div className="md:col-span-6 flex flex-col items-center justify-center">
            
            <div className="relative w-64 h-64 flex items-center justify-center">
              <svg viewBox="0 0 280 280" className="w-full h-full overflow-visible drop-shadow-[0_20px_35px_rgba(0,0,0,0.14)]">
                <defs>
                  {/* Isometric Lighting Gradients for 3D Faces */}
                  {/* Top Faces (Direct Sun) */}
                  <linearGradient id="isoTopLight" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="50%" stopColor="#f1f5f9" />
                    <stop offset="100%" stopColor="#e2e8f0" />
                  </linearGradient>

                  {/* Left Faces (Mid Shadow) */}
                  <linearGradient id="isoLeftMid" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#94a3b8" />
                    <stop offset="100%" stopColor="#cbd5e1" />
                  </linearGradient>

                  {/* Right Faces (Deep Ambient Shadow) */}
                  <linearGradient id="isoRightDeep" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#475569" />
                    <stop offset="100%" stopColor="#1e293b" />
                  </linearGradient>

                  {/* Obsidian Monolith Bevel Gradients */}
                  <linearGradient id="obsidianTop" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#27272a" />
                    <stop offset="100%" stopColor="#18181b" />
                  </linearGradient>
                  <linearGradient id="obsidianSide" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#18181b" />
                    <stop offset="100%" stopColor="#09090b" />
                  </linearGradient>

                  {/* Relational Glow Line */}
                  <linearGradient id="relationLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#09090b" />
                  </linearGradient>

                  {/* Ambient Floor Shadow */}
                  <radialGradient id="floorShadow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#000000" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Ground Shadow of elevated blocks */}
                <ellipse cx="140" cy="235" rx="90" ry="22" fill="url(#floorShadow)" />

                {/* Relational Dashed Connector Path between tables */}
                <path
                  d="M 50 100 Q 140 140 230 110"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="1.8"
                  strokeDasharray="4 4"
                  className="animate-dash-flow"
                />

                {/* Pulse node 1 */}
                <circle cx="50" cy="100" r="4" fill="#10b981" className="animate-data-pulse" />
                {/* Pulse node 2 */}
                <circle cx="230" cy="110" r="4" fill="#10b981" className="animate-data-pulse" />

                {/* ======================================================== */}
                {/* 1. CENTRAL ELEVATED ISOMETRIC DATABASE BLOCK */}
                {/* ======================================================== */}
                <g className="transition-transform duration-700 hover:-translate-y-2">
                  {/* Top Face of Central Database Block */}
                  <polygon points="140,75 190,100 140,125 90,100" fill="url(#isoTopLight)" stroke="#cbd5e1" strokeWidth="0.8" />
                  {/* Specular inset highlight */}
                  <polygon points="140,78 185,100 140,122 95,100" fill="#ffffff" opacity="0.6" />
                  {/* Center Core Spindle */}
                  <ellipse cx="140" cy="100" rx="14" ry="7" fill="#09090b" />
                  <ellipse cx="140" cy="98" rx="12" ry="5" fill="#27272a" />
                  <circle cx="140" cy="98" r="2.5" fill="#10b981" className="animate-pulse" />

                  {/* Left Face */}
                  <polygon points="90,100 140,125 140,175 90,150" fill="url(#isoLeftMid)" stroke="#94a3b8" strokeWidth="0.8" />
                  {/* Left Face Seam lines (Layers) */}
                  <line x1="90" y1="117" x2="140" y2="142" stroke="#64748b" strokeWidth="1" strokeDasharray="2 3" />
                  <line x1="90" y1="134" x2="140" y2="159" stroke="#64748b" strokeWidth="1" strokeDasharray="2 3" />
                  {/* Status LED */}
                  <circle cx="100" cy="122" r="2" fill="#10b981" className="animate-led-blink" />

                  {/* Right Face */}
                  <polygon points="140,125 190,100 190,150 140,175" fill="url(#isoRightDeep)" stroke="#334155" strokeWidth="0.8" />
                  {/* Right Face Layer Seams */}
                  <line x1="140" y1="142" x2="190" y2="117" stroke="#475569" strokeWidth="1" strokeDasharray="2 3" />
                  <line x1="140" y1="159" x2="190" y2="134" stroke="#475569" strokeWidth="1" strokeDasharray="2 3" />
                  {/* Status LED */}
                  <circle cx="178" cy="117" r="2" fill="#38bdf8" className="animate-led-blink" />
                </g>

                {/* ======================================================== */}
                {/* 2. ISOMETRIC SATELLITE TABLE 1: LEFT NODE [customers / players] */}
                {/* ======================================================== */}
                <g className="transition-transform duration-500 hover:-translate-y-1">
                  {/* Top Face */}
                  <polygon points="50,90 85,108 50,126 15,108" fill="url(#isoTopLight)" stroke="#cbd5e1" strokeWidth="0.8" />
                  {/* Table Label */}
                  <text x="50" y="112" textAnchor="middle" fontSize="9" fontWeight="bold" fontFamily="monospace" fill="#09090b">
                    {current.table}
                  </text>

                  {/* Left Face */}
                  <polygon points="15,108 50,126 50,152 15,134" fill="url(#isoLeftMid)" stroke="#94a3b8" strokeWidth="0.8" />
                  {/* Right Face */}
                  <polygon points="50,126 85,108 85,134 50,152" fill="url(#isoRightDeep)" stroke="#334155" strokeWidth="0.8" />
                </g>

                {/* ======================================================== */}
                {/* 3. ISOMETRIC SATELLITE TABLE 2: RIGHT NODE [orders / schema] */}
                {/* ======================================================== */}
                <g className="transition-transform duration-500 hover:-translate-y-1">
                  {/* Top Face */}
                  <polygon points="230,100 265,118 230,136 195,118" fill="url(#obsidianTop)" stroke="#3f3f46" strokeWidth="0.8" />
                  <text x="230" y="121" textAnchor="middle" fontSize="9" fontWeight="bold" fontFamily="monospace" fill="#ffffff">
                    {current.foreignTable}
                  </text>

                  {/* Left Face */}
                  <polygon points="195,118 230,136 230,162 195,144" fill="url(#obsidianSide)" stroke="#27272a" strokeWidth="0.8" />
                  {/* Right Face */}
                  <polygon points="230,136 265,118 265,144 230,162" fill="#09090b" stroke="#18181b" strokeWidth="0.8" />
                </g>

                {/* Subtle vertical connection beacon */}
                <line x1="140" y1="35" x2="140" y2="75" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" className="animate-dash-flow" />
              </svg>
            </div>

            {/* Micro Tags below the isometric structure */}
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2.5 py-1 rounded-full bg-zinc-950 text-white font-mono text-[10px] font-bold shadow-xs">
                Foreign Key: id → {current.table}_id
              </span>
            </div>
          </div>

          {/* RIGHT: Sophisticated Obsidian Glass SQL Editor Block */}
          <div className="md:col-span-6 space-y-3 text-left">
            <div className="rounded-2xl bg-[#09090c] border border-white/[0.14] p-4 sm:p-5 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.4)] relative overflow-hidden font-mono text-xs">
              
              {/* Obsidian Editor Window Top Bar */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800 text-[11px] text-zinc-400">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                  <span className="text-zinc-200 font-bold">SQL Execution Node</span>
                </div>
                <span className="text-emerald-400 font-bold flex items-center gap-1 text-[10px]">
                  <Check className="w-3 h-3 text-emerald-400" />
                  VALIDATED SELECT
                </span>
              </div>

              {/* Code Editor Body with Syntax Highlights */}
              <div className="space-y-1.5 text-[11px] leading-relaxed">
                <div className="flex items-start gap-3">
                  <span className="text-zinc-600 select-none text-[10px] w-3 text-right">1</span>
                  <div className="text-zinc-100">
                    <span className="text-sky-400 font-bold">SELECT</span> {current.cols.slice(0, 2).join(", ")}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-zinc-600 select-none text-[10px] w-3 text-right">2</span>
                  <div className="text-zinc-100">
                    <span className="text-sky-400 font-bold">FROM</span> <span className="text-purple-300 font-semibold">"{current.table}"</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-zinc-600 select-none text-[10px] w-3 text-right">3</span>
                  <div className="text-zinc-100">
                    <span className="text-sky-400 font-bold">ORDER BY</span> {current.cols[1]} <span className="text-emerald-400 font-bold">DESC</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-zinc-600 select-none text-[10px] w-3 text-right">4</span>
                  <div className="text-zinc-100">
                    <span className="text-sky-400 font-bold">LIMIT</span> <span className="text-amber-300 font-bold">5</span>;
                  </div>
                </div>
              </div>

              {/* Bottom Execution Bar */}
              <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[10px]">
                <span className="text-zinc-400 flex items-center gap-1 font-mono">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>Latency: {current.metrics}</span>
                </span>
                <span className="text-emerald-400 font-semibold font-mono">Read-Only Safe</span>
              </div>
            </div>

            {/* Playground Direct Action Button */}
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] text-zinc-500 font-sans">Grounded in selected database</span>
              <button
                onClick={onStartQuerying}
                className="text-xs font-bold text-zinc-950 hover:text-black flex items-center gap-1 group py-1"
              >
                <span>Open in SQL Playground</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
