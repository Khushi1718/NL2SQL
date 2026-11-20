import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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

export default function MyDatabases({ onSelectDatabaseForQuery, onDatabasesChanged }) {
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
      if (onDatabasesChanged) {
        onDatabasesChanged();
      }
    } catch (err) {
      console.error('Failed to load databases', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatabases();
  }, []);

  // Lock body scroll when modal is active so fixed backdrop never shifts
  useEffect(() => {
    if (showUploadModal || inspectDb) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [showUploadModal, inspectDb]);

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
    <div className="flex-1 px-4 sm:px-8 lg:px-12 py-6 sm:py-8 space-y-8 max-w-6xl mx-auto w-full text-left">
      {/* Page Header (Matching How It Works Editorial Theme) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div className="space-y-2">
          <div className="inline-block px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200/80 text-zinc-700 text-[11px] font-semibold">
            Multi-Database Storage • MongoDB GridFS + SQLite
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-medium text-zinc-950 tracking-tight">
            Connected Databases
          </h2>
          <p className="text-sm text-zinc-500 font-normal leading-relaxed max-w-xl">
            Upload CSV datasets or SQLite files. All schemas and tables are persisted permanently and queryable with natural language.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadDatabases}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-white hover:bg-zinc-50 text-zinc-800 border border-zinc-200 shadow-2xs transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-zinc-800' : 'text-zinc-600'}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold bg-black hover:bg-zinc-800 text-white shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Database</span>
          </button>
        </div>
      </div>

      {/* MongoDB Status Alert */}
      {mongoStatus && !mongoStatus.connected && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-3 shadow-2xs">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-amber-900">MongoDB Persistence Alert</p>
            <p className="mt-0.5">{mongoStatus.message}</p>
            <p className="mt-1 text-[11px] text-amber-700">
              Databases are executing locally in SQLite. To persist files across full restarts, connect MongoDB GridFS in backend/.env.
            </p>
          </div>
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search databases by name or filename..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-200 bg-zinc-50/70 hover:bg-zinc-100/70 focus:bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 shadow-2xs transition-colors"
          />
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end text-xs">
          <span className="text-zinc-400 font-medium text-xs">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3.5 py-2 text-xs rounded-xl border border-zinc-200 bg-zinc-50/70 hover:bg-zinc-100/70 text-zinc-900 font-medium cursor-pointer shadow-2xs focus:outline-none focus:border-zinc-900 transition-colors"
          >
            <option value="date_desc">Latest Uploaded</option>
            <option value="name_asc">Database Name (A-Z)</option>
            <option value="records_desc">Most Records</option>
          </select>
        </div>
      </div>

      {/* Database Cards Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2 text-zinc-400 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin text-zinc-800" />
          <span>Loading databases from storage...</span>
        </div>
      ) : filteredDbs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDbs.map((db) => {
            const isBenchmark = db.is_default || db.database_id === 'db_benchmark_default';
            return (
              <div
                key={db.database_id}
                className="bg-white border border-zinc-200/80 rounded-3xl p-6 flex flex-col justify-between overflow-hidden group transition-all duration-300 shadow-2xs hover:shadow-md hover:border-zinc-300 text-left space-y-5"
              >
                {/* Card Top */}
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200/80 text-zinc-900 flex items-center justify-center font-bold text-sm shadow-2xs shrink-0 group-hover:bg-zinc-950 group-hover:text-white transition-colors">
                        {db.file_type === 'csv' ? <FileSpreadsheet className="w-5 h-5 text-current" /> : <Database className="w-5 h-5 text-current" />}
                      </div>
                      <div>
                        <h3 className="font-serif text-lg font-medium text-zinc-950 group-hover:text-zinc-700 transition-colors line-clamp-1" title={db.database_name}>
                          {db.database_name}
                        </h3>
                        <p className="text-xs text-zinc-400 font-normal font-sans truncate max-w-[170px]">
                          {db.original_filename}
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] font-semibold tracking-wide bg-zinc-100 text-zinc-600 border border-zinc-200/80 px-2.5 py-0.5 rounded-full shrink-0">
                      {isBenchmark ? 'Benchmark' : 'Custom DB'}
                    </span>
                  </div>

                  {/* Metadata Stats */}
                  <div className="grid grid-cols-2 gap-3 py-3 border-y border-zinc-100 text-xs">
                    <div>
                      <span className="text-zinc-400 block text-[11px] font-normal">Tables</span>
                      <span className="font-semibold text-zinc-950 text-xs">{db.table_count || 1} {db.table_count === 1 ? 'Table' : 'Tables'}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[11px] font-normal">Total Records</span>
                      <span className="font-semibold text-zinc-950 text-xs">{db.record_count?.toLocaleString() || 0} Rows</span>
                    </div>
                  </div>

                  {/* Storage Status */}
                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      <span>MongoDB GridFS</span>
                    </span>
                    <span className="flex items-center gap-1 text-zinc-400 font-normal">
                      <Clock className="w-3 h-3 text-zinc-400" />
                      <span>{db.upload_date ? new Date(db.upload_date).toLocaleDateString() : 'Active'}</span>
                    </span>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleInspect(db)}
                      className="px-3.5 py-1.5 rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 font-semibold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                      title="Inspect Tables & Preview Records"
                    >
                      <Eye className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Inspect</span>
                    </button>

                    {!isBenchmark && (
                      <button
                        onClick={() => handleDelete(db.database_id, db.database_name)}
                        className="p-1.5 rounded-full text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Database"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Primary Action: Select for Querying */}
                  <button
                    onClick={() => onSelectDatabaseForQuery(db.database_id)}
                    className="px-4 py-1.5 rounded-full bg-black hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
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
        <div className="bg-white border border-zinc-200/80 rounded-3xl p-12 text-center max-w-md mx-auto space-y-4 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 border border-zinc-200/80 text-zinc-950 flex items-center justify-center mx-auto shadow-2xs">
            <Database className="w-6 h-6 text-zinc-800" />
          </div>
          <h3 className="font-serif text-2xl font-medium tracking-tight text-zinc-950">No Databases Found</h3>
          <p className="text-xs sm:text-sm text-zinc-500 font-normal leading-relaxed">
            Upload your first CSV dataset or SQLite database file to begin querying with natural language.
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-6 py-2.5 rounded-full bg-black hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            Upload Database
          </button>
        </div>
      )}

      {/* UPLOAD MODAL (Clean Light Theme - Portaled to document.body) */}
      {showUploadModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
          {/* Backdrop click to close */}
          <div className="absolute inset-0" onClick={() => setShowUploadModal(false)} />

          <div className="relative z-10 bg-white border border-zinc-200/90 rounded-2xl sm:rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.4)] animate-in fade-in zoom-in-95 duration-150 text-left">
            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute right-5 top-5 w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-950 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200/80 text-zinc-950 flex items-center justify-center shrink-0">
                <Upload className="w-5 h-5 text-zinc-800" />
              </div>
              <div>
                <h3 className="font-serif text-xl sm:text-2xl font-medium tracking-tight text-zinc-950">Upload Database</h3>
                <p className="text-xs text-zinc-500 font-normal">Persisted in MongoDB GridFS and queryable in SQLite</p>
              </div>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-800 mb-1.5">
                  Database Display Name: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={databaseName}
                  onChange={(e) => setDatabaseName(e.target.value)}
                  placeholder="e.g. Sales Database or College Database"
                  required
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-zinc-200 bg-white text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 shadow-2xs transition-all"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-800 mb-1.5">
                  Primary Table Name (for CSV only):
                </label>
                <input
                  type="text"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  placeholder="e.g. products, sales, students (defaults to filename)"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-zinc-200 bg-white text-zinc-950 placeholder:text-zinc-400 font-mono focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 shadow-2xs transition-all"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-800 mb-1.5">
                  Select File (.csv or SQLite .sqlite, .db): <span className="text-rose-500">*</span>
                </label>
                <div className="border-2 border-dashed border-zinc-200 hover:border-zinc-400 rounded-2xl p-6 text-center bg-zinc-50/50 hover:bg-zinc-50 transition-colors cursor-pointer relative">
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
                  <FileSpreadsheet className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-zinc-900">
                    {file ? file.name : 'Click or drop your .csv or .sqlite file here'}
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-1 font-normal">
                    Supports CSV with automatic type inference or full SQLite databases (up to 25MB)
                  </p>
                </div>
              </div>

              {uploadFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    uploadFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {uploadFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{uploadFeedback.message}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 font-semibold text-zinc-500 hover:text-zinc-950 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-6 py-2.5 rounded-full bg-black hover:bg-zinc-800 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-40"
                >
                  {isUploading ? 'Persisting to GridFS...' : 'Upload & Save'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* INSPECT TABLES & SCHEMA MODAL (Clean Light Theme - Portaled to document.body) */}
      {inspectDb && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
          {/* Backdrop click to close */}
          <div className="absolute inset-0" onClick={() => setInspectDb(null)} />

          <div className="relative z-10 bg-white border border-zinc-200/90 rounded-2xl sm:rounded-3xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-[0_25px_70px_-15px_rgba(0,0,0,0.4)] overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-left">
            {/* Modal Header */}
            <div className="px-6 py-4.5 bg-zinc-50/70 border-b border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-zinc-950 text-white flex items-center justify-center font-bold shadow-2xs">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-medium text-zinc-950">{inspectDb.database_name}</h3>
                  <p className="text-xs text-zinc-400 font-sans">
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
                  className="px-4 py-1.5 rounded-full bg-black hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Query in Playground</span>
                </button>

                <button
                  onClick={() => setInspectDb(null)}
                  className="text-zinc-400 hover:text-zinc-950 p-1 cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {inspectLoading ? (
                <div className="py-16 text-center text-zinc-400 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-zinc-800" />
                  <span>Inspecting database tables and columns...</span>
                </div>
              ) : inspectSchema ? (
                <div className="space-y-6">
                  {/* Tables Selector tabs */}
                  <div>
                    <span className="text-[11px] font-semibold text-zinc-400 block mb-2">
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
                          className={`px-3.5 py-1.5 rounded-full font-mono text-xs font-medium transition-all cursor-pointer ${
                            selectedTableForPreview === tName
                              ? 'bg-black text-white font-semibold shadow-xs'
                              : 'bg-zinc-100 hover:bg-zinc-200/70 text-zinc-700 border border-zinc-200/80'
                          }`}
                        >
                          {tName} ({inspectSchema.tables[tName].row_count || 0} rows)
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Schema Structure of selected table */}
                  {selectedTableForPreview && inspectSchema.tables[selectedTableForPreview] && (
                    <div className="bg-zinc-50/60 border border-zinc-200/80 rounded-2xl p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-serif font-medium text-zinc-950 text-sm">
                          Table: {selectedTableForPreview}
                        </span>
                        <span className="text-xs text-zinc-400 font-sans">
                          {inspectSchema.tables[selectedTableForPreview].columns?.length || 0} Columns
                        </span>
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-zinc-200/80 bg-white">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-zinc-50 text-zinc-700 font-semibold uppercase text-[11px] border-b border-zinc-200/80">
                            <tr>
                              <th className="py-2.5 px-4">Column Name</th>
                              <th className="py-2.5 px-4">Data Type</th>
                              <th className="py-2.5 px-4">Key Constraint</th>
                              <th className="py-2.5 px-4">Reference</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 font-mono text-zinc-800">
                            {inspectSchema.tables[selectedTableForPreview].columns.map((c, i) => (
                              <tr key={i} className="hover:bg-zinc-50/60">
                                <td className="py-2.5 px-4 font-semibold text-zinc-950 font-sans">
                                  {c.name}
                                </td>
                                <td className="py-2.5 px-4 text-zinc-600 font-bold">{c.type}</td>
                                <td className="py-2.5 px-4">
                                  {c.primary_key ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200">
                                      PRIMARY KEY
                                    </span>
                                  ) : (
                                    <span className="text-zinc-300 font-sans">—</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-4 font-sans text-zinc-500">
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
                    <span className="text-[11px] font-semibold text-zinc-400 block mb-2">
                      Sample Data Records ({tablePreviewData?.count || 0} preview rows):
                    </span>
                    <div className="bg-white border border-zinc-200/80 rounded-2xl overflow-x-auto max-h-[300px]">
                      {previewLoading ? (
                        <div className="py-8 text-center text-zinc-400">Loading sample rows...</div>
                      ) : tablePreviewData && tablePreviewData.rows?.length > 0 ? (
                        <table className="w-full text-left text-xs">
                          <thead className="bg-zinc-50 text-zinc-700 sticky top-0 font-semibold uppercase text-[11px] border-b border-zinc-200/80 backdrop-blur-md">
                            <tr>
                              {tablePreviewData.columns.map((col, idx) => (
                                <th key={idx} className="py-2.5 px-4 whitespace-nowrap">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 font-mono text-zinc-800">
                            {tablePreviewData.rows.map((row, rIdx) => (
                              <tr key={rIdx} className="hover:bg-zinc-50/60">
                                {tablePreviewData.columns.map((col, cIdx) => (
                                  <td key={cIdx} className="py-2 px-4 whitespace-nowrap">
                                    {row[col] !== null && row[col] !== undefined ? String(row[col]) : <span className="text-zinc-400 italic font-sans">NULL</span>}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="py-8 text-center text-zinc-400">No records found.</div>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
