'use client';

import { useInView } from '../../lib/useInView';

const STEPS = [
  {
    number: '01',
    title: 'Student asks',
    desc: 'A student types a question — a homework problem, a concept they\'re stuck on, or an essay they don\'t know how to start.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'Newton questions back',
    desc: 'Instead of answering, Newton responds with a targeted Socratic question designed to activate what the student already knows.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
      </svg>
    ),
  },
  {
    number: '03',
    title: 'Student discovers',
    desc: 'Through guided dialogue, the student arrives at the answer themselves. The cognitive work stays with the learner.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35M8 11h6M11 8v6" />
      </svg>
    ),
  },
  {
    number: '04',
    title: 'Knowledge sticks',
    desc: 'Understanding built through discovery is retained far better than answers provided. Students remember what they worked for.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
];

export default function HowItWorksSection() {
  const [ref, inView] = useInView({ threshold: 0.1 });

  return (
    <section id="how-it-works" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-20">
          <p className="text-xs text-brand uppercase tracking-[0.2em] font-medium mb-4">The method</p>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tighter text-[var(--c-text)] mb-4">
            How Newton teaches.
          </h2>
          <p className="text-lg text-[var(--c-text-soft)] max-w-lg mx-auto font-light">
            A four-step cycle that Socrates used 2,400 years ago. Newton makes it infinitely scalable.
          </p>
        </div>

        {/* Steps */}
        <div ref={ref} className="relative">
          {/* Connecting line (desktop) */}
          <div className="hidden lg:block absolute top-12 left-[12.5%] right-[12.5%] h-px"
               style={{
                 background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.3) 20%, rgba(245,158,11,0.3) 80%, transparent)',
                 opacity: inView ? 1 : 0,
                 transition: 'opacity 1s ease 0.5s',
               }} />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map((step, i) => (
              <div
                key={i}
                className="flex flex-col items-center text-center gap-4"
                style={{
                  opacity: inView ? 1 : 0,
                  transform: inView ? 'translateY(0)' : 'translateY(40px)',
                  transition: `opacity 0.6s ease, transform 0.6s ease`,
                  transitionDelay: `${i * 150}ms`,
                }}
              >
                {/* Number + icon circle */}
                <div className="relative">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center border"
                    style={{
                      background: 'var(--c-card)',
                      borderColor: inView ? 'rgba(245,158,11,0.35)' : 'rgba(255,255,255,0.08)',
                      color: '#F59E0B',
                      boxShadow: inView ? '0 0 24px rgba(245,158,11,0.12)' : 'none',
                      transition: 'all 0.6s ease',
                      transitionDelay: `${i * 150 + 200}ms`,
                    }}
                  >
                    {step.icon}
                  </div>
                  <span
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{ background: '#F59E0B', color: 'var(--c-brand-text)' }}
                  >
                    {i + 1}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-[var(--c-text)]">{step.title}</h3>
                <p className="text-sm text-[var(--c-text-soft)] leading-relaxed max-w-[220px]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
