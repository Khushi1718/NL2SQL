import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, X, ArrowRight, Check } from 'lucide-react';

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = 'signup',
  onAuthSuccess
}) {
  const [mode, setMode] = useState(initialMode); // 'signup' | 'login'
  const [role, setRole] = useState('developer'); // 'developer' | 'enterprise'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setSubmitted(true);
    setTimeout(() => {
      if (onAuthSuccess) {
        onAuthSuccess({
          email,
          name: email.split('@')[0],
          role: role === 'developer' ? 'Developer' : 'Enterprise Team'
        });
      }
      setSubmitted(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/45 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Split-Screen Modal Box */}
      <div className="relative z-10 w-full max-w-[920px] bg-white rounded-3xl shadow-2xl overflow-hidden border border-zinc-200/90 grid grid-cols-1 md:grid-cols-2">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/80 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 flex items-center justify-center transition-colors cursor-pointer border border-zinc-200/60 shadow-2xs"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ========================================================= */}
        {/* LEFT COLUMN: BRAND + AUTH FORM (CLEAN WHITE)             */}
        {/* ========================================================= */}
        <div className="p-6 sm:p-9 flex flex-col justify-between space-y-5 bg-white text-left">
          {/* 1. Brand Logo */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-zinc-950 text-white flex items-center justify-center shadow-2xs">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-[2.2] stroke-linecap-round stroke-linejoin-round">
                <ellipse cx="12" cy="5" rx="8" ry="2.6" />
                <path d="M4 5v14c0 1.44 3.58 2.6 8 2.6s8-1.16 8-2.6V5" />
                <path d="M4 12c0 1.44 3.58 2.6 8 2.6s8-1.16 8-2.6" />
              </svg>
            </div>
            <span className="font-bold tracking-tight text-base text-zinc-950 font-sans">
              NL2SQL
            </span>
          </div>

          {/* 2. Header & Title */}
          <div className="space-y-1">
            <h2 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-zinc-950">
              {mode === 'signup' ? 'Sign Up' : 'Sign In'}
            </h2>
            <p className="text-xs text-zinc-500 font-normal">
              {mode === 'signup'
                ? 'Create your account in minutes'
                : 'Welcome back to your NL2SQL workspace'}
            </p>
          </div>

          {/* 3. Account Type Radio Selector (Only for signup) */}
          {mode === 'signup' && (
            <div className="flex items-center gap-5 text-xs text-zinc-700 pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="radio"
                  name="role"
                  value="developer"
                  checked={role === 'developer'}
                  onChange={() => setRole('developer')}
                  className="w-3.5 h-3.5 text-zinc-950 focus:ring-zinc-950 cursor-pointer accent-zinc-950"
                />
                <span className={role === 'developer' ? 'font-semibold text-zinc-950' : 'text-zinc-600'}>
                  As a Developer
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="radio"
                  name="role"
                  value="enterprise"
                  checked={role === 'enterprise'}
                  onChange={() => setRole('enterprise')}
                  className="w-3.5 h-3.5 text-zinc-950 focus:ring-zinc-950 cursor-pointer accent-zinc-950"
                />
                <span className={role === 'enterprise' ? 'font-semibold text-zinc-950' : 'text-zinc-600'}>
                  As an Enterprise Team
                </span>
              </label>
            </div>
          )}

          {/* 4. Google SSO Button */}
          <button
            type="button"
            onClick={() => {
              setEmail('khushi@nl2sql.local');
              setPassword('password123');
            }}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-full border border-zinc-200/90 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-800 transition-colors shadow-2xs cursor-pointer"
          >
            {/* Google G Logo SVG */}
            <svg viewBox="0 0 24 24" className="w-4 h-4">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* 5. Divider with OR */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-zinc-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-semibold text-zinc-400 uppercase tracking-widest absolute">
              OR
            </span>
          </div>

          {/* 6. Email & Password Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Email Input */}
            <div className="space-y-1 text-left">
              <label className="block text-[11px] font-semibold text-zinc-700">
                Email *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-full border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 text-xs focus:outline-none focus:border-zinc-900 shadow-2xs transition-colors"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1 text-left">
              <label className="block text-[11px] font-semibold text-zinc-700">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 rounded-full border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 text-xs focus:outline-none focus:border-zinc-900 shadow-2xs transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitted}
              className="w-full py-2.5 px-4 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold tracking-tight transition-all shadow-sm cursor-pointer active:scale-[0.99] flex items-center justify-center gap-1.5 mt-2"
            >
              {submitted ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Success</span>
                </>
              ) : (
                <span>{mode === 'signup' ? 'Sign up' : 'Sign in'}</span>
              )}
            </button>
          </form>

          {/* 7. Switch between Sign In / Sign Up */}
          <div className="text-center text-xs text-zinc-500 pt-1">
            {mode === 'signup' ? (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-zinc-950 font-semibold underline underline-offset-2 hover:text-black cursor-pointer"
                >
                  Sign in
                </button>
              </span>
            ) : (
              <span>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-zinc-950 font-semibold underline underline-offset-2 hover:text-black cursor-pointer"
                >
                  Sign up
                </button>
              </span>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: SOFT GREY + QUOTE + CYLINDER ILLUSTRATION    */}
        {/* ========================================================= */}
        <div className="bg-[#f8f9fa] border-t md:border-t-0 md:border-l border-zinc-200/80 p-6 sm:p-9 flex flex-col justify-between text-left relative overflow-hidden select-none">
          {/* Soft background mesh gradient */}
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-zinc-200/40 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-zinc-200/30 blur-3xl pointer-events-none" />

          {/* Top Section: Quote and Author */}
          <div className="relative space-y-3 z-10">
            {/* Opening quotation mark */}
            <div className="text-zinc-300 font-serif text-5xl leading-none -mb-3">
              “
            </div>

            <p className="text-xs sm:text-sm text-zinc-700 font-medium leading-relaxed">
              From natural language to SQL — making data accessible for everyone.
            </p>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-zinc-200 text-zinc-800 font-bold text-xs flex items-center justify-center font-mono border border-zinc-300/60 shadow-2xs">
                  AM
                </div>
                <div>
                  <span className="block text-xs font-semibold text-zinc-900 leading-tight">
                    Alex Mitchell
                  </span>
                  <span className="block text-[11px] text-zinc-500 font-normal">
                    Researcher, NL2SQL Project
                  </span>
                </div>
              </div>

              {/* Closing quotation mark */}
              <div className="text-zinc-300 font-serif text-4xl leading-none select-none">
                ”
              </div>
            </div>
          </div>

          {/* Middle Section: Query Prompt Card -> Terminal Arrow */}
          <div className="relative z-10 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-2">
              {/* Natural language query bubble */}
              <div className="bg-white border border-zinc-200/90 rounded-xl px-3 py-2 shadow-xs max-w-[170px] text-left">
                <span className="text-[10px] font-mono text-zinc-700 leading-tight block">
                  Show me total sales by region
                </span>
              </div>

              {/* Connecting curved arrow */}
              <div className="text-zinc-400 shrink-0 px-1">
                <svg viewBox="0 0 40 24" className="w-8 h-5 fill-none stroke-current stroke-[1.8] stroke-linecap-round stroke-linejoin-round">
                  <path d="M4 16 C 16 4, 24 4, 34 10" />
                  <polyline points="28 10 34 10 33 4" />
                </svg>
              </div>

              {/* SQL terminal card */}
              <div className="bg-[#1f2023] text-zinc-200 rounded-xl p-2.5 shadow-md border border-zinc-800 text-left w-[180px] shrink-0 font-mono text-[9px] leading-tight space-y-1">
                <div className="flex items-center gap-1 pb-1 border-b border-zinc-700/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                </div>
                <div className="text-zinc-300 space-y-0.5">
                  <span className="text-zinc-400">SELECT</span> region,
                  <br />
                  <span className="pl-2 text-zinc-400">SUM</span>(sales)
                  <br />
                  <span className="text-zinc-400">FROM</span> orders
                  <br />
                  <span className="text-zinc-400">GROUP BY</span> region;
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section: Technical Database Cylinder Graphic (Exact visual match) */}
          <div className="relative z-10 w-full flex items-end justify-center pt-2">
            <svg
              viewBox="0 0 360 170"
              className="w-full max-w-[340px] h-auto overflow-visible select-none"
            >
              <defs>
                {/* Cylinder disk linear gradient */}
                <linearGradient id="diskGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f4f4f5" />
                  <stop offset="30%" stopColor="#ffffff" />
                  <stop offset="70%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#e4e4e7" />
                </linearGradient>

                {/* Disc top cap gradient */}
                <linearGradient id="capGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#f0f0f2" />
                </linearGradient>

                {/* Subtle base shadow */}
                <radialGradient id="baseShadow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#000000" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* 1. Base Elliptical Floor Shadows & Guides */}
              <ellipse cx="180" cy="154" rx="140" ry="14" fill="none" stroke="#e4e4e7" strokeWidth="1" strokeDasharray="3 3" />
              <ellipse cx="180" cy="154" rx="80" ry="10" fill="url(#baseShadow)" />
              <ellipse cx="75" cy="148" rx="35" ry="5" fill="url(#baseShadow)" />
              <ellipse cx="285" cy="148" rx="35" ry="5" fill="url(#baseShadow)" />

              {/* Connecting isometric guide lines */}
              <path d="M 85 146 L 140 152 M 220 152 L 275 146" stroke="#d4d4d8" strokeWidth="1" strokeDasharray="2 3" />
              <circle cx="85" cy="146" r="2" fill="#71717a" />
              <circle cx="275" cy="146" r="2" fill="#71717a" />

              {/* 2. Left Floating Table / Spreadsheet Card */}
              <g transform="translate(30, 80)">
                <rect
                  x="0"
                  y="0"
                  width="70"
                  height="46"
                  rx="6"
                  fill="#ffffff"
                  stroke="#27272a"
                  strokeWidth="1.2"
                  filter="drop-shadow(0 2px 4px rgba(0,0,0,0.06))"
                />
                {/* Header row */}
                <rect x="0" y="0" width="70" height="12" rx="6" fill="#f4f4f5" />
                <line x1="0" y1="12" x2="70" y2="12" stroke="#27272a" strokeWidth="1.2" />
                {/* Columns */}
                <line x1="24" y1="0" x2="24" y2="46" stroke="#e4e4e7" strokeWidth="0.8" />
                <line x1="48" y1="0" x2="48" y2="46" stroke="#e4e4e7" strokeWidth="0.8" />
                {/* Row lines */}
                <line x1="0" y1="22" x2="70" y2="22" stroke="#e4e4e7" strokeWidth="0.8" />
                <line x1="0" y1="32" x2="70" y2="32" stroke="#e4e4e7" strokeWidth="0.8" />
                <line x1="0" y1="40" x2="70" y2="40" stroke="#e4e4e7" strokeWidth="0.8" />
              </g>

              {/* 3. Left Mini Database Cylinder */}
              <g transform="translate(62, 120)">
                {/* Cylinder Layer 2 */}
                <path d="M 0 14 C 0 19, 26 19, 26 14 L 26 22 C 26 27, 0 27, 0 22 Z" fill="url(#diskGrad)" stroke="#27272a" strokeWidth="1.2" />
                <ellipse cx="13" cy="14" rx="13" ry="4" fill="url(#capGrad)" stroke="#27272a" strokeWidth="1.2" />
                {/* Cylinder Layer 1 (Top) */}
                <path d="M 0 6 C 0 11, 26 11, 26 6 L 26 14 C 26 19, 0 19, 0 14 Z" fill="url(#diskGrad)" stroke="#27272a" strokeWidth="1.2" />
                <ellipse cx="13" cy="6" rx="13" ry="4" fill="url(#capGrad)" stroke="#27272a" strokeWidth="1.2" />
              </g>

              {/* 4. Center Main Database Cylinder (Tall 4 Layers) */}
              <g transform="translate(142, 60)">
                {/* Layer 4 (Bottom) */}
                <path d="M 0 63 C 0 76, 76 76, 76 63 L 76 84 C 76 97, 0 97, 0 84 Z" fill="url(#diskGrad)" stroke="#18181b" strokeWidth="1.5" />
                <ellipse cx="38" cy="63" rx="38" ry="11" fill="url(#capGrad)" stroke="#18181b" strokeWidth="1.4" />

                {/* Layer 3 */}
                <path d="M 0 42 C 0 55, 76 55, 76 42 L 76 63 C 76 76, 0 76, 0 63 Z" fill="url(#diskGrad)" stroke="#18181b" strokeWidth="1.5" />
                <ellipse cx="38" cy="42" rx="38" ry="11" fill="url(#capGrad)" stroke="#18181b" strokeWidth="1.4" />

                {/* Layer 2 */}
                <path d="M 0 21 C 0 34, 76 34, 76 21 L 76 42 C 76 55, 0 55, 0 42 Z" fill="url(#diskGrad)" stroke="#18181b" strokeWidth="1.5" />
                <ellipse cx="38" cy="21" rx="38" ry="11" fill="url(#capGrad)" stroke="#18181b" strokeWidth="1.4" />

                {/* Layer 1 (Top layer) */}
                <path d="M 0 0 C 0 13, 76 13, 76 0 L 76 21 C 76 34, 0 34, 0 21 Z" fill="url(#diskGrad)" stroke="#18181b" strokeWidth="1.5" />
                <ellipse cx="38" cy="0" rx="38" ry="11" fill="url(#capGrad)" stroke="#18181b" strokeWidth="1.5" />
              </g>

              {/* 5. Right Floating Bar Chart Card */}
              <g transform="translate(262, 85)">
                <rect
                  x="0"
                  y="0"
                  width="54"
                  height="42"
                  rx="6"
                  fill="#ffffff"
                  stroke="#27272a"
                  strokeWidth="1.2"
                  filter="drop-shadow(0 2px 4px rgba(0,0,0,0.06))"
                />
                {/* 4 chart bars */}
                <rect x="8" y="24" width="6" height="12" rx="1.5" fill="#a1a1aa" />
                <rect x="18" y="16" width="6" height="20" rx="1.5" fill="#71717a" />
                <rect x="28" y="10" width="6" height="26" rx="1.5" fill="#18181b" />
                <rect x="38" y="18" width="6" height="18" rx="1.5" fill="#71717a" />
                <line x1="5" y1="36" x2="49" y2="36" stroke="#27272a" strokeWidth="0.8" />
              </g>

              {/* 6. Right Mini Database Cylinder */}
              <g transform="translate(272, 120)">
                <path d="M 0 6 C 0 11, 26 11, 26 6 L 26 18 C 26 23, 0 23, 0 18 Z" fill="url(#diskGrad)" stroke="#27272a" strokeWidth="1.2" />
                <ellipse cx="13" cy="6" rx="13" ry="4" fill="url(#capGrad)" stroke="#27272a" strokeWidth="1.2" />
              </g>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
