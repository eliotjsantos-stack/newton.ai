'use client';

export default function GradeCurveDemo() {
  // Illustrative data: what a grade distribution shift looks like
  // when students actively learn vs passively copy
  const grades = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const before = [2, 4, 7, 10, 8, 5, 3, 1, 0]; // Typical distribution
  const after =  [0, 1, 2, 4, 6, 9, 10, 6, 2]; // Shifted via active learning
  const maxVal = Math.max(...before, ...after);

  const barWidth = 28;
  const gap = 8;
  const chartWidth = grades.length * (barWidth * 2 + gap) + gap * grades.length;
  const chartHeight = 160;
  const bottomPadding = 30;
  const totalHeight = chartHeight + bottomPadding;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">The Active Learning Effect</h3>
          <p className="text-xs text-gray-500 mt-0.5">Illustrative grade distribution shift</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
            <span className="text-[11px] text-gray-500">Passive</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#0071E3]" />
            <span className="text-[11px] text-gray-500">Active</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${chartWidth + 40} ${totalHeight + 10}`} className="w-full max-w-[600px] mx-auto">
          {grades.map((grade, i) => {
            const x = 20 + i * (barWidth * 2 + gap * 2);
            const beforeHeight = (before[i] / maxVal) * chartHeight;
            const afterHeight = (after[i] / maxVal) * chartHeight;

            return (
              <g key={grade}>
                {/* Before bar (gray) */}
                <rect
                  x={x}
                  y={chartHeight - beforeHeight}
                  width={barWidth}
                  height={beforeHeight}
                  fill="#d1d5db"
                  rx={2}
                />
                {/* After bar (blue) */}
                <rect
                  x={x + barWidth + 2}
                  y={chartHeight - afterHeight}
                  width={barWidth}
                  height={afterHeight}
                  fill="#2563eb"
                  rx={2}
                />
                {/* Grade label */}
                <text
                  x={x + barWidth}
                  y={chartHeight + 18}
                  textAnchor="middle"
                  className="fill-gray-500"
                  style={{ fontSize: '11px', fontFamily: 'var(--font-jetbrains, monospace)' }}
                >
                  {grade}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <p className="text-center text-xs text-gray-400 mt-4">
        Illustrative model based on active learning research — not measured Newton outcomes
      </p>
    </div>
  );
}
