'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';

const spring = { type: 'spring', stiffness: 100, damping: 20, mass: 1 };

/* ─── Mock Data ─── */
const STUDENTS = [
  { name: 'E. Thompson', flag: false },
  { name: 'J. Patel', flag: true },
  { name: 'S. Williams', flag: false },
  { name: 'A. Chen', flag: false },
  { name: 'M. Davies', flag: true },
  { name: 'R. Khan', flag: false },
  { name: 'L. Brown', flag: false },
  { name: 'O. Taylor', flag: false },
];

const MODULES = ['4.1', '4.2', '4.3', '4.4', '4.5', '4.6', '4.7'];

// Pre-seeded mastery grid: 0=no data, 1=red, 2=amber, 3=green
const INITIAL_GRID = [
  [3, 3, 2, 3, 2, 1, 0],
  [2, 1, 1, 2, 0, 0, 0],
  [3, 3, 3, 2, 3, 2, 1],
  [3, 2, 3, 3, 2, 2, 0],
  [1, 2, 1, 1, 0, 0, 0],
  [3, 3, 2, 3, 3, 1, 0],
  [2, 3, 2, 2, 3, 0, 0],
  [3, 3, 3, 3, 2, 2, 1],
];

const STATUS_COLORS = {
  0: 'bg-white/[0.04]',
  1: 'bg-red-500',
  2: 'bg-amber-400',
  3: 'bg-emerald-400',
};

const STATUS_GLOW = {
  1: '0 0 8px rgba(239,68,68,0.3)',
  2: '0 0 8px rgba(251,191,36,0.3)',
  3: '0 0 8px rgba(52,211,153,0.3)',
};

const STATUS_LABELS = { 0: 'No data', 1: 'Struggling', 2: 'Learning', 3: 'Mastered' };
const MOCK_DAYS_AGO = { 0: null, 1: 12, 2: 5, 3: 1 };

/* Mock weekly mastery scores per student (6 weeks) */
const MOCK_DECAY_DATA = [
  [40, 55, 70, 85, 78, 92],   // E. Thompson — steady climb
  [30, 25, 40, 35, 20, 28],   // J. Patel — struggling
  [60, 75, 80, 90, 88, 95],   // S. Williams — strong
  [50, 60, 72, 80, 75, 82],   // A. Chen — good
  [20, 15, 25, 18, 22, 15],   // M. Davies — at risk
  [55, 68, 80, 85, 90, 88],   // R. Khan — solid
  [45, 50, 55, 60, 68, 65],   // L. Brown — progressing
  [65, 78, 85, 90, 88, 93],   // O. Taylor — strong
];

