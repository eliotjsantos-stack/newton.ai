'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Dashboard() {
  const defaultSubjects = ['General'];
  
  const [subjects, setSubjects] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('subjects');
      return saved ? JSON.parse(saved) : defaultSubjects;
    }
    return defaultSubjects;
  });

  const [subjectColors, setSubjectColors] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('subject-colors');
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });

  const [menuOpen, setMenuOpen] = useState(null);
  const [colorPickerOpen, setColorPickerOpen] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('tutorial') === 'true') {
      setShowTutorial(true);
      setTutorialStep(0);
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('subjects', JSON.stringify(subjects));
    }
  }, [subjects, mounted]);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('subject-colors', JSON.stringify(subjectColors));
    }
  }, [subjectColors, mounted]);
// Close menu when clicking outside
useEffect(() => {
  const handleClickOutside = () => {
    if (menuOpen) {
      setMenuOpen(null);
    }
  };
  
  if (menuOpen) {
    document.addEventListener('click', handleClickOutside);
  }
  
  return () => {
    document.removeEventListener('click', handleClickOutside);
  };
}, [menuOpen]);

  const colorOptions = [
    { name: 'Neutral', from: 'from-neutral-100', to: 'to-neutral-50', border: 'border-neutral-200' },
    { name: 'Blue', from: 'from-blue-100', to: 'to-blue-50', border: 'border-blue-200' },
    { name: 'Green', from: 'from-green-100', to: 'to-green-50', border: 'border-green-200' },
    { name: 'Purple', from: 'from-purple-100', to: 'to-purple-50', border: 'border-purple-200' },
    { name: 'Red', from: 'from-red-100', to: 'to-red-50', border: 'border-red-200' },
    { name: 'Yellow', from: 'from-yellow-100', to: 'to-yellow-50', border: 'border-yellow-200' },
    { name: 'Pink', from: 'from-pink-100', to: 'to-pink-50', border: 'border-pink-200' },
    { name: 'Indigo', from: 'from-indigo-100', to: 'to-indigo-50', border: 'border-indigo-200' },
  ];

  const getSubjectColor = (subject) => {
    return subjectColors[subject] || colorOptions[0];
  };

