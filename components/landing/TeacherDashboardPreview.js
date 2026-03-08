'use client';

const STUDENTS = [
  { name: 'Amara Osei',      initials: 'AO', mastery: 88, trend: 'up',   topics: 3, status: 'strong' },
  { name: 'Ben Whitfield',   initials: 'BW', mastery: 64, trend: 'up',   topics: 2, status: 'ok'     },
  { name: 'Chloe Patel',     initials: 'CP', mastery: 71, trend: 'same', topics: 3, status: 'ok'     },
  { name: 'Dan Reeves',      initials: 'DR', mastery: 41, trend: 'down', topics: 1, status: 'alert'  },
  { name: 'Ellie Marchetti', initials: 'EM', mastery: 82, trend: 'up',   topics: 3, status: 'strong' },
  { name: 'Finn O\'Brien',   initials: 'FO', mastery: 55, trend: 'same', topics: 2, status: 'ok'     },
  { name: 'Grace Lee',       initials: 'GL', mastery: 92, trend: 'up',   topics: 3, status: 'strong' },
  { name: 'Harry Nguyen',    initials: 'HN', mastery: 49, trend: 'down', topics: 1, status: 'alert'  },
];

const TOPICS = [
  { name: 'Cell Division', sessions: 47, avg: 74 },
  { name: 'Photosynthesis', sessions: 38, avg: 68 },
  { name: 'DNA Replication', sessions: 29, avg: 61 },
];

const QUIZ_BARS = [55, 70, 62, 85, 45, 78, 90, 60];

function statusColor(s) {
  if (s === 'strong') return '#10B981';
  if (s === 'alert')  return '#F87171';
  return '#F59E0B';
}

function trendIcon(t) {
  if (t === 'up')   return <path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />;
  if (t === 'down') return <path d="M12 5v14M19 12l-7 7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />;
  return <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />;
}

function trendColor(t) {
  if (t === 'up')   return '#10B981';
  if (t === 'down') return '#F87171';
  return 'var(--c-text-muted)';
}

export default function TeacherDashboardPreview({ className = '' }) {
  return (
    <div className={`rounded-2xl overflow-hidden border border-white/10 ${className}`}
         style={{ background: 'rgba(9,9,15,0.95)' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/7"
           style={{ background: 'rgba(15,15,28,0.85)' }}>
        <div>
          <p className="text-sm font-semibold text-[var(--c-text)]">Year 12 Biology — Set 1</p>
          <p className="text-[10px] text-[var(--c-text-muted)]">OCR A-Level · 8 students · Week 7</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-2.5 py-1 rounded-full text-[10px] font-medium flex items-center gap-1"
               style={{ background: 'rgba(248,113,113,0.12)', color: '#F87171' }}>
            <span>⚠</span> 2 students need attention
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-white/7">
        {/* Student list */}
        <div className="col-span-2 p-4">
          <p className="text-[10px] text-[var(--c-text-muted)] uppercase tracking-wider mb-3">Students</p>
          <div className="space-y-2">
            {STUDENTS.map((s, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/3 transition-colors">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                     style={{ background: `${statusColor(s.status)}20`, color: statusColor(s.status) }}>
                  {s.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[var(--c-text)] truncate">{s.name}</p>
                </div>
                {/* Mastery bar */}
                <div className="w-20 h-1.5 rounded-full shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div className="h-full rounded-full"
                       style={{ width: `${s.mastery}%`, background: statusColor(s.status) }} />
                </div>
                <span className="text-[10px] w-8 text-right shrink-0"
                      style={{ color: statusColor(s.status) }}>{s.mastery}%</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                     style={{ color: trendColor(s.trend) }}>
                  {trendIcon(s.trend)}
                </svg>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="p-4 space-y-5">
          {/* Topics */}
          <div>
            <p className="text-[10px] text-[var(--c-text-muted)] uppercase tracking-wider mb-3">This week</p>
            <div className="space-y-2.5">
              {TOPICS.map((t, i) => (
                <div key={i}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-[var(--c-text-soft)] truncate">{t.name}</span>
                    <span className="text-[10px] text-[var(--c-text-muted)]">{t.avg}%</span>
                  </div>
                  <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
                    <div className="h-full rounded-full"
                         style={{ width: `${t.avg}%`, background: 'rgba(245,158,11,0.6)' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mini quiz graph */}
          <div>
            <p className="text-[10px] text-[var(--c-text-muted)] uppercase tracking-wider mb-3">Quiz scores</p>
            <div className="flex items-end gap-1 h-16">
              {QUIZ_BARS.map((v, i) => (
                <div key={i} className="flex-1 rounded-sm transition-all"
                     style={{
                       height: `${v}%`,
                       background: v >= 75 ? '#10B981' : v >= 60 ? '#F59E0B' : '#F87171',
                       opacity: 0.7,
                     }} />
              ))}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-[var(--c-text-muted)]">Student 1</span>
              <span className="text-[9px] text-[var(--c-text-muted)]">Avg: 68%</span>
            </div>
          </div>

          {/* Alert card */}
          <div className="px-3 py-2.5 rounded-xl border"
               style={{ background: 'rgba(248,113,113,0.06)', borderColor: 'rgba(248,113,113,0.2)' }}>
            <p className="text-[10px] font-medium text-[var(--c-error)] mb-1">Needs Support</p>
            <p className="text-[10px] text-[var(--c-text-muted)]">
              Dan R. has asked only 2 questions this week and scores are declining.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
