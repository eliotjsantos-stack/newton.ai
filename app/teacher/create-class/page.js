'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ClassIcon, CLASS_ICON_KEYS } from '@/components/ClassIcons';
import QualificationSelector from '@/components/QualificationSelector';

const CLASS_COLORS = ['#3B82F6','#10B981','#8B5CF6','#F59E0B','#EF4444','#EC4899','#14B8A6','#F97316'];
const YEAR_GROUPS = [
  { value: 'year7', label: 'Year 7' },
  { value: 'year8', label: 'Year 8' },
  { value: 'year9', label: 'Year 9' },
  { value: 'year10', label: 'Year 10' },
  { value: 'year11', label: 'Year 11' },
  { value: 'year12', label: 'Year 12' },
  { value: 'year13', label: 'Year 13' },
];

const DRAFT_KEY = 'newton-class-draft';

function Tooltip({ text }) {
  return (
    <span className="group relative ml-1.5 inline-flex">
      <svg className="w-3.5 h-3.5 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        {text}
      </span>
    </span>
  );
}

export default function CreateClassPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [copied, setCopied] = useState(false);

  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [yearGroup, setYearGroup] = useState('year9');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [icon, setIcon] = useState('book');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [showClassmates, setShowClassmates] = useState(false);
  const [maxCapacity, setMaxCapacity] = useState('');
  const [schedule, setSchedule] = useState('');
  const [archiveDate, setArchiveDate] = useState('');
  const [qanCode, setQanCode] = useState(null);

  useEffect(() => {
    const check = async () => {
      const token = localStorage.getItem('newton-auth-token');
      if (!token) { window.location.href = '/login'; return; }
      try {
        const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (!data.isAdmin && data.accountType !== 'teacher') { window.location.href = '/login'; return; }
        setAuthorized(true);
      } catch { window.location.href = '/login'; }
      finally { setLoading(false); }
    };
    check();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const draft = JSON.parse(localStorage.getItem(DRAFT_KEY));
      if (draft) {
        setName(draft.name || '');
        setSubject(draft.subject || '');
        setYearGroup(draft.yearGroup || 'year9');
        setDescription(draft.description || '');
        setColor(draft.color || '#3B82F6');
        setIcon(draft.icon || 'book');
        setWelcomeMessage(draft.welcomeMessage || '');
        setShowClassmates(draft.showClassmates || false);
        setMaxCapacity(draft.maxCapacity || '');
        setSchedule(draft.schedule || '');
        setArchiveDate(draft.archiveDate || '');
        setQanCode(draft.qanCode || null);
      }
    } catch {}
  }, []);

  const saveDraft = useCallback(() => {
    if (success) return;
    localStorage.setItem(DRAFT_KEY, JSON.stringify({
      name, subject, yearGroup, description, color, icon,
      welcomeMessage, showClassmates, maxCapacity, schedule, archiveDate, qanCode
    }));
  }, [name, subject, yearGroup, description, color, icon, welcomeMessage, showClassmates, maxCapacity, schedule, archiveDate, qanCode, success]);

  useEffect(() => {
    const timer = setTimeout(saveDraft, 500);
    return () => clearTimeout(timer);
  }, [saveDraft]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Class name is required'); return; }
    if (!subject.trim()) { setError('Subject is required'); return; }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('newton-auth-token');
      const res = await fetch('/api/teacher/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: name.trim(), subject: subject.trim(), yearGroup,
          description: description.trim() || null, color, icon,
          welcomeMessage: welcomeMessage.trim() || null, showClassmates,
          maxCapacity: maxCapacity ? parseInt(maxCapacity) : null,
          schedule: schedule.trim() || null, archiveDate: archiveDate || null,
          qanCode: qanCode || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create class');
      localStorage.removeItem(DRAFT_KEY);
      setSuccess({ classCode: data.class.class_code, classId: data.class.id });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const copyCode = () => {
    if (!success) return;
    navigator.clipboard.writeText(success.classCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const printCode = () => {
    if (!success) return;
    const w = window.open('', '_blank');
    w.document.write(`
      <html><head><title>Class Code</title>
      <style>body{font-family:system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0}
      h1{font-size:2rem;margin-bottom:0.5rem}
      .code{font-size:4rem;font-weight:800;letter-spacing:0.1em;font-family:monospace;padding:1rem 2rem;border:4px dashed #333;border-radius:1rem;margin:1rem 0}
      p{color:#666;font-size:1.1rem}</style></head>
      <body><h1>${name}</h1><p>${subject} - ${YEAR_GROUPS.find(y=>y.value===yearGroup)?.label}</p>
      <div class="code">${success.classCode}</div>
      <p>Enter this code at Newton to join the class</p></body></html>
    `);
    w.document.close();
    w.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-[3px] border-gray-200 border-t-gray-500 rounded-full animate-spin" />
      </div>
    );
  }
  if (!authorized) return null;

  // Success screen
  if (success) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center">
        <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Class Created</h1>
        <p className="text-sm text-gray-500 mb-8">Share this code with your students so they can join.</p>

        <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-6 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Class Code</p>
          <div className="text-4xl font-mono font-bold text-gray-900 tracking-widest mb-5">{success.classCode}</div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={copyCode}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
            <button
              onClick={printCode}
              className="px-4 py-2 bg-gray-100 border border-gray-200 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
            >
              Print
            </button>
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <Link
            href={`/teacher/class/${success.classId}`}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Go to Class
          </Link>
          <Link
            href="/teacher/classes"
            className="px-5 py-2.5 bg-gray-100 border border-gray-200 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
          >
            My Classes
          </Link>
        </div>
      </div>
    );
  }

  const inputCls = "w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-200 transition-all placeholder:text-gray-400";

  return (
    <div className="max-w-2xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-6">
        <Link href="/teacher/classes" className="hover:text-gray-900 transition-colors">My Classes</Link>
        <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        <span className="text-gray-900 font-medium">Create Class</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Create a New Class</h1>
        <p className="text-sm text-gray-500 mt-1">Set up your class details and share the code with students.</p>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* CLASS BASICS */}
        <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-7 h-7 bg-amber-50 text-amber-600 rounded-md flex items-center justify-center text-xs font-semibold">1</div>
            <h2 className="text-base font-semibold text-gray-900">Class Basics</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Class Name <span className="text-red-500">*</span>
                <Tooltip text="A descriptive name students will see" />
              </label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder='e.g. "Year 9 Set 1 - Mathematics"' className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Subject <span className="text-red-500">*</span>
                <Tooltip text="Type any subject — Maths, Drama, Latin, etc." />
              </label>
              <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Mathematics, Drama, Latin, RS..." className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Year Group <span className="text-red-500">*</span></label>
              <select value={yearGroup} onChange={(e) => setYearGroup(e.target.value)} className={inputCls}>
                {YEAR_GROUPS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            {['year10', 'year11', 'year12', 'year13'].includes(yearGroup) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Exam Board & Specification
                  <Tooltip text="Links this class to a specific syllabus for AI grounding" />
                </label>
                <QualificationSelector
                  value={qanCode}
                  onSelect={(qan) => setQanCode(qan)}
                  levelFilter={['year10', 'year11'].includes(yearGroup) ? 2 : 3}
                  placeholder={['year10', 'year11'].includes(yearGroup) ? 'Search GCSE specifications...' : 'Search A-Level specifications...'}
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  This ensures Newton teaches to the correct specification when students chat in this class.
                </p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description
                <Tooltip text="Optional overview of what students will learn" />
              </label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="What will students learn in this class?" rows={3}
                className={inputCls + ' resize-none'} />
            </div>
          </div>
        </section>

        {/* CUSTOMISATION */}
        <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-7 h-7 bg-purple-50 text-purple-600 rounded-md flex items-center justify-center text-xs font-semibold">2</div>
            <h2 className="text-base font-semibold text-gray-900">Customisation</h2>
          </div>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2.5">
                Class Colour
                <Tooltip text="Used for visual distinction between classes" />
              </label>
              <div className="flex gap-2.5 flex-wrap">
                {CLASS_COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setColor(c)}
                    className={`w-9 h-9 rounded-lg transition-all ${color === c ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-white scale-110' : 'hover:scale-105'}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2.5">Class Icon</label>
              <div className="flex gap-2 flex-wrap">
                {CLASS_ICON_KEYS.map(key => (
                  <button key={key} type="button" onClick={() => setIcon(key)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${icon === key ? 'bg-amber-50 ring-2 ring-amber-500 ring-offset-1 ring-offset-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                    <ClassIcon name={key} size={20} className="text-gray-600" />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Welcome Message
                <Tooltip text="Shown to students when they first join" />
              </label>
              <textarea value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)}
                placeholder="Welcome to the class! Here's what to expect..." rows={2}
                className={inputCls + ' resize-none'} />
            </div>
          </div>
        </section>

        {/* SETTINGS */}
        <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-7 h-7 bg-emerald-50 text-emerald-600 rounded-md flex items-center justify-center text-xs font-semibold">3</div>
            <h2 className="text-base font-semibold text-gray-900">Settings</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-medium text-gray-700">Students can see classmates</p>
                <p className="text-xs text-gray-500 mt-0.5">Allow students to see who else is in the class</p>
              </div>
              <button type="button" onClick={() => setShowClassmates(!showClassmates)}
                className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${showClassmates ? 'bg-amber-600' : 'bg-gray-200'}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${showClassmates ? 'left-[calc(100%-1.375rem)]' : 'left-0.5'}`} />
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Max Capacity <Tooltip text="Leave blank for unlimited" />
              </label>
              <input type="number" value={maxCapacity} onChange={(e) => setMaxCapacity(e.target.value)}
                placeholder="e.g. 30" min="1" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Class Schedule <Tooltip text="When does this class meet?" />
              </label>
              <input type="text" value={schedule} onChange={(e) => setSchedule(e.target.value)}
                placeholder="e.g. Mon/Wed 9-10am" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Archive Date <Tooltip text="Class will be archived after this date" />
              </label>
              <input type="date" value={archiveDate} onChange={(e) => setArchiveDate(e.target.value)} className={inputCls} />
            </div>
          </div>
        </section>

        {/* PREVIEW & SUBMIT */}
        <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-7 h-7 bg-amber-50 text-amber-600 rounded-md flex items-center justify-center text-xs font-semibold">4</div>
            <h2 className="text-base font-semibold text-gray-900">Review & Create</h2>
          </div>
          {/* Preview card */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: color + '15', color }}>
                <ClassIcon name={icon} size={24} />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{name || 'Class Name'}</h3>
                <p className="text-sm text-gray-500">{subject || 'Subject'} · {YEAR_GROUPS.find(y => y.value === yearGroup)?.label}</p>
                {description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{description}</p>}
              </div>
            </div>
          </div>

          <button type="submit" disabled={submitting || !name.trim() || !subject.trim()}
            className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors">
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-amber-200 border-t-white rounded-full animate-spin" />
                Creating Class...
              </span>
            ) : 'Create Class'}
          </button>
        </section>
      </form>
    </div>
  );
}