const addSubject = () => {
  const name = prompt('Enter new subject name:');
  if (name && !subjects.includes(name)) {
    setSubjects([...subjects, name].sort());
  }
};

  const renameSubject = (oldName) => {
    const newName = prompt('Rename subject:', oldName);
    if (newName && newName !== oldName && !subjects.includes(newName)) {
      setSubjects(subjects.map(s => s === oldName ? newName : s));
      if (subjectColors[oldName]) {
        setSubjectColors(prev => {
          const updated = { ...prev };
          updated[newName] = updated[oldName];
          delete updated[oldName];
          return updated;
        });
      }
    }
    setMenuOpen(null);
  };

  const deleteSubject = (subject) => {
    if (subjects.length === 1) {
      alert('You must have at least one subject!');
      return;
    }
    if (confirm(`Delete "${subject}"?`)) {
      setSubjects(subjects.filter(s => s !== subject));
      setSubjectColors(prev => {
        const updated = { ...prev };
        delete updated[subject];
        return updated;
      });
    }
    setMenuOpen(null);
  };

  const changeColor = (subject, color) => {
    setSubjectColors(prev => ({
      ...prev,
      [subject]: color
    }));
    setColorPickerOpen(null);
    setMenuOpen(null);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100">
      {/* Premium Glassmorphism Header */}
      <header 
        className="bg-white/70 backdrop-blur-2xl border-b border-neutral-200/50 sticky top-0 z-40"
        style={{
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)'
        }}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div 
                className="w-11 h-11 bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110"
                style={{
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)'
                }}
              >
                <span className="text-lg font-bold text-white">N</span>
              </div>
              <span className="text-xl font-extrabold text-neutral-900 tracking-tight">Newton</span>
            </Link>

            <Link
              href="/chat"
              className="px-6 py-3 bg-white/70 backdrop-blur-sm border border-neutral-200/50 text-neutral-700 font-semibold rounded-2xl hover:bg-white hover:border-neutral-300 transition-all duration-300 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
            >
              Open Chat
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-fadeIn">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-neutral-900 mb-6 tracking-tight">
            Your Subjects
          </h1>
          <p className="text-xl text-neutral-600 max-w-2xl mx-auto leading-relaxed font-medium">
            Choose a subject to start learning
          </p>
        </div>

        {/* Subject Grid with Premium Cards */}
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {subjects.map((subject, index) => {
            const color = getSubjectColor(subject);
            return (
              <div
                key={subject}
                className={`animate-scaleIn overflow-visible ${menuOpen === subject ? 'relative z-50' : ''}`}
                style={{ 
                  animationDelay: `${index * 60}ms`,
                  animationFillMode: 'both'
                }}
              >
                <Link
                  href={subject === 'General' ? '/chat' : `/subject/${encodeURIComponent(subject)}`}
                  className="block group"
                >
                  <div 
                    className={`relative p-8 bg-gradient-to-br ${color.from} ${color.to} backdrop-blur-xl border ${color.border}/50 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 overflow-visible`}
                    style={{
                      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08)'
                    }}
                  >
                    {/* Subject Icon */}
                    <div 
                      className="w-14 h-14 bg-white/90 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110"
                      style={{
                        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      <span className="text-2xl font-bold text-neutral-900">
                        {subject.charAt(0)}
                      </span>
                    </div>

                    {/* Subject Name */}
                    <h3 className="text-2xl font-bold text-neutral-900 mb-2 group-hover:text-black transition-colors duration-300">
                      {subject}
                    </h3>
                    
                    <p className="text-sm text-neutral-600 font-medium">
                      Start learning →
                    </p>

                    {/* Three-dot Menu Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setMenuOpen(menuOpen === subject ? null : subject);
                      }}
                      className="absolute top-6 right-6 p-3 hover:bg-white/70 backdrop-blur-sm rounded-xl transition-all duration-300 hover:scale-110 active:scale-90 z-10"
                    >
                      <span className="text-neutral-700 font-bold text-xl">⋯</span>
                    </button>

                    {/* Premium Three-dot Dropdown Menu */}
                    {menuOpen === subject && (
                      <div 
                        className="absolute top-16 right-6 bg-white/95 backdrop-blur-2xl border border-neutral-200/50 rounded-2xl shadow-2xl z-50 min-w-[160px] animate-scaleIn"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        style={{
                          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)'
                        }}
                      >
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            renameSubject(subject);
                          }}
                          className="w-full text-left px-5 py-3.5 hover:bg-neutral-50 text-neutral-900 text-sm font-semibold transition-all duration-200 flex items-center gap-3"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Rename
                        </button>
                        
                        <div className="h-px bg-neutral-200/50"></div>
                        
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setColorPickerOpen(colorPickerOpen === subject ? null : subject);
                          }}
                          className="w-full text-left px-5 py-3.5 hover:bg-neutral-50 text-neutral-900 text-sm font-semibold transition-all duration-200 flex items-center gap-3"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                          </svg>
                          Change Color
                        </button>
                        
                        {colorPickerOpen === subject && (
                          <div className="px-3 py-3 bg-neutral-50/50 border-t border-neutral-200/50">
                            <div className="grid grid-cols-4 gap-2">
                              {colorOptions.map((colorOption) => (
                                <button
                                  key={colorOption.name}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    changeColor(subject, colorOption);
                                  }}
                                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorOption.from} ${colorOption.to} border-2 ${
                                    color.name === colorOption.name 
                                      ? 'border-neutral-900 scale-110' 
                                      : 'border-neutral-200 hover:border-neutral-300'
                                  } transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg`}
                                  title={colorOption.name}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="h-px bg-neutral-200/50"></div>
                        
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            deleteSubject(subject);
                          }}
                          className="w-full text-left px-5 py-3.5 hover:bg-red-50 text-red-600 text-sm font-semibold transition-all duration-200 flex items-center gap-3"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </Link>
              </div>
            );
          })}

          {/* Add Subject Card */}
          <button
            onClick={addSubject}
            className="group p-8 bg-white/70 backdrop-blur-xl border-2 border-dashed border-neutral-300 rounded-3xl hover:border-neutral-400 hover:bg-white/90 transition-all duration-500 hover:scale-105 flex flex-col items-center justify-center min-h-[200px] shadow-lg hover:shadow-xl animate-scaleIn"
            style={{ 
              animationDelay: `${subjects.length * 60}ms`,
              animationFillMode: 'both',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.06)'
            }}
          >
            <div 
              className="w-14 h-14 bg-neutral-100 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-neutral-200 transition-all duration-300 group-hover:scale-110 shadow-md"
            >
              <svg className="w-7 h-7 text-neutral-600 group-hover:text-neutral-900 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-xl font-bold text-neutral-700 group-hover:text-neutral-900 transition-colors duration-300">
              Add Subject
            </span>
          </button>
        </div>

        {/* Quick Actions Section */}
        <div 
          className="mt-16 p-8 bg-white/70 backdrop-blur-2xl border border-neutral-200/50 rounded-3xl shadow-xl"
          style={{
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08)'
          }}
        >
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">Quick Actions</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Link
              href="/chat"
              className="group p-6 bg-gradient-to-br from-neutral-100 to-neutral-50 border border-neutral-200/50 rounded-2xl hover:shadow-lg transition-all duration-300 hover:scale-105 shadow-md"
            >
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110"
                  style={{
                    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.15)'
                  }}
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-neutral-900 mb-1 group-hover:text-black transition-colors duration-300">
                    Start Chatting
                  </h3>
                  <p className="text-sm text-neutral-600 font-medium">
                    Ask Newton anything
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/"
              className="group p-6 bg-gradient-to-br from-neutral-100 to-neutral-50 border border-neutral-200/50 rounded-2xl hover:shadow-lg transition-all duration-300 hover:scale-105 shadow-md"
            >
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110"
                  style={{
                    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.15)'
                  }}
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-neutral-900 mb-1 group-hover:text-black transition-colors duration-300">
                    Back Home
                  </h3>
                  <p className="text-sm text-neutral-600 font-medium">
                    Return to landing page
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </main>

      {/* Dashboard Tutorial */}
      {showTutorial && (
        <div className="fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          
          {tutorialStep === 0 && (
            <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-auto">
              <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-12 text-center animate-scaleIn">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-3xl flex items-center justify-center mb-8 shadow-2xl">
                  <span className="text-4xl font-bold text-white">N</span>
                </div>
                <h2 className="text-4xl font-extrabold text-neutral-900 mb-4">Your Dashboard</h2>
                <p className="text-xl text-neutral-600 mb-8 leading-relaxed">
                  This is where you manage all your subjects. You can add new subjects, change colors, and organize your learning!
                </p>
                <div className="bg-neutral-50 rounded-2xl p-6 mb-8 text-left">
                  <h3 className="font-bold text-neutral-900 mb-3">What you can do here:</h3>
                  <ul className="space-y-2 text-neutral-700">
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Click any subject to start learning</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Add new subjects with the + button</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Customize colors and rename subjects</span>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => {
  setShowTutorial(false);
  if (typeof window !== 'undefined') {
    localStorage.setItem('newton-seen-tutorial', 'true');
  }
  window.location.href = '/chat';
}}
                  className="px-8 py-4 bg-gradient-to-r from-neutral-900 to-neutral-800 text-white rounded-xl font-bold hover:scale-105 transition-all shadow-xl text-lg"
                >
                  Back to Chat →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Premium CSS Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out forwards;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}