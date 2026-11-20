import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach authenticated user information to all requests for multi-user isolation
api.interceptors.request.use((config) => {
  try {
    const saved = localStorage.getItem('nl2sql_user');
    if (saved) {
      const user = JSON.parse(saved);
      if (user?.email) {
        config.headers['X-User-Email'] = user.email.trim().lower();
      }
      if (user?.id) {
        config.headers['X-User-Id'] = user.id;
      }
    }
  } catch (e) {
    // ignore
  }
  return config;
});

// Health & System
export const fetchHealth = async () => {
  const res = await api.get('/health');
  return res.data;
};

// Databases API (MongoDB GridFS & Multi-Database Management - Isolated per User)
export const fetchAllDatabases = async (userEmail = null) => {
  const params = {};
  if (userEmail) {
    params.user_email = userEmail.trim().lower();
  }
  const res = await api.get('/databases', { params });
  return res.data;
};

export const fetchDatabaseInfo = async (databaseId) => {
  const res = await api.get(`/databases/${encodeURIComponent(databaseId)}`);
  return res.data;
};

export const fetchDatabaseSchema = async (databaseId) => {
  const res = await api.get(`/databases/${encodeURIComponent(databaseId)}/schema`);
  return res.data;
};

export const fetchDatabaseTables = async (databaseId) => {
  const res = await api.get(`/databases/${encodeURIComponent(databaseId)}/tables`);
  return res.data;
};

export const fetchTablePreview = async (databaseId, tableName, limit = 50) => {
  const res = await api.get(`/databases/${encodeURIComponent(databaseId)}/tables/${encodeURIComponent(tableName)}/preview`, {
    params: { limit },
  });
  return res.data;
};

export const uploadDatabaseFile = async (file, databaseName, tableName = null) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('database_name', databaseName);
  if (tableName && tableName.trim()) {
    formData.append('table_name', tableName.trim());
  }
  try {
    const saved = localStorage.getItem('nl2sql_user');
    if (saved) {
      const user = JSON.parse(saved);
      if (user?.email) formData.append('user_email', user.email.trim().lower());
      if (user?.id) formData.append('user_id', user.id);
    }
  } catch (e) {
    // ignore
  }
  const res = await api.post('/databases/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const deleteDatabase = async (databaseId) => {
  const res = await api.delete(`/databases/${encodeURIComponent(databaseId)}`);
  return res.data;
};

// Query & Playground (Accepts dynamic database_id)
export const generateSQL = async (naturalLanguageQuery, databaseId = null) => {
  const res = await api.post('/query/generate', {
    natural_language_query: naturalLanguageQuery,
    database_id: databaseId,
  });
  return res.data;
};

export const executeSQL = async (sql, databaseId = null, naturalLanguageQuery = null, promptUsed = null) => {
  const res = await api.post('/query/execute', {
    sql,
    database_id: databaseId,
    natural_language_query: naturalLanguageQuery,
    prompt_used: promptUsed,
  });
  return res.data;
};

export const fetchQuerySuggestions = async (databaseId = null) => {
  const res = await api.get('/query/suggestions', {
    params: { database_id: databaseId },
  });
  return res.data;
};

export const exportCSV = async (columns, rows, filename = 'query_results.csv') => {
  const res = await api.post(
    '/query/export-csv',
    { columns, rows, filename },
    { responseType: 'blob' }
  );
  const blob = new Blob([res.data], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const fetchQueryHistory = async ({ databaseId = null, limit = 50, offset = 0, search = '', status = '' } = {}) => {
  const res = await api.get('/query/history', {
    params: { database_id: databaseId, limit, offset, search, status },
  });
  return res.data;
};

export const fetchHistory = fetchQueryHistory;

export const deleteHistoryItem = async (id) => {
  const res = await api.delete(`/history/${id}`);
  return res.data;
};

export const clearAllHistory = async () => {
  const res = await api.delete('/history');
  return res.data;
};

// Dashboard Stats
export const fetchDashboardStats = async () => {
  const res = await api.get('/dashboard/stats');
  return res.data;
};

// Prompt Engineering Lab
export const fetchPromptBreakdown = async (databaseId = null) => {
  const res = await api.get('/prompt/breakdown', {
    params: { database_id: databaseId },
  });
  return res.data;
};

export const inspectLivePrompt = async (question, databaseId = null) => {
  const res = await api.post('/prompt/inspect', {
    question,
    database_id: databaseId,
  });
  return res.data;
};

// Settings
export const fetchSettings = async () => {
  const res = await api.get('/settings');
  return res.data;
};

export const updateSettings = async (settings) => {
  const res = await api.post('/settings', settings);
  return res.data;
};

export const testApiKey = async (apiKey, model) => {
  const res = await api.post('/settings/test-api-key', {
    api_key: apiKey,
    model,
  });
  return res.data;
};

export const resetDatabase = async () => {
  const res = await api.post('/settings/reset-database');
  return res.data;
};

// Authentication & User Accounts (MongoDB)
export const signupUser = async ({ email, password, name, role }) => {
  const res = await api.post('/auth/signup', { email, password, name, role });
  return res.data;
};

export const loginUser = async ({ email, password }) => {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
};

export const updateUserEmail = async (oldEmail, newEmail) => {
  const res = await api.post('/auth/change-email', { old_email: oldEmail, new_email: newEmail });
  return res.data;
};

export const updateUserPassword = async (email, currentPassword, newPassword) => {
  const res = await api.post('/auth/change-password', {
    email,
    current_password: currentPassword,
    new_password: newPassword,
  });
  return res.data;
};

export default api;
