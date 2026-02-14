'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const boards = [
  { name: 'AQA', subtitle: 'Assessment & Qualifications Alliance', color: '#7C3AED', startX: -160, startRotate: -20, fanX: -100, fanRotate: -14 },
  { name: 'Edexcel', subtitle: 'Pearson Education', color: '#EA580C', startX: 0, startRotate: 8, fanX: 0, fanRotate: 0 },
  { name: 'OCR', subtitle: 'Oxford, Cambridge & RSA', color: '#2563EB', startX: 160, startRotate: 20, fanX: 100, fanRotate: 14 },
];

export default function ExamBoardStack() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const [glowActive, setGlowActive] = useState(false);
  const [textRevealed, setTextRevealed] = useState(false);
  const [fanned, setFanned] = useState(false);

  useEffect(() => {
    if (!isInView) return;
    const t1 = setTimeout(() => setGlowActive(true), 1200);
    const t2 = setTimeout(() => setTextRevealed(true), 1600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isInView]);

  return (
    <div ref={ref} className="flex flex-col items-center">
      <div
        className="relative w-[280px] h-[250px] mb-10 cursor-pointer"
        onMouseEnter={() => isInView && setFanned(true)}
        onMouseLeave={() => setFanned(false)}
      >
        {/* Glow behind stack */}
        <motion.div
          className="absolute -inset-16 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(59,130,246,0.25) 0%, rgba(139,92,246,0.12) 40%, transparent 70%)',
          }}
          animate={{ opacity: glowActive ? 1 : 0, scale: glowActive ? 1.15 : 0.8 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />

        {boards.map((board, i) => (
          <motion.div
            key={board.name}
            className="absolute inset-x-0"
            style={{ zIndex: i }}
            initial={{
              x: board.startX,
              y: 100,
              opacity: 0,
              rotate: board.startRotate,
              scale: 0.85,
            }}
            animate={
              isInView
                ? {
                    x: fanned ? board.fanX : 0,
                    y: fanned ? 40 : (boards.length - 1 - i) * 14,
                    opacity: 1,
                    rotate: fanned ? board.fanRotate : (i === 0 ? -3 : i === 2 ? 3 : 0),
                    scale: fanned ? 1.04 : 1,
                  }
                : undefined
            }
            transition={
              isInView && !fanned
                ? { type: 'spring', damping: 12, stiffness: 100, delay: i * 0.22 }
                : { type: 'spring', damping: 15, stiffness: 150 }
            }
          >
            <div
              className="w-full h-[160px] rounded-2xl p-5 backdrop-blur-xl border border-white/[0.12] flex flex-col justify-between transition-shadow duration-500"
              style={{
                background: `linear-gradient(135deg, ${board.color}18 0%, ${board.color}08 50%, rgba(255,255,255,0.03) 100%)`,
                boxShadow: fanned
                  ? `0 16px 50px ${board.color}25, 0 6px 20px rgba(0,0,0,0.3)`
                  : `0 12px 40px ${board.color}15, 0 4px 16px rgba(0,0,0,0.25)`,
              }}
            >
              <div>
                <div className="text-xl font-extrabold mb-0.5" style={{ color: board.color }}>
                  {board.name}
                </div>
                <div className="text-[11px] text-neutral-400 font-medium">{board.subtitle}</div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider">
                  2026 Specification
                </span>
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: `${board.color}25` }}
                >
                  <svg className="w-3 h-3" style={{ color: board.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Reveal text */}
      <motion.p
        className="text-neutral-400 font-semibold text-center text-sm tracking-wide"
        initial={{ opacity: 0, y: 10 }}
        animate={textRevealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        Grounded in official 2026 Specifications
      </motion.p>
    </div>
  );
}
