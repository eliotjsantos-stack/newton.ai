'use client';

import Link from 'next/link';
import NewtonApple from './NewtonApple';

const LINKS = {
  Product: [
    { label: 'How it works',  href: '#how-it-works' },
    { label: 'Features',      href: '#features' },
    { label: 'For Schools',   href: '#schools' },
    { label: 'Pricing',       href: '#pricing' },
    { label: 'Try Newton',    href: '/chat' },
  ],
  Company: [
    { label: 'About',   href: '/about' },
    { label: 'FAQ',     href: '/faq' },
    { label: 'Contact', href: 'mailto:eliot@newton-ai.co.uk' },
  ],
  Legal: [
    { label: 'Privacy Policy',    href: '/privacy' },
    { label: 'Terms of Service',  href: '/terms' },
    { label: 'GDPR',              href: '/privacy' },
  ],
};

export default function LandingFooter() {
  return (
    <footer className="border-t border-[var(--c-border)]"
            style={{ background: 'rgba(9,9,15,0.97)' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12">

          {/* Brand column */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-5">
              <NewtonApple size={32} animate glow={false} />
              <span className="text-xl font-semibold tracking-tight text-[var(--c-text)]">Newton</span>
            </div>
            <p className="text-sm text-[var(--c-text-soft)] leading-relaxed mb-6 max-w-xs">
              The world's first sovereign learning system. AI that teaches students to think —
              never does their thinking for them.
            </p>
            <p className="text-xs text-[var(--c-text-muted)] leading-relaxed">
              Pioneered at Bedales School, Hampshire, UK.
            </p>

            {/* Contact */}
            <div className="mt-6">
              <a
                href="mailto:eliot@newton-ai.co.uk"
                className="text-sm text-brand hover:text-brand-hover transition-colors"
              >
                eliot@newton-ai.co.uk
              </a>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([category, links]) => (
            <div key={category}>
              <p className="text-xs text-[var(--c-text-muted)] uppercase tracking-[0.15em] font-medium mb-5">
                {category}
              </p>
              <ul className="space-y-3">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    {href.startsWith('mailto') || href.startsWith('http') ? (
                      <a
                        href={href}
                        className="text-sm text-[var(--c-text-soft)] hover:text-[var(--c-text)] transition-colors"
                      >
                        {label}
                      </a>
                    ) : href.startsWith('#') ? (
                      <a
                        href={href}
                        className="text-sm text-[var(--c-text-soft)] hover:text-[var(--c-text)] transition-colors"
                      >
                        {label}
                      </a>
                    ) : (
                      <Link
                        href={href}
                        className="text-sm text-[var(--c-text-soft)] hover:text-[var(--c-text)] transition-colors"
                      >
                        {label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom strip */}
        <div className="mt-16 pt-8 border-t border-[var(--c-border-subtle)] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[var(--c-text-muted)] text-center md:text-left">
            © 2025 NewtonAI Ltd. Registered in England and Wales.
            Company No. <span className="font-medium text-[var(--c-text-soft)]">17070215</span>.
          </p>
          <div className="flex items-center gap-6 text-xs text-[var(--c-text-muted)]">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--c-success)] animate-pulse" />
              All systems operational
            </span>
            <span>UK-based · GDPR compliant</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
