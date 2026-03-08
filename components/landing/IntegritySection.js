'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView } from '../../lib/useInView';

const STANDARD_AI_TEXT = `The French Revolution (1789–1799) was a period of radical political and societal transformation in France that overthrew the monarchy, established a republic, and culminated in Napoleon's rise. Key causes included financial crisis, social inequality, Enlightenment ideas, and weak leadership under Louis XVI...`;

const NEWTON_EXCHANGES = [
  { role: 'newton',  text: 'Before we explore the French Revolution — what do you already know about why people might revolt against a government?' },
  { role: 'student', text: 'Maybe if they were being treated unfairly or were really poor?' },
  { role: 'newton',  text: 'Exactly. Now think about France in 1789: the common people were starving while the nobles paid no taxes. What does that tension remind you of in what you just said?' },
  { role: 'student', text: 'Oh — that\'s the unfair treatment thing. The Third Estate was basically everyone who wasn\'t rich...' },
];

function useTyper(text, active, speed = 22) {
  const [displayed, setDisplayed] = useState('');
  const animRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    setDisplayed('');
    let i = 0;
    function tick() {
      i++;
      setDisplayed(text.slice(0, i));
      if (i < text.length) {
        animRef.current = setTimeout(tick, speed + Math.random() * 20);
      }
    }
    animRef.current = setTimeout(tick, 400);
    return () => clearTimeout(animRef.current);
  }, [active, text, speed]);

  return displayed;
}

function StandardAIPane({ active }) {
  const text = useTyper(STANDARD_AI_TEXT, active, 18);

  return (
    <div className="flex-1 rounded-2xl overflow-hidden border"
         style={{ background: 'rgba(248,113,113,0.04)', borderColor: 'rgba(248,113,113,0.2)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b"
           style={{ borderColor: 'rgba(248,113,113,0.15)', background: 'rgba(248,113,113,0.06)' }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[var(--c-error)]" />
          <span className="text-sm font-medium text-[var(--c-error)]">Standard AI</span>
        </div>
        <span className="text-xs text-[var(--c-text-muted)] px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(248,113,113,0.1)' }}>
          No guardrails
        </span>
      </div>

      {/* Content */}
      <div className="p-5 space-y-3">
        {/* Student prompt */}
        <div className="text-sm text-[var(--c-text-muted)] px-3 py-2 rounded-lg"
             style={{ background: 'rgba(255,255,255,0.04)' }}>
          "Write me an essay on the French Revolution"
        </div>

        {/* AI answer streams in */}
        <div className="text-sm text-[var(--c-text-soft)] leading-relaxed min-h-[120px]">
          {text}
          {text.length > 0 && text.length < STANDARD_AI_TEXT.length && (
            <span className="inline-block w-0.5 h-4 bg-current ml-0.5 align-middle cursor-blink" />
          )}
        </div>

        {/* Copy indicator */}
        {text.length >= STANDARD_AI_TEXT.length && (
          <div className="flex items-center gap-2 pt-2 border-t"
               style={{ borderColor: 'rgba(248,113,113,0.15)' }}>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[var(--c-error)]"
                 style={{ background: 'rgba(248,113,113,0.1)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Ready to copy &amp; submit
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NewtonPane({ active }) {
  const [step, setStep] = useState(-1);

  useEffect(() => {
    if (!active) { setStep(-1); return; }
    const timers = NEWTON_EXCHANGES.map((_, i) =>
      setTimeout(() => setStep(i), i * 2200 + 600),
    );
    return () => timers.forEach(clearTimeout);
  }, [active]);

  return (
    <div className="flex-1 rounded-2xl overflow-hidden border"
         style={{ background: 'rgba(16,185,129,0.04)', borderColor: 'rgba(16,185,129,0.2)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b"
           style={{ borderColor: 'rgba(16,185,129,0.15)', background: 'rgba(16,185,129,0.06)' }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[var(--c-success)]" />
          <span className="text-sm font-medium text-[var(--c-success)]">Newton</span>
        </div>
        <span className="text-xs text-[var(--c-text-muted)] px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(16,185,129,0.1)' }}>
          Integrity by design
        </span>
      </div>

      {/* Content */}
      <div className="p-5 space-y-3">
        {/* Student prompt */}
        <div className="text-sm text-[var(--c-text-muted)] px-3 py-2 rounded-lg"
             style={{ background: 'rgba(255,255,255,0.04)' }}>
          "Write me an essay on the French Revolution"
        </div>

        {/* Exchanges */}
        <div className="space-y-3 min-h-[120px]">
          {NEWTON_EXCHANGES.map((ex, i) => (
            i <= step ? (
              <div
                key={i}
                className={`flex ${ex.role === 'newton' ? 'justify-start' : 'justify-end'} animate-fade-up`}
              >
                <div
                  className="max-w-[85%] px-3 py-2 rounded-xl text-sm"
                  style={
                    ex.role === 'newton'
                      ? { background: 'rgba(16,185,129,0.12)', color: 'var(--c-success)', borderRadius: '12px 12px 12px 4px' }
                      : { background: 'rgba(255,255,255,0.06)', color: 'var(--c-text-soft)', borderRadius: '12px 12px 4px 12px' }
                  }
                >
                  {ex.text}
                </div>
              </div>
            ) : null
          ))}
        </div>

        {/* Cannot copy */}
        {step >= NEWTON_EXCHANGES.length - 1 && (
          <div className="flex items-center gap-2 pt-2 border-t"
               style={{ borderColor: 'rgba(16,185,129,0.15)' }}>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[var(--c-success)]"
                 style={{ background: 'rgba(16,185,129,0.1)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Student understood the concept
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function IntegritySection() {
  const [ref, inView] = useInView({ threshold: 0.2 });

  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs text-brand uppercase tracking-[0.2em] font-medium mb-4">The difference</p>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tighter text-[var(--c-text)] mb-4">
            Not all AI is equal.
          </h2>
          <p className="text-lg text-[var(--c-text-soft)] max-w-lg mx-auto font-light">
            Standard AI will write your student's essay. Newton won't — and that's the entire point.
          </p>
        </div>

        {/* Side by side */}
        <div ref={ref} className="flex flex-col md:flex-row gap-5">
          <StandardAIPane active={inView} />
          <NewtonPane active={inView} />
        </div>
      </div>
    </section>
  );
}
