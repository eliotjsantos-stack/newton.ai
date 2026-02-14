'use client';

import { useState } from 'react';

/**
 * MasteryHeatmap — CSS grid heatmap showing student x chapter mastery.
 *
 * Props:
 *   students:       [{ id, name }]
 *   chapters:       string[] of curriculum topics
 *   cells:          [{ studentId, chapter, masteryLevel, status, lastQuizAt }]
 *   integrityFlags: { [studentId]: number } — tab switch count in past 7 days
 */
export default function MasteryHeatmap({ students = [], chapters = [], cells = [], integrityFlags = {}, onCellClick }) {
  const [tooltip, setTooltip] = useState(null);

  const getCell = (studentId, chapter) =>
    cells.find(c => c.studentId === studentId && c.chapter === chapter);

  const getCellColor = (cell) => {
    if (!cell) return 'bg-white/[0.06]';
    if (cell.status === 'green') return 'bg-emerald-400';
    if (cell.status === 'amber') return 'bg-amber-400';
    if (cell.status === 'red') return 'bg-red-400';
    if (cell.masteryLevel >= 4) return 'bg-emerald-400';
    if (cell.masteryLevel >= 2) return 'bg-amber-400';
    if (cell.masteryLevel >= 1) return 'bg-red-400';
    return 'bg-white/[0.06]';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  if (students.length === 0 || chapters.length === 0) {
    return (
      <div className="rounded-3xl border border-white/[0.06] bg-white/[0.05] p-8 text-center">
        <p className="text-white/40 text-sm">No mastery data yet. Students need to complete quizzes to populate this heatmap.</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/[0.06] bg-white/[0.05] overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Header row */}
          <div className="flex border-b border-white/[0.06]">
            <div className="w-44 shrink-0 sticky left-0 bg-[#0B0B0C] z-10 px-4 py-3 border-r border-white/[0.06]">
              <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">Student</span>
            </div>
            {chapters.map((ch) => (
              <div key={ch} className="w-24 shrink-0 px-2 py-3 text-center">
                <span className="text-[10px] font-medium text-white/40 leading-tight block truncate" title={ch}>
                  {ch.split(':').pop()?.trim() || ch}
                </span>
              </div>
            ))}
          </div>

          {/* Student rows */}
          {students.map((student) => (
            <div key={student.id} className="flex border-b border-white/[0.04] hover:bg-white/[0.02]">
              <div className="w-44 shrink-0 sticky left-0 bg-[#0B0B0C] z-10 px-4 py-2.5 border-r border-white/[0.06] flex items-center gap-2">
                <span className="text-sm font-medium text-white truncate">{student.name}</span>
                {(integrityFlags[student.id] || 0) > 3 && (
                  <span className="shrink-0" title={`${integrityFlags[student.id]} tab switches this week`}>
                    <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </div>
              {chapters.map((ch) => {
                const cell = getCell(student.id, ch);
                return (
                  <div
                    key={ch}
                    className="w-24 shrink-0 px-2 py-2.5 flex items-center justify-center relative"
                    onMouseEnter={() => setTooltip({ studentId: student.id, chapter: ch })}
                    onMouseLeave={() => setTooltip(null)}
                    onClick={() => onCellClick?.(student.id, ch)}
                  >
                    <div className={`w-8 h-8 rounded-lg ${getCellColor(cell)} transition-colors ${onCellClick ? 'cursor-pointer hover:ring-2 hover:ring-white/20' : 'cursor-default'}`} />

                    {/* Tooltip */}
                    {tooltip?.studentId === student.id && tooltip?.chapter === ch && cell && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-xl bg-white/[0.08] backdrop-blur-xl border border-white/[0.1] text-white text-xs whitespace-nowrap z-20 pointer-events-none shadow-lg">
                        <p className="font-semibold">{cell.masteryLevel ? `${(cell.masteryLevel / 5 * 100).toFixed(0)}% mastery` : 'No score'}</p>
                        <p className="text-white/40 mt-0.5">Last quiz: {formatDate(cell.lastQuizAt)}</p>
                        <p className="text-white/40">Status: {cell.status}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-3 border-t border-white/[0.06] flex items-center gap-4">
        <span className="text-xs text-white/40 font-medium">Legend:</span>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-emerald-400" />
          <span className="text-xs text-white/40">Mastered</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-amber-400" />
          <span className="text-xs text-white/40">Learning</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-400" />
          <span className="text-xs text-white/40">Struggling</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-white/[0.06]" />
          <span className="text-xs text-white/40">No data</span>
        </div>
      </div>
    </div>
  );
}
