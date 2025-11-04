'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Dashboard() {
  const defaultSubjects = ['General', 'Maths', 'Science', 'English', 'History', 'Languages'];
  
  const [subjects, setSubjects] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('newton-subjects');
      return saved ? JSON.parse(saved) : defaultSubjects;
    }
    return defaultSubjects;
  });

  const [subjectColors, setSubjectColors] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('newton-subject-colors');
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });

  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('newton-subjects', JSON.stringify(subjects));
    }
  }, [subjects, mounted]);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('newton-subject-colors', JSON.stringify(subjectColors));
    }
  }, [subjectColors, mounted]);

  const addSubject = () => {
    const newSubjectName = prompt('Enter new subject name:');
    if (newSubjectName && !subjects.includes(newSubjectName)) {
      setSubjects([...subjects, newSubjectName]);
    }
  };

  const deleteSubject = (subjectName, e) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(null);
    if (subjects.length === 1) {
      alert('Cannot delete the last subject!');
      return;
    }
    if (window.confirm(`Delete "${subjectName}"?`)) {
      setSubjects(subjects.filter(s => s !== subjectName));
    }
  };

  const renameSubject = (oldName, e) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(null);
    const newName = prompt('Rename subject:', oldName);
    if (newName && newName !== oldName && !subjects.includes(newName)) {
      setSubjects(subjects.map(s => s === oldName ? newName : s));
    }
  };

  const changeColor = (subject, e) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(null);
    
    const colors = [
      { name: 'Blue', bg: 'bg-blue-50', icon: 'bg-blue-600' },
      { name: 'Green', bg: 'bg-green-50', icon: 'bg-green-600' },
      { name: 'Purple', bg: 'bg-purple-50', icon: 'bg-purple-600' },
      { name: 'Pink', bg: 'bg-pink-50', icon: 'bg-pink-600' },
      { name: 'Amber', bg: 'bg-amber-50', icon: 'bg-amber-600' },
      { name: 'Red', bg: 'bg-red-50', icon: 'bg-red-600' },
      { name: 'Indigo', bg: 'bg-indigo-50', icon: 'bg-indigo-600' },
      { name: 'Teal', bg: 'bg-teal-50', icon: 'bg-teal-600' }
    ];
    
    const colorNames = colors.map(c => c.name).join(', ');
    const choice = prompt(`Choose a color:\n${colorNames}`, 'Blue');
    
    if (choice) {
      const selectedColor = colors.find(c => c.name.toLowerCase() === choice.toLowerCase());
      if (selectedColor) {
        setSubjectColors({
          ...subjectColors,
          [subject]: selectedColor
        });
      }
    }
  };

  // Subject colors and icons
  const subjectStyles = {
    'General': { bg: 'bg-neutral-100', icon: 'bg-neutral-600' },
    'Maths': { bg: 'bg-blue-50', icon: 'bg-blue-600' },
    'Science': { bg: 'bg-green-50', icon: 'bg-green-600' },
    'English': { bg: 'bg-purple-50', icon: 'bg-purple-600' },
    'History': { bg: 'bg-amber-50', icon: 'bg-amber-600' },
    'Languages': { bg: 'bg-pink-50', icon: 'bg-pink-600' }
  };

  const getSubjectIcon = (subject) => {
    const icons = {
      'General': 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
      'Maths': 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
      'Science': 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
      'English': 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
      'History': 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      'Languages': 'M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129'
    };
    return icons[subject] || icons['General'];
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-white" onClick={() => setMenuOpen(null)}>
      {/* Header */}
      <div className="border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className="text-2xl font-semibold text-black hover:text-neutral-600 transition">
                Newton
              </Link>
              <p className="text-sm text-neutral-600 mt-1">Choose a subject to start learning</p>
            </div>
            
            <Link 
              href="/chat?new=true"
              className="px-4 py-2 text-sm text-neutral-600 hover:text-black transition"
            >
              Quick Chat →
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map(subject => {
            const style = subjectColors[subject] || subjectStyles[subject] || subjectStyles['General'];
            return (
              <div key={subject} className="relative">
                <Link
                  href={`/subject/${subject.toLowerCase()}`}
                  className={`block ${style.bg} rounded-2xl p-8 hover:shadow-md transition border border-neutral-200`}
                >
                  <div className={`w-12 h-12 ${style.icon} rounded-xl flex items-center justify-center mb-4`}>
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getSubjectIcon(subject)} />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-semibold text-black mb-2">
                    {subject}
                  </h3>
                  <p className="text-sm text-neutral-600">
                    Learn, practice, and track your progress
                  </p>
                </Link>

                {/* Three-dot menu - outside Link */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setMenuOpen(menuOpen === subject ? null : subject);
                  }}
                  className="absolute top-4 right-4 p-2 hover:bg-white/80 rounded-lg transition z-10"
                >
                  <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>

                {/* Dropdown menu */}
                {menuOpen === subject && (
                  <div 
                    className="absolute top-14 right-4 bg-white border border-neutral-200 rounded-xl shadow-lg z-20 min-w-[160px] overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => renameSubject(subject, e)}
                      className="w-full text-left px-4 py-3 hover:bg-neutral-50 text-black text-sm flex items-center gap-2 transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Rename
                    </button>
                    <button
                      onClick={(e) => changeColor(subject, e)}
                      className="w-full text-left px-4 py-3 hover:bg-neutral-50 text-black text-sm flex items-center gap-2 transition border-t border-neutral-100"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                      </svg>
                      Change Color
                    </button>
                    {subjects.length > 1 && (
                      <button
                        onClick={(e) => deleteSubject(subject, e)}
                        className="w-full text-left px-4 py-3 hover:bg-red-50 text-red-600 text-sm flex items-center gap-2 transition border-t border-neutral-100"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Add Subject Card */}
          <button
            onClick={addSubject}
            className="bg-neutral-50 rounded-2xl p-8 hover:bg-neutral-100 transition border border-dashed border-neutral-300 hover:border-neutral-400 flex flex-col items-center justify-center text-center min-h-[200px]"
          >
            <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-lg font-medium text-black">Add Subject</span>
            <span className="text-sm text-neutral-600 mt-1">Create a new subject</span>
          </button>
        </div>
      </div>
    </div>
  );
}