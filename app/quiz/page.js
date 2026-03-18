'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ClassIcon } from '@/components/ClassIcons';
import AppSidebar from '@/components/AppSidebar';

const card = "bg-[var(--c-card)] border border-[var(--c-border)] rounded-2xl transition-colors duration-200";

export default function QuizHub() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [quizzes, setQuizzes] = useState([]);
  const [stats, setStats] = useState(null);
  const [streak, setStreak] = useState(0);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const [missions, setMissions] = useState([]);
  const [missionsLoading, setMissionsLoading] = useState(true);
  const [refresherMissions, setRefresherMissions] = useState([]);
  const [assignedQuizzes, setAssignedQuizzes] = useState([]);
  const [startingAssignment, setStartingAssignment] = useState(null);

  const [showNewQuiz, setShowNewQuiz] = useState(false);
  const [newQuizTopic, setNewQuizTopic] = useState('');
  const [newQuizSubject, setNewQuizSubject] = useState('');
  const [creatingQuiz, setCreatingQuiz] = useState(false);
  const [quizMode, setQuizMode] = useState('mini_quiz');
  const [quizMarks, setQuizMarks] = useState(15);
  const [genProgress, setGenProgress] = useState(0);
  const [genStep, setGenStep] = useState(0);

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
        try { const actData = await actRes.json(); setStreak(actData.streak || 0); } catch {}
        try { const classData = await classRes.json(); setClasses(classData.classes || []); } catch {}
      } catch {}
      finally { setLoading(false); }

      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [sugRes, refRes, assignedRes] = await Promise.all([
          fetch('/api/quiz/suggestions', { headers }),
          fetch('/api/quiz/refresher-missions', { headers }).catch(() => null),
          fetch('/api/student/quiz-assignments', { headers }).catch(() => null),
        ]);
        if (sugRes.ok) { const d = await sugRes.json(); setMissions(d.suggestions || []); }
        if (refRes?.ok) { const d = await refRes.json(); setRefresherMissions(d.missions || []); }
        if (assignedRes?.ok) { const d = await assignedRes.json(); setAssignedQuizzes(d.assignments || []); }
      } catch {}
      finally { setMissionsLoading(false); }
    };
    load();
  }, [mounted, router]);

  const GEN_STEPS = ['Setting up your quiz…', 'Generating questions…', 'Calibrating difficulty…', 'Finalising your quiz…'];

  const handleCreateQuiz = async () => {
    if (!newQuizTopic.trim() || !newQuizSubject) return;
    setCreatingQuiz(true);
    setGenProgress(0);
    setGenStep(0);
    const TICK_MS = 250;
    const TOTAL_MS = 18000;
    const MAX_PROGRESS = 87;
    const increment = MAX_PROGRESS / (TOTAL_MS / TICK_MS);
    let current = 0;
    const interval = setInterval(() => {
      current = Math.min(current + increment, MAX_PROGRESS);
      const rounded = Math.round(current);
      setGenProgress(rounded);
      setGenStep(rounded < 25 ? 0 : rounded < 50 ? 1 : rounded < 75 ? 2 : 3);
      if (current >= MAX_PROGRESS) clearInterval(interval);
    }, TICK_MS);
    try {
      const token = localStorage.getItem('newton-auth-token');
      const matchingClass = classes.find(c => c.subject === newQuizSubject);
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ topicName: newQuizTopic.trim(), subject: newQuizSubject, classId: matchingClass?.id || null, totalMarks: quizMarks, mode: quizMode }),
      });
      clearInterval(interval);
      const data = await res.json();
      if (data.success && data.quiz) {
        setGenProgress(100);
        setGenStep(3);
        setTimeout(() => router.push(`/quiz/${data.quiz.id}`), 400);
      } else {
        alert('Failed to create quiz: ' + (data.error || 'Unknown error'));
        setCreatingQuiz(false); setGenProgress(0); setGenStep(0);
      }
    } catch (err) {
      clearInterval(interval);
      alert('Failed to create quiz: ' + err.message);
      setCreatingQuiz(false); setGenProgress(0); setGenStep(0);
    }
  };

  const resetNewQuizModal = () => {
    setShowNewQuiz(false);
    setNewQuizTopic('');
    setNewQuizSubject('');
    setCreatingQuiz(false);
    setGenProgress(0);
    setGenStep(0);
    setQuizMode('mini_quiz');
    setQuizMarks(15);
  };

  const startMissionQuiz = (mission) => {
    setNewQuizSubject(mission.subject);
    setNewQuizTopic(mission.topic);
    setShowNewQuiz(true);
  };

  const handleStartAssigned = async (assignment) => {
    if (assignment.completed) { router.push(`/quiz/${assignment.quizId}/results`); return; }
    if (assignment.started && assignment.quizId) { router.push(`/quiz/${assignment.quizId}`); return; }
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
  const subjectSpecMap = {};
  activeClasses.forEach(c => {
    if (c.subject && c.qualTitle && !subjectSpecMap[c.subject])
      subjectSpecMap[c.subject] = { qualTitle: c.qualTitle, board: c.board };
  });

  const filteredQuizzes = filter === 'all'
    ? quizzes
    : quizzes.filter(q => q.status === filter || (filter === 'in_progress' && q.status === 'in-progress'));

  const recentSubjects = [...new Set(quizzes.slice(0, 5).map(q => q.subject).filter(Boolean))];

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--c-canvas)]">
      <AppSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* ── Header ── */}
        <header className="sticky top-0 z-40 border-b border-[var(--c-border)] bg-[var(--c-card)]">
          <div className="px-6 py-4 flex items-center justify-between">
            <h1 className="text-xl font-bold text-white tracking-tight">Quizzes</h1>
            <button
              onClick={() => setShowNewQuiz(true)}
              className="px-4 py-2 bg-[#0071E3] text-white text-sm font-semibold rounded-full hover:bg-[#0058B3] transition-colors"
            >
              + New
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto px-6 py-6 pb-10">
            {loading ? (
              <div className="flex gap-6">
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[1, 2].map(i => (
                      <div key={i} className={`${card} p-5 animate-pulse`}>
                        <div className="h-7 w-10 bg-white/8 rounded mb-2" />
                        <div className="h-3 w-20 bg-white/5 rounded" />
                      </div>
                    ))}
                  </div>
                  {[1, 2, 3].map(i => <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />)}
                </div>
                <div className="w-72 shrink-0 space-y-3">
                  {[1, 2].map(i => <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />)}
                </div>
              </div>
            ) : (
              <div className="flex gap-6 items-start">

                {/* ── Left column: Stats + History ── */}
                <div className="flex-1 min-w-0 space-y-5">

                  {/* Stats strip */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`${card} px-5 py-4`}>
                      <p className="text-2xl font-bold text-white tracking-tight">{streak > 0 ? streak : '0'}</p>
                      <p className="text-xs text-white/40 mt-0.5">
                        {streak > 0 ? `${streak} day streak` : 'Day streak'}
                      </p>
                    </div>
                    <div className={`${card} px-5 py-4`}>
                      <p className="text-2xl font-bold text-white tracking-tight">{stats?.completed || 0}</p>
                      <p className="text-xs text-white/40 mt-0.5">
                        Quizzes{stats?.averageScore != null ? ` · ${Math.round(stats.averageScore)}% avg` : ''}
                      </p>
                    </div>
                  </div>

                  {/* ── History ── */}
                  <div className={card}>
                    <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                      <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">History</p>
                    </div>

                    {/* Filter tabs */}
                    <div className="px-5 pb-3">
                      <div className="flex gap-1 p-1 bg-white/5 rounded-lg">
                        {[
                          { key: 'all', label: 'All' },
                          { key: 'in_progress', label: 'Active' },
                          { key: 'completed', label: 'Done' },
                        ].map(({ key, label }) => (
                          <button
                            key={key}
                            onClick={() => setFilter(key)}
                            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                              filter === key ? 'bg-[var(--c-card)] text-white' : 'text-white/40 hover:text-white/60'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {filteredQuizzes.length > 0 ? (
                      <div className="px-3 pb-3">
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
                              className={`flex items-center justify-between py-3 px-2 hover:bg-white/4 rounded-lg transition-colors ${
                                i < filteredQuizzes.length - 1 ? 'border-b border-[var(--c-border)]' : ''
                              }`}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium text-white truncate">
                                    {quiz.topic_name || quiz.topicName || 'Untitled'}
                                  </p>
                                  {quiz.quiz_assignment_id ? (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[#0071E3]/10 text-[#0071E3] shrink-0">Set</span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-white/5 text-white/30 shrink-0">Self</span>
                                  )}
                                </div>
                                <p className="text-xs text-white/30 mt-0.5">
                                  {quiz.subject}{dateStr ? ` · ${dateStr}` : ''}
                                </p>
                              </div>
                              <div className="shrink-0 ml-4">
                                {isComplete ? (
                                  <span className={`text-sm font-semibold ${
                                    score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-white/70' : 'text-red-400'
                                  }`}>
                                    {score}%
                                  </span>
                                ) : (
                                  <span className="text-xs font-semibold text-[#0071E3]">Continue</span>
                                )}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="px-5 pb-8 pt-4 text-center">
                        <p className="text-white/30 text-sm mb-4">No quizzes yet</p>
                        <button
                          onClick={() => setShowNewQuiz(true)}
                          className="px-5 py-2 bg-[#0071E3] text-white text-sm font-semibold rounded-full hover:bg-[#0058B3] transition-colors"
                        >
                          Create Your First Quiz
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Right column: Missions + Rankings ── */}
                <div className="w-72 xl:w-80 shrink-0 space-y-4">

                  {/* Exam Simulator */}
                  <button
                    onClick={() => {
                      setNewQuizSubject(allSubjects[1] || 'General');
                      setNewQuizTopic('Full Paper Simulation');
                      setShowNewQuiz(true);
                    }}
                    className={`w-full ${card} p-4 hover:border-[var(--c-border-strong)] hover:bg-[var(--c-card-hover)] text-left group`}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/30 mb-1">Exam Simulator</p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-white tracking-tight">
                        {activeClasses[0]?.subject ? `${activeClasses[0].subject} 2026 Paper` : 'Simulate a Paper'}
                      </p>
                      <svg className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </div>
                  </button>

                  {/* Retention Checks */}
                  {refresherMissions.length > 0 && (
                    <div className={card}>
                      <p className="px-4 pt-4 pb-2 text-[10px] font-bold uppercase tracking-wider text-white/30">Retention Checks</p>
                      <div className="px-2 pb-2 space-y-1">
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
                            className="w-full px-3 py-2.5 flex items-center gap-3 rounded-lg hover:bg-white/5 text-left transition-colors"
                          >
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[#0071E3]/10">
                              <svg className="w-4 h-4 text-[#0071E3]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-white truncate">{rm.topic || 'Retention Check'}</p>
                              <p className="text-[10px] text-white/40 truncate">
                                {rm.trigger_reason === 'decay_21_days' ? 'Knowledge fading' : 'Due for review'}
                              </p>
                            </div>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[#0071E3]/10 text-[#0071E3] shrink-0">Review</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Topic Missions */}
                  {missions.length > 0 && (
                    <div className={card}>
                      <p className="px-4 pt-4 pb-2 text-[10px] font-bold uppercase tracking-wider text-white/30">Topic Missions</p>
                      <div className="px-2 pb-2 space-y-1">
                        {missions.map((mission, idx) => (
                          <button
                            key={idx}
                            onClick={() => startMissionQuiz(mission)}
                            className="w-full px-3 py-2.5 flex items-center gap-3 rounded-lg hover:bg-white/5 text-left transition-colors"
                          >
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-white/5">
                              {mission.type === 'blind_spot' ? (
                                <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                </svg>
                              ) : (
                                <ClassIcon subject={mission.subject} size={16} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-white truncate">{mission.label}</p>
                              <p className="text-[10px] text-white/40 truncate">{mission.reason}</p>
                            </div>
                            {mission.mastery != null && (
                              <div className="w-8 h-1 bg-white/8 rounded-full overflow-hidden shrink-0">
                                <div className="h-full bg-[#0071E3] rounded-full" style={{ width: `${(mission.mastery / 5) * 100}%` }} />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fallback suggestions */}
                  {missions.length === 0 && !missionsLoading && recentSubjects.length > 0 && (
                    <div className={card}>
                      <p className="px-4 pt-4 pb-2 text-[10px] font-bold uppercase tracking-wider text-white/30">Suggested for You</p>
                      <div className="px-2 pb-2 space-y-1">
                        {recentSubjects.slice(0, 3).map(subject => (
                          <button
                            key={subject}
                            onClick={() => { setNewQuizSubject(subject); setShowNewQuiz(true); }}
                            className="w-full px-3 py-2.5 flex items-center gap-3 rounded-lg hover:bg-white/5 text-left transition-colors"
                          >
                            <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center shrink-0">
                              <ClassIcon subject={subject} size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-white">{subject}</p>
                              <p className="text-[10px] text-white/40">Start a new quiz</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Assigned by Teacher */}
                  {assignedQuizzes.length > 0 && (
                    <div className={card}>
                      <p className="px-4 pt-4 pb-2 text-[10px] font-bold uppercase tracking-wider text-white/30">Assigned</p>
                      <div className="px-2 pb-2 space-y-1">
                        {assignedQuizzes.map(aq => {
                          const isOverdue = aq.dueDate && new Date(aq.dueDate) < new Date() && !aq.completed;
                          return (
                            <button
                              key={aq.id}
                              onClick={() => handleStartAssigned(aq)}
                              disabled={startingAssignment === aq.id}
                              className="w-full px-3 py-2.5 flex items-center gap-3 rounded-lg hover:bg-white/5 text-left transition-colors"
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                aq.completed ? 'bg-emerald-500/10' : 'bg-[#0071E3]/10'
                              }`}>
                                {aq.completed ? (
                                  <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                ) : (
                                  <ClassIcon subject={aq.subject} size={16} />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-white truncate">{aq.topicName}</p>
                                <p className={`text-[10px] truncate ${isOverdue ? 'text-red-400' : 'text-white/40'}`}>
                                  {aq.className}{aq.dueDate ? ` · Due ${new Date(aq.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : ''}
                                </p>
                              </div>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider shrink-0 ${
                                aq.completed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[#0071E3]/10 text-[#0071E3]'
                              }`}>
                                {startingAssignment === aq.id ? '…' : aq.completed ? 'Done' : aq.started ? 'Resume' : 'Start'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Class Rankings */}
                  <div className={card}>
                    <p className="px-4 pt-4 pb-2 text-[10px] font-bold uppercase tracking-wider text-white/30">Class Rankings</p>
                    <div className="px-4 pb-2">
                      <div className="flex gap-1 p-1 bg-white/5 rounded-lg mb-3">
                        {['Quizzes', 'Score', 'Streaks'].map(tab => (
                          <button
                            key={tab}
                            onClick={() => setLeaderboardTab(tab)}
                            className={`flex-1 py-1.5 text-[10px] font-semibold rounded-md transition-colors ${
                              leaderboardTab === tab ? 'bg-[var(--c-card)] text-white' : 'text-white/40 hover:text-white/60'
                            }`}
                          >
                            {tab}
                          </button>
                        ))}
                      </div>
                      <p className="text-center text-white/30 text-xs py-4">Coming soon</p>
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── New Quiz Modal ── */}
      <AnimatePresence>
        {showNewQuiz && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { if (!creatingQuiz) resetNewQuizModal(); }} />
            <motion.div
              className="relative bg-[var(--c-card)] border border-[var(--c-border)] rounded-2xl shadow-2xl max-w-sm w-full p-6"
              initial={{ scale: 0.96, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 8 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <AnimatePresence mode="wait">
                {creatingQuiz ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="py-4"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-lg bg-[#0071E3]/10 flex items-center justify-center shrink-0">
                        <ClassIcon subject={newQuizSubject} size={14} />
                      </div>
                      <div>
                        <p className="text-xs text-white/40">{newQuizSubject}</p>
                        <p className="text-sm font-semibold text-white leading-tight">{newQuizTopic}</p>
                      </div>
                    </div>
                    <div className="mb-3">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-xs text-white/40">{GEN_STEPS[genStep]}</p>
                        <p className="text-xs font-bold text-[#0071E3] tabular-nums">{genProgress}%</p>
                      </div>
                      <div className="h-1 bg-white/8 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-[#0071E3]"
                          style={{ width: `${genProgress}%` }}
                          transition={{ duration: 0.3, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-4">
                      {GEN_STEPS.map((_, i) => (
                        <div key={i} className={`h-0.5 flex-1 rounded-full transition-all duration-300 ${i <= genStep ? 'bg-[#0071E3]' : 'bg-white/10'}`} />
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h2 className="text-base font-bold text-white mb-1">Create a Quiz</h2>
                    <p className="text-xs text-white/40 mb-5">Choose a subject and topic to test yourself.</p>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-white/40 mb-1.5">Subject</label>
                        <select
                          value={newQuizSubject}
                          onChange={(e) => setNewQuizSubject(e.target.value)}
                          className="w-full px-3 py-2.5 bg-[var(--bg-elevated)] border border-[var(--c-border)] rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0071E3]/30 focus:border-[#0071E3]/40"
                          style={{ colorScheme: 'dark' }}
                        >
                          <option value="">Select a subject</option>
                          {allSubjects.map(s => (
                            <option key={s} value={s}>
                              {s}{subjectSpecMap[s] ? ` — ${subjectSpecMap[s].board}` : ''}
                            </option>
                          ))}
                        </select>
                        {newQuizSubject && subjectSpecMap[newQuizSubject] && (
                          <p className="mt-1.5 text-xs text-[#0071E3] truncate">
                            {subjectSpecMap[newQuizSubject].board}: {subjectSpecMap[newQuizSubject].qualTitle}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-white/40 mb-1.5">Topic</label>
                        <input
                          type="text"
                          value={newQuizTopic}
                          onChange={(e) => setNewQuizTopic(e.target.value)}
                          placeholder="e.g., Quadratic equations"
                          className="w-full px-3 py-2.5 bg-[var(--bg-elevated)] border border-[var(--c-border)] rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0071E3]/30 focus:border-[#0071E3]/40 placeholder:text-white/30"
                          onKeyDown={(e) => e.key === 'Enter' && !creatingQuiz && newQuizSubject && handleCreateQuiz()}
                        />
                      </div>

                      {/* Mode selector */}
                      <div>
                        <label className="block text-xs font-semibold text-white/40 mb-1.5">Mode</label>
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
                                  ? 'bg-[#0071E3]/10 border-[#0071E3]/30 text-[#0071E3]'
                                  : 'bg-[var(--bg-elevated)] border-[var(--c-border)] text-white/40 hover:border-[var(--c-border-strong)] hover:text-white/60'
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
                        <label className="block text-xs font-semibold text-white/40 mb-1.5">Total Marks</label>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setQuizMarks(m => Math.max(5, m - 5))}
                            className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-[var(--c-border)] text-white/50 hover:bg-white/8 transition-colors text-base font-bold"
                          >
                            −
                          </button>
                          <span className="text-white font-bold text-base tabular-nums w-10 text-center">{quizMarks}</span>
                          <button
                            type="button"
                            onClick={() => setQuizMarks(m => Math.min(100, m + 5))}
                            className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-[var(--c-border)] text-white/50 hover:bg-white/8 transition-colors text-base font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-5">
                      <button
                        onClick={() => resetNewQuizModal()}
                        className="flex-1 py-2.5 bg-white/5 hover:bg-white/8 text-white/50 font-semibold rounded-xl text-sm transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreateQuiz}
                        disabled={!newQuizTopic.trim() || !newQuizSubject}
                        className="flex-1 py-2.5 bg-[#0071E3] hover:bg-[#0058B3] disabled:bg-white/5 text-white disabled:text-white/30 font-semibold rounded-xl text-sm transition-colors"
                      >
                        Start Quiz
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
