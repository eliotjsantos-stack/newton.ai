'use client';

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import Link from 'next/link';
import 'katex/dist/katex.min.css';

function fixMathNotation(text) {
  // Ensure text is a string
  if (typeof text !== 'string') {
    return '';
  }
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
      if (saved) {
        const parsed = JSON.parse(saved);
        // Migrate old messages: ensure content is always a string
        Object.keys(parsed).forEach(subject => {
          parsed[subject] = parsed[subject].map(chat => ({
            ...chat,
            messages: chat.messages.map(msg => ({
              ...msg,
              content: typeof msg.content === 'string' 
                ? msg.content 
                : Array.isArray(msg.content) 
                  ? msg.content.find(c => c && c.type === 'text')?.text || ''
                  : ''
            }))
          }));
        });
        return parsed;
      }
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
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [suggestedSubject, setSuggestedSubject] = useState(null);
  const [dismissedSuggestion, setDismissedSuggestion] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentChat = mounted && chatsBySubject[currentSubject]?.find(c => c.id === currentChatId);
  const messages = currentChat?.messages || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    
    // Validate files
    const validFiles = [];
    for (const file of files) {
      // Check file type - expanded list
      const validTypes = [
        'image/png', 
        'image/jpeg', 
        'image/jpg', 
        'image/webp', 
        'image/gif',
        'application/pdf', 
        'text/plain',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/msword', // .doc
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel' // .xls
      ];
      
      if (!validTypes.includes(file.type)) {
        alert(`${file.name} is not a supported file type`);
        continue;
      }
      
      // Check file size (20MB limit)
      if (file.size > 20 * 1024 * 1024) {
        alert(`${file.name} is too large (max 20MB)`);
        continue;
      }
      
      // Convert to base64
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
      
      validFiles.push({
        name: file.name,
        type: file.type,
        size: file.size,
        base64
      });
    }
    
    // Limit to 4 files total
    const newFiles = [...uploadedFiles, ...validFiles].slice(0, 4);
    setUploadedFiles(newFiles);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if ((!input.trim() && uploadedFiles.length === 0) || isLoading) return;

    // Construct user message with files
    let userMessageContent;
    if (uploadedFiles.length > 0) {
      // Format for vision API
      userMessageContent = [
        { type: 'text', text: input.trim() || 'What can you tell me about this?' }
      ];
      
      // Add images
      uploadedFiles.forEach(file => {
        if (file.type.startsWith('image/')) {
          userMessageContent.push({
            type: 'image_url',
            image_url: { url: file.base64 }
          });
        }
      });
    } else {
      userMessageContent = input.trim();
    }

    const userMessage = { 
      role: 'user', 
      content: userMessageContent,
      files: uploadedFiles.map(f => ({ name: f.name, type: f.type })) // Store file metadata for display
    };
    
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
    setUploadedFiles([]);
    setIsLoading(true);
    setDismissedSuggestion(false);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage]
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

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
    }
  };

  if (!mounted) return null;

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

        <div className="p-3 border-t border-neutral-200">
          <button
            onClick={addSubject}
            className="w-full px-4 py-2.5 bg-black text-white rounded-full text-sm hover:bg-neutral-800 transition"
          >
            + Add Subject
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

        <div className="flex-1 overflow-y-auto px-6 py-8">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mb-6">
                <span className="text-2xl font-semibold text-white">N</span>
              </div>
              <h2 className="text-2xl font-semibold text-black mb-3">Start learning</h2>
              <p className="text-neutral-600 max-w-md">
                Ask me anything about {currentSubject.toLowerCase()}. I&apos;ll guide you through understanding, not just give you answers.
              </p>
            </div>
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
                    {/* Show attached files for user messages */}
                    {message.role === 'user' && message.files && message.files.length > 0 && (
                      <div className="flex gap-2 mb-3 flex-wrap">
                        {message.files.map((file, fileIndex) => (
                          <div key={fileIndex} className="bg-neutral-200 rounded px-2 py-1 text-xs flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            {file.name}
                          </div>
                        ))}
                      </div>
                    )}
                    
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
                      {(() => {
                        let textContent = '';
                        if (typeof message.content === 'string') {
                          textContent = message.content;
                        } else if (Array.isArray(message.content)) {
                          const textPart = message.content.find(c => c && c.type === 'text');
                          textContent = textPart?.text || '';
                        }
                        return fixMathNotation(textContent);
                      })()}
                    </ReactMarkdown>
                  </div>
                  {message.role === 'user' && (
                    <div className="w-8 h-8 bg-neutral-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-neutral-600">You</span>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="border-t border-neutral-200 p-6">
          <form onSubmit={sendMessage} className="max-w-3xl mx-auto">
            {/* File Preview Area */}
            {uploadedFiles.length > 0 && (
              <div className="mb-3 flex gap-2 flex-wrap">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="relative group bg-neutral-100 rounded-lg p-2 pr-8">
                    {file.type.startsWith('image/') ? (
                      <img src={file.base64} alt={file.name} className="h-16 w-16 object-cover rounded" />
                    ) : (
                      <div className="h-16 w-16 flex items-center justify-center bg-neutral-200 rounded">
                        <svg className="w-8 h-8 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="text-xs text-neutral-600 mt-1 max-w-[64px] truncate">{file.name}</div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute -top-1 -right-1 bg-black text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex gap-3">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.txt,.doc,.docx,.xls,.xlsx"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {/* Attach button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || uploadedFiles.length >= 4}
                className="px-4 py-3 bg-neutral-100 border border-neutral-200 rounded-full hover:bg-neutral-200 transition disabled:opacity-30"
                title="Attach files (images, PDFs, text)"
              >
                <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
              
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
                disabled={(!input.trim() && uploadedFiles.length === 0) || isLoading}
                className="px-6 py-3 bg-black text-white rounded-full hover:bg-neutral-800 transition disabled:opacity-30"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}