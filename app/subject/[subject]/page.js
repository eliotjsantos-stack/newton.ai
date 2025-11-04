'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

export default function SubjectPage() {
  const params = useParams();
  const router = useRouter();
  const subjectName = params?.subject ? decodeURIComponent(params.subject) : '';
  const subject = subjectName.charAt(0).toUpperCase() + subjectName.slice(1);
  
  const [activeTab, setActiveTab] = useState('quiz');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const tabs = [
    { id: 'chat', name: 'AI Chat', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
    { id: 'quiz', name: 'Quizzes', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { id: 'progress', name: 'Progress', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { id: 'notes', name: 'Notes', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' }
  ];

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-neutral-200">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard"
              className="p-2 hover:bg-neutral-100 rounded-lg transition"
            >
              <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <h1 className="text-xl font-semibold text-black">{subject}</h1>
          </div>
          
          <Link href="/" className="text-sm font-semibold text-black hover:text-neutral-600 transition">
            Newton
          </Link>
        </div>

        {/* Tabs */}
        <div className="px-6 flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'chat') {
                  router.push(`/chat?subject=${subject}&new=true`);
                } else {
                  setActiveTab(tab.id);
                }
              }}
              className={`px-6 py-3 text-sm font-medium transition relative flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'text-black'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              {tab.name}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'quiz' && <QuizTab subject={subject} />}
        {activeTab === 'progress' && <ProgressTab subject={subject} />}
        {activeTab === 'notes' && <NotesTab subject={subject} />}
      </div>
    </div>
  );
}

function QuizTab({ subject }) {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        
        <h2 className="text-3xl font-bold text-black mb-4">AI-Generated Quizzes</h2>
        <p className="text-lg text-neutral-600 mb-8 leading-relaxed">
          Upload your homework or study materials and Newton will create personalized quizzes to test your understanding.
        </p>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 border border-blue-100 mb-8 text-left">
          <h3 className="font-semibold text-black mb-6 text-center">How it works</h3>
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">1</span>
              </div>
              <div>
                <p className="font-medium text-black mb-1">Upload materials</p>
                <p className="text-sm text-neutral-600">PDFs, images, Word docs, or notes</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">2</span>
              </div>
              <div>
                <p className="font-medium text-black mb-1">Newton analyzes</p>
                <p className="text-sm text-neutral-600">Identifies key concepts and creates questions</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">3</span>
              </div>
              <div>
                <p className="font-medium text-black mb-1">Take the quiz</p>
                <p className="text-sm text-neutral-600">Get instant feedback and explanations</p>
              </div>
            </div>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-100 text-neutral-500 rounded-full text-sm font-medium border border-neutral-200">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Launching Soon
        </div>
      </div>
    </div>
  );
}

function ProgressTab({ subject }) {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-black mb-2">Learning Progress</h2>
          <p className="text-neutral-600">Track your journey in {subject}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-blue-900">Conversations</span>
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
            </div>
            <div className="text-4xl font-bold text-blue-900 mb-1">0</div>
            <div className="text-xs text-blue-700">Start chatting to track progress</div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-green-900">Study Streak</span>
              <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                </svg>
              </div>
            </div>
            <div className="text-4xl font-bold text-green-900 mb-1">0</div>
            <div className="text-xs text-green-700">Days in a row</div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-purple-900">Topics</span>
              <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="text-4xl font-bold text-purple-900 mb-1">0</div>
            <div className="text-xs text-purple-700">Covered so far</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-3xl p-8 border border-neutral-200">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-black mb-3">Coming Soon</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-neutral-700">
                  <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
                  <p className="text-sm">Detailed learning analytics</p>
                </div>
                <div className="flex items-center gap-2 text-neutral-700">
                  <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
                  <p className="text-sm">Topic mastery tracking</p>
                </div>
                <div className="flex items-center gap-2 text-neutral-700">
                  <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
                  <p className="text-sm">Study time insights</p>
                </div>
                <div className="flex items-center gap-2 text-neutral-700">
                  <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
                  <p className="text-sm">Achievement milestones</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotesTab({ subject }) {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-semibold text-black mb-2">Your Notes</h2>
          <p className="text-neutral-600">Save and organize important concepts from {subject}</p>
        </div>

        <div className="bg-neutral-50 rounded-2xl p-12 border border-neutral-200 text-center mb-6">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 border border-neutral-200">
            <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-black mb-3">No notes yet</h3>
          <p className="text-neutral-600 max-w-md mx-auto mb-6">
            Start chatting with Newton and save important explanations, concepts, or solutions for later review.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 border border-neutral-200">
          <h3 className="text-lg font-semibold text-black mb-4">How it works</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-black mb-1">Save from chat</p>
                <p className="text-sm text-neutral-600">Click the bookmark icon on any of Newton&apos;s responses to save it</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-black mb-1">Organize by topic</p>
                <p className="text-sm text-neutral-600">Notes are automatically organized by subject and searchable</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-black mb-1">Review anytime</p>
                <p className="text-sm text-neutral-600">Come back to your saved concepts whenever you need to revise</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}