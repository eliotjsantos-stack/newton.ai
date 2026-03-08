'use client';

import { useInView } from '../../lib/useInView';

const FEATURES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
      </svg>
    ),
    title: 'Socratic Method',
    desc: 'Every response is a question, not an answer. Newton guides students to discover understanding themselves.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: 'Academic Integrity',
    desc: 'Hard-coded refusal to write essays or complete assignments. Integrity is architecture, not policy.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
      </svg>
    ),
    title: '1,318 Qualifications',
    desc: 'Every GCSE and A-Level specification from AQA, OCR and Pearson Edexcel — fully indexed.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: 'Teacher Dashboard',
    desc: 'Real-time class analytics. See which topics students are struggling with before the exam.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    title: 'Age-Adaptive',
    desc: 'Automatically adjusts language, complexity and scaffolding for Years 7–13 (ages 11–18).',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
      </svg>
    ),
    title: 'Streaming Responses',
    desc: 'Responses stream in real-time for a natural, conversational feel that keeps students engaged.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 9h6M9 12h6M9 15h4" />
      </svg>
    ),
    title: 'LaTeX Mathematics',
    desc: 'Full KaTeX rendering for equations, proofs and diagrams. Maths that looks like maths.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: 'GDPR Compliant',
    desc: 'No student data stored. Anonymous usage, no accounts required for students. School-safe by default.',
  },
];

function FeatureCard({ feature, inView, index }) {
  return (
    <div
      className="p-6 rounded-2xl border border-[var(--c-border)] bg-[var(--c-card)] card-lift"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(32px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
        transitionDelay: `${index * 80}ms`,
      }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
           style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}>
        {feature.icon}
      </div>
      <h3 className="text-base font-semibold text-[var(--c-text)] mb-2">{feature.title}</h3>
      <p className="text-sm text-[var(--c-text-soft)] leading-relaxed">{feature.desc}</p>
    </div>
  );
}

export default function FeaturesSection() {
  const [ref, inView] = useInView({ threshold: 0.05 });

  return (
    <section id="features" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16"
             style={{ opacity: inView ? 1 : 0, transform: inView ? 'none' : 'translateY(16px)', transition: 'all 0.6s ease' }}>
          <p className="text-xs text-brand uppercase tracking-[0.2em] font-medium mb-4">Everything you need</p>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tighter text-[var(--c-text)] mb-4">
            Built for real learning.
          </h2>
          <p className="text-lg text-[var(--c-text-soft)] max-w-xl mx-auto font-light">
            Every feature serves one goal — students who understand, not students who copy.
          </p>
        </div>

        {/* Grid */}
        <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f, i) => (
            <FeatureCard key={i} feature={f} inView={inView} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
