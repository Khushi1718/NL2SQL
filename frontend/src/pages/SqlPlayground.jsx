import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Play,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Cpu,
  RefreshCw,
  Search,
  Database,
  Terminal,
  Table as TableIcon
} from 'lucide-react';
import SqlCodeEditor from '../components/SqlCodeEditor';
import {
  generateSQL,
  executeSQL,
  exportCSV,
  fetchQuerySuggestions,
  fetchAllDatabases,
  fetchDatabaseSchema
} from '../services/api';

export default function SqlPlayground({
  selectedDbId,
  onSelectDbId,
  initialQuery,
  onNavigateToDatabases,
  onOpenPromptTab
}) {
  const [databases, setDatabases] = useState([]);
  const [activeDbId, setActiveDbId] = useState(selectedDbId || '');
  const [activeSchema, setActiveSchema] = useState(null);
  const [schemaLoading, setSchemaLoading] = useState(false);

  // Playground state
  const [nlQuery, setNlQuery] = useState(initialQuery || '');
  const [generatedSql, setGeneratedSql] = useState('');
  const [thoughtProcess, setThoughtProcess] = useState('');
  const [explanation, setExplanation] = useState('');
  const [promptBreakdown, setPromptBreakdown] = useState(null);

  const [suggestions, setSuggestions] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  // Execution Results
  const [executionResult, setExecutionResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // UI state
  const [showThoughtProcess, setShowThoughtProcess] = useState(true);
  const [showSchemaDrawer, setShowSchemaDrawer] = useState(false);
  const [resultFilter, setResultFilter] = useState('');
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  // 1. Load all available databases on mount
  useEffect(() => {
    fetchAllDatabases()
      .then((data) => {
        const dbs = data.databases || [];
        setDatabases(dbs);
        if (dbs.length > 0) {
          const currentId = selectedDbId || dbs[0].database_id;
          setActiveDbId(currentId);
        }
      })
      .catch((err) => console.error('Error fetching databases', err));
  }, []);

  // Sync when selectedDbId prop changes from parent
  useEffect(() => {
    if (selectedDbId && selectedDbId !== activeDbId) {
      setActiveDbId(selectedDbId);
    }
  }, [selectedDbId]);

  // Sync initial query prop if provided
  useEffect(() => {
    if (initialQuery) {
      setNlQuery(initialQuery);
    }
  }, [initialQuery]);

  // 2. When active database changes, load its specific schema and suggestions!
  useEffect(() => {
    if (!activeDbId) return;

    setSchemaLoading(true);
    setExecutionResult(null);
    setGeneratedSql('');
    setErrorMessage(null);

    // Fetch schema for this exact database
    fetchDatabaseSchema(activeDbId)
      .then((schema) => {
        setActiveSchema(schema);
      })
      .catch((err) => {
        console.error('Failed to load database schema', err);
      })
      .finally(() => {
        setSchemaLoading(false);
      });

    // Fetch query suggestions matching this specific database
    fetchQuerySuggestions(activeDbId)
      .then((suggs) => {
        setSuggestions(suggs || []);
        if (!nlQuery && suggs && suggs.length > 0) {
          setNlQuery(suggs[0].question);
        }
      })
      .catch((err) => console.error('Error fetching suggestions', err));
  }, [activeDbId]);

  const handleDatabaseChange = (newDbId) => {
    setActiveDbId(newDbId);
    if (onSelectDbId) onSelectDbId(newDbId);
  };

  // Generate SQL tailored to the selected database
  const handleGenerate = async () => {
    if (!nlQuery.trim() || !activeDbId) return;

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const data = await generateSQL(nlQuery, activeDbId);
      setGeneratedSql(data.generated_sql);
      setThoughtProcess(data.thought_process || '');
      setExplanation(data.explanation || '');
      setPromptBreakdown(data.prompt_breakdown || null);

      if (!data.is_valid && data.validation_error) {
        setErrorMessage(`Validation Warning: ${data.validation_error}`);
      } else {
        handleExecute(data.generated_sql);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed to generate SQL';
      setErrorMessage(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  // Execute SQL against the active database
  const handleExecute = async (sqlToRun = generatedSql) => {
    const targetSql = (sqlToRun || generatedSql).trim();
    if (!targetSql) {
      setErrorMessage('Please provide or generate a SQL query to execute.');
      return;
    }

    setIsExecuting(true);
    setErrorMessage(null);

    try {
      const result = await executeSQL(
        targetSql,
        activeDbId,
        nlQuery,
        promptBreakdown ? JSON.stringify(promptBreakdown) : null
      );
      setExecutionResult(result);
      setPage(1);

      if (result.status !== 'SUCCESS') {
        setErrorMessage(result.error || 'Execution failed or query blocked by safety policy.');
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Execution error';
      setErrorMessage(msg);
      setExecutionResult({
        status: 'FAILED',
        columns: [],
        rows: [],
        row_count: 0,
        execution_time_ms: 0,
        error: msg
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleExportCSV = async () => {
    if (!executionResult || !executionResult.rows || executionResult.rows.length === 0) return;
    try {
      await exportCSV(
        executionResult.columns,
        executionResult.rows,
        `nl2sql_${activeDbId}_export.csv`
      );
    } catch (err) {
      alert('Failed to export CSV: ' + err.message);
    }
  };

  if (!databases || databases.length === 0) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center max-w-xl mx-auto text-center">
        <div className="bg-white border border-zinc-200/80 rounded-3xl p-10 space-y-4 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-900 flex items-center justify-center mx-auto border border-zinc-200/80">
            <Database className="w-6 h-6 text-zinc-800" />
          </div>
          <h3 className="font-serif text-2xl font-medium tracking-tight text-zinc-950">No Database Connected</h3>
          <p className="text-xs sm:text-sm text-zinc-500 font-normal leading-relaxed">
            Connect your first database to get started. You can upload CSV spreadsheets or existing SQLite database files.
          </p>
          <button
            onClick={onNavigateToDatabases}
            className="px-6 py-2.5 rounded-full bg-black hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            Go to My Databases
          </button>
        </div>
      </div>
    );
  }

  const activeDatabase = databases.find((d) => d.database_id === activeDbId) || databases[0];

  const filteredRows = (executionResult?.rows || []).filter((row) => {
    if (!resultFilter.trim()) return true;
    const term = resultFilter.toLowerCase();
    return Object.values(row).some((val) =>
      val !== null && val !== undefined && String(val).toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filteredRows.length / rowsPerPage) || 1;
  const paginatedRows = filteredRows.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  return (
    <div className="flex-1 px-4 sm:px-8 lg:px-12 py-6 sm:py-8 space-y-8 overflow-y-auto max-w-6xl mx-auto w-full text-left">
      {/* ======================================================== */}
      {/* DATABASE SELECTOR BAR AT THE TOP OF SQL PLAYGROUND       */}
      {/* Clean, standard toolbar layout (no rounded cylinder)     */}
      {/* ======================================================== */}
      <div className="bg-white border border-zinc-200/90 rounded-lg px-4 py-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700 shrink-0">
              <Database className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-zinc-900">
                Active Database:
              </span>
            </div>
          </div>

          {/* Database Selector Dropdown - Standard rectangular styling */}
          <div className="relative min-w-[260px] sm:min-w-[300px]">
            <select
              value={activeDbId}
              onChange={(e) => handleDatabaseChange(e.target.value)}
              className="w-full appearance-none pl-3 pr-8 py-1.5 rounded-md border border-zinc-200 bg-white hover:border-zinc-300 text-zinc-900 font-medium text-xs focus:outline-none focus:border-zinc-900 shadow-2xs cursor-pointer transition-colors"
            >
              {databases.map((db) => (
                <option key={db.database_id} value={db.database_id} className="bg-white text-zinc-900">
                  {db.database_name} ({db.table_count || 1} tables • {db.record_count || 0} rows)
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-2 pointer-events-none" />
          </div>
        </div>

        {/* Database Quick Info & Schema Drawer Toggle */}
        <div className="flex items-center gap-2 text-xs">
          {schemaLoading ? (
            <span className="text-zinc-500 flex items-center gap-1.5 text-xs">
              <RefreshCw className="w-3 h-3 animate-spin text-zinc-700" />
              <span>Loading schema...</span>
            </span>
          ) : activeSchema ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSchemaDrawer(!showSchemaDrawer)}
                className="px-3 py-1.5 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 font-medium text-xs flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                title="View tables and columns in this database"
              >
                <TableIcon className="w-3.5 h-3.5 text-zinc-500" />
                <span>{Object.keys(activeSchema.tables || {}).length} Tables</span>
                <span className="text-[10px] text-zinc-400">({showSchemaDrawer ? 'Hide' : 'Inspect'})</span>
              </button>

              <button
                onClick={onNavigateToDatabases}
                className="px-2.5 py-1.5 rounded-md text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 font-medium text-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Manage</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Collapsible Schema Inspector for Selected Database */}
      {showSchemaDrawer && activeSchema && (
        <div className="bg-white border border-zinc-200/90 rounded-lg p-4 space-y-3 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <TableIcon className="w-4 h-4 text-zinc-700" />
              <span className="font-serif text-sm font-medium text-zinc-950">
                Database Schema: {activeDatabase?.database_name}
              </span>
            </div>
            <span className="text-xs text-zinc-400 font-normal">
              Only verified tables and columns are referenced
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.values(activeSchema.tables || {}).map((t) => (
              <div key={t.name} className="p-3 rounded-lg bg-zinc-50/70 border border-zinc-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between font-mono font-bold text-xs text-zinc-900">
                  <span>{t.name}</span>
                  <span className="text-[10px] bg-white border border-zinc-200 px-2 py-0.5 rounded text-zinc-700 font-sans font-medium">
                    {t.row_count} rows
                  </span>
                </div>
                <div className="text-[11px] font-mono text-zinc-500 flex flex-wrap gap-1">
                  {t.columns.map((c) => (
                    <span key={c.name} className="bg-white border border-zinc-200/80 px-1.5 py-0.5 rounded text-zinc-700 text-[10px]">
                      {c.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* NATURAL LANGUAGE INPUT CARD (HOW IT WORKS SERIF AESTHETIC) */}
      {/* ======================================================== */}
      <div className="bg-white border border-zinc-200/80 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xs text-left">
        <div className="space-y-1.5">
          <div className="inline-block px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200/80 text-zinc-700 text-[11px] font-semibold">
            Natural Language Query
          </div>
          <h3 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-zinc-950">
            Ask in Plain English
          </h3>
          <p className="text-sm text-zinc-500 font-normal leading-relaxed max-w-xl">
            Type any question about your data. The engine inspects your relational schema and generates verified, AST-safe SQL.
          </p>
        </div>

        <div className="relative">
          <textarea
            value={nlQuery}
            onChange={(e) => setNlQuery(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                handleGenerate();
              }
            }}
            rows={3}
            placeholder={`e.g. Show all records from ${activeSchema && Object.keys(activeSchema.tables || {})[0] ? Object.keys(activeSchema.tables)[0] : 'the table'}`}
            className="w-full py-3.5 px-4 rounded-xl border border-zinc-200 bg-zinc-50/50 hover:bg-zinc-50 focus:bg-white text-sm text-zinc-950 placeholder:text-zinc-400 font-normal resize-none focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 shadow-2xs leading-relaxed transition-all"
          />
        </div>

        {/* Suggestion Chips */}
        {suggestions.length > 0 && (
          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-semibold text-zinc-400 block">
              Suggested queries for {activeDatabase?.database_name}:
            </span>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setNlQuery(item.question)}
                  className="px-3.5 py-1.5 rounded-full text-xs bg-zinc-50 hover:bg-zinc-100 text-zinc-700 hover:text-zinc-950 border border-zinc-200/80 shadow-2xs transition-all text-left cursor-pointer"
                >
                  {item.question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-zinc-100">
          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !nlQuery.trim()}
              className="px-6 py-2.5 rounded-full bg-black hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40 active:scale-95"
            >
              <Terminal className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Synthesizing SQL...' : 'Generate SQL'}</span>
            </button>

            {generatedSql && (
              <button
                onClick={() => handleExecute(generatedSql)}
                disabled={isExecuting}
                className="px-5 py-2.5 rounded-full bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-200 text-xs font-semibold shadow-2xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40 active:scale-95"
              >
                <Play className={`w-3.5 h-3.5 ${isExecuting ? 'animate-spin' : ''}`} />
                <span>{isExecuting ? 'Executing...' : 'Execute SQL'}</span>
              </button>
            )}
          </div>

          {promptBreakdown && onOpenPromptTab && (
            <button
              onClick={() => onOpenPromptTab(nlQuery, activeDbId)}
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-950 font-medium transition-colors cursor-pointer"
            >
              <Cpu className="w-3.5 h-3.5 text-zinc-400" />
              <span>Inspect Prompt Context</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Error / Validation Warning Box */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3 shadow-2xs">
          <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-rose-900">Query Issue Detected</p>
            <p className="mt-0.5 text-rose-700">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* LLM Reasoning & Thought Process */}
      {thoughtProcess && (
        <div className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden text-left shadow-2xs">
          <button
            onClick={() => setShowThoughtProcess(!showThoughtProcess)}
            className="w-full px-5 py-3.5 bg-zinc-50/70 border-b border-zinc-100 flex items-center justify-between text-xs font-semibold text-zinc-900 hover:bg-zinc-100/70 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-zinc-700" />
              <span className="font-serif text-sm font-medium text-zinc-950">Relational Strategy & Explanation ({activeDatabase?.database_name})</span>
            </div>
            {showThoughtProcess ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
          </button>

          {showThoughtProcess && (
            <div className="p-5 space-y-2 text-xs bg-white">
              <div className="text-zinc-600 font-normal whitespace-pre-line leading-relaxed">
                {thoughtProcess}
              </div>
              {explanation && (
                <div className="pt-2.5 border-t border-zinc-100 text-zinc-400 italic">
                  Summary: {explanation}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* GENERATED SQL CODE EDITOR                                 */}
      {/* ======================================================== */}
      <div className="space-y-2.5 text-left">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="font-serif text-lg sm:text-xl font-medium text-zinc-950 tracking-tight">
              Generated SQLite Query
            </h4>
            <span className="text-zinc-300">•</span>
            <span className="text-xs text-zinc-500 font-normal">
              Editable before execution
            </span>
          </div>
          <span className="text-[11px] font-semibold text-zinc-400">
            Strict Read-Only Enforcement
          </span>
        </div>

        <SqlCodeEditor
          value={generatedSql}
          onChange={(newVal) => setGeneratedSql(newVal)}
          onExecute={() => handleExecute(generatedSql)}
          isExecuting={isExecuting}
        />
      </div>

      {/* ======================================================== */}
      {/* EXECUTION RESULTS SECTION                                 */}
      {/* ======================================================== */}
      {executionResult && (
        <div className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden space-y-0 text-left shadow-2xs">
          {/* Status Bar */}
          <div className="px-6 py-3.5 bg-zinc-50/70 border-b border-zinc-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {executionResult.status === 'SUCCESS' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Success</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200/80 shadow-2xs">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Execution Failed</span>
                </span>
              )}

              <div className="flex items-center gap-1 text-xs text-zinc-500 font-normal">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                <span>{executionResult.execution_time_ms} ms</span>
              </div>

              <span className="text-zinc-300">•</span>

              <div className="flex items-center gap-1 text-xs text-zinc-500 font-normal">
                <Layers className="w-3.5 h-3.5 text-zinc-400" />
                <span>{executionResult.row_count} rows returned</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Search within results */}
              {executionResult.rows?.length > 0 && (
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
                  <input
                    type="text"
                    value={resultFilter}
                    onChange={(e) => {
                      setResultFilter(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Filter records..."
                    className="pl-8 pr-3 py-1 text-xs rounded-full border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:border-zinc-400 shadow-2xs"
                  />
                </div>
              )}

              {/* Download CSV button */}
              {executionResult.rows?.length > 0 && (
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-white hover:bg-zinc-50 text-zinc-800 border border-zinc-200 shadow-2xs transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-zinc-600" />
                  <span>Export CSV</span>
                </button>
              )}
            </div>
          </div>

          {/* Results Table */}
          <div className="overflow-x-auto max-h-[420px]">
            {executionResult.columns && executionResult.columns.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-100/90 text-zinc-700 uppercase tracking-wider text-[11px] font-semibold sticky top-0 z-10 border-b border-zinc-200 backdrop-blur-md">
                  <tr>
                    <th className="py-2.5 px-4 w-12 text-center text-zinc-400">#</th>
                    {executionResult.columns.map((col, idx) => (
                      <th key={idx} className="py-2.5 px-4 whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/70 font-mono text-zinc-800 bg-white/70">
                  {paginatedRows.length > 0 ? (
                    paginatedRows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-zinc-50/80 transition-colors">
                        <td className="py-2.5 px-4 text-center text-zinc-400 font-sans text-[11px]">
                          {(page - 1) * rowsPerPage + rIdx + 1}
                        </td>
                        {executionResult.columns.map((col, cIdx) => (
                          <td key={cIdx} className="py-2.5 px-4 whitespace-nowrap">
                            {row[col] !== null && row[col] !== undefined ? (
                              String(row[col])
                            ) : (
                              <span className="text-zinc-400 italic font-sans">NULL</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={executionResult.columns.length + 1} className="py-8 text-center text-zinc-500 font-sans">
                        No rows match your filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <div className="py-12 text-center text-zinc-500 font-sans text-xs">
                {executionResult.status === 'SUCCESS'
                  ? 'Query executed successfully with 0 records returned.'
                  : 'Execution failed or query blocked.'}
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {filteredRows.length > rowsPerPage && (
            <div className="px-6 py-3 bg-zinc-50/60 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
              <span>
                Showing {(page - 1) * rowsPerPage + 1} to {Math.min(page * rowsPerPage, filteredRows.length)} of {filteredRows.length} entries
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="px-3 py-1 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-30 text-zinc-800 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                >
                  Previous
                </button>
                <span className="px-2 font-semibold text-zinc-900">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="px-3 py-1 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-30 text-zinc-800 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
