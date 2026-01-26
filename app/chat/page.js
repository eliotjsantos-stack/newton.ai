'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import Link from 'next/link';
import 'katex/dist/katex.min.css';
import { useChatStorage, loadFromDB } from '@/hooks/useChatStorage'



function generateChatTitle(messages, chatTitle) {
  if (chatTitle) return chatTitle;
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
   const defaultSubjects = ['General'];

  const [currentSubject, setCurrentSubject] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('newton-current-subject') || 'General';
    }
    return 'General';
  });

  const [subjects, setSubjects] = useState(() => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('newton-subjects');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse subjects:', e);
      }
    }
  }
  return ['General'];
});

const [chatsBySubject, setChatsBySubject] = useState(() => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('newton-chats');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse chats:', e);
      }
    }
  }
  return {
    'General': [{ id: 'initial', messages: [], date: new Date().toISOString() }]
  };
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
  const [sidebarOpen, setSidebarOpen] = useState(() => {
  if (typeof window !== 'undefined') {
    return window.innerWidth >= 768;
  }
  return true;
});
  const [draggedSubject, setDraggedSubject] = useState(null);
  const [draggedChat, setDraggedChat] = useState(null);
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
  
  const [currentUserEmail, setCurrentUserEmail] = useState(null);
const [isLoadingData, setIsLoadingData] = useState(true);
const [showReportIssue, setShowReportIssue] = useState(false);
const [reportIssueText, setReportIssueText] = useState('');
const [reportIssueSubmitting, setReportIssueSubmitting] = useState(false);
const [includeChat, setIncludeChat] = useState(true);
const [screenshot, setScreenshot] = useState(null);
const [showTutorial, setShowTutorial] = useState(() => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('newton-seen-tutorial') !== 'true';
  }
  return false;
});
const [buttonPositions, setButtonPositions] = useState({});
const [tutorialStep, setTutorialStep] = useState(0);

useEffect(() => {
  if (!showTutorial || tutorialStep === 0 || tutorialStep === 3 || tutorialStep === 6) return;
  
  const updatePositions = () => {
    const positions = {};
    
    const newConv = document.querySelector('button[class*="bg-gradient-to-r"]');
    if (newConv) positions.newConv = newConv.getBoundingClientRect();
    
    const general = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'General');
    if (general) positions.general = general.getBoundingClientRect();
    
    const report = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Report Issue'));
    if (report) positions.report = report.getBoundingClientRect();
    
    const dash = document.querySelector('a[href="/dashboard"]');
    if (dash) positions.dashboard = dash.getBoundingClientRect();
    
    setButtonPositions(positions);
  };
  
  updatePositions();
  window.addEventListener('resize', updatePositions);
  
  return () => window.removeEventListener('resize', updatePositions);
}, [showTutorial, tutorialStep]);