/* ─── Student Decay Panel ─── */
function StudentDecayPanel({ studentIndex, name }) {
  const data = MOCK_DECAY_DATA[studentIndex];
  const w = 220, h = 60, pad = 4;
  const weeks = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'];

  const toPath = (points) => {
    const stepX = (w - pad * 2) / (points.length - 1);
    return points.map((p, i) => {
      const x = pad + i * stepX;
      const y = pad + ((100 - p) / 100) * (h - pad * 2);
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    }).join(' ');
  };

  // Forgetting curve for comparison
  const forgetPoints = [data[0], data[0] * 0.58, data[0] * 0.4, data[0] * 0.33, data[0] * 0.28, data[0] * 0.25];

  const latest = data[data.length - 1];
  const trend = latest > data[0] ? 'improving' : latest < data[0] * 0.7 ? 'declining' : 'stable';
  const trendColor = trend === 'improving' ? 'text-emerald-400' : trend === 'declining' ? 'text-red-400' : 'text-amber-400';
  const statusColor = latest >= 80 ? 'bg-emerald-400' : latest >= 50 ? 'bg-amber-400' : 'bg-red-500';

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden"
    >
      <div className="px-4 sm:px-6 py-3 bg-white/[0.02] border-t border-white/[0.04]">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${statusColor}`} />
              <span className="text-xs font-semibold text-white">{name}</span>
              <span className={`text-[10px] font-medium ${trendColor} capitalize`}>{trend}</span>
            </div>
            <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-[220px] h-auto" fill="none">
              <motion.path
                d={toPath(forgetPoints)}
                stroke="#ef4444"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeDasharray="3 2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1 }}
                opacity={0.4}
              />
              <motion.path
                d={toPath(data)}
                stroke="#0071e3"
                strokeWidth={2}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: 0.2 }}
              />
              {data.map((p, i) => {
                const x = pad + i * ((w - pad * 2) / (data.length - 1));
                const y = pad + ((100 - p) / 100) * (h - pad * 2);
                return <circle key={i} cx={x} cy={y} r={2.5} fill="#0071e3" opacity={0.8} />;
              })}
            </svg>
            <div className="flex justify-between mt-1 max-w-[220px]">
              {weeks.map(w => (
                <span key={w} className="text-[8px] text-white/20 font-medium">{w}</span>
              ))}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold text-white tracking-tight">{latest}%</p>
            <p className="text-[10px] text-white/30 font-medium">Current Mastery</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Live Heatmap ─── */
export function LiveHeatmap() {
  const [grid, setGrid] = useState(INITIAL_GRID);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: '-100px' });

  // Simulate live data updates
  useEffect(() => {
    if (!isInView) return;
    const interval = setInterval(() => {
      setGrid(prev => {
        const next = prev.map(row => [...row]);
        // Pick a random cell and nudge it
        const r = Math.floor(Math.random() * STUDENTS.length);
        const c = Math.floor(Math.random() * MODULES.length);
        const current = next[r][c];
        // Trend upward slightly
        if (current === 0) next[r][c] = Math.random() > 0.5 ? 1 : 2;
        else if (current === 1) next[r][c] = Math.random() > 0.3 ? 2 : 1;
        else if (current === 2) next[r][c] = Math.random() > 0.4 ? 3 : 2;
        // Occasionally decay a green
        else if (current === 3 && Math.random() > 0.85) next[r][c] = 2;
        return next;
      });
    }, 1800);
    return () => clearInterval(interval);
  }, [isInView]);

  return (
    <div ref={ref} className="rounded-2xl bg-white/[0.03] border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#0071e3]/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-[#0071e3]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">AQA Biology — Year 12</p>
            <p className="text-xs text-white/40">Live Class Mastery</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-white/40 font-medium">Live</span>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[520px]">
          {/* Column headers */}
          <div className="flex border-b border-white/[0.04]">
            <div className="w-32 sm:w-36 shrink-0 px-4 sm:px-6 py-2.5">
              <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">Student</span>
            </div>
            {MODULES.map(m => (
              <div key={m} className="flex-1 px-1 py-2.5 text-center">
                <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">{m}</span>
              </div>
            ))}
          </div>

          {/* Rows */}
          {STUDENTS.map((student, ri) => (
            <div key={student.name}>
              <div
                className={`flex border-b border-white/[0.02] transition-colors cursor-pointer ${
                  selectedStudent === ri ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]'
                }`}
                onClick={() => setSelectedStudent(selectedStudent === ri ? null : ri)}
              >
                <div className="w-32 sm:w-36 shrink-0 px-4 sm:px-6 py-2 flex items-center gap-2">
                  <span className={`text-xs font-medium truncate transition-colors ${
                    selectedStudent === ri ? 'text-[#0071e3]' : 'text-white/70 hover:text-white'
                  }`}>{student.name}</span>
                  {student.flag && (
                    <svg className="w-3.5 h-3.5 text-red-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                {MODULES.map((m, ci) => {
                  const val = grid[ri][ci];
                  return (
                    <div
                      key={m}
                      className="flex-1 px-1 py-2 flex items-center justify-center relative"
                      onMouseEnter={() => setHoveredCell({ r: ri, c: ci })}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      <motion.div
                        className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md ${STATUS_COLORS[val]}`}
                        animate={{
                          boxShadow: val > 0 ? STATUS_GLOW[val] : 'none',
                        }}
                        transition={{ duration: 0.6 }}
                        layout
                      />
                      {/* Tooltip */}
                      <AnimatePresence>
                        {hoveredCell && hoveredCell.r === ri && hoveredCell.c === ci && val > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 4 }}
                            transition={{ duration: 0.15 }}
                            className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-black/90 border border-white/10 whitespace-nowrap pointer-events-none z-20"
                          >
                            <span className="text-[9px] text-white/70 font-medium">
                              {m} — {STATUS_LABELS[val]} {MOCK_DAYS_AGO[val] ? `(${MOCK_DAYS_AGO[val]}d ago)` : ''}
                            </span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
              {/* Decay panel */}
              <AnimatePresence>
                {selectedStudent === ri && (
                  <StudentDecayPanel studentIndex={ri} name={student.name} />
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 sm:px-6 py-3 border-t border-white/[0.04] flex items-center gap-4 sm:gap-6">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
          <span className="text-[10px] text-white/30 font-medium">Mastered</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
          <span className="text-[10px] text-white/30 font-medium">Learning</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-red-500" />
          <span className="text-[10px] text-white/30 font-medium">Struggling</span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <svg className="w-3 h-3 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          <span className="text-[10px] text-white/30 font-medium">Integrity Flag</span>
        </div>
      </div>
      {/* Interactive hint */}
      <div className="px-4 sm:px-6 py-2 border-t border-white/[0.04]">
        <p className="text-[10px] text-white/20 text-center font-medium">Click a student name to see their knowledge decay timeline</p>
      </div>
    </div>
  );
}

/* ─── Forgetting Curve Sparkline ─── */
export function ForgettingCurve() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  // Forgetting curve: sharp drop
  const forgetPoints = [100, 58, 44, 36, 33, 30, 28, 26, 25, 25];
  // Newton retention: maintained with spaced repetition dips and recoveries
  const retainPoints = [100, 92, 78, 88, 82, 90, 85, 92, 88, 94];

  const w = 240;
  const h = 80;
  const pad = 4;

  const toPath = (points) => {
    const stepX = (w - pad * 2) / (points.length - 1);
    return points.map((p, i) => {
      const x = pad + i * stepX;
      const y = pad + ((100 - p) / 100) * (h - pad * 2);
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    }).join(' ');
  };

  return (
    <div ref={ref} className="relative">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" fill="none">
        {/* Forgetting curve */}
        <motion.path
          d={toPath(forgetPoints)}
          stroke="#ef4444"
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray="4 3"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={isInView ? { pathLength: 1, opacity: 0.5 } : {}}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
        {/* Newton retention curve */}
        <motion.path
          d={toPath(retainPoints)}
          stroke="#0071e3"
          strokeWidth={2.5}
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={isInView ? { pathLength: 1, opacity: 1 } : {}}
          transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
        />
      </svg>
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 bg-red-500/50 rounded" style={{ borderTop: '2px dashed rgba(239,68,68,0.5)' }} />
            <span className="text-[10px] text-white/30">Forgetting Curve</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 bg-[#0071e3] rounded" />
            <span className="text-[10px] text-white/30">Newton Retention</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Animated Counter ─── */
export function AnimatedCounter({ value, suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  useEffect(() => {
    if (!isInView) return;
    const numericValue = parseInt(value.replace(/,/g, ''));
    const duration = 2000;
    const steps = 60;
    const increment = numericValue / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= numericValue) {
        setCount(numericValue);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [isInView, value]);

  return (
    <span ref={ref} className="tabular-nums">
      {count.toLocaleString()}{suffix}
    </span>
  );
}
