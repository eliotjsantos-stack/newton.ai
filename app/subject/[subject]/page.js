'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function SubjectPage() {
  const params = useParams();
  const subjectName = params.subject ? decodeURIComponent(params.subject) : '';
  const subject = subjectName.charAt(0).toUpperCase() + subjectName.slice(1);
  
  const [activeTab, setActiveTab] = useState('chat');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const tabs = [
    { id: 'chat', name: 'AI Chat', icon: '💬' },
    { id: 'quiz', name: 'Quizzes', icon: '📝' },
    { id: 'progress', name: 'Progress', icon: '📊' },
    { id: 'notes', name: 'Notes', icon: '📓' }
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
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 text-sm font-medium transition relative ${
                activeTab === tab.id
                  ? 'text-black'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
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
        {activeTab === 'chat' && <ChatTab subject={subject} />}
        {activeTab === 'quiz' && <QuizTab subject={subject} />}
        {activeTab === 'progress' && <ProgressTab subject={subject} />}
        {activeTab === 'notes' && <NotesTab subject={subject} />}
      </div>
    </div>
  );
}

function ChatTab({ subject }) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl font-semibold text-white">N</span>
        </div>
        <h2 className="text-2xl font-semibold text-black mb-3">AI Chat</h2>
        <p className="text-neutral-600 max-w-md">
          Chat interface for {subject} will go here.<br/>
          This will be the full AI chat experience.
        </p>
      </div>
    </div>
  );
}

function QuizTab({ subject }) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-6">📝</div>
        <h2 className="text-2xl font-semibold text-black mb-3">Quizzes</h2>
        <p className="text-neutral-600 max-w-md">
          Take quizzes and test your knowledge in {subject}.<br/>
          Coming soon!
        </p>
      </div>
    </div>
  );
}

function ProgressTab({ subject }) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-6">📊</div>
        <h2 className="text-2xl font-semibold text-black mb-3">Progress</h2>
        <p className="text-neutral-600 max-w-md">
          Track your learning progress in {subject}.<br/>
          Coming soon!
        </p>
      </div>
    </div>
  );
}

function NotesTab({ subject }) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-6">📓</div>
        <h2 className="text-2xl font-semibold text-black mb-3">Notes</h2>
        <p className="text-neutral-600 max-w-md">
          Your saved notes and important concepts for {subject}.<br/>
          Coming soon!
        </p>
      </div>
    </div>
  );
}