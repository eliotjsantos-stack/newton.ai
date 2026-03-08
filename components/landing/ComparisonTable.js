'use client';

import { useInView } from '../../lib/useInView';

const ROWS = [
  { feature: 'Writes essays for students',         standard: { val: '✓', good: false }, newton: { val: '✗', good: true, note: 'by design' } },
  { feature: 'Solves homework problems',           standard: { val: '✓', good: false }, newton: { val: '✗', good: true, note: 'by design' } },
  { feature: 'Socratic questioning method',        standard: { val: '✗', good: false }, newton: { val: '✓', good: true  } },
  { feature: 'Academic integrity protection',      standard: { val: '✗', good: false }, newton: { val: '✓', good: true  } },
  { feature: 'UK curriculum aligned',              standard: { val: '✗', good: false }, newton: { val: '✓', good: true  } },
  { feature: 'Teacher analytics dashboard',        standard: { val: '✗', good: false }, newton: { val: '✓', good: true  } },
  { feature: 'Age-appropriate scaffolding',        standard: { val: '✗', good: false }, newton: { val: '✓', good: true  } },
  { feature: 'GDPR compliant (no student data)',   standard: { val: '⚠', good: false }, newton: { val: '✓', good: true  } },
  { feature: 'Requires student accounts',          standard: { val: '✓', good: false }, newton: { val: '✗', good: true, note: 'share a link' } },
  { feature: 'School deployment in minutes',       standard: { val: '✗', good: false }, newton: { val: '✓', good: true  } },
];

function Cell({ data, isHeader }) {
  if (isHeader) {
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="text-sm font-semibold text-[var(--c-text)]">{data.label}</span>
        {data.sub && <span className="text-xs text-[var(--c-text-muted)]">{data.sub}</span>}
      </div>
    );
  }

  const color = data.good ? 'var(--c-success)' : 'var(--c-error)';
  const bg    = data.good ? 'rgba(16,185,129,0.1)' : 'rgba(248,113,113,0.1)';

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-base font-bold" style={{ color }}>{data.val}</span>
      {data.note && (
        <span className="text-[10px] text-[var(--c-text-muted)]">{data.note}</span>
      )}
    </div>
  );
}

export default function ComparisonTable() {
  const [ref, inView] = useInView({ threshold: 0.08 });

  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-xs text-brand uppercase tracking-[0.2em] font-medium mb-4">The comparison</p>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tighter text-[var(--c-text)] mb-4">
            Newton vs Standard AI.
          </h2>
          <p className="text-lg text-[var(--c-text-soft)] max-w-lg mx-auto font-light">
            Standard AI tools were built for productivity. Newton was built for education.
            The difference is fundamental.
          </p>
        </div>

        {/* Table */}
        <div ref={ref} className="rounded-2xl border border-[var(--c-border)] overflow-hidden">
          {/* Column headers */}
          <div className="grid grid-cols-[1fr_auto_auto] gap-0 border-b border-[var(--c-border)]"
               style={{ background: 'var(--c-card)' }}>
            <div className="px-6 py-5 text-xs text-[var(--c-text-muted)] uppercase tracking-wider font-medium">
              Capability
            </div>
            <div className="w-36 px-6 py-5 flex items-center justify-center border-l border-[var(--c-border)]"
                 style={{ background: 'rgba(248,113,113,0.05)' }}>
              <Cell isHeader data={{ label: 'Standard AI', sub: 'ChatGPT, etc.' }} />
            </div>
            <div className="w-36 px-6 py-5 flex items-center justify-center border-l border-[var(--c-border)]"
                 style={{ background: 'rgba(245,158,11,0.05)' }}>
              <Cell isHeader data={{ label: 'Newton', sub: 'trynewtonai.com' }} />
            </div>
          </div>

          {/* Rows */}
          {ROWS.map((row, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_auto_auto] border-b border-[var(--c-border-subtle)] last:border-0 hover:bg-[var(--c-hover)] transition-colors"
              style={{
                opacity: inView ? 1 : 0,
                transform: inView ? 'translateY(0)' : 'translateY(12px)',
                transition: `opacity 0.4s ease, transform 0.4s ease`,
                transitionDelay: `${i * 60}ms`,
              }}
            >
              <div className="px-6 py-4 text-sm text-[var(--c-text-soft)]">{row.feature}</div>
              <div className="w-36 px-6 py-4 flex items-center justify-center border-l border-[var(--c-border-subtle)]"
                   style={{ background: 'rgba(248,113,113,0.02)' }}>
                <Cell data={row.standard} />
              </div>
              <div className="w-36 px-6 py-4 flex items-center justify-center border-l border-[var(--c-border-subtle)]"
                   style={{ background: 'rgba(245,158,11,0.02)' }}>
                <Cell data={row.newton} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
