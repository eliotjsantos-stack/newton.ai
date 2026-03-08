'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView } from '../../lib/useInView';

/* ─── Counting hook ── */
function useCounter(target, duration = 1800, inView) {
  const [count, setCount] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (!inView || started.current) return;
    started.current = true;

    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      // Ease out quart
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
      else setCount(target);
    };
    requestAnimationFrame(step);
  }, [inView, target, duration]);

  return count;
}

const STATS = [
  {
    value: 1318,
    label: 'Qualifications Loaded',
    note: 'Every GCSE & A-Level specification',
    suffix: '',
  },
  {
    value: 3,
    label: 'Exam Boards Covered',
    note: 'AQA · OCR · Pearson Edexcel',
    suffix: '',
  },
  {
    value: 0,
    label: 'Direct Answers Given',
    note: 'Zero. Every response is Socratic.',
    suffix: '',
    special: true,
  },
];

function StatCard({ stat, inView, index }) {
  const count = useCounter(stat.value, 1800 + index * 200, inView);

  return (
    <div
      className="flex flex-col gap-2 text-center p-8 rounded-2xl border border-[var(--c-border)] transition-all duration-500"
      style={{
        background: stat.special ? 'rgba(16,185,129,0.05)' : 'var(--c-card)',
        borderColor: stat.special ? 'rgba(16,185,129,0.2)' : undefined,
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(24px)',
        transitionDelay: `${index * 120}ms`,
      }}
    >
      <div
        className="text-6xl md:text-7xl font-semibold tracking-tighter tabular-nums"
        style={{ color: stat.special ? 'var(--c-success)' : 'var(--c-brand)' }}
      >
        {count.toLocaleString('en-GB')}
        {stat.suffix}
      </div>
      <div className="text-lg font-medium text-[var(--c-text)]">{stat.label}</div>
      <div className="text-sm text-[var(--c-text-muted)]">{stat.note}</div>
    </div>
  );
}

export default function StatsSection() {
  const [ref, inView] = useInView({ threshold: 0.2 });

  return (
    <section ref={ref} className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STATS.map((stat, i) => (
            <StatCard key={i} stat={stat} inView={inView} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
