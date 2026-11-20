import React from 'react';
import { Database, Terminal, User } from 'lucide-react';

export default function Navbar({
  activePage,
  setActivePage,
  databases = [],
  onOpenAuth,
  currentUser = null
}) {
  return (
    <header className="fixed top-5 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      {/* TWO FLOATING CAPSULES (EXACT MATCH TO KOJI REFERENCE IMAGE) */}
      <div className="flex items-center gap-1.5 pointer-events-auto">

        {/* Left Capsule: Solid Black Brand Pill ("koji" style) */}
        <button
          onClick={() => {
            setActivePage('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-black hover:bg-zinc-950 text-white font-black text-sm tracking-tight shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)] border border-white/15 transition-all duration-200 active:scale-95 group cursor-pointer"
        >
          {/* Subtle disk icon */}
          <div className="w-4 h-4 text-white flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-none stroke-current stroke-[2.4] stroke-linecap-round stroke-linejoin-round">
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
              <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
            </svg>
          </div>
          <span className="font-extrabold tracking-tight text-sm text-white">NL2SQL</span>
        </button>

        {/* Right Capsule: Frosted Translucent Glass Capsule */}
        <nav className="flex items-center gap-1 sm:gap-2 px-3 py-1.5 rounded-2xl bg-[#646c76]/65 backdrop-blur-2xl border border-white/25 shadow-[0_15px_35px_-8px_rgba(0,0,0,0.35)] text-xs font-semibold text-white/95">
          {/* 1. SQL Playground */}
          <button
            onClick={() => setActivePage('playground')}
            className={`px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer ${activePage === 'playground'
              ? 'bg-white/25 text-white font-bold shadow-xs'
              : 'text-white/85 hover:text-white hover:bg-white/10'
              }`}
          >
            Playground
          </button>

          {/* 2. Database */}
          <button
            onClick={() => setActivePage('databases')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer ${activePage === 'databases'
              ? 'bg-white/25 text-white font-bold shadow-xs'
              : 'text-white/85 hover:text-white hover:bg-white/10'
              }`}
          >
            <span>Databases</span>
            {databases.length > 0 && (
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-white/30 text-white">
                {databases.length}
              </span>
            )}
          </button>

          {/* 3. Account */}
          <button
            onClick={() => setActivePage('account')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer ${activePage === 'account'
              ? 'bg-white/25 text-white font-bold shadow-xs'
              : 'text-white/85 hover:text-white hover:bg-white/10'
              }`}
            title="Account Settings"
          >
            <User className="w-3.5 h-3.5" />
          </button>

          {/* Divider */}
          <span className="w-px h-3.5 bg-white/25 mx-0.5 hidden sm:inline-block" />

          {/* 4. Login / Sign Up Button */}
          <button
            onClick={() => onOpenAuth ? onOpenAuth('signup') : setActivePage('account')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-zinc-950 hover:bg-zinc-100 font-bold text-xs shadow-xs transition-all duration-200 cursor-pointer active:scale-95"
          >
            <span>{currentUser ? currentUser.name || 'Account' : 'Log In / Sign Up'}</span>
          </button>
        </nav>

      </div>
    </header>
  );
}
