'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ClassIcon } from '@/components/ClassIcons';
import TopicBarChart from '@/components/topics/TopicBarChart';
import SyllabusUploader from '@/components/teacher/SyllabusUploader';

export default function ClassDashboardPage() {
  const { id } = useParams();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cls, setCls] = useState(null);
  const [students, setStudents] = useState([]);
  const [copied, setCopied] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [activeTab, setActiveTab] = useState('students');

  // Assignments state
  const [assignments, setAssignments] = useState([]);
  const [newAssignment, setNewAssignment] = useState({ title: '', description: '', dueDate: '' });
  const [addingAssignment, setAddingAssignment] = useState(false);
  const [deletingAssignment, setDeletingAssignment] = useState(null);

  // Resources state
  const [resources, setResources] = useState([]);
  const [newResource, setNewResource] = useState({ title: '', url: '', description: '', type: 'link' });
  const [addingResource, setAddingResource] = useState(false);
  const [deletingResource, setDeletingResource] = useState(null);

  // Quiz assignments state
  const [quizAssignments, setQuizAssignments] = useState([]);
  const [quizAssignTopic, setQuizAssignTopic] = useState('');
  const [quizAssignDue, setQuizAssignDue] = useState('');
  const [assigningQuiz, setAssigningQuiz] = useState(false);
  const [quizAssignMode, setQuizAssignMode] = useState('mini_quiz');
  const [quizAssignMarks, setQuizAssignMarks] = useState(15);

  // Topics state
  const [topicsData, setTopicsData] = useState(null);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [topicsDateRange, setTopicsDateRange] = useState('all');

  // Quizzes state
  const [quizzesData, setQuizzesData] = useState(null);
  const [quizzesLoading, setQuizzesLoading] = useState(false);
  const [quizzesDateRange, setQuizzesDateRange] = useState('all');

  // Mastery state
  const [masteryData, setMasteryData] = useState(null);
  const [masteryLoading, setMasteryLoading] = useState(false);
  const [masteryDateRange, setMasteryDateRange] = useState('all');

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem('newton-auth-token');
      if (!token) { window.location.href = '/login'; return; }
      try {
        const meRes = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
        const me = await meRes.json();
        if (!me.isAdmin && me.accountType !== 'teacher') { window.location.href = '/login'; return; }
        setAuthorized(true);

        const [classRes, studentsRes, assignmentsRes, resourcesRes, quizAssignRes] = await Promise.all([
          fetch(`/api/teacher/classes/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/teacher/classes/${id}/students`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/teacher/classes/${id}/assignments`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/teacher/classes/${id}/resources`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/teacher/quiz-assign?classId=${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (!classRes.ok) { window.location.href = '/teacher/classes'; return; }

        const classData = await classRes.json();
        setCls(classData.class);

        const studentsData = await studentsRes.json();
        setStudents(studentsData.students || []);

        const assignmentsData = await assignmentsRes.json();
        setAssignments(assignmentsData.assignments || []);

        const resourcesData = await resourcesRes.json();
        setResources(resourcesData.resources || []);

        if (quizAssignRes.ok) {
          const qaData = await quizAssignRes.json();
          setQuizAssignments(qaData.assignments || []);
        }
      } catch {
        window.location.href = '/login';
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const copyCode = () => {
    if (!cls) return;
    navigator.clipboard.writeText(cls.class_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const removeStudent = async (studentId) => {
    if (!confirm('Remove this student from the class?')) return;
    setRemoving(studentId);
    try {
      const token = localStorage.getItem('newton-auth-token');
      await fetch(`/api/teacher/classes/${id}/students`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ studentId }),
      });
      setStudents(s => s.filter(st => st.studentId !== studentId));
    } catch {} finally {
      setRemoving(null);
    }
  };

  const handleAddAssignment = async (e) => {
    e.preventDefault();
    if (!newAssignment.title.trim()) return;
    setAddingAssignment(true);
    try {
      const token = localStorage.getItem('newton-auth-token');
      const res = await fetch(`/api/teacher/classes/${id}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newAssignment),
      });
      const data = await res.json();
      if (res.ok) {
        setAssignments(prev => [data.assignment, ...prev]);
        setNewAssignment({ title: '', description: '', dueDate: '' });
      }
    } catch {} finally {
      setAddingAssignment(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!confirm('Delete this assignment?')) return;
    setDeletingAssignment(assignmentId);
    try {
      const token = localStorage.getItem('newton-auth-token');
      await fetch(`/api/teacher/classes/${id}/assignments`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ assignmentId }),
      });
      setAssignments(prev => prev.filter(a => a.id !== assignmentId));
    } catch {} finally {
      setDeletingAssignment(null);
    }
  };

  const handleAddResource = async (e) => {
    e.preventDefault();
    if (!newResource.title.trim()) return;
    setAddingResource(true);
    try {
      const token = localStorage.getItem('newton-auth-token');
      const res = await fetch(`/api/teacher/classes/${id}/resources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newResource),
      });
      const data = await res.json();
      if (res.ok) {
        setResources(prev => [data.resource, ...prev]);
        setNewResource({ title: '', url: '', description: '', type: 'link' });
      }
    } catch {} finally {
      setAddingResource(false);
    }
  };

  const handleDeleteResource = async (resourceId) => {
    if (!confirm('Delete this resource?')) return;
    setDeletingResource(resourceId);
    try {
      const token = localStorage.getItem('newton-auth-token');
      await fetch(`/api/teacher/classes/${id}/resources`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ resourceId }),
      });
      setResources(prev => prev.filter(r => r.id !== resourceId));
    } catch {} finally {
      setDeletingResource(null);
    }
  };

  const loadTopicsData = async () => {
    setTopicsLoading(true);
    try {
      const token = localStorage.getItem('newton-auth-token');
      let url = `/api/teacher/classes/${id}/topics`;

      // Add date range filter
      if (topicsDateRange === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        url += `?startDate=${weekAgo.toISOString()}`;
      } else if (topicsDateRange === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        url += `?startDate=${monthAgo.toISOString()}`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTopicsData(data);
      }
    } catch (error) {
      console.error('Failed to load topics:', error);
    } finally {
      setTopicsLoading(false);
    }
  };

  const loadQuizzesData = async () => {
    setQuizzesLoading(true);
    try {
      const token = localStorage.getItem('newton-auth-token');
      let url = `/api/teacher/classes/${id}/quizzes`;

      // Add date range filter
      if (quizzesDateRange === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        url += `?startDate=${weekAgo.toISOString()}`;
      } else if (quizzesDateRange === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        url += `?startDate=${monthAgo.toISOString()}`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setQuizzesData(data);
      }
    } catch (error) {
      console.error('Failed to load quizzes:', error);
    } finally {
      setQuizzesLoading(false);
    }
  };

  // Load topics data when tab is selected
  useEffect(() => {
    if (activeTab === 'topics' && !topicsData && !topicsLoading) {
      loadTopicsData();
    }
  }, [activeTab, topicsData, topicsLoading]);

  // Reload topics when date range changes
  useEffect(() => {
    if (activeTab === 'topics') {
      loadTopicsData();
    }
  }, [topicsDateRange]);

  // Load quizzes data when tab is selected
  useEffect(() => {
    if (activeTab === 'quizzes' && !quizzesData && !quizzesLoading) {
      loadQuizzesData();
    }
  }, [activeTab, quizzesData, quizzesLoading]);

  // Reload quizzes when date range changes
  useEffect(() => {
    if (activeTab === 'quizzes') {
      loadQuizzesData();
    }
  }, [quizzesDateRange]);

  // Load mastery data function
  const loadMasteryData = async () => {
    setMasteryLoading(true);
    try {
      const token = localStorage.getItem('newton-auth-token');
      let url = `/api/teacher/classes/${id}/mastery`;

      // Add date range filter
      if (masteryDateRange === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        url += `?startDate=${weekAgo.toISOString()}`;
      } else if (masteryDateRange === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        url += `?startDate=${monthAgo.toISOString()}`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMasteryData(data);
      }
    } catch (error) {
      console.error('Failed to load mastery data:', error);
    } finally {
      setMasteryLoading(false);
    }
  };

  // Load mastery data when tab is selected
  useEffect(() => {
    if (activeTab === 'mastery' && !masteryData && !masteryLoading) {
      loadMasteryData();
    }
  }, [activeTab, masteryData, masteryLoading]);

  // Reload mastery when date range changes
  useEffect(() => {
    if (activeTab === 'mastery') {
      loadMasteryData();
    }
  }, [masteryDateRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-[3px] border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }
  if (!authorized || !cls) return null;

  const handleAssignQuiz = async (e) => {
    e.preventDefault();
    if (!quizAssignTopic.trim()) return;
    setAssigningQuiz(true);
    try {
      const token = localStorage.getItem('newton-auth-token');
      const res = await fetch('/api/teacher/quiz-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ classId: id, topicName: quizAssignTopic.trim(), dueDate: quizAssignDue || null, totalMarks: quizAssignMarks, mode: quizAssignMode }),
      });
      const data = await res.json();
      if (res.ok && data.assignment) {
        setQuizAssignments(prev => [{ ...data.assignment, totalStudents: students.length, studentsStarted: 0, studentsCompleted: 0 }, ...prev]);
        setQuizAssignTopic('');
        setQuizAssignDue('');
        setQuizAssignMode('mini_quiz');
        setQuizAssignMarks(15);
      } else {
        alert('Failed to assign quiz: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Failed to assign quiz: ' + err.message);
    } finally {
      setAssigningQuiz(false);
    }
  };

  const tabs = [
    { id: 'students', label: `Students (${students.length})` },
    { id: 'assignments', label: `Assignments (${assignments.length})` },
    { id: 'quiz-assign', label: `Assigned Quizzes (${quizAssignments.length})` },
    { id: 'resources', label: `Resources (${resources.length})` },
    { id: 'topics', label: 'Topic Insights' },
    { id: 'quizzes', label: 'Quiz Results' },
    { id: 'mastery', label: 'Student Mastery' },
    { id: 'syllabus', label: 'Syllabus' },
  ];

  return (
    <div className="max-w-5xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-white/40 mb-6">
        <Link href="/teacher/classes" className="hover:text-white transition-colors">My Classes</Link>
        <svg className="w-4 h-4 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        <span className="text-white font-medium truncate max-w-xs">{cls.name}</span>
      </nav>

      {/* Header card */}
      <div className="bg-white/[0.05] border border-white/[0.06] rounded-2xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: (cls.color || '#3B82F6') + '15', color: cls.color || '#3B82F6' }}>
              <ClassIcon name={cls.icon || 'book'} size={28} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">{cls.name}</h1>
              <p className="text-sm text-white/40 mt-0.5">{cls.subject} · {cls.year_group?.replace('year', 'Year ')}</p>
              {cls.description && <p className="text-sm text-white/60 mt-2">{cls.description}</p>}
            </div>
          </div>

          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl px-4 py-3 flex items-center gap-3 flex-shrink-0">
            <div>
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">Class Code</p>
              <p className="text-xl font-mono font-bold text-white tracking-wider">{cls.class_code}</p>
            </div>
            <button onClick={copyCode} className="px-3 py-1.5 bg-white/[0.05] border border-white/[0.06] hover:bg-white/[0.08] rounded-md text-xs font-medium text-white transition-colors">
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <Link
          href={`/teacher/class/${id}/edit`}
          className="px-4 py-2 bg-white/[0.05] border border-white/[0.06] hover:bg-white/[0.08] text-white text-sm font-medium rounded-2xl transition-colors"
        >
          Edit Class
        </Link>
        <button
          onClick={copyCode}
          className="px-4 py-2 bg-white/[0.05] border border-white/[0.06] hover:bg-white/[0.08] text-white text-sm font-medium rounded-2xl transition-colors"
        >
          Share Code
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/[0.06] mb-6 overflow-x-auto">
        <div className="flex gap-6 min-w-max">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-[#0071e3] text-[#0071e3]'
                  : 'border-transparent text-white/40 hover:text-white/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Students Tab */}
      {activeTab === 'students' && (
        <div className="bg-white/[0.05] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.06]">
            <h2 className="text-sm font-semibold text-white">Students ({students.length})</h2>
          </div>
          {students.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-white/40 mb-1">No students yet</p>
              <p className="text-xs text-white/30">Share the class code <span className="font-mono font-semibold text-white/70">{cls.class_code}</span> with your students</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {students.map(s => (
                <div key={s.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                  <div>
                    <p className="text-sm font-medium text-white">{s.email}</p>
                    <p className="text-xs text-white/40">{s.yearGroup?.replace('year', 'Year ')} · Joined {new Date(s.joinedAt).toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={() => removeStudent(s.studentId)}
                    disabled={removing === s.studentId}
                    className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors disabled:opacity-50"
                  >
                    {removing === s.studentId ? 'Removing...' : 'Remove'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Assignments Tab */}
      {activeTab === 'assignments' && (
        <div className="space-y-6">
          {/* Add form */}
          <div className="bg-white/[0.05] border border-white/[0.06] rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-white mb-4">Add Assignment</h2>
            <form onSubmit={handleAddAssignment} className="space-y-3">
              <input
                type="text"
                placeholder="Assignment title"
                value={newAssignment.title}
                onChange={e => setNewAssignment(p => ({ ...p, title: e.target.value }))}
                className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.06] rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#0071e3] focus:border-transparent"
              />
              <textarea
                placeholder="Description (optional)"
                value={newAssignment.description}
                onChange={e => setNewAssignment(p => ({ ...p, description: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.06] rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#0071e3] focus:border-transparent resize-none"
              />
              <div className="flex items-center gap-3">
                <input
                  type="datetime-local"
                  value={newAssignment.dueDate}
                  onChange={e => setNewAssignment(p => ({ ...p, dueDate: e.target.value }))}
                  className="px-3 py-2 bg-white/[0.05] border border-white/[0.06] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#0071e3] focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={addingAssignment || !newAssignment.title.trim()}
                  className="px-4 py-2 bg-[#0071e3] hover:bg-[#0077ED] disabled:bg-white/[0.1] disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {addingAssignment ? 'Adding...' : 'Add'}
                </button>
              </div>
            </form>
          </div>

          {/* List */}
          <div className="bg-white/[0.05] border border-white/[0.06] rounded-2xl overflow-hidden">
            {assignments.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-sm text-white/40">No assignments yet</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {assignments.map(a => (
                  <div key={a.id} className="px-6 py-4 flex items-start justify-between hover:bg-white/[0.02] transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white">{a.title}</p>
                      {a.description && <p className="text-xs text-white/40 mt-1">{a.description}</p>}
                      <div className="flex items-center gap-3 mt-2">
                        {a.due_date && (
                          <span className="text-xs text-white/40">
                            Due {new Date(a.due_date).toLocaleDateString()}
                          </span>
                        )}
                        <span className="text-xs text-white/30">
                          Added {new Date(a.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteAssignment(a.id)}
                      disabled={deletingAssignment === a.id}
                      className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors disabled:opacity-50 ml-4"
                    >
                      {deletingAssignment === a.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assigned Quizzes Tab */}
      {activeTab === 'quiz-assign' && (
        <div className="space-y-6">
          {/* Assign form */}
          <div className="bg-white/[0.05] border border-white/[0.06] rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-white mb-4">Assign a Quiz</h2>
            <form onSubmit={handleAssignQuiz} className="space-y-3">
              <input
                type="text"
                placeholder="Topic name (e.g. Quadratic Equations)"
                value={quizAssignTopic}
                onChange={e => setQuizAssignTopic(e.target.value)}
                className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.06] rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#0071e3] focus:border-transparent"
              />
              {/* Mode selector */}
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'mini_quiz', label: 'Mini Quiz', marks: 15 },
                  { id: 'full_test', label: 'Full Test', marks: 50 },
                  { id: 'topic_focus', label: 'Topic Focus', marks: 25 },
                  { id: 'past_paper', label: 'Past Paper', marks: 75 },
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => { setQuizAssignMode(m.id); setQuizAssignMarks(m.marks); }}
                    className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                      quizAssignMode === m.id
                        ? 'bg-[#0071e3]/15 border-[#0071e3]/40 text-white'
                        : 'bg-white/[0.03] border-white/[0.06] text-white/40 hover:border-white/20'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Marks stepper */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-white/40">Marks:</span>
                <button type="button" onClick={() => setQuizAssignMarks(m => Math.max(5, m - 5))} className="w-7 h-7 flex items-center justify-center rounded bg-white/[0.05] border border-white/[0.06] text-white/60 hover:bg-white/[0.08] text-sm font-bold">-</button>
                <span className="text-sm text-white font-bold tabular-nums w-8 text-center">{quizAssignMarks}</span>
                <button type="button" onClick={() => setQuizAssignMarks(m => Math.min(100, m + 5))} className="w-7 h-7 flex items-center justify-center rounded bg-white/[0.05] border border-white/[0.06] text-white/60 hover:bg-white/[0.08] text-sm font-bold">+</button>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="datetime-local"
                  value={quizAssignDue}
                  onChange={e => setQuizAssignDue(e.target.value)}
                  className="px-3 py-2 bg-white/[0.05] border border-white/[0.06] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#0071e3] focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={assigningQuiz || !quizAssignTopic.trim()}
                  className="px-4 py-2 bg-[#0071e3] hover:bg-[#0077ED] disabled:bg-white/[0.1] disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {assigningQuiz ? 'Generating...' : 'Assign Quiz'}
                </button>
              </div>
              {assigningQuiz && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                    <p className="text-sm text-blue-400">Generating {quizAssignMarks}-mark quiz with AI... this may take a moment.</p>
                  </div>
                </div>
              )}
              <p className="text-xs text-white/30">
                Subject: {cls?.subject || '—'} · Questions are auto-generated for {cls?.year_group?.replace('year', 'Year ') || 'the class'}
              </p>
            </form>
          </div>

          {/* Quiz assignments list */}
          <div className="bg-white/[0.05] border border-white/[0.06] rounded-2xl overflow-hidden">
            {quizAssignments.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-sm text-white/40">No quizzes assigned yet</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {quizAssignments.map(qa => (
                  <div key={qa.id} className="px-6 py-4 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white">{qa.topic_name}</p>
                        <div className="flex items-center gap-3 mt-2">
                          {qa.due_date && (
                            <span className={`text-xs ${new Date(qa.due_date) < new Date() ? 'text-red-400' : 'text-white/40'}`}>
                              Due {new Date(qa.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                          <span className="text-xs text-white/30">
                            Created {new Date(qa.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      </div>
                      <div className="text-right ml-4 shrink-0">
                        <p className="text-sm font-semibold text-white">
                          {qa.studentsCompleted}/{qa.totalStudents}
                        </p>
                        <p className="text-xs text-white/30">completed</p>
                        {qa.studentsStarted > qa.studentsCompleted && (
                          <p className="text-xs text-amber-400 mt-0.5">
                            {qa.studentsStarted - qa.studentsCompleted} in progress
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Resources Tab */}
      {activeTab === 'resources' && (
        <div className="space-y-6">
          {/* Add form */}
          <div className="bg-white/[0.05] border border-white/[0.06] rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-white mb-4">Add Resource</h2>
            <form onSubmit={handleAddResource} className="space-y-3">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Resource title"
                  value={newResource.title}
                  onChange={e => setNewResource(p => ({ ...p, title: e.target.value }))}
                  className="flex-1 px-3 py-2 bg-white/[0.05] border border-white/[0.06] rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#0071e3] focus:border-transparent"
                />
                <select
                  value={newResource.type}
                  onChange={e => setNewResource(p => ({ ...p, type: e.target.value }))}
                  className="px-3 py-2 bg-white/[0.05] border border-white/[0.06] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#0071e3] focus:border-transparent"
                >
                  <option className="bg-neutral-900 text-white" value="link">Link</option>
                  <option className="bg-neutral-900 text-white" value="note">Note</option>
                </select>
              </div>
              {newResource.type === 'link' && (
                <input
                  type="url"
                  placeholder="URL (e.g. https://example.com)"
                  value={newResource.url}
                  onChange={e => setNewResource(p => ({ ...p, url: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.06] rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#0071e3] focus:border-transparent"
                />
              )}
              <textarea
                placeholder="Description (optional)"
                value={newResource.description}
                onChange={e => setNewResource(p => ({ ...p, description: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.06] rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#0071e3] focus:border-transparent resize-none"
              />
              <button
                type="submit"
                disabled={addingResource || !newResource.title.trim()}
                className="px-4 py-2 bg-[#0071e3] hover:bg-[#0077ED] disabled:bg-white/[0.1] disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
              >
                {addingResource ? 'Adding...' : 'Add Resource'}
              </button>
            </form>
          </div>

          {/* List */}
          <div className="bg-white/[0.05] border border-white/[0.06] rounded-2xl overflow-hidden">
            {resources.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-sm text-white/40">No resources yet</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {resources.map(r => (
                  <div key={r.id} className="px-6 py-4 flex items-start justify-between hover:bg-white/[0.02] transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white">{r.title}</p>
                        <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                          r.type === 'link' ? 'bg-blue-500/10 text-blue-400' : 'bg-white/[0.06] text-white/60'
                        }`}>{r.type}</span>
                      </div>
                      {r.url && (
                        <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#0071e3] hover:underline mt-1 block truncate">
                          {r.url}
                        </a>
                      )}
                      {r.description && <p className="text-xs text-white/40 mt-1">{r.description}</p>}
                      <span className="text-xs text-white/30 mt-2 block">
                        Added {new Date(r.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteResource(r.id)}
                      disabled={deletingResource === r.id}
                      className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors disabled:opacity-50 ml-4"
                    >
                      {deletingResource === r.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Topics Tab */}
      {activeTab === 'topics' && (
        <div className="bg-white/[0.05] border border-white/[0.06] rounded-2xl">
          {/* Filter Bar */}
          <div className="p-4 border-b border-white/[0.04] flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-sm font-semibold text-white">Topic Analytics</h3>
            <div className="flex items-center gap-2">
              <label className="text-xs text-white/40">Time period:</label>
              <select
                value={topicsDateRange}
                onChange={(e) => setTopicsDateRange(e.target.value)}
                className="text-sm px-3 py-1.5 bg-white/[0.05] border border-white/[0.06] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
              >
                <option className="bg-neutral-900 text-white" value="all">All Time</option>
                <option className="bg-neutral-900 text-white" value="week">This Week</option>
                <option className="bg-neutral-900 text-white" value="month">This Month</option>
              </select>
            </div>
          </div>

          <div className="p-6">
            {topicsLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-[3px] border-white/20 border-t-white/60 rounded-full animate-spin" />
              </div>
            ) : topicsData ? (
              <div className="space-y-8">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-500/10 rounded-xl">
                    <p className="text-2xl font-bold text-blue-400">{topicsData.totalTopics}</p>
                    <p className="text-xs text-blue-400 mt-1">Topics Discussed</p>
                  </div>
                  <div className="p-4 bg-green-500/10 rounded-xl">
                    <p className="text-2xl font-bold text-green-400">{topicsData.totalStudentsEngaged}</p>
                    <p className="text-xs text-green-400 mt-1">Students Engaged</p>
                  </div>
                  <div className="p-4 bg-purple-500/10 rounded-xl">
                    <p className="text-2xl font-bold text-purple-400">{topicsData.ratings?.length || 0}</p>
                    <p className="text-xs text-purple-400 mt-1">Topics Rated</p>
                  </div>
                  <div className="p-4 bg-amber-500/10 rounded-xl">
                    <p className="text-2xl font-bold text-amber-400">{topicsData.strugglingTopics?.length || 0}</p>
                    <p className="text-xs text-amber-400 mt-1">Need Attention</p>
                  </div>
                </div>

                {/* Topic Bar Chart */}
                {topicsData.topics?.length > 0 && (
                  <TopicBarChart
                    topics={topicsData.topics}
                    maxItems={10}
                    title="Most Discussed Topics"
                  />
                )}

                {/* Struggling Topics Alert */}
                {topicsData.strugglingTopics?.length > 0 && (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <h4 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                      </svg>
                      Topics Needing Attention
                    </h4>
                    <div className="space-y-2">
                      {topicsData.strugglingTopics.map((topic, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="text-amber-400">{topic.topic}</span>
                          <span className="text-amber-400 font-medium">
                            Avg. {topic.averageRating}/5 ({topic.ratingCount} ratings)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Student Breakdown */}
                {topicsData.students?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-4">Student Engagement</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/[0.06]">
                            <th className="text-left py-3 px-4 text-white/40 font-medium">Student</th>
                            <th className="text-left py-3 px-4 text-white/40 font-medium">Topics</th>
                            <th className="text-left py-3 px-4 text-white/40 font-medium">Messages</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                          {topicsData.students.slice(0, 10).map((student, idx) => (
                            <tr key={idx} className="hover:bg-white/[0.02]">
                              <td className="py-3 px-4 text-white">{student.email}</td>
                              <td className="py-3 px-4 text-white/60">{student.topicCount}</td>
                              <td className="py-3 px-4 text-white/60">{student.totalMessages}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {topicsData.topics?.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-white/[0.06] rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                      </svg>
                    </div>
                    <p className="text-white/40 text-sm">No topic data yet.</p>
                    <p className="text-white/30 text-xs mt-1">Topics will appear as students chat with Newton.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-white/40 text-sm">
                Unable to load topic data.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quizzes Tab */}
      {activeTab === 'quizzes' && (
        <div className="space-y-6">
          {/* Date Range Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/40">Time range:</span>
            <select
              value={quizzesDateRange}
              onChange={(e) => setQuizzesDateRange(e.target.value)}
              className="px-3 py-1.5 text-sm bg-white/[0.05] border border-white/[0.06] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
            >
              <option className="bg-neutral-900 text-white" value="all">All Time</option>
              <option className="bg-neutral-900 text-white" value="week">This Week</option>
              <option className="bg-neutral-900 text-white" value="month">This Month</option>
            </select>
          </div>

          {quizzesLoading ? (
            <div className="bg-white/[0.05] border border-white/[0.06] rounded-2xl p-8 flex items-center justify-center">
              <div className="flex items-center gap-3 text-white/40">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm">Loading quiz data...</span>
              </div>
            </div>
          ) : quizzesData ? (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/[0.05] border border-white/[0.06] rounded-2xl p-4">
                  <p className="text-2xl font-bold text-white">{quizzesData.stats?.totalQuizzes || 0}</p>
                  <p className="text-sm text-white/40">Total Quizzes</p>
                </div>
                <div className="bg-white/[0.05] border border-white/[0.06] rounded-2xl p-4">
                  <p className="text-2xl font-bold text-green-400">{quizzesData.stats?.completedQuizzes || 0}</p>
                  <p className="text-sm text-white/40">Completed</p>
                </div>
                <div className="bg-white/[0.05] border border-white/[0.06] rounded-2xl p-4">
                  <p className="text-2xl font-bold text-blue-400">{quizzesData.stats?.studentsEngaged || 0}</p>
                  <p className="text-sm text-white/40">Students Engaged</p>
                </div>
                <div className="bg-white/[0.05] border border-white/[0.06] rounded-2xl p-4">
                  <p className="text-2xl font-bold text-amber-400">{quizzesData.stats?.classAverageScore || 0}%</p>
                  <p className="text-sm text-white/40">Class Average</p>
                </div>
              </div>

              {/* Struggling Topics Alert */}
              {quizzesData.strugglingTopics?.length > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    <div>
                      <h4 className="font-semibold text-amber-400 mb-1">Topics Needing Attention</h4>
                      <p className="text-sm text-amber-400 mb-2">These topics have average scores below 60%:</p>
                      <div className="flex flex-wrap gap-2">
                        {quizzesData.strugglingTopics.map((topic, i) => (
                          <span key={i} className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-full">
                            {topic.topic} ({topic.averageScore}%)
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Topic Performance */}
              {quizzesData.topicPerformance?.length > 0 && (
                <div className="bg-white/[0.05] border border-white/[0.06] rounded-2xl">
                  <div className="px-4 py-3 border-b border-white/[0.04]">
                    <h3 className="font-semibold text-white">Performance by Topic</h3>
                  </div>
                  <div className="divide-y divide-white/[0.04]">
                    {quizzesData.topicPerformance.slice(0, 10).map((topic, i) => (
                      <div key={i} className="px-4 py-3 flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">{topic.topic}</p>
                          <p className="text-xs text-white/40">{topic.attempts} attempts by {topic.studentCount} students</p>
                        </div>
                        <div className="flex items-center gap-4 ml-4">
                          <div className="text-right">
                            <p className={`text-lg font-bold ${parseFloat(topic.averageScore) >= 70 ? 'text-green-400' : parseFloat(topic.averageScore) >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                              {topic.averageScore}%
                            </p>
                            <p className="text-xs text-white/30">Average</p>
                          </div>
                          <div className="w-24 hidden sm:block">
                            <div className="flex gap-1 text-xs">
                              <span className="text-green-400" title="Easy">{topic.averageEasy}%</span>
                              <span className="text-amber-400" title="Medium">{topic.averageMedium}%</span>
                              <span className="text-red-400" title="Hard">{topic.averageHard}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Student Performance */}
              {quizzesData.studentPerformance?.length > 0 && (
                <div className="bg-white/[0.05] border border-white/[0.06] rounded-2xl">
                  <div className="px-4 py-3 border-b border-white/[0.04]">
                    <h3 className="font-semibold text-white">Student Performance</h3>
                  </div>
                  <div className="divide-y divide-white/[0.04]">
                    {quizzesData.studentPerformance.map((student, i) => (
                      <div key={i} className="px-4 py-3 flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">{student.email}</p>
                          <p className="text-xs text-white/40">{student.quizzesCompleted} quizzes completed</p>
                        </div>
                        <div className="text-right ml-4">
                          <p className={`text-lg font-bold ${parseFloat(student.averageScore) >= 70 ? 'text-green-400' : parseFloat(student.averageScore) >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                            {student.averageScore}%
                          </p>
                          <p className="text-xs text-white/30">Average score</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* In Progress Quizzes */}
              {quizzesData.inProgressQuizzes?.length > 0 && (
                <div className="bg-white/[0.05] border border-white/[0.06] rounded-2xl">
                  <div className="px-4 py-3 border-b border-white/[0.04] bg-amber-500/10">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                      In Progress
                    </h3>
                  </div>
                  <div className="divide-y divide-white/[0.04]">
                    {quizzesData.inProgressQuizzes.map((quiz, i) => (
                      <div key={i} className="px-4 py-3 flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">{quiz.topic}</p>
                          <p className="text-xs text-white/40">{quiz.visibleName}</p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-sm font-medium text-amber-400">
                            {quiz.easyScore + quiz.mediumScore + quiz.hardScore}/15
                          </p>
                          <p className="text-xs text-white/30">
                            Started {quiz.startedAt ? new Date(quiz.startedAt).toLocaleDateString() : 'Not started'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Completed Quizzes */}
              {quizzesData.recentQuizzes?.length > 0 && (
                <div className="bg-white/[0.05] border border-white/[0.06] rounded-2xl">
                  <div className="px-4 py-3 border-b border-white/[0.04] bg-emerald-500/10">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Completed
                    </h3>
                  </div>
                  <div className="divide-y divide-white/[0.04]">
                    {quizzesData.recentQuizzes.map((quiz, i) => (
                      <div key={i} className="px-4 py-3 flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">{quiz.topic}</p>
                          <p className="text-xs text-white/40">{quiz.visibleName}</p>
                        </div>
                        <div className="text-right ml-4">
                          <p className={`font-bold ${quiz.score >= 11 ? 'text-green-400' : quiz.score >= 8 ? 'text-amber-400' : 'text-red-400'}`}>
                            {quiz.score}/15
                          </p>
                          <p className="text-xs text-white/30">
                            {new Date(quiz.completedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State - only show when no quizzes at all */}
              {(!quizzesData.inProgressQuizzes || quizzesData.inProgressQuizzes.length === 0) &&
               (!quizzesData.recentQuizzes || quizzesData.recentQuizzes.length === 0) && (
                <div className="bg-white/[0.05] border border-white/[0.06] rounded-2xl p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-white/[0.06] rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                    </svg>
                  </div>
                  <h3 className="text-white font-medium mb-1">No Quiz Data Yet</h3>
                  <p className="text-white/40 text-sm">Quiz results will appear here once students start quizzes.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white/[0.05] border border-white/[0.06] rounded-2xl p-8 text-center text-white/40 text-sm">
              Unable to load quiz data.
            </div>
          )}
        </div>
      )}

      {/* Mastery Tab */}
      {activeTab === 'mastery' && (
        <div className="space-y-6">
          {/* Date Range Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/40">Time range:</span>
            <select
              value={masteryDateRange}
              onChange={(e) => setMasteryDateRange(e.target.value)}
              className="px-3 py-1.5 text-sm bg-white/[0.05] border border-white/[0.06] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
            >
              <option className="bg-neutral-900 text-white" value="all">All Time</option>
              <option className="bg-neutral-900 text-white" value="week">This Week</option>
              <option className="bg-neutral-900 text-white" value="month">This Month</option>
            </select>
          </div>

          {masteryLoading ? (
            <div className="bg-white/[0.05] border border-white/[0.06] rounded-2xl p-8 flex items-center justify-center">
              <div className="flex items-center gap-3 text-white/40">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm">Loading mastery data...</span>
              </div>
            </div>
          ) : masteryData ? (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/[0.05] border border-white/[0.06] rounded-2xl p-4">
                  <p className="text-2xl font-bold text-white">{masteryData.stats?.totalSessions || 0}</p>
                  <p className="text-sm text-white/40">Chat Sessions Analyzed</p>
                </div>
                <div className="bg-white/[0.05] border border-white/[0.06] rounded-2xl p-4">
                  <p className="text-2xl font-bold text-blue-400">{masteryData.stats?.studentsAnalyzed || 0}</p>
                  <p className="text-sm text-white/40">Students Analyzed</p>
                </div>
                <div className="bg-white/[0.05] border border-white/[0.06] rounded-2xl p-4">
                  <p className="text-2xl font-bold text-amber-400">{masteryData.stats?.averageMastery || 0}/5</p>
                  <p className="text-sm text-white/40">Avg Mastery Level</p>
                </div>
                <div className="bg-white/[0.05] border border-white/[0.06] rounded-2xl p-4">
                  <p className="text-2xl font-bold text-red-400">{masteryData.stats?.studentsNeedingHelp || 0}</p>
                  <p className="text-sm text-white/40">Need Intervention</p>
                </div>
              </div>

              {/* Students Needing Help Alert */}
              {masteryData.studentsNeedingHelp?.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    <div>
                      <h4 className="font-semibold text-red-400 mb-1">Students Needing Intervention</h4>
                      <p className="text-sm text-red-400 mb-2">These students have average mastery levels below 2.5/5:</p>
                      <div className="flex flex-wrap gap-2">
                        {masteryData.studentsNeedingHelp.map((student, i) => (
                          <span key={i} className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-medium rounded-full">
                            {student.visibleName} ({student.averageMastery}/5)
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Class Blind Spots */}
              {masteryData.classBlindSpots?.length > 0 && (
                <div className="bg-white/[0.05] border border-white/[0.06] rounded-2xl">
                  <div className="px-4 py-3 border-b border-white/[0.04] bg-amber-500/10">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Common Blind Spots Across Class
                    </h3>
                  </div>
                  <div className="divide-y divide-white/[0.04]">
                    {masteryData.classBlindSpots.map((spot, i) => (
                      <div key={i} className="px-4 py-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white">{spot.blindSpot}</p>
                            <p className="text-xs text-white/40 mt-1">
                              Affects {spot.studentCount} student{spot.studentCount !== 1 ? 's' : ''} ({spot.occurrences} occurrences)
                            </p>
                            {spot.relatedTopics?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {spot.relatedTopics.map((topic, j) => (
                                  <span key={j} className="px-1.5 py-0.5 bg-white/[0.06] text-white/60 text-xs rounded">
                                    {topic}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                              <span className="text-sm font-bold text-amber-400">{spot.studentCount}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Student Mastery List */}
              {masteryData.studentMastery?.length > 0 && (
                <div className="bg-white/[0.05] border border-white/[0.06] rounded-2xl">
                  <div className="px-4 py-3 border-b border-white/[0.04]">
                    <h3 className="font-semibold text-white">Student Mastery Overview</h3>
                    <p className="text-xs text-white/40 mt-0.5">Sorted by mastery level (lowest first)</p>
                  </div>
                  <div className="divide-y divide-white/[0.04]">
                    {masteryData.studentMastery.map((student, i) => (
                      <div key={i} className="px-4 py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white">{student.visibleName}</p>
                            <p className="text-xs text-white/40">
                              {student.sessions} sessions · {student.topicsCovered} topics · {student.uniqueBlindSpots} blind spots
                            </p>
                            {student.topBlindSpots?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {student.topBlindSpots.map((spot, j) => (
                                  <span key={j} className="px-1.5 py-0.5 bg-red-500/10 text-red-400 text-xs rounded">
                                    {spot.length > 40 ? spot.substring(0, 40) + '...' : spot}
                                  </span>
                                ))}
                              </div>
                            )}
                            {student.recentSummary && (
                              <p className="text-xs text-white/30 mt-1 italic">"{student.recentSummary}"</p>
                            )}
                          </div>
                          <div className="text-right ml-4 flex-shrink-0">
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((level) => (
                                <div
                                  key={level}
                                  className={`w-3 h-3 rounded-full ${
                                    parseFloat(student.averageMastery) >= level
                                      ? parseFloat(student.averageMastery) >= 3.5
                                        ? 'bg-green-500'
                                        : parseFloat(student.averageMastery) >= 2.5
                                        ? 'bg-amber-500'
                                        : 'bg-red-500'
                                      : 'bg-white/[0.08]'
                                  }`}
                                />
                              ))}
                            </div>
                            <p className="text-xs text-white/40 mt-1">{student.averageMastery}/5</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Topic Mastery Breakdown */}
              {masteryData.topicMastery?.length > 0 && (
                <div className="bg-white/[0.05] border border-white/[0.06] rounded-2xl">
                  <div className="px-4 py-3 border-b border-white/[0.04]">
                    <h3 className="font-semibold text-white">Topic Mastery Breakdown</h3>
                    <p className="text-xs text-white/40 mt-0.5">Average class mastery by topic</p>
                  </div>
                  <div className="divide-y divide-white/[0.04]">
                    {masteryData.topicMastery.slice(0, 10).map((topic, i) => (
                      <div key={i} className="px-4 py-3 flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">{topic.topic}</p>
                          <p className="text-xs text-white/40">
                            {topic.studentCount} students · {topic.sessions} sessions
                          </p>
                          {topic.commonBlindSpots?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {topic.commonBlindSpots.map((spot, j) => (
                                <span key={j} className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 text-xs rounded">
                                  {spot.length > 30 ? spot.substring(0, 30) + '...' : spot}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <p className={`text-lg font-bold ${
                            parseFloat(topic.averageMastery) >= 3.5 ? 'text-green-400' :
                            parseFloat(topic.averageMastery) >= 2.5 ? 'text-amber-400' : 'text-red-400'
                          }`}>
                            {topic.averageMastery}/5
                          </p>
                          <p className="text-xs text-white/30">Avg Mastery</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Analysis */}
              {masteryData.recentAnalysis?.length > 0 && (
                <div className="bg-white/[0.05] border border-white/[0.06] rounded-2xl">
                  <div className="px-4 py-3 border-b border-white/[0.04]">
                    <h3 className="font-semibold text-white">Recent Analysis</h3>
                  </div>
                  <div className="divide-y divide-white/[0.04]">
                    {masteryData.recentAnalysis.map((analysis, i) => (
                      <div key={i} className="px-4 py-3 flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">{analysis.topic}</p>
                          <p className="text-xs text-white/40">{analysis.visibleName}</p>
                          {analysis.summary && (
                            <p className="text-xs text-white/30 mt-1 italic line-clamp-1">"{analysis.summary}"</p>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <p className={`font-bold ${
                            analysis.mastery >= 4 ? 'text-green-400' :
                            analysis.mastery >= 3 ? 'text-amber-400' : 'text-red-400'
                          }`}>
                            {analysis.mastery}/5
                          </p>
                          <p className="text-xs text-white/30">
                            {new Date(analysis.analyzedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {(!masteryData.studentMastery || masteryData.studentMastery.length === 0) && (
                <div className="bg-white/[0.05] border border-white/[0.06] rounded-2xl p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-white/[0.06] rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                    </svg>
                  </div>
                  <h3 className="text-white font-medium mb-1">No Mastery Data Yet</h3>
                  <p className="text-white/40 text-sm">Learning insights will appear here as students chat with Newton.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white/[0.05] border border-white/[0.06] rounded-2xl p-8 text-center text-white/40 text-sm">
              Unable to load mastery data.
            </div>
          )}
        </div>
      )}

      {/* Syllabus Tab */}
      {activeTab === 'syllabus' && (
        <div className="bg-white/[0.05] border border-white/[0.06] rounded-2xl p-6">
          <h2 className="text-base font-semibold text-white mb-1">Syllabus Upload</h2>
          <p className="text-sm text-white/40 mb-6">
            Upload a syllabus PDF to extract topics and objectives. These are automatically used to ground Newton&apos;s responses for students in this class.
          </p>
          {cls.qan_code ? (
            <SyllabusUploader classId={id} qanCode={cls.qan_code} />
          ) : (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <p className="text-sm text-amber-400">
                This class has no qualification assigned.{' '}
                <Link href={`/teacher/class/${id}/edit`} className="underline hover:text-amber-300">
                  Edit the class
                </Link>{' '}
                to set a QAN code before uploading a syllabus.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