useChatStorage(chatsBySubject, subjects, currentSubject, currentChatId);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    
    
    
    const urlParams = new URLSearchParams(window.location.search);
    const urlSubject = urlParams.get('subject');
    if (urlSubject && subjects.includes(urlSubject)) {
      switchSubject(urlSubject);
    }
    
    const fromLanding = urlParams.get('new') === 'true' || document.referrer.includes(window.location.origin + '/');
    
    if (fromLanding && !urlParams.get('chat')) {
      const newChatId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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

useEffect(() => {
  const loadUserData = async () => {
    const token = localStorage.getItem('newton-auth-token');
    
    if (token) {
      try {
        const userResponse = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (userResponse.ok) {
  const userData = await userResponse.json();
  setCurrentUserEmail(userData.email);
  
  // Redirect admins to admin panel
  if (userData.isAdmin) {
    window.location.href = '/admin';
    return;
  }
          
          const chatData = await loadFromDB();

          localStorage.removeItem('newton-chats');
          localStorage.removeItem('newton-subjects');
          localStorage.removeItem('newton-current-subject');
          localStorage.removeItem('newton-current-chat-id');

          if (chatData && chatData.chatsBySubject) {
            setChatsBySubject(chatData.chatsBySubject);
            setSubjects(chatData.subjects || ['General']);
            setCurrentSubject(chatData.currentSubject || 'General');
            setCurrentChatId(chatData.currentChatId || null);
          } else {
            setChatsBySubject({ 'General': [{ id: 'initial', messages: [], date: new Date().toISOString() }] });
            setSubjects(['General']);
            setCurrentSubject('General');
            setCurrentChatId(null);
          }
        } else {
          localStorage.removeItem('newton-auth-token');
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
      }
    }
    
    setIsLoadingData(false);
  };
  
  loadUserData();
}, []);

  const startNewChat = () => {
    const newChatId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
    
    if (showTutorial && tutorialStep === 1) {
      nextTutorialStep();
    }
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
        updated[subj] = [{ id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, messages: [], date: new Date().toISOString() }];
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
      const newId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      setChatsBySubject(prev => ({
        ...prev,
        [subject]: [{ id: newId, messages: [], date: new Date().toISOString() }]
      }));
      setCurrentChatId(newId);
    }
    setDismissedSuggestion(false);
    setSuggestedSubject(null);
    
    if (showTutorial && tutorialStep === 2) {
      nextTutorialStep();
    }
  };

  const addSubject = () => {
  const newSubjectName = prompt('Enter new subject name:');
  if (newSubjectName && newSubjectName.trim() && !subjects.includes(newSubjectName)) {
    setSubjects([...subjects, newSubjectName].sort());
        const newChatId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
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

  const deleteSubject = async (subjectName, e) => {
  e.stopPropagation();
  if (subjects.length === 1) {
    alert('Cannot delete the last subject!');
    return;
  }
  if (!window.confirm(`Delete "${subjectName}" and all its chats?`)) return;
  
  const newSubjects = subjects.filter(s => s !== subjectName);
  const newChats = {...chatsBySubject};
  delete newChats[subjectName];
  
  setSubjects(newSubjects);
  setChatsBySubject(newChats);
  
  if (currentSubject === subjectName) {
    const newSubject = newSubjects[0];
    setCurrentSubject(newSubject);
    setCurrentChatId(newChats[newSubject]?.[0]?.id || null);
    setExpandedSubject(newSubject);
  }
  setMenuOpen(null);

  const token = localStorage.getItem('newton-auth-token');
  if (token) {
    try {
      await fetch('/api/chat/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          chatsBySubject: newChats,
          subjects: newSubjects,
          currentSubject: currentSubject === subjectName ? newSubjects[0] : currentSubject,
          currentChatId
        })
      });
    } catch (error) {
      console.error('Failed to save after delete:', error);
    }
  }
};

const handleDragStart = (e, subject) => {
  setDraggedSubject(subject);
  e.dataTransfer.effectAllowed = 'move';
};

const handleDragOver = (e, subject) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  
  if (!draggedSubject || draggedSubject === subject) return;
  
  const draggedIdx = subjects.indexOf(draggedSubject);
  const targetIdx = subjects.indexOf(subject);
  
  if (draggedIdx === -1 || targetIdx === -1) return;
  
  const newSubjects = [...subjects];
  newSubjects.splice(draggedIdx, 1);
  newSubjects.splice(targetIdx, 0, draggedSubject);
  
  setSubjects(newSubjects);
};

const handleDragEnd = () => {
  setDraggedSubject(null);
};

const handleChatDragStart = (e, chatId, subject) => {
  setDraggedChat({ id: chatId, subject });
  e.dataTransfer.effectAllowed = 'move';
};

