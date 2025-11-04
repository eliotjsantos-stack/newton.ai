'use client';

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import Link from 'next/link';
import 'katex/dist/katex.min.css';

function fixMathNotation(text) {
  const parts = text.split(/(\$\$[^$]+\$\$|\$[^$]+\$)/);
  return parts.map((part, index) => {
    if (index % 2 === 1) return part;
    part = part.replace(/\(([a-zA-Z])\)/g, '$$$1$$');
    part = part.replace(/\[\s*([^\]]+)\s*\]/g, '$$$$$$1$$$$');
    return part;
  }).join('');
}

function generateChatTitle(messages) {
  if (messages.length === 0) return 'New chat';
  const firstUserMessage = messages.find(m => m.role === 'user');
  if (!firstUserMessage) return 'New chat';
  const title = firstUserMessage.content.slice(0, 40);
  return title.length < firstUserMessage.content.length ? title + '...' : title;
}

const subjectKeywords = {
  'Maths': ['equation', 'algebra', 'calculus', 'geometry', 'trigonometry', 'math', 'solve', 'calculate', 'formula', 'derivative', 'integral', 'graph', 'function', 'quadratic', 'polynomial', 'fraction', 'decimal', 'percentage', 'angle', 'triangle', 'circle', 'theorem', 'proof', 'statistics', 'probability'],
  'Science': ['biology', 'chemistry', 'physics', 'cell', 'atom', 'molecule', 'energy', 'force', 'gravity', 'photosynthesis', 'evolution', 'ecosystem', 'chemical', 'reaction', 'element', 'compound', 'electron', 'proton', 'neutron', 'DNA', 'organ', 'tissue', 'species', 'experiment', 'hypothesis'],
  'English': ['essay', 'paragraph', 'grammar', 'sentence', 'verb', 'noun', 'adjective', 'metaphor', 'literature', 'novel', 'poem', 'poetry', 'shakespeare', 'writing', 'reading', 'comprehension', 'analysis', 'theme', 'character', 'plot', 'author'],
  'History': ['essay', 'war', 'ancient', 'medieval', 'renaissance', 'revolution', 'empire', 'dynasty', 'civilization', 'century', 'BC', 'AD', 'historical', 'treaty', 'battle', 'monarch', 'president', 'independence', 'democracy', 'communism', 'fascism'],
  'Languages': ['french', 'spanish', 'german', 'italian', 'mandarin', 'japanese', 'translate', 'vocabulary', 'conjugate', 'verb conjugation', 'pronunciation', 'grammar', 'accent', 'fluent', 'bilingual']
};

function detectSubject(question) {
  const lowerQuestion = question.toLowerCase();
  const scores = {};
  
  for (const [subject, keywords] of Object.entries(subjectKeywords)) {
    scores[subject] = keywords.filter(keyword => lowerQuestion.includes(keyword)).length;
  }
  
  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) return null;
  
  const detectedSubject = Object.keys(scores).find(subject => scores[subject] === maxScore);
  return detectedSubject;
}

