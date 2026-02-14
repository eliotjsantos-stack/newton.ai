'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ClassIcon, CLASS_ICON_KEYS } from '@/components/ClassIcons';

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

export default function EditClassPage() {
  const { id } = useParams();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [students, setStudents] = useState([]);

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
  const [classCode, setClassCode] = useState('');

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem('newton-auth-token');
      if (!token) { window.location.href = '/login'; return; }
      try {
        const meRes = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
        const me = await meRes.json();
        if (!me.isAdmin && me.accountType !== 'teacher') { window.location.href = '/login'; return; }
        setAuthorized(true);

        const [classRes, studentsRes] = await Promise.all([
          fetch(`/api/teacher/classes/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/teacher/classes/${id}/students`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (!classRes.ok) { router.push('/teacher/classes'); return; }

        const { class: cls } = await classRes.json();
        setName(cls.name || '');
        setSubject(cls.subject || '');
        setYearGroup(cls.year_group || 'year9');
        setDescription(cls.description || '');
        setColor(cls.color || '#3B82F6');
        setIcon(cls.icon || 'book');
        setWelcomeMessage(cls.welcome_message || '');
        setShowClassmates(cls.show_classmates || false);
        setMaxCapacity(cls.max_capacity ? String(cls.max_capacity) : '');
        setSchedule(cls.schedule || '');
        setArchiveDate(cls.archive_date || '');
        setClassCode(cls.class_code || '');

        const studentsData = await studentsRes.json();
        setStudents(studentsData.students || []);
      } catch {
        window.location.href = '/login';
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, router]);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !subject.trim()) { setError('Name and subject are required'); return; }
    setSaving(true);
    try {
      const token = localStorage.getItem('newton-auth-token');
      const res = await fetch(`/api/teacher/classes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: name.trim(), subject: subject.trim(), yearGroup, description: description.trim() || null,
          color, icon, welcomeMessage: welcomeMessage.trim() || null, showClassmates,
          maxCapacity: maxCapacity ? parseInt(maxCapacity) : null,
          schedule: schedule.trim() || null, archiveDate: archiveDate || null,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to save');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const regenerateCode = async () => {
    if (!confirm('Regenerate class code? The old code will stop working immediately. Students who haven\'t joined yet will need the new code.')) return;
    try {
      const token = localStorage.getItem('newton-auth-token');
      const res = await fetch(`/api/teacher/classes/${id}/regenerate-code`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setClassCode(data.classCode);
    } catch {}
  };

  const archiveClass = async () => {
    if (!confirm('Archive this class? It will be hidden from your active classes list.')) return;
    try {
      const token = localStorage.getItem('newton-auth-token');
      await fetch(`/api/teacher/classes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ archived: true }),
      });
      router.push('/teacher/classes');
    } catch {}
  };

  const deleteClass = async () => {
    if (!confirm('Permanently delete this class? This cannot be undone. All student enrolments will be removed.')) return;
    try {
      const token = localStorage.getItem('newton-auth-token');
      await fetch(`/api/teacher/classes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      router.push('/teacher/classes');
    } catch {}
  };

  const exportCSV = () => {
    if (students.length === 0) return;
    const rows = [['Email', 'Year Group', 'Joined'].join(',')];
    students.forEach(s => {
      rows.push([s.email, s.yearGroup || '', s.joinedAt ? new Date(s.joinedAt).toLocaleDateString() : ''].join(','));
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.replace(/[^a-z0-9]/gi, '_')}_roster.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(classCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-[3px] border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }
  if (!authorized) return null;

  const inputCls = "w-full px-3 py-2 bg-white/[0.05] border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#0071e3] focus:border-transparent transition-all placeholder:text-white/20";

  return (
    <div className="max-w-2xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-white/40 mb-6">
        <Link href="/teacher/classes" className="hover:text-white transition-colors">My Classes</Link>
        <svg className="w-4 h-4 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        <Link href={`/teacher/class/${id}`} className="hover:text-white transition-colors truncate max-w-[150px]">{name}</Link>
        <svg className="w-4 h-4 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        <span className="text-white font-medium">Edit</span>
      </nav>

      <h1 className="text-2xl font-semibold text-white mb-6">Edit Class</h1>

      {/* Class code banner */}
      <div className="bg-[#0071e3]/10 border border-[#0071e3]/20 rounded-2xl px-5 py-4 mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-[#0071e3] uppercase tracking-wider mb-0.5">Current Class Code</p>
          <p className="text-2xl font-mono font-bold text-white tracking-wider">{classCode}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={copyCode} className="px-3 py-1.5 bg-white/[0.05] border border-[#0071e3]/20 hover:bg-[#0071e3]/10 text-[#0071e3] rounded-md text-xs font-medium transition-colors">
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button onClick={regenerateCode} className="px-3 py-1.5 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 rounded-md text-xs font-medium transition-colors">
            Regenerate
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-2">
          <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basics */}
        <section className="bg-white/[0.05] border border-white/[0.06] rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-white mb-4">Class Basics</h2>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Class Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Subject</label>
            <input type="text" value={subject} onChange={e => setSubject(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Year Group</label>
            <select value={yearGroup} onChange={e => setYearGroup(e.target.value)} className={inputCls}>
              {YEAR_GROUPS.map(({ value, label }) => (<option key={value} value={value}>{label}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className={inputCls + ' resize-none'} />
          </div>
        </section>

        {/* Customisation */}
        <section className="bg-white/[0.05] border border-white/[0.06] rounded-2xl p-6 space-y-5">
          <h2 className="text-base font-semibold text-white mb-4">Customisation</h2>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2.5">Colour</label>
            <div className="flex gap-2.5 flex-wrap">
              {CLASS_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={`w-9 h-9 rounded-lg transition-all ${color === c ? 'ring-2 ring-[#0071e3] ring-offset-2 ring-offset-[#0B0B0C] scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2.5">Icon</label>
            <div className="flex gap-2 flex-wrap">
              {CLASS_ICON_KEYS.map(key => (
                <button key={key} type="button" onClick={() => setIcon(key)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${icon === key ? 'bg-white/[0.08] ring-2 ring-[#0071e3] ring-offset-1 ring-offset-[#0B0B0C]' : 'bg-white/[0.03] hover:bg-white/[0.06]'}`}>
                  <ClassIcon name={key} size={20} className="text-white/60" />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Welcome Message</label>
            <textarea value={welcomeMessage} onChange={e => setWelcomeMessage(e.target.value)} rows={2} className={inputCls + ' resize-none'} />
          </div>
        </section>

        {/* Settings */}
        <section className="bg-white/[0.05] border border-white/[0.06] rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-white mb-4">Settings</h2>
          <div className="flex items-center justify-between py-1">
            <p className="text-sm font-medium text-white/70">Students can see classmates</p>
            <button type="button" onClick={() => setShowClassmates(!showClassmates)}
              className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${showClassmates ? 'bg-[#0071e3]' : 'bg-white/[0.1]'}`}>
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${showClassmates ? 'left-[calc(100%-1.375rem)]' : 'left-0.5'}`} />
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Max Capacity</label>
            <input type="number" value={maxCapacity} onChange={e => setMaxCapacity(e.target.value)} min="1" placeholder="Unlimited" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Schedule</label>
            <input type="text" value={schedule} onChange={e => setSchedule(e.target.value)} placeholder="e.g. Mon/Wed 9-10am" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Archive Date</label>
            <input type="date" value={archiveDate} onChange={e => setArchiveDate(e.target.value)} className={inputCls} />
          </div>
        </section>

        {/* Save */}
        <button type="submit" disabled={saving}
          className="w-full py-2.5 bg-[#0071e3] hover:bg-[#0077ED] disabled:bg-white/[0.1] text-white text-sm font-medium rounded-lg transition-colors">
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </form>

      {/* Danger zone */}
      <section className="mt-8 bg-white/[0.05] border border-red-500/20 rounded-2xl p-6">
        <h2 className="text-base font-semibold text-red-400 mb-1">Danger Zone</h2>
        <p className="text-sm text-white/40 mb-4">These actions are permanent and cannot be undone.</p>
        <div className="flex flex-wrap gap-3">
          <button onClick={exportCSV} disabled={students.length === 0}
            className="px-4 py-2 bg-white/[0.05] border border-white/[0.06] hover:bg-white/[0.08] disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
            Export Roster (CSV)
          </button>
          <button onClick={archiveClass}
            className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 text-sm font-medium rounded-lg transition-colors">
            Archive Class
          </button>
          <button onClick={deleteClass}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors">
            Delete Class
          </button>
        </div>
      </section>
    </div>
  );
}
