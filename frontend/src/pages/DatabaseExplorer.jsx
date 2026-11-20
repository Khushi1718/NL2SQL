import React, { useState, useEffect } from 'react';
import {
  Database,
  Table as TableIcon,
  Key,
  Link2,
  Upload,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Layers,
  FileSpreadsheet,
  X
} from 'lucide-react';
import { fetchTables, fetchTableDetails, uploadCSVTable } from '../services/api';

export default function DatabaseExplorer() {
  const [tables, setTables] = useState([]);
  const [selectedTableName, setSelectedTableName] = useState('');
  const [tableDetails, setTableDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [searchTable, setSearchTable] = useState('');

  // Active view tab inside table inspector: 'schema' | 'records' | 'relationships'
  const [activeTab, setActiveTab] = useState('schema');

  // CSV Import Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [newTableName, setNewTableName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState(null);

  const loadTables = async (selectName = null) => {
    try {
      setLoading(true);
      const data = await fetchTables();
      setTables(data.tables || []);
      const target = selectName || (data.tables && data.tables.length > 0 ? data.tables[0].name : '');
      if (target) {
        setSelectedTableName(target);
        loadTableDetails(target);
      }
    } catch (err) {
      console.error('Failed to load tables', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTableDetails = async (name) => {
    try {
      setDetailsLoading(true);
      const details = await fetchTableDetails(name, 50);
      setTableDetails(details);
    } catch (err) {
      console.error('Failed to load table details', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  const handleSelectTable = (name) => {
    setSelectedTableName(name);
    loadTableDetails(name);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!csvFile || !newTableName.trim()) {
      alert('Please select a CSV file and enter a valid table name.');
      return;
    }

    setIsUploading(true);
    setUploadMessage(null);

    try {
      const res = await uploadCSVTable(csvFile, newTableName);
      setUploadMessage({
        type: 'success',
        text: `Table '${res.table_name}' created successfully with ${res.rows_imported} rows!`,
      });
      // Refresh tables and select the new one
      setTimeout(() => {
        setShowUploadModal(false);
        setCsvFile(null);
        setNewTableName('');
        setUploadMessage(null);
        loadTables(res.table_name);
      }, 1200);
    } catch (err) {
      setUploadMessage({
        type: 'error',
        text: err.response?.data?.detail || err.message || 'CSV Import failed',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const filteredTables = tables.filter((t) =>
    t.name.toLowerCase().includes(searchTable.toLowerCase())
  );

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Database Explorer</h2>
          <p className="text-sm text-slate-500">
            Inspect relational database tables, columns, primary and foreign keys, sample records, and import CSV files.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadTables(selectedTableName)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import CSV Table</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Side: Table List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tables ({tables.length})
            </span>
          </div>

          {/* Search table box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTable}
              onChange={(e) => setSearchTable(e.target.value)}
              placeholder="Filter tables..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50"
            />
          </div>

          <div className="space-y-1 max-h-[500px] overflow-y-auto pt-1">
            {filteredTables.map((t) => {
              const isSelected = t.name === selectedTableName;
              return (
                <button
                  key={t.name}
                  onClick={() => handleSelectTable(t.name)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <TableIcon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                    <span className="font-mono truncate">{t.name}</span>
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                      isSelected
                        ? 'bg-blue-700 text-blue-100'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {t.row_count} rows
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Selected Table Inspector */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {detailsLoading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-2 text-slate-500 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
              <span>Loading schema structure...</span>
            </div>
          ) : tableDetails ? (
            <div>
              {/* Header Info */}
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-mono font-bold text-sm">
                    T
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 font-mono tracking-tight">
                      {tableDetails.table.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {tableDetails.table.columns?.length || 0} Columns • {tableDetails.total_records} Total Records
                    </p>
                  </div>
                </div>

                {/* Sub-Tabs: Schema, Sample Records, Relationships */}
                <div className="flex rounded-lg bg-slate-200/80 p-1 text-xs font-semibold">
                  <button
                    onClick={() => setActiveTab('schema')}
                    className={`px-3 py-1 rounded-md transition-all ${
                      activeTab === 'schema'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Schema Structure
                  </button>
                  <button
                    onClick={() => setActiveTab('records')}
                    className={`px-3 py-1 rounded-md transition-all ${
                      activeTab === 'records'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Sample Records ({tableDetails.rows?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab('relationships')}
                    className={`px-3 py-1 rounded-md transition-all ${
                      activeTab === 'relationships'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Relationships ({tableDetails.table.foreign_keys?.length || 0})
                  </button>
                </div>
              </div>

              {/* Tab 1: Schema Structure */}
              {activeTab === 'schema' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-6">Column Name</th>
                        <th className="py-3 px-6">Data Type</th>
                        <th className="py-3 px-6">Key Constraint</th>
                        <th className="py-3 px-6">Nullable</th>
                        <th className="py-3 px-6">Reference / Foreign Key</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {tableDetails.table.columns.map((col, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-6 font-semibold text-slate-900 flex items-center gap-2">
                            {col.primary_key && <Key className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                            {col.foreign_key && !col.primary_key && <Link2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                            <span>{col.name}</span>
                          </td>
                          <td className="py-3 px-6 text-blue-600 font-semibold">{col.type}</td>
                          <td className="py-3 px-6 font-sans">
                            {col.primary_key ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                PRIMARY KEY
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-3 px-6 font-sans">
                            {col.nullable ? (
                              <span className="text-slate-500">YES</span>
                            ) : (
                              <span className="text-slate-800 font-semibold">NOT NULL</span>
                            )}
                          </td>
                          <td className="py-3 px-6">
                            {col.foreign_key ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                <Link2 className="w-3 h-3 text-blue-500" />
                                {col.foreign_key}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-sans">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tab 2: Sample Records */}
              {activeTab === 'records' && (
                <div className="overflow-x-auto max-h-[500px]">
                  {tableDetails.rows && tableDetails.rows.length > 0 ? (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider text-[11px] font-semibold sticky top-0 border-b border-slate-200">
                        <tr>
                          {tableDetails.columns.map((c, i) => (
                            <th key={i} className="py-2.5 px-4 whitespace-nowrap">
                              {c}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                        {tableDetails.rows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-blue-50/30 transition-colors">
                            {tableDetails.columns.map((c, cIdx) => (
                              <td key={cIdx} className="py-2.5 px-4 whitespace-nowrap">
                                {row[c] !== null && row[c] !== undefined ? (
                                  String(row[c])
                                ) : (
                                  <span className="text-slate-300 italic">NULL</span>
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      No records in this table yet.
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Relationships */}
              {activeTab === 'relationships' && (
                <div className="p-6 space-y-4">
                  {tableDetails.table.foreign_keys && tableDetails.table.foreign_keys.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {tableDetails.table.foreign_keys.map((fk, idx) => (
                        <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700">
                            <Link2 className="w-4 h-4 text-blue-600" />
                            <span>Foreign Key Reference #{idx + 1}</span>
                          </div>
                          <div className="text-xs space-y-1 font-mono text-slate-700">
                            <p>
                              <span className="text-slate-500 font-sans">Source Column:</span>{' '}
                              <span className="font-semibold">{tableDetails.table.name}.{fk.constrained_columns.join(', ')}</span>
                            </p>
                            <p>
                              <span className="text-slate-500 font-sans">Points to:</span>{' '}
                              <span className="font-semibold text-emerald-700">{fk.referred_table}.{fk.referred_columns.join(', ')}</span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      No outbound foreign keys configured for this table.
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="py-24 text-center text-slate-400 text-xs">
              Select a table from the sidebar to inspect.
            </div>
          )}
        </div>
      </div>

      {/* CSV Import Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Import CSV as Database Table</h3>
                <p className="text-xs text-slate-500">Upload any CSV data to dynamically create a queryable table</p>
              </div>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Table Name:
                </label>
                <input
                  type="text"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  placeholder="e.g., product_sales"
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select CSV File:
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    accept=".csv"
                    required
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setCsvFile(e.target.files[0]);
                        if (!newTableName) {
                          const base = e.target.files[0].name.replace(/\.csv$/i, '');
                          setNewTableName(base);
                        }
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-medium text-slate-700">
                    {csvFile ? csvFile.name : 'Click or drop a .csv file here'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">UTF-8 encoded CSV files up to 20MB</p>
                </div>
              </div>

              {uploadMessage && (
                <div
                  className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                    uploadMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {uploadMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{uploadMessage.text}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-colors"
                >
                  {isUploading ? 'Importing Table...' : 'Upload & Create Table'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