const handleChatDragOver = (e, targetChatId, subject) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  
  if (!draggedChat || draggedChat.id === targetChatId || draggedChat.subject !== subject) return;
  
  const chats = chatsBySubject[subject] || [];
  const draggedIdx = chats.findIndex(c => c.id === draggedChat.id);
  const targetIdx = chats.findIndex(c => c.id === targetChatId);
  
  if (draggedIdx === -1 || targetIdx === -1) return;
  
  const newChats = [...chats];
  const [removed] = newChats.splice(draggedIdx, 1);
  newChats.splice(targetIdx, 0, removed);
  
  setChatsBySubject(prev => ({
    ...prev,
    [subject]: newChats
  }));
};

const handleChatDragEnd = () => {
  setDraggedChat(null);
};

const handleReportIssue = async () => {
  if (!reportIssueText.trim()) {
    alert('Please describe the issue');
    return;
  }
  
  setReportIssueSubmitting(true);
  
  try {
    const reportData = {
      issue: reportIssueText,
      userEmail: currentUserEmail,
      yearGroup: yearGroup,
      timestamp: new Date().toISOString(),
      chatContext: null,
      screenshot: null
    };

    if (includeChat && currentChat?.messages) {
      reportData.chatContext = {
        subject: currentSubject,
        messages: currentChat.messages.slice(-10),
        chatId: currentChatId
      };
    }

    if (screenshot) {
      const reader = new FileReader();
      const screenshotBase64 = await new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(screenshot);
      });
      reportData.screenshot = screenshotBase64;
    }

    const response = await fetch('/api/report-issue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reportData)
    });
    
    if (response.ok) {
      alert('Thank you! Your report has been submitted with context.');
      setReportIssueText('');
      setScreenshot(null);
      setShowReportIssue(false);
    } else {
      alert('Failed to submit report. Please try again.');
    }
  } catch (error) {
    console.error('Report issue error:', error);
    alert('Failed to submit report. Please try again.');
  } finally {
    setReportIssueSubmitting(false);
  }
};

const startTutorial = () => {
  setShowTutorial(true);
  setTutorialStep(0);
};

const nextTutorialStep = () => {
  if (tutorialStep < 6) {
    setTutorialStep(tutorialStep + 1);
  } else {
    closeTutorial();
  }
};

const closeTutorial = () => {
  setShowTutorial(false);
  setTutorialStep(0);
  if (typeof window !== 'undefined') {
    localStorage.setItem('newton-seen-tutorial', 'true');
  }
};

