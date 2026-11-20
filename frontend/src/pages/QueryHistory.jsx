import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { fetchHistory, deleteHistoryItem, clearAllHistory } from '../services/api';

export default function QueryHistory({ onReopenQuery, onRunQueryDirect }) {
  const [historyItems, setHistoryItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const limit = 20;

  const loadHistory = async () => {
    try {
      setLoading(true);
      const res = await fetchHistory({
        search,
        status: statusFilter,
        limit,
        offset: (page - 1) * limit,
      });
      setHistoryItems(res.items || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('Failed to load history', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [search, statusFilter, page]);

  const handleDelete = async (id) => {
    if (!window.confirm(`Are you sure you want to delete history record #${id}?`)) return;
    try {
      await deleteHistoryItem(id);
      loadHistory();
    } catch (err) {
      alert('Failed to delete history record: ' + err.message);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear ALL query history records?')) return;
    try {
      await clearAllHistory();
      loadHistory();
    } catch (err) {
      alert('Failed to clear history: ' + err.message);
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full text-zinc-100">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.08]">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Query Audit History</h2>
          <p className="text-sm text-zinc-400">
            Audit trail of natural language questions, synthesized SQL expressions, and execution outcomes.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadHistory}
            className="glass-button-secondary flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-white' : 'text-zinc-400'}`} />
            <span>Refresh</span>
          </button>
          {historyItems.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-3 py-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Clear History</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by question, SQL or error..."
            className="glass-input w-full pl-9 pr-3 py-1.5 text-xs rounded-xl"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex rounded-xl bg-white/[0.04] p-1 text-xs font-semibold border border-white/[0.08] self-stretch sm:self-auto justify-center">
          <button
            onClick={() => {
              setStatusFilter('ALL');
              setPage(1);
            }}
            className={`px-3 py-1 rounded-lg transition-all ${
              statusFilter === 'ALL' ? 'bg-white text-black font-bold shadow-[0_0_10px_rgba(255,255,255,0.2)]' : 'text-zinc-400 hover:text-white'
            }`}
          >
            All Queries ({total})
          </button>
          <button
            onClick={() => {
              setStatusFilter('SUCCESS');
              setPage(1);
            }}
            className={`px-3 py-1 rounded-lg transition-all ${
              statusFilter === 'SUCCESS' ? 'bg-white text-black font-bold shadow-[0_0_10px_rgba(255,255,255,0.2)]' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Successful
          </button>
          <button
            onClick={() => {
              setStatusFilter('FAILED');
              setPage(1);
            }}
            className={`px-3 py-1 rounded-lg transition-all ${
              statusFilter === 'FAILED' ? 'bg-white text-black font-bold shadow-[0_0_10px_rgba(255,255,255,0.2)]' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Failed / Blocked
          </button>
        </div>
      </div>

      {/* History Table Card */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.04] text-zinc-400 uppercase tracking-wider text-[11px] border-b border-white/[0.08]">
              <tr>
                <th className="py-3 px-5 font-semibold">Status</th>
                <th className="py-3 px-5 font-semibold">Timestamp</th>
                <th className="py-3 px-5 font-semibold">Natural Language Question</th>
                <th className="py-3 px-5 font-semibold">Generated SQL</th>
                <th className="py-3 px-5 font-semibold">Execution Time</th>
                <th className="py-3 px-5 font-semibold">Rows</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-zinc-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-zinc-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-white" />
                    <span>Loading query history records...</span>
                  </td>
                </tr>
              ) : historyItems.length > 0 ? (
                historyItems.map((item) => (
                  <tr key={item.id || item.query_id} className="hover:bg-white/[0.03] transition-colors">
                    {/* Status */}
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      {item.status === 'SUCCESS' || item.execution_status === 'SUCCESS' ? (
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

                    {/* Timestamp */}
                    <td className="py-3.5 px-5 text-zinc-500 whitespace-nowrap text-[11px]">
                      {item.created_at ? new Date(item.created_at).toLocaleString() : '—'}
                    </td>

                    {/* Question */}
                    <td className="py-3.5 px-5 font-semibold text-white max-w-xs truncate" title={item.natural_language_query || item.natural_language_question}>
                      {item.natural_language_query || item.natural_language_question}
                    </td>

                    {/* SQL */}
                    <td className="py-3.5 px-5 font-mono text-[11px] text-zinc-400 max-w-sm truncate" title={item.generated_sql}>
                      <code>{item.generated_sql}</code>
                    </td>

                    {/* Time */}
                    <td className="py-3.5 px-5 text-zinc-400 whitespace-nowrap">
                      {item.execution_time_ms || item.execution_time || 0} ms
                    </td>

                    {/* Rows */}
                    <td className="py-3.5 px-5 font-medium text-zinc-300 whitespace-nowrap">
                      {item.row_count || 0}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onReopenQuery({ question: item.natural_language_query || item.natural_language_question, sql: item.generated_sql })}
                          className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-[11px] transition-colors border border-white/10"
                          title="Open in SQL Playground"
                        >
                          Reopen
                        </button>
                        <button
                          onClick={() => handleDelete(item.id || item.query_id)}
                          className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-zinc-500">
                    No history records found. Run queries in the SQL Playground to record them here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 bg-white/[0.02] border-t border-white/[0.08] flex items-center justify-between text-xs text-zinc-400">
            <span>
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} queries
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded-lg border border-white/10 bg-white/[0.04] disabled:opacity-30 hover:bg-white/[0.08] text-white"
              >
                Previous
              </button>
              <span className="px-2 font-semibold text-white">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="px-3 py-1 rounded-lg border border-white/10 bg-white/[0.04] disabled:opacity-30 hover:bg-white/[0.08] text-white"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
