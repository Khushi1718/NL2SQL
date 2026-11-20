import React, { useEffect, useRef } from 'react';
import { ArrowRight, Database, Terminal } from 'lucide-react';
import { gsap } from 'gsap';

export default function ArchitecturalMonumentHero({ onStartQuerying, onNavigateToDatabases }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);

  // References for Center Cylinder (Rear / Elevated)
  const centerCylRef = useRef(null);
  const centerShadowRef = useRef(null);
  const centerTier1Ref = useRef(null);
  const centerTier2Ref = useRef(null);
  const centerTier3Ref = useRef(null);
  const centerTier4Ref = useRef(null);

  // References for Left Cylinder (Front-Left)
  const leftCylRef = useRef(null);
  const leftShadowRef = useRef(null);
  const leftTier1Ref = useRef(null);
  const leftTier2Ref = useRef(null);
  const leftTier3Ref = useRef(null);
  const leftTier4Ref = useRef(null);

  // References for Right Cylinder (Front-Right)
  const rightCylRef = useRef(null);
  const rightShadowRef = useRef(null);
  const rightTier1Ref = useRef(null);
  const rightTier2Ref = useRef(null);
  const rightTier3Ref = useRef(null);
  const rightTier4Ref = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // ── INITIAL STATE: Layers floating apart vertically in the air ──
      const allTier1 = [centerTier1Ref.current, leftTier1Ref.current, rightTier1Ref.current];
      const allTier2 = [centerTier2Ref.current, leftTier2Ref.current, rightTier2Ref.current];
      const allTier3 = [centerTier3Ref.current, leftTier3Ref.current, rightTier3Ref.current];
      const allTier4 = [centerTier4Ref.current, leftTier4Ref.current, rightTier4Ref.current];
      const allShadows = [centerShadowRef.current, leftShadowRef.current, rightShadowRef.current];

      gsap.set(allTier1, { y: -240, opacity: 0 });
      gsap.set(allTier2, { y: -160, opacity: 0 });
      gsap.set(allTier3, { y: -95, opacity: 0 });
      gsap.set(allTier4, { y: -40, opacity: 0 });
      gsap.set(allShadows, { scaleX: 0.3, scaleY: 0.3, opacity: 0, transformOrigin: "center center" });

      // ── MASTER ASSEMBLY TIMELINE: Layers cascade downward and assemble ──
      const assembleTl = gsap.timeline({
        onComplete: startFloatingMotion
      });

      // 1. Floor shadows expand as platters descend
      assembleTl.to(allShadows, {
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        duration: 1.5,
        ease: "power2.out"
      }, 0);

      // 2. Tier 4 (Base Platters) land first
      assembleTl.to([centerTier4Ref.current, leftTier4Ref.current, rightTier4Ref.current], {
        y: 0,
        opacity: 1,
        duration: 1.05,
        ease: "power3.out",
        stagger: 0.08
      }, 0.1);

      // 3. Tier 3 settles onto Tier 4
      assembleTl.to([centerTier3Ref.current, leftTier3Ref.current, rightTier3Ref.current], {
        y: 0,
        opacity: 1,
        duration: 1.1,
        ease: "power3.out",
        stagger: 0.08
      }, 0.22);

      // 4. Tier 2 settles onto Tier 3
      assembleTl.to([centerTier2Ref.current, leftTier2Ref.current, rightTier2Ref.current], {
        y: 0,
        opacity: 1,
        duration: 1.15,
        ease: "power3.out",
        stagger: 0.08
      }, 0.35);

      // 5. Tier 1 (Top Spindle Platter) settles and seals the cylinders
      assembleTl.to([centerTier1Ref.current, leftTier1Ref.current, rightTier1Ref.current], {
        y: 0,
        opacity: 1,
        duration: 1.2,
        ease: "back.out(1.15)",
        stagger: 0.08
      }, 0.48);

      // ── CONTINUOUS SUBTLE FLOATING LEVITATION AFTER ASSEMBLY ──
      function startFloatingMotion() {
        gsap.to(centerCylRef.current, {
          y: -9,
          duration: 3.5,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });
        gsap.to(centerShadowRef.current, {
          scaleX: 0.88,
          scaleY: 0.88,
          opacity: 0.65,
          duration: 3.5,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });

        gsap.to(leftCylRef.current, {
          y: -8,
          duration: 4.0,
          delay: 0.35,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });
        gsap.to(leftShadowRef.current, {
          scaleX: 0.9,
          scaleY: 0.9,
          opacity: 0.7,
          duration: 4.0,
          delay: 0.35,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });

        gsap.to(rightCylRef.current, {
          y: -8,
          duration: 4.2,
          delay: 0.75,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });
        gsap.to(rightShadowRef.current, {
          scaleX: 0.9,
          scaleY: 0.9,
          opacity: 0.7,
          duration: 4.2,
          delay: 0.75,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });
      }

    }, svgRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full min-h-screen bg-white text-zinc-950 select-none overflow-hidden flex flex-col justify-between"
    >
      
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* FADED ISOMETRIC DOTTED GRID BACKGROUND (Exact match to reference)   */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          maskImage: 'radial-gradient(ellipse 80% 70% at 65% 50%, black 20%, transparent 78%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 65% 50%, black 20%, transparent 78%)',
        }}
      >
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="fadedDottedGrid" width="60" height="34.64" patternUnits="userSpaceOnUse">
              <path
                d="M 0 17.32 L 30 0 L 60 17.32 L 30 34.64 Z"
                fill="none"
                stroke="#cbd5e1"
                strokeWidth="0.85"
                strokeDasharray="2 3"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#fadedDottedGrid)" opacity="0.65" />
        </svg>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MAIN CONTAINER: Full Viewport Height with Bottom-Left Typography   */}
      {/* and Vertically Centered 3D Technical Cylinders                     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="w-full max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-10 xl:px-12 pt-24 sm:pt-28 pb-12 sm:pb-16 flex-1 flex flex-col justify-between relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 w-full flex-1 items-stretch">
          
          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* LEFT COLUMN: Anchored to Bottom-Left Corner                       */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-5 flex flex-col justify-end self-end space-y-4 text-left z-20 pb-2 sm:pb-4">
            
            {/* Main Headline */}
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-[50px] font-normal tracking-tight text-zinc-950 leading-[1.12]">
              AI Powered <br />
              Query Engine <br />
              <span className="text-zinc-400 font-serif italic">
                with verified AST safety
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-zinc-500 font-normal max-w-sm sm:max-w-md leading-relaxed pt-1">
              The first schema-grounded natural language platform where you can query relational databases with instant AI precision.
            </p>

            {/* Pill Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={onStartQuerying}
                className="px-6 py-2.5 rounded-full bg-black hover:bg-zinc-800 text-white text-xs sm:text-sm font-semibold transition-all active:scale-95 shadow-xs cursor-pointer"
              >
                Start Querying
              </button>
              <button
                onClick={onNavigateToDatabases}
                className="px-6 py-2.5 rounded-full bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-200 text-xs sm:text-sm font-semibold transition-all active:scale-95 shadow-xs cursor-pointer"
              >
                My Databases
              </button>
            </div>

          </div>

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* RIGHT COLUMN: 3D Technical Cylinders in the Vertical Middle       */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-7 relative w-full flex items-center justify-center lg:justify-end self-center z-10 py-6 lg:py-0">
            <div className="w-full max-w-[620px] lg:max-w-[660px]">
              <svg
                ref={svgRef}
                viewBox="0 0 760 520"
                className="w-full h-auto overflow-visible"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  {/* Platinum / White Tier Body Shading */}
                  <linearGradient id="bodyPlat" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="25%" stopColor="#f8f9fa" />
                    <stop offset="65%" stopColor="#edeef1" />
                    <stop offset="92%" stopColor="#dcdfe4" />
                    <stop offset="100%" stopColor="#cbd0d8" />
                  </linearGradient>

                  {/* Top Rim Surface Gradient */}
                  <radialGradient id="topPlat" cx="45%" cy="40%" r="60%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="65%" stopColor="#f4f5f7" />
                    <stop offset="100%" stopColor="#e5e7eb" />
                  </radialGradient>

                  {/* Charcoal Accent Tier Shading */}
                  <linearGradient id="bodyCharcoal" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3f3f46" />
                    <stop offset="25%" stopColor="#27272a" />
                    <stop offset="70%" stopColor="#18181b" />
                    <stop offset="100%" stopColor="#09090b" />
                  </linearGradient>

                  <radialGradient id="topCharcoal" cx="45%" cy="40%" r="60%">
                    <stop offset="0%" stopColor="#27272a" />
                    <stop offset="70%" stopColor="#18181b" />
                    <stop offset="100%" stopColor="#09090b" />
                  </radialGradient>

                  {/* Recessed Waist Neck Ring Shading */}
                  <linearGradient id="waistShade" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#71717a" />
                    <stop offset="30%" stopColor="#52525b" />
                    <stop offset="75%" stopColor="#27272a" />
                    <stop offset="100%" stopColor="#18181b" />
                  </linearGradient>

                  {/* Soft Floor Shadow Blur */}
                  <filter id="groundBlur" x="-30%" y="-40%" width="160%" height="200%">
                    <feGaussianBlur stdDeviation="8" />
                  </filter>
                </defs>

                {/* ═════════════════════════════════════════════════════════════ */}
                {/* 1. SOFT FLOOR SHADOWS                                         */}
                {/* ═════════════════════════════════════════════════════════════ */}
                {/* Center / Rear Floor Shadow */}
                <ellipse
                  ref={centerShadowRef}
                  cx="380"
                  cy="390"
                  rx="92"
                  ry="26"
                  fill="#000000"
                  opacity="0.14"
                  filter="url(#groundBlur)"
                />
                {/* Left Floor Shadow */}
                <ellipse
                  ref={leftShadowRef}
                  cx="240"
                  cy="450"
                  rx="95"
                  ry="28"
                  fill="#000000"
                  opacity="0.16"
                  filter="url(#groundBlur)"
                />
                {/* Right Floor Shadow */}
                <ellipse
                  ref={rightShadowRef}
                  cx="520"
                  cy="450"
                  rx="95"
                  ry="28"
                  fill="#000000"
                  opacity="0.16"
                  filter="url(#groundBlur)"
                />

                {/* ═════════════════════════════════════════════════════════════ */}
                {/* 2. CENTER CYLINDER (Rear / Elevated)                          */}
                {/* ═════════════════════════════════════════════════════════════ */}
                <g ref={centerCylRef} id="center-cylinder">
                  
                  {/* Tier 4 (Base Platter) */}
                  <g ref={centerTier4Ref} id="center-tier-4">
                    <path
                      d="M 302 316 L 302 356 A 78 28 0 0 0 458 356 L 458 316 A 78 28 0 0 1 302 316 Z"
                      fill="url(#bodyPlat)"
                      stroke="#18181b"
                      strokeWidth="1.4"
                    />
                    <ellipse cx="380" cy="316" rx="78" ry="28" fill="url(#topPlat)" stroke="#18181b" strokeWidth="1.4" />
                    <circle cx="330" cy="342" r="2.2" fill="#18181b" />
                    <path d="M 345 344 Q 380 351 415 344" stroke="#18181b" strokeWidth="1.3" fill="none" strokeLinecap="round" />
                    {/* Beveled Waist Neck */}
                    <path
                      d="M 314 304 L 314 316 A 66 22 0 0 0 446 316 L 446 304 A 66 22 0 0 1 314 304 Z"
                      fill="url(#waistShade)"
                      stroke="#18181b"
                      strokeWidth="1.2"
                    />
                  </g>

                  {/* Tier 3 (Middle-Lower Platter - Charcoal Accent) */}
                  <g ref={centerTier3Ref} id="center-tier-3">
                    <path
                      d="M 302 264 L 302 304 A 78 28 0 0 0 458 304 L 458 264 A 78 28 0 0 1 302 264 Z"
                      fill="url(#bodyCharcoal)"
                      stroke="#18181b"
                      strokeWidth="1.4"
                    />
                    <ellipse cx="380" cy="264" rx="78" ry="28" fill="url(#topCharcoal)" stroke="#18181b" strokeWidth="1.4" />
                    <circle cx="330" cy="290" r="2.2" fill="#ffffff" />
                    <path d="M 345 292 Q 380 299 415 292" stroke="#ffffff" strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.8" />
                    {/* Beveled Waist Neck */}
                    <path
                      d="M 314 252 L 314 264 A 66 22 0 0 0 446 264 L 446 252 A 66 22 0 0 1 314 252 Z"
                      fill="url(#waistShade)"
                      stroke="#18181b"
                      strokeWidth="1.2"
                    />
                  </g>

                  {/* Tier 2 (Middle-Upper Platter - Platinum) */}
                  <g ref={centerTier2Ref} id="center-tier-2">
                    <path
                      d="M 302 212 L 302 252 A 78 28 0 0 0 458 252 L 458 212 A 78 28 0 0 1 302 212 Z"
                      fill="url(#bodyPlat)"
                      stroke="#18181b"
                      strokeWidth="1.4"
                    />
                    <ellipse cx="380" cy="212" rx="78" ry="28" fill="url(#topPlat)" stroke="#18181b" strokeWidth="1.4" />
                    <circle cx="330" cy="238" r="2.2" fill="#18181b" />
                    <path d="M 345 240 Q 380 247 415 240" stroke="#18181b" strokeWidth="1.3" fill="none" strokeLinecap="round" />
                    {/* Beveled Waist Neck */}
                    <path
                      d="M 314 200 L 314 212 A 66 22 0 0 0 446 212 L 446 200 A 66 22 0 0 1 314 200 Z"
                      fill="url(#waistShade)"
                      stroke="#18181b"
                      strokeWidth="1.2"
                    />
                  </g>

                  {/* Tier 1 (Top Platter with Center Recessed Hub) */}
                  <g ref={centerTier1Ref} id="center-tier-1">
                    <path
                      d="M 302 160 L 302 200 A 78 28 0 0 0 458 200 L 458 160 A 78 28 0 0 1 302 160 Z"
                      fill="url(#bodyPlat)"
                      stroke="#18181b"
                      strokeWidth="1.4"
                    />
                    <ellipse cx="380" cy="160" rx="78" ry="28" fill="url(#topPlat)" stroke="#18181b" strokeWidth="1.4" />
                    {/* Recessed Center Spindle Hub */}
                    <ellipse cx="380" cy="160" rx="28" ry="10" fill="#18181b" stroke="#3f3f46" strokeWidth="1.2" />
                    <ellipse cx="380" cy="160" rx="14" ry="5" fill="#09090b" />
                    {/* Drive Slot and LED */}
                    <circle cx="330" cy="186" r="2.2" fill="#18181b" />
                    <path d="M 345 188 Q 380 195 415 188" stroke="#18181b" strokeWidth="1.3" fill="none" strokeLinecap="round" />
                  </g>

                </g>

                {/* ═════════════════════════════════════════════════════════════ */}
                {/* 3. LEFT CYLINDER (Front-Left)                                 */}
                {/* ═════════════════════════════════════════════════════════════ */}
                <g ref={leftCylRef} id="left-cylinder">
                  
                  {/* Tier 4 (Base Platter) */}
                  <g ref={leftTier4Ref} id="left-tier-4">
                    <path
                      d="M 162 376 L 162 416 A 78 28 0 0 0 318 416 L 318 376 A 78 28 0 0 1 162 376 Z"
                      fill="url(#bodyPlat)"
                      stroke="#18181b"
                      strokeWidth="1.4"
                    />
                    <ellipse cx="240" cy="376" rx="78" ry="28" fill="url(#topPlat)" stroke="#18181b" strokeWidth="1.4" />
                    <circle cx="190" cy="402" r="2.2" fill="#18181b" />
                    <path d="M 205 404 Q 240 411 275 404" stroke="#18181b" strokeWidth="1.3" fill="none" strokeLinecap="round" />
                    {/* Beveled Waist Neck */}
                    <path
                      d="M 174 364 L 174 376 A 66 22 0 0 0 306 376 L 306 364 A 66 22 0 0 1 174 364 Z"
                      fill="url(#waistShade)"
                      stroke="#18181b"
                      strokeWidth="1.2"
                    />
                  </g>

                  {/* Tier 3 (Middle-Lower Platter - Platinum) */}
                  <g ref={leftTier3Ref} id="left-tier-3">
                    <path
                      d="M 162 324 L 162 364 A 78 28 0 0 0 318 364 L 318 324 A 78 28 0 0 1 162 324 Z"
                      fill="url(#bodyPlat)"
                      stroke="#18181b"
                      strokeWidth="1.4"
                    />
                    <ellipse cx="240" cy="324" rx="78" ry="28" fill="url(#topPlat)" stroke="#18181b" strokeWidth="1.4" />
                    <circle cx="190" cy="350" r="2.2" fill="#18181b" />
                    <path d="M 205 352 Q 240 359 275 352" stroke="#18181b" strokeWidth="1.3" fill="none" strokeLinecap="round" />
                    {/* Beveled Waist Neck */}
                    <path
                      d="M 174 312 L 174 324 A 66 22 0 0 0 306 324 L 306 312 A 66 22 0 0 1 174 312 Z"
                      fill="url(#waistShade)"
                      stroke="#18181b"
                      strokeWidth="1.2"
                    />
                  </g>

                  {/* Tier 2 (Middle-Upper Platter - Charcoal Accent) */}
                  <g ref={leftTier2Ref} id="left-tier-2">
                    <path
                      d="M 162 272 L 162 312 A 78 28 0 0 0 318 312 L 318 272 A 78 28 0 0 1 162 272 Z"
                      fill="url(#bodyCharcoal)"
                      stroke="#18181b"
                      strokeWidth="1.4"
                    />
                    <ellipse cx="240" cy="272" rx="78" ry="28" fill="url(#topCharcoal)" stroke="#18181b" strokeWidth="1.4" />
                    <circle cx="190" cy="298" r="2.2" fill="#ffffff" />
                    <path d="M 205 300 Q 240 307 275 300" stroke="#ffffff" strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.8" />
                    {/* Beveled Waist Neck */}
                    <path
                      d="M 174 260 L 174 272 A 66 22 0 0 0 306 272 L 306 260 A 66 22 0 0 1 174 260 Z"
                      fill="url(#waistShade)"
                      stroke="#18181b"
                      strokeWidth="1.2"
                    />
                  </g>

                  {/* Tier 1 (Top Platter with Spindle Hub) */}
                  <g ref={leftTier1Ref} id="left-tier-1">
                    <path
                      d="M 162 220 L 162 260 A 78 28 0 0 0 318 260 L 318 220 A 78 28 0 0 1 162 220 Z"
                      fill="url(#bodyPlat)"
                      stroke="#18181b"
                      strokeWidth="1.4"
                    />
                    <ellipse cx="240" cy="220" rx="78" ry="28" fill="url(#topPlat)" stroke="#18181b" strokeWidth="1.4" />
                    {/* Recessed Center Spindle Hub */}
                    <ellipse cx="240" cy="220" rx="28" ry="10" fill="#18181b" stroke="#3f3f46" strokeWidth="1.2" />
                    <ellipse cx="240" cy="220" rx="14" ry="5" fill="#09090b" />
                    {/* Drive Slot and LED */}
                    <circle cx="190" cy="246" r="2.2" fill="#18181b" />
                    <path d="M 205 248 Q 240 255 275 248" stroke="#18181b" strokeWidth="1.3" fill="none" strokeLinecap="round" />
                  </g>

                </g>

                {/* ═════════════════════════════════════════════════════════════ */}
                {/* 4. RIGHT CYLINDER (Front-Right)                               */}
                {/* ═════════════════════════════════════════════════════════════ */}
                <g ref={rightCylRef} id="right-cylinder">
                  
                  {/* Tier 4 (Base Platter) */}
                  <g ref={rightTier4Ref} id="right-tier-4">
                    <path
                      d="M 442 376 L 442 416 A 78 28 0 0 0 598 416 L 598 376 A 78 28 0 0 1 442 376 Z"
                      fill="url(#bodyPlat)"
                      stroke="#18181b"
                      strokeWidth="1.4"
                    />
                    <ellipse cx="520" cy="376" rx="78" ry="28" fill="url(#topPlat)" stroke="#18181b" strokeWidth="1.4" />
                    <circle cx="470" cy="402" r="2.2" fill="#18181b" />
                    <path d="M 485 404 Q 520 411 555 404" stroke="#18181b" strokeWidth="1.3" fill="none" strokeLinecap="round" />
                    {/* Beveled Waist Neck */}
                    <path
                      d="M 454 364 L 454 376 A 66 22 0 0 0 586 376 L 586 364 A 66 22 0 0 1 454 364 Z"
                      fill="url(#waistShade)"
                      stroke="#18181b"
                      strokeWidth="1.2"
                    />
                  </g>

                  {/* Tier 3 (Middle-Lower Platter - Charcoal Accent) */}
                  <g ref={rightTier3Ref} id="right-tier-3">
                    <path
                      d="M 442 324 L 442 364 A 78 28 0 0 0 598 364 L 598 324 A 78 28 0 0 1 442 324 Z"
                      fill="url(#bodyCharcoal)"
                      stroke="#18181b"
                      strokeWidth="1.4"
                    />
                    <ellipse cx="520" cy="324" rx="78" ry="28" fill="url(#topCharcoal)" stroke="#18181b" strokeWidth="1.4" />
                    <circle cx="470" cy="350" r="2.2" fill="#ffffff" />
                    <path d="M 485 352 Q 520 359 555 352" stroke="#ffffff" strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.8" />
                    {/* Beveled Waist Neck */}
                    <path
                      d="M 454 312 L 454 324 A 66 22 0 0 0 586 324 L 586 312 A 66 22 0 0 1 454 312 Z"
                      fill="url(#waistShade)"
                      stroke="#18181b"
                      strokeWidth="1.2"
                    />
                  </g>

                  {/* Tier 2 (Middle-Upper Platter - Platinum) */}
                  <g ref={rightTier2Ref} id="right-tier-2">
                    <path
                      d="M 442 272 L 442 312 A 78 28 0 0 0 598 312 L 598 272 A 78 28 0 0 1 442 272 Z"
                      fill="url(#bodyPlat)"
                      stroke="#18181b"
                      strokeWidth="1.4"
                    />
                    <ellipse cx="520" cy="272" rx="78" ry="28" fill="url(#topPlat)" stroke="#18181b" strokeWidth="1.4" />
                    <circle cx="470" cy="298" r="2.2" fill="#18181b" />
                    <path d="M 485 300 Q 520 307 555 300" stroke="#18181b" strokeWidth="1.3" fill="none" strokeLinecap="round" />
                    {/* Beveled Waist Neck */}
                    <path
                      d="M 454 260 L 454 272 A 66 22 0 0 0 586 272 L 586 260 A 66 22 0 0 1 454 260 Z"
                      fill="url(#waistShade)"
                      stroke="#18181b"
                      strokeWidth="1.2"
                    />
                  </g>

                  {/* Tier 1 (Top Platter with Spindle Hub) */}
                  <g ref={rightTier1Ref} id="right-tier-1">
                    <path
                      d="M 442 220 L 442 260 A 78 28 0 0 0 598 260 L 598 220 A 78 28 0 0 1 442 220 Z"
                      fill="url(#bodyPlat)"
                      stroke="#18181b"
                      strokeWidth="1.4"
                    />
                    <ellipse cx="520" cy="220" rx="78" ry="28" fill="url(#topPlat)" stroke="#18181b" strokeWidth="1.4" />
                    {/* Recessed Center Spindle Hub */}
                    <ellipse cx="520" cy="220" rx="28" ry="10" fill="#18181b" stroke="#3f3f46" strokeWidth="1.2" />
                    <ellipse cx="520" cy="220" rx="14" ry="5" fill="#09090b" />
                    {/* Drive Slot and LED */}
                    <circle cx="470" cy="246" r="2.2" fill="#18181b" />
                    <path d="M 485 248 Q 520 255 555 248" stroke="#18181b" strokeWidth="1.3" fill="none" strokeLinecap="round" />
                  </g>

                </g>

              </svg>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
