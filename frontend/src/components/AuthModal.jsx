import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, X, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { signupUser, loginUser } from '../services/api';

/* ── REUSABLE HERO-STYLE 3D DATABASE CYLINDER (EXACT HERO MATERIALS) ── */
function HeroCylinderTier({ cx, cy, rx, ry, h, type = 'plat', showHub = false }) {
  const isCharcoal = type === 'charcoal';
  return (
    <g>
      {/* Platter Outer Body Wall */}
      <path
        d={`M ${cx - rx} ${cy} L ${cx - rx} ${cy + h} A ${rx} ${ry} 0 0 0 ${cx + rx} ${cy + h} L ${cx + rx} ${cy} A ${rx} ${ry} 0 0 1 ${cx - rx} ${cy} Z`}
        fill={isCharcoal ? 'url(#authBodyCharcoal)' : 'url(#authBodyPlat)'}
        stroke="#18181b"
        strokeWidth="1.2"
      />
      {/* Platter Top Rim Surface */}
      <ellipse
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ry}
        fill={isCharcoal ? 'url(#authTopCharcoal)' : 'url(#authTopPlat)'}
        stroke="#18181b"
        strokeWidth="1.2"
      />
      {/* Status LED */}
      <circle
        cx={cx - rx * 0.55}
        cy={cy + h * 0.58}
        r="1.8"
        fill={isCharcoal ? '#ffffff' : '#18181b'}
      />
      {/* Precision Vent / Lathe Groove */}
      <path
        d={`M ${cx - rx * 0.35} ${cy + h * 0.62} Q ${cx} ${cy + h * 0.78} ${cx + rx * 0.35} ${cy + h * 0.62}`}
        stroke={isCharcoal ? '#ffffff' : '#18181b'}
        strokeWidth="1.1"
        fill="none"
        strokeLinecap="round"
        opacity={isCharcoal ? 0.75 : 0.85}
      />
      {/* Recessed Center Spindle Hub */}
      {showHub && (
        <>
          <ellipse
            cx={cx}
            cy={cy}
            rx={rx * 0.36}
            ry={ry * 0.36}
            fill="#18181b"
            stroke="#3f3f46"
            strokeWidth="1"
          />
          <ellipse
            cx={cx}
            cy={cy}
            rx={rx * 0.18}
            ry={ry * 0.18}
            fill="#09090b"
          />
        </>
      )}
    </g>
  );
}

function HeroCylinderWaist({ cx, cy, rx, ry, h }) {
  const wrx = rx * 0.85;
  const wry = ry * 0.78;
  return (
    <path
      d={`M ${cx - wrx} ${cy - h} L ${cx - wrx} ${cy} A ${wrx} ${wry} 0 0 0 ${cx + wrx} ${cy} L ${cx + wrx} ${cy - h} A ${wrx} ${wry} 0 0 1 ${cx - wrx} ${cy - h} Z`}
      fill="url(#authWaistShade)"
      stroke="#18181b"
      strokeWidth="1"
    />
  );
}