const skipTutorial = () => {
  closeTutorial();
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
      activeChatId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
      
      if (messages.length === 0) {
        try {
          const titleResponse = await fetch('/api/chat/title', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userMessage: userMessage.content,
              assistantMessage: assistantMessage
            })
          });
          
          if (titleResponse.ok) {
            const { title } = await titleResponse.json();
            
            setChatsBySubject(prev => ({
              ...prev,
              [currentSubject]: prev[currentSubject].map(chat =>
                chat.id === activeChatId
                  ? { ...chat, title: title }
                  : chat
              )
            }));
          }
        } catch (error) {
          console.error('Failed to generate title:', error);
        }
      }
      
    // Update last activity
      const token = localStorage.getItem('newton-auth-token');
      if (token) {
        fetch('/api/auth/update-activity', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => {}); // Silent fail
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

if (isLoadingData) {
  return (
    <div className="flex h-screen bg-neutral-100 items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-2xl flex items-center justify-center shadow-2xl mb-4 mx-auto animate-pulse">
          <span className="text-2xl font-bold text-white">N</span>
        </div>
        <p className="text-neutral-600 font-medium">Loading your chats...</p>
      </div>
    </div>
  );
}

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
  } bg-white/60 backdrop-blur-2xl border-r border-neutral-200/50 flex flex-col transition-all duration-300 ease-out overflow-hidden shadow-2xl md:relative fixed inset-y-0 left-0 z-50`}
  style={{
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)'
  }}
>
        {/* Sidebar Header with Glassmorphism */}
        <div className="p-6 border-b border-neutral-200/50 bg-white/30 backdrop-blur-xl">
          <Link 
            href="/chat" 
            className="flex items-center space-x-3 mb-6 group transition-all duration-250"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
              <span className="text-sm font-bold text-white">N</span>
            </div>
            <span className="text-base font-semibold text-neutral-900 group-hover:text-black transition-colors duration-250">Newton</span>
          </Link>
          
          {currentUserEmail && (
            <div className="mb-4 p-3 bg-white/50 backdrop-blur-sm rounded-xl border border-neutral-200/50">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-neutral-600 mb-1">Logged in as</p>
                  <p className="text-sm font-bold text-neutral-900 truncate">{currentUserEmail}</p>
                </div>
                <button
                  onClick={() => {
                    if (confirm('Log out?')) {
                      // Clear all localStorage
                      localStorage.removeItem('newton-auth-token');
                      localStorage.removeItem('newton-year-group');
                      localStorage.removeItem('newton-seen-welcome');
                      localStorage.removeItem('newton-seen-tutorial');
                      localStorage.removeItem('subjects');
                      localStorage.removeItem('subject-colors');
                      localStorage.removeItem('chats-by-subject');
                      localStorage.removeItem('current-subject');
                      localStorage.removeItem('current-chat-id');
                      
                      // Redirect to login
                      window.location.href = '/';
                    }
                  }}
                  className="ml-2 p-2 hover:bg-neutral-100 rounded-lg transition-all"
                  title="Logout"
                >
                  <svg className="w-4 h-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {currentUserEmail && (
            <Link 
              href="/dashboard"
              onClick={(e) => {
                if (showTutorial && tutorialStep === 5) {
                  e.preventDefault();
                  nextTutorialStep();
                }
              }}
              className={`mb-4 w-full px-4 py-3 bg-white/50 backdrop-blur-sm rounded-xl border border-neutral-200/50 hover:bg-white/70 transition-all flex items-center gap-2 text-sm font-semibold text-neutral-700 hover:text-neutral-900 ${showTutorial && tutorialStep === 5 ? 'relative z-[102]' : ''}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Dashboard
            </Link>
          )}
          
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
  draggable
  onDragStart={(e) => handleDragStart(e, subject)}
  onDragOver={(e) => handleDragOver(e, subject)}
  onDragEnd={handleDragEnd}
  className={`mb-2 animate-slideIn cursor-move ${menuOpen === `subject-${subject}` ? 'relative z-50' : ''} ${draggedSubject === subject ? 'opacity-50' : ''}`}
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
  draggable
  onDragStart={(e) => handleChatDragStart(e, chat.id, subject)}
  onDragOver={(e) => handleChatDragOver(e, chat.id, subject)}
  onDragEnd={handleChatDragEnd}
  className={`relative group animate-fadeIn cursor-move ${draggedChat?.id === chat.id ? 'opacity-50' : ''}`}
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
                            {generateChatTitle(chat.messages, chat.title)}
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

      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

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
  <button
    onClick={() => {
      setShowReportIssue(true);
      if (showTutorial && tutorialStep === 4) {
        setTimeout(() => {
          setShowReportIssue(false);
          nextTutorialStep();
        }, 2000);
      }
    }}
    className={`px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-semibold transition-all duration-250 flex items-center gap-2 hover:scale-105 active:scale-95 ${showTutorial && tutorialStep === 4 ? 'relative z-[102]' : ''}`}
  >
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
    Report Issue
  </button>
  <Link 
    href="/chat" 
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
                  I&apos;m here to help you truly learn. I won&apos;t do your work—instead, I&apos;ll guide you to understand it yourself through questions and step-by-step thinking.
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
                      I refuse to do your work, so it stays yours
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
    h1: ({node, ...props}) => <h1 {...props} className="text-xl font-bold my-4 text-neutral-900" />,
    h2: ({node, ...props}) => <h2 {...props} className="text-lg font-bold my-3 text-neutral-900" />,
    h3: ({node, ...props}) => <h3 {...props} className="text-base font-semibold my-2 text-neutral-800" />,
    code: ({node, inline, children, ...props}) => 
      inline ? (
        <code {...props} className="bg-neutral-100 text-pink-600 px-2 py-0.5 rounded font-mono text-sm">
          {children}
        </code>
      ) : (
        <pre className="bg-neutral-50 border border-neutral-200 p-4 rounded-xl my-3 overflow-x-auto">
          <code {...props} className="text-sm font-mono text-neutral-800 block whitespace-pre-wrap leading-relaxed">
            {children}
          </code>
        </pre>
      ),
  }}
