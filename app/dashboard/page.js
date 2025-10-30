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

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('newton-subjects', JSON.stringify(subjects));
    }
  }, [subjects, mounted]);

  const addSubject = () => {
    const newSubjectName = prompt('Enter new subject name:');
    if (newSubjectName && !subjects.includes(newSubjectName)) {
      setSubjects([...subjects, newSubjectName]);
    }
  };

  const deleteSubject = (subjectName) => {
    if (subjects.length === 1) {
      alert('Cannot delete the last subject!');
      return;
    }
    if (window.confirm(`Delete "${subjectName}"?`)) {
      setSubjects(subjects.filter(s => s !== subjectName));
    }
  };

  // Subject emoji mapping
  const subjectEmojis = {
    'General': '📚',
    'Maths': '🔢',
    'Science': '🔬',
    'English': '📖',
    'History': '🏛️',
    'Languages': '🌍'
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-white">
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
              href="/chat"
              className="px-4 py-2 text-sm text-neutral-600 hover:text-black transition"
            >
              Go to Chat →
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map(subject => (
            <Link
              key={subject}
              href={`/subject/${subject.toLowerCase()}`}
              className="group relative bg-neutral-50 rounded-2xl p-8 hover:bg-neutral-100 transition border border-neutral-200 hover:border-neutral-300"
            >
              <div className="text-5xl mb-4">
                {subjectEmojis[subject] || '📚'}
              </div>
              <h3 className="text-2xl font-semibold text-black mb-2">
                {subject}
              </h3>
              <p className="text-sm text-neutral-600">
                Learn, practice, and track your progress
              </p>
              
              {/* Three-dot menu */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  deleteSubject(subject);
                }}
                className="absolute top-4 right-4 p-2 opacity-0 group-hover:opacity-100 hover:bg-neutral-200 rounded-lg transition"
              >
                <svg className="w-4 h-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </Link>
          ))}

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