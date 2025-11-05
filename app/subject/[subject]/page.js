'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SubjectPage({ params }) {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [activeTab, setActiveTab] = useState('quiz');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Unwrap params if it's a Promise (Next.js 15)
    if (params && typeof params.then === 'function') {
      params.then((unwrappedParams) => {
        setSubject(decodeURIComponent(unwrappedParams.subject));
      });
    } else if (params) {
      setSubject(decodeURIComponent(params.subject));
    }
  }, [params]);

  const handleTabChange = (tab) => {
    if (tab === 'chat') {
      router.push(`/chat?subject=${encodeURIComponent(subject)}&new=true`);
    } else {
      setActiveTab(tab);
    }
  };

  if (!mounted || !subject) return null;

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
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <svg className="w-6 h-6 text-neutral-600 group-hover:text-black transition-all duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="text-base font-bold text-neutral-700 group-hover:text-black transition-colors duration-300">
                Back to Dashboard
              </span>
            </Link>

            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-2xl flex items-center justify-center shadow-lg"
                style={{
                  boxShadow: '0 6px 16px rgba(0, 0, 0, 0.15)'
                }}
              >
                <span className="text-base font-bold text-white">{subject.charAt(0)}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Subject Hero Section */}
      <section className="py-16 px-6 sm:px-8 lg:px-12">
        <div className="max-w-7xl mx-auto text-center animate-fadeIn">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-neutral-900 mb-6 tracking-tight">
            {subject}
          </h1>
          <p className="text-xl text-neutral-600 max-w-2xl mx-auto font-medium">
            Choose how you want to learn today
          </p>
        </div>
      </section>

      {/* Premium Glassmorphism Tab Navigation */}
      <section className="px-6 sm:px-8 lg:px-12 mb-12">
        <div className="max-w-5xl mx-auto">
          <div 
            className="flex gap-3 p-2 bg-white/70 backdrop-blur-2xl border border-neutral-200/50 rounded-3xl shadow-xl"
            style={{
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
            }}
          >
            {[
              { id: 'chat', label: 'AI Chat', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              )},
              { id: 'quiz', label: 'Quizzes', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              )},
              { id: 'progress', label: 'Progress', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              )},
              { id: 'notes', label: 'Notes', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              )}
            ].map((tab, index) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex-1 px-6 py-4 rounded-2xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2.5 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-neutral-900 to-neutral-800 text-white shadow-xl scale-105'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/80 backdrop-blur-sm hover:scale-105'
                } hover:shadow-lg active:scale-95 animate-slideIn`}
                style={{
                  animationDelay: `${index * 80}ms`,
                  animationFillMode: 'both',
                  boxShadow: activeTab === tab.id ? '0 8px 24px rgba(0, 0, 0, 0.2)' : 'none'
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Tab Content with Premium Styling */}
      <section className="px-6 sm:px-8 lg:px-12 pb-20">
        <div className="max-w-5xl mx-auto">
          {/* Quiz Tab */}
          {activeTab === 'quiz' && (
            <div 
              className="p-12 bg-white/70 backdrop-blur-2xl border border-neutral-200/50 rounded-3xl shadow-2xl animate-fadeIn"
              style={{
                boxShadow: '0 16px 48px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div className="text-center max-w-3xl mx-auto">
                <div 
                  className="w-20 h-20 mx-auto bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-3xl flex items-center justify-center mb-8 shadow-2xl animate-float"
                  style={{
                    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.25)'
                  }}
                >
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>

                <h2 className="text-4xl font-extrabold text-neutral-900 mb-6 tracking-tight">
                  Smart Quizzes Coming Soon
                </h2>
                <p className="text-lg text-neutral-600 mb-10 leading-relaxed font-medium">
                  Upload your homework, notes, or textbook pages, and Newton will generate personalized quizzes to test your understanding.
                </p>

                {/* Feature Preview Grid */}
                <div className="grid sm:grid-cols-2 gap-6 mb-10">
                  {[
                    {
                      icon: (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      ),
                      title: 'Upload Materials',
                      desc: 'PDFs, images, or documents'
                    },
                    {
                      icon: (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      ),
                      title: 'AI Analysis',
                      desc: 'Newton studies your content'
                    },
                    {
                      icon: (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ),
                      title: 'Custom Questions',
                      desc: 'Personalized to your level'
                    },
                    {
                      icon: (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      ),
                      title: 'Track Progress',
                      desc: 'See your improvement'
                    }
                  ].map((feature, i) => (
                    <div 
                      key={i}
                      className="p-6 bg-neutral-50/70 backdrop-blur-sm border border-neutral-200/50 rounded-2xl text-left shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                    >
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-4 shadow-sm">
                        {feature.icon}
                      </div>
                      <h3 className="font-bold text-neutral-900 mb-2">{feature.title}</h3>
                      <p className="text-sm text-neutral-600 font-medium">{feature.desc}</p>
                    </div>
                  ))}
                </div>

                <div 
                  className="p-6 bg-neutral-100/70 backdrop-blur-sm border border-neutral-200/50 rounded-2xl"
                >
                  <p className="text-sm text-neutral-700 font-semibold">
                    💡 For now, use AI Chat to ask questions about your {subject.toLowerCase()} work
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Progress Tab */}
          {activeTab === 'progress' && (
            <div 
              className="p-12 bg-white/70 backdrop-blur-2xl border border-neutral-200/50 rounded-3xl shadow-2xl animate-fadeIn"
              style={{
                boxShadow: '0 16px 48px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div className="text-center max-w-3xl mx-auto">
                <div 
                  className="w-20 h-20 mx-auto bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-3xl flex items-center justify-center mb-8 shadow-2xl animate-float"
                  style={{
                    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.25)'
                  }}
                >
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>

                <h2 className="text-4xl font-extrabold text-neutral-900 mb-6 tracking-tight">
                  Track Your Learning Journey
                </h2>
                <p className="text-lg text-neutral-600 mb-10 leading-relaxed font-medium">
                  Your progress dashboard is being built. Soon you'll see detailed analytics of your learning.
                </p>

                {/* Preview Stats Grid */}
                <div className="grid sm:grid-cols-3 gap-6 mb-10">
                  {[
                    { label: 'Conversations', value: '—', color: 'from-blue-500 to-blue-600' },
                    { label: 'Study Time', value: '—', color: 'from-green-500 to-green-600' },
                    { label: 'Topics Learned', value: '—', color: 'from-purple-500 to-purple-600' }
                  ].map((stat, i) => (
                    <div 
                      key={i}
                      className="p-8 bg-gradient-to-br from-neutral-50 to-white border border-neutral-200/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                    >
                      <div className={`text-4xl font-extrabold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2`}>
                        {stat.value}
                      </div>
                      <div className="text-sm font-semibold text-neutral-600">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  {[
                    'Detailed conversation analytics',
                    'Topic mastery breakdown',
                    'Study streak tracking',
                    'Personalized insights'
                  ].map((feature, i) => (
                    <div 
                      key={i}
                      className="flex items-center gap-3 p-4 bg-neutral-50/70 backdrop-blur-sm border border-neutral-200/50 rounded-xl"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-neutral-700 font-semibold text-left">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === 'notes' && (
            <div 
              className="p-12 bg-white/70 backdrop-blur-2xl border border-neutral-200/50 rounded-3xl shadow-2xl animate-fadeIn"
              style={{
                boxShadow: '0 16px 48px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div className="text-center max-w-3xl mx-auto">
                <div 
                  className="w-20 h-20 mx-auto bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-3xl flex items-center justify-center mb-8 shadow-2xl animate-float"
                  style={{
                    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.25)'
                  }}
                >
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>

                <h2 className="text-4xl font-extrabold text-neutral-900 mb-6 tracking-tight">
                  Save Important Concepts
                </h2>
                <p className="text-lg text-neutral-600 mb-10 leading-relaxed font-medium">
                  Soon you'll be able to bookmark key insights from your conversations with Newton.
                </p>

                <div 
                  className="p-10 bg-gradient-to-br from-neutral-50 to-white border border-neutral-200/50 rounded-2xl mb-8 text-left shadow-lg"
                >
                  <h3 className="text-xl font-bold text-neutral-900 mb-6">How it will work:</h3>
                  <ol className="space-y-5">
                    {[
                      'Click the bookmark icon on any Newton response',
                      'Your saved concepts appear here, organized by subject',
                      'Review your notes anytime before exams',
                      'Export your notes as study guides'
                    ].map((step, i) => (
                      <li key={i} className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold text-sm shadow-md">
                          {i + 1}
                        </div>
                        <span className="text-neutral-700 font-medium pt-1.5">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div 
                  className="p-6 bg-neutral-100/70 backdrop-blur-sm border border-neutral-200/50 rounded-2xl"
                >
                  <p className="text-sm text-neutral-700 font-semibold">
                    💡 For now, keep your own notes from Newton conversations
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Premium CSS Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
        }
        
        .animate-slideIn {
          animation: slideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}