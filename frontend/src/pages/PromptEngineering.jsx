import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Layers,
  Sparkles,
  BookOpen,
  Code,
  ShieldCheck,
  CheckCircle,
  Copy,
  Terminal
} from 'lucide-react';
import { fetchPromptBreakdown, inspectLivePrompt } from '../services/api';

export default function PromptEngineering({ initialQuestion }) {
  const [breakdown, setBreakdown] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inspectQuestion, setInspectQuestion] = useState(
    initialQuestion || 'Show all students who scored more than 80 marks.'
  );
  const [liveInspection, setLiveInspection] = useState(null);
  const [inspecting, setInspecting] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Active sub-tab: 'inspector' | 'role' | 'schema' | 'few_shot' | 'constraints' | 'structured'
  const [activeTab, setActiveTab] = useState('inspector');

  useEffect(() => {
    loadBreakdown();
  }, []);

  const loadBreakdown = async () => {
    try {
      setLoading(true);
      const data = await fetchPromptBreakdown();
      setBreakdown(data);
      runLiveInspection(inspectQuestion);
    } catch (err) {
      console.error('Failed to load prompt breakdown', err);
    } finally {
      setLoading(false);
    }
  };

  const runLiveInspection = async (question) => {
    try {
      setInspecting(true);
      const result = await inspectLivePrompt(question);
      setLiveInspection(result);
    } catch (err) {
      console.error('Failed to inspect live prompt', err);
    } finally {
      setInspecting(false);
    }
  };

  const copyFullPrompt = () => {
    if (!liveInspection?.final_constructed_prompt) return;
    navigator.clipboard.writeText(liveInspection.final_constructed_prompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full text-zinc-100">
      {/* Header */}
      <div className="pb-2 border-b border-white/[0.08]">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white border border-white/20 uppercase tracking-wider">
            Academic Component
          </span>
          <span className="text-xs text-zinc-600">•</span>
          <span className="text-xs text-zinc-400 font-medium">In-Context Learning & Schema Injection</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">Prompt Engineering Lab</h2>
        <p className="text-sm text-zinc-400">
          Understand how Role Prompting, Dynamic Context Injection, Few-Shot Demonstrations, and Structured Output constrain LLMs to generate valid, safe SQLite.
        </p>
      </div>

      {/* Navigation Pills */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.08] pb-3">
        {[
          { id: 'inspector', label: 'Live Prompt Inspector', icon: Terminal },
          { id: 'role', label: 'A. Role Prompting', icon: Cpu },
          { id: 'schema', label: 'B. Context Injection', icon: Layers },
          { id: 'few_shot', label: 'C. Few-Shot Library', icon: BookOpen },
          { id: 'constraints', label: 'D. Query Constraints', icon: ShieldCheck },
          { id: 'structured', label: 'E. Structured Output', icon: Code },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-white text-black font-bold shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-white/10'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content: Live Prompt Inspector */}
      {activeTab === 'inspector' && (
        <div className="space-y-6">
          {/* Question Input Card */}
          <div className="glass-card rounded-2xl p-5 space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
              Test Any Natural Language Question:
            </label>
            <div className="flex gap-2.5">
              <input
                type="text"
                value={inspectQuestion}
                onChange={(e) => setInspectQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') runLiveInspection(inspectQuestion);
                }}
                placeholder="e.g. Find the top 5 customers by total purchase amount."
                className="glass-input flex-1 px-4 py-2 text-xs rounded-xl font-sans"
              />
              <button
                onClick={() => runLiveInspection(inspectQuestion)}
                disabled={inspecting}
                className="glass-button-primary flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold disabled:opacity-40"
              >
                <Sparkles className={`w-3.5 h-3.5 ${inspecting ? 'animate-spin' : ''}`} />
                <span>{inspecting ? 'Synthesizing...' : 'Inspect Prompt'}</span>
              </button>
            </div>

            {/* Quick Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-zinc-500 font-medium">Quick Presets:</span>
              {[
                'Show all students who scored more than 80 marks.',
                'Find the top 5 customers by total purchase amount.',
                'How many employees work in each department?',
                'Display the average salary of employees.',
              ].map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInspectQuestion(q);
                    runLiveInspection(q);
                  }}
                  className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-white/10 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Two-Column Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Final Constructed Prompt */}
            <div className="glass-card rounded-2xl flex flex-col overflow-hidden">
              <div className="px-5 py-3.5 bg-white/[0.03] border-b border-white/[0.08] flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <Terminal className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Final Constructed Prompt (Sent to LLM)</span>
                </div>
                <button
                  onClick={copyFullPrompt}
                  className="flex items-center gap-1.5 text-[11px] text-zinc-300 hover:text-white px-2.5 py-1 rounded-lg bg-white/[0.06] border border-white/10"
                >
                  {copiedPrompt ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedPrompt ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="p-4 bg-black/60 font-mono text-xs text-zinc-300 overflow-y-auto max-h-[500px] leading-relaxed whitespace-pre-wrap select-text">
                {liveInspection?.final_constructed_prompt || 'Assembling prompt...'}
              </div>
            </div>

            {/* Right: LLM Generated Response & Extracted SQL */}
            <div className="space-y-4">
              {/* Generated Response JSON */}
              <div className="glass-card rounded-2xl overflow-hidden">
                <div className="px-5 py-3 bg-white/[0.03] border-b border-white/[0.08] flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <Code className="w-4 h-4 text-emerald-400" />
                    <span>LLM Structured JSON Output</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                    VALIDATED JSON
                  </span>
                </div>

                <div className="p-4 bg-black/60 font-mono text-xs text-zinc-300 overflow-y-auto max-h-[220px]">
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(liveInspection?.llm_response || {}, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Extracted SQL Query */}
              <div className="glass-card rounded-2xl overflow-hidden">
                <div className="px-5 py-3 bg-white/[0.03] border-b border-white/[0.08] flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <Sparkles className="w-4 h-4 text-white" />
                    <span>Extracted SQLite Query</span>
                  </div>
                  <span className="text-[10px] bg-white/10 text-white border border-white/20 px-2 py-0.5 rounded-full font-bold">
                    READY TO EXECUTE
                  </span>
                </div>

                <div className="p-4 bg-black/80 font-mono text-xs text-emerald-400 overflow-x-auto leading-relaxed">
                  <code>{liveInspection?.llm_response?.sql_query || '-- SQL will appear here'}</code>
                </div>
              </div>

              {/* Thought Process Breakdown */}
              {liveInspection?.llm_response?.thought_process && (
                <div className="glass-card rounded-2xl p-4 space-y-1.5">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-zinc-400" />
                    <span>LLM Reasoning Strategy:</span>
                  </span>
                  <p className="text-xs text-zinc-300 whitespace-pre-line leading-relaxed">
                    {liveInspection.llm_response.thought_process}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: A. Role Prompting */}
      {activeTab === 'role' && (
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-white/[0.08]">
            <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center font-bold border border-white/15">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Role Prompting Architecture</h3>
              <p className="text-xs text-zinc-400">
                Grounds the model into the persona of an expert database engineer and SQL optimizer.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-black/60 font-mono text-xs text-zinc-200 border border-white/[0.08] leading-relaxed">
            {breakdown?.role_prompt}
          </div>

          <div className="text-xs text-zinc-400 space-y-2">
            <h4 className="font-bold text-white">Why Role Prompting Matters:</h4>
            <p>
              By instructing the LLM to act as a <strong>Senior SQLite Database Architect</strong>, we prime the neural weights to prioritize idiomatic syntax, performance considerations, and strict compliance over conversational chattiness.
            </p>
          </div>
        </div>
      )}

      {/* Tab Content: B. Context Injection */}
      {activeTab === 'schema' && (
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-white/[0.08]">
            <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center font-bold border border-white/15">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Dynamic Context Injection (Schema DDL)</h3>
              <p className="text-xs text-zinc-400">
                Real database metadata, column data types, foreign keys, and sample rows injected dynamically.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-black/60 font-mono text-xs text-emerald-300 border border-white/[0.08] max-h-[400px] overflow-y-auto leading-relaxed whitespace-pre-wrap">
            {breakdown?.schema_context}
          </div>

          <div className="text-xs text-zinc-400 space-y-2">
            <h4 className="font-bold text-white">Why Dynamic Context Injection Matters:</h4>
            <p>
              Without actual schema context, models hallucinate table names and column names. NL2SQL extracts real schema metadata from SQLite via SQLAlchemy inspection and formats it cleanly with primary and foreign key constraints, eliminating schema hallucinations.
            </p>
          </div>
        </div>
      )}

      {/* Tab Content: C. Few-Shot Library */}
      {activeTab === 'few_shot' && (
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-base font-bold text-white">Few-Shot Prompting Library ({breakdown?.few_shot_examples?.length || 0} Demonstrations)</h3>
            <p className="text-xs text-zinc-400">
              Exemplar natural language and SQL pairs demonstrating relational joins, aggregations, and subqueries.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(breakdown?.few_shot_examples || []).map((ex) => (
              <div key={ex.id} className="glass-card rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white px-2.5 py-0.5 rounded-full border border-white/15">
                    {ex.category}
                  </span>
                  <span className="text-xs font-mono text-zinc-500">Example #{ex.id}</span>
                </div>

                <div>
                  <span className="text-[11px] text-zinc-500 font-semibold uppercase">Question:</span>
                  <p className="text-xs font-bold text-white mt-0.5">"{ex.question}"</p>
                </div>

                <div>
                  <span className="text-[11px] text-zinc-500 font-semibold uppercase">Target SQL:</span>
                  <code className="block mt-1 p-2.5 rounded-xl bg-black/80 text-emerald-400 font-mono text-[11px] overflow-x-auto border border-white/[0.06]">
                    {ex.sql}
                  </code>
                </div>

                <div className="text-[11px] text-zinc-400 border-t border-white/[0.06] pt-2">
                  <span className="font-semibold text-white">Thought Process:</span> {ex.thought_process}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content: D. Query Constraints */}
      {activeTab === 'constraints' && (
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-white/[0.08]">
            <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center font-bold border border-white/15">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Query Constraints & Safety Rules</h3>
              <p className="text-xs text-zinc-400">
                Explicit behavioral guardrails provided in the prompt to prevent destructive actions and hallucinations.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {(breakdown?.query_constraints || []).map((constraint, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3.5 rounded-xl border border-white/[0.08] bg-white/[0.02] text-xs">
                <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <span className="text-zinc-200 font-medium">{constraint}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content: E. Structured Output */}
      {activeTab === 'structured' && (
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-white/[0.08]">
            <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center font-bold border border-white/15">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Structured Output Contract</h3>
              <p className="text-xs text-zinc-400">
                JSON schema instructions ensuring predictable responses without conversational preamble.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-black/60 font-mono text-xs text-zinc-200 border border-white/[0.08] leading-relaxed whitespace-pre-wrap">
            {breakdown?.structured_output_schema}
          </div>
        </div>
      )}
    </div>
  );
}
