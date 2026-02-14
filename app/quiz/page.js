'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ClassIcon } from '@/components/ClassIcons';
import NavigationDock from '@/components/NavigationDock';

const cardBase = "bg-[#0d0d0d] border border-white/10 rounded-2xl transition-colors duration-200";

export default function QuizHub() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [quizzes, setQuizzes] = useState([]);
  const [stats, setStats] = useState(null);
  const [streak, setStreak] = useState(0);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  // Topic Missions from AI pipeline
  const [missions, setMissions] = useState([]);
  const [missionsLoading, setMissionsLoading] = useState(true);

  // Refresher missions from spaced repetition engine
  const [refresherMissions, setRefresherMissions] = useState([]);

  // Teacher-assigned quizzes
  const [assignedQuizzes, setAssignedQuizzes] = useState([]);
  const [startingAssignment, setStartingAssignment] = useState(null);

  // New quiz modal
  const [showNewQuiz, setShowNewQuiz] = useState(false);
  const [newQuizTopic, setNewQuizTopic] = useState('');
  const [newQuizSubject, setNewQuizSubject] = useState('');
  const [creatingQuiz, setCreatingQuiz] = useState(false);
  const [quizMode, setQuizMode] = useState('mini_quiz');
  const [quizMarks, setQuizMarks] = useState(15);

  // Leaderboard
  const [leaderboardTab, setLeaderboardTab] = useState('Quizzes');

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    const load = async () => {
      const token = localStorage.getItem('newton-auth-token');
      if (!token) { router.push('/login'); return; }
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [quizRes, actRes, classRes] = await Promise.all([
          fetch('/api/quiz/user', { headers }),
          fetch('/api/student/activity', { headers }),
          fetch('/api/student/classes', { headers }),
        ]);
        const quizData = await quizRes.json();
        setQuizzes(quizData.quizzes || []);
        if (quizData.stats) setStats(quizData.stats);
        try {
          const actData = await actRes.json();
          setStreak(actData.streak || 0);
        } catch {}
        try {
          const classData = await classRes.json();
          setClasses(classData.classes || []);
        } catch {}
      } catch {}
      finally { setLoading(false); }

      // Fetch topic missions + refresher missions + assigned quizzes in background
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [sugRes, refRes, assignedRes] = await Promise.all([
          fetch('/api/quiz/suggestions', { headers }),
          fetch('/api/quiz/refresher-missions', { headers }).catch(() => null),
          fetch('/api/student/quiz-assignments', { headers }).catch(() => null),
        ]);
        if (sugRes.ok) {
          const sugData = await sugRes.json();
          setMissions(sugData.suggestions || []);
        }
        if (refRes?.ok) {
          const refData = await refRes.json();
          setRefresherMissions(refData.missions || []);
        }
        if (assignedRes?.ok) {
          const assignedData = await assignedRes.json();
          setAssignedQuizzes(assignedData.assignments || []);
        }
      } catch {}
      finally { setMissionsLoading(false); }
    };
    load();
  }, [mounted, router]);

  const handleCreateQuiz = async () => {
    if (!newQuizTopic.trim() || !newQuizSubject) return;
    setCreatingQuiz(true);
    try {
      const token = localStorage.getItem('newton-auth-token');
      const matchingClass = classes.find(c => c.subject === newQuizSubject);
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ topicName: newQuizTopic.trim(), subject: newQuizSubject, classId: matchingClass?.id || null, totalMarks: quizMarks, mode: quizMode }),
      });
      const data = await res.json();
      if (data.success && data.quiz) router.push(`/quiz/${data.quiz.id}`);
      else alert('Failed to create quiz: ' + (data.error || 'Unknown error'));
    } catch (err) { alert('Failed to create quiz: ' + err.message); }
    finally { setCreatingQuiz(false); setShowNewQuiz(false); setNewQuizTopic(''); setNewQuizSubject(''); setQuizMode('mini_quiz'); setQuizMarks(15); }
  };

  const startMissionQuiz = (mission) => {
    setNewQuizSubject(mission.subject);
    setNewQuizTopic(mission.topic);
    setShowNewQuiz(true);
  };

  const handleStartAssigned = async (assignment) => {
    if (assignment.completed) {
      router.push(`/quiz/${assignment.quizId}/results`);
      return;
    }
    if (assignment.started && assignment.quizId) {
      router.push(`/quiz/${assignment.quizId}`);
      return;
    }
    setStartingAssignment(assignment.id);
    try {
      const token = localStorage.getItem('newton-auth-token');
      const res = await fetch('/api/student/start-assigned-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ assignmentId: assignment.id }),
      });
      const data = await res.json();
      if (data.success && data.quizId) router.push(`/quiz/${data.quizId}`);
      else alert('Failed to start quiz: ' + (data.error || 'Unknown error'));
    } catch (err) {
      alert('Failed to start quiz: ' + err.message);
    } finally {
      setStartingAssignment(null);
    }
  };

  if (!mounted) return null;

  const activeClasses = classes.filter(c => !c.archived);
  const allSubjects = ['General', ...new Set(activeClasses.map(c => c.subject))];

  // Build a map of subject → spec info from classes
  const subjectSpecMap = {};
  activeClasses.forEach(c => {
    if (c.subject && c.qualTitle && !subjectSpecMap[c.subject]) {
      subjectSpecMap[c.subject] = { qualTitle: c.qualTitle, board: c.board };
    }
  });

  const filteredQuizzes = filter === 'all'
    ? quizzes
    : quizzes.filter(q => q.status === filter || (filter === 'in_progress' && q.status === 'in-progress'));

  // Fallback suggestions from recent quiz subjects (when AI pipeline has no data)
  const recentSubjects = [...new Set(quizzes.slice(0, 5).map(q => q.subject).filter(Boolean))];

  return (
    <div className="min-h-screen bg-black">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white tracking-tight">Quizzes</h1>
          <button
            onClick={() => setShowNewQuiz(true)}
            className="px-4 py-2 bg-[#0071e3] text-white text-sm font-semibold rounded-full hover:bg-[#0077ed] transition-colors"
          >
            + New
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-6 pb-24 md:pb-28 space-y-8">
        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {[1, 2].map(i => (
                <div key={i} className={`${cardBase} p-6 animate-pulse`}>
                  <div className="h-8 w-12 bg-white/[0.06] rounded mb-2" />
                  <div className="h-3 w-20 bg-white/[0.06] rounded" />
                </div>
              ))}
            </div>
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-white/[0.03] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* ── Top Stats ── */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`${cardBase} p-6`}>
                <p className="text-3xl font-bold text-white tracking-tight">
                  {streak > 0 ? `${streak}` : '0'}
                </p>
                <p className="text-sm text-white/40 mt-1">
                  {streak > 0 ? `Active for ${streak} consecutive day${streak !== 1 ? 's' : ''}` : 'Day streak'}
                </p>
              </div>
              <div className={`${cardBase} p-6`}>
                <p className="text-3xl font-bold text-white tracking-tight">
                  {stats?.completed || 0}
                </p>
                <p className="text-sm text-white/40 mt-1">
                  Quizzes taken{stats?.averageScore != null ? ` \u00b7 ${Math.round(stats.averageScore)}% avg` : ''}
                </p>
              </div>
            </div>

            {/* ── Exam Simulator ── */}
            <button
              onClick={() => {
                setNewQuizSubject(allSubjects[1] || 'General');
                setNewQuizTopic('Full Paper Simulation');
                setShowNewQuiz(true);
              }}
              className="w-full rounded-2xl p-5 bg-white text-black border border-white/20 hover:bg-white/90 transition-colors text-left group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-black/40 mb-1">Exam Simulator</p>
                  <p className="text-base font-bold tracking-tight">
                    Simulate {activeClasses[0]?.subject ? `${activeClasses[0].subject}` : 'Your'} 2026 Paper
                  </p>
                </div>
                <svg className="w-5 h-5 text-black/30 group-hover:text-black/60 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            </button>

            {/* ── Refresher Missions (Spaced Repetition) ── */}
            {refresherMissions.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-amber-400/60 uppercase tracking-wider mb-4">Retention Checks</h2>
                <div className="space-y-2">
                  {refresherMissions.map((rm) => (
                    <button
                      key={rm.id}
                      onClick={async () => {
                        const token = localStorage.getItem('newton-auth-token');
                        try {
                          const res = await fetch('/api/quiz/retention', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                            body: JSON.stringify({ masteryId: rm.mastery_id }),
                          });
                          const data = await res.json();
                          if (data.success) router.push(`/quiz/${data.quiz.id}`);
                        } catch {}
                      }}
                      className={`w-full ${cardBase} p-4 flex items-center gap-4 hover:border-amber-500/30 border-amber-500/20 text-left`}
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-amber-500/10">
                        <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{rm.topic || 'Retention Check'}</p>
                        <p className="text-xs text-amber-400/60 truncate">{rm.trigger_reason === 'decay_21_days' ? 'Knowledge fading — quick review' : 'Retention check due'}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 shrink-0">
                        Review
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Topic Missions (AI-driven) ── */}
            {missions.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4">Topic Missions</h2>
                <div className="space-y-2">
                  {missions.map((mission, idx) => (
                    <button
                      key={idx}
                      onClick={() => startMissionQuiz(mission)}
                      className={`w-full ${cardBase} p-4 flex items-center gap-4 hover:border-white/25 text-left`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        mission.type === 'blind_spot' ? 'bg-amber-500/10' : 'bg-[#0071e3]/10'
                      }`}>
                        {mission.type === 'blind_spot' ? (
                          <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                          </svg>
                        ) : (
                          <ClassIcon subject={mission.subject} size={20} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{mission.label}</p>
                        <p className="text-xs text-white/40 truncate">{mission.reason}</p>
                      </div>
                      {mission.mastery != null && (
                        <div className="shrink-0 flex items-center gap-1">
                          <div className="w-8 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#0071e3] rounded-full"
                              style={{ width: `${(mission.mastery / 5) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                      <svg className="w-4 h-4 text-white/20 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Fallback: Suggested for You (when no missions) ── */}
            {missions.length === 0 && !missionsLoading && recentSubjects.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4">Suggested for You</h2>
                <div className="space-y-2">
                  {recentSubjects.slice(0, 3).map(subject => (
                    <button
                      key={subject}
                      onClick={() => { setNewQuizSubject(subject); setShowNewQuiz(true); }}
                      className={`w-full ${cardBase} p-4 flex items-center gap-4 hover:border-white/25 text-left`}
                    >
                      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center shrink-0">
                        <ClassIcon subject={subject} size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white">{subject}</p>
                        <p className="text-xs text-white/40">Start a new quiz</p>
                      </div>
                      <svg className="w-4 h-4 text-white/20 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Assigned by Teacher ── */}
            {assignedQuizzes.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-[#0071e3]/60 uppercase tracking-wider mb-4">Assigned by Teacher</h2>
                <div className="space-y-2">
                  {assignedQuizzes.map(aq => {
                    const isOverdue = aq.dueDate && new Date(aq.dueDate) < new Date() && !aq.completed;
                    return (
                      <button
                        key={aq.id}
                        onClick={() => handleStartAssigned(aq)}
                        disabled={startingAssignment === aq.id}
                        className={`w-full ${cardBase} p-4 flex items-center gap-4 hover:border-white/25 text-left ${isOverdue ? 'border-red-500/20' : ''}`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          aq.completed ? 'bg-emerald-500/10' : 'bg-[#0071e3]/10'
                        }`}>
                          {aq.completed ? (
                            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          ) : (
                            <ClassIcon subject={aq.subject} size={20} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{aq.topicName}</p>
                          <p className={`text-xs truncate ${isOverdue ? 'text-red-400' : 'text-white/40'}`}>
                            {aq.className}{aq.dueDate ? ` · Due ${new Date(aq.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : ''}
                          </p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                          aq.completed
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : aq.started
                              ? 'bg-amber-500/15 text-amber-400'
                              : 'bg-[#0071e3]/15 text-[#0071e3]'
                        }`}>
                          {startingAssignment === aq.id ? 'Starting...' : aq.completed ? 'Done' : aq.started ? 'Continue' : 'Start'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Past Quizzes ── */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider">History</h2>
              </div>

              {/* Filter tabs */}
              <div className="flex gap-1 p-1 bg-white/5 rounded-lg mb-4">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'in_progress', label: 'Active' },
                  { key: 'completed', label: 'Done' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                      filter === key ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {filteredQuizzes.length > 0 ? (
                <div>
                  {filteredQuizzes.map((quiz, i) => {
                    const isComplete = quiz.status === 'completed';
                    const score = isComplete && quiz.total_questions
                      ? Math.round(((quiz.correct_count || 0) / quiz.total_questions) * 100)
                      : null;
                    const dateStr = quiz.completed_at
                      ? new Date(quiz.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                      : quiz.created_at
                        ? new Date(quiz.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                        : '';

                    return (
                      <Link
                        key={quiz.id}
                        href={isComplete ? `/quiz/${quiz.id}/results` : `/quiz/${quiz.id}`}
                        className={`flex items-center justify-between py-4 hover:bg-white/[0.02] -mx-2 px-2 rounded-lg transition-colors ${
                          i < filteredQuizzes.length - 1 ? 'border-b border-white/[0.05]' : ''
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-white truncate">
                              {quiz.topic_name || quiz.topicName || 'Untitled'}
                            </p>
                            {quiz.quiz_assignment_id ? (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[#0071e3]/15 text-[#0071e3] shrink-0">Set by Teacher</span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-white/5 text-white/30 shrink-0">Personal</span>
                            )}
                          </div>
                          <p className="text-xs text-white/30 mt-0.5">
                            {quiz.subject}{dateStr ? ` \u00b7 ${dateStr}` : ''}
                          </p>
                        </div>
                        <div className="shrink-0 ml-4">
                          {isComplete ? (
                            <span className={`text-sm font-semibold ${
                              score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-red-400'
                            }`}>
                              {score}%
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-[#0071e3]">Continue</span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <p className="text-white/30 text-sm mb-4">No quizzes yet</p>
                  <button
                    onClick={() => setShowNewQuiz(true)}
                    className="px-6 py-2.5 bg-[#0071e3] text-white text-sm font-semibold rounded-full hover:bg-[#0077ed] transition-colors"
                  >
                    Create Your First Quiz
                  </button>
                </div>
              )}
            </div>

            {/* ── Class Rankings ── */}
            <div className={`${cardBase} p-6`}>
              <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4">Class Rankings</h2>
              <div className="flex gap-1 p-1 bg-white/5 rounded-lg mb-4">
                {['Quizzes', 'Score', 'Streaks'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setLeaderboardTab(tab)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                      leaderboardTab === tab ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <p className="text-center text-white/30 text-sm py-8">Coming soon</p>
            </div>
          </>
        )}
      </main>

      {/* ── Navigation Dock ── */}
      <NavigationDock />

      {/* ── New Quiz Modal ── */}
      <AnimatePresence>
        {showNewQuiz && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowNewQuiz(false); setNewQuizTopic(''); setNewQuizSubject(''); setCreatingQuiz(false); setQuizMode('mini_quiz'); setQuizMarks(15); }} />
            <motion.div
              className="relative bg-neutral-900/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl max-w-sm w-full p-6"
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-bold text-white mb-1">Create a Quiz</h2>
              <p className="text-sm text-white/60 mb-5">Choose a subject and topic to test yourself.</p>
              {creatingQuiz && (
                <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                    <p className="text-sm text-blue-400">Creating your {quizMarks}-mark quiz...</p>
                  </div>
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-white/60 mb-1.5">Subject</label>
                  <select
                    value={newQuizSubject}
                    onChange={(e) => setNewQuizSubject(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="">Select a subject</option>
                    {allSubjects.map(s => (
                      <option key={s} value={s}>
                        {s}{subjectSpecMap[s] ? ` — ${subjectSpecMap[s].board}` : ''}
                      </option>
                    ))}
                  </select>
                  {newQuizSubject && subjectSpecMap[newQuizSubject] && (
                    <p className="mt-1.5 text-xs text-[#0071e3]/70 truncate">
                      {subjectSpecMap[newQuizSubject].board}: {subjectSpecMap[newQuizSubject].qualTitle}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white/60 mb-1.5">Topic</label>
                  <input
                    type="text"
                    value={newQuizTopic}
                    onChange={(e) => setNewQuizTopic(e.target.value)}
                    placeholder="e.g., Quadratic equations"
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder:text-white/30"
                    onKeyDown={(e) => e.key === 'Enter' && !creatingQuiz && newQuizSubject && handleCreateQuiz()}
                  />
                </div>

                {/* Mode selector */}
                <div>
                  <label className="block text-sm font-semibold text-white/60 mb-1.5">Mode</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'mini_quiz', label: 'Mini Quiz', desc: 'Quick revision', marks: 15 },
                      { id: 'full_test', label: 'Full Test', desc: 'Exam-style paper', marks: 50 },
                      { id: 'topic_focus', label: 'Topic Focus', desc: 'Deep dive', marks: 25 },
                      { id: 'past_paper', label: 'Past Paper', desc: 'Exam layout', marks: 75 },
                    ].map(m => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => { setQuizMode(m.id); setQuizMarks(m.marks); }}
                        className={`px-3 py-2 rounded-lg text-left text-xs transition-colors border ${
                          quizMode === m.id
                            ? 'bg-[#0071e3]/15 border-[#0071e3]/40 text-white'
                            : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20'
                        }`}
                      >
                        <p className="font-semibold">{m.label}</p>
                        <p className="text-[10px] opacity-60">{m.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Marks stepper */}
                <div>
                  <label className="block text-sm font-semibold text-white/60 mb-1.5">Total Marks</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setQuizMarks(m => Math.max(5, m - 5))}
                      className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 transition-colors text-lg font-bold"
                    >
                      -
                    </button>
                    <span className="text-white font-bold text-lg tabular-nums w-10 text-center">{quizMarks}</span>
                    <button
                      type="button"
                      onClick={() => setQuizMarks(m => Math.min(100, m + 5))}
                      className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 transition-colors text-lg font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => { setShowNewQuiz(false); setNewQuizTopic(''); setNewQuizSubject(''); setCreatingQuiz(false); setQuizMode('mini_quiz'); setQuizMarks(15); }}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white/60 font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateQuiz}
                  disabled={!newQuizTopic.trim() || !newQuizSubject || creatingQuiz}
                  className="flex-1 py-2.5 bg-[#0071e3] hover:bg-[#0077ed] disabled:bg-white/5 text-white disabled:text-white/30 font-semibold rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  {creatingQuiz ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating...</>
                  ) : 'Start Quiz'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
