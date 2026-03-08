'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import NewtonApple from './NewtonApple';

/* ─── Particle system — deterministic positions ── */
const PARTICLES = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  left: `${(i * 37 + 11) % 100}%`,
  top:  `${(i * 53 + 7)  % 100}%`,
  size: [1, 1.5, 1, 2, 1, 1.5][i % 6],
  opacity: 0.08 + (i % 7) * 0.025,
  duration: 12 + (i % 8) * 2,
  delay: (i * 0.6) % 7,
}));

/* ─── Framer variants ── */
const heroContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.18, delayChildren: 0.4 },
  },
};

const blurIn = {
  hidden: { opacity: 0, y: 20, filter: 'blur(12px)' },
  show: {
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1, y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

/* ─── Browser chrome product preview ── */
function BrowserMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60, rotateX: 8 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 1.2, delay: 1.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto max-w-4xl"
      style={{ perspective: 1200 }}
    >
      {/* Glow behind the frame */}
      <div className="absolute -inset-4 rounded-3xl bg-brand/8 blur-2xl pointer-events-none" />

      {/* Browser chrome */}
      <div className="relative rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
           style={{ background: 'rgba(15, 15, 28, 0.92)' }}>
        {/* Title bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/6"
             style={{ background: 'rgba(9, 9, 15, 0.8)' }}>
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
            <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
            <div className="w-3 h-3 rounded-full bg-[#28C840]" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-2 px-3 py-1 rounded-md text-xs text-[var(--c-text-muted)]"
                 style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              trynewtonai.com/chat
            </div>
          </div>
        </div>

        {/* Chat interface */}
        <div className="px-6 py-5 space-y-4" style={{ minHeight: 260 }}>
          {/* Student message */}
          <div className="flex justify-end">
            <div className="max-w-xs px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm"
                 style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '0.5px solid rgba(245,158,11,0.2)' }}>
              Can you just give me the answer to this integration problem?
            </div>
          </div>

          {/* Newton response */}
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                 style={{ background: 'rgba(245,158,11,0.2)', color: '#F59E0B' }}>N</div>
            <div className="max-w-sm px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm text-[var(--c-text)]"
                 style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.08)' }}>
              What technique do you think applies here? Have you seen a similar structure before?
            </div>
          </div>

          {/* Student reply */}
          <div className="flex justify-end">
            <div className="max-w-xs px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm"
                 style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '0.5px solid rgba(245,158,11,0.2)' }}>
              Maybe substitution? If I let u = x²…
            </div>
          </div>

          {/* Newton response 2 */}
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                 style={{ background: 'rgba(245,158,11,0.2)', color: '#F59E0B' }}>N</div>
            <div className="max-w-sm px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm text-[var(--c-text)]"
                 style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.08)' }}>
              Exactly the right instinct. What would du be in that case?
            </div>
          </div>

          {/* Typing indicator */}
          <div className="flex items-center gap-1.5 ml-10">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-[var(--c-text-muted)]"
                   style={{ animation: `float 1.2s ease-in-out ${i * 0.2}s infinite` }} />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Main hero ── */
export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 hero-bg" />

      {/* Subtle vignette */}
      <div className="absolute inset-0 pointer-events-none"
           style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 100%, transparent 0%, rgba(9,9,15,0.6) 100%)' }} />

      {/* Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {PARTICLES.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full bg-white"
            style={{
              left: p.left,
              top:  p.top,
              width:  p.size,
              height: p.size,
              '--p-opacity': p.opacity,
              opacity: p.opacity,
              animation: `particle-drift ${p.duration}s ease-in-out ${p.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col flex-1 max-w-7xl mx-auto px-6 lg:px-8 pt-24 pb-16 w-full">
        <div className="flex flex-col lg:flex-row items-center gap-16 flex-1">

          {/* ── Left: Text ── */}
          <motion.div
            className="flex-1 max-w-2xl"
            variants={heroContainer}
            initial="hidden"
            animate="show"
          >
            {/* Badge */}
            <motion.div variants={fadeUp} className="mb-8">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
                    style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B', border: '0.5px solid rgba(245,158,11,0.25)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                AI That Teaches, Not Tells
              </span>
            </motion.div>

            {/* Headline */}
            <h1 className="font-semibold tracking-tighter leading-none mb-6">
              <motion.span
                variants={blurIn}
                className="block text-5xl md:text-6xl lg:text-7xl text-[var(--c-text-muted)]"
              >
                The World's First
              </motion.span>
              <motion.span
                variants={blurIn}
                className="block text-5xl md:text-6xl lg:text-7xl text-[var(--c-text)]"
              >
                Sovereign Learning
              </motion.span>
              <motion.span
                variants={blurIn}
                className="block text-5xl md:text-6xl lg:text-7xl text-brand"
              >
                System.
              </motion.span>
            </h1>

            {/* Subheadline */}
            <motion.p
              variants={fadeUp}
              className="text-lg md:text-xl text-[var(--c-text-soft)] font-light leading-relaxed mb-10 max-w-lg"
            >
              Newton uses the Socratic method to guide students toward understanding —
              never completing work for them. Academic integrity, by design.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={fadeUp} className="flex flex-wrap gap-4">
              <Link
                href="/chat"
                className="relative inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium text-sm
                           bg-brand text-[var(--c-brand-text)] hover:bg-brand-hover
                           transition-colors duration-150 shadow-sm light-sweep overflow-hidden"
              >
                Try Newton Free
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium text-sm
                           text-[var(--c-text-soft)] hover:text-[var(--c-text)]
                           border border-[var(--c-border)] hover:border-[var(--c-border-strong)]
                           transition-colors duration-150"
              >
                See how it works
              </a>
            </motion.div>

            {/* Social proof */}
            <motion.div variants={fadeUp} className="mt-10 flex items-center gap-4">
              <div className="flex -space-x-2">
                {['E', 'A', 'J', 'M'].map((l, i) => (
                  <div key={i}
                       className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ring-2"
                       style={{ background: `hsl(${200 + i * 30}, 50%, 25%)`, color: `hsl(${200 + i * 30}, 80%, 75%)`, ringColor: 'rgba(9,9,15,1)' }}>
                    {l}
                  </div>
                ))}
              </div>
              <p className="text-sm text-[var(--c-text-muted)]">
                Pioneered at <span className="text-[var(--c-text-soft)]">Bedales School</span>, Hampshire
              </p>
            </motion.div>
          </motion.div>

          {/* ── Right: Apple ── */}
          <motion.div
            className="relative flex items-center justify-center lg:flex-1"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Orbital ring */}
            <div className="absolute rounded-full border border-white/5"
                 style={{ width: 320, height: 320 }} />
            <div className="absolute rounded-full border border-brand/8"
                 style={{ width: 240, height: 240 }} />

            <NewtonApple size={220} animate glow />
          </motion.div>
        </div>

        {/* ── Product preview ── */}
        <div className="mt-16 lg:mt-20">
          <BrowserMockup />
        </div>
      </div>

      {/* Bottom fade to canvas */}
      <div className="absolute bottom-0 inset-x-0 h-32 pointer-events-none"
           style={{ background: 'linear-gradient(to bottom, transparent, var(--c-bg))' }} />
    </section>
  );
}
