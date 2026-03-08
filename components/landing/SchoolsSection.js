'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useInView } from '../../lib/useInView';
import ChatDemo from './ChatDemo';
import TeacherDashboardPreview from './TeacherDashboardPreview';
import StudentDashboardPreview from './StudentDashboardPreview';

const BENEFITS = [
  {
    icon: '🛡️',
    title: 'Zero academic dishonesty risk',
    desc: 'Newton cannot write essays or solve problems. Integrity is hard-coded.',
  },
  {
    icon: '📊',
    title: 'Class-level analytics',
    desc: 'See which topics your entire class struggles with — not just individual students.',
  },
  {
    icon: '⚡',
    title: 'Instant deployment',
    desc: 'Share a link. Students are learning within minutes. No accounts, no setup.',
  },
  {
    icon: '🇬🇧',
    title: 'UK curriculum aligned',
    desc: 'AQA, OCR, and Pearson Edexcel. Every spec, every topic, every year group.',
  },
  {
    icon: '🔒',
    title: 'GDPR by design',
    desc: 'No personal data collected. No student accounts. Compliant without effort.',
  },
  {
    icon: '📞',
    title: 'Dedicated school support',
    desc: 'Every school gets a dedicated contact for the pilot and beyond.',
  },
];

const spring = { type: 'spring', stiffness: 80, damping: 20 };

export default function SchoolsSection() {
  const [ref, inView] = useInView({ threshold: 0.08 });

  return (
    <section id="schools" className="py-24 px-6">
      <div className="max-w-7xl mx-auto space-y-32">

        {/* ── Student view ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={spring}
          >
            <p className="text-xs text-brand uppercase tracking-[0.2em] font-medium mb-4">For students</p>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tighter text-[var(--c-text)] mb-6">
              Learning that actually sticks.
            </h2>
            <p className="text-lg text-[var(--c-text-soft)] font-light leading-relaxed mb-8">
              Newton never gives away answers. It asks the question that unlocks understanding.
              Students who use Newton don't just pass exams — they understand the material.
            </p>
            <div className="space-y-3">
              {['Guided by questions, not answers', 'Adapts to every year group automatically', 'Works across all GCSE and A-Level subjects'].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                       style={{ background: 'rgba(245,158,11,0.15)' }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <span className="text-sm text-[var(--c-text-soft)]">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={spring}
            style={{ animation: 'float 6s ease-in-out infinite' }}
          >
            <ChatDemo />
          </motion.div>
        </div>

        {/* ── Teacher view ── */}
        <div ref={ref} className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={spring}
            className="order-2 lg:order-1"
            style={{ animation: 'float 7s ease-in-out 1s infinite' }}
          >
            <TeacherDashboardPreview />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={spring}
            className="order-1 lg:order-2"
          >
            <p className="text-xs text-brand uppercase tracking-[0.2em] font-medium mb-4">For teachers</p>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tighter text-[var(--c-text)] mb-6">
              Real data. Real insights.
            </h2>
            <p className="text-lg text-[var(--c-text-soft)] font-light leading-relaxed mb-8">
              See which topics your class is struggling with before the exam.
              Identify students who need support — automatically.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {BENEFITS.map((b, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl border border-[var(--c-border)]"
                  style={{
                    background: 'var(--c-card)',
                    opacity: inView ? 1 : 0,
                    transform: inView ? 'none' : 'translateY(16px)',
                    transition: `all 0.5s ease ${i * 80}ms`,
                  }}
                >
                  <div className="text-xl mb-2">{b.icon}</div>
                  <p className="text-sm font-medium text-[var(--c-text)] mb-1">{b.title}</p>
                  <p className="text-xs text-[var(--c-text-muted)] leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── Pilot CTA ── */}
        <div className="text-center">
          <div className="inline-block p-px rounded-3xl"
               style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.4), rgba(245,158,11,0.1), rgba(245,158,11,0.4))' }}>
            <div className="px-12 py-12 rounded-3xl text-center"
                 style={{ background: 'var(--c-card)' }}>
              <p className="text-xs text-brand uppercase tracking-[0.2em] font-medium mb-4">Pilot programme</p>
              <h3 className="text-3xl md:text-4xl font-semibold tracking-tighter text-[var(--c-text)] mb-4">
                Run a free 2-week pilot.
              </h3>
              <p className="text-[var(--c-text-soft)] max-w-md mx-auto mb-8 font-light">
                Share a link. Your students start learning immediately.
                We provide full support, analytics, and an evaluation report — completely free.
              </p>
              <a
                href="mailto:eliot@newton-ai.co.uk"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-medium bg-brand text-[var(--c-brand-text)] hover:bg-brand-hover transition-colors shadow-sm"
              >
                Request a pilot
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