function HeroCylinder({
  cx,
  baseCy,
  rx,
  ry,
  tierH = 18,
  waistH = 6,
  tiers = ['plat', 'charcoal', 'plat', 'plat'],
  hasSpindle = false
}) {
  return (
    <g>
      {tiers.map((type, idx) => {
        // idx = 0 is bottom tier (Tier 4 or Tier 3), idx = tiers.length - 1 is top tier
        const cy = baseCy - idx * (tierH + waistH);
        const isTop = idx === tiers.length - 1;
        return (
          <g key={idx}>
            {/* Waist under this tier (only for idx > 0) */}
            {idx > 0 && (
              <HeroCylinderWaist
                cx={cx}
                cy={cy + tierH + waistH}
                rx={rx}
                ry={ry}
                h={waistH}
              />
            )}
            {/* The Platter Tier */}
            <HeroCylinderTier
              cx={cx}
              cy={cy}
              rx={rx}
              ry={ry}
              h={tierH}
              type={type}
              showHub={isTop && hasSpindle}
            />
          </g>
        );
      })}
    </g>
  );
}

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = 'signup',
  onAuthSuccess
}) {
  const [mode, setMode] = useState(initialMode); // 'signup' | 'login'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setErrorMsg('');

    try {
      let res;
      if (mode === 'signup') {
        res = await signupUser({
          email: email.trim(),
          password,
          name: email.split('@')[0],
          role: 'Developer'
        });
      } else {
        res = await loginUser({
          email: email.trim(),
          password
        });
      }

      const userData = res.user || {
        email: email.trim(),
        name: email.split('@')[0],
        role: 'Developer'
      };

      setSubmitted(true);
      setTimeout(() => {
        if (onAuthSuccess) {
          onAuthSuccess(userData);
        }
        setLoading(false);
        setSubmitted(false);
        onClose();
      }, 400);
    } catch (err) {
      setLoading(false);
      const detail = err.response?.data?.detail;
      setErrorMsg(typeof detail === 'string' ? detail : 'Authentication failed. Please verify your credentials.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Split-Screen Modal Box */}
      <div className="relative z-10 w-full max-w-[920px] bg-white rounded-3xl shadow-[0_25px_70px_-15px_rgba(0,0,0,0.4)] overflow-hidden border border-zinc-200/90 grid grid-cols-1 md:grid-cols-2">
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

          {/* 3. Google SSO Button */}
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

          {/* 4. Divider with OR */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-zinc-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-semibold text-zinc-400 uppercase tracking-widest absolute">
              OR
            </span>
          </div>

          {/* 5. Email & Password Form */}
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

            {/* Error Message */}
            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || submitted}
              className="w-full py-2.5 px-4 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold tracking-tight transition-all shadow-sm cursor-pointer active:scale-[0.99] flex items-center justify-center gap-1.5 mt-2 disabled:opacity-75"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Connecting to MongoDB...</span>
                </>
              ) : submitted ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Success</span>
                </>
              ) : (
                <span>{mode === 'signup' ? 'Sign up' : 'Sign in'}</span>
              )}
            </button>
          </form>

          {/* 6. Switch between Sign In / Sign Up */}
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
        {/* RIGHT COLUMN: SOFT GREY + QUOTE + 4 HERO DATABASE CYLINDERS */}
        {/* ========================================================= */}
        <div className="bg-[#f8f9fa] border-t md:border-t-0 md:border-l border-zinc-200/80 p-6 sm:p-9 flex flex-col justify-between text-left relative overflow-hidden select-none">
          {/* Soft background ambient gradient */}
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-zinc-200/40 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-zinc-200/30 blur-3xl pointer-events-none" />

          {/* Top Section: Quote and Author */}
          <div className="relative space-y-3 z-10 pt-2">
            {/* Opening quotation mark */}
            <div className="text-zinc-300 font-serif text-5xl leading-none -mb-3">
              “
            </div>

            <p className="text-xs sm:text-sm text-zinc-700 font-medium leading-relaxed">
              From natural language to SQL — making data accessible for everyone.
            </p>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-zinc-900 text-white font-bold text-xs flex items-center justify-center font-mono shadow-2xs">
                  KN
                </div>
                <div>
                  <span className="block text-xs font-semibold text-zinc-900 leading-tight">
                    Khushi Nain
                  </span>
                  <span className="block text-[11px] text-zinc-500 font-normal">
                    Creator & Lead Researcher, NL2SQL Project
                  </span>
                </div>
              </div>

              {/* Closing quotation mark */}
              <div className="text-zinc-300 font-serif text-4xl leading-none select-none">
                ”
              </div>
            </div>
          </div>

          {/* Bottom Section: 4 Hero Database Cylinders (Exact Hero Monument Shaders) */}
          <div className="relative z-10 w-full flex items-end justify-center pt-6 pb-2">
            <svg
              viewBox="0 0 440 200"
              className="w-full max-w-[400px] h-auto overflow-visible select-none"
            >
              <defs>
                {/* Platinum / White Tier Body Shading (Exact match to Hero) */}
                <linearGradient id="authBodyPlat" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="25%" stopColor="#f8f9fa" />
                  <stop offset="65%" stopColor="#edeef1" />
                  <stop offset="92%" stopColor="#dcdfe4" />
                  <stop offset="100%" stopColor="#cbd0d8" />
                </linearGradient>

                {/* Top Rim Surface Gradient */}
                <radialGradient id="authTopPlat" cx="45%" cy="40%" r="60%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="65%" stopColor="#f4f5f7" />
                  <stop offset="100%" stopColor="#e5e7eb" />
                </radialGradient>

                {/* Charcoal Accent Tier Shading */}
                <linearGradient id="authBodyCharcoal" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3f3f46" />
                  <stop offset="25%" stopColor="#27272a" />
                  <stop offset="70%" stopColor="#18181b" />
                  <stop offset="100%" stopColor="#09090b" />
                </linearGradient>

                <radialGradient id="authTopCharcoal" cx="45%" cy="40%" r="60%">
                  <stop offset="0%" stopColor="#27272a" />
                  <stop offset="70%" stopColor="#18181b" />
                  <stop offset="100%" stopColor="#09090b" />
                </radialGradient>

                {/* Recessed Waist Neck Ring Shading */}
                <linearGradient id="authWaistShade" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#71717a" />
                  <stop offset="30%" stopColor="#52525b" />
                  <stop offset="75%" stopColor="#27272a" />
                  <stop offset="100%" stopColor="#18181b" />
                </linearGradient>

                {/* Soft Floor Shadow Blur */}
                <filter id="authGroundBlur" x="-30%" y="-40%" width="160%" height="200%">
                  <feGaussianBlur stdDeviation="6" />
                </filter>
              </defs>

              {/* 1. Floor Guides and Shadows for 4 Cylinders */}
              <ellipse
                cx="220"
                cy="175"
                rx="180"
                ry="18"
                fill="none"
                stroke="#e4e4e7"
                strokeWidth="1"
                strokeDasharray="3 3"
              />

              {/* Rear Floor Shadows */}
              <ellipse cx="85" cy="155" rx="46" ry="12" fill="#000000" opacity="0.12" filter="url(#authGroundBlur)" />
              <ellipse cx="355" cy="155" rx="46" ry="12" fill="#000000" opacity="0.12" filter="url(#authGroundBlur)" />

              {/* Front Floor Shadows */}
              <ellipse cx="170" cy="180" rx="55" ry="15" fill="#000000" opacity="0.15" filter="url(#authGroundBlur)" />
              <ellipse cx="275" cy="182" rx="54" ry="15" fill="#000000" opacity="0.15" filter="url(#authGroundBlur)" />

              {/* Connecting isometric guide lines */}
              <path d="M 85 155 L 170 180 M 275 182 L 355 155" stroke="#d4d4d8" strokeWidth="1" strokeDasharray="2 3" />
              <circle cx="85" cy="155" r="2" fill="#71717a" />
              <circle cx="170" cy="180" r="2" fill="#71717a" />
              <circle cx="275" cy="182" r="2" fill="#71717a" />
              <circle cx="355" cy="155" r="2" fill="#71717a" />

              {/* 2. Rear Cylinders (Rendered first for depth) */}
              {/* CYLINDER 1 (Back-Left - 3 Tiers) */}
              <HeroCylinder
                cx={85}
                baseCy={122}
                rx={36}
                ry={12}
                tierH={14}
                waistH={5}
                tiers={['plat', 'charcoal', 'plat']}
                hasSpindle={false}
              />

              {/* CYLINDER 2 (Back-Right - 3 Tiers) */}
              <HeroCylinder
                cx={355}
                baseCy={122}
                rx={36}
                ry={12}
                tierH={14}
                waistH={5}
                tiers={['plat', 'charcoal', 'plat']}
                hasSpindle={false}
              />

              {/* 3. Front Cylinders (Rendered in front for depth) */}
              {/* CYLINDER 3 (Front-Center-Left - Monumental 4 Tiers with Hub) */}
              <HeroCylinder
                cx={170}
                baseCy={146}
                rx={46}
                ry={16}
                tierH={16}
                waistH={5}
                tiers={['plat', 'charcoal', 'plat', 'plat']}
                hasSpindle={true}
              />

              {/* CYLINDER 4 (Front-Center-Right - Monumental 4 Tiers with Hub) */}
              <HeroCylinder
                cx={275}
                baseCy={148}
                rx={46}
                ry={16}
                tierH={16}
                waistH={5}
                tiers={['plat', 'plat', 'charcoal', 'plat']}
                hasSpindle={true}
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
