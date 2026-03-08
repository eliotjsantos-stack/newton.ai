'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ClassIcon } from '@/components/ClassIcons';

export default function MyClassesPage() {
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [filter, setFilter] = useState('active');
  const [copiedId, setCopiedId] = useState(null);

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
        setClasses(classData.classes || []);
      } catch {
        window.location.href = '/login';
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const copyCode = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = classes.filter(c => filter === 'active' ? !c.archived : c.archived);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-[3px] border-gray-200 border-t-gray-600 rounded-full animate-spin" />
      </div>
    );
  }
  if (!authorized) return null;

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">My Classes</h1>
          <p className="text-sm text-gray-500 mt-1">{classes.length} class{classes.length !== 1 ? 'es' : ''} total</p>
        </div>
        <Link
          href="/teacher/create-class"
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-md transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Create Class
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-6">
          <button
            onClick={() => setFilter('active')}
            className={`pb-3 text-sm font-medium transition-colors relative ${filter === 'active' ? 'text-amber-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Active
            {filter === 'active' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600 rounded-full" />}
          </button>
          <button
            onClick={() => setFilter('archived')}
            className={`pb-3 text-sm font-medium transition-colors relative ${filter === 'archived' ? 'text-amber-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Archived
            {filter === 'archived' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600 rounded-full" />}
          </button>
        </div>
      </div>

      {/* Classes grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="flex justify-center mb-4">
            <ClassIcon name="book" size={48} className="text-gray-300" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            {filter === 'active' ? 'No active classes' : 'No archived classes'}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {filter === 'active' ? 'Create your first class to get started.' : 'Archived classes will appear here.'}
          </p>
          {filter === 'active' && (
            <Link href="/teacher/create-class" className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-md transition-colors inline-block">
              Create Class
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(cls => (
            <div key={cls.id} className="bg-white rounded-xl hover:shadow-md transition-all [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]">
              <Link href={`/teacher/class/${cls.id}`} className="block p-5 pb-3">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: (cls.color || '#3B82F6') + '20', color: cls.color || '#3B82F6' }}>
                    <ClassIcon name={cls.icon || 'book'} size={22} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">{cls.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{cls.subject} · {cls.year_group?.replace('year', 'Year ')}</p>
                  </div>
                </div>
              </Link>

              <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--c-border)]">
                <button
                  onClick={(e) => { e.stopPropagation(); copyCode(cls.class_code, cls.id); }}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-xs font-mono text-gray-500 transition-colors"
                  title="Click to copy class code"
                >
                  <span>{cls.class_code}</span>
                  {copiedId === cls.id ? (
                    <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  ) : (
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  )}
                </button>
                <span className="text-xs text-gray-400">{cls.student_count || 0} student{(cls.student_count || 0) !== 1 ? 's' : ''}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
