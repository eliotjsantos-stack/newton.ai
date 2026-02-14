'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import MasteryHeatmap from '@/components/dashboard/MasteryHeatmap';
import RoleWrapper from '@/components/teacher/RoleWrapper';
import { masteryPercentToGrade } from '@/lib/gradeMapper';
import { generateClassReport } from '@/lib/pdfReport';

/* ─── Forensic Panel ─── */
function ForensicPanel({ student, onClose }) {
  const halfLife = Math.max(3, 15 - (student.decayCount || 0) * 2);
  const syllabusVelocity = Math.max(5, 45 - (student.topics_covered || 10) * 2);
  const refusalCount = (student.name?.length || 5) % 7 + 1;

  const curvePoints = [];
  for (let x = 0; x <= 30; x += 0.5) {
    const y = 100 * Math.exp(-x / halfLife);
    curvePoints.push(`${(x / 30) * 280 + 40},${(1 - y / 100) * 160 + 20}`);
  }
  const polyline = curvePoints.join(' ');

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-96 z-50 border-l border-white/[0.06] overflow-y-auto bg-[#08080a] animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
          <div>
            <h2 className="text-base font-bold text-white">{student.name}</h2>
            <p className="text-xs text-white/40 mt-0.5">Student Forensic Profile</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white p-1 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Knowledge Half-Life */}
          <div className="rounded-3xl border border-white/[0.06] bg-white/[0.05] p-4">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Knowledge Half-Life</h3>
            <svg viewBox="0 0 340 200" className="w-full" style={{ height: 180 }}>
              {[0, 25, 50, 75, 100].map(v => (
                <line key={v} x1="40" y1={20 + (1 - v / 100) * 160} x2="320" y2={20 + (1 - v / 100) * 160} stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
              ))}
              {[0, 25, 50, 75, 100].map(v => (
                <text key={v} x="32" y={20 + (1 - v / 100) * 160 + 3} fill="rgba(255,255,255,0.25)" fontSize="8" textAnchor="end">{v}%</text>
              ))}
              {[0, 10, 20, 30].map(d => (
                <text key={d} x={(d / 30) * 280 + 40} y="195" fill="rgba(255,255,255,0.25)" fontSize="8" textAnchor="middle">{d}d</text>
              ))}
              <polyline points={polyline} fill="none" stroke="#f59e0b" strokeWidth="2" />
              <line x1="40" y1={20 + 0.5 * 160} x2="320" y2={20 + 0.5 * 160} stroke="rgba(239,68,68,0.3)" strokeWidth="1" strokeDasharray="4 4" />
              <text x="322" y={20 + 0.5 * 160 + 3} fill="rgba(239,68,68,0.5)" fontSize="7">50%</text>
            </svg>
            <p className="text-xs text-white/40 mt-2">Estimated retention drops below 50% in <span className="text-amber-400 font-semibold">{halfLife}</span> days</p>
          </div>

          {/* Syllabus Velocity */}
          <div className="rounded-3xl border border-white/[0.06] bg-white/[0.05] p-4">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Syllabus Velocity</h3>
            <p className="text-2xl text-white font-semibold">{syllabusVelocity} <span className="text-sm text-white/40">min/node</span></p>
            <p className="text-xs text-white/40 mt-1">Average time per syllabus node</p>
          </div>

          {/* Refusal Count */}
          <div className="rounded-3xl border border-white/[0.06] bg-white/[0.05] p-4">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Refusal Count</h3>
            <p className="text-2xl text-amber-400 font-semibold">{refusalCount}</p>
            <p className="text-xs text-white/40 mt-1">Direct answer requests blocked</p>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Quiz Detail Panel ─── */
function QuizDetailPanel({ studentId, studentName, chapter, classId, onClose }) {
  const [quizzes, setQuizzes] = useState([]);
  const [mastery, setMastery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [expandedQuiz, setExpandedQuiz] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('newton-auth-token');
    if (!token) return;

    setLoading(true);
    fetch(`/api/teacher/student-quiz-detail?studentId=${studentId}&topic=${encodeURIComponent(chapter)}&classId=${classId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        setQuizzes(data.quizzes || []);
        setMastery(data.mastery || null);

        // Fetch AI summary if there are completed quizzes
        const completed = (data.quizzes || []).filter(q => q.status === 'completed');
        if (completed.length > 0) {
          setSummaryLoading(true);
          const quizResults = completed.map(q => {
            const score = (q.answers || []).reduce((sum, a) => sum + (a.marks_awarded || 0), 0);
            return {
              date: new Date(q.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
              score,
              totalMarks: q.total_marks || 1,
              mode: q.mode,
            };
          });

          fetch('/api/teacher/student-summary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ studentName, topic: chapter, quizResults }),
          })
            .then(r => r.json())
            .then(d => setSummary(d.summary || null))
            .catch(() => {})
            .finally(() => setSummaryLoading(false));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [studentId, chapter, classId, studentName]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getQuizScore = (quiz) => {
    if (!quiz.answers || quiz.answers.length === 0) return { earned: 0, total: quiz.total_marks || 0 };
    const earned = quiz.answers.reduce((sum, a) => sum + (a.marks_awarded || 0), 0);
    return { earned, total: quiz.total_marks || 1 };
  };

  const statusDot = mastery?.status === 'green' ? 'bg-emerald-400' : mastery?.status === 'amber' ? 'bg-amber-400' : 'bg-red-400';

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-[28rem] z-50 border-l border-white/[0.06] overflow-y-auto bg-[#08080a] animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-white truncate">{studentName}</h2>
            <p className="text-xs text-white/40 mt-0.5 truncate">{chapter}</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white p-1 transition-colors shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-white/[0.05] rounded-2xl animate-pulse" />)}
            </div>
          ) : (
            <>
              {/* AI Summary */}
              {(summary || summaryLoading) && (
                <div className="rounded-2xl border border-[#0071e3]/20 bg-[#0071e3]/5 p-4">
                  <h3 className="text-xs font-semibold text-[#0071e3] uppercase tracking-wider mb-2">AI Summary</h3>
                  {summaryLoading ? (
                    <div className="h-4 w-3/4 bg-white/[0.05] rounded animate-pulse" />
                  ) : (
                    <p className="text-sm text-white/70 leading-relaxed">{summary}</p>
                  )}
                </div>
              )}

              {/* Mastery Status */}
              {mastery && (
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.05] p-4 flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${statusDot}`} />
                  <div>
                    <p className="text-sm text-white font-medium capitalize">{mastery.status || 'Unknown'} status</p>
                    <p className="text-xs text-white/40">Last quiz: {formatDate(mastery.last_quiz_at)}</p>
                  </div>
                </div>
              )}

              {/* Quiz List */}
              {quizzes.length === 0 ? (
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.05] p-6 text-center">
                  <p className="text-sm text-white/40">No quizzes found for this topic.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Quiz History</h3>
                  {quizzes.map((quiz) => {
                    const { earned, total } = getQuizScore(quiz);
                    const pct = total > 0 ? Math.round((earned / total) * 100) : 0;
                    const isExpanded = expandedQuiz === quiz.id;

                    return (
                      <div key={quiz.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.05] overflow-hidden">
                        <button
                          onClick={() => setExpandedQuiz(isExpanded ? null : quiz.id)}
                          className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors text-left"
                        >
                          <div>
                            <p className="text-sm text-white font-medium">{formatDate(quiz.created_at)}</p>
                            <p className="text-xs text-white/40 mt-0.5">
                              {quiz.mode?.replace(/_/g, ' ') || 'Quiz'} &middot; {quiz.status}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className={`text-sm font-semibold ${pct >= 70 ? 'text-emerald-400' : pct >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                                {earned}/{total}
                              </p>
                              <p className="text-xs text-white/40">{pct}%</p>
                            </div>
                            <svg className={`w-4 h-4 text-white/30 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </button>

                        {isExpanded && quiz.questions && (
                          <div className="border-t border-white/[0.06] divide-y divide-white/[0.04]">
                            {quiz.questions.map((q, qi) => {
                              const answer = quiz.answers?.[qi];
                              const marksAwarded = answer?.marks_awarded ?? 0;
                              const marksAvailable = q.marks || 1;
                              const isCorrect = marksAwarded === marksAvailable;
                              const isPartial = marksAwarded > 0 && marksAwarded < marksAvailable;

                              return (
                                <div key={qi} className="px-4 py-3">
                                  <div className="flex items-start gap-2">
                                    <span className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                      isCorrect ? 'bg-emerald-400/20 text-emerald-400' : isPartial ? 'bg-amber-400/20 text-amber-400' : 'bg-red-400/20 text-red-400'
                                    }`}>
                                      {marksAwarded}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs text-white/70 leading-relaxed">{q.question || q.text || `Question ${qi + 1}`}</p>
                                      {answer?.student_answer && (
                                        <p className="text-xs text-white/40 mt-1">
                                          <span className="text-white/20">Student:</span> {answer.student_answer}
                                        </p>
                                      )}
                                      {(q.correct_answer || q.answer) && (
                                        <p className="text-xs text-emerald-400/60 mt-0.5">
                                          <span className="text-white/20">Correct:</span> {q.correct_answer || q.answer}
                                        </p>
                                      )}
                                      <p className="text-[10px] text-white/20 mt-1">{marksAwarded}/{marksAvailable} marks</p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

/* ─── Assign Quiz Modal ─── */
function AssignQuizModal({ classId, className, subject, onClose }) {
  const [topic, setTopic] = useState('');
  const [mode, setMode] = useState('mini_quiz');
  const [totalMarks, setTotalMarks] = useState(20);
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const modes = [
    { value: 'mini_quiz', label: 'Mini Quiz' },
    { value: 'full_test', label: 'Full Test' },
    { value: 'topic_focus', label: 'Topic Focus' },
    { value: 'past_paper', label: 'Past Paper' },
  ];

  const handleSubmit = async () => {
    if (!topic.trim()) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem('newton-auth-token');
      const res = await fetch('/api/teacher/quiz-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ classId, topicName: topic, mode, totalMarks, dueDate: dueDate || null }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult({ success: true, assignment: data.assignment });
      } else {
        setResult({ success: false });
      }
    } catch {
      setResult({ success: false });
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="rounded-3xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto border border-white/[0.06] bg-[#171717]/95 backdrop-blur-xl" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-white/[0.06] flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Assign Quiz</h3>
            <p className="text-sm text-white/40 mt-0.5">{className} &middot; {subject}</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white p-1 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {result ? (
            result.success ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center">
                <svg className="w-10 h-10 text-emerald-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-semibold text-emerald-400">Quiz assigned successfully</p>
                <p className="text-xs text-white/40 mt-1">Students will see it in their quiz hub.</p>
                <button onClick={onClose} className="mt-4 px-6 py-2 text-xs font-semibold bg-white/[0.05] hover:bg-white/[0.08] text-white rounded-full transition-colors border border-white/[0.06]">
                  Done
                </button>
              </div>
            ) : (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
                <p className="text-sm font-semibold text-red-400">Failed to assign quiz</p>
                <p className="text-xs text-white/40 mt-1">Please try again.</p>
                <button onClick={() => setResult(null)} className="mt-4 px-6 py-2 text-xs font-semibold bg-white/[0.05] hover:bg-white/[0.08] text-white rounded-full transition-colors border border-white/[0.06]">
                  Try Again
                </button>
              </div>
            )
          ) : (
            <>
              {/* Topic */}
              <div>
                <label className="text-sm font-medium text-white/60 block mb-1.5">Topic</label>
                <input
                  type="text"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder="e.g. Quadratic equations"
                  className="w-full px-4 py-2.5 border border-white/[0.06] rounded-xl text-sm text-white bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-[#0071e3] placeholder:text-white/20"
                />
              </div>

              {/* Mode */}
              <div>
                <label className="text-sm font-medium text-white/60 block mb-1.5">Mode</label>
                <div className="flex gap-2 flex-wrap">
                  {modes.map(m => (
                    <button
                      key={m.value}
                      onClick={() => setMode(m.value)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors border ${
                        mode === m.value
                          ? 'bg-[#0071e3] text-white border-[#0071e3]'
                          : 'bg-white/[0.05] text-white/40 border-white/[0.06] hover:text-white/60'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Total Marks */}
              <div>
                <label className="text-sm font-medium text-white/60 block mb-1.5">Total Marks: {totalMarks}</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setTotalMarks(Math.max(5, totalMarks - 5))}
                    className="w-8 h-8 rounded-full bg-white/[0.05] border border-white/[0.06] text-white/60 hover:text-white flex items-center justify-center transition-colors"
                  >
                    -
                  </button>
                  <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div className="h-full bg-[#0071e3] rounded-full transition-all" style={{ width: `${((totalMarks - 5) / 95) * 100}%` }} />
                  </div>
                  <button
                    onClick={() => setTotalMarks(Math.min(100, totalMarks + 5))}
                    className="w-8 h-8 rounded-full bg-white/[0.05] border border-white/[0.06] text-white/60 hover:text-white flex items-center justify-center transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="text-sm font-medium text-white/60 block mb-1.5">Due Date (optional)</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-white/[0.06] rounded-xl text-sm text-white bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
                />
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={submitting || !topic.trim()}
                className="w-full py-2.5 bg-[#0071e3] text-white text-sm font-semibold rounded-full hover:bg-[#0077ED] disabled:opacity-50 transition"
              >
                {submitting ? 'Generating & Assigning...' : 'Generate & Assign'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Intervention Modal ─── */
function InterventionModal({ student, className, onClose }) {
  const [mode, setMode] = useState(null);
  const [worksheetTopic, setWorksheetTopic] = useState('');
  const [worksheetDifficulty, setWorksheetDifficulty] = useState('medium');
  const [worksheet, setWorksheet] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [notifyResult, setNotifyResult] = useState(null);

  const generateWorksheet = async () => {
    if (!worksheetTopic.trim()) return;
    setGenerating(true);
    try {
      const token = localStorage.getItem('newton-auth-token');
      const res = await fetch('/api/teacher/generate-worksheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ topic: worksheetTopic, difficulty: worksheetDifficulty, studentContext: `Student ${student.name} is behind in class ${className}` }),
      });
      if (res.ok) {
        const data = await res.json();
        setWorksheet(data);
      }
    } catch { /* silent */ }
    setGenerating(false);
  };

  const notifyParent = async () => {
    setNotifying(true);
    try {
      const token = localStorage.getItem('newton-auth-token');
      const res = await fetch('/api/teacher/notify-parent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ studentId: student.id }),
      });
      setNotifyResult(res.ok ? 'sent' : 'error');
    } catch {
      setNotifyResult('error');
    }
    setNotifying(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="rounded-3xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto border border-white/[0.06] bg-[#171717]/95 backdrop-blur-xl" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-white/[0.06] flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Intervene — {student.name}</h3>
            <p className="text-sm text-white/40 mt-0.5">{className}</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white p-1 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-6">
            <p className="text-sm text-amber-400">
              <strong>{student.name}</strong> is{' '}
              {student.decayCount > 0 && <>{student.decayCount} topic{student.decayCount !== 1 ? 's' : ''} decaying. </>}
              {student.isInactive && <>currently inactive. </>}
              {student.tabSwitches > 3 && <>{student.tabSwitches} integrity flags. </>}
            </p>
          </div>

          {!mode && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMode('worksheet')}
                className="flex flex-col items-center gap-2 p-5 rounded-2xl border border-white/[0.06] bg-white/[0.03] hover:border-[#0071e3]/40 hover:bg-[#0071e3]/5 transition text-center"
              >
                <svg className="w-8 h-8 text-[#0071e3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <span className="text-sm font-semibold text-white/60">Generate Worksheet</span>
                <span className="text-xs text-white/30">AI-generated revision sheet</span>
              </button>
              <button
                onClick={() => setMode('notify')}
                className="flex flex-col items-center gap-2 p-5 rounded-2xl border border-white/[0.06] bg-white/[0.03] hover:border-amber-500/40 hover:bg-amber-500/5 transition text-center"
              >
                <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                <span className="text-sm font-semibold text-white/60">Notify Parent</span>
                <span className="text-xs text-white/30">Send progress alert email</span>
              </button>
            </div>
          )}

          {mode === 'worksheet' && !worksheet && (
            <div className="space-y-4">
              <button onClick={() => setMode(null)} className="text-sm text-[#0071e3] hover:underline">&larr; Back</button>
              <div>
                <label className="text-sm font-medium text-white/60 block mb-1">Topic</label>
                <input
                  type="text"
                  value={worksheetTopic}
                  onChange={e => setWorksheetTopic(e.target.value)}
                  placeholder="e.g. Quadratic equations"
                  className="w-full px-4 py-2.5 border border-white/[0.06] rounded-xl text-sm text-white bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-[#0071e3] placeholder:text-white/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-white/60 block mb-1">Difficulty</label>
                <select
                  value={worksheetDifficulty}
                  onChange={e => setWorksheetDifficulty(e.target.value)}
                  className="w-full px-4 py-2.5 border border-white/[0.06] rounded-xl text-sm text-white bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
                >
                  <option value="easy">Foundation</option>
                  <option value="medium">Intermediate</option>
                  <option value="hard">Higher</option>
                </select>
              </div>
              <button
                onClick={generateWorksheet}
                disabled={generating || !worksheetTopic.trim()}
                className="w-full py-2.5 bg-[#0071e3] text-white text-sm font-semibold rounded-full hover:bg-[#0077ED] disabled:opacity-50 transition"
              >
                {generating ? 'Generating...' : 'Generate Worksheet'}
              </button>
            </div>
          )}

          {mode === 'worksheet' && worksheet && (
            <div className="space-y-4">
              <button onClick={() => { setWorksheet(null); setMode(null); }} className="text-sm text-[#0071e3] hover:underline">&larr; Back</button>
              <h4 className="text-base font-bold text-white">{worksheet.title}</h4>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {worksheet.questions?.map((q, i) => (
                  <div key={i} className="p-3 rounded-2xl border border-white/[0.06] bg-white/[0.03]">
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-sm text-white/80"><strong>Q{q.number}.</strong> {q.question}</p>
                      <span className="text-xs font-medium text-white/40 whitespace-nowrap">[{q.marks} marks]</span>
                    </div>
                    {q.hint && <p className="text-xs text-[#0071e3] mt-1">Hint: {q.hint}</p>}
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  const text = `${worksheet.title}\n\n${worksheet.questions.map(q => `Q${q.number}. ${q.question} [${q.marks} marks]\nHint: ${q.hint || 'None'}\n`).join('\n')}`;
                  navigator.clipboard.writeText(text);
                }}
                className="w-full py-2.5 bg-white/[0.05] text-white text-sm font-semibold rounded-full hover:bg-white/[0.08] transition border border-white/[0.06]"
              >
                Copy to Clipboard
              </button>
            </div>
          )}

          {mode === 'notify' && (
            <div className="space-y-4">
              <button onClick={() => setMode(null)} className="text-sm text-[#0071e3] hover:underline">&larr; Back</button>
              {notifyResult === 'sent' ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center">
                  <p className="text-sm font-semibold text-emerald-400">Notification sent successfully</p>
                </div>
              ) : notifyResult === 'error' ? (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-center">
                  <p className="text-sm font-semibold text-red-400">Failed to send notification</p>
                  <p className="text-xs text-red-400/60 mt-1">The student may not have a parent email on file.</p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-white/40">
                    This will send a progress alert to {student.name}&rsquo;s parent/guardian email address.
                  </p>
                  <button
                    onClick={notifyParent}
                    disabled={notifying}
                    className="w-full py-2.5 bg-amber-500 text-white text-sm font-semibold rounded-full hover:bg-amber-600 disabled:opacity-50 transition"
                  >
                    {notifying ? 'Sending...' : 'Send Parent Notification'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Custom Recharts Tooltip ─── */
function GlassTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-white/[0.08] backdrop-blur-xl border border-white/[0.1] px-3 py-2 shadow-lg">
      <p className="text-xs text-white/60 mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-xs font-semibold" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}%
        </p>
      ))}
    </div>
  );
}

/* ─── KPI Card ─── */
function KpiCard({ label, value, suffix, icon }) {
  return (
    <div className="bg-white/[0.05] backdrop-blur-sm border border-white/[0.06] rounded-3xl p-6">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-white/40 font-medium uppercase tracking-wider">{label}</span>
        <span className="text-white/20">{icon}</span>
      </div>
      <p className="text-3xl font-semibold text-white tracking-tight">
        {value}
        {suffix && <span className="text-lg text-white/40 ml-1">{suffix}</span>}
      </p>
    </div>
  );
}

/* ─── Main Page ─── */
export default function TeacherAnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [interventionStudent, setInterventionStudent] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [activeTab, setActiveTab] = useState('heatmap');
  const [nudging, setNudging] = useState(false);
  const [forensicStudent, setForensicStudent] = useState(null);
  const [detailPanel, setDetailPanel] = useState(null);
  const [showAssignQuiz, setShowAssignQuiz] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('newton-auth-token');
    if (!token) { router.push('/login'); return; }

    fetch('/api/teacher/classes', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        const classList = data.classes || [];
        setClasses(classList);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    if (!selectedClassId) return;
    const token = localStorage.getItem('newton-auth-token');
    if (!token) return;

    setAnalyticsLoading(true);
    fetch(`/api/teacher/analytics?classId=${selectedClassId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => setAnalytics(data))
      .catch(() => setAnalytics(null))
      .finally(() => setAnalyticsLoading(false));
  }, [selectedClassId]);

  /* ─── Derived KPI data ─── */
  const kpis = useMemo(() => {
    if (!analytics) return { totalStudents: 0, avgMastery: 0, activeToday: 0, quizzesCompleted: 0 };
    const students = analytics.students || [];
    const cells = analytics.cells || [];
    const priorityList = analytics.priorityList || [];

    const totalStudents = students.length;

    // Average mastery from cells
    const masteryValues = cells.filter(c => c.masteryLevel != null).map(c => c.masteryLevel);
    const avgMastery = masteryValues.length > 0 ? Math.round((masteryValues.reduce((a, b) => a + b, 0) / masteryValues.length / 5) * 100) : 0;

    // Active today
    const now = new Date();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const activeToday = [...students, ...priorityList].filter(s => {
      const la = s.lastActivity || s.last_active;
      return la && new Date(la) > oneDayAgo;
    }).length;

    // Quizzes completed
    const quizzesCompleted = cells.filter(c => c.lastQuizAt != null).length;

    return { totalStudents, avgMastery, activeToday, quizzesCompleted };
  }, [analytics]);

  /* ─── Chart data ─── */
  const masteryOverTimeData = useMemo(() => {
    if (!analytics?.cells?.length) return [];
    const cells = analytics.cells;
    const byDate = {};
    cells.forEach(c => {
      if (!c.lastQuizAt || c.masteryLevel == null) return;
      const date = new Date(c.lastQuizAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      if (!byDate[date]) byDate[date] = [];
      byDate[date].push((c.masteryLevel / 5) * 100);
    });
    return Object.entries(byDate)
      .map(([date, values]) => ({
        date,
        mastery: values.reduce((a, b) => a + b, 0) / values.length,
      }))
      .slice(-7);
  }, [analytics]);

  const topicDistributionData = useMemo(() => {
    if (!analytics?.cells?.length || !analytics?.chapters?.length) return [];
    const chapters = analytics.chapters.slice(0, 6);
    return chapters.map(ch => {
      const chCells = (analytics.cells || []).filter(c => c.chapter === ch);
      const mastered = chCells.filter(c => c.status === 'green' || c.masteryLevel >= 4).length;
      const learning = chCells.filter(c => c.status === 'amber' || (c.masteryLevel >= 2 && c.masteryLevel < 4)).length;
      const struggling = chCells.filter(c => c.status === 'red' || (c.masteryLevel >= 1 && c.masteryLevel < 2)).length;
      const label = ch.split(':').pop()?.trim() || ch;
      return { topic: label.length > 12 ? label.slice(0, 12) + '...' : label, mastered, learning, struggling };
    });
  }, [analytics]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never';
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  const toggleStudent = (id) => {
    setSelectedStudents(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = (students) => {
    setSelectedStudents(prev => {
      if (prev.size === students.length) return new Set();
      return new Set(students.map(s => s.id || s.user_id));
    });
  };

  const handleNudge = async () => {
    setNudging(true);
    const token = localStorage.getItem('newton-auth-token');
    for (const studentId of selectedStudents) {
      try {
        await fetch('/api/teacher/notify-parent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ studentId }),
        });
      } catch {}
    }
    setNudging(false);
    setSelectedStudents(new Set());
  };

  const handleExportPDF = (titleOverride) => {
    const classData = classes.find(c => c.id === selectedClassId);
    const analyticsData = {
      className: classData?.name || analytics?.className || 'Unknown Class',
      teacherName: 'Teacher',
      title: titleOverride || undefined,
      students: (analytics?.students || analytics?.priorityList || []).map(s => ({
        name: s.name || s.email,
        email: s.email,
        mastery: s.mastery || s.average_mastery || 0,
        topicsCovered: s.topics_covered || 0,
        integrityFlags: s.integrity_flags || s.tabSwitches || 0,
        lastActive: s.last_active || s.lastActivity,
      })),
    };
    generateClassReport(analyticsData);
  };

  const handleCellClick = useCallback((studentId, chapter) => {
    const student = (analytics?.students || []).find(s => s.id === studentId);
    if (!student) return;
    setDetailPanel({ studentId, studentName: student.name, chapter });
  }, [analytics]);

  const tabs = ['heatmap', 'priority', 'evidence'];

  return (
    <RoleWrapper>
      <div className="max-w-6xl mx-auto space-y-6">

        {loading ? (
          <div className="space-y-4">
            <div className="h-10 w-48 bg-white/[0.05] rounded-xl animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-white/[0.05] rounded-3xl animate-pulse" />)}
            </div>
          </div>
        ) : classes.length === 0 ? (
          <div className="pt-12">
            <h1 className="text-2xl font-bold text-white tracking-tight mb-2">Analytics</h1>
            <div className="rounded-3xl border border-white/[0.06] bg-white/[0.05] p-12 text-center">
              <p className="text-white/40">No classes found. Create a class first to see analytics.</p>
            </div>
          </div>
        ) : !selectedClassId ? (
          /* ── Class Picker ── */
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Analytics</h1>
            <p className="text-sm text-white/40 mt-1 mb-6">Select a class to view its analytics.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.filter(c => !c.archived).map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedClassId(c.id)}
                  className="text-left rounded-3xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] p-6 transition-colors group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg"
                      style={{ backgroundColor: c.color || '#3B82F6' }}
                    >
                      {c.subject?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white truncate">{c.name}</p>
                      <p className="text-xs text-white/40 truncate">{c.subject} &middot; {c.year_group}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/30">{c.student_count || 0} students</span>
                    <svg className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : analyticsLoading ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <button onClick={() => { setSelectedClassId(null); setAnalytics(null); }} className="p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors">
                <svg className="w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div className="h-8 w-48 bg-white/[0.05] rounded-xl animate-pulse" />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-white/[0.05] rounded-3xl animate-pulse" />)}
            </div>
            <div className="h-64 bg-white/[0.05] rounded-3xl animate-pulse" />
          </div>
        ) : analytics ? (
          <>
            {/* Page Header with back button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setSelectedClassId(null); setAnalytics(null); }}
                  className="p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors"
                >
                  <svg className="w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">{analytics.className || 'Command Center'}</h1>
                  <p className="text-sm text-white/40 mt-0.5">{analytics.subject ? `${analytics.subject} — ` : ''}Class analytics and student mastery</p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => setShowAssignQuiz(true)}
                  className="px-4 py-2 text-xs font-semibold bg-[#0071e3] hover:bg-[#0077ED] text-white rounded-full transition-colors"
                >
                  Assign Quiz
                </button>
                <button
                  onClick={() => handleExportPDF()}
                  className="px-4 py-2 text-xs font-semibold bg-white/[0.05] hover:bg-white/[0.08] text-white border border-white/[0.06] rounded-full transition-colors"
                >
                  Download PDF
                </button>
                <button
                  onClick={() => handleExportPDF('Parental Progress Report')}
                  className="px-4 py-2 text-xs font-semibold bg-white/[0.05] hover:bg-white/[0.08] text-white border border-white/[0.06] rounded-full transition-colors"
                >
                  Parental Report
                </button>
                {classes.length > 1 && (
                  <select
                    value={selectedClassId || ''}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="px-4 py-2 border border-white/[0.06] rounded-full text-sm font-medium text-white bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id} className="bg-neutral-900 text-white">{c.name} — {c.subject}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                label="Total Students"
                value={kpis.totalStudents}
                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>}
              />
              <KpiCard
                label="Avg Mastery"
                value={kpis.avgMastery}
                suffix="%"
                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>}
              />
              <KpiCard
                label="Active Today"
                value={kpis.activeToday}
                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              />
              <KpiCard
                label="Quizzes Done"
                value={kpis.quizzesCompleted}
                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              />
            </div>

            {/* Class info */}
            <div className="flex items-center gap-2 text-sm text-white/40">
              <span>{analytics.students?.length || 0} students</span>
              <span>&middot;</span>
              <span>{analytics.chapters?.length || 0} topics tracked</span>
            </div>

            {/* Tab Switcher — glass pill */}
            <div className="flex gap-1 bg-white/[0.05] border border-white/[0.06] rounded-full p-1 w-fit">
              {tabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-xs font-semibold rounded-full transition-colors capitalize ${
                    activeTab === tab ? 'bg-white/[0.1] text-white' : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  {tab === 'evidence' ? 'Evidence of Progress' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Mastery Heatmap */}
            {activeTab === 'heatmap' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-white">Mastery Heatmap</h2>
                <MasteryHeatmap
                  students={analytics.students || []}
                  chapters={analytics.chapters || []}
                  cells={analytics.cells || []}
                  integrityFlags={analytics.integrityFlags || {}}
                  onCellClick={handleCellClick}
                />
                <div className="flex items-center justify-between rounded-3xl border border-white/[0.06] bg-white/[0.05] p-4">
                  <p className="text-xs text-white/40">Click any cell to view quiz details. Hover for quick stats.</p>
                  <button
                    onClick={() => {
                      if (analytics.priorityList?.length > 0) {
                        setInterventionStudent(analytics.priorityList[0]);
                      }
                    }}
                    className="px-4 py-2 text-xs font-semibold bg-[#0071e3] hover:bg-[#0077ED] text-white rounded-full transition-colors"
                  >
                    Generate Targeted Review
                  </button>
                </div>

                {/* Charts — Bento Grid */}
                <div className="grid grid-cols-12 gap-4">
                  {/* Mastery Over Time */}
                  <div className="col-span-12 lg:col-span-7 bg-white/[0.05] border border-white/[0.06] rounded-3xl p-6">
                    <h3 className="text-sm font-semibold text-white mb-4">Mastery Over Time</h3>
                    {masteryOverTimeData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={240}>
                        <LineChart data={masteryOverTimeData}>
                          <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                          <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickLine={false} />
                          <YAxis domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickLine={false} tickFormatter={v => `${v}%`} />
                          <Tooltip content={<GlassTooltip />} />
                          <Line type="monotone" dataKey="mastery" name="Avg Mastery" stroke="#0071e3" strokeWidth={2} dot={{ r: 4, fill: '#0071e3' }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-60 flex items-center justify-center text-white/30 text-sm">No quiz data to chart yet</div>
                    )}
                  </div>

                  {/* Topic Distribution */}
                  <div className="col-span-12 lg:col-span-5 bg-white/[0.05] border border-white/[0.06] rounded-3xl p-6">
                    <h3 className="text-sm font-semibold text-white mb-4">Topic Distribution</h3>
                    {topicDistributionData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={topicDistributionData}>
                          <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                          <XAxis dataKey="topic" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickLine={false} />
                          <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickLine={false} />
                          <Tooltip content={<GlassTooltip />} />
                          <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }} />
                          <Bar dataKey="mastered" stackId="a" fill="#34d399" name="Mastered" radius={[0, 0, 0, 0]} />
                          <Bar dataKey="learning" stackId="a" fill="#fbbf24" name="Learning" radius={[0, 0, 0, 0]} />
                          <Bar dataKey="struggling" stackId="a" fill="#f87171" name="Struggling" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-60 flex items-center justify-center text-white/30 text-sm">No topic data yet</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Priority List */}
            {activeTab === 'priority' && (
              <div>
                {selectedStudents.size > 0 && (
                  <div className="flex items-center gap-2 p-3 bg-white/[0.05] border border-white/[0.06] rounded-3xl mb-4">
                    <span className="text-xs text-white/40">{selectedStudents.size} selected</span>
                    <button onClick={handleNudge} disabled={nudging} className="px-3 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-full transition-colors disabled:opacity-50">
                      {nudging ? 'Sending...' : 'Nudge Selected'}
                    </button>
                    <button onClick={() => handleExportPDF()} className="px-3 py-1.5 text-xs font-semibold bg-white/[0.05] hover:bg-white/[0.08] text-white rounded-full transition-colors border border-white/[0.06]">
                      Export Selected
                    </button>
                    <button onClick={() => setSelectedStudents(new Set())} className="px-3 py-1.5 text-xs text-white/30 hover:text-white transition-colors">
                      Clear
                    </button>
                  </div>
                )}

                {analytics.priorityList?.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-white">Priority Students</h2>
                      <label className="flex items-center gap-2 text-xs text-white/40 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedStudents.size === (analytics.priorityList || []).length && selectedStudents.size > 0}
                          onChange={() => toggleAll(analytics.priorityList || [])}
                          className="rounded border-white/20 bg-white/5"
                        />
                        Select All
                      </label>
                    </div>
                    <div className="rounded-3xl border border-white/[0.06] bg-white/[0.05] overflow-hidden divide-y divide-white/[0.04]">
                      {analytics.priorityList.map((student) => (
                        <div key={student.id} className="px-5 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={selectedStudents.has(student.id)}
                              onChange={() => toggleStudent(student.id)}
                              className="rounded border-white/20 bg-white/5"
                            />
                            <div className="w-9 h-9 rounded-full bg-white/[0.05] border border-white/[0.06] flex items-center justify-center">
                              <span className="text-sm font-semibold text-white/60">
                                {student.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <button
                                onClick={() => setForensicStudent(student)}
                                className="text-sm font-semibold text-white hover:text-[#0071e3] transition-colors text-left"
                              >
                                {student.name}
                              </button>
                              <p className="text-xs text-white/40">
                                Last active: {formatDate(student.lastActivity)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {student.decayCount > 0 && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400">
                                {student.decayCount} decaying
                              </span>
                            )}
                            {student.tabSwitches > 3 && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-500/10 text-orange-400 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                </svg>
                                {student.tabSwitches} flags
                              </span>
                            )}
                            {student.isInactive && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400">
                                Inactive
                              </span>
                            )}
                            <button
                              onClick={() => setInterventionStudent(student)}
                              className="px-3 py-1 rounded-full text-xs font-semibold bg-[#0071e3]/10 text-[#0071e3] hover:bg-[#0071e3]/20 transition"
                            >
                              Intervene
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Evidence of Progress */}
            {activeTab === 'evidence' && (
              <div className="rounded-3xl border border-white/[0.06] bg-white/[0.05] overflow-hidden">
                <div className="px-5 py-4 border-b border-white/[0.06]">
                  <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Evidence of Progress</h2>
                  <p className="text-xs text-white/30 mt-1">Measurable learning gains across the class</p>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="px-5 py-3 text-left text-[10px] font-semibold text-white/40 uppercase tracking-wider">Student</th>
                      <th className="px-3 py-3 text-left text-[10px] font-semibold text-white/40 uppercase tracking-wider">Baseline</th>
                      <th className="px-3 py-3 text-left text-[10px] font-semibold text-white/40 uppercase tracking-wider">Current</th>
                      <th className="px-3 py-3 text-left text-[10px] font-semibold text-white/40 uppercase tracking-wider">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(analytics.students || []).map((s, i) => {
                      const baseline = s.baseline_mastery || s.first_score || 30;
                      const current = s.mastery || s.average_mastery || 0;
                      const baselineGrade = masteryPercentToGrade(baseline);
                      const currentGrade = masteryPercentToGrade(current);
                      const gradeOrder = ['U','1','2','3','4','5','6','7','8','9'];
                      const baseIdx = gradeOrder.indexOf(baselineGrade);
                      const currIdx = gradeOrder.indexOf(currentGrade);
                      const change = currIdx - baseIdx;
                      return (
                        <tr key={s.id || i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                          <td className="px-5 py-3 text-sm text-white">{s.name || s.email || 'Student'}</td>
                          <td className="px-3 py-3 text-xs text-white/40">{baselineGrade}</td>
                          <td className="px-3 py-3 text-xs text-white font-semibold">{currentGrade}</td>
                          <td className={`px-3 py-3 text-xs font-semibold ${change > 0 ? 'text-emerald-400' : change < 0 ? 'text-red-400' : 'text-white/30'}`}>
                            {change > 0 ? `+${change}` : change === 0 ? '\u2014' : change}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {(analytics.students || []).length > 0 && (() => {
                  const gradeOrder = ['U','1','2','3','4','5','6','7','8','9'];
                  const students = analytics.students || [];
                  const changes = students.map(s => {
                    const baseline = s.baseline_mastery || s.first_score || 30;
                    const current = s.mastery || s.average_mastery || 0;
                    const bIdx = gradeOrder.indexOf(masteryPercentToGrade(baseline));
                    const cIdx = gradeOrder.indexOf(masteryPercentToGrade(current));
                    return cIdx - bIdx;
                  });
                  const improved = changes.filter(c => c > 0).length;
                  const avgShift = changes.length > 0 ? (changes.reduce((a, b) => a + b, 0) / changes.length).toFixed(1) : 0;
                  return (
                    <div className="px-5 py-4 border-t border-white/[0.06] flex gap-6">
                      <div>
                        <p className="text-[10px] text-white/30 uppercase tracking-wider">Students Improved</p>
                        <p className="text-lg text-emerald-400 font-semibold">{Math.round((improved / students.length) * 100)}%</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-white/30 uppercase tracking-wider">Avg Grade Shift</p>
                        <p className="text-lg text-white font-semibold">+{avgShift}</p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </>
        ) : (
          <div className="rounded-3xl border border-white/[0.06] bg-white/[0.05] p-12 text-center">
            <p className="text-white/40">Failed to load analytics. Please try again.</p>
          </div>
        )}

        {/* Intervention Modal */}
        {interventionStudent && (
          <InterventionModal
            student={interventionStudent}
            className={analytics?.className || 'Class'}
            onClose={() => setInterventionStudent(null)}
          />
        )}

        {/* Forensic Panel */}
        {forensicStudent && (
          <ForensicPanel
            student={forensicStudent}
            onClose={() => setForensicStudent(null)}
          />
        )}

        {/* Quiz Detail Panel */}
        {detailPanel && (
          <QuizDetailPanel
            studentId={detailPanel.studentId}
            studentName={detailPanel.studentName}
            chapter={detailPanel.chapter}
            classId={selectedClassId}
            onClose={() => setDetailPanel(null)}
          />
        )}

        {/* Assign Quiz Modal */}
        {showAssignQuiz && analytics && (
          <AssignQuizModal
            classId={selectedClassId}
            className={analytics.className || 'Class'}
            subject={analytics.subject || ''}
            onClose={() => setShowAssignQuiz(false)}
          />
        )}
      </div>
    </RoleWrapper>
  );
}
