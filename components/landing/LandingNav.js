'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import NewtonApple from './NewtonApple';

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 40);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className="fixed top-0 inset-x-0 z-50 transition-all duration-300"
      style={{
        background: scrolled
          ? 'rgba(9, 9, 15, 0.85)'
          : 'transparent',
        backdropFilter: scrolled ? 'blur(64px) saturate(1.6)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(64px) saturate(1.6)' : 'none',
        borderBottom: scrolled ? '0.5px solid rgba(255,255,255,0.07)' : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <NewtonApple size={28} animate={false} glow={false} />
            <span className="text-lg font-semibold tracking-tight text-[var(--c-text)]">
              Newton
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {[
              { label: 'How it works', href: '#how-it-works' },
              { label: 'Features',     href: '#features' },
              { label: 'For Schools',  href: '#schools' },
              { label: 'Pricing',      href: '#pricing' },
            ].map(({ label, href }) => (
              <a
                key={href}
                href={href}
                className="text-sm text-[var(--c-text-soft)] hover:text-[var(--c-text)] transition-colors duration-150"
              >
                {label}
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden md:block text-sm text-[var(--c-text-soft)] hover:text-[var(--c-text)] transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/chat"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium
                         bg-brand text-[var(--c-brand-text)] hover:bg-brand-hover
                         transition-colors duration-150 shadow-sm"
            >
              Try Newton
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
