import React, { useState, useEffect } from 'react';
import {
  Database,
  Upload,
  Search,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Server,
  Clock,
  Trash2,
  Eye,
  RefreshCw,
  X,
  Terminal,
  Layers
} from 'lucide-react';
import {
  fetchAllDatabases,
  uploadDatabaseFile,
  deleteDatabase,
  fetchTablePreview,
  fetchDatabaseSchema
} from '../services/api';

export default function MyDatabases({ onSelectDatabaseForQuery }) {
  const [databases, setDatabases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mongoStatus, setMongoStatus] = useState(null);

  // Filter & Sort
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [file, setFile] = useState(null);
  const [databaseName, setDatabaseName] = useState('');
  const [tableName, setTableName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState(null);

  // Inspect Modal State
  const [inspectDb, setInspectDb] = useState(null);
  const [inspectSchema, setInspectSchema] = useState(null);
  const [inspectLoading, setInspectLoading] = useState(false);
  const [selectedTableForPreview, setSelectedTableForPreview] = useState('');
  const [tablePreviewData, setTablePreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const loadDatabases = async () => {
    try {
      setLoading(true);
      const data = await fetchAllDatabases();
      setDatabases(data.databases || []);
      setMongoStatus(data.mongodb_status || null);
    } catch (err) {
      console.error('Failed to load databases', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatabases();
  }, []);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file || !databaseName.trim()) {
      alert('Please select a CSV or SQLite file and provide a database name.');
      return;
    }

    setIsUploading(true);
    setUploadFeedback(null);

    try {
      const res = await uploadDatabaseFile(file, databaseName.trim(), tableName.trim());
      setUploadFeedback({
        type: 'success',
        message: `Database '${res.database.database_name}' uploaded and persisted in MongoDB GridFS successfully!`,
      });
      loadDatabases();
      setTimeout(() => {
        setShowUploadModal(false);
        setFile(null);
        setDatabaseName('');
        setTableName('');
        setUploadFeedback(null);
      }, 1400);
    } catch (err) {
      setUploadFeedback({
        type: 'error',
        message: err.response?.data?.detail || err.message || 'Upload failed',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (databaseId, databaseName) => {
    if (!window.confirm(`Are you sure you want to delete database '${databaseName}'? This will delete all tables and MongoDB GridFS records.`)) {
      return;
    }

    try {
      await deleteDatabase(databaseId);
      loadDatabases();
    } catch (err) {
      alert('Failed to delete database: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleInspect = async (db) => {
    setInspectDb(db);
    setInspectLoading(true);
    setTablePreviewData(null);
    try {
      const schema = await fetchDatabaseSchema(db.database_id);
      setInspectSchema(schema);
      const tables = Object.keys(schema.tables || {});
      if (tables.length > 0) {
        setSelectedTableForPreview(tables[0]);
        loadTablePreview(db.database_id, tables[0]);
      }
    } catch (err) {
      console.error('Failed to inspect database', err);
    } finally {
      setInspectLoading(false);
    }
  };

  const loadTablePreview = async (dbId, tName) => {
    setPreviewLoading(true);
    try {
      const preview = await fetchTablePreview(dbId, tName, 30);
      setTablePreviewData(preview);
    } catch (err) {
      console.error('Failed to load table preview', err);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Filter & Sort databases
  const filteredDbs = databases.filter((db) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      db.database_name.toLowerCase().includes(term) ||
      db.original_filename.toLowerCase().includes(term) ||
      db.database_id.toLowerCase().includes(term)
    );
  }).sort((a, b) => {
    if (sortBy === 'name_asc') {
      return a.database_name.localeCompare(b.database_name);
    }
    if (sortBy === 'records_desc') {
      return (b.record_count || 0) - (a.record_count || 0);
    }
    return new Date(b.upload_date || 0) - new Date(a.upload_date || 0);
  });

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200/80">
        <div className="text-left">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-700 bg-white border border-zinc-200 px-2.5 py-0.5 rounded-full shadow-xs">
              Multi-Database Storage
            </span>
            <span className="text-xs text-zinc-400">•</span>
            <span className="text-xs text-zinc-600 font-medium">MongoDB GridFS + SQLite Engine</span>
          </div>
          <h2 className="text-2xl font-serif font-bold text-zinc-950 tracking-tight">My Databases</h2>
          <p className="text-sm text-zinc-600">
            Upload and manage multiple CSV datasets and SQLite databases simultaneously. Data remains permanently accessible across backend restarts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadDatabases}
            className="glass-button-secondary flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-zinc-800' : 'text-zinc-600'}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setShowUploadModal(true)}
            className="glass-button-primary flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold"
          >
            <Upload className="w-4 h-4" />
            <span>Upload New Database</span>
          </button>
        </div>
      </div>

      {/* MongoDB Status Alert */}
      {mongoStatus && !mongoStatus.connected && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-3 backdrop-blur-md">
          <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="font-bold text-amber-200">MongoDB Persistence Alert</p>
            <p className="mt-0.5">{mongoStatus.message}</p>
            <p className="mt-1 text-[11px] text-amber-400/80">
              Databases are executing locally. To persist files in MongoDB GridFS permanently, please check your MongoDB server or configure MONGODB_URI in backend/.env.
            </p>
          </div>
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <div className="glass-panel rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search databases by name or filename..."
            className="glass-input w-full pl-9 pr-3 py-1.5 text-xs rounded-xl"
          />
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end text-xs">
          <span className="text-zinc-400 font-medium">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="glass-input px-3 py-1.5 text-xs rounded-xl font-medium text-white cursor-pointer"
          >
            <option value="date_desc" className="bg-[#121217]">Latest Uploaded</option>
            <option value="name_asc" className="bg-[#121217]">Database Name (A-Z)</option>
            <option value="records_desc" className="bg-[#121217]">Most Records</option>
          </select>
        </div>
      </div>

      {/* Database Cards Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2 text-zinc-500 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin text-white" />
          <span>Loading databases from MongoDB GridFS...</span>
        </div>
      ) : filteredDbs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDbs.map((db) => {
            const isBenchmark = db.is_default || db.database_id === 'db_benchmark_default';
            return (
              <div
                key={db.database_id}
                className="glass-card rounded-2xl p-6 flex flex-col justify-between overflow-hidden group transition-all duration-300 border border-zinc-200/90 shadow-xs text-left hover:border-zinc-300"
              >
                {/* Card Top */}
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-950 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                        {db.file_type === 'csv' ? <FileSpreadsheet className="w-5 h-5 text-zinc-200" /> : <Database className="w-5 h-5 text-white" />}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-zinc-950 group-hover:text-black transition-colors line-clamp-1" title={db.database_name}>
                          {db.database_name}
                        </h3>
                        <p className="text-[11px] font-mono text-zinc-500">
                          {db.original_filename}
                        </p>
                      </div>
                    </div>

                    {isBenchmark ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-800 border border-zinc-200 px-2 py-0.5 rounded-full shrink-0">
                        Benchmark
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-zinc-50 text-zinc-600 border border-zinc-200 px-2 py-0.5 rounded-full shrink-0">
                        Custom DB
                      </span>
                    )}
                  </div>

                  {/* Metadata Stats */}
                  <div className="grid grid-cols-2 gap-3 py-3 border-y border-zinc-200/80 text-xs">
                    <div>
                      <span className="text-zinc-500 block text-[11px]">Tables:</span>
                      <span className="font-bold text-zinc-950">{db.table_count || 1} {db.table_count === 1 ? 'Table' : 'Tables'}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[11px]">Total Records:</span>
                      <span className="font-bold text-zinc-950">{db.record_count?.toLocaleString() || 0} Rows</span>
                    </div>
                  </div>

                  {/* Storage Status */}
                  <div className="flex items-center justify-between text-[11px] text-zinc-500">
                    <span className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-medium">
                      <Server className="w-3 h-3 text-emerald-600" />
                      <span>MongoDB GridFS</span>
                    </span>
                    <span className="flex items-center gap-1 text-zinc-500">
                      <Clock className="w-3 h-3" />
                      <span>{db.upload_date ? new Date(db.upload_date).toLocaleDateString() : 'Active'}</span>
                    </span>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-5 mt-4 border-t border-zinc-200/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleInspect(db)}
                      className="glass-button-secondary px-3.5 py-1.5 rounded-full font-semibold text-xs flex items-center gap-1.5"
                      title="Inspect Tables & Preview Records"
                    >
                      <Eye className="w-3.5 h-3.5 text-zinc-600" />
                      <span>Inspect</span>
                    </button>

                    {!isBenchmark && (
                      <button
                        onClick={() => handleDelete(db.database_id, db.database_name)}
                        className="p-1.5 rounded-full text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Database"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Primary Action: Select for Querying */}
                  <button
                    onClick={() => onSelectDatabaseForQuery(db.database_id)}
                    className="glass-button-primary px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Query</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-12 text-center max-w-md mx-auto space-y-4 border border-zinc-200/80 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-zinc-950 text-white flex items-center justify-center mx-auto shadow-xs">
            <Database className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-zinc-950">No Databases Found</h3>
          <p className="text-xs text-zinc-600">
            Upload your first CSV dataset or SQLite database file to begin querying with natural language.
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="glass-button-primary px-5 py-2.5 rounded-full text-xs font-bold"
          >
            Upload Database
          </button>
        </div>
      )}

      {/* UPLOAD MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="glass-card rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 border border-white/15 bg-[#101014]/90">
            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center border border-white/15">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Upload Database to NL2SQL</h3>
                <p className="text-xs text-zinc-400">Persisted in MongoDB GridFS and queryable in SQLite</p>
              </div>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Database Display Name: <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={databaseName}
                  onChange={(e) => setDatabaseName(e.target.value)}
                  placeholder="e.g. Sales Database or College Database"
                  required
                  className="glass-input w-full px-3 py-2 text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Primary Table Name (for CSV only):
                </label>
                <input
                  type="text"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  placeholder="e.g. products, sales, students (defaults to filename)"
                  className="glass-input w-full px-3 py-2 text-xs rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Select File (.csv or SQLite .sqlite, .db): <span className="text-rose-400">*</span>
                </label>
                <div className="border-2 border-dashed border-white/15 rounded-xl p-6 text-center hover:bg-white/[0.03] transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    accept=".csv,.sqlite,.sqlite3,.db"
                    required
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const selected = e.target.files[0];
                        setFile(selected);
                        if (!databaseName) {
                          const base = selected.name.replace(/\.[^/.]+$/, '');
                          setDatabaseName(base.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) + ' Database');
                        }
                        if (!tableName && selected.name.endsWith('.csv')) {
                          setTableName(selected.name.replace(/\.csv$/i, ''));
                        }
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <FileSpreadsheet className="w-8 h-8 text-white mx-auto mb-2" />
                  <p className="text-xs font-bold text-white">
                    {file ? file.name : 'Click or drop your .csv or .sqlite file here'}
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Supports CSV with automatic data type inference or full SQLite databases (up to 25MB)
                  </p>
                </div>
              </div>

              {uploadFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    uploadFeedback.type === 'success'
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                  }`}
                >
                  {uploadFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{uploadFeedback.message}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 font-semibold text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="glass-button-primary px-5 py-2.5 rounded-xl font-bold disabled:opacity-40"
                >
                  {isUploading ? 'Persisting to GridFS...' : 'Upload & Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INSPECT TABLES & SCHEMA MODAL */}
      {inspectDb && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="glass-card rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-white/15 overflow-hidden animate-in fade-in zoom-in-95 duration-150 bg-[#0f0f13]/95">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-white/[0.03] border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center font-bold">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{inspectDb.database_name}</h3>
                  <p className="text-xs text-zinc-400 font-mono">
                    ID: {inspectDb.database_id} • {inspectDb.table_count || 1} Tables • {inspectDb.record_count || 0} Total Records
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    const id = inspectDb.database_id;
                    setInspectDb(null);
                    onSelectDatabaseForQuery(id);
                  }}
                  className="glass-button-primary px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Query in Playground</span>
                </button>

                <button
                  onClick={() => setInspectDb(null)}
                  className="text-zinc-400 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {inspectLoading ? (
                <div className="py-16 text-center text-zinc-400 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-white" />
                  <span>Inspecting database tables and columns...</span>
                </div>
              ) : inspectSchema ? (
                <div className="space-y-6">
                  {/* Tables Selector tabs */}
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-2">
                      Available Tables in this Database:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(inspectSchema.tables || {}).map((tName) => (
                        <button
                          key={tName}
                          onClick={() => {
                            setSelectedTableForPreview(tName);
                            loadTablePreview(inspectDb.database_id, tName);
                          }}
                          className={`px-3 py-1.5 rounded-xl font-mono text-xs font-semibold transition-all ${
                            selectedTableForPreview === tName
                              ? 'bg-white text-black font-bold shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                              : 'bg-white/[0.05] text-zinc-300 hover:bg-white/[0.1] border border-white/10'
                          }`}
                        >
                          {tName} ({inspectSchema.tables[tName].row_count || 0} rows)
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Schema Structure of selected table */}
                  {selectedTableForPreview && inspectSchema.tables[selectedTableForPreview] && (
                    <div className="glass-card rounded-2xl p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white font-mono text-sm">
                          Table: {selectedTableForPreview}
                        </span>
                        <span className="text-[11px] text-zinc-400">
                          {inspectSchema.tables[selectedTableForPreview].columns?.length || 0} Columns
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs bg-black/40 rounded-xl overflow-hidden border border-white/[0.08]">
                          <thead className="bg-white/[0.04] text-zinc-300 font-semibold uppercase text-[11px] border-b border-white/[0.08]">
                            <tr>
                              <th className="py-2.5 px-4">Column Name</th>
                              <th className="py-2.5 px-4">Data Type</th>
                              <th className="py-2.5 px-4">Key Constraint</th>
                              <th className="py-2.5 px-4">Reference</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/[0.06] font-mono text-zinc-200">
                            {inspectSchema.tables[selectedTableForPreview].columns.map((c, i) => (
                              <tr key={i} className="hover:bg-white/[0.03]">
                                <td className="py-2 px-4 font-semibold text-white">
                                  {c.name}
                                </td>
                                <td className="py-2 px-4 text-zinc-300 font-bold">{c.type}</td>
                                <td className="py-2 px-4">
                                  {c.primary_key ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white border border-white/20">
                                      PRIMARY KEY
                                    </span>
                                  ) : (
                                    <span className="text-zinc-600 font-sans">—</span>
                                  )}
                                </td>
                                <td className="py-2 px-4 font-sans text-zinc-400">
                                  {c.foreign_key || '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Sample Records of selected table */}
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-2">
                      Sample Data Records ({tablePreviewData?.count || 0} preview rows):
                    </span>
                    <div className="glass-card rounded-2xl overflow-x-auto max-h-[300px]">
                      {previewLoading ? (
                        <div className="py-8 text-center text-zinc-500">Loading sample rows...</div>
                      ) : tablePreviewData && tablePreviewData.rows?.length > 0 ? (
                        <table className="w-full text-left text-xs">
                          <thead className="bg-white/[0.04] text-zinc-300 sticky top-0 font-semibold uppercase text-[11px] border-b border-white/[0.08] backdrop-blur-md">
                            <tr>
                              {tablePreviewData.columns.map((col, idx) => (
                                <th key={idx} className="py-2.5 px-4 whitespace-nowrap">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/[0.06] font-mono text-zinc-200">
                            {tablePreviewData.rows.map((row, rIdx) => (
                              <tr key={rIdx} className="hover:bg-white/[0.03]">
                                {tablePreviewData.columns.map((col, cIdx) => (
                                  <td key={cIdx} className="py-2 px-4 whitespace-nowrap">
                                    {row[col] !== null && row[col] !== undefined ? String(row[col]) : <span className="text-zinc-600 italic">NULL</span>}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="py-8 text-center text-zinc-500">No records found.</div>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
