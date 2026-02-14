'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const items = [
  {
    href: '/dashboard',
    label: 'Home',
    tooltip: 'Dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/chat',
    label: 'Chat',
    tooltip: 'Chat',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    href: '/quiz',
    label: 'Quizzes',
    tooltip: 'Quizzes',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
];

/**
 * NavigationDock — unified navigation for mobile + desktop.
 *
 * Props:
 *   dimmed   — fade dock to 20% opacity (e.g. when the chat input is focused)
 *   hidden   — slide the dock off-screen (e.g. when user is scrolling)
 *   inline   — render without fixed positioning (for embedding in a parent container)
 *   focused  — when inline, scale down to 0.9 and fade to 20% opacity
 */
export default function NavigationDock({ dimmed = false, hidden = false, inline = false, focused = false }) {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState(null);

  const isActive = (href) => {
    if (href === '/chat') return pathname === '/chat' || pathname.startsWith('/chat/');
    if (href === '/quiz') return pathname === '/quiz' || pathname.startsWith('/quiz/');
    return pathname === href;
  };

  /* ── Inline mode: no fixed positioning, lives inside a parent container ── */
  if (inline) {
    return (
      <>
        {/* Mobile inline dock */}
        <motion.nav
          className="md:hidden flex items-center justify-around w-full h-12"
          animate={{ opacity: focused ? 0.2 : 1, scale: focused ? 0.95 : 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {items.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center gap-0.5 py-1.5 px-3 transition-colors ${
                  active ? 'text-[#0071e3]' : 'text-white/40'
                }`}
              >
                {item.icon}
                <span className="text-[10px] font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </motion.nav>

        {/* Desktop inline dock */}
        <motion.nav
          className="hidden md:flex items-center gap-1 px-2 py-2 rounded-full bg-black/80 backdrop-blur-xl border border-white/20 w-fit mx-auto shadow-[0_0_30px_rgba(0,0,0,0.5)]"
          animate={{ opacity: focused ? 0.2 : 1, scale: focused ? 0.9 : 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {items.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-col items-center px-5 py-2 rounded-full transition-all duration-200 group hover:scale-110"
                onMouseEnter={() => setHoveredItem(item.href)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {active && (
                  <motion.div
                    layoutId="active-pill-inline"
                    className="absolute inset-0 rounded-full bg-white/10"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}

                <span className={`relative z-10 transition-colors duration-150 ${
                  active ? 'text-white' : 'text-white/40 group-hover:text-white/70'
                }`}>
                  {item.icon}
                </span>
                <span className={`relative z-10 text-[10px] font-semibold mt-0.5 transition-colors duration-150 ${
                  active ? 'text-white' : 'text-white/40 group-hover:text-white/70'
                }`}>
                  {item.label}
                </span>

                <AnimatePresence>
                  {hoveredItem === item.href && !active && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-md bg-white/10 backdrop-blur-md border border-white/10 whitespace-nowrap pointer-events-none"
                    >
                      <span className="text-[10px] font-semibold text-white/70">{item.tooltip}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </motion.nav>
      </>
    );
  }

  /* ── Standard mode: fixed positioning for standalone pages ── */
  const resolvedOpacity = hidden ? 0 : dimmed ? 0.2 : 1;
  const resolvedY = hidden ? 80 : 0;

  return (
    <>
      {/* ── Mobile: Full-width bottom bar ── */}
      <motion.nav
        className="fixed bottom-0 left-0 right-0 z-[100] md:hidden safe-bottom border-t border-white/10 bg-black/90 backdrop-blur-xl"
        animate={{ opacity: resolvedOpacity, y: resolvedY }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{ pointerEvents: hidden ? 'none' : 'auto' }}
      >
        <div className="flex items-center justify-around h-14">
          {items.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center gap-0.5 py-1.5 px-3 transition-colors ${
                  active ? 'text-[#0071e3]' : 'text-white/40'
                }`}
              >
                {item.icon}
                <span className="text-[10px] font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </motion.nav>

      {/* ── Desktop: Floating macOS-style dock ── */}
      <motion.nav
        className="fixed bottom-6 left-1/2 z-[100] hidden md:flex items-center gap-1 px-2 py-2 rounded-full bg-black/80 backdrop-blur-xl border border-white/20 w-fit shadow-[0_0_30px_rgba(0,0,0,0.5)]"
        style={{ x: '-50%', pointerEvents: hidden ? 'none' : 'auto' }}
        animate={{ opacity: resolvedOpacity, y: resolvedY }}
        whileHover={{ scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center px-5 py-2 rounded-full transition-all duration-200 group hover:scale-110"
              onMouseEnter={() => setHoveredItem(item.href)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              {active && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 rounded-full bg-white/10"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}

              <span className={`relative z-10 transition-colors duration-150 ${
                active ? 'text-white' : 'text-white/40 group-hover:text-white/70'
              }`}>
                {item.icon}
              </span>
              <span className={`relative z-10 text-[10px] font-semibold mt-0.5 transition-colors duration-150 ${
                active ? 'text-white' : 'text-white/40 group-hover:text-white/70'
              }`}>
                {item.label}
              </span>

              <AnimatePresence>
                {hoveredItem === item.href && !active && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-md bg-white/10 backdrop-blur-md border border-white/10 whitespace-nowrap pointer-events-none"
                  >
                    <span className="text-[10px] font-semibold text-white/70">{item.tooltip}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </motion.nav>
    </>
  );
}
