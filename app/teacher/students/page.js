'use client';

import { useState, useEffect } from 'react';

export default function StudentsPage() {
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [filterClass, setFilterClass] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem('newton-auth-token');
      if (!token) { window.location.href = '/login'; return; }
      try {
        const meRes = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
        const me = await meRes.json();
        if (!me.isAdmin && me.accountType !== 'teacher') { window.location.href = '/login'; return; }
        setAuthorized(true);

        const classRes = await fetch('/api/teacher/classes', { headers: { Authorization: `Bearer ${token}` } });
        const classData = await classRes.json();
        const allClasses = classData.classes || [];
        setClasses(allClasses);

        // Fetch students for each class
        const allStudents = [];
        const seen = new Set();
        for (const cls of allClasses) {
          const sRes = await fetch(`/api/teacher/classes/${cls.id}/students`, { headers: { Authorization: `Bearer ${token}` } });
          const sData = await sRes.json();
          for (const s of (sData.students || [])) {
            const key = `${s.studentId}-${cls.id}`;
            if (!seen.has(key)) {
              seen.add(key);
              allStudents.push({ ...s, className: cls.name, classId: cls.id, classColor: cls.color });
            }
          }
        }
        setStudents(allStudents);
      } catch {
        window.location.href = '/login';
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = students.filter(s => {
    if (filterClass !== 'all' && s.classId !== filterClass) return false;
    if (search && !s.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Deduplicate for unique student count
  const uniqueStudentIds = new Set(students.map(s => s.studentId));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-[3px] border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }
  if (!authorized) return null;

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Students</h1>
        <p className="text-sm text-white/40 mt-1">{uniqueStudentIds.size} student{uniqueStudentIds.size !== 1 ? 's' : ''} across {classes.length} class{classes.length !== 1 ? 'es' : ''}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by email..."
          className="flex-1 px-3 py-2 bg-white/[0.05] border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#0071e3] focus:border-transparent placeholder:text-white/20"
        />
        <select
          value={filterClass}
          onChange={e => setFilterClass(e.target.value)}
          className="px-3 py-2 bg-white/[0.05] border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#0071e3] focus:border-transparent"
        >
          <option value="all" className="bg-neutral-900 text-white">All classes</option>
          {classes.map(c => (
            <option key={c.id} value={c.id} className="bg-neutral-900 text-white">{c.name}</option>
          ))}
        </select>
      </div>

      {/* Student list */}
      <div className="bg-white/[0.05] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="px-6 py-3 border-b border-white/[0.06]">
          <div className="flex items-center text-xs font-medium text-white/40 uppercase tracking-wide">
            <span className="flex-1">Student</span>
            <span className="w-40 hidden sm:block">Class</span>
            <span className="w-32 hidden md:block">Joined</span>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-white/40">{students.length === 0 ? 'No students have joined your classes yet.' : 'No students match your filters.'}</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {filtered.map((s, i) => (
              <div key={`${s.studentId}-${s.classId}-${i}`} className="px-6 py-3 flex items-center hover:bg-white/[0.02] transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{s.email}</p>
                  <p className="text-xs sm:hidden" style={{ color: s.classColor || '#3B82F6' }}>{s.className}</p>
                </div>
                <div className="w-40 hidden sm:block">
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium"
                    style={{ backgroundColor: (s.classColor || '#3B82F6') + '18', color: s.classColor || '#3B82F6' }}
                  >
                    {s.className}
                  </span>
                </div>
                <div className="w-32 hidden md:block">
                  <span className="text-xs text-white/40">{s.joinedAt ? new Date(s.joinedAt).toLocaleDateString() : '—'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
