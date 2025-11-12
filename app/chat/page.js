'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
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
    document.body.style.overflow = 'hidden';
    
    if (!yearGroup) {
      setShowYearModal(true);
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const urlSubject = urlParams.get('subject');
    if (urlSubject && subjects.includes(urlSubject)) {
      switchSubject(urlSubject);
    }
    
    const fromLanding = urlParams.get('new') === 'true' || document.referrer.includes(window.location.origin + '/');
    
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
      window.history.replaceState({}, '', '/chat');
    }
    
    return () => {
      document.body.style.overflow = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentChat = mounted && chatsBySubject[currentSubject]?.find(c => c.id === currentChatId);
  const messages = useMemo(() => currentChat?.messages || [], [currentChat]);

  useEffect(() => {
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
  
  useEffect(() => {
  if (input.trim().length > 10 && !dismissedSuggestion) {
    const detected = detectSubject(input);
    if (detected && detected !== currentSubject) {
      setSuggestedSubject(detected);
    } else if (!detected) {
      setSuggestedSubject(null);
    }
  }
}, [input, currentSubject, dismissedSuggestion]);


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
  if (newSubjectName && newSubjectName.trim() && !subjects.includes(newSubjectName)) {
    setSubjects([...subjects, newSubjectName].sort());
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
    setIsTyping(true);
    setDismissedSuggestion(false);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          yearGroup: yearGroup || 'year9'
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      setIsTyping(false);

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
      setIsTyping(false);
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
    <div className="flex h-screen bg-neutral-100 overflow-hidden">
      {/* Premium Glassmorphism Sidebar */}
      <div 
        className={`${
          sidebarOpen ? 'w-72' : 'w-0'
        } bg-white/60 backdrop-blur-2xl border-r border-neutral-200/50 flex flex-col transition-all duration-300 ease-out overflow-hidden shadow-2xl`}
        style={{
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)'
        }}
      >
        {/* Sidebar Header with Glassmorphism */}
        <div className="p-6 border-b border-neutral-200/50 bg-white/30 backdrop-blur-xl">
          <Link 
            href="/" 
            className="flex items-center space-x-3 mb-6 group transition-all duration-250"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
              <span className="text-sm font-bold text-white">N</span>
            </div>
            <span className="text-base font-semibold text-neutral-900 group-hover:text-black transition-colors duration-250">Newton</span>
          </Link>
          
          <button
            onClick={startNewChat}
            className="w-full px-5 py-3 bg-gradient-to-r from-neutral-900 to-neutral-800 text-white rounded-2xl text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 6px rgba(0, 0, 0, 0.1)'
            }}
          >
            New conversation
          </button>
        </div>

        {/* Subjects List with Smooth Animations */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          {subjects.map((subject, subjectIndex) => {
            const chats = chatsBySubject[subject] || [];
            const isExpanded = expandedSubject === subject;
            const hasChats = chats.some(c => c.messages.length > 0);
            
            return (
              <div 
                key={subject} 
                className={`mb-2 animate-slideIn ${menuOpen === `subject-${subject}` ? 'relative z-50' : ''}`}
                style={{ animationDelay: `${subjectIndex * 50}ms` }}
              >
                <div className="relative">
                  <div className={`
                    flex items-center justify-between rounded-xl transition-all duration-250
                    ${currentSubject === subject 
                      ? 'bg-white/80 backdrop-blur-sm shadow-md' 
                      : 'hover:bg-white/40 backdrop-blur-sm'
                    }
                  `}>
                    <button
                      onClick={() => {
                        switchSubject(subject);
                        setExpandedSubject(isExpanded ? null : subject);
                      }}
                      className="flex-1 flex items-center gap-3 px-4 py-3.5 text-left"
                    >
                      {hasChats && (
                        <svg
                          className={`w-4 h-4 text-neutral-600 transition-all duration-300 ${
                            isExpanded ? 'rotate-90' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                      <span className={`text-sm font-semibold transition-colors duration-250 ${
                        currentSubject === subject ? 'text-black' : 'text-neutral-700'
                      }`}>
                        {subject}
                      </span>
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(menuOpen === `subject-${subject}` ? null : `subject-${subject}`);
                      }}
                      className="p-2.5 mr-2 hover:bg-neutral-100/80 rounded-lg transition-all duration-250 hover:scale-105 active:scale-95"
                    >
                      <span className="text-neutral-600 font-bold text-lg">⋯</span>
                    </button>
                  </div>

                  {/* Three-dot Menu Dropdown */}
                  {menuOpen === `subject-${subject}` && (
                     <div 
                       className="absolute right-2 top-14 bg-white border border-neutral-200/50 rounded-xl shadow-2xl z-50 min-w-[140px] overflow-hidden animate-scaleIn"                      style={{
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)'
                      }}
                    >
                      <button
                        onClick={(e) => renameSubject(subject, e)}
                        className="w-full text-left px-4 py-3 hover:bg-neutral-50 text-neutral-900 text-sm font-medium transition-all duration-200"
                      >
                        Rename
                      </button>
                      <div className="h-px bg-neutral-200/50"></div>
                      <button
                        onClick={(e) => deleteSubject(subject, e)}
                        className="w-full text-left px-4 py-3 hover:bg-red-50 text-red-600 text-sm font-medium transition-all duration-200"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* Expanded Chat List with Smooth Animation */}
                {isExpanded && hasChats && (
                  <div className="mt-2 ml-4 space-y-1 animate-slideDown overflow-hidden">
                    {chats.filter(c => c.messages.length > 0).map((chat, chatIndex) => (
                      <div 
                        key={chat.id} 
                        className="relative group animate-fadeIn"
                        style={{ animationDelay: `${chatIndex * 40}ms` }}
                      >
                        <button
                          onClick={() => switchChat(chat.id)}
                          className={`
                            w-full px-4 py-3 text-left rounded-xl transition-all duration-250
                            ${currentChatId === chat.id
                              ? 'bg-white/90 backdrop-blur-sm shadow-md scale-[1.01]'
                              : 'hover:bg-white/50 backdrop-blur-sm hover:scale-[1.01]'
                            }
                          `}
                        >
                          <div className="text-xs font-medium text-neutral-900 truncate pr-8">
                            {generateChatTitle(chat.messages)}
                          </div>
                          <div className="text-xs text-neutral-500 mt-1.5">
                            {new Date(chat.date).toLocaleDateString('en-GB', { 
                              day: 'numeric', 
                              month: 'short' 
                            })}
                          </div>
                        </button>
                        
                        <button
                          onClick={(e) => deleteChat(subject, chat.id, e)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-2 hover:bg-neutral-200/80 rounded-lg transition-all duration-250 hover:scale-110 active:scale-90"
                        >
                          <svg className="w-3.5 h-3.5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
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

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-neutral-200/50 bg-white/30 backdrop-blur-xl space-y-2.5">
          <button
            onClick={addSubject}
            className="w-full px-5 py-3 bg-white/70 backdrop-blur-sm border-2 border-dashed border-neutral-300 text-neutral-700 rounded-2xl text-sm font-medium hover:border-neutral-400 hover:bg-white/90 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md"
          >
            + Add Subject
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="w-full px-5 py-3 bg-white/70 backdrop-blur-sm border border-neutral-200/50 text-neutral-900 rounded-2xl text-sm font-medium hover:bg-white/90 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2.5 shadow-sm hover:shadow-md"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Premium Glassmorphism Header */}
        <div 
          className="h-16 border-b border-neutral-200/50 flex items-center justify-between px-8 bg-white/70 backdrop-blur-2xl"
          style={{
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
          }}
        >
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2.5 hover:bg-neutral-100/80 rounded-xl transition-all duration-250 hover:scale-105 active:scale-95"
            >
              <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1 className="text-base font-bold text-neutral-900">{currentSubject}</h1>
              <p className="text-xs text-neutral-500 mt-0.5">Learning together</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {yearGroup && (
              <div 
                className="px-4 py-2 bg-neutral-100/80 backdrop-blur-sm rounded-full text-xs font-semibold text-neutral-700 shadow-sm"
              >
                {yearOptions.find(y => y.value === yearGroup)?.label || 'Year 9'}
              </div>
            )}
            <Link 
              href="/" 
              className="text-sm font-bold text-neutral-900 hover:text-black transition-colors duration-250"
            >
              Newton
            </Link>
          </div>
        </div>

        {/* Suggestion Banner with Smooth Animation */}
        {suggestedSubject && !dismissedSuggestion && (
          <div className="bg-neutral-100/80 backdrop-blur-xl border-b border-neutral-200/50 px-8 py-4 flex items-center justify-between animate-slideDown">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-sm">
                <svg className="w-4 h-4 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-neutral-700">
                Move to <strong className="text-black font-bold">{suggestedSubject}</strong>?
              </span>
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={() => {
                  switchSubject(suggestedSubject);
                  setSuggestedSubject(null);
                }}
                className="px-5 py-2 bg-gradient-to-r from-neutral-900 to-neutral-800 text-white text-xs font-semibold rounded-full hover:shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 shadow-md"
              >
                Move
              </button>
              <button
                onClick={() => {
                  setDismissedSuggestion(true);
                  setSuggestedSubject(null);
                }}
                className="px-5 py-2 bg-white/70 backdrop-blur-sm border border-neutral-200 text-neutral-700 text-xs font-semibold rounded-full hover:bg-white hover:border-neutral-300 transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-8 py-10">
          {messages.length === 0 ? (
            !hasSeenWelcome ? (
              /* Premium Welcome Screen */
              <div className="flex flex-col items-center justify-center h-full text-center max-w-3xl mx-auto animate-fadeIn">
                <div 
                  className="w-24 h-24 bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-3xl flex items-center justify-center mb-8 shadow-2xl animate-float"
                  style={{
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 8px 24px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  <span className="text-4xl font-bold text-white">N</span>
                </div>
                <h2 className="text-5xl font-extrabold text-neutral-900 mb-5 tracking-tight">
                  Welcome to Newton
                </h2>
                <p className="text-xl text-neutral-600 mb-12 leading-relaxed max-w-2xl px-4">
                  I&apos;m here to help you truly learn. I won&apos;t do your homework—instead, I&apos;ll guide you to understand it yourself through questions and step-by-step thinking.
                </p>
                
                <div className="grid md:grid-cols-2 gap-6 w-full mb-10">
                  <div 
                    className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 text-left border border-neutral-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                    style={{
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
                    }}
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-2xl flex items-center justify-center mb-5 shadow-lg">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-neutral-900 mb-3 text-lg">Learn by thinking</h3>
                    <p className="text-sm text-neutral-600 leading-relaxed">
                      I ask questions that help you discover answers yourself
                    </p>
                  </div>
                  
                  <div 
                    className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 text-left border border-neutral-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                    style={{
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
                    }}
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-2xl flex items-center justify-center mb-5 shadow-lg">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-neutral-900 mb-3 text-lg">Academic integrity</h3>
                    <p className="text-sm text-neutral-600 leading-relaxed">
                      I refuse to do homework, so your work stays yours
                    </p>
                  </div>
                </div>

                <div 
                  className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-neutral-200/50 w-full shadow-lg"
                  style={{
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
                  }}
                >
                  <p className="text-sm font-bold text-neutral-900 mb-5">Try asking:</p>
                  <div className="space-y-3 text-left">
                    {[
                      'I don&apos;t understand how photosynthesis works',
                      'Can you help me approach this algebra problem?',
                      'Explain themes in Macbeth step by step'
                    ].map((example, i) => (
                      <div 
                        key={i}
                        className="flex items-center gap-4 text-sm text-neutral-700 bg-neutral-50/70 backdrop-blur-sm px-5 py-3 rounded-xl hover:bg-neutral-100/70 transition-all duration-250 cursor-pointer"
                        onClick={() => setInput(example)}
                      >
                        <div className="w-2 h-2 bg-neutral-400 rounded-full flex-shrink-0"></div>
                        <span className="font-medium">{example}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Simple Empty State */
              <div className="flex flex-col items-center justify-center h-full text-center animate-fadeIn">
                <div className="w-20 h-20 bg-neutral-100/80 backdrop-blur-sm rounded-3xl flex items-center justify-center mb-6 shadow-lg">
                  <span className="text-3xl font-bold text-neutral-600">N</span>
                </div>
                <h2 className="text-2xl font-bold text-neutral-900 mb-3">New conversation</h2>
                <p className="text-neutral-600 max-w-md text-lg">
                  Ask me anything about {currentSubject.toLowerCase()}
                </p>
              </div>
            )
          ) : (
            /* Messages List with Premium Styling */
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-5 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  } animate-slideUp`}
                  style={{ 
                    animationDelay: `${Math.min(index * 40, 400)}ms`,
                    animationFillMode: 'both'
                  }}
                >
                  {message.role === 'assistant' && (
                    <div 
                      className="w-10 h-10 bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg"
                      style={{
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                      }}
                    >
                      <span className="text-sm font-bold text-white">N</span>
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] rounded-3xl px-6 py-5 shadow-lg transition-all duration-300 hover:shadow-xl ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-neutral-100 to-neutral-50 text-neutral-900 border border-neutral-200/50'
                        : 'bg-white/90 backdrop-blur-sm border border-neutral-200/50 text-neutral-900'
                    }`}
                    style={{
                      boxShadow: message.role === 'user' 
                        ? '0 4px 20px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)'
                        : '0 4px 20px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)'
                    }}
                  >
                    <ReactMarkdown
                      remarkPlugins={[remarkMath, remarkGfm]}
                      rehypePlugins={[rehypeKatex]}
                      components={{
                        a: ({node, ...props}) => (
                          <a 
                            {...props} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-neutral-900 underline hover:text-black font-semibold transition-colors duration-200" 
                          />
                        ),
                        p: ({node, ...props}) => <p {...props} className="mb-4 last:mb-0 leading-relaxed" />,
                        ul: ({node, ...props}) => <ul {...props} className="list-disc ml-5 mb-4 space-y-2" />,
                        ol: ({node, ...props}) => <ol {...props} className="list-decimal ml-5 mb-4 space-y-2" />,
                        li: ({node, ...props}) => <li {...props} className="mb-1.5 leading-relaxed" />,
                        strong: ({node, ...props}) => <strong {...props} className="font-bold text-black" />,
                        code: ({node, inline, ...props}) => 
                          inline ? (
                            <code {...props} className="bg-neutral-100 px-2 py-1 rounded-lg text-sm font-mono" />
                          ) : (
                            <code {...props} className="block bg-neutral-100 p-4 rounded-xl text-sm font-mono overflow-x-auto" />
                          ),
                      }}
                    >
                      {fixMathNotation(message.content)}
                    </ReactMarkdown>
                  </div>
                  {message.role === 'user' && (
                    <div className="w-10 h-10 bg-neutral-200/80 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md">
                      <span className="text-xs font-bold text-neutral-700">You</span>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Premium Typing Indicator with Gradient Animation */}
              {isTyping && (
                <div className="flex gap-5 justify-start animate-fadeIn">
                  <div 
                    className="w-10 h-10 bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg"
                    style={{
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                    }}
                  >
                    <span className="text-sm font-bold text-white">N</span>
                  </div>
                  <div 
                    className="bg-white/90 backdrop-blur-sm border border-neutral-200/50 rounded-3xl px-6 py-5 shadow-lg"
                    style={{
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
                    }}
                  >
                    <div className="flex gap-2">
                      <div 
                        className="w-2.5 h-2.5 bg-gradient-to-r from-neutral-400 to-neutral-500 rounded-full animate-bounce"
                        style={{ animationDelay: '0ms', animationDuration: '1.4s' }}
                      ></div>
                      <div 
                        className="w-2.5 h-2.5 bg-gradient-to-r from-neutral-400 to-neutral-500 rounded-full animate-bounce"
                        style={{ animationDelay: '200ms', animationDuration: '1.4s' }}
                      ></div>
                      <div 
                        className="w-2.5 h-2.5 bg-gradient-to-r from-neutral-400 to-neutral-500 rounded-full animate-bounce"
                        style={{ animationDelay: '400ms', animationDuration: '1.4s' }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Premium Input Area with Glassmorphism */}
        <div 
          className="border-t border-neutral-200/50 p-8 bg-white/70 backdrop-blur-2xl"
          style={{
            boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.04)'
          }}
        >
          <form onSubmit={sendMessage} className="max-w-4xl mx-auto">
            <div className="flex gap-4">
              <div className="flex-1 relative">
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
                  className="w-full px-6 py-4 bg-white/90 backdrop-blur-sm border-2 border-neutral-200/50 rounded-3xl resize-none focus:outline-none focus:border-neutral-400/70 focus:bg-white focus:shadow-lg transition-all duration-300 text-neutral-900 placeholder-neutral-400 font-medium shadow-md"
                  rows={1}
                  style={{ 
                    minHeight: '60px', 
                    maxHeight: '200px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)'
                  }}
                />
                {/* Character Counter */}
                {input.length > 0 && (
                  <div className="absolute bottom-4 right-4 text-xs text-neutral-500 font-semibold bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm animate-fadeIn">
                    {input.length} characters
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="px-8 py-4 bg-gradient-to-r from-neutral-900 to-neutral-800 text-white rounded-3xl font-bold shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 hover:scale-105 active:scale-95 disabled:hover:scale-100"
                style={{
                  minWidth: '140px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0, 0, 0, 0.15)'
                }}
              >
                {isLoading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Thinking</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    <span>Send</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Premium Year Group Modal */}
      {showYearModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-fadeIn">
          <div 
            className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-scaleIn"
            style={{
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 8px 24px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div className="p-10 text-center">
              <div 
                className="w-20 h-20 mx-auto bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-3xl flex items-center justify-center mb-8 shadow-2xl"
                style={{
                  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.25)'
                }}
              >
                <span className="text-3xl font-bold text-white">N</span>
              </div>
              <h2 className="text-3xl font-extrabold text-neutral-900 mb-4 tracking-tight">Welcome to Newton!</h2>
              <p className="text-neutral-600 mb-8 text-lg leading-relaxed">
                What year group are you in? This helps me adjust my teaching style for you.
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                {yearOptions.map((option, i) => (
                  <button
                    key={option.value}
                    onClick={() => saveYearGroup(option.value)}
                    className="px-6 py-4 bg-neutral-100/80 backdrop-blur-sm hover:bg-white border border-neutral-200/50 rounded-2xl text-left text-neutral-900 font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95 animate-slideUp"
                    style={{ 
                      animationDelay: `${i * 50}ms`,
                      animationFillMode: 'both',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Premium Settings Modal */}
      {showSettings && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-fadeIn"
          onClick={() => setShowSettings(false)}
        >
          <div 
            className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
            style={{
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 8px 24px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div className="p-10">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Settings</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-3 hover:bg-neutral-100/80 rounded-2xl transition-all duration-250 hover:scale-105 active:scale-95"
                >
                  <svg className="w-6 h-6 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div>
                <label className="text-sm font-bold text-neutral-900 block mb-4">Year Group</label>
                <div className="grid grid-cols-2 gap-3">
                  {yearOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        saveYearGroup(option.value);
                        setShowSettings(false);
                      }}
                      className={`px-5 py-4 rounded-2xl text-left font-semibold transition-all duration-300 hover:scale-105 active:scale-95 ${
                        yearGroup === option.value
                          ? 'bg-gradient-to-r from-neutral-900 to-neutral-800 text-white shadow-xl'
                          : 'bg-neutral-100/80 backdrop-blur-sm text-neutral-700 hover:bg-neutral-200/80 border border-neutral-200/50 shadow-sm'
                      }`}
                      style={{
                        boxShadow: yearGroup === option.value 
                          ? '0 8px 24px rgba(0, 0, 0, 0.2)'
                          : '0 2px 8px rgba(0, 0, 0, 0.04)'
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-neutral-500 mt-5 font-medium">
                  Current: {yearOptions.find(y => y.value === yearGroup)?.label || 'Not set'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Premium CSS Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-12px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            max-height: 0;
          }
          to {
            opacity: 1;
            max-height: 1000px;
          }
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
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
          animation: fadeIn 0.5s ease-out forwards;
        }
        
        .animate-slideIn {
          animation: slideIn 0.4s ease-out forwards;
          opacity: 0;
        }
        
        .animate-slideUp {
          animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        
        .animate-slideDown {
          animation: slideDown 0.4s ease-out forwards;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        /* Smooth scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.15);
          border-radius: 100px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.25);
        }
      `}</style>
    </div>
  );
}