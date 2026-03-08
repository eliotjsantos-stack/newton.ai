'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, MessageSquare, BookOpen } from 'lucide-react';
import { ClassIcon } from '@/components/ClassIcons';
import SkeletonDashboard from '@/components/dashboard/SkeletonDashboard';
import NavigationDock from '@/components/NavigationDock';
import { Sidebar } from '@/components/ui/sidebar';

/* ── Knowledge Radar (SVG pentagon chart) ── */
function KnowledgeRadar({ data }) {
  const labels = ['Recall', 'Application', 'Analysis', 'Accuracy', 'Consistency'];
  const keys = ['recall', 'application', 'analysis', 'accuracy', 'consistency'];
  const cx = 80, cy = 80, r = 60;
  const n = 5;

  const pointOnPentagon = (i, scale = 1) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return {
      x: cx + r * scale * Math.cos(angle),
      y: cy + r * scale * Math.sin(angle),
    };
  };

  const rings = [0.2, 0.4, 0.6, 0.8, 1.0];
  const gridPaths = rings.map(s => {
    const pts = Array.from({ length: n }, (_, i) => pointOnPentagon(i, s));
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + ' Z';
  });

  const values = keys.map(k => Math.min((data[k] || 0) / 5, 1));
  const dataPts = values.map((v, i) => pointOnPentagon(i, Math.max(v, 0.05)));
  const dataPath = dataPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + ' Z';
  const spokes = Array.from({ length: n }, (_, i) => pointOnPentagon(i, 1));

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 160 160" className="w-full max-w-[200px]">
        {gridPaths.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="0.5" />
        ))}
        {spokes.map((p, i) => (
          <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(0,0,0,0.08)" strokeWidth="0.5" />
        ))}
        <path d={dataPath} fill="rgba(217,119,6,0.12)" stroke="#D97706" strokeWidth="1.5" />
        {dataPts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#D97706" />
        ))}
      </svg>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
        {labels.map((label, i) => (
          <span key={label} className="text-[10px] text-gray-400 uppercase tracking-wider">
            {label} <span className="text-gray-500 font-semibold">{((values[i] || 0) * 5).toFixed(1)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/chat', icon: MessageSquare, label: 'Chat' },
  { href: '/quiz', icon: BookOpen, label: 'Quizzes' },
];

export default function Dashboard() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [classes, setClasses] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [quizStats, setQuizStats] = useState({});
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  const [mastery, setMastery] = useState(null);
  const [observation, setObservation] = useState(null);
  const [radarData, setRadarData] = useState(null);

  const [upcoming, setUpcoming] = useState([]);

  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    const load = async () => {
      const token = localStorage.getItem('newton-auth-token');
      if (!token) { setLoading(false); return; }
      try {
        // Redirect teachers to the teacher dashboard
        const meRes = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
        const meData = await meRes.json();
        if (meData.accountType === 'teacher') { router.push('/teacher/classes'); return; }
        setUser({ name: meData.fullName || meData.email || 'Student', role: 'Student' });

        const headers = { Authorization: `Bearer ${token}` };
        const [classRes, quizRes, actRes, masteryRes, upcomingRes] = await Promise.all([
          fetch('/api/student/classes', { headers }),
          fetch('/api/quiz/user', { headers }),
          fetch('/api/student/activity', { headers }),
          fetch('/api/chat/analyze', { headers }).catch(() => null),
          fetch('/api/student/all-assignments', { headers }).catch(() => null),
        ]);
        const classData = await classRes.json();
        const quizData = await quizRes.json();
        setClasses(classData.classes || []);
        setQuizzes(quizData.quizzes || []);
        if (quizData.stats) setQuizStats(quizData.stats);
        try {
          const actData = await actRes.json();
          setStreak(actData.streak || 0);
        } catch {}

        if (upcomingRes && upcomingRes.ok) {
          try {
            const upcomingData = await upcomingRes.json();
            setUpcoming((upcomingData.assignments || []).filter(a => !a.completed));
          } catch {}
        }

        if (masteryRes && masteryRes.ok) {
          try {
            const masteryData = await masteryRes.json();
            setMastery(masteryData);

            if (masteryData.records && masteryData.records.length > 0) {
              const records = masteryData.records;
              const latest = records[0];

              const avgMastery = records.reduce((sum, r) => sum + (r.mastery_level || 3), 0) / records.length;
              const avgConfidence = records.reduce((sum, r) => sum + (r.confidence_score || 5), 0) / records.length;
              const totalSessions = records.length;
              const blindSpotCount = records.reduce((sum, r) => sum + (r.blind_spots?.length || 0), 0);

              setRadarData({
                recall: Math.min(avgMastery, 5),
                application: Math.min(avgMastery * 0.85, 5),
                analysis: Math.min(avgConfidence / 2, 5),
                accuracy: Math.min(5 - (blindSpotCount / Math.max(totalSessions, 1)), 5),
                consistency: Math.min(totalSessions / 4, 5),
              });

              if (latest.summary) {
                setObservation({
                  text: latest.summary,
                  subject: latest.subject,
                  focus: latest.recommended_focus?.[0] || null,
                });
              } else if (masteryData.summary?.topBlindSpots?.length > 0) {
                const topSpot = masteryData.summary.topBlindSpots[0];
                setObservation({
                  text: `You tend to struggle with: ${topSpot.spot}`,
                  subject: topSpot.subjects?.[0] || 'General',
                  focus: null,
                });
              }
            }
          } catch {}
        }
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, [mounted]);

  const handleLogout = () => {
    localStorage.removeItem('newton-auth-token');
    router.push('/login');
  };

  const handleCodeInput = (val) => {
    const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (clean.length <= 4) setJoinCode(clean);
    else setJoinCode(clean.slice(0, 4) + '-' + clean.slice(4, 8));
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setJoinError('');
    if (!joinCode.trim()) { setJoinError('Please enter a class code.'); return; }
    setJoining(true);
    try {
      const token = localStorage.getItem('newton-auth-token');
      const res = await fetch('/api/student/join-class', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: joinCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to join class');
      const existing = JSON.parse(localStorage.getItem('newton-subjects') || '["General"]');
      if (!existing.includes(data.class.subject)) {
        localStorage.setItem('newton-subjects', JSON.stringify([...existing, data.class.subject].sort()));
      }
      setJoinSuccess(data.class);
      const clsRes = await fetch('/api/student/classes', { headers: { Authorization: `Bearer ${token}` } });
      const clsData = await clsRes.json();
      setClasses(clsData.classes || []);
    } catch (err) { setJoinError(err.message); }
    finally { setJoining(false); }
  };

  const closeJoinModal = () => { setShowJoin(false); setJoinCode(''); setJoinError(''); setJoinSuccess(null); };

  if (!mounted) return null;

  const activeClasses = classes.filter(c => !c.archived);

  const lastQuiz = quizzes.find(q => q.status === 'completed');
  const lastQuizScore = lastQuiz && lastQuiz.total_questions
    ? Math.round(((lastQuiz.correct_count || 0) / lastQuiz.total_questions) * 100)
    : null;

  return (
    <div className="flex min-h-screen bg-[var(--c-canvas)]">
      {/* Desktop sidebar */}
      <div className="hidden lg:block sticky top-0 h-screen shrink-0">
        <Sidebar user={user} navItems={navItems} onLogout={handleLogout} />
      </div>

      <div className="flex-1 min-w-0">
        <main className="max-w-5xl mx-auto px-6 py-8 pb-24 lg:pb-8 space-y-8">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="skeleton"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
              >
                <SkeletonDashboard />
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {/* Page header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-semibold text-[var(--c-text)] tracking-tight">Dashboard</h1>
                    {streak > 0 && (
                      <p className="text-sm text-[var(--c-text-muted)] mt-0.5">{streak} day streak</p>
                    )}
                  </div>
                  <button
                    onClick={() => setShowJoin(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-md transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Join Class
                  </button>
                </div>

                {/* Your Insights */}
                <div>
                  <h3 className="text-[11px] font-medium text-[var(--c-text-faint)] uppercase tracking-wider mb-4">Your Insights</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-w-0">
                    {/* Knowledge Radar */}
                    <div className="bg-white rounded-xl p-6 sm:p-8 min-w-0 [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]">
                      <h3 className="text-[11px] font-medium text-[var(--c-text-faint)] uppercase tracking-wider mb-4">Knowledge Radar</h3>
                      {radarData ? (
                        <KnowledgeRadar data={radarData} />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-32 text-center">
                          <p className="text-sm text-[var(--c-text-muted)]">No data yet</p>
                          <p className="text-xs text-[var(--c-text-faint)] mt-1">Start chatting to build your profile</p>
                        </div>
                      )}
                    </div>

                    {/* Mastery Overview */}
                    <div className="lg:col-span-2 bg-white rounded-xl p-6 sm:p-8 min-w-0 [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]">
                      <h3 className="text-[11px] font-medium text-[var(--c-text-faint)] uppercase tracking-wider mb-4">Your Mastery</h3>
                      <div className="flex flex-col items-center justify-center h-32 text-center">
                        <p className="text-sm text-[var(--c-text-muted)]">No active tasks — Ready to start?</p>
                        <p className="text-xs text-[var(--c-text-faint)] mt-1">Complete quizzes to see your progress here</p>
                      </div>
                    </div>

                    {/* Newton's Observation */}
                    {observation && (
                      <div className="lg:col-span-3 bg-white rounded-xl p-6 sm:p-8 min-w-0 [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]">
                        <h3 className="text-[11px] font-medium text-[var(--c-text-faint)] uppercase tracking-wider mb-4">Observation</h3>
                        <div className="flex flex-col justify-center min-w-0">
                          <p className="text-[var(--c-text)] text-[15px] leading-relaxed mb-3 break-words">
                            &ldquo;{observation.text}&rdquo;
                          </p>
                          {observation.focus && (
                            <p className="text-sm text-[var(--c-text-muted)] break-words">
                              Focus next on: <span className="text-amber-600 font-medium">{observation.focus}</span>
                            </p>
                          )}
                          {observation.subject && (
                            <p className="text-[10px] text-[var(--c-text-faint)] mt-2 uppercase tracking-wider">{observation.subject}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Upcoming Assignments */}
                {upcoming.length > 0 && (
                  <div>
                    <h3 className="text-[11px] font-medium text-[var(--c-text-faint)] uppercase tracking-wider mb-4">Upcoming</h3>
                    <div className="bg-white rounded-xl overflow-hidden [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]">
                      {upcoming.slice(0, 8).map((item, i) => {
                        const isOverdue = item.dueDate && new Date(item.dueDate) < new Date();
                        const isQuiz = item.type === 'quiz';
                        return (
                          <Link
                            key={`${item.type}-${item.id}`}
                            href={isQuiz ? '/quiz' : `/subject/${encodeURIComponent(item.subject)}`}
                            className={`flex items-center gap-3 px-4 py-3 hover:bg-[var(--c-canvas)] transition-colors ${
                              i < Math.min(upcoming.length, 8) - 1 ? 'border-b border-[var(--c-border)]' : ''
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className={`text-sm font-medium truncate ${isOverdue ? 'text-red-500' : 'text-[var(--c-text)]'}`}>
                                  {item.title}
                                </p>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider shrink-0 ${
                                  isQuiz ? 'bg-amber-100 text-amber-700' : 'bg-neutral-100 text-neutral-400'
                                }`}>
                                  {isQuiz ? 'Quiz' : 'Task'}
                                </span>
                              </div>
                              <p className={`text-xs mt-0.5 ${isOverdue ? 'text-red-400' : 'text-[var(--c-text-muted)]'}`}>
                                {item.subject} · {item.className}
                                {item.dueDate
                                  ? ` · ${isOverdue ? 'Overdue' : 'Due'} ${new Date(item.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
                                  : ''}
                              </p>
                            </div>
                            <svg className="w-4 h-4 text-[var(--c-border-strong)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Subject Tiles */}
                <div>
                  <h3 className="text-[11px] font-medium text-[var(--c-text-faint)] uppercase tracking-wider mb-4">Subjects</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {/* General Chat */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0 }}
                    >
                      <Link
                        href="/chat"
                        className="block bg-white rounded-xl p-5 group hover:shadow-md transition-all text-center [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]"
                      >
                        <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <h3 className="text-sm font-medium text-[var(--c-text)] tracking-tight">General</h3>
                      </Link>
                    </motion.div>

                    {/* Class subject tiles */}
                    {activeClasses.map((cls, idx) => (
                      <motion.div
                        key={cls.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 100, damping: 20, delay: (idx + 1) * 0.05 }}
                      >
                        <Link
                          href={`/chat?classId=${cls.id}&new=true`}
                          className="block bg-white rounded-xl p-5 group hover:shadow-md transition-all text-center [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]"
                        >
                          <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <ClassIcon subject={cls.subject} size={20} />
                          </div>
                          <h3 className="text-sm font-medium text-[var(--c-text)] tracking-tight truncate">{cls.subject}</h3>
                          {cls.board && (
                            <p className="text-[10px] text-[var(--c-text-faint)] mt-0.5 truncate">{cls.board}</p>
                          )}
                        </Link>
                      </motion.div>
                    ))}

                    {/* Join Class tile */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 100, damping: 20, delay: (activeClasses.length + 1) * 0.05 }}
                    >
                      <button
                        onClick={() => setShowJoin(true)}
                        className="w-full border border-dashed border-[var(--c-border)] rounded-xl p-5 group hover:border-[var(--c-border-strong)] transition-colors text-center bg-white"
                      >
                        <div className="w-10 h-10 border border-dashed border-[var(--c-border)] rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:border-[var(--c-border-strong)] transition-colors">
                          <svg className="w-4 h-4 text-[var(--c-text-faint)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                        </div>
                        <h3 className="text-sm font-medium text-[var(--c-text-faint)] tracking-tight">Join</h3>
                      </button>
                    </motion.div>
                  </div>
                </div>

                {/* Your Progress */}
                <Link href="/quiz" className="block bg-white rounded-xl p-6 sm:p-8 group hover:shadow-md transition-all min-w-0 [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]">
                  <div className="flex items-center justify-between min-w-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold text-[var(--c-text)] tracking-tight">Your Progress</h3>
                        {quizStats.completed > 0 && (
                          <span className="text-[11px] font-medium text-[var(--c-text-faint)]">
                            {quizStats.completed} completed
                          </span>
                        )}
                      </div>
                      {lastQuiz ? (
                        <p className="text-sm text-[var(--c-text-muted)]">
                          Last: {lastQuiz.topic_name || lastQuiz.topicName || 'Untitled'} &middot; {lastQuizScore}%
                        </p>
                      ) : (
                        <p className="text-sm text-[var(--c-text-muted)]">Start your first quiz to track progress</p>
                      )}
                    </div>
                    <svg className="w-5 h-5 text-[var(--c-border-strong)] group-hover:text-[var(--c-text-muted)] transition-colors shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                </Link>

              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile nav */}
      <NavigationDock />

      {/* Join Class Modal */}
      <AnimatePresence>
        {showJoin && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={closeJoinModal} />
            <motion.div
              className="relative bg-white rounded-2xl max-w-sm w-full p-6 [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]"
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              {joinSuccess ? (
                <div className="text-center">
                  <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-[var(--c-text)] mb-1">Joined {joinSuccess.name}!</h2>
                  <p className="text-sm text-[var(--c-text-muted)] mb-5">{joinSuccess.subject}</p>
                  <button
                    onClick={closeJoinModal}
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-md transition-colors duration-200"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-lg font-semibold text-[var(--c-text)] mb-1">Join a Class</h2>
                  <p className="text-sm text-[var(--c-text-muted)] mb-5">Enter the code from your teacher.</p>
                  {joinError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                      <p className="text-sm text-red-600">{joinError}</p>
                    </div>
                  )}
                  <form onSubmit={handleJoin}>
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) => handleCodeInput(e.target.value)}
                      placeholder="ABCD-1234"
                      maxLength={9}
                      autoFocus
                      className="w-full px-4 py-3 bg-[var(--c-canvas)] border border-[var(--c-border)] rounded-md text-center text-xl font-mono font-semibold tracking-widest text-[var(--c-text)] focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500 placeholder:text-[var(--c-text-faint)] placeholder:tracking-normal"
                    />
                    <div className="flex gap-3 mt-5">
                      <button type="button" onClick={closeJoinModal} className="flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-[var(--c-text-soft)] font-medium rounded-md transition-colors">
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={joining || joinCode.replace(/-/g, '').length < 8}
                        className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-neutral-100 text-white disabled:text-neutral-400 font-medium rounded-md transition-colors duration-200"
                      >
                        {joining ? 'Joining...' : 'Join'}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
