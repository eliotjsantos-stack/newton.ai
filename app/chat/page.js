'use client';

import { useState, useEffect, useRef, useMemo, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import Link from 'next/link';
import 'katex/dist/katex.min.css';
import { useChatStorage, loadFromDB } from '@/hooks/useChatStorage';
import { supabase } from '@/lib/supabase';
import MermaidDiagram from '@/components/MermaidDiagram';
import ChartDiagram from '@/components/ChartDiagram';
import { useTheme } from '@/components/ThemeProvider';

// Convert AI's wrong math delimiters to proper ones for KaTeX rendering
function fixMathDelimiters(content) {
  if (!content) return content;

  let fixed = content;

  // First, handle LaTeX-style delimiters: \( \) and \[ \]
  // These are the most common wrong formats from AI models
  // Convert \[ ... \] to $$ ... $$ (display math)
  fixed = fixed.replace(/\\\[\s*([\s\S]*?)\s*\\\]/g, '$$$$$1$$$$');
  // Convert \( ... \) to $ ... $ (inline math)
  fixed = fixed.replace(/\\\(\s*([\s\S]*?)\s*\\\)/g, '$$$1$$');

  // Handle standalone brackets containing math-like content
  // Convert [ ... ] to $$ ... $$ when it contains LaTeX commands or equations
  fixed = fixed.replace(/\[\s*([^\[\]]*(?:\\frac|\\sqrt|\\pm|\\times|\\div|\\cdot|\\int|\\sum|\\prod|\\lim|\\infty|\\alpha|\\beta|\\gamma|\\theta|\\pi)[^\[\]]*)\s*\]/g, '$$$$$1$$$$');

  // Handle parentheses containing math-like content
  // Convert ( ... ) to $ ... $ when it contains LaTeX commands
  fixed = fixed.replace(/\(\s*([^()]*(?:\\frac|\\sqrt|\\pm|\\times|\\div|\\cdot)[^()]*)\s*\)/g, '$$$1$$');
  // Convert ( x = ... ) style equations to inline math
  fixed = fixed.replace(/\(\s*([a-zA-Z]_?\d?\s*=\s*[^()]+)\s*\)/g, '$$$1$$');

  return fixed;
}

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

// Static plugin arrays to prevent re-renders
const remarkPlugins = [remarkMath, remarkGfm];
const rehypePlugins = [rehypeKatex];

// Helper to extract links section from message content
function extractLinksSection(content) {
  if (!content) return { mainContent: content, linksContent: null };

  // Match various patterns for the recommended links section
  const linksPatterns = [
    /\n---\n\*\*📚 Recommended Links:\*\*([\s\S]*?)$/,
    /\n---\n\*\*Recommended Links:\*\*([\s\S]*?)$/,
    /\n\*\*📚 Recommended Links:\*\*([\s\S]*?)$/,
    /\n\*\*Recommended Links:\*\*([\s\S]*?)$/,
    /\n📚 \*\*Recommended Links:\*\*([\s\S]*?)$/,
  ];

  for (const pattern of linksPatterns) {
    const match = content.match(pattern);
    if (match) {
      const mainContent = content.replace(pattern, '').trim();
      const linksContent = match[1].trim();
      return { mainContent, linksContent };
    }
  }

  return { mainContent: content, linksContent: null };
}

// Collapsible links card component
const LinksCard = memo(function LinksCard({ linksContent, markdownComponents }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Count the links
  const linkCount = (linksContent.match(/\[.*?\]\(.*?\)/g) || []).length;

  return (
    <div className="mt-4 border border-blue-200/60 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 rounded-2xl overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-blue-100/30 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-blue-900">Helpful Resources</p>
            <p className="text-xs text-blue-600">{linkCount} link{linkCount !== 1 ? 's' : ''} to learn more</p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-blue-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 pt-1 border-t border-blue-100">
          <div className="prose prose-sm prose-blue max-w-none">
            <ReactMarkdown
              remarkPlugins={remarkPlugins}
              rehypePlugins={rehypePlugins}
              components={{
                ...markdownComponents,
                a: ({node, ...props}) => (
                  <a
                    {...props}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-700 hover:text-blue-900 underline decoration-blue-300 hover:decoration-blue-500 font-medium transition-colors"
                  />
                ),
                p: ({node, ...props}) => <p {...props} className="mb-2 last:mb-0 text-neutral-700" />,
                ul: ({node, ...props}) => <ul {...props} className="list-none ml-0 space-y-2 mt-2" />,
                li: ({node, ...props}) => (
                  <li {...props} className="flex items-start gap-2 text-sm text-neutral-700">
                    <span className="text-blue-400 mt-0.5">→</span>
                    <span className="flex-1">{props.children}</span>
                  </li>
                ),
              }}
            >
              {linksContent}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
});

// Memoized message component to prevent re-renders when typing
const MessageItem = memo(function MessageItem({ message, index, markdownComponents }) {
  // Extract links section for assistant messages
  const { mainContent, linksContent } = message.role === 'assistant'
    ? extractLinksSection(message.content)
    : { mainContent: message.content, linksContent: null };

  return (
    <div
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
          className="w-10 h-10 bg-gradient-to-br from-neutral-800 to-neutral-900 dark:from-neutral-100 dark:to-neutral-200 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg"
          style={{
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}
        >
          <span className="text-sm font-bold text-white dark:text-neutral-900">N</span>
        </div>
      )}
      <div
        className={`max-w-[75%] rounded-3xl px-6 py-5 shadow-lg transition-all duration-300 hover:shadow-xl ${
          message.role === 'user'
            ? 'bg-gradient-to-br from-neutral-100 to-neutral-50 dark:from-neutral-700 dark:to-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-200/50 dark:border-neutral-600/50'
            : 'bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm border border-neutral-200/50 dark:border-neutral-700/50 text-neutral-900 dark:text-neutral-100'
        }`}
        style={{
          boxShadow: message.role === 'user'
            ? '0 4px 20px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)'
            : '0 4px 20px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)'
        }}
      >
        <ReactMarkdown
          remarkPlugins={remarkPlugins}
          rehypePlugins={rehypePlugins}
          components={markdownComponents}
        >
          {fixMathDelimiters(mainContent)}
        </ReactMarkdown>

        {/* Collapsible Links Card */}
        {linksContent && (
          <LinksCard linksContent={linksContent} markdownComponents={markdownComponents} />
        )}

        {message.files && message.files.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.files.map((file, fileIndex) => (
              <div key={fileIndex} className="bg-neutral-100/80 dark:bg-neutral-700/80 border border-neutral-200 dark:border-neutral-600 rounded-xl p-3">
                {file.type === 'image' ? (
                  <div>
                    <img
                      src={file.data}
                      alt={file.name}
                      className="rounded-lg max-w-full h-auto max-h-64 object-contain"
                    />
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2">{file.name}</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-neutral-600 dark:text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">{file.name}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {message.role === 'user' && (
        <div className="w-10 h-10 bg-neutral-200/80 dark:bg-neutral-700/80 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md">
          <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">You</span>
        </div>
      )}
    </div>
  );
});

export default function Newton() {
  const { theme, toggleTheme } = useTheme();
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
  const [isListening, setIsListening] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
  if (typeof window !== 'undefined') {
    return window.innerWidth >= 768;
  }
  return true;
});
  const [draggedSubject, setDraggedSubject] = useState(null);
  const [draggedChat, setDraggedChat] = useState(null);
  const [expandedSubject, setExpandedSubject] = useState(null);
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
const [uploadedFiles, setUploadedFiles] = useState([]);
const [isDragging, setIsDragging] = useState(false);
const [showTutorial, setShowTutorial] = useState(() => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('newton-seen-tutorial') !== 'true';
  }
  return false;
});
const [showLinkRecommendations, setShowLinkRecommendations] = useState(() => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('newton-show-links') !== 'false';
  }
  return true;
});
const [archivedChats, setArchivedChats] = useState(() => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('newton-archived-chats');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse archived chats:', e);
      }
    }
  }
  return {};
});
const [chatSearch, setChatSearch] = useState('');
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
  const abortControllerRef = useRef(null);
  const recognitionRef = useRef(null);

  // Auto-resize textarea when input changes (handles typing + speech)
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 200) + 'px';
    }
  }, [input]);

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

  // Memoize markdown components to prevent chart re-renders when typing
  const markdownComponents = useMemo(() => ({
    a: ({node, ...props}) => (
      <a
        {...props}
        target="_blank"
        rel="noopener noreferrer"
        className="text-neutral-900 dark:text-neutral-100 underline hover:text-black dark:hover:text-white font-semibold transition-colors duration-200"
      />
    ),
    p: ({node, ...props}) => <p {...props} className="mb-4 last:mb-0 leading-relaxed" />,
    ul: ({node, ...props}) => <ul {...props} className="list-disc ml-5 mb-4 space-y-2" />,
    ol: ({node, ...props}) => <ol {...props} className="list-decimal ml-5 mb-4 space-y-2" />,
    li: ({node, ...props}) => <li {...props} className="mb-1.5 leading-relaxed" />,
    strong: ({node, ...props}) => <strong {...props} className="font-bold text-black dark:text-white" />,
    h1: ({node, ...props}) => <h1 {...props} className="text-xl font-bold my-4 text-neutral-900 dark:text-neutral-100" />,
    h2: ({node, ...props}) => <h2 {...props} className="text-lg font-bold my-3 text-neutral-900 dark:text-neutral-100" />,
    h3: ({node, ...props}) => <h3 {...props} className="text-base font-semibold my-2 text-neutral-800 dark:text-neutral-200" />,
    code: ({node, inline, children, className, ...props}) => {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';

      if (!inline && language === 'mermaid') {
        const code = String(children).replace(/\n$/, '');

        // Detect xychart syntax which mermaid can't parse properly
        if (code.includes('xychart') || code.includes('x-axis') || code.includes('y-axis')) {
          return (
            <div className="my-4 p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-xl">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Graph format not supported</p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                    Newton tried to create a graph using an unsupported format. Please ask Newton to &quot;draw the graph using chart format&quot; instead.
                  </p>
                </div>
              </div>
            </div>
          );
        }

        return <MermaidDiagram chart={code} />;
      }

      if (!inline && language === 'chart') {
        const code = String(children).replace(/\n$/, '');
        return <ChartDiagram config={code} />;
      }

      return inline ? (
        <code {...props} className="bg-neutral-100 dark:bg-neutral-700 text-pink-600 dark:text-pink-400 px-2 py-0.5 rounded font-mono text-sm">
          {children}
        </code>
      ) : (
        <pre className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-4 rounded-xl my-3 overflow-x-auto">
          <code {...props} className={`text-sm font-mono text-neutral-800 dark:text-neutral-200 block whitespace-pre-wrap leading-relaxed ${className || ''}`}>
            {children}
          </code>
        </pre>
      );
    },
  }), []);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

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
    if (mounted) {
      localStorage.setItem('newton-show-links', showLinkRecommendations.toString());
    }
  }, [showLinkRecommendations, mounted]);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('newton-archived-chats', JSON.stringify(archivedChats));
    }
  }, [archivedChats, mounted]);

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

