import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  Database,
  ArrowUpRight,
  TrendingUp,
  Server,
  RefreshCw,
  Terminal
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { fetchDashboardStats } from '../services/api';

export default function Dashboard({ onOpenPlayground, onSelectQuery }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchDashboardStats();
      setStats(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch dashboard metrics from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-zinc-400">
          <RefreshCw className="w-8 h-8 text-white animate-spin" />
          <p className="text-sm font-medium">Loading live database metrics...</p>
        </div>
      </div>
    );
  }

  const successRate = stats?.total_queries
    ? Math.round((stats.successful_queries / stats.total_queries) * 100)
    : 100;

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full text-zinc-100">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.08]">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">System Performance & Queries</h2>
          <p className="text-sm text-zinc-400">Live operational data from SQLite and prompt-engineered executions</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            className="glass-button-secondary flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-white' : 'text-zinc-400'}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={onOpenPlayground}
            className="glass-button-primary flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>New Query</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
          {error}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Queries */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total Queries</span>
            <div className="w-8 h-8 rounded-xl bg-white/10 text-white flex items-center justify-center border border-white/15">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">{stats?.total_queries || 0}</span>
            <span className="text-xs font-medium text-emerald-400 flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" />
              {successRate}% success
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-500">Total natural language inquiries</p>
        </div>

        {/* Successful Queries */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Successful Queries</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">{stats?.successful_queries || 0}</span>
            <span className="text-xs text-zinc-400">validated & executed</span>
          </div>
          <p className="mt-1 text-xs text-zinc-500">Strictly read-only SELECT runs</p>
        </div>

        {/* Failed Queries */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Failed / Blocked</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">{stats?.failed_queries || 0}</span>
            <span className="text-xs text-rose-400 font-medium">safety blocked / errors</span>
          </div>
          <p className="mt-1 text-xs text-zinc-500">AST policy checks & syntax catches</p>
        </div>

        {/* Average Execution Time */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Avg Execution Time</span>
            <div className="w-8 h-8 rounded-xl bg-white/10 text-white flex items-center justify-center border border-white/15">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">{stats?.avg_execution_time_ms || 0}</span>
            <span className="text-xs font-medium text-zinc-400">ms / query</span>
          </div>
          <p className="mt-1 text-xs text-zinc-500">Sub-millisecond SQLite engine speed</p>
        </div>
      </div>

      {/* Middle Row: Activity Chart & Database Connection Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Chart */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Query Activity Timeline</h3>
              <p className="text-xs text-zinc-400">Daily frequency of queries processed</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-white"></span>
                <span className="text-zinc-300 font-medium">Successful</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-400"></span>
                <span className="text-zinc-300 font-medium">Failed</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.activity_chart || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffffff" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#09090b', borderColor: 'rgba(255,255,255,0.15)', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="successful" stroke="#ffffff" strokeWidth={2} fillOpacity={1} fill="url(#colorSuccess)" name="Successful" />
                <Area type="monotone" dataKey="failed" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorFailed)" name="Failed" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Database Connection Status Card */}
        <div className="glass-card rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-white" />
                <h3 className="text-sm font-bold text-white">Database Connection</h3>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                Online
              </span>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-white/[0.06]">
                <span className="text-zinc-400">Database Engine</span>
                <span className="font-semibold text-white">{stats?.database_status?.engine} (ACID Compliant)</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-white/[0.06]">
                <span className="text-zinc-400">Available Tables</span>
                <span className="font-semibold text-white">{stats?.database_status?.tables_count} Tables</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-white/[0.06]">
                <span className="text-zinc-400">Total Records</span>
                <span className="font-semibold text-white">{stats?.database_status?.total_records} Rows</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-white/[0.06]">
                <span className="text-zinc-400">Relational FKs</span>
                <span className="font-semibold text-white">{stats?.database_status?.relationships_count} Constraints</span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-white/[0.08]">
            <button
              onClick={() => onSelectQuery && onSelectQuery({ question: 'Show all students who scored more than 80 marks.' })}
              className="glass-button-secondary w-full py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <span>Test Sample Query</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Queries Section */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-6 py-4 bg-white/[0.02] border-b border-white/[0.08] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Recent Executed Queries</h3>
            <p className="text-xs text-zinc-400">Live query executions with execution times and records retrieved</p>
          </div>
          <button
            onClick={onOpenPlayground}
            className="text-xs font-semibold text-white hover:text-zinc-300 flex items-center gap-1 transition-colors"
          >
            <span>Launch Playground</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.04] text-zinc-400 uppercase tracking-wider text-[11px] border-b border-white/[0.08]">
              <tr>
                <th className="py-3 px-6 font-semibold">Status</th>
                <th className="py-3 px-6 font-semibold">Natural Language Inquiry</th>
                <th className="py-3 px-6 font-semibold">Generated SQL</th>
                <th className="py-3 px-6 font-semibold">Latency</th>
                <th className="py-3 px-6 font-semibold">Rows</th>
                <th className="py-3 px-6 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-zinc-200">
              {stats?.recent_queries?.length > 0 ? (
                stats.recent_queries.map((q) => (
                  <tr key={q.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-3 px-6 whitespace-nowrap">
                      {q.status === 'SUCCESS' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          SUCCESS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <XCircle className="w-3 h-3 text-rose-400" />
                          FAILED
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-6 font-medium text-white max-w-xs truncate" title={q.natural_language_query}>
                      {q.natural_language_query}
                    </td>
                    <td className="py-3 px-6 font-mono text-[11px] text-zinc-400 max-w-sm truncate" title={q.generated_sql}>
                      {q.generated_sql}
                    </td>
                    <td className="py-3 px-6 text-zinc-400 whitespace-nowrap">
                      {q.execution_time_ms} ms
                    </td>
                    <td className="py-3 px-6 text-zinc-300 font-medium whitespace-nowrap">
                      {q.row_count}
                    </td>
                    <td className="py-3 px-6 text-right whitespace-nowrap">
                      <button
                        onClick={() => onSelectQuery && onSelectQuery({ question: q.natural_language_query, sql: q.generated_sql })}
                        className="text-white hover:text-zinc-300 font-bold hover:underline inline-flex items-center gap-1"
                      >
                        Reopen
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-zinc-500">
                    No queries recorded yet. Visit the Playground to execute your first question!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
