import React, { useState, useEffect, useRef } from 'react';
import ArchitecturalMonumentHero from '../components/ArchitecturalMonumentHero';
import {
  Sparkles,
  ArrowRight,
  Database,
  Terminal,
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet,
  Server,
  Layers,
  Cpu,
  Lock,
  ChevronRight,
  Check,
  Search,
  HelpCircle,
  MessageSquare,
  FileCode,
  Smile,
  Github
} from 'lucide-react';

export default function Home({ onNavigateToPlayground, onNavigateToDatabases, onSelectDemoQuery }) {
  const [activeStep, setActiveStep] = useState(1);
  const [isStepPaused, setIsStepPaused] = useState(false);
  const [activeHeroPromptIndex, setActiveHeroPromptIndex] = useState(0);
  const [activeFaqTab, setActiveFaqTab] = useState('all');
  const [faqSearchQuery, setFaqSearchQuery] = useState('');
  const [pillsVisible, setPillsVisible] = useState(false);
  const pillsRef = useRef(null);

  useEffect(() => {
    if (!pillsRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPillsVisible(true);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(pillsRef.current);
    return () => observer.disconnect();
  }, []);

  const faqList = [
    {
      category: 'offer',
      icon: HelpCircle,
      question: "Can I query databases using natural English without writing SQL?",
      answer: "Yes! NL2SQL translates plain English questions into verified SQL. Simply connect your database or upload a CSV, type your question, and get instant results with interactive tables and charts."
    },
    {
      category: 'dont',
      icon: ShieldCheck,
      question: "Can NL2SQL modify, update, or delete my data?",
      answer: "No, never. We strictly do NOT permit database mutations. Commands like INSERT, UPDATE, DELETE, DROP, ALTER, and multi-statement SQL injections are systematically blocked at line 0 by our AST compiler."
    },
    {
      category: 'offer',
      icon: Database,
      question: "What database formats and files can I upload?",
      answer: "We support instant direct upload of SQLite database files (.db, .sqlite) and CSV spreadsheets (.csv), with automatic schema type inference and relational table creation stored in persistent MongoDB GridFS."
    },
    {
      category: 'dont',
      icon: Lock,
      question: "Do you train AI models on my private database rows?",
      answer: "No. Your raw records, proprietary rows, and customer details are never sent to external LLMs or used for training. Only column names, table definitions, and your question are used for schema grounding."
    },
    {
      category: 'offer',
      icon: Layers,
      question: "Does NL2SQL support multi-table JOINs and aggregations?",
      answer: "Yes. By dynamically inspecting primary and foreign keys, NL2SQL formulates multi-table JOINs, GROUP BY aggregations, HAVING clauses, nested subqueries, and window functions with schema grounding."
    },
    {
      category: 'dont',
      icon: Cpu,
      question: "Can I run long-running or unbounded background batch jobs?",
      answer: "No. To maintain server stability and prevent runaway queries or denial-of-service, all queries have a strict 5-second execution timeout and results are automatically clamped to 500 rows."
    },
    {
      category: 'offer',
      icon: Terminal,
      question: "Can I inspect the generated SQL and LLM prompt tokens?",
      answer: "Yes, 100% transparency. Every generated query exposes its underlying SQL syntax, execution latency, AST tokens, and full prompt engineering context in our Prompt Inspector tab."
    },
    {
      category: 'offer',
      icon: FileSpreadsheet,
      question: "Can I export results and visualize query data?",
      answer: "Yes. Query results can be exported with a single click to CSV, and numerical columns can be visualized directly into responsive bar charts, line graphs, and aggregate metrics."
    }
  ];

  const filteredFaqs = faqList.filter(f => {
    const matchesTab = activeFaqTab === 'all' || f.category === activeFaqTab;
    const matchesSearch = faqSearchQuery.trim() === '' ||
      f.question.toLowerCase().includes(faqSearchQuery.toLowerCase()) ||
      f.answer.toLowerCase().includes(faqSearchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Fast, premium auto-advance through steps 1 -> 2 -> 3 -> 4 -> 1
  useEffect(() => {
    if (isStepPaused) return;
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev % 4) + 1);
    }, 2200);
    return () => clearInterval(timer);
  }, [isStepPaused]);

  const stepDetails = [
    {
      num: 1,
      title: 'Ask Your Question',
      tag: 'Natural Language Input',
      query: '"Show top 5 customers by purchase amount"',
      detail: 'Ask any question in plain English. No SQL syntax knowledge required.'
    },
    {
      num: 2,
      title: 'Let AI Work',
      tag: 'Schema AST Parser',
      query: 'SELECT name, total_spend FROM customers ORDER BY total_spend DESC LIMIT 5;',
      detail: 'Model grounds on actual DB schema and generates verified read-only SQL.'
    },
    {
      num: 3,
      title: 'Explore Results',
      tag: 'Instant Execution (8ms)',
      query: '✓ 5 rows returned • 100% read-only verification passed',
      detail: 'Query runs safely against SQLite with instant table and chart rendering.'
    },
    {
      num: 4,
      title: 'Go Further',
      tag: 'Deep Insights',
      query: 'Export to CSV • Inspect AST Prompt • Ask follow-up question',
      detail: 'Export results, inspect prompt engineering tokens, or ask a follow-up query.'
    }
  ];

  const currentStepInfo = stepDetails[activeStep - 1];

  const heroDemos = [
    {
      q: "Show top 5 performers in IPL 2024",
      sql: `SELECT player, runs\nFROM players\nORDER BY runs DESC\nLIMIT 5;`
    },
    {
      q: "Find top 5 customers by purchase amount",
      sql: `SELECT name, total_spend\nFROM customers\nORDER BY total_spend DESC\nLIMIT 5;`
    },
    {
      q: "Show all students scoring more than 80 marks",
      sql: `SELECT first_name, major, score\nFROM students\nWHERE score > 80\nORDER BY score DESC;`
    }
  ];

  const currentDemo = heroDemos[activeHeroPromptIndex];

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden w-full max-w-full bg-white text-zinc-900 selection:bg-zinc-900 selection:text-white [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {/* ======================================================== */}
      {/* 1. HERO SECTION (EXACT MONUMENT ARCHITECTURAL MATCH) */}
      {/* ======================================================== */}
      <section className="relative overflow-hidden w-full">
        <ArchitecturalMonumentHero
          onStartQuerying={onNavigateToPlayground}
          onNavigateToDatabases={onNavigateToDatabases}
        />
      </section>

      {/* ======================================================== */}
      {/* 2. HOW IT WORKS & CONNECT YOUR DATABASE (EDGE-TO-EDGE) */}
      {/* ======================================================== */}
      <section id="how-it-works" className="w-full bg-white py-12 sm:py-16">
        <div className="w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            
            {/* LEFT: From Question to Query in 4 Simple Steps (Unboxed, Continuous White) */}
            <div
              onMouseEnter={() => setIsStepPaused(true)}
              onMouseLeave={() => setIsStepPaused(false)}
              className="lg:col-span-7 flex flex-col justify-between space-y-8 select-none text-left"
            >
              {/* Top Header */}
              <div className="space-y-3.5 text-left">
                <div className="flex items-center justify-between">
                  <div className="inline-block px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200/80 text-zinc-700 text-[11px] font-semibold">
                    How It Works
                  </div>

                  {/* Subtle refined step counter */}
                  <div className="text-[11px] font-medium text-zinc-400">
                    <span className="font-bold text-zinc-900">{activeStep}</span> of 4
                  </div>
                </div>

                <h3 className="font-serif text-4xl sm:text-5xl font-medium tracking-tight text-zinc-950">
                  From Question <br />
                  to Query in 4 Simple Steps
                </h3>
                
                <p className="text-sm sm:text-base text-zinc-500 font-normal max-w-md leading-relaxed">
                  A seamless journey from natural language to powerful insights.
                </p>

                {/* Dynamic context line matching the theme */}
                <div className="pt-1 flex flex-wrap items-center gap-2">
                  <button
                    onClick={onNavigateToPlayground}
                    className="text-xs font-semibold text-zinc-900 hover:text-black inline-flex items-center gap-1 group/btn cursor-pointer"
                  >
                    <span>Explore the process</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                  <span className="text-zinc-300 hidden sm:inline">•</span>
                  <span className="text-xs text-zinc-500 font-medium transition-all duration-300">
                    {currentStepInfo.detail}
                  </span>
                </div>
              </div>

              {/* 4 Steps Horizontal Flow with Animated Line & Progress Dash */}
              <div className="pt-6 border-t border-zinc-200/60">
                <div className="relative">
                  {/* Background Connecting Track Line (Centered at 12.5% to 87.5%) */}
                  <div className="absolute top-[21px] left-[12.5%] right-[12.5%] h-[2px] bg-zinc-200/90 -z-0 rounded-full" />

                  {/* Active Animated Fill Line connecting 1 -> 2 -> 3 -> 4 */}
                  <div
                    className="absolute top-[21px] left-[12.5%] h-[2px] bg-zinc-950 rounded-full -z-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                    style={{
                      width: `${((activeStep - 1) / 3) * 75}%`,
                    }}
                  />

                  {/* 4 Step Nodes */}
                  <div className="grid grid-cols-4 gap-2 sm:gap-3 relative z-10">
                    {stepDetails.map((s) => {
                      const isActive = activeStep === s.num;
                      const isPassed = activeStep > s.num;

                      return (
                        <div
                          key={s.num}
                          onClick={() => setActiveStep(s.num)}
                          className="cursor-pointer text-center space-y-2.5 py-2.5 px-1 select-none transition-all duration-300 group"
                        >
                          {/* Step Circle with smooth tactile pop-up, elevation, and obsidian shadow */}
                          <div
                            className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center font-bold text-xs transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                              isActive
                                ? 'bg-zinc-950 text-white shadow-[0_12px_24px_-4px_rgba(0,0,0,0.45),0_6px_12px_-2px_rgba(0,0,0,0.2)] scale-120 -translate-y-1.5 ring-4 ring-black/10'
                                : isPassed
                                ? 'bg-zinc-900 text-white shadow-xs scale-100 translate-y-0'
                                : 'bg-white border-2 border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:scale-105 scale-100 translate-y-0'
                            }`}
                          >
                            {isPassed ? (
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            ) : (
                              <span>{s.num}</span>
                            )}
                          </div>

                          {/* Title */}
                          <p
                            className={`text-xs leading-tight transition-all duration-300 ${
                              isActive ? 'font-bold text-zinc-950' : 'font-medium text-zinc-500'
                            }`}
                          >
                            {s.title}
                          </p>

                          {/* Animated Dash Indicator Under Each Step */}
                          <div className={`mx-auto rounded-full overflow-hidden transition-all duration-300 ${isActive ? 'w-7 h-[3px] bg-zinc-200' : 'w-5 h-[2px] bg-zinc-100'}`}>
                            <div
                              key={`${s.num}-${isActive}`}
                              className={`h-full bg-zinc-950 rounded-full ${
                                isActive
                                  ? 'w-full'
                                  : isPassed
                                  ? 'w-full bg-zinc-400'
                                  : 'w-0'
                              }`}
                              style={{
                                animation: isActive && !isStepPaused ? 'stepProgressFill 2.2s linear forwards' : undefined,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT CARD (Dark Obsidian Glass Card): Connect Your Database */}
            <div className="lg:col-span-5 bg-zinc-950 rounded-3xl p-8 sm:p-10 text-white flex flex-col justify-between space-y-6 shadow-2xl border border-zinc-800/80">
              <div className="space-y-3 text-left">
                <div className="inline-block px-3 py-1 rounded-full bg-white/10 border border-white/15 text-zinc-300 text-[11px] font-semibold">
                  Supported Databases
                </div>
                <h3 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-white">
                  Connect Your Database
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 font-normal leading-relaxed">
                  Seamlessly connect with popular databases and start querying in seconds.
                </p>
              </div>

              {/* Grid of Database Icons */}
              <div className="grid grid-cols-3 gap-3 py-2">
                <div className="p-3.5 rounded-xl bg-white/[0.06] border border-white/10 text-center space-y-1.5 hover:bg-white/[0.1] transition-all">
                  <Database className="w-5 h-5 mx-auto text-zinc-200" />
                  <span className="text-[10px] text-zinc-300 font-mono block">SQLite</span>
                </div>
                <div className="p-3.5 rounded-xl bg-white/[0.06] border border-white/10 text-center space-y-1.5 hover:bg-white/[0.1] transition-all">
                  <Server className="w-5 h-5 mx-auto text-zinc-200" />
                  <span className="text-[10px] text-zinc-300 font-mono block">MongoDB GridFS</span>
                </div>
                <div className="p-3.5 rounded-xl bg-white/[0.06] border border-white/10 text-center space-y-1.5 hover:bg-white/[0.1] transition-all">
                  <FileSpreadsheet className="w-5 h-5 mx-auto text-zinc-200" />
                  <span className="text-[10px] text-zinc-300 font-mono block">CSV Upload</span>
                </div>
                <div className="p-3.5 rounded-xl bg-white/[0.06] border border-white/10 text-center space-y-1.5 hover:bg-white/[0.1] transition-all">
                  <Layers className="w-5 h-5 mx-auto text-zinc-200" />
                  <span className="text-[10px] text-zinc-300 font-mono block">PostgreSQL</span>
                </div>
                <div className="p-3.5 rounded-xl bg-white/[0.06] border border-white/10 text-center space-y-1.5 hover:bg-white/[0.1] transition-all">
                  <Cpu className="w-5 h-5 mx-auto text-zinc-200" />
                  <span className="text-[10px] text-zinc-300 font-mono block">Snowflake</span>
                </div>
                <div className="p-3.5 rounded-xl bg-white/[0.06] border border-white/10 text-center space-y-1.5 hover:bg-white/[0.1] transition-all">
                  <Sparkles className="w-5 h-5 mx-auto text-zinc-200" />
                  <span className="text-[10px] text-zinc-300 font-mono block">Gemini AI</span>
                </div>
              </div>

              {/* View All Supported Button */}
              <div>
                <button
                  onClick={onNavigateToDatabases}
                  className="w-full py-3 rounded-full bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs shadow-md transition-all duration-200 flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <span>View All Supported</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. ARCHITECTURAL SECURITY & ISOLATION (REFERENCE MATCH)  */}
      {/* ======================================================== */}
      <section id="security" className="w-full bg-white py-14 sm:py-20 text-left overflow-hidden">
        <div className="w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-end">
            
            {/* Left Column: Heading, Description, CTA Buttons, Intro Text */}
            <div className="lg:col-span-6 flex flex-col justify-between space-y-7 select-none pb-2">
              
              {/* Main Heading */}
              <h3 className="font-serif text-4xl sm:text-5xl font-medium tracking-tight text-zinc-950">
                Architected for Absolute Data Safety
              </h3>

              {/* Description */}
              <p className="text-sm sm:text-base text-zinc-500 font-normal max-w-lg leading-relaxed">
                Strict read-only SQL execution, AST mutation interception, and zero external model training—powered by real-time AST validation and immutable MongoDB GridFS.
              </p>

              {/* CTA Buttons */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={onNavigateToPlayground}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-b from-zinc-900 to-black text-white font-semibold text-xs sm:text-sm shadow-[0_8px_20px_rgba(0,0,0,0.3)] border border-white/10 hover:from-black hover:to-zinc-900 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <span>Get Started</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <a
                  href="#faq"
                  className="px-5 py-2.5 rounded-xl bg-white border border-zinc-200 text-zinc-800 font-semibold text-xs sm:text-sm hover:bg-zinc-50 hover:border-zinc-300 shadow-2xs transition-all cursor-pointer"
                >
                  View features
                </a>
              </div>

              {/* Four Reasons Intro Text */}
              <p className="text-xs sm:text-sm text-zinc-500 font-medium pt-2 max-w-md">
                Here are four powerful reasons we stand ahead of any AI tool.
              </p>
            </div>

            {/* Right Column: 4 Floating Capsule Cards with Single Collective Ground Shadow & Drop Animation */}
            <div ref={pillsRef} className="lg:col-span-6 flex flex-col justify-end items-start lg:items-end pb-6 pt-8 lg:pt-0">
              <div className="relative w-full max-w-lg flex items-start justify-start lg:justify-end select-none pt-4 pb-4">
                
                {/* Single Collective Ground Shadow for the entire cluster on the bottom */}
                <div
                  className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-[88%] h-6 bg-gradient-to-r from-zinc-950/10 via-zinc-950/25 to-zinc-950/10 rounded-full blur-xl transition-all duration-700 pointer-events-none ${
                    pillsVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                  }`}
                />
                <div
                  className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-[68%] h-3 bg-zinc-950/30 rounded-full blur-md transition-all duration-700 pointer-events-none ${
                    pillsVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                  }`}
                />

                {/* Left Stack: Pill 2, Pill 3, and Pill 4 (Offset downward so Pill 1 sits above 2) */}
                <div className="flex flex-col gap-3.5 z-10 shrink-0 mt-8 sm:mt-10">
                  
                  {/* Pill 2 (Zero Data Leakage) */}
                  <div
                    className={`transform origin-left transition-all duration-700 ${
                      pillsVisible
                        ? 'opacity-100 translate-y-0 -rotate-[3deg]'
                        : 'opacity-0 -translate-y-24 rotate-0'
                    }`}
                    style={{
                      transitionDelay: '300ms',
                      transitionTimingFunction: 'cubic-bezier(0.34, 1.3, 0.64, 1)'
                    }}
                  >
                    <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-full bg-white border border-zinc-200/90 shadow-[0_6px_18px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.03)] w-[240px] sm:w-[260px] hover:-rotate-[1deg] transition-transform">
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="w-6 h-6 rounded-md bg-zinc-950 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Lock className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold text-zinc-900 tracking-tight truncate">Zero Data Leakage</span>
                      </div>
                      <span className="w-5 h-5 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-[10px] font-bold text-zinc-700 shrink-0">
                        2
                      </span>
                    </div>
                  </div>

                  {/* Pill 3 (Immutable GridFS Storage) */}
                  <div
                    className={`pl-1 transform transition-all duration-700 ${
                      pillsVisible
                        ? 'opacity-100 translate-y-0 rotate-0'
                        : 'opacity-0 -translate-y-20 rotate-0'
                    }`}
                    style={{
                      transitionDelay: '450ms',
                      transitionTimingFunction: 'cubic-bezier(0.34, 1.3, 0.64, 1)'
                    }}
                  >
                    <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-full bg-white border border-zinc-200/90 shadow-[0_6px_18px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.03)] w-[240px] sm:w-[260px]">
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="w-6 h-6 rounded-md bg-zinc-950 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Database className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold text-zinc-900 tracking-tight truncate">Immutable GridFS Storage</span>
                      </div>
                      <span className="w-5 h-5 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-[10px] font-bold text-zinc-700 shrink-0">
                        3
                      </span>
                    </div>
                  </div>

                  {/* Pill 4 (Sub-10ms Relational Execution) */}
                  <div
                    className={`transform origin-left transition-all duration-700 ${
                      pillsVisible
                        ? 'opacity-100 translate-y-0 rotate-[2deg]'
                        : 'opacity-0 -translate-y-16 rotate-0'
                    }`}
                    style={{
                      transitionDelay: '600ms',
                      transitionTimingFunction: 'cubic-bezier(0.34, 1.3, 0.64, 1)'
                    }}
                  >
                    <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-full bg-white border border-zinc-200/90 shadow-[0_6px_18px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.03)] w-[240px] sm:w-[260px] hover:rotate-[1deg] transition-transform">
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="w-6 h-6 rounded-md bg-zinc-950 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Cpu className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold text-zinc-900 tracking-tight truncate">Sub-10ms Relational Speed</span>
                      </div>
                      <span className="w-5 h-5 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-[10px] font-bold text-zinc-700 shrink-0">
                        4
                      </span>
                    </div>
                  </div>

                </div>

                {/* Pill 1 (Strict Read-Only Enforcement - Positioned on ABOVE of 2, slanting downwards to the right) */}
                <div
                  className={`relative -ml-8 sm:-ml-6 z-20 transform origin-top-left transition-all duration-700 ${
                    pillsVisible
                      ? 'opacity-100 translate-y-0 rotate-[24deg]'
                      : 'opacity-0 -translate-y-28 rotate-0'
                  }`}
                  style={{
                    transitionDelay: '150ms',
                    transitionTimingFunction: 'cubic-bezier(0.34, 1.3, 0.64, 1)'
                  }}
                >
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-white border border-zinc-200/90 shadow-[0_12px_28px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] whitespace-nowrap hover:rotate-[20deg] transition-transform">
                    <div className="w-6 h-6 rounded-md bg-zinc-950 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-zinc-900 tracking-tight">Strict Read-Only Enforcement</span>
                    <span className="w-5 h-5 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-[10px] font-bold text-zinc-700 ml-1 shrink-0">
                      1
                    </span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. IMPACT SHOWCASE SECTION (BORDERLESS LIGHT CONTAINER)   */}
      {/* ======================================================== */}
      <section className="w-full bg-white py-6 sm:py-8 text-left">
        <div className="w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-16">
          <div className="w-full bg-[#f8f9fa] rounded-3xl sm:rounded-[36px] p-8 sm:p-14 lg:p-16 space-y-4">
            <h3 className="text-2xl sm:text-3xl lg:text-3xl font-medium tracking-tight text-zinc-900 leading-[1.3] max-w-4xl">
              From raw database schema to actionable answers in seconds. <br className="hidden sm:inline" />
              No SQL expertise required to explore complex relational data.
            </h3>
            <p className="text-base sm:text-lg text-zinc-500 font-normal leading-relaxed max-w-3xl">
              Prompts are strictly grounded in your actual foreign keys, table structures, and constraints, eliminating fictitious syntax.
            </p>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. FREQUENTLY ASKED QUESTIONS (EDITORIAL SERIF, EDGE-TO-EDGE) */}
      {/* ======================================================== */}
      <section id="faq" className="w-full bg-white py-12 sm:py-16 text-left">
        <div className="w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 space-y-10">
          
          {/* Header using Editorial Serif */}
          <div className="space-y-3">
            
            <h3 className="font-serif text-4xl sm:text-5xl font-medium tracking-tight text-zinc-950">
              Frequently Asked Questions
            </h3>
            
            
          </div>

          {/* Filter Pills and Search Bar Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            {/* Left Category Tabs - Shiny Black Active State */}
            <div className="inline-flex p-1.5 rounded-2xl bg-zinc-100 border border-zinc-200/90 gap-1.5 w-fit shadow-inner">
              <button
                onClick={() => setActiveFaqTab('all')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeFaqTab === 'all'
                    ? 'bg-gradient-to-b from-zinc-900 to-black text-white shadow-[0_4px_12px_rgba(0,0,0,0.25)] border border-white/10'
                    : 'text-zinc-700 hover:text-black hover:bg-zinc-200/60'
                }`}
              >
                General FAQs
              </button>
              <button
                onClick={() => setActiveFaqTab('offer')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeFaqTab === 'offer'
                    ? 'bg-gradient-to-b from-zinc-900 to-black text-white shadow-[0_4px_12px_rgba(0,0,0,0.25)] border border-white/10'
                    : 'text-zinc-700 hover:text-black hover:bg-zinc-200/60'
                }`}
              >
                What We Offer
              </button>
              <button
                onClick={() => setActiveFaqTab('dont')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeFaqTab === 'dont'
                    ? 'bg-gradient-to-b from-zinc-900 to-black text-white shadow-[0_4px_12px_rgba(0,0,0,0.25)] border border-white/10'
                    : 'text-zinc-700 hover:text-black hover:bg-zinc-200/60'
                }`}
              >
                Security & Limits
              </button>
            </div>

            {/* Right Search Bar */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={faqSearchQuery}
                onChange={(e) => setFaqSearchQuery(e.target.value)}
                placeholder="Search questions..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-zinc-300 text-xs sm:text-sm font-normal text-black placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-black/15 focus:border-black shadow-xs transition-all"
              />
            </div>
          </div>

          {/* 2-Column Grid of FAQ items with Black Bordered Icon Boxes & Editorial Serif Questions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-9 pt-2">
            {filteredFaqs.map((faq, idx) => {
              const IconComponent = faq.icon;
              return (
                <div key={idx} className="flex items-start gap-4 text-left group">
                  {/* Black Bordered Box (White interior, crisp black border, not solid black) */}
                  <div className="w-10 h-10 rounded-xl border border-black bg-white flex items-center justify-center shrink-0 mt-0.5 text-black shadow-xs group-hover:bg-zinc-50 transition-colors">
                    <IconComponent className="w-5 h-5 stroke-[1.8]" />
                  </div>
                  
                  {/* Editorial Serif Question matching How It Works primary heading tone */}
                  <div className="space-y-1.5">
                    <h4 className="font-serif text-[17px] sm:text-lg font-medium text-zinc-950 tracking-tight leading-snug group-hover:text-zinc-700 transition-colors">
                      {faq.question}
                    </h4>
                    <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-normal">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredFaqs.length === 0 && (
            <div className="text-center py-12 text-zinc-500 text-xs sm:text-sm font-normal">              No questions matched your search query. Try searching for "SQL", "read-only", or "upload".
            </div>
          )}

        </div>
      </section>

      {/* ======================================================== */}
      {/* 6. FOOTER (GRAPHY REFERENCE STYLE, WIDE FLOATING CARD)  */}
      {/* ======================================================== */}
      <footer className="w-full bg-[#f8f9fa] pt-4 sm:pt-8 pb-0 relative overflow-hidden text-left">
        <div className="w-full max-w-[96%] sm:max-w-[94%] xl:max-w-[1440px] mx-auto px-2 sm:px-4 relative z-10">
          
          {/* Main Floating Rounded White Card - Wider, less margin */}
          <div className="w-full bg-white rounded-3xl sm:rounded-[36px] border border-zinc-200/90 shadow-[0_4px_30px_rgba(0,0,0,0.03)] p-8 sm:p-12 lg:p-16 space-y-12 relative z-10">
            
            {/* Top Grid: Brand & Description on Left, Real Project Navigation on Right */}
            <div className="flex flex-col lg:flex-row justify-between items-start gap-12">
              
              {/* Brand, Tagline, & GitHub Repo */}
              <div className="max-w-md space-y-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-zinc-950 text-white flex items-center justify-center font-black text-xs shadow-md">
                    <Database className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-extrabold text-xl text-zinc-950 tracking-tight">NL2SQL</span>
                </div>
                
                <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-normal">
                  NL2SQL translates natural language questions into verified, read-only SQL queries with AST safety, dynamic schema grounding, and instant relational execution.
                </p>

                {/* GitHub repository button - no fake socials */}
                <div className="pt-1">
                  <a
                    href="https://github.com/Khushi1718/NL2SQL"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="GitHub Repository"
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-zinc-200 bg-white text-xs font-semibold text-zinc-800 hover:text-black hover:border-zinc-400 hover:shadow-xs transition-all cursor-pointer"
                  >
                    <Github className="w-4 h-4" />
                    <span>View Project on GitHub</span>
                  </a>
                </div>
              </div>

              {/* Right Columns: Authentic Project Links */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-14 lg:gap-16">
                {/* 1. Platform */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-xs sm:text-sm text-zinc-900 tracking-tight">Platform</h4>
                  <ul className="space-y-2.5 text-xs sm:text-sm text-zinc-500 font-normal">
                    <li>
                      <button onClick={onNavigateToPlayground} className="hover:text-zinc-900 transition-colors cursor-pointer">
                        SQL Playground
                      </button>
                    </li>
                    <li>
                      <button onClick={onNavigateToDatabases} className="hover:text-zinc-900 transition-colors cursor-pointer">
                        My Databases
                      </button>
                    </li>
                    <li>
                      <button onClick={onNavigateToDatabases} className="hover:text-zinc-900 transition-colors cursor-pointer">
                        SQLite & CSV Upload
                      </button>
                    </li>
                    <li>
                      <button onClick={onNavigateToPlayground} className="hover:text-zinc-900 transition-colors cursor-pointer">
                        Prompt Inspector
                      </button>
                    </li>
                  </ul>
                </div>

                {/* 2. Security & Engine */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-xs sm:text-sm text-zinc-900 tracking-tight">Security & Engine</h4>
                  <ul className="space-y-2.5 text-xs sm:text-sm text-zinc-500 font-normal">
                    <li>
                      <a href="#security" className="hover:text-zinc-900 transition-colors">
                        AST Safety Gateway
                      </a>
                    </li>
                    <li>
                      <span className="hover:text-zinc-900 transition-colors">
                        Read-Only Enforcement
                      </span>
                    </li>
                    <li>
                      <span className="hover:text-zinc-900 transition-colors">
                        5s Query Timeout
                      </span>
                    </li>
                    <li>
                      <span className="hover:text-zinc-900 transition-colors">
                        GridFS Persistence
                      </span>
                    </li>
                  </ul>
                </div>

                {/* 3. Resources */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-xs sm:text-sm text-zinc-900 tracking-tight">Resources</h4>
                  <ul className="space-y-2.5 text-xs sm:text-sm text-zinc-500 font-normal">
                    <li>
                      <span className="hover:text-zinc-900 transition-colors cursor-pointer">
                        Schema Grounding
                      </span>
                    </li>
                    <li>
                      <span className="hover:text-zinc-900 transition-colors cursor-pointer">
                        Multi-Table JOINs
                      </span>
                    </li>
                    <li>
                      <span className="hover:text-zinc-900 transition-colors cursor-pointer">
                        AST Token Trees
                      </span>
                    </li>
                    <li>
                      <a href="#faq" className="hover:text-zinc-900 transition-colors">
                        FAQ Support
                      </a>
                    </li>
                  </ul>
                </div>
              </div>

            </div>

            {/* Bottom Bar: Copyright on Left, Real Engine Guarantees on Right */}
            <div className="border-t border-zinc-100 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-zinc-500 font-normal">
              <div>
                © 2026 NL2SQL. Relational Natural Language Query Engine.
              </div>
              <div className="flex items-center gap-6 text-zinc-500 text-xs sm:text-sm">
                <span>Read-Only SQL</span>
                <span>•</span>
                <span>Zero Data Training</span>
                <span>•</span>
                <span>AST Verified</span>
              </div>
            </div>

          </div>

          {/* Brand watermark - sliced horizontally so only upper portion is visible */}
          <div className="w-full flex justify-center pt-3 sm:pt-5 overflow-hidden h-20 sm:h-32 lg:h-44 pointer-events-none select-none">
            <span className="font-black text-[120px] sm:text-[200px] lg:text-[280px] text-[#e3e6ec] tracking-tighter leading-none select-none block">
              NL2SQL
            </span>
          </div>

        </div>
      </footer>
    </div>
  );
}