>
  {message.content}
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
      
{/* Settings Modal */}
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

              <div className="mt-8 pt-8 border-t border-neutral-200">
                <button
                  onClick={() => {
                    setShowSettings(false);
                    startTutorial();
                  }}
                  className="w-full px-5 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl font-semibold transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Retake Tutorial
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {showTutorial && (
        <div className="fixed inset-0 z-[100] pointer-events-none">
          {/* Backdrop with SVG cutouts for spotlights */}
          <svg className="absolute inset-0 w-full h-full pointer-events-auto" style={{ zIndex: 100 }}>
            <defs>
              <mask id="spotlight-mask">
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                
                {/* Cut out holes for spotlights based on step */}
                {tutorialStep === 1 && sidebarOpen && buttonPositions.newConv && (
  <rect x={buttonPositions.newConv.left} y={buttonPositions.newConv.top} width={buttonPositions.newConv.width} height={buttonPositions.newConv.height} rx="16" fill="black" />
)}
{tutorialStep === 2 && sidebarOpen && buttonPositions.general && (
  <rect x={buttonPositions.general.left} y={buttonPositions.general.top} width={buttonPositions.general.width} height={buttonPositions.general.height} rx="12" fill="black" />
)}
{tutorialStep === 4 && buttonPositions.report && (
  <rect x={buttonPositions.report.left} y={buttonPositions.report.top} width={buttonPositions.report.width} height={buttonPositions.report.height} rx="12" fill="black" />
)}
{tutorialStep === 5 && sidebarOpen && currentUserEmail && buttonPositions.dashboard && (
  <rect x={buttonPositions.dashboard.left} y={buttonPositions.dashboard.top} width={buttonPositions.dashboard.width} height={buttonPositions.dashboard.height} rx="12" fill="black" />
)}
              </mask>
            </defs>
            <rect x="0" y="0" width="100%" height="100%" fill="rgba(0, 0, 0, 0.7)" mask="url(#spotlight-mask)" />
          </svg>

          {/* Animated spotlight borders */}
          {tutorialStep === 1 && sidebarOpen && buttonPositions.newConv && (
  <div 
    className="absolute border-4 border-blue-500 rounded-2xl animate-pulse-slow pointer-events-none"
    style={{
      top: `${buttonPositions.newConv.top}px`,
      left: `${buttonPositions.newConv.left}px`,
      width: `${buttonPositions.newConv.width}px`,
      height: `${buttonPositions.newConv.height}px`,
      zIndex: 101
    }}
  />
)}

{tutorialStep === 2 && sidebarOpen && buttonPositions.general && (
  <div 
    className="absolute border-4 border-blue-500 rounded-xl animate-pulse-slow pointer-events-none"
    style={{
      top: `${buttonPositions.general.top}px`,
      left: `${buttonPositions.general.left}px`,
      width: `${buttonPositions.general.width}px`,
      height: `${buttonPositions.general.height}px`,
      zIndex: 101
    }}
  />
)}

{tutorialStep === 4 && buttonPositions.report && (
  <div 
    className="absolute border-4 border-red-500 rounded-xl animate-pulse-slow pointer-events-none"
    style={{
      top: `${buttonPositions.report.top}px`,
      left: `${buttonPositions.report.left}px`,
      width: `${buttonPositions.report.width}px`,
      height: `${buttonPositions.report.height}px`,
      zIndex: 101
    }}
  />
)}

{tutorialStep === 5 && sidebarOpen && currentUserEmail && buttonPositions.dashboard && (
  <div 
    className="absolute border-4 border-blue-500 rounded-xl animate-pulse-slow pointer-events-none"
    style={{
      top: `${buttonPositions.dashboard.top}px`,
      left: `${buttonPositions.dashboard.left}px`,
      width: `${buttonPositions.dashboard.width}px`,
      height: `${buttonPositions.dashboard.height}px`,
      zIndex: 101
    }}
  />
)}


          {/* Tutorial content cards */}
          {tutorialStep === 0 && (
            <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-auto" style={{ zIndex: 102 }}>
              <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-12 text-center animate-scaleIn">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-3xl flex items-center justify-center mb-8 shadow-2xl">
                  <span className="text-4xl font-bold text-white">N</span>
                </div>
                <h2 className="text-4xl font-extrabold text-neutral-900 mb-4">Welcome to Newton!</h2>
                <p className="text-xl text-neutral-600 mb-8 leading-relaxed">
                  Let's take a quick tour. This will only take a minute!
                </p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={skipTutorial}
                    className="px-6 py-3 bg-neutral-100 text-neutral-700 rounded-xl font-semibold hover:bg-neutral-200 transition-all"
                  >
                    Skip Tour
                  </button>
                  <button
                    onClick={nextTutorialStep}
                    className="px-8 py-3 bg-gradient-to-r from-neutral-900 to-neutral-800 text-white rounded-xl font-semibold hover:scale-105 transition-all shadow-lg"
                  >
                    Start Tour →
                  </button>
                </div>
              </div>
            </div>
          )}

          {tutorialStep === 1 && (
  <div 
    className="absolute bg-white rounded-2xl p-6 shadow-2xl max-w-sm animate-slideIn pointer-events-auto"
    style={{
      top: '285px',
      left: sidebarOpen ? '300px' : '50px',
      zIndex: 102
    }}
            >
              <div className="absolute -top-3 -left-3 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                1
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">New Conversations</h3>
              <p className="text-neutral-600 mb-4">
                Click "New conversation" to start a fresh chat. Each is automatically saved by subject!
              </p>
              <div className="flex gap-3 justify-end">
                <button onClick={skipTutorial} className="text-sm text-neutral-500 hover:text-neutral-700">
                  Skip
                </button>
                <button
                  onClick={nextTutorialStep}
                  className="px-4 py-2 bg-gradient-to-r from-neutral-900 to-neutral-800 text-white rounded-lg font-semibold hover:scale-105 transition-all"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {tutorialStep === 2 && (
  <div 
    className="absolute bg-white rounded-2xl p-6 shadow-2xl max-w-sm animate-slideIn pointer-events-auto"
    style={{
      top: '315px',
      left: sidebarOpen ? '265px' : '50px',
      zIndex: 102
    }}
            >
              <div className="absolute -top-3 -left-3 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                2
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">Organize by Subject</h3>
              <p className="text-neutral-600 mb-4">
                Your chats are organized by subject. Switch between subjects to see all conversations about each topic!
              </p>
              <div className="flex gap-3 justify-end">
                <button onClick={skipTutorial} className="text-sm text-neutral-500 hover:text-neutral-700">
                  Skip
                </button>
                <button
                  onClick={nextTutorialStep}
                  className="px-4 py-2 bg-gradient-to-r from-neutral-900 to-neutral-800 text-white rounded-lg font-semibold hover:scale-105 transition-all"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {tutorialStep === 3 && (
            <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-auto" style={{ zIndex: 102 }}>
              <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-10 animate-scaleIn">
                <div className="absolute -top-3 -left-3 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                  3
                </div>
                <h3 className="text-2xl font-bold text-neutral-900 mb-6">How Newton Helps You Learn</h3>
                
                <div className="bg-neutral-50 rounded-2xl p-6 mb-6">
                  <div className="flex gap-4 mb-4">
                    <div className="w-10 h-10 bg-neutral-400 rounded-xl flex items-center justify-center flex-shrink-0">
      <span className="text-xs font-bold text-white">You</span>
    </div>
                    <div className="flex-1 bg-white rounded-xl p-4 shadow-sm">
                      <p className="text-neutral-900">What's the answer to 2x + 5 = 15?</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-white">N</span>
                    </div>
                    <div className="flex-1 bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                      <p className="text-neutral-900 mb-3">Great question! Let's work through this together. First, what do you think we should do to get x by itself?</p>
                      <p className="text-sm text-blue-700 font-semibold">💡 Newton guides you to discover answers yourself!</p>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-6">
  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
    <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center mb-3">
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
    </div>
    <p className="font-semibold text-neutral-900 mb-1">Newton Will:</p>
    <ul className="text-sm text-neutral-700 space-y-1">
      <li>• Ask guiding questions</li>
      <li>• Explain step-by-step</li>
      <li>• Help you understand deeply</li>
    </ul>
  </div>
  
  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
    <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center mb-3">
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </div>
    <p className="font-semibold text-neutral-900 mb-1">Newton Won't:</p>
    <ul className="text-sm text-neutral-700 space-y-1">
      <li>• Do your homework</li>
      <li>• Give direct answers</li>
      <li>• Write your essays</li>
    </ul>
  </div>
</div>

                <div className="flex gap-3 justify-end">
                  <button onClick={skipTutorial} className="text-sm text-neutral-500 hover:text-neutral-700">
                    Skip
                  </button>
                  <button
                    onClick={nextTutorialStep}
                    className="px-6 py-3 bg-gradient-to-r from-neutral-900 to-neutral-800 text-white rounded-xl font-semibold hover:scale-105 transition-all shadow-lg"
                  >
                    Next →
                  </button>
                </div>
              </div>
            </div>
          )}

          {tutorialStep === 4 && (
            <div 
              className="absolute bg-white rounded-2xl p-6 shadow-2xl max-w-sm animate-slideIn pointer-events-auto"
              style={{
                top: '80px',
                right: '50px',
                zIndex: 102
              }}
            >
              <div className="absolute -top-3 -left-3 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                4
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">Report Issues</h3>
              <p className="text-neutral-600 mb-4">
                Encounter a bug? Click "Report Issue" to let us know and we'll fix it right away!
              </p>
              <div className="flex gap-3 justify-end">
                <button onClick={skipTutorial} className="text-sm text-neutral-500 hover:text-neutral-700">
                  Skip
                </button>
                <button
                  onClick={nextTutorialStep}
                  className="px-4 py-2 bg-gradient-to-r from-neutral-900 to-neutral-800 text-white rounded-lg font-semibold hover:scale-105 transition-all"
                >
                  {currentUserEmail ? 'Next →' : 'Finish! 🚀'}
                </button>
              </div>
            </div>
          )}

          {tutorialStep === 5 && currentUserEmail && (
  <div 
    className="absolute bg-white rounded-2xl p-6 shadow-2xl max-w-sm animate-slideIn pointer-events-auto"
    style={{
      top: '230px',
      left: sidebarOpen ? '300px' : '50px',
      zIndex: 102
    }}
            >
              <div className="absolute -top-3 -left-3 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                5
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">Your Dashboard</h3>
              <p className="text-neutral-600 mb-4">
                Visit your Dashboard to see learning progress and analytics. Let's check it out!
              </p>
              <div className="flex gap-3 justify-end">
                <button onClick={skipTutorial} className="text-sm text-neutral-500 hover:text-neutral-700">
                  Skip
                </button>
                <button
                  onClick={() => {
                    window.location.href = '/dashboard?tutorial=true';
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-neutral-900 to-neutral-800 text-white rounded-lg font-semibold hover:scale-105 transition-all"
                >
                  Visit Dashboard →
                </button>
              </div>
            </div>
          )}

          {tutorialStep === 6 && (
            <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-auto" style={{ zIndex: 102 }}>
              <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-10 text-center animate-scaleIn">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-500 to-green-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-3xl font-bold text-neutral-900 mb-4">You're All Set!</h3>
                <p className="text-xl text-neutral-600 mb-8">
                  Ready to start learning? Ask Newton your first question!
                </p>
                <button
                  onClick={closeTutorial}
                  className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-bold hover:scale-105 transition-all shadow-xl text-lg"
                >
                  Start Learning! 🚀
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Report Issue Modal */}
      {showReportIssue && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-fadeIn"
          onClick={() => setShowReportIssue(false)}
        >
          <div 
            className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
            style={{
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 8px 24px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div className="p-10">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Report Issue</h2>
                <button
                  onClick={() => {
                    setShowReportIssue(false);
                    setScreenshot(null);
                  }}
                  className="p-3 hover:bg-neutral-100/80 rounded-2xl transition-all duration-250 hover:scale-105 active:scale-95"
                >
                  <svg className="w-6 h-6 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-bold text-neutral-900 block mb-4">
                    Describe the issue you encountered
                  </label>
                  <textarea
                    value={reportIssueText}
                    onChange={(e) => setReportIssueText(e.target.value)}
                    placeholder="Please describe what happened, what you expected, and any steps to reproduce the issue..."
                    rows={6}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all text-neutral-900 placeholder:text-neutral-400"
                  />
                </div>

                <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <input
                    type="checkbox"
                    id="includeChat"
                    checked={includeChat}
                    onChange={(e) => setIncludeChat(e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="includeChat" className="text-sm font-semibold text-neutral-900 cursor-pointer flex-1">
                    Include current chat conversation (helps us debug faster)
                  </label>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-bold text-neutral-900 block">
                    Screenshot (optional)
                  </label>
                  
                  {!screenshot ? (
                    <button
                      onClick={async () => {
                        try {
                          const stream = await navigator.mediaDevices.getDisplayMedia({
                            video: { mediaSource: 'screen' }
                          });
                          
                          const video = document.createElement('video');
                          video.srcObject = stream;
                          video.play();
                          
                          await new Promise(resolve => {
                            video.onloadedmetadata = resolve;
                          });
                          
                          const canvas = document.createElement('canvas');
                          canvas.width = video.videoWidth;
                          canvas.height = video.videoHeight;
                          canvas.getContext('2d').drawImage(video, 0, 0);
                          
                          stream.getTracks().forEach(track => track.stop());
                          
                          canvas.toBlob(blob => {
                            setScreenshot(blob);
                          }, 'image/png');
                        } catch (err) {
                          console.error('Screenshot error:', err);
                          alert('Screenshot capture cancelled or failed');
                        }
                      }}
                      className="w-full px-4 py-3 bg-neutral-100 hover:bg-neutral-200 border-2 border-dashed border-neutral-300 rounded-xl font-semibold text-neutral-700 transition-all flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Capture Screenshot
                    </button>
                  ) : (
                    <div className="relative p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                      <div className="flex items-center gap-3">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm font-semibold text-green-900">Screenshot captured</span>
                        <button
                          onClick={() => setScreenshot(null)}
                          className="ml-auto text-sm text-red-600 hover:text-red-700 font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowReportIssue(false);
                      setScreenshot(null);
                    }}
                    className="flex-1 px-6 py-3 bg-neutral-100 text-neutral-700 rounded-xl font-semibold hover:bg-neutral-200 transition-all duration-250"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReportIssue}
                    disabled={reportIssueSubmitting || !reportIssueText.trim()}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-250 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {reportIssueSubmitting ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
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

        @keyframes pulse-slow {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.animate-pulse-slow {
  animation: pulse-slow 2s ease-in-out infinite;
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