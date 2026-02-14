'use client';

import { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

function AnimatedNumber({ value, duration = 1.2 }) {
  const spring = useSpring(0, { duration: duration * 1000 });
  const display = useTransform(spring, (v) => Math.round(v));
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    spring.set(value);
    return spring.on('change', (v) => setCurrent(Math.round(v)));
  }, [value, spring]);

  return <span>{current}</span>;
}

export default function WelcomeCard({ subjectCount = 0, quizStats = {}, streak = 0 }) {
  const avgScore = quizStats.averageScore != null ? Math.round(quizStats.averageScore) : null;

  const stats = [
    { label: 'Subjects', value: subjectCount, suffix: '' },
    { label: 'Quizzes taken', value: quizStats.completed || 0, suffix: '' },
    ...(avgScore != null ? [{ label: 'Quiz average', value: avgScore, suffix: '%' }] : []),
    { label: 'Day streak', value: streak, suffix: '' },
  ];

  return (
    <div className="p-5 lg:p-6 h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-neutral-100 tracking-tight">
          Welcome back
        </h2>
        <p className="text-sm text-neutral-400 mt-1">
          Pick up where you left off.
        </p>
      </div>

      <div className="flex-1 flex gap-3 overflow-x-auto hide-scrollbar snap-x snap-mandatory sm:grid sm:grid-cols-2 sm:overflow-visible -mx-1 px-1">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3 flex flex-col justify-between min-w-[120px] snap-start shrink-0 sm:shrink sm:min-w-0"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
              {stat.label}
            </p>
            <p className="text-2xl font-bold text-neutral-100 mt-1 tabular-nums">
              <AnimatedNumber value={stat.value} />
              {stat.suffix}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
