'use client';

import Link from 'next/link';
import MagneticButton from './MagneticButton';

const actions = [
  {
    label: 'Chat',
    desc: 'Ask anything',
    href: '/chat',
    bg: 'bg-[#0071e3]',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    label: 'Quiz',
    desc: 'Test yourself',
    action: 'quiz',
    bg: 'bg-white/[0.12]',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
      </svg>
    ),
  },
  {
    label: 'History',
    desc: 'Past chats',
    href: '/chat/archive',
    bg: 'bg-white/[0.08]',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: 'Join Class',
    desc: 'Enter code',
    action: 'join',
    bg: 'bg-white/[0.08]',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
    ),
  },
];

export default function QuickActions({ onNewQuiz, onJoinClass }) {
  return (
    <div className="p-4 lg:p-5">
      <div className="flex gap-2.5 overflow-x-auto hide-scrollbar snap-x snap-mandatory sm:grid sm:grid-cols-4 sm:overflow-visible -mx-1 px-1">
        {actions.map((a) => {
          const inner = (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-colors group min-w-[140px] snap-start shrink-0 sm:shrink sm:min-w-0">
              <div className={`w-9 h-9 ${a.bg} rounded-lg flex items-center justify-center shrink-0`}>
                {a.icon}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-neutral-100">{a.label}</p>
                <p className="text-[11px] text-neutral-400">{a.desc}</p>
              </div>
            </div>
          );

          if (a.href) {
            return (
              <MagneticButton key={a.label} strength={0.15}>
                <Link href={a.href}>{inner}</Link>
              </MagneticButton>
            );
          }

          return (
            <MagneticButton key={a.label} strength={0.15}>
              <button
                onClick={a.action === 'quiz' ? onNewQuiz : onJoinClass}
                className="w-full text-left"
              >
                {inner}
              </button>
            </MagneticButton>
          );
        })}
      </div>
    </div>
  );
}
