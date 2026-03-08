'use client';

const SUBJECTS = [
  {
    name: 'Mathematics',
    emoji: '📐',
    board: 'AQA',
    level: 'A-Level',
    lastActive: '2 hours ago',
    topic: 'Integration by Substitution',
    progress: 72,
    color: '#3B82F6',
    sessions: 24,
  },
  {
    name: 'Biology',
    emoji: '🔬',
    board: 'OCR',
    level: 'A-Level',
    lastActive: 'Yesterday',
    topic: 'Cell Division — Meiosis',
    progress: 58,
    color: '#10B981',
    sessions: 18,
  },
  {
    name: 'History',
    emoji: '📜',
    board: 'AQA',
    level: 'A-Level',
    lastActive: '3 days ago',
    topic: 'Causes of WW1',
    progress: 84,
    color: '#F59E0B',
    sessions: 31,
  },
  {
    name: 'English Literature',
    emoji: '📖',
    board: 'Pearson',
    level: 'A-Level',
    lastActive: 'Today',
    topic: 'Macbeth — Ambition themes',
    progress: 45,
    color: '#A78BFA',
    sessions: 12,
  },
];

const RECENT_CHAT = [
  { role: 'newton',  text: 'What do you think the substitution u = x² gives us for the differential?' },
  { role: 'student', text: 'du = 2x dx… so x dx = du/2?' },
  { role: 'newton',  text: 'Exactly. Now rewrite the integral in terms of u only.' },
];

function SubjectCard({ subject }) {
  return (
    <div className="p-4 rounded-xl border border-white/8 hover:border-white/15 transition-colors cursor-pointer"
         style={{ background: 'rgba(255,255,255,0.03)' }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{subject.emoji}</span>
          <div>
            <p className="text-sm font-semibold text-[var(--c-text)] leading-tight">{subject.name}</p>
            <p className="text-[10px] text-[var(--c-text-muted)] mt-0.5">{subject.board} · {subject.level}</p>
          </div>
        </div>
        <span className="text-[10px] text-[var(--c-text-muted)]">{subject.lastActive}</span>
      </div>

      <p className="text-xs text-[var(--c-text-soft)] mb-3 truncate">{subject.topic}</p>

      {/* Progress */}
      <div className="space-y-1">
        <div className="flex justify-between">
          <span className="text-[10px] text-[var(--c-text-muted)]">Mastery</span>
          <span className="text-[10px] font-medium" style={{ color: subject.color }}>{subject.progress}%</span>
        </div>
        <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div className="h-full rounded-full transition-all"
               style={{ width: `${subject.progress}%`, background: subject.color }} />
        </div>
      </div>
    </div>
  );
}

export default function StudentDashboardPreview({ className = '' }) {
  return (
    <div className={`rounded-2xl overflow-hidden border border-white/10 ${className}`}
         style={{ background: 'rgba(9,9,15,0.95)', minHeight: 520 }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/7"
           style={{ background: 'rgba(15,15,28,0.85)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm"
               style={{ background: 'rgba(245,158,11,0.2)', color: '#F59E0B' }}>E</div>
          <div>
            <p className="text-sm font-semibold text-[var(--c-text)]">Eliot</p>
            <p className="text-[10px] text-[var(--c-text-muted)]">Year 12 · Bedales School</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-full text-[10px] font-medium"
               style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981' }}>
            85 day streak 🔥
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Good afternoon */}
        <div>
          <p className="text-xs text-[var(--c-text-muted)] uppercase tracking-wider mb-1">Good afternoon</p>
          <h3 className="text-xl font-semibold text-[var(--c-text)] tracking-tight">Your subjects</h3>
        </div>

        {/* Subject cards grid */}
        <div className="grid grid-cols-2 gap-3">
          {SUBJECTS.map((s, i) => (
            <SubjectCard key={i} subject={s} />
          ))}
        </div>

        {/* Recent chat */}
        <div>
          <p className="text-xs text-[var(--c-text-muted)] uppercase tracking-wider mb-3">Last session · Mathematics</p>
          <div className="rounded-xl border border-white/7 overflow-hidden"
               style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div className="p-4 space-y-3">
              {RECENT_CHAT.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'newton' ? 'justify-start' : 'justify-end'}`}>
                  <div className="max-w-[80%] px-3 py-2 rounded-xl text-xs"
                       style={
                         msg.role === 'newton'
                           ? { background: 'rgba(245,158,11,0.1)', color: '#F59E0B' }
                           : { background: 'rgba(255,255,255,0.06)', color: 'var(--c-text-soft)' }
                       }>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
