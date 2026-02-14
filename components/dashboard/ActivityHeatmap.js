'use client';

import { useState, useMemo } from 'react';

const WEEKS = 26;
const CELL = 11;
const GAP = 3;
const LABEL_W = 28;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getColor(count) {
  if (count === 0) return '#1a1a1a';
  if (count <= 2) return '#1e3a5f';
  if (count <= 5) return '#2563eb';
  if (count <= 10) return '#6366f1';
  return '#8b5cf6';
}

export default function ActivityHeatmap({ activity = {}, streak = 0 }) {
  const [tooltip, setTooltip] = useState(null);

  const { grid, monthLabels } = useMemo(() => {
    const today = new Date();
    const cells = [];
    const labels = [];
    const seenMonths = new Set();

    // Start from (WEEKS * 7 - 1) days ago
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (WEEKS * 7 - 1));
    // Align to Monday
    const dayOfWeek = startDate.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startDate.setDate(startDate.getDate() + mondayOffset);

    for (let week = 0; week < WEEKS; week++) {
      for (let day = 0; day < 7; day++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + week * 7 + day);
        const key = d.toISOString().split('T')[0];
        const count = activity[key] || 0;
        const isFuture = d > today;

        cells.push({ key, count, week, day, date: d, isFuture });

        // Month label at the start of each month
        const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
        if (day === 0 && !seenMonths.has(monthKey)) {
          seenMonths.add(monthKey);
          labels.push({ month: MONTHS[d.getMonth()], week });
        }
      }
    }

    return { grid: cells, monthLabels: labels };
  }, [activity]);

  const svgW = LABEL_W + WEEKS * (CELL + GAP);
  const svgH = 20 + 7 * (CELL + GAP);

  return (
    <div className="p-5 lg:p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-neutral-100">Study Activity</h3>
          <p className="text-xs text-neutral-500 mt-0.5">Last 6 months</p>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-violet-500/10 border border-violet-500/20 rounded-lg">
            <span className="text-xs">🔥</span>
            <span className="text-xs font-semibold text-violet-400">{streak} day streak</span>
          </div>
        )}
      </div>

      <div className="flex-1 relative overflow-x-auto overflow-y-hidden">
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          className="w-full h-auto max-h-[160px]"
          style={{ minWidth: 400 }}
        >
          {/* Month labels */}
          {monthLabels.map((l, i) => (
            <text
              key={i}
              x={LABEL_W + l.week * (CELL + GAP)}
              y={10}
              className="fill-neutral-500"
              fontSize="9"
              fontFamily="var(--font-geist-sans)"
            >
              {l.month}
            </text>
          ))}

          {/* Day labels */}
          {['M', '', 'W', '', 'F', '', ''].map((label, i) => (
            label && (
              <text
                key={i}
                x={0}
                y={20 + i * (CELL + GAP) + CELL - 2}
                className="fill-neutral-500"
                fontSize="9"
                fontFamily="var(--font-geist-sans)"
              >
                {label}
              </text>
            )
          ))}

          {/* Cells */}
          {grid.map((cell) => (
            <rect
              key={cell.key}
              x={LABEL_W + cell.week * (CELL + GAP)}
              y={20 + cell.day * (CELL + GAP)}
              width={CELL}
              height={CELL}
              rx={2.5}
              fill={cell.isFuture ? 'transparent' : getColor(cell.count)}
              className="transition-colors duration-150"
              onMouseEnter={(e) => {
                const rect = e.target.getBoundingClientRect();
                const parent = e.target.closest('.relative')?.getBoundingClientRect();
                if (parent) {
                  setTooltip({
                    x: rect.left - parent.left + rect.width / 2,
                    y: rect.top - parent.top - 4,
                    date: cell.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
                    count: cell.count,
                  });
                }
              }}
              onMouseLeave={() => setTooltip(null)}
            />
          ))}
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute pointer-events-none z-10 px-2.5 py-1.5 bg-white/10 backdrop-blur-xl border border-white/10 text-neutral-100 text-[10px] font-medium rounded-lg shadow-xl whitespace-nowrap"
            style={{
              left: tooltip.x,
              top: tooltip.y,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <span className="font-semibold">{tooltip.count} {tooltip.count === 1 ? 'action' : 'actions'}</span>
            <span className="text-neutral-400 ml-1.5">{tooltip.date}</span>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3 justify-end">
        <span className="text-[10px] text-neutral-500">Less</span>
        {[0, 2, 5, 10, 15].map((v) => (
          <div
            key={v}
            className="w-[10px] h-[10px] rounded-[2px]"
            style={{ backgroundColor: getColor(v) }}
          />
        ))}
        <span className="text-[10px] text-neutral-500">More</span>
      </div>
    </div>
  );
}
