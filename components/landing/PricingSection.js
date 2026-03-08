'use client';

import Link from 'next/link';

const PILOT_INCLUDES = [
  '2-week free trial — no commitment',
  'Unlimited student access',
  'Teacher training session (1 hour)',
  'Anonymous usage analytics',
  'Full evaluation report',
  'Dedicated support contact',
];

const SCHOOL_INCLUDES = [
  'Everything in the pilot',
  'Unlimited students school-wide',
  'Full teacher analytics dashboard',
  'Custom exam board configuration',
  'Priority support & updates',
  'Whole-school onboarding',
];

export default function PricingSection() {
  return (
    <section id="pricing" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs text-brand uppercase tracking-[0.2em] font-medium mb-4">Pricing</p>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tighter text-[var(--c-text)] mb-4">
            Start free. Scale confidently.
          </h2>
          <p className="text-lg text-[var(--c-text-soft)] max-w-lg mx-auto font-light">
            Every school starts with a risk-free pilot. Expand only if it works.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pilot card */}
          <div className="p-8 rounded-2xl border border-[var(--c-border)] bg-[var(--c-card)] flex flex-col">
            <div className="mb-6">
              <span className="text-xs uppercase tracking-[0.15em] font-medium text-[var(--c-text-muted)]">Pilot</span>
              <div className="mt-3 flex items-end gap-2">
                <span className="text-5xl font-semibold tracking-tighter text-[var(--c-text)]">Free</span>
                <span className="text-[var(--c-text-muted)] pb-1">/ 2 weeks</span>
              </div>
              <p className="text-sm text-[var(--c-text-soft)] mt-3">
                Prove the value before spending a penny.
                Perfect for a single class or department.
              </p>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {PILOT_INCLUDES.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-[var(--c-text-soft)]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                       stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>

            <a
              href="mailto:eliot@newton-ai.co.uk?subject=Newton%20Pilot%20Request"
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full font-medium text-sm
                         border border-[var(--c-border-strong)] text-[var(--c-text)]
                         hover:bg-[var(--c-hover)] transition-colors"
            >
              Request a pilot
            </a>
          </div>

          {/* School card */}
          <div className="relative p-px rounded-2xl"
               style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.5), rgba(245,158,11,0.15), rgba(245,158,11,0.5))' }}>
            <div className="p-8 rounded-2xl flex flex-col h-full"
                 style={{ background: 'var(--c-card)' }}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand text-[var(--c-brand-text)]">
                  Most popular
                </span>
              </div>

              <div className="mb-6">
                <span className="text-xs uppercase tracking-[0.15em] font-medium text-[var(--c-text-muted)]">Whole School</span>
                <div className="mt-3 flex items-end gap-2">
                  <span className="text-5xl font-semibold tracking-tighter text-brand">£8–10k</span>
                  <span className="text-[var(--c-text-muted)] pb-1">/ year</span>
                </div>
                <p className="text-sm text-[var(--c-text-soft)] mt-3">
                  Unlimited students, unlimited teachers. Less than the cost of a single textbook per student.
                </p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {SCHOOL_INCLUDES.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-[var(--c-text-soft)]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                         stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>

              <a
                href="mailto:eliot@newton-ai.co.uk?subject=Newton%20Whole-School%20Enquiry"
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full font-medium text-sm
                           bg-brand text-[var(--c-brand-text)] hover:bg-brand-hover transition-colors shadow-sm light-sweep"
              >
                Get a quote
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Trust note */}
        <p className="text-center text-xs text-[var(--c-text-muted)] mt-8">
          Piloted at Bedales School · All pricing exclusive of VAT · Department licensing available on request
        </p>
      </div>
    </section>
  );
}
