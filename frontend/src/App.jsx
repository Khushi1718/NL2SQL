import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import Home from './pages/Home';
import SqlPlayground from './pages/SqlPlayground';
import MyDatabases from './pages/MyDatabases';
import Account from './pages/Account';
import PromptEngineering from './pages/PromptEngineering';
import Dashboard from './pages/Dashboard';
import QueryHistory from './pages/QueryHistory';
import { fetchHealth, fetchAllDatabases } from './services/api';

export default function App() {
  const [activePage, setActivePage] = useState('home');
  const [databases, setDatabases] = useState([]);
  const [selectedDbId, setSelectedDbId] = useState('');
  const [healthInfo, setHealthInfo] = useState(null);
  const [playgroundQuery, setPlaygroundQuery] = useState('');
  const [promptInspectQuestion, setPromptInspectQuestion] = useState('');
  
  // Auth state & modal control
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signup');
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('nl2sql_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleOpenAuth = (mode = 'signup') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('nl2sql_user', JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }
  };

  const loadInitialData = async () => {
    try {
      const [health, dbData] = await Promise.all([
        fetchHealth(),
        fetchAllDatabases()
      ]);
      setHealthInfo(health);
      const dbs = dbData.databases || [];
      setDatabases(dbs);
      if (dbs.length > 0 && !selectedDbId) {
        setSelectedDbId(dbs[0].database_id);
      }
    } catch (err) {
      console.error('Initial load failed', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleSelectDatabaseForQuery = (databaseId) => {
    setSelectedDbId(databaseId);
    setActivePage('playground');
  };

  const handleOpenPromptInspector = (question, databaseId) => {
    setPromptInspectQuestion(question);
    if (databaseId) setSelectedDbId(databaseId);
    setActivePage('prompt');
  };

  const handleReopenQueryInPlayground = ({ question, sql }) => {
    setPlaygroundQuery(question);
    setActivePage('playground');
  };

  return (
    <div className="flex flex-col min-h-screen w-full max-w-full bg-white text-zinc-900 font-sans antialiased overflow-x-hidden">
      {/* Top Navigation Bar */}
      <Navbar
        activePage={activePage}
        setActivePage={setActivePage}
        healthInfo={healthInfo}
        databases={databases}
        selectedDbId={selectedDbId}
        onSelectDatabase={(id) => setSelectedDbId(id)}
        onOpenAuth={handleOpenAuth}
        currentUser={currentUser}
      />

      {/* Split-Screen Auth Modal (Exact design match to reference mockup) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authMode}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Main Page Content */}
      <main className={`flex-1 flex flex-col overflow-y-auto bg-transparent ${activePage !== 'home' ? 'pt-14 sm:pt-16' : ''}`}>
        {/* 1. HOME PAGE */}
        {activePage === 'home' && (
          <Home
            onNavigateToPlayground={() => setActivePage('playground')}
            onNavigateToDatabases={() => setActivePage('databases')}
            onSelectDemoQuery={(q) => {
              setPlaygroundQuery(q);
              setActivePage('playground');
            }}
          />
        )}

        {/* 2. SQL PLAYGROUND (Core Workspace with DB Selector at the top) */}
        {activePage === 'playground' && (
          <SqlPlayground
            selectedDbId={selectedDbId}
            onSelectDbId={(id) => setSelectedDbId(id)}
            initialQuery={playgroundQuery}
            onNavigateToDatabases={() => setActivePage('databases')}
            onOpenPromptTab={handleOpenPromptInspector}
          />
        )}

        {/* 3. MY DATABASES PAGE (Multi-database management with MongoDB GridFS) */}
        {activePage === 'databases' && (
          <MyDatabases
            onSelectDatabaseForQuery={handleSelectDatabaseForQuery}
          />
        )}

        {/* 4. ACCOUNT & SETTINGS PAGE */}
        {activePage === 'account' && (
          <Account
            onNavigateToDatabases={() => setActivePage('databases')}
            onNavigateToPlayground={() => setActivePage('playground')}
            onOpenAuth={handleOpenAuth}
          />
        )}

        {/* Academic Prompt Engineering Inspector */}
        {activePage === 'prompt' && (
          <div className="flex-1 flex flex-col">
            <div className="glass-panel border-b border-white/[0.08] px-6 py-2.5 flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-medium">Viewing Prompt Engineering Lab</span>
              <button
                onClick={() => setActivePage('playground')}
                className="text-white font-bold hover:underline"
              >
                ← Return to Playground
              </button>
            </div>
            <PromptEngineering initialQuestion={promptInspectQuestion} />
          </div>
        )}

        {/* Operational Analytics Dashboard */}
        {activePage === 'dashboard' && (
          <Dashboard
            onOpenPlayground={() => setActivePage('playground')}
            onSelectQuery={handleReopenQueryInPlayground}
          />
        )}

        {/* Query History */}
        {activePage === 'history' && (
          <QueryHistory
            onReopenQuery={handleReopenQueryInPlayground}
          />
        )}
      </main>
    </div>
  );
}