// Reload subjects when window regains focus (e.g., switching from dashboard)
useEffect(() => {
  const handleFocus = async () => {
    const email = currentUserEmail || (typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null);
    if (!email) return;

    try {
      const { data } = await supabase
        .from('user_chats')
        .select('subjects')
        .eq('user_email', email)
        .single();

      if (data && data.subjects) {
        setSubjects(data.subjects);
      }
    } catch (error) {
      console.error('Failed to reload subjects:', error);
    }
  };

  window.addEventListener('focus', handleFocus);
  return () => window.removeEventListener('focus', handleFocus);
}, [currentUserEmail]);

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

    if (showTutorial && tutorialStep === 1) {
      nextTutorialStep();
    }
  };

  const switchChat = (chatId) => {
    setCurrentChatId(chatId);
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

  const pinChat = (subj, chatId, e) => {
    e.stopPropagation();
    setChatsBySubject(prev => ({
      ...prev,
      [subj]: prev[subj].map(chat =>
        chat.id === chatId ? { ...chat, pinned: !chat.pinned } : chat
      )
    }));
    setMenuOpen(null);
  };

  const archiveChat = (subj, chatId, e) => {
    e.stopPropagation();
    const chatToArchive = chatsBySubject[subj]?.find(c => c.id === chatId);
    if (!chatToArchive) return;

    // Add to archived chats
    setArchivedChats(prev => ({
      ...prev,
      [subj]: [...(prev[subj] || []), { ...chatToArchive, archivedAt: new Date().toISOString() }]
    }));

    // Remove from active chats
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

const handleFileUpload = (files) => {
  const validFiles = Array.from(files).filter(file => {
    const isValidType = file.type.startsWith('image/'); // Only images for now
    const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
    
    if (!isValidType) {
      alert(`${file.name} is not a supported file type. Please upload images only.`);
      return false;
    }
    if (!isValidSize) {
      alert(`${file.name} is too large. Maximum file size is 10MB.`);
      return false;
    }
    return true;
  });
  
  setUploadedFiles(prev => [...prev, ...validFiles]);
};

const handleFileDragOver = (e) => {
  e.preventDefault();
  setIsDragging(true);
};

const handleDragLeave = (e) => {
  e.preventDefault();
  setIsDragging(false);
};

const handleDrop = (e) => {
  e.preventDefault();
  setIsDragging(false);
  handleFileUpload(e.dataTransfer.files);
};

const removeFile = (index) => {
  setUploadedFiles(prev => prev.filter((_, i) => i !== index));
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
    
    // Handle file uploads
    if (uploadedFiles.length > 0) {
      const filePromises = uploadedFiles.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({
              type: file.type.startsWith('image/') ? 'image' : 'document',
              data: reader.result,
              name: file.name,
              mimeType: file.type
            });
          };
          reader.readAsDataURL(file);
        });
      });
      
      const filesData = await Promise.all(filePromises);
      userMessage.files = filesData;
    }
    
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

    // Stop speech recognition if active
    if (recognitionRef.current) {
      recognitionRef.current.onresult = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setIsListening(false);
    }
    setInput('');
    setUploadedFiles([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsLoading(true);
    setIsTyping(true);

    try {
      abortControllerRef.current = new AbortController();
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          yearGroup: yearGroup || 'year9',
          showLinks: showLinkRecommendations
        }),
        signal: abortControllerRef.current.signal,
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
      if (error.name !== 'AbortError') {
        console.error('Error:', error);
      }
    } finally {
      abortControllerRef.current = null;
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const cancelMessage = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const toggleSpeechToText = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in your browser. Try Chrome or Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-GB';
    recognitionRef.current = recognition;

    // Store the input value at the time recording started
    const startingInput = input;

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      const prefix = startingInput ? startingInput.trimEnd() + ' ' : '';
      setInput(prefix + transcript);
    };

    recognition.onerror = (event) => {
      if (event.error === 'aborted') return;
      if (event.error === 'network') {
        alert('Speech recognition requires an internet connection. Chrome sends audio to Google for processing. Make sure you are online and try again.');
      } else if (event.error === 'not-allowed') {
        alert('Microphone access was denied. Please allow microphone access in your browser settings.');
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.start();
    setIsListening(true);
  };

  const saveYearGroup = (year) => {
    setYearGroup(year);
    setShowYearModal(false);
  };

  if (!mounted) return null;

if (isLoadingData) {
  return (
    <div className="flex h-screen bg-neutral-100 dark:bg-neutral-900 items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-neutral-800 to-neutral-900 dark:from-neutral-200 dark:to-neutral-100 rounded-2xl flex items-center justify-center shadow-2xl mb-4 mx-auto animate-pulse">
          <span className="text-2xl font-bold text-white dark:text-neutral-900">N</span>
        </div>
        <p className="text-neutral-600 dark:text-neutral-400 font-medium">Loading your chats...</p>
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
   <div className="flex h-screen bg-white dark:bg-neutral-900 overflow-hidden">
      {/* Premium Glassmorphism Sidebar */}
      <div
  className={`${
    sidebarOpen ? 'w-72' : 'w-0'
  } bg-white/60 dark:bg-neutral-800/60 backdrop-blur-2xl border-r border-neutral-200/50 dark:border-neutral-700/50 flex flex-col transition-all duration-300 ease-out overflow-hidden shadow-2xl md:relative fixed inset-y-0 left-0 z-50`}
  style={{
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)'
  }}
>
        {/* Sidebar Header with Glassmorphism */}
        <div className="p-6 border-b border-neutral-200/50 dark:border-neutral-700/50 bg-white/30 dark:bg-neutral-800/30 backdrop-blur-xl">
          <Link
            href="/chat"
            className="flex items-center space-x-3 mb-6 group transition-all duration-250"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-neutral-800 to-neutral-900 dark:from-neutral-100 dark:to-neutral-200 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
              <span className="text-sm font-bold text-white dark:text-neutral-900">N</span>
            </div>
            <span className="text-base font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-black dark:group-hover:text-white transition-colors duration-250">Newton</span>
          </Link>
          
          {currentUserEmail && (
            <div className="mb-4 p-3 bg-white/50 dark:bg-neutral-700/50 backdrop-blur-sm rounded-xl border border-neutral-200/50 dark:border-neutral-600/50">
              <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Logged in as</p>
              <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate">{currentUserEmail}</p>
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
              className={`mb-4 w-full px-4 py-3 bg-white/50 dark:bg-neutral-700/50 backdrop-blur-sm rounded-xl border border-neutral-200/50 dark:border-neutral-600/50 hover:bg-white/70 dark:hover:bg-neutral-600/50 transition-all flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 ${showTutorial && tutorialStep === 5 ? 'relative z-[102]' : ''}`}
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
            let chats = chatsBySubject[subject] || [];

            // Filter chats by search query
            if (chatSearch.trim()) {
              chats = chats.filter(chat => {
                const title = generateChatTitle(chat.messages, chat.title).toLowerCase();
                const content = chat.messages.map(m => m.content).join(' ').toLowerCase();
                const query = chatSearch.toLowerCase();
                return title.includes(query) || content.includes(query);
              });
            }

            // Sort: pinned first, then by date
            chats = [...chats].sort((a, b) => {
              if (a.pinned && !b.pinned) return -1;
              if (!a.pinned && b.pinned) return 1;
              return new Date(b.date) - new Date(a.date);
            });
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
                      ? 'bg-white/80 dark:bg-neutral-700/80 backdrop-blur-sm shadow-md'
                      : 'hover:bg-white/40 dark:hover:bg-neutral-700/40 backdrop-blur-sm'
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
                          className={`w-4 h-4 text-neutral-600 dark:text-white transition-all duration-300 ${
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
                        currentSubject === subject ? 'text-black dark:text-white' : 'text-neutral-700 dark:text-white'
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
                      <span className="text-neutral-600 dark:text-white font-bold text-lg">⋯</span>
                    </button>
                  </div>

                  {/* Three-dot Menu Dropdown */}
                  {menuOpen === `subject-${subject}` && (
                     <div
                       className="absolute right-2 top-14 bg-white dark:bg-neutral-800 border border-neutral-200/50 dark:border-neutral-700/50 rounded-xl shadow-2xl z-50 min-w-[140px] overflow-hidden animate-scaleIn"
                       style={{
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)'
                      }}
                    >
                      <button
                        onClick={(e) => renameSubject(subject, e)}
                        className="w-full text-left px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-900 dark:text-neutral-100 text-sm font-medium transition-all duration-200"
                      >
                        Rename
                      </button>
                      <div className="h-px bg-neutral-200/50 dark:bg-neutral-700/50"></div>
                      <button
                        onClick={(e) => deleteSubject(subject, e)}
                        className="w-full text-left px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium transition-all duration-200"
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
  className={`relative group animate-fadeIn cursor-move ${draggedChat?.id === chat.id ? 'opacity-50' : ''} ${menuOpen === `chat-${chat.id}` ? 'z-50' : ''}`}
  style={{ animationDelay: `${chatIndex * 40}ms` }}
>
                        <button
                          onClick={() => switchChat(chat.id)}
                          className={`
                            w-full px-4 py-3 text-left rounded-xl transition-all duration-250
                            ${currentChatId === chat.id
                              ? 'bg-white/90 dark:bg-neutral-700/90 backdrop-blur-sm shadow-md scale-[1.01]'
                              : 'hover:bg-white/50 dark:hover:bg-neutral-700/50 backdrop-blur-sm hover:scale-[1.01]'
                            }
                          `}
                        >
                          <div className="flex items-center gap-2">
                            {chat.pinned && (
                              <svg className="w-3 h-3 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6l1 1 1-1v-6h5v-2l-2-2z"/>
                              </svg>
                            )}
                            <span className="text-xs font-medium text-neutral-900 dark:text-white truncate pr-6">
                              {generateChatTitle(chat.messages, chat.title)}
                            </span>
                          </div>
                          <div className="text-xs text-neutral-500 dark:text-neutral-300 mt-1.5">
                            {new Date(chat.date).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short'
                            })}
                          </div>
                        </button>

                        {/* Chat Menu Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpen(menuOpen === `chat-${chat.id}` ? null : `chat-${chat.id}`);
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-neutral-200/80 rounded-lg transition-all duration-250"
                        >
                          <svg className="w-4 h-4 text-neutral-500 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>

                        {/* Chat Context Menu */}
                        {menuOpen === `chat-${chat.id}` && (
                          <div
                            className="absolute right-2 top-full mt-1 bg-white dark:bg-neutral-800 border border-neutral-200/50 dark:border-neutral-700/50 rounded-xl shadow-2xl z-50 min-w-[140px] overflow-hidden animate-scaleIn"
                            style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)' }}
                          >
                            <button
                              onClick={(e) => pinChat(subject, chat.id, e)}
                              className="w-full text-left px-4 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm font-medium transition-colors flex items-center gap-2"
                            >
                              <svg className="w-4 h-4 text-amber-500" fill={chat.pinned ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6l1 1 1-1v-6h5v-2l-2-2z"/>
                              </svg>
                              {chat.pinned ? 'Unpin' : 'Pin'}
                            </button>
                            <button
                              onClick={(e) => archiveChat(subject, chat.id, e)}
                              className="w-full text-left px-4 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm font-medium transition-colors flex items-center gap-2"
                            >
                              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                              </svg>
                              Archive
                            </button>
                            <div className="h-px bg-neutral-200/50 dark:bg-neutral-700/50"></div>
                            <button
                              onClick={(e) => deleteChat(subject, chat.id, e)}
                              className="w-full text-left px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium transition-colors flex items-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                          </div>
                        )}
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
          <div className="flex gap-2">
            <Link
              href="/chat/archive"
              className="flex-1 px-4 py-3 bg-white/70 backdrop-blur-sm border border-neutral-200/50 text-neutral-700 rounded-2xl text-sm font-medium hover:bg-white/90 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              <span>Archive</span>
              {Object.values(archivedChats).flat().length > 0 && (
                <span className="bg-neutral-200 text-neutral-600 text-xs px-1.5 py-0.5 rounded-full">
                  {Object.values(archivedChats).flat().length}
                </span>
              )}
            </Link>
            <button
              onClick={() => setShowSettings(true)}
              className="px-4 py-3 bg-white/70 backdrop-blur-sm border border-neutral-200/50 text-neutral-900 rounded-2xl text-sm font-medium hover:bg-white/90 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Premium Glassmorphism Header */}
        <div
          className="h-16 border-b border-neutral-200/50 dark:border-neutral-700/50 flex items-center justify-between px-8 bg-white/70 dark:bg-neutral-800/70 backdrop-blur-2xl"
          style={{
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
          }}
        >
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2.5 hover:bg-neutral-100/80 dark:hover:bg-neutral-700/80 rounded-xl transition-all duration-250 hover:scale-105 active:scale-95"
            >
              <svg className="w-5 h-5 text-neutral-600 dark:text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1 className="text-base font-bold text-neutral-900 dark:text-neutral-100">{currentSubject}</h1>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Learning together</p>
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
    className="text-sm font-bold text-neutral-900 dark:text-neutral-100 hover:text-black dark:hover:text-white transition-colors duration-250"
  >
    Newton
  </Link>
</div>
        </div>

        {/* Messages Area */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-8 py-10">
          {messages.length === 0 ? (
            !hasSeenWelcome ? (
              /* Premium Welcome Screen */
              <div className="flex flex-col items-center justify-center h-full text-center max-w-3xl mx-auto animate-fadeIn">
                <div
                  className="w-24 h-24 bg-gradient-to-br from-neutral-800 to-neutral-900 dark:from-neutral-100 dark:to-neutral-200 rounded-3xl flex items-center justify-center mb-8 shadow-2xl animate-float"
                  style={{
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 8px 24px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  <span className="text-4xl font-bold text-white dark:text-neutral-900">N</span>
                </div>
                <h2 className="text-5xl font-extrabold text-neutral-900 dark:text-neutral-100 mb-5 tracking-tight">
                  Welcome to Newton
                </h2>
                <p className="text-xl text-neutral-600 dark:text-neutral-400 mb-12 leading-relaxed max-w-2xl px-4">
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
                      'Can you explain to me how photosynthesis works.',
                      'Can you help me understand quadratic equations in maths.',
                      'Help me plan an essay on Macbeth step by step.'
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
                <MessageItem
                  key={index}
                  message={message}
                  index={index}
                  markdownComponents={markdownComponents}
                />
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

        {/* Input Area */}
        <div className="px-4 pb-4 pt-2 max-w-4xl mx-auto w-full">
          <form onSubmit={sendMessage}>
            {/* File Upload Preview */}
            {uploadedFiles.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-xl px-3 py-2">
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {file.type.startsWith('image/') ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      )}
                    </svg>
                    <span className="text-sm font-semibold text-blue-900 dark:text-blue-200">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="ml-2 text-red-600 hover:text-red-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div
              className="relative flex flex-col bg-transparent border border-neutral-300 dark:border-neutral-600 rounded-2xl focus-within:border-neutral-400 dark:focus-within:border-neutral-500 transition-all duration-300"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {isDragging && (
                <div className="absolute inset-0 bg-blue-100/90 dark:bg-blue-900/90 border-4 border-dashed border-blue-400 rounded-2xl flex items-center justify-center z-10 backdrop-blur-sm">
                  <div className="text-center">
                    <svg className="w-12 h-12 mx-auto mb-2 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-blue-900 dark:text-blue-200 font-bold">Drop files here</p>
                    <p className="text-blue-700 dark:text-blue-300 text-sm">Images (max 10MB)</p>
                  </div>
                </div>
              )}
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
                className="w-full px-4 pt-3 pb-2 bg-transparent resize-none focus:outline-none text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 font-medium overflow-y-auto"
                rows={1}
                style={{
                  minHeight: '44px',
                  maxHeight: '200px',
                }}
              />

              {/* Bottom row: attach + mic + send */}
              <div className="px-2 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <label className="cursor-pointer p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e.target.files)}
                      className="hidden"
                    />
                    <svg className="w-5 h-5 text-neutral-500 dark:text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </label>
                  <button
                    type="button"
                    onClick={toggleSpeechToText}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      isListening
                        ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 animate-pulse'
                        : 'hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-500 dark:text-neutral-400'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </button>
                </div>

                {isLoading ? (
                  <button
                    type="button"
                    onClick={cancelMessage}
                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200 active:scale-95"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="p-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-all duration-200 active:scale-95"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  </button>
                )}
              </div>
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
            className="bg-white/95 dark:bg-neutral-800/95 backdrop-blur-2xl rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
            style={{
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 8px 24px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div className="p-10">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight">Settings</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-3 hover:bg-neutral-100/80 dark:hover:bg-neutral-700/80 rounded-2xl transition-all duration-250 hover:scale-105 active:scale-95"
                >
                  <svg className="w-6 h-6 text-neutral-600 dark:text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div>
                <label className="text-sm font-bold text-neutral-900 dark:text-neutral-100 block mb-4">Year Group</label>
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
                          ? 'bg-gradient-to-r from-neutral-900 to-neutral-800 dark:from-neutral-100 dark:to-neutral-200 text-white dark:text-neutral-900 shadow-xl'
                          : 'bg-neutral-100/80 dark:bg-neutral-700/80 backdrop-blur-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/80 dark:hover:bg-neutral-600/80 border border-neutral-200/50 dark:border-neutral-600/50 shadow-sm'
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
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-5 font-medium">
                  Current: {yearOptions.find(y => y.value === yearGroup)?.label || 'Not set'}
                </p>
              </div>

              <div className="mt-8 pt-8 border-t border-neutral-200 dark:border-neutral-700">
                <label className="text-sm font-bold text-neutral-900 dark:text-neutral-100 block mb-4">Preferences</label>
                <div
                  className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-700/50 rounded-2xl cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                  onClick={() => setShowLinkRecommendations(!showLinkRecommendations)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Link Recommendations</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">Show helpful learning resources after each response</p>
                    </div>
                  </div>
                  <div className={`w-12 h-7 rounded-full transition-colors duration-200 ${showLinkRecommendations ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-neutral-600'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 mt-1 ${showLinkRecommendations ? 'translate-x-6' : 'translate-x-1'}`} />
                  </div>
                </div>

                <div
                  className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-700/50 rounded-2xl cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors mt-3"
                  onClick={toggleTheme}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-neutral-200 dark:bg-neutral-600 rounded-xl flex items-center justify-center">
                      {theme === 'dark' ? (
                        <svg className="w-5 h-5 text-neutral-700 dark:text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-neutral-700 dark:text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Dark Mode</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">Switch between light and dark themes</p>
                    </div>
                  </div>
                  <div className={`w-12 h-7 rounded-full transition-colors duration-200 ${theme === 'dark' ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-neutral-600'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 mt-1 ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} />
                  </div>
                </div>
              </div>

              <div className="mt-6">
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

              {currentUserEmail && (
                <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                  <button
                    onClick={() => {
                      localStorage.removeItem('newton-auth-token');
                      setCurrentUserEmail(null);
                      window.location.href = '/';
                    }}
                    className="w-full px-5 py-4 bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700 text-white rounded-2xl font-semibold transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Log Out
                  </button>
                </div>
              )}

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
              <div className="bg-white dark:bg-neutral-800 rounded-3xl shadow-2xl max-w-2xl w-full p-12 text-center animate-scaleIn">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-neutral-800 to-neutral-900 dark:from-neutral-100 dark:to-neutral-200 rounded-3xl flex items-center justify-center mb-8 shadow-2xl">
                  <span className="text-4xl font-bold text-white dark:text-neutral-900">N</span>
                </div>
                <h2 className="text-4xl font-extrabold text-neutral-900 dark:text-neutral-100 mb-4">Welcome to Newton!</h2>
                <p className="text-xl text-neutral-600 dark:text-neutral-400 mb-8 leading-relaxed">
                  Let's take a quick tour. This will only take a minute!
                </p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={skipTutorial}
                    className="px-6 py-3 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl font-semibold hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-all"
                  >
                    Skip Tour
                  </button>
                  <button
                    onClick={nextTutorialStep}
                    className="px-8 py-3 bg-gradient-to-r from-neutral-900 to-neutral-800 dark:from-neutral-100 dark:to-neutral-200 text-white dark:text-neutral-900 rounded-xl font-semibold hover:scale-105 transition-all shadow-lg"
                  >
                    Start Tour →
                  </button>
                </div>
              </div>
            </div>
          )}

          {tutorialStep === 1 && (
  <div
    className="absolute bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-2xl max-w-sm animate-slideIn pointer-events-auto"
    style={{
      top: '285px',
      left: sidebarOpen ? '300px' : '50px',
      zIndex: 102
    }}
            >
              <div className="absolute -top-3 -left-3 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                1
              </div>
              <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">New Conversations</h3>
              <p className="text-neutral-600 dark:text-neutral-400 mb-4">
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
    className="absolute bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-2xl max-w-sm animate-slideIn pointer-events-auto"
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
              <div className="bg-white dark:bg-neutral-800 rounded-3xl shadow-2xl max-w-3xl w-full p-10 animate-scaleIn">
                <div className="absolute -top-3 -left-3 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                  3
                </div>
                <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">How Newton Helps You Learn</h3>

                <div className="bg-neutral-50 dark:bg-neutral-700/50 rounded-2xl p-6 mb-6">
                  <div className="flex gap-4 mb-4">
                    <div className="w-10 h-10 bg-neutral-400 rounded-xl flex items-center justify-center flex-shrink-0">
      <span className="text-xs font-bold text-white">You</span>
    </div>
                    <div className="flex-1 bg-white dark:bg-neutral-700 rounded-xl p-4 shadow-sm">
                      <p className="text-neutral-900 dark:text-neutral-100">What's the answer to 2x + 5 = 15?</p>
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
              className="absolute bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-2xl max-w-sm animate-slideIn pointer-events-auto"
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
    className="absolute bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-2xl max-w-sm animate-slideIn pointer-events-auto"
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
              <div className="bg-white dark:bg-neutral-800 rounded-3xl shadow-2xl max-w-2xl w-full p-10 text-center animate-scaleIn">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-500 to-green-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">You're All Set!</h3>
                <p className="text-xl text-neutral-600 dark:text-neutral-400 mb-8">
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
            className="bg-white/95 dark:bg-neutral-800/95 backdrop-blur-2xl rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
            style={{
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 8px 24px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div className="p-10">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight">Report Issue</h2>
                <button
                  onClick={() => {
                    setShowReportIssue(false);
                    setScreenshot(null);
                  }}
                  className="p-3 hover:bg-neutral-100/80 dark:hover:bg-neutral-700/80 rounded-2xl transition-all duration-250 hover:scale-105 active:scale-95"
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