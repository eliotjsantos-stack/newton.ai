'use client';

import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useMotionValue,
  AnimatePresence,
  useInView,
} from 'framer-motion';
import Lenis from 'lenis';
import ChatDemo from '@/components/landing/ChatDemo';
import { LiveHeatmap, ForgettingCurve } from '@/components/landing/InstitutionalIntelligence';
import GradeCurveDemo from '@/components/landing/GradeCurveDemo';

/* ─── Physics ─── */
const spring = { type: 'spring', stiffness: 100, damping: 20, mass: 1 };

/* ─── ScrollReveal ─── */
function ScrollReveal({ children, className = '', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ ...spring, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Scroll Carousel with Dots ─── */
function ScrollCarousel({ children, count, className = '' }) {
  const ref = useRef(null);
  const [active, setActive] = useState(0);

  const handleScroll = useCallback(() => {
    const el = ref.current;
    if (!el || !el.scrollWidth) return;
    const itemW = (el.scrollWidth - el.offsetWidth) / Math.max(count - 1, 1);
    setActive(Math.round(el.scrollLeft / itemW));
  }, [count]);

  return (
    <div>
      <div
        ref={ref}
        onScroll={handleScroll}
        className={className}
      >
        {children}
      </div>
      {count > 1 && (
        <div className="flex justify-center gap-1.5 mt-4 sm:hidden">
          {Array.from({ length: count }).map((_, i) => (
            <button
              key={i}
              onClick={() => {
                const el = ref.current;
                if (!el) return;
                const itemW = (el.scrollWidth - el.offsetWidth) / Math.max(count - 1, 1);
                el.scrollTo({ left: i * itemW, behavior: 'smooth' });
              }}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                i === active ? 'bg-white/60 w-4' : 'bg-white/15'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Institutional Demo (Hero Mockup) ─── */
const heroMessages = [
  { role: 'student', text: "I'm stuck on Mitosis." },
  { role: 'newton', text: "Good start! Before a cell divides, something important has to happen to its DNA. What do you think that might be?" },
  { role: 'student', text: 'So both new cells get the same genetic info?' },
  { role: 'newton', text: "Exactly right! Now — what happens to the chromosomes during Prophase?" },
];

function GlassPane() {
  const ref = useRef(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rawRx = useTransform(my, [-0.5, 0.5], [4, -4]);
  const rawRy = useTransform(mx, [-0.5, 0.5], [-4, 4]);
  const rotateX = useSpring(rawRx, { stiffness: 120, damping: 20 });
  const rotateY = useSpring(rawRy, { stiffness: 120, damping: 20 });

  return (
    <motion.div
      ref={ref}
      onMouseMove={(e) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        const nx = (e.clientX - rect.left) / rect.width - 0.5;
        const ny = (e.clientY - rect.top) / rect.height - 0.5;
        mx.set(nx);
        my.set(ny);
      }}
      onMouseLeave={() => {
        mx.set(0);
        my.set(0);
      }}
      style={{ rotateX, rotateY, transformPerspective: 1200 }}
      className="w-full max-w-[420px] xl:max-w-[480px]"
      initial={{ opacity: 0, y: 60, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ ...spring, delay: 0.6 }}
    >
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: '#0a0a0b',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Title bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]" style={{ background: '#08080a' }}>
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-white/[0.08]" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/[0.08]" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/[0.08]" />
            </div>
            <span className="text-[11px] text-[#a1a1a6] ml-2 tracking-wide">Biology — AQA 4.1 Cell Biology</span>
          </div>
        </div>

        {/* Chat area */}
        <div className="relative z-10 p-4 min-h-[240px]">
          <ChatDemo
            messages={heroMessages}
            active
            dark
            loop
          />
        </div>

        {/* Input bar */}
        <div className="relative z-10 px-4 pb-3">
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/[0.08]" style={{ background: 'rgba(18,18,20,0.95)' }}>
            <span className="text-[13px] text-[#a1a1a6]/40">Ask about Mitosis...</span>
            <div className="ml-auto w-7 h-7 rounded-full bg-[#0071e3] flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
              </svg>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}

/* ─── Exam Board Cards (Apple Scroll Stack) ─── */
const boards = [
  { name: 'AQA', subtitle: 'Assessment & Qualifications Alliance', code: '111' },
  { name: 'Edexcel', subtitle: 'Pearson Education', code: '103' },
  { name: 'OCR', subtitle: 'Oxford, Cambridge & RSA', code: '110' },
];

function ExamBoardScroll() {
  const containerRef = useRef(null);
  const [fanSpread, setFanSpread] = useState(260);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  /* Responsive fan spread */
  useEffect(() => {
    const update = () => setFanSpread(window.innerWidth < 640 ? 120 : 260);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  /* Unstack: stacked → fanned */
  const fan = useTransform(scrollYProgress, [0.15, 0.45], [0, 1]);
  const fanSmooth = useSpring(fan, { stiffness: 100, damping: 20 });

  /* Objective slot-in */
  const slotIn = useTransform(scrollYProgress, [0.5, 0.7], [0, 1]);
  const slotSmooth = useSpring(slotIn, { stiffness: 100, damping: 20 });

  return (
    <section ref={containerRef} className="relative min-h-[150vh] md:min-h-[200vh] py-24">
      <div className="sticky top-0 min-h-screen flex items-center justify-center px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto w-full">
          <ScrollReveal className="text-center mb-10 md:mb-20">
            <p className="text-sm font-semibold tracking-widest uppercase text-[#0071e3] mb-4">
              Grounding Engine
            </p>
            <h2 className="text-2xl sm:text-5xl md:text-7xl font-bold text-white tracking-tighter mb-6">
              Grounded. Not Guessing.
            </h2>
            <p className="hidden sm:block text-xl text-[#a1a1a6] max-w-2xl mx-auto font-medium">
              Every answer is rooted in official 2026 exam board specifications.
            </p>
          </ScrollReveal>

          {/* Card stack */}
          <div className="relative h-[220px] sm:h-[280px] max-w-lg mx-auto perspective-[1200px]">
            {boards.map((board, i) => {
              const total = boards.length;
              const offset = i - Math.floor(total / 2);

              return (
                <motion.div
                  key={board.name}
                  className="absolute inset-0"
                  style={{
                    x: useTransform(fanSmooth, [0, 1], [0, offset * fanSpread]),
                    rotateY: useTransform(fanSmooth, [0, 1], [0, offset * -8]),
                    scale: useTransform(fanSmooth, [0, 1], [1 - Math.abs(offset) * 0.03, 1]),
                    y: useTransform(fanSmooth, [0, 1], [i * -12, 0]),
                    zIndex: total - i,
                  }}
                >
                  <div
                    className="w-full h-[200px] sm:h-[240px] rounded-2xl p-6 sm:p-8 flex flex-col justify-between bg-white/5 border border-white/10 backdrop-blur-[64px]"
                  >
                    <div>
                      <div className="text-2xl font-bold text-white tracking-tight">{board.name}</div>
                      <div className="text-sm text-[#a1a1a6] mt-1">{board.subtitle}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#a1a1a6] font-semibold tracking-widest uppercase">
                        2026 Specification
                      </span>
                      <div className="w-6 h-6 rounded-full bg-[#0071e3]/20 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-[#0071e3]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Curriculum objective slot-in */}
          <motion.div
            className="max-w-md mx-auto mt-8 sm:mt-16"
            style={{
              opacity: slotSmooth,
              y: useTransform(slotSmooth, [0, 1], [40, 0]),
              scale: useTransform(slotSmooth, [0, 1], [0.95, 1]),
            }}
          >
            <div
              className="rounded-2xl p-6 flex items-start gap-4 bg-white/5 border border-white/10"
            >
              <div className="w-10 h-10 rounded-xl bg-[#0071e3]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-[#0071e3]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-white mb-1">AQA GCSE Mathematics (8300)</p>
                <p className="text-sm text-[#a1a1a6] leading-relaxed">
                  &ldquo;Solve quadratic equations by factorising, completing the square, and using the quadratic formula&rdquo;
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-1 flex-1 rounded-full bg-white/[0.06] overflow-hidden">
                    <motion.div
                      className="h-full bg-[#0071e3] rounded-full"
                      style={{ width: useTransform(slotSmooth, [0, 1], ['0%', '100%']) }}
                    />
                  </div>
                  <span className="text-[11px] text-[#0071e3] font-semibold">Loaded</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── Feature Row ─── */
function FeatureRow({ label, title, description, children, reverse = false }) {
  return (
    <div className={`flex flex-col ${reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-8 md:gap-16 lg:gap-24`}>
      <div className="flex-1 max-w-xl min-w-0">
        <p className="text-sm font-semibold tracking-widest uppercase text-[#0071e3] mb-4">{label}</p>
        <h3 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white tracking-tighter mb-6">{title}</h3>
        <p className="hidden sm:block text-lg text-[#a1a1a6] leading-relaxed">{description}</p>
      </div>
      <div className="flex-1 flex justify-center min-w-0">{children}</div>
    </div>
  );
}

/* ─── Stat Block ─── */
function StatBlock({ value, label }) {
  return (
    <div className="text-center">
      <div className="text-2xl sm:text-5xl md:text-6xl font-bold text-white tracking-tighter">{value}</div>
      <div className="text-sm text-[#a1a1a6] font-medium mt-2">{label}</div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState(null);

  /* Lenis smooth scroll */
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  /* Hero parallax */
  const heroRef = useRef(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroTextY = useTransform(heroProgress, [0, 0.5], [0, -120]);
  const heroTextOpacity = useTransform(heroProgress, [0, 0.4], [1, 0]);
  const paneScale = useTransform(heroProgress, [0.05, 0.6], [1, 1.15]);
  const paneY = useTransform(heroProgress, [0, 0.5], [0, -60]);

  return (
    <div className="min-h-screen bg-black">
      {/* ─── Entrance ─── */}
      <motion.div
        className="fixed inset-0 bg-black z-[100] pointer-events-none"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />

      {/* ─── Nav ─── */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${
          scrolled ? 'border-b' : ''
        }`}
        style={{
          background: scrolled ? 'rgba(0,0,0,0.72)' : 'transparent',
          backdropFilter: scrolled ? 'blur(64px) saturate(1.8)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(64px) saturate(1.8)' : 'none',
          borderColor: scrolled ? 'rgba(255,255,255,0.06)' : 'transparent',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                <span className="text-sm font-bold text-black">N</span>
              </div>
              <span className="text-[15px] font-semibold text-white">Newton</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {['Features', 'How It Works', 'Subjects', 'Privacy', 'FAQ'].map((label) => (
                <a
                  key={label}
                  href={`#${label.toLowerCase().replace(/\s+/g, '-')}`}
                  className="px-4 py-2 text-sm text-[#a1a1a6] hover:text-white font-medium rounded-full transition-colors duration-200"
                >
                  {label}
                </a>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/login"
                className="px-4 py-2 text-sm text-[#a1a1a6] hover:text-white font-medium transition-colors duration-200"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="px-5 py-2 bg-[#0071e3] text-white text-sm font-semibold rounded-full hover:bg-[#0077ed] transition-colors duration-200"
              >
                Get Started
              </Link>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-white/[0.06] transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="md:hidden overflow-hidden border-t border-white/[0.06]"
              style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(64px)' }}
            >
              <div className="px-6 py-6 space-y-1">
                {['Features', 'How It Works', 'Subjects', 'Privacy', 'FAQ'].map((label) => (
                  <a
                    key={label}
                    href={`#${label.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 text-[#a1a1a6] hover:text-white font-medium rounded-lg hover:bg-white/[0.04] transition-all"
                  >
                    {label}
                  </a>
                ))}
                <div className="pt-4 space-y-2">
                  <Link href="/login" className="block px-4 py-3 text-[#a1a1a6] hover:text-white font-medium rounded-lg hover:bg-white/[0.04] transition-all">
                    Log In
                  </Link>
                  <Link href="/signup" className="block px-4 py-3 bg-[#0071e3] text-white font-semibold rounded-xl text-center">
                    Get Started
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ─── Hero ─── */}
      <section ref={heroRef} className="relative lg:min-h-[140vh]">
        <div className="lg:sticky lg:top-0 min-h-screen flex items-center pt-20 pb-16 px-6 sm:px-8 lg:px-12">
          <div className="max-w-7xl mx-auto w-full relative z-10">
            <div className="flex flex-col-reverse lg:flex-row items-center gap-8 md:gap-16 lg:gap-20">
              {/* Text */}
              <motion.div
                style={{ opacity: heroTextOpacity, y: heroTextY }}
                className="flex-1 text-left min-w-0"
              >
                <motion.h1
                  className="text-6xl sm:text-7xl md:text-8xl lg:text-[7rem] font-bold text-white tracking-tighter leading-[0.9]"
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring, delay: 0.2 }}
                >
                  Newton.
                </motion.h1>
                <motion.p
                  className="mt-3 md:mt-5 text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] text-[#a1a1a6] font-semibold tracking-tight leading-[1.1]"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring, delay: 0.3 }}
                >
                  The World&apos;s First
                  <br />
                  Sovereign Learning System.
                </motion.p>

                <motion.div
                  className="mt-8 md:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-start items-stretch sm:items-center"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring, delay: 0.45 }}
                >
                  <Link
                    href="/signup"
                    className="w-full sm:w-auto text-center px-8 py-4 bg-[#0071e3] text-white text-base font-semibold rounded-full hover:bg-[#0077ed] transition-colors duration-200"
                  >
                    Try Now
                  </Link>
                  <button
                    onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                    className="w-full sm:w-auto text-center px-8 py-4 text-[#a1a1a6] hover:text-white text-base font-semibold transition-colors duration-200"
                  >
                    See How It Works &darr;
                  </button>
                </motion.div>
              </motion.div>

              {/* Glass Pane */}
              <motion.div
                style={{ scale: paneScale, y: paneY }}
                className="flex-shrink-0 w-full lg:w-[420px] xl:w-[480px] flex justify-center"
              >
                <GlassPane />
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Trust Strip ─── */}
      <section className="py-24 px-6 border-t border-b border-white/[0.04]">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-12">
            <StatBlock value="1,318" label="Qualifications Loaded" />
            <StatBlock value="3" label="Exam Boards" />
            <StatBlock value="2026" label="Specifications" />
            <StatBlock value="0" label="Answers Given" />
          </div>
        </div>
      </section>

      {/* ─── Problem / Solution ─── */}
      <section id="features" className="py-24 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal className="text-center mb-12 md:mb-24">
            <p className="text-sm font-semibold tracking-widest uppercase text-[#0071e3] mb-4">The Problem</p>
            <h2 className="text-2xl sm:text-5xl md:text-7xl font-bold text-white tracking-tighter mb-6">
              AI broke homework.
            </h2>
            <p className="hidden sm:block text-xl text-[#a1a1a6] max-w-2xl mx-auto font-medium">
              Students copy. Teachers can&apos;t tell. Exam results collapse. Newton fixes the loop.
            </p>
          </ScrollReveal>

          <div className="grid lg:grid-cols-2 gap-6 max-w-[400px] mx-auto lg:max-w-none">
            {/* The Problem */}
            <ScrollReveal>
              <div
                className="h-full rounded-2xl p-6 md:p-10 bg-white/5 border border-white/10 hover:border-white/25 transition-colors duration-200"
              >
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mb-5 md:mb-8">
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-5 md:mb-8 tracking-tight">Traditional AI</h3>
                <ul className="space-y-3 md:space-y-5">
                  {[
                    'Writes complete essays on demand',
                    'Solves every problem directly',
                    'Zero learning happens',
                    'Students fail exams without it',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </span>
                      <span className="text-[#a1a1a6] font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>

            {/* The Fix */}
            <ScrollReveal delay={0.1}>
              <div
                className="h-full rounded-2xl p-6 md:p-10 bg-white/5 border border-[#0071e3]/20 hover:border-[#0071e3]/40 transition-colors duration-200"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#0071e3]/10 flex items-center justify-center mb-5 md:mb-8">
                  <svg className="w-6 h-6 text-[#0071e3]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-5 md:mb-8 tracking-tight">Newton</h3>
                <ul className="space-y-3 md:space-y-5">
                  {[
                    'Refuses to solve your homework',
                    'Asks questions that guide your thinking',
                    'You discover the answer yourself',
                    'You ace the exam without AI',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-[#0071e3]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-3 h-3 text-[#0071e3]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      <span className="text-[#a1a1a6] font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ─── Exam Board Scroll Stack ─── */}
      <ExamBoardScroll />

      {/* ─── Specification Deep Dive ─── */}
      <section className="py-24 px-6 lg:px-12 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal className="text-center mb-10 md:mb-20">
            <p className="text-sm font-semibold tracking-widest uppercase text-[#0071e3] mb-4">
              Not generic. Specific.
            </p>
            <h2 className="text-2xl sm:text-5xl md:text-7xl font-bold text-white tracking-tighter mb-6">
              Your exact syllabus.<br />Built in.
            </h2>
            <p className="hidden sm:block text-xl text-[#a1a1a6] max-w-2xl mx-auto font-medium leading-relaxed">
              We&apos;ve loaded every GCSE and A-Level specification from all three major UK exam boards.
              Newton doesn&apos;t guess what&apos;s on your course — it knows.
            </p>
          </ScrollReveal>

          <ScrollCarousel count={3} className="flex sm:grid sm:grid-cols-3 gap-4 mb-16 overflow-x-auto hide-scrollbar snap-x snap-mandatory sm:overflow-visible -mx-6 px-6 sm:mx-0 sm:px-0">
            {[
              {
                board: 'AQA',
                full: 'Assessment and Qualifications Alliance',
                detail: 'Full GCSE and A-Level specs loaded — Maths 8300 to English Lit 8702.',
              },
              {
                board: 'Pearson Edexcel',
                full: 'Pearson Education',
                detail: 'International and domestic qualifications. Every spec indexed and searchable.',
              },
              {
                board: 'OCR',
                full: 'Oxford, Cambridge and RSA',
                detail: 'OCR A, OCR B, and MEI variants. Every assessment objective mapped.',
              },
            ].map((b) => (
              <ScrollReveal key={b.board} className="min-w-[260px] sm:min-w-0 snap-start shrink-0 sm:shrink">
                <div
                  className="rounded-2xl p-6 sm:p-8 h-full flex flex-col bg-white/5 border border-white/10 hover:border-white/25 transition-colors duration-200"
                >
                  <h3 className="text-2xl font-bold text-white tracking-tight mb-1">{b.board}</h3>
                  <p className="text-sm text-[#a1a1a6] mb-3">{b.full}</p>
                  <p className="text-sm text-[#a1a1a6] leading-relaxed flex-1 line-clamp-2 sm:line-clamp-none">{b.detail}</p>
                  <div className="mt-4 sm:mt-6 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-xs text-emerald-400 font-semibold">2026 specs loaded</span>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </ScrollCarousel>

          <ScrollReveal className="text-center">
            <div
              className="inline-flex items-center gap-3 rounded-2xl px-6 py-4 bg-white/5 border border-white/10"
            >
              <span className="text-4xl font-bold text-white tracking-tighter">1,318</span>
              <span className="text-sm text-[#a1a1a6] text-left leading-tight">
                qualifications indexed<br />and ready to ground
              </span>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how-it-works" className="py-24 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal className="text-center mb-12 md:mb-24">
            <p className="text-sm font-semibold tracking-widest uppercase text-[#0071e3] mb-4">Method</p>
            <h2 className="text-2xl sm:text-5xl md:text-7xl font-bold text-white tracking-tighter">
              Four steps. Real learning.
            </h2>
          </ScrollReveal>

          {/* Mobile: horizontal scroll cards */}
          <ScrollCarousel count={4} className="flex sm:hidden gap-4 overflow-x-auto hide-scrollbar snap-x snap-mandatory -mx-6 px-6">
            {[
              {
                step: '1',
                title: 'You ask your question.',
                avatar: 'student',
                text: '\u201cI don\u2019t understand how to factorise quadratics. Can you help?\u201d',
              },
              {
                step: '2',
                title: 'Newton asks, not tells.',
                avatar: 'newton',
                text: '\u201cCan you think of two numbers that multiply to give 6 and add to give 5?\u201d',
              },
              {
                step: '3',
                title: 'You discover the answer.',
                avatar: 'student',
                text: '\u201c2 and 3! So it\u2019s (x+2)(x+3) = 0, meaning x = \u22122 or x = \u22123!\u201d',
              },
              {
                step: '4',
                title: 'You remember it.',
                avatar: 'result',
                text: null,
              },
            ].map((s) => (
              <div key={s.step} className="min-w-[280px] snap-start shrink-0 rounded-2xl p-6 bg-white/[0.03] border border-white/[0.06]">
                <p className="text-sm font-semibold tracking-widest uppercase text-[#0071e3] mb-2">Step {s.step}</p>
                <h3 className="text-lg font-bold text-white tracking-tight mb-4">{s.title}</h3>
                {s.avatar === 'result' ? (
                  <div className="rounded-xl p-5 text-center bg-[#0071e3]/10 border border-[#0071e3]/15">
                    <div className="text-3xl font-bold text-white tracking-tighter mb-1">A*</div>
                    <p className="text-xs text-[#a1a1a6] font-medium">Earned, not copied</p>
                  </div>
                ) : (
                  <div className={`flex gap-3 ${s.avatar === 'student' ? 'justify-end' : ''}`}>
                    {s.avatar === 'newton' && (
                      <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[9px] font-bold text-black">N</span>
                      </div>
                    )}
                    <p className={`text-sm leading-relaxed ${s.avatar === 'newton' ? 'text-neutral-200' : 'text-white/80'}`}>{s.text}</p>
                    {s.avatar === 'student' && (
                      <div className="w-7 h-7 rounded-xl bg-white/[0.08] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[9px] font-semibold text-white/60">You</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </ScrollCarousel>

          {/* Desktop: full FeatureRow layout */}
          <div className="hidden sm:block space-y-32">
            <ScrollReveal>
              <FeatureRow
                label="Step 1"
                title="You ask your question."
                description="Type what you're stuck on. A maths problem, an essay topic, a chemistry concept. Newton listens."
              >
                <div className="w-full max-w-sm rounded-2xl p-6 bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex gap-3 justify-end">
                    <p className="text-white/80 text-[15px] leading-relaxed">
                      &ldquo;I don&apos;t understand how to factorise quadratics. Can you help?&rdquo;
                    </p>
                    <div className="w-8 h-8 rounded-xl bg-white/[0.08] flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-semibold text-white/60">You</span>
                    </div>
                  </div>
                </div>
              </FeatureRow>
            </ScrollReveal>

            <ScrollReveal>
              <FeatureRow
                label="Step 2"
                title="Newton asks, not tells."
                description="Instead of an answer, you get a question. One that makes you think about what you already know."
                reverse
              >
                <div className="w-full max-w-sm rounded-2xl p-6 bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold text-black">N</span>
                    </div>
                    <p className="text-neutral-200 text-[15px] leading-relaxed">
                      &ldquo;Can you think of two numbers that multiply to give 6 and add to give 5?&rdquo;
                    </p>
                  </div>
                </div>
              </FeatureRow>
            </ScrollReveal>

            <ScrollReveal>
              <FeatureRow
                label="Step 3"
                title="You discover the answer."
                description="Through guided reasoning, you find it yourself. The understanding is yours, not the machine's."
              >
                <div className="w-full max-w-sm rounded-2xl p-6 bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex gap-3 justify-end">
                    <p className="text-white/80 text-[15px] leading-relaxed">
                      &ldquo;2 and 3! So it&apos;s (x+2)(x+3) = 0, meaning x = -2 or x = -3!&rdquo;
                    </p>
                    <div className="w-8 h-8 rounded-xl bg-white/[0.08] flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-semibold text-white/60">You</span>
                    </div>
                  </div>
                </div>
              </FeatureRow>
            </ScrollReveal>

            <ScrollReveal>
              <FeatureRow
                label="Step 4"
                title="You remember it."
                description="Active learning sticks. When the exam comes, you don't need AI. You know the method."
                reverse
              >
                <div className="w-full max-w-sm flex flex-col items-center gap-4">
                  <div className="w-full rounded-2xl p-6 text-center bg-[#0071e3]/10 border border-[#0071e3]/15">
                    <div className="text-4xl font-bold text-white tracking-tighter mb-2">A*</div>
                    <p className="text-sm text-[#a1a1a6] font-medium">Exam result — earned, not copied</p>
                  </div>
                </div>
              </FeatureRow>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ─── Subjects ─── */}
      <section id="subjects" className="py-24 px-6 lg:px-12 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal className="text-center mb-10 md:mb-20">
            <p className="text-sm font-semibold tracking-widest uppercase text-[#0071e3] mb-4">Coverage</p>
            <h2 className="text-2xl sm:text-5xl md:text-7xl font-bold text-white tracking-tighter mb-6">
              Every subject. Every level.
            </h2>
            <p className="hidden sm:block text-xl text-[#a1a1a6] max-w-2xl mx-auto font-medium">
              Year 7 to Year 13. GCSEs to A Levels. Newton adapts.
            </p>
          </ScrollReveal>

          <ScrollCarousel count={3} className="flex sm:grid sm:grid-cols-3 gap-4 overflow-x-auto hide-scrollbar snap-x snap-mandatory sm:overflow-visible -mx-6 px-6 sm:mx-0 sm:px-0">
            {[
              {
                name: 'STEM',
                subjects: 'Maths, Physics, Chemistry, Biology, Computer Science',
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                ),
              },
              {
                name: 'Humanities',
                subjects: 'History, Geography, Religious Studies, Philosophy, Economics',
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                ),
              },
              {
                name: 'Languages & Arts',
                subjects: 'English, French, Spanish, German, Art, Music',
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                ),
              },
            ].map((cat) => (
              <ScrollReveal key={cat.name} className="min-w-[280px] sm:min-w-0 snap-start shrink-0 sm:shrink">
                <div
                  className="rounded-2xl p-8 h-full bg-white/5 border border-white/10 hover:border-white/25 transition-colors duration-200"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center mb-6">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {cat.icon}
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{cat.name}</h3>
                  <p className="text-[#a1a1a6] text-sm leading-relaxed">{cat.subjects}</p>
                </div>
              </ScrollReveal>
            ))}
          </ScrollCarousel>
        </div>
      </section>

      {/* ─── Institutional Intelligence (B2B) ─── */}
      <section id="institutions" className="py-24 px-6 lg:px-12 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal className="text-center mb-10 md:mb-20">
            <p className="text-sm font-semibold tracking-widest uppercase text-[#0071e3] mb-4">For Schools</p>
            <h2 className="text-2xl sm:text-5xl md:text-7xl font-bold text-white tracking-tighter mb-6">
              Institutional Intelligence.
            </h2>
            <p className="hidden sm:block text-xl text-[#a1a1a6] max-w-2xl mx-auto font-medium">
              Real-time mastery tracking, academic integrity, and spaced retention — built for departments, not just individuals.
            </p>
          </ScrollReveal>

          {/* ── Teacher Dashboard Preview (Heatmap) ── */}
          <ScrollReveal className="mb-8 md:mb-12">
            <LiveHeatmap />
          </ScrollReveal>

          {/* ── Bento Grid ── */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Integrity & Honesty */}
            <ScrollReveal>
              <div className="h-full rounded-2xl p-6 md:p-8 bg-white/[0.03] border border-white/10 hover:border-white/20 transition-colors duration-200">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center mb-6">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 tracking-tight">Zero-Trust Academic Integrity.</h3>
                <p className="text-sm text-[#a1a1a6] mb-6 leading-relaxed">Every session is monitored. Every result is earned.</p>
                <ul className="space-y-3">
                  {[
                    { title: 'Tab-Switch Detection', desc: 'Alerts teachers when students leave the exam environment.' },
                    { title: 'Dynamic Variable STEM', desc: 'Every student gets different numbers for the same problem.' },
                    { title: 'AI-Paste Blocking', desc: 'Prevents external LLM answers from being injected.' },
                  ].map(item => (
                    <li key={item.title} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-white">{item.title}</p>
                        <p className="text-xs text-white/40 mt-0.5">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>

            {/* Scientific Retention */}
            <ScrollReveal delay={0.08}>
              <div className="h-full rounded-2xl p-6 md:p-8 bg-white/[0.03] border border-white/10 hover:border-white/20 transition-colors duration-200">
                <div className="w-10 h-10 rounded-xl bg-[#0071e3]/10 flex items-center justify-center mb-6">
                  <svg className="w-5 h-5 text-[#0071e3]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 tracking-tight">Beyond Short-Term Memory.</h3>
                <p className="text-sm text-[#a1a1a6] mb-5 leading-relaxed">
                  Spaced repetition engine with automatic mastery decay tracking ensures students are ready for June, not just today.
                </p>
                <ForgettingCurve />
                <div className="mt-5 pt-5 border-t border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1">
                      <div className="w-5 h-5 rounded-full bg-emerald-400/20 border border-emerald-400/30" />
                      <div className="w-5 h-5 rounded-full bg-amber-400/20 border border-amber-400/30" />
                      <div className="w-5 h-5 rounded-full bg-red-500/20 border border-red-500/30" />
                    </div>
                    <p className="text-xs text-white/30">Red → Amber → Green mastery lifecycle</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Teacher Workload */}
            <ScrollReveal delay={0.16}>
              <div className="h-full rounded-2xl p-6 md:p-8 bg-white/[0.03] border border-white/10 hover:border-white/20 transition-colors duration-200 md:col-span-2 lg:col-span-1">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 tracking-tight">Less Marking. More Teaching.</h3>
                <p className="text-sm text-[#a1a1a6] mb-6 leading-relaxed">
                  Newton handles topic analysis, gap identification, and progress tracking automatically — freeing teachers to focus on the students who need them most.
                </p>

                {/* Feature highlights */}
                <div className="space-y-4">
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                    <p className="text-sm font-semibold text-white">Automatic Gap Analysis</p>
                    <p className="text-xs text-white/40 mt-1">See which topics each student is struggling with — without reading every chat</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                    <p className="text-sm font-semibold text-white">Progress Dashboards</p>
                    <p className="text-xs text-white/40 mt-1">Class-wide and per-student mastery views, ready for department reviews</p>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-white/[0.06]">
                  <ul className="space-y-2">
                    {['Automated marking', 'Instant gap analysis', 'One-click reports'].map(item => (
                      <li key={item} className="flex items-center gap-2">
                        <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-xs text-white/50 font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ─── Work-Refusal Comparison ─── */}
      <section className="py-24 px-6 lg:px-12 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal className="text-center mb-10 md:mb-20">
            <p className="text-sm font-semibold tracking-widest uppercase text-[#0071e3] mb-4">Academic Integrity</p>
            <h2 className="text-2xl sm:text-5xl md:text-7xl font-bold text-white tracking-tighter mb-6">
              Structurally Incapable<br className="hidden sm:block" /> of Cheating.
            </h2>
            <p className="hidden sm:block text-xl text-[#a1a1a6] max-w-2xl mx-auto font-medium">
              Newton doesn&apos;t just discourage copying — it architecturally cannot produce a copyable answer.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Left: Standard LLM */}
            <ScrollReveal>
              <div className="h-full rounded-2xl p-6 md:p-8 bg-white/[0.03] border border-red-500/15 hover:border-red-500/25 transition-colors duration-200 relative overflow-hidden">
                {/* Subtle red glow */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-500/[0.04] rounded-full blur-3xl pointer-events-none" />

                <div className="flex items-center justify-between mb-6 relative">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center">
                      <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-sm font-semibold text-white">Standard AI</span>
                  </div>
                  <span className="flex items-center gap-1.5 text-[10px] font-medium text-red-400 tracking-wider bg-red-500/10 px-2.5 py-1 rounded-full">
                    BYPASSES LEARNING
                  </span>
                </div>

                {/* Fake chat bubble */}
                <div className="relative rounded-xl bg-white/[0.03] border border-white/[0.06] p-5 mb-5">
                  <p className="text-[13px] text-white/40 leading-relaxed">
                    Mitosis is the process of cell division where a single cell divides to produce two genetically identical daughter cells. It occurs in several stages: Prophase, where chromosomes condense and become visible; Metaphase, where chromosomes align at the cell&apos;s equator; Anaphase, where sister chromatids are pulled apart to opposite poles; and Telophase, where nuclear envelopes reform around each set of chromosomes.
                  </p>
                  {/* Strikethrough overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-[85%] h-[1px] bg-red-500/30 rotate-[-4deg]" />
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-xs text-red-400/60">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  <span>Student can copy-paste this entire answer as homework</span>
                </div>
              </div>
            </ScrollReveal>

            {/* Right: Newton */}
            <ScrollReveal delay={0.08}>
              <div className="h-full rounded-2xl p-6 md:p-8 bg-white/[0.03] border border-emerald-500/15 hover:border-emerald-500/25 transition-colors duration-200 relative overflow-hidden">
                {/* Subtle emerald glow */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/[0.04] rounded-full blur-3xl pointer-events-none" />

                <div className="flex items-center justify-between mb-6 relative">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#0071e3] flex items-center justify-center">
                      <span className="text-xs font-bold text-white">N</span>
                    </div>
                    <span className="text-sm font-semibold text-white">Newton</span>
                  </div>
                  <span className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-400 tracking-wider bg-emerald-500/10 px-2.5 py-1 rounded-full">
                    FORCES THINKING
                  </span>
                </div>

                {/* Newton chat bubble */}
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5 mb-4">
                  <p className="text-[13px] text-white/70 leading-relaxed mb-3">Great question! Let&apos;s work through this step by step.</p>
                  <div className="space-y-2.5">
                    {[
                      'What must happen to DNA before division?',
                      'Name the phase where chromosomes line up.',
                      'What pulls the chromatids apart?',
                    ].map((q, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-md bg-[#0071e3]/15 text-[#0071e3] text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                        <p className="text-[13px] text-white/50 leading-relaxed">{q}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Input field */}
                <div className="flex items-center px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-5">
                  <span className="text-[13px] text-white/20">Your answer here...</span>
                  <div className="ml-auto w-1.5 h-4 bg-[#0071e3] rounded-full animate-pulse" />
                </div>

                <div className="flex items-center gap-2.5 text-xs text-emerald-400/60">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                  <span>Nothing to copy — student must think</span>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Integrity stats */}
          <ScrollReveal delay={0.16}>
            <div className="mt-8 md:mt-12 grid grid-cols-3 gap-4">
              {[
                { value: '0', label: 'Copyable answers produced', icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' },
                { value: '100%', label: 'Socratic response rate', icon: 'M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342' },
                { value: '3-layer', label: 'Integrity verification', icon: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-colors duration-200 p-5 md:p-6 text-center">
                  <div className="w-8 h-8 rounded-xl bg-[#0071e3]/10 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-4 h-4 text-[#0071e3]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
                    </svg>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-white tracking-tight">{stat.value}</p>
                  <p className="text-xs text-[#a1a1a6] mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── Competitive Edge ─── */}
      <section className="py-24 px-6 lg:px-12 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal className="text-center mb-10 md:mb-20">
            <p className="text-sm font-semibold tracking-widest uppercase text-[#0071e3] mb-4">Competitive Edge</p>
            <h2 className="text-2xl sm:text-5xl md:text-7xl font-bold text-white tracking-tighter mb-6">
              Active Learning Beats<br className="hidden sm:block" /> Passive Copying.
            </h2>
            <p className="hidden sm:block text-xl text-[#a1a1a6] max-w-2xl mx-auto font-medium leading-relaxed">
              Decades of research show that Socratic questioning and retrieval practice produce deeper understanding than reading answers. Newton applies this at scale — every student, every subject, every lesson.
            </p>
          </ScrollReveal>

          {/* Why it works — research-backed principles */}
          <ScrollReveal>
            <div className="grid md:grid-cols-3 gap-4 md:gap-6 mb-10 md:mb-16">
              {[
                {
                  title: 'Retrieval Practice',
                  desc: 'Students who actively recall information retain it far longer than those who passively re-read. Newton never gives the answer — it forces recall.',
                  icon: 'M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342',
                },
                {
                  title: 'Socratic Questioning',
                  desc: 'Guided questions build understanding from the student\'s own reasoning, not from memorising someone else\'s explanation.',
                  icon: 'M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z',
                },
                {
                  title: 'Spaced Repetition',
                  desc: 'Newton tracks what each student has learned and resurfaces it at optimal intervals — building long-term retention before exams.',
                  icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
                },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl p-6 md:p-8 bg-white/[0.03] border border-white/10 hover:border-white/20 transition-colors duration-200">
                  <div className="w-10 h-10 rounded-xl bg-[#0071e3]/10 flex items-center justify-center mb-6">
                    <svg className="w-5 h-5 text-[#0071e3]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 tracking-tight">{item.title}</h3>
                  <p className="text-sm text-[#a1a1a6] leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>

          {/* Grade curve — clearly labelled as illustrative */}
          <ScrollReveal className="max-w-3xl mx-auto mb-10 md:mb-16">
            <div className="rounded-2xl border border-white/10 p-6 md:p-8" style={{ background: '#060607' }}>
              <GradeCurveDemo />
            </div>
          </ScrollReveal>

          {/* Institutional Value Prop */}
          <ScrollReveal delay={0.1}>
            <div className="rounded-2xl p-6 md:p-10 bg-white/[0.03] border border-[#0071e3]/15 hover:border-[#0071e3]/30 transition-colors duration-200">
              <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-12">
                <div className="flex-1">
                  <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-3">
                    The school that makes students think will outperform the school that lets them copy.
                  </h3>
                  <p className="text-sm text-[#a1a1a6] leading-relaxed">
                    When every student has a personal tutor grounded in the exact syllabus they&apos;re examined on — one that refuses to do the work for them — real understanding follows. That&apos;s what drives Progress 8 scores, league table positions, and a reputation parents trust.
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <Link
                    href="/signup"
                    className="inline-block px-8 py-3.5 bg-[#0071e3] text-white text-sm font-semibold rounded-full hover:bg-[#0077ed] transition-colors duration-200"
                  >
                    Deploy Newton
                  </Link>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── Data Security & Privacy ─── */}
      <section id="privacy" className="py-24 px-6 lg:px-12 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal className="text-center mb-10 md:mb-20">
            <p className="text-sm font-semibold tracking-widest uppercase text-[#0071e3] mb-4">Trust</p>
            <h2 className="text-2xl sm:text-5xl md:text-7xl font-bold text-white tracking-tighter mb-6">
              Built for Institutional Trust.
            </h2>
            <p className="hidden sm:block text-xl text-[#a1a1a6] max-w-2xl mx-auto font-medium">
              Enterprise-grade data protection designed for schools, not startups.
            </p>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-4 md:gap-6">
            <ScrollReveal>
              <div className="h-full rounded-2xl p-6 md:p-8 bg-white/[0.03] border border-white/10 hover:border-white/20 transition-colors duration-200">
                <div className="w-10 h-10 rounded-xl bg-[#0071e3]/10 flex items-center justify-center mb-6">
                  <svg className="w-5 h-5 text-[#0071e3]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 tracking-tight">GDPR Compliant</h3>
                <p className="text-sm text-[#a1a1a6] leading-relaxed">
                  Full compliance with UK GDPR and the Data Protection Act 2018. Student data is processed under legitimate educational interest with full transparency.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.08}>
              <div className="h-full rounded-2xl p-6 md:p-8 bg-white/[0.03] border border-white/10 hover:border-white/20 transition-colors duration-200">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 tracking-tight">COPPA Ready</h3>
                <p className="text-sm text-[#a1a1a6] leading-relaxed">
                  Under-13 protections built in. Parental consent flows integrated. No advertising. No data selling. No third-party tracking. Ever.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.16}>
              <div className="h-full rounded-2xl p-6 md:p-8 bg-white/[0.03] border border-white/10 hover:border-white/20 transition-colors duration-200">
                <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center mb-6">
                  <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 17.25v-.228a4.5 4.5 0 00-.12-1.03l-2.268-9.64a3.375 3.375 0 00-3.285-2.602H7.923a3.375 3.375 0 00-3.285 2.602l-2.268 9.64a4.5 4.5 0 00-.12 1.03v.228m19.5 0a3 3 0 01-3 3H5.25a3 3 0 01-3-3m19.5 0a3 3 0 00-3-3H5.25a3 3 0 00-3 3m16.5 0h.008v.008h-.008v-.008zm-3 0h.008v.008h-.008v-.008z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 tracking-tight">Data Sovereignty</h3>
                <p className="text-sm text-[#a1a1a6] leading-relaxed">
                  All data stored in the EU (Frankfurt). Schools retain full ownership. Export or delete everything at any time. Your data, your rules.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="py-24 px-6 lg:px-12 border-t border-white/[0.04]">
        <div className="max-w-3xl mx-auto">
          <ScrollReveal className="text-center mb-8 md:mb-16">
            <h2 className="text-2xl sm:text-5xl md:text-7xl font-bold text-white tracking-tighter mb-6">FAQ</h2>
          </ScrollReveal>

          <div className="space-y-2">
            {[
              { q: 'Will Newton do my homework?', a: 'No. Newton detects and refuses homework requests. It guides you to understand concepts through Socratic questioning.' },
              { q: 'What subjects are covered?', a: 'All major GCSE and A-Level subjects including Maths, Sciences, English, History, Geography, Languages, and more.' },
              { q: 'Which exam boards?', a: 'AQA, Edexcel (Pearson), and OCR. Newton is grounded in official 2026 specifications.' },
              { q: 'Do I need an account?', a: 'Yes, a free account lets you save your chat history, track your progress, and join your teacher\'s classes. It takes seconds to set up.' },
              { q: 'How is this different from ChatGPT?', a: 'ChatGPT gives generic answers from the open internet. Newton is grounded in the actual AQA, Pearson Edexcel, and OCR specifications your exams are based on — and it refuses to do your work for you. Every response is tailored to your exact syllabus, not a best guess.' },
              { q: 'What year groups?', a: 'Year 7 through Year 13. Newton adapts language and complexity to match your level.' },
              { q: 'How is student data protected?', a: 'Newton is fully GDPR and COPPA compliant. All student data is stored in EU data centres (Frankfurt), encrypted at rest and in transit. Schools retain full ownership of their data and can export or delete it at any time. We never sell data, serve ads, or share information with third parties.' },
            ].map((faq, i) => (
              <ScrollReveal key={i} delay={i * 0.03}>
                <div
                  className="rounded-2xl overflow-hidden border border-white/10 hover:border-white/25 transition-colors duration-200"
                >
                  <button
                    onClick={() => setActiveAccordion(activeAccordion === i ? null : i)}
                    className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-white/[0.02] transition-colors duration-200"
                  >
                    <span className="text-base font-semibold text-white pr-4">{faq.q}</span>
                    <motion.svg
                      animate={{ rotate: activeAccordion === i ? 45 : 0 }}
                      transition={{ ...spring }}
                      className="w-4 h-4 text-[#a1a1a6] flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </motion.svg>
                  </button>
                  <AnimatePresence>
                    {activeAccordion === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-5 text-[#a1a1a6] text-sm leading-relaxed">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="py-24 px-6 lg:px-12">
        <ScrollReveal className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-5xl md:text-7xl lg:text-8xl font-bold text-white tracking-tighter leading-[0.92] mb-8">
            Official Specs.<br />Real Learning.
          </h2>
          <p className="hidden sm:block text-xl text-[#a1a1a6] mb-8 md:mb-12 max-w-xl mx-auto font-medium leading-relaxed">
            Stop copying. Start understanding. Deploy Newton across your institution today.
          </p>
          <Link
            href="/signup"
            className="block sm:inline-block w-full sm:w-auto text-center px-10 py-4 bg-[#0071e3] text-white text-lg font-semibold rounded-full hover:bg-[#0077ed] transition-colors duration-200"
          >
            Start Learning Free
          </Link>
        </ScrollReveal>
      </section>

      {/* ─── Footer ─── */}
      <footer className="py-10 px-6 sm:px-8 lg:px-12 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-white flex items-center justify-center">
                <span className="text-xs font-bold text-black">N</span>
              </div>
              <span className="text-sm font-semibold text-white">Newton</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              {['Features', 'How It Works', 'Subjects', 'Privacy', 'FAQ'].map((label) => (
                <a
                  key={label}
                  href={`#${label.toLowerCase().replace(/\s+/g, '-')}`}
                  className="text-sm text-[#a1a1a6] hover:text-white transition-colors duration-200"
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-white/[0.04] text-center">
            <p className="text-sm text-[#a1a1a6]">&copy; 2026 Newton. Built with academic integrity at its core.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