export default function Newton() {
  const defaultSubjects = ['General', 'Maths', 'Science', 'English', 'History', 'Languages'];

  const [currentSubject, setCurrentSubject] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('newton-current-subject') || 'General';
    }
    return 'General';
  });

  const [subjects, setSubjects] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('newton-subjects');
      return saved ? JSON.parse(saved) : defaultSubjects;
    }
    return defaultSubjects;
  });

  const [chatsBySubject, setChatsBySubject] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('newton-chats');
      if (saved) return JSON.parse(saved);
    }
    return defaultSubjects.reduce((acc, subject) => {
      acc[subject] = [{ id: 'initial', messages: [], date: new Date().toISOString() }];
      return acc;
    }, {});
  });

  const [currentChatId, setCurrentChatId] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('newton-current-chat-id');
      if (saved && saved !== 'null') return saved;
    }
    return null;
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [suggestedSubject, setSuggestedSubject] = useState(null);
  const [dismissedSuggestion, setDismissedSuggestion] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(null);
  const [yearGroup, setYearGroup] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('newton-year-group') || null;
    }
    return null;
  });
  const [showYearModal, setShowYearModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('newton-seen-welcome') === 'true';
    }
    return false;
  });

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    // Lock body scroll to prevent scrolling past page
    document.body.style.overflow = 'hidden';
    
    // Show year group modal if not set
    if (!yearGroup) {
      setShowYearModal(true);
    }
    
    // Check URL for subject parameter
    const urlParams = new URLSearchParams(window.location.search);
    const urlSubject = urlParams.get('subject');
    if (urlSubject && subjects.includes(urlSubject)) {
      switchSubject(urlSubject);
    }
    
    // Check if coming from landing page (via URL parameter or referrer)
    const fromLanding = urlParams.get('new') === 'true' || document.referrer.includes(window.location.origin + '/');
    
    // Start a new chat if coming from landing page
    if (fromLanding && !urlParams.get('chat')) {
      const newChatId = Date.now().toString();
      setChatsBySubject(prev => ({
        ...prev,
        [currentSubject]: [
          { id: newChatId, messages: [], date: new Date().toISOString() },
          ...(prev[currentSubject] || [])
        ]
      }));
      setCurrentChatId(newChatId);
      // Clean up URL
      window.history.replaceState({}, '', '/chat');
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const currentChat = mounted && chatsBySubject[currentSubject]?.find(c => c.id === currentChatId);
  const messages = currentChat?.messages || [];

  useEffect(() => {
    // Scroll only the messages container, not the whole page
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0 && !dismissedSuggestion) {
      const userMessages = messages.filter(m => m.role === 'user');
      if (userMessages.length > 0) {
        const lastUserMessage = userMessages[userMessages.length - 1];
        const detected = detectSubject(lastUserMessage.content);
        if (detected && detected !== currentSubject) {
          setSuggestedSubject(detected);
        }
      }
    }
  }, [messages, currentSubject, dismissedSuggestion]);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('newton-chats', JSON.stringify(chatsBySubject));
    }
  }, [chatsBySubject, mounted]);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('newton-subjects', JSON.stringify(subjects));
    }
  }, [subjects, mounted]);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('newton-current-subject', currentSubject);
    }
  }, [currentSubject, mounted]);

  useEffect(() => {
    if (mounted && currentChatId) {
      localStorage.setItem('newton-current-chat-id', currentChatId);
    }
  }, [currentChatId, mounted]);

  useEffect(() => {
    if (mounted && yearGroup) {
      localStorage.setItem('newton-year-group', yearGroup);
    }
  }, [yearGroup, mounted]);

  const startNewChat = () => {
    const newChatId = Date.now().toString();
    setChatsBySubject(prev => ({
      ...prev,
      [currentSubject]: [
        { id: newChatId, messages: [], date: new Date().toISOString() },
        ...(prev[currentSubject] || [])
      ]
    }));
    setCurrentChatId(newChatId);
    setDismissedSuggestion(false);
    setSuggestedSubject(null);
  };

  const switchChat = (chatId) => {
    setCurrentChatId(chatId);
    setDismissedSuggestion(false);
    setSuggestedSubject(null);
  };

  const deleteChat = (subj, chatId, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this chat?')) return;
    
    setChatsBySubject(prev => {
      const updated = {
        ...prev,
        [subj]: prev[subj].filter(chat => chat.id !== chatId)
      };
      if (updated[subj].length === 0) {
        updated[subj] = [{ id: Date.now().toString(), messages: [], date: new Date().toISOString() }];
      }
      return updated;
    });
    
    if (currentChatId === chatId) {
      const remaining = chatsBySubject[subj].filter(c => c.id !== chatId);
      setCurrentChatId(remaining[0]?.id || null);
    }
    setMenuOpen(null);
  };

  const switchSubject = (subject) => {
    setCurrentSubject(subject);
    const chats = chatsBySubject[subject];
    if (chats && chats.length > 0) {
      setCurrentChatId(chats[0].id);
    } else {
      const newId = Date.now().toString();
      setChatsBySubject(prev => ({
        ...prev,
        [subject]: [{ id: newId, messages: [], date: new Date().toISOString() }]
      }));
      setCurrentChatId(newId);
    }
    setDismissedSuggestion(false);
    setSuggestedSubject(null);
  };

  const addSubject = () => {
    const newSubjectName = prompt('Enter new subject name:');
    if (newSubjectName && !subjects.includes(newSubjectName)) {
      setSubjects([...subjects, newSubjectName]);
      const newChatId = Date.now().toString();
      setChatsBySubject(prev => ({
        ...prev,
        [newSubjectName]: [{ id: newChatId, messages: [], date: new Date().toISOString() }]
      }));
      setCurrentSubject(newSubjectName);
      setCurrentChatId(newChatId);
      setExpandedSubject(newSubjectName);
    }
  };

  const renameSubject = (oldName, e) => {
    e.stopPropagation();
    const newName = prompt('Rename subject:', oldName);
    if (newName && newName !== oldName && !subjects.includes(newName)) {
      setSubjects(subjects.map(s => s === oldName ? newName : s));
      setChatsBySubject(prev => {
        const newChats = {...prev};
        newChats[newName] = newChats[oldName];
        delete newChats[oldName];
        return newChats;
      });
      if (currentSubject === oldName) setCurrentSubject(newName);
      if (expandedSubject === oldName) setExpandedSubject(newName);
    }
    setMenuOpen(null);
  };

  const deleteSubject = (subjectName, e) => {
    e.stopPropagation();
    if (subjects.length === 1) {
      alert('Cannot delete the last subject!');
      return;
    }
    if (!window.confirm(`Delete "${subjectName}" and all its chats?`)) return;
    
    setSubjects(subjects.filter(s => s !== subjectName));
    setChatsBySubject(prev => {
      const newChats = {...prev};
      delete newChats[subjectName];
      return newChats;
    });
    if (currentSubject === subjectName) {
      const newSubject = subjects.find(s => s !== subjectName);
      setCurrentSubject(newSubject);
      setCurrentChatId(chatsBySubject[newSubject][0].id);
      setExpandedSubject(newSubject);
    }
    setMenuOpen(null);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Mark welcome as seen
    if (!hasSeenWelcome) {
      setHasSeenWelcome(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('newton-seen-welcome', 'true');
      }
    }

    const userMessage = { role: 'user', content: input.trim() };
    let activeChatId = currentChatId;

    if (!activeChatId || !chatsBySubject[currentSubject]?.find(c => c.id === activeChatId)) {
      activeChatId = Date.now().toString();
      setChatsBySubject(prev => ({
        ...prev,
        [currentSubject]: [
          { id: activeChatId, messages: [userMessage], date: new Date().toISOString() },
          ...(prev[currentSubject] || [])
        ]
      }));
      setCurrentChatId(activeChatId);
    } else {
      setChatsBySubject(prev => ({
        ...prev,
        [currentSubject]: prev[currentSubject].map(chat =>
          chat.id === activeChatId
            ? { ...chat, messages: [...chat.messages, userMessage], date: new Date().toISOString() }
            : chat
        )
      }));
    }

    setInput('');
    setIsLoading(true);
    setIsTyping(true); // Show typing indicator
    setDismissedSuggestion(false);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          yearGroup: yearGroup || 'year9' // Default to Year 9 if not set
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      setIsTyping(false); // Hide typing indicator when response starts

      setChatsBySubject(prev => ({
        ...prev,
        [currentSubject]: prev[currentSubject].map(chat =>
          chat.id === activeChatId
            ? { ...chat, messages: [...chat.messages, { role: 'assistant', content: '' }] }
            : chat
        )
      }));

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        assistantMessage += chunk;

        setChatsBySubject(prev => ({
          ...prev,
          [currentSubject]: prev[currentSubject].map(chat =>
            chat.id === activeChatId
              ? {
                  ...chat,
                  messages: chat.messages.map((msg, idx) =>
                    idx === chat.messages.length - 1 && msg.role === 'assistant'
                      ? { ...msg, content: assistantMessage }
                      : msg
                  )
                }
              : chat
          )
        }));
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
      setIsTyping(false); // Reset typing indicator
    }
  };

  const saveYearGroup = (year) => {
    setYearGroup(year);
    setShowYearModal(false);
  };

  if (!mounted) return null;

  const yearOptions = [
    { value: 'year7', label: 'Year 7' },
    { value: 'year8', label: 'Year 8' },
    { value: 'year9', label: 'Year 9' },
    { value: 'year10', label: 'Year 10 (GCSE)' },
    { value: 'year11', label: 'Year 11 (GCSE)' },
    { value: 'year12', label: 'Year 12 (A-Level)' },
    { value: 'year13', label: 'Year 13 (A-Level)' }
  ];

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-neutral-50 border-r border-neutral-200 flex flex-col transition-all duration-200 overflow-hidden`}>
        <div className="p-4 border-b border-neutral-200">
          <Link href="/" className="flex items-center space-x-2 mb-4 group">
            <svg className="w-5 h-5 text-neutral-600 group-hover:text-black transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-sm text-neutral-600 group-hover:text-black transition">Home</span>
          </Link>
          
          <button
            onClick={startNewChat}
            className="w-full px-4 py-2.5 bg-black text-white rounded-full text-sm hover:bg-neutral-800 transition"
          >
            New chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {subjects.map(subject => {
            const chats = chatsBySubject[subject] || [];
            const isExpanded = expandedSubject === subject;
            const hasChats = chats.some(c => c.messages.length > 0);
            
            return (
              <div key={subject} className="border-b border-neutral-200">
                <div className="relative">
                  <div className={`w-full px-4 py-3 flex items-center justify-between hover:bg-neutral-100 transition ${
                    currentSubject === subject ? 'bg-neutral-100' : ''
                  }`}>
                    <button
                      onClick={() => {
                        switchSubject(subject);
                        setExpandedSubject(isExpanded ? null : subject);
                      }}
                      className="flex-1 flex items-center gap-2 text-left"
                    >
                      {hasChats && (
                        <svg
                          className={`w-4 h-4 text-neutral-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                      <span className="text-sm font-medium text-black">{subject}</span>
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(menuOpen === `subject-${subject}` ? null : `subject-${subject}`);
                      }}
                      className="p-1 hover:bg-neutral-200 rounded transition"
                    >
                      <span className="text-neutral-600">⋯</span>
                    </button>
                  </div>

                  {menuOpen === `subject-${subject}` && (
                    <div className="absolute right-2 top-12 bg-white border border-neutral-200 rounded-lg shadow-lg z-20 min-w-[120px]">
                      <button
                        onClick={(e) => renameSubject(subject, e)}
                        className="w-full text-left px-4 py-2 hover:bg-neutral-100 text-black text-sm"
                      >
                        Rename
                      </button>
                      <button
                        onClick={(e) => deleteSubject(subject, e)}
                        className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                {isExpanded && hasChats && (
                  <div className="bg-white">
                    {chats.filter(c => c.messages.length > 0).map(chat => (
                      <div key={chat.id} className="relative group">
                        <button
                          onClick={() => switchChat(chat.id)}
                          className={`w-full px-6 py-2.5 text-left hover:bg-neutral-50 transition ${
                            currentChatId === chat.id ? 'bg-neutral-50' : ''
                          }`}
                        >
                          <div className="text-xs text-neutral-900 truncate pr-8">
                            {generateChatTitle(chat.messages)}
                          </div>
                          <div className="text-xs text-neutral-500 mt-1">
                            {new Date(chat.date).toLocaleDateString('en-GB')}
                          </div>
                        </button>
                        
                        <button
                          onClick={(e) => deleteChat(subject, chat.id, e)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-neutral-200 rounded transition"
                        >
                          <svg className="w-3.5 h-3.5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-3 border-t border-neutral-200 space-y-2">
          <button
            onClick={addSubject}
            className="w-full px-4 py-2.5 bg-black text-white rounded-full text-sm hover:bg-neutral-800 transition"
          >
            + Add Subject
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="w-full px-4 py-2.5 border border-neutral-300 text-black rounded-full text-sm hover:border-black transition flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col">
        <div className="h-14 border-b border-neutral-200 flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-neutral-100 rounded-lg transition"
            >
              <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="text-sm font-medium text-black">{currentSubject}</span>
          </div>
          
          <Link href="/" className="text-sm font-semibold text-black hover:text-neutral-600 transition">
            Newton
          </Link>
        </div>

        {suggestedSubject && !dismissedSuggestion && (
          <div className="bg-neutral-50 border-b border-neutral-200 px-6 py-3 flex items-center justify-between">
            <span className="text-sm text-neutral-600">
              Move to <strong className="text-black">{suggestedSubject}</strong>?
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  switchSubject(suggestedSubject);
                  setSuggestedSubject(null);
                }}
                className="px-4 py-1.5 bg-black text-white text-xs rounded-full hover:bg-neutral-800 transition"
              >
                Move
              </button>
              <button
                onClick={() => {
                  setDismissedSuggestion(true);
                  setSuggestedSubject(null);
                }}
                className="px-4 py-1.5 border border-neutral-300 text-black text-xs rounded-full hover:border-black transition"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-6 py-8">
          {messages.length === 0 ? (
            !hasSeenWelcome ? (
              // First time welcome
              <div className="flex flex-col items-center justify-center h-full text-center max-w-2xl mx-auto">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl flex items-center justify-center mb-6 shadow-lg">
                  <span className="text-3xl font-bold text-white">N</span>
                </div>
                <h2 className="text-4xl font-bold text-black mb-4">Welcome to Newton</h2>
                <p className="text-xl text-neutral-600 mb-8 leading-relaxed">
                  I'm here to help you truly learn. I won't do your homework—instead, I'll guide you to understand it yourself through questions and step-by-step thinking.
                </p>
                
                <div className="grid md:grid-cols-2 gap-4 w-full mb-8">
                  <div className="bg-blue-50 rounded-2xl p-6 text-left border border-blue-100">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mb-3">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-black mb-2">Learn by thinking</h3>
                    <p className="text-sm text-neutral-700">I ask questions that help you discover answers yourself</p>
                  </div>
                  
                  <div className="bg-green-50 rounded-2xl p-6 text-left border border-green-100">
                    <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center mb-3">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-black mb-2">Academic integrity</h3>
                    <p className="text-sm text-neutral-700">I refuse to do homework, so your work stays yours</p>
                  </div>
                </div>

                <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-200 w-full">
                  <p className="text-sm font-medium text-black mb-3">Try asking:</p>
                  <div className="space-y-2 text-left">
                    <div className="flex items-center gap-3 text-sm text-neutral-700">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full flex-shrink-0"></div>
                      <span>"I don't understand how photosynthesis works"</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-neutral-700">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full flex-shrink-0"></div>
                      <span>"Can you help me approach this algebra problem?"</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-neutral-700">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full flex-shrink-0"></div>
                      <span>"Explain themes in Macbeth step by step"</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Simple empty state for returning users
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mb-4">
                  <span className="text-2xl font-semibold text-neutral-600">N</span>
                </div>
                <h2 className="text-xl font-semibold text-black mb-2">New conversation</h2>
                <p className="text-neutral-600 max-w-md">
                  Ask me anything about {currentSubject.toLowerCase()}
                </p>
              </div>
            )
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-white">N</span>
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-5 py-4 ${
                      message.role === 'user'
                        ? 'bg-neutral-100 text-black'
                        : 'bg-white border border-neutral-200 text-black'
                    }`}
                  >
                    <ReactMarkdown
                      remarkPlugins={[remarkMath, remarkGfm]}
                      rehypePlugins={[rehypeKatex]}
                      components={{
                        a: ({node, ...props}) => (
                          <a {...props} target="_blank" rel="noopener noreferrer" className="text-black underline hover:text-neutral-600" />
                        ),
                        p: ({node, ...props}) => <p {...props} className="mb-3 last:mb-0" />,
                        ul: ({node, ...props}) => <ul {...props} className="list-disc ml-4 mb-3 space-y-1" />,
                        ol: ({node, ...props}) => <ol {...props} className="list-decimal ml-4 mb-3 space-y-1" />,
                        li: ({node, ...props}) => <li {...props} className="mb-1" />,
                      }}
                    >
                      {fixMathNotation(message.content)}
                    </ReactMarkdown>
                  </div>
                  {message.role === 'user' && (
                    <div className="w-8 h-8 bg-neutral-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-neutral-600">You</span>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex gap-4 justify-start">
                  <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium text-white">N</span>
                  </div>
                  <div className="bg-white border border-neutral-200 rounded-2xl px-5 py-4">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="border-t border-neutral-200 p-6">
          <form onSubmit={sendMessage} className="max-w-3xl mx-auto">
            <div className="flex gap-3">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(e);
                  }
                }}
                placeholder={`Ask about ${currentSubject.toLowerCase()}...`}
                className="flex-1 px-5 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl resize-none focus:outline-none focus:border-neutral-400 transition text-black placeholder-neutral-400"
                rows={1}
                style={{ minHeight: '50px', maxHeight: '200px' }}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="px-6 py-3 bg-black text-white rounded-full hover:bg-neutral-800 transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Year Group Selection Modal */}
      {showYearModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-semibold text-black mb-2">Welcome to Newton!</h2>
            <p className="text-neutral-600 mb-6">What year group are you in? This helps me adjust my teaching style for you.</p>
            
            <div className="space-y-2">
              {yearOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => saveYearGroup(option.value)}
                  className="w-full px-6 py-3 bg-neutral-100 hover:bg-neutral-200 rounded-xl text-left text-black transition"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowSettings(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-black">Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-neutral-100 rounded-lg transition"
              >
                <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-black block mb-2">Year Group</label>
                <select
                  value={yearGroup || ''}
                  onChange={(e) => saveYearGroup(e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-100 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="" disabled>Select your year</option>
                  {yearOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-neutral-500 mt-2">
                  Current: {yearOptions.find(y => y.value === yearGroup)?.label || 'Not set'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}