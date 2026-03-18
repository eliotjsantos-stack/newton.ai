'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppSidebar from '@/components/AppSidebar';
import { ClassIcon } from '@/components/ClassIcons';

const cardBase = 'bg-[var(--c-card)] border border-gray-200 rounded-lg transition-colors duration-200';

/* ── Main Subject Page ── */
export default function SubjectPage({ params }) {
  const resolvedParams = use(params);
  const subject = decodeURIComponent(resolvedParams.subject);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [classData, setClassData] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [resources, setResources] = useState([]);
  const [mastery, setMastery] = useState([]);
  const [quizAssignments, setQuizAssignments] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortCol, setSortCol] = useState('code');
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    const load = async () => {
      const token = localStorage.getItem('newton-auth-token');
      if (!token) { router.push('/login'); return; }
      const headers = { Authorization: `Bearer ${token}` };

      try {
        const classRes = await fetch('/api/student/classes', { headers });
        const classJson = await classRes.json();
        const cls = (classJson.classes || []).find(c => c.subject === subject);
        setClassData(cls || null);

        const fetches = [
          fetch(`/api/topics/user?subject=${encodeURIComponent(subject)}`, { headers }),
        ];
        if (cls) {
          fetches.push(
            fetch(`/api/student/class/${cls.id}/assignments`, { headers }),
            fetch(`/api/student/class/${cls.id}/resources`, { headers }),
            fetch(`/api/student/quiz-assignments?classId=${cls.id}`, { headers }),
          );
        }

        const results = await Promise.all(fetches);
        const topicsData = await results[0].json();
        setTopics(topicsData.topics || []);

        if (cls && results[1]) {
          const aData = await results[1].json();
          setAssignments(aData.assignments || []);
        }
        if (cls && results[2]) {
          const rData = await results[2].json();
          setResources(rData.resources || []);
        }
        if (cls && results[3]) {
          try {
            const qaData = await results[3].json();
            setQuizAssignments(qaData.assignments || []);
          } catch {}
        }

        const mRes = await fetch(`/api/quiz/user?subject=${encodeURIComponent(subject)}`, { headers }).catch(() => null);
        if (mRes?.ok) {
          const mData = await mRes.json();
          const quizTopics = (mData.quizzes || [])
            .filter(q => q.status === 'completed')
            .map(q => ({
              topic: q.topic_name,
              score: q.correct_count && q.total_questions ? Math.round((q.correct_count / q.total_questions) * 100) : 0,
              last_quiz_at: q.completed_at || q.created_at,
            }));
          setMastery(quizTopics);
        }
      } catch (e) {
        console.error('Subject page load error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [mounted, subject, router]);

  if (!mounted) return null;

  const syllabusChapters = buildSyllabus(subject, topics, mastery);

  // Sorting
  const handleSort = (col) => {
    if (sortCol === col) setSortAsc(!sortAsc);
    else { setSortCol(col); setSortAsc(true); }
  };

  const sortedChapters = [...syllabusChapters].sort((a, b) => {
    let av, bv;
    switch (sortCol) {
      case 'code': av = a.code; bv = b.code; break;
      case 'name': av = a.title; bv = b.title; break;
      case 'mastery': av = a.quizScore ?? -1; bv = b.quizScore ?? -1; break;
      case 'lastAssessment': av = a.lastActivityAt || ''; bv = b.lastActivityAt || ''; break;
      case 'integrity': av = a.integrityScore ?? 0; bv = b.integrityScore ?? 0; break;
      default: av = a.code; bv = b.code;
    }
    if (av < bv) return sortAsc ? -1 : 1;
    if (av > bv) return sortAsc ? 1 : -1;
    return 0;
  });

  // Coverage stats
  const completedTopics = syllabusChapters.filter(c => c.status === 'mastered' || c.status === 'review' || c.status === 'active').length;
  const totalTopics = syllabusChapters.length;
  const coveragePercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  // Merge assignments + quiz assignments
  const mergedAssignments = [
    ...assignments.map(a => ({ ...a, _type: 'task' })),
    ...quizAssignments.map(qa => ({
      id: qa.id,
      title: qa.topicName,
      description: null,
      due_date: qa.dueDate,
      created_at: qa.createdAt,
      completed_at: qa.completed ? qa.createdAt : null,
      _type: 'quiz',
      _started: qa.started,
      _completed: qa.completed,
      _quizId: qa.quizId,
    })),
  ];

  const allAssignments = mergedAssignments.sort((a, b) => {
    const aOverdue = !a.completed_at && a.due_date && new Date(a.due_date) < new Date();
    const bOverdue = !b.completed_at && b.due_date && new Date(b.due_date) < new Date();
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    return new Date(a.due_date || '9999') - new Date(b.due_date || '9999');
  });

  const SortHeader = ({ col, label }) => (
    <th
      className="px-3 py-2 text-left text-[10px] font-semibold text-white/50 uppercase tracking-wider cursor-pointer hover:text-white/70 select-none"
      onClick={() => handleSort(col)}
    >
      {label} {sortCol === col ? (sortAsc ? '\u2191' : '\u2193') : ''}
    </th>
  );

  const masteryColor = (score) => {
    if (score == null) return '';
    if (score < 40) return 'bg-red-50';
    if (score < 70) return 'bg-[#0071E3]/10';
    return 'bg-emerald-50';
  };

  const masteryTextColor = (score) => {
    if (score == null) return 'text-white/40';
    if (score < 40) return 'text-red-500';
    if (score < 70) return 'text-[#0071E3]';
    return 'text-emerald-600';
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--c-canvas)]">
      <AppSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-[var(--c-card)]">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-1.5 -ml-1.5 rounded-lg hover:bg-white/5 transition-colors">
              <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div className="flex items-center gap-2.5">
              <ClassIcon subject={subject} size={20} />
              <h1 className="text-base font-bold text-white tracking-tight">{subject}</h1>
            </div>
          </div>
          <button
            onClick={() => router.push(classData ? `/chat?classId=${classData.id}&new=true` : `/chat?subject=${encodeURIComponent(subject)}&new=true`)}
            className="px-4 py-2 bg-[#0071E3] hover:bg-[#0058B3] text-white text-sm font-semibold rounded-full transition-colors"
          >
            Chat
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-auto"><main className="max-w-5xl mx-auto px-6 py-6 pb-24 space-y-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className={`${cardBase} p-6 animate-pulse`}>
                <div className="h-4 w-32 bg-white/8 rounded mb-3" />
                <div className="h-3 w-48 bg-white/8 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Class Info */}
            {classData && (
              <div className={`${cardBase} px-6 py-4 flex items-center justify-between`}>
                <div>
                  <p className="text-sm font-semibold text-white">{classData.name}</p>
                  <p className="text-xs text-white/50 mt-0.5">{classData.year_group?.replace('year', 'Year ')} · {classData.teacher_name || 'Teacher'}</p>
                </div>
              </div>
            )}

            {/* Syllabus Coverage Bar + Heatmap */}
            <div className={`${cardBase} p-5`}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wider">Syllabus Coverage</h2>
                <span className="font-sans text-sm text-white/60">{completedTopics}/{totalTopics} topics</span>
              </div>
              {/* Progress bar */}
              <div className="h-2 bg-white/8 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-[#0071E3] rounded-full transition-all duration-500"
                  style={{ width: `${coveragePercent}%` }}
                />
              </div>
              {/* Knowledge Heatmap */}
              {syllabusChapters.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2">Topic Mastery Heatmap</h3>
                  <div className="flex flex-wrap gap-1">
                    {syllabusChapters.map((ch, i) => {
                      const score = ch.quizScore;
                      let bg = 'bg-white/8';
                      if (score != null) {
                        if (score >= 70) bg = 'bg-emerald-600';
                        else if (score >= 40) bg = 'bg-[#0071E3]';
                        else bg = 'bg-red-600';
                      }
                      return (
                        <div
                          key={i}
                          className={`w-6 h-6 rounded-sm ${bg} relative group cursor-default`}
                          title={`${ch.code}: ${score != null ? score + '%' : 'Unassessed'}`}
                        >
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 font-sans">
                            {ch.code}: {score != null ? score + '%' : '—'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Syllabus Matrix Table */}
            <div className={`${cardBase} overflow-hidden`}>
              <div className="px-5 py-3 border-b border-gray-200">
                <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wider">Syllabus Matrix</h2>
              </div>
              {syllabusChapters.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <SortHeader col="code" label="Topic Code" />
                        <SortHeader col="name" label="Topic Name" />
                        <SortHeader col="mastery" label="Mastery %" />
                        <SortHeader col="lastAssessment" label="Last Assessment" />
                        <SortHeader col="integrity" label="Integrity" />
                      </tr>
                    </thead>
                    <tbody>
                      {sortedChapters.map((ch, i) => (
                        <tr
                          key={i}
                          className={`border-b border-gray-100 hover:bg-[var(--bg-surface)] cursor-pointer ${masteryColor(ch.quizScore)}`}
                          onClick={() => {
                            const chatUrl = classData
                              ? `/chat?classId=${classData.id}&topic=${encodeURIComponent(ch.title)}&new=true`
                              : `/chat?subject=${encodeURIComponent(subject)}&topic=${encodeURIComponent(ch.title)}&new=true`;
                            router.push(chatUrl);
                          }}
                        >
                          <td className="px-3 py-2.5 font-sans text-xs text-white/50">{ch.code}</td>
                          <td className="px-3 py-2.5 text-sm text-white max-w-[200px] truncate">{ch.title}</td>
                          <td className={`px-3 py-2.5 font-sans text-xs font-semibold ${masteryTextColor(ch.quizScore)}`}>
                            {ch.quizScore != null ? `${ch.quizScore}%` : '—'}
                          </td>
                          <td className="px-3 py-2.5 font-sans text-xs text-white/50">
                            {ch.lastActivityAt
                              ? new Date(ch.lastActivityAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })
                              : '—'}
                          </td>
                          <td className="px-3 py-2.5 font-sans text-xs text-white/50">
                            {ch.integrityScore != null ? ch.integrityScore : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 px-5">
                  <p className="text-sm text-white/50">Complete quizzes and chat sessions to build your syllabus map.</p>
                </div>
              )}
            </div>

            {/* Incomplete Tasks */}
            <div className={`${cardBase} overflow-hidden`}>
              <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wider">Tasks</h2>
                {assignments.length > 0 && (
                  <span className="font-sans text-xs text-white/50">{allAssignments.filter(a => !a.completed_at).length} pending</span>
                )}
              </div>
              {allAssignments.length === 0 ? (
                <div className="text-center py-6 px-5">
                  <p className="text-sm text-white/50">No assignments set yet.</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-3 py-2 text-left text-[10px] font-semibold text-white/50 uppercase tracking-wider">Task Name</th>
                      <th className="px-3 py-2 text-left text-[10px] font-semibold text-white/50 uppercase tracking-wider">Type</th>
                      <th className="px-3 py-2 text-left text-[10px] font-semibold text-white/50 uppercase tracking-wider">Due Date</th>
                      <th className="px-3 py-2 text-left text-[10px] font-semibold text-white/50 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allAssignments.map(a => {
                      const isOverdue = !a.completed_at && a.due_date && new Date(a.due_date) < new Date();
                      const isComplete = a._type === 'quiz' ? !!a._completed : !!a.completed_at;
                      const isQuiz = a._type === 'quiz';
                      return (
                        <tr
                          key={`${a._type}-${a.id}`}
                          className={`border-b border-gray-100 hover:bg-[var(--bg-surface)] cursor-pointer ${isOverdue ? 'bg-red-50' : ''}`}
                          onClick={() => {
                            if (isQuiz) {
                              router.push(a._quizId ? `/quiz/${a._quizId}` : '/quiz');
                            } else {
                              const chatUrl = classData
                                ? `/chat?classId=${classData.id}&topic=${encodeURIComponent(a.title)}&new=true`
                                : `/chat?subject=${encodeURIComponent(subject)}&new=true`;
                              router.push(chatUrl);
                            }
                          }}
                        >
                          <td className={`px-3 py-2.5 text-sm ${isOverdue ? 'text-red-500' : 'text-white'}`}>{a.title}</td>
                          <td className="px-3 py-2.5 text-xs">
                            <span className={`px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                              isQuiz ? 'bg-[#0071E3]/10 text-[#0071E3]' : 'bg-white/5 text-white/50'
                            }`}>
                              {isQuiz ? 'Quiz' : 'Task'}
                            </span>
                          </td>
                          <td className={`px-3 py-2.5 font-sans text-xs ${isOverdue ? 'text-red-500' : 'text-white/50'}`}>
                            {a.due_date ? new Date(a.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                          </td>
                          <td className="px-3 py-2.5 text-xs">
                            {isComplete ? (
                              <span className="text-emerald-600 font-semibold">DONE</span>
                            ) : isOverdue ? (
                              <span className="text-red-500 font-semibold">OVERDUE</span>
                            ) : isQuiz && a._started ? (
                              <span className="text-[#0071E3] font-semibold">IN PROGRESS</span>
                            ) : (
                              <span className="text-white/50">Pending</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Exam Simulation */}
            <div className={`${cardBase} p-5`}>
              <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4">Exam Simulation</h2>
              <button
                onClick={() => router.push(`/quiz?subject=${encodeURIComponent(subject)}&mode=exam`)}
                className="w-full rounded-lg p-4 bg-[var(--c-card)] text-black border border-gray-200 hover:bg-white/5 transition-colors text-left group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-black/40 mb-1">Mock Paper</p>
                    <p className="text-base font-bold tracking-tight">Simulate {subject} 2026 Paper</p>
                    <p className="text-xs text-black/40 mt-1">15 questions · Timed</p>
                  </div>
                  <svg className="w-5 h-5 text-black/30 group-hover:text-black/60 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </button>
            </div>

            {/* Resource Vault */}
            <div className={`${cardBase} overflow-hidden`}>
              <div className="px-5 py-3 border-b border-gray-200">
                <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wider">Resources</h2>
              </div>
              {resources.length === 0 ? (
                <div className="text-center py-6 px-5">
                  <p className="text-sm text-white/50">No resources added yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {resources.map(r => (
                    <a
                      key={r.id}
                      href={r.url || '#'}
                      target={r.url ? '_blank' : undefined}
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-5 py-3 hover:bg-[var(--bg-surface)] transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{r.title}</p>
                        {r.description && <p className="text-xs text-white/50 truncate mt-0.5">{r.description}</p>}
                      </div>
                      <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-white/40">
                        {r.type || 'file'}
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
      </div>
      </div>
    </div>
  );
}

/* ── Build Syllabus Tree from Topics + Mastery ── */
function buildSyllabus(subject, topics, mastery) {
  const allTopics = new Map();

  for (const t of topics) {
    const key = t.topic_name || t.topic || t.name;
    if (!key) continue;
    allTopics.set(key, {
      code: key.split(':').pop()?.trim() || key,
      title: key,
      discussed: true,
      quizScore: null,
      lastActivityAt: t.last_discussed_at || null,
      integrityScore: null,
    });
  }

  for (const m of mastery) {
    const key = m.topic;
    if (!key) continue;
    const existing = allTopics.get(key) || {
      code: key.split(':').pop()?.trim() || key,
      title: key,
      discussed: false,
      lastActivityAt: null,
      integrityScore: null,
    };
    existing.quizScore = m.score;
    const masteryDate = m.last_quiz_at || m.updated_at || m.created_at;
    if (masteryDate && (!existing.lastActivityAt || new Date(masteryDate) > new Date(existing.lastActivityAt))) {
      existing.lastActivityAt = masteryDate;
    }
    allTopics.set(key, existing);
  }

  const chapters = [...allTopics.values()].map(ch => {
    let status = 'locked';
    if (ch.quizScore != null) {
      if (ch.quizScore === 100) status = 'mastered';
      else if (ch.quizScore >= 60) status = 'review';
      else status = 'active';
    } else if (ch.discussed) {
      status = 'active';
    }

    let decayState = 'fresh';
    if (ch.lastActivityAt) {
      const daysSince = Math.floor((Date.now() - new Date(ch.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSince >= 21) decayState = 'decayed';
      else if (daysSince >= 14) decayState = 'rusting';
      else if (daysSince >= 7) decayState = 'aging';
      ch.daysSinceActivity = daysSince;
    }
    ch.decayState = decayState;

    return { ...ch, status };
  });

  const order = { active: 0, review: 1, mastered: 2, locked: 3 };
  chapters.sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9));

  return chapters;
}
