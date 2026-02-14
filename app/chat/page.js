'use client';

import { useState, useEffect, useRef, useMemo, memo, Suspense } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import 'katex/dist/katex.min.css';
import { useChatStorage, loadFromDB } from '@/hooks/useChatStorage';
import { supabase } from '@/lib/supabase';
import MermaidDiagram from '@/components/MermaidDiagram';
import ChartDiagram from '@/components/ChartDiagram';
import { useTheme } from '@/components/ThemeProvider';
import QualificationSelector from '@/components/QualificationSelector';
import SubjectSidebar from '@/components/SubjectSidebar';
import NewtonMascot from '@/components/NewtonMascot';
import UnderstandingRatingModal from '@/components/UnderstandingRatingModal';

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
    <div className="mt-4 border border-blue-500/20 bg-blue-500/[0.06] rounded-2xl overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-blue-500/[0.08] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-500/15 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-blue-300">Helpful Resources</p>
            <p className="text-xs text-blue-400/70">{linkCount} link{linkCount !== 1 ? 's' : ''} to learn more</p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-blue-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 pt-1 border-t border-blue-500/20">
          <div className="prose prose-sm prose-invert max-w-none">
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
                    className="text-blue-400 hover:text-blue-300 underline decoration-blue-500/40 hover:decoration-blue-400 font-medium transition-colors"
                  />
                ),
                p: ({node, ...props}) => <p {...props} className="mb-2 last:mb-0 text-neutral-300" />,
                ul: ({node, ...props}) => <ul {...props} className="list-none ml-0 space-y-2 mt-2" />,
                li: ({node, ...props}) => (
                  <li {...props} className="flex items-start gap-2 text-sm text-neutral-300">
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
const MessageItem = memo(function MessageItem({ message, index, markdownComponents, assistantRef }) {
  // Extract links section for assistant messages
  const { mainContent, linksContent } = message.role === 'assistant'
    ? extractLinksSection(message.content)
    : { mainContent: message.content, linksContent: null };

  const isUser = message.role === 'user';

  return (
    <div
      ref={!isUser ? assistantRef : undefined}
      className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'} animate-slideUp`}
      style={{
        animationDelay: `${Math.min(index * 40, 400)}ms`,
        animationFillMode: 'both'
      }}
    >
      {/* Spacer for mascot positioning on assistant messages */}
      {!isUser && (
        <div className="w-[52px] h-[52px] flex-shrink-0" />
      )}
      <div
        className={`max-w-[75%] px-1 py-1 ${
          isUser ? 'text-white/80' : 'text-neutral-200'
        }`}
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
              <div key={fileIndex} className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3">
                {file.type === 'image' ? (
                  <div>
                    <img
                      src={file.data}
                      alt={file.name}
                      className="rounded-lg max-w-full h-auto max-h-64 object-contain"
                    />
                    <p className="text-xs text-neutral-400 mt-2">{file.name}</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-semibold text-neutral-300">{file.name}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {isUser && (
        <div className="w-9 h-9 bg-white/[0.08] backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-[10px] font-semibold text-white/60">You</span>
        </div>
      )}
    </div>
  );
});

function NewtonContent() {
  const { theme, toggleTheme } = useTheme();
  const searchParams = useSearchParams();
  const GENERAL_SUBJECT_ID = '00000000-0000-0000-0000-000000000001';

  const [currentSubject, setCurrentSubject] = useState('General');
  const [flaggedQuestionsProcessed, setFlaggedQuestionsProcessed] = useState(false);

  // Current class context (null for General)
  const [currentClass, setCurrentClass] = useState(null);

  // Topic tracking state
  const [currentTopic, setCurrentTopic] = useState(null);
  const [topicMessageCount, setTopicMessageCount] = useState(0);
  const [showRatingModal, setShowRatingModal] = useState(false);


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
  const [mascotExpression, setMascotExpression] = useState('idle');
  const [mascotDropping, setMascotDropping] = useState(false);
  const [showTree, setShowTree] = useState(true);
  const [treeDetaching, setTreeDetaching] = useState(false);
  const showMascot = true;
  const latestAssistantRef = useRef(null);
  const typingIndicatorRef = useRef(null);
  const mascotRef = useRef(null);
  const [mascotStyle, setMascotStyle] = useState({ top: 0, left: 0, opacity: 0 });
  const [sidebarOpen, setSidebarOpen] = useState(() => {
  if (typeof window !== 'undefined') {
    return window.innerWidth >= 768;
  }
  return true;
});
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
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('newton-seen-welcome') === 'true';
    }
    return false;
  });
  
  const [currentUserEmail, setCurrentUserEmail] = useState(null);
  const [currentQanCode, setCurrentQanCode] = useState(null);
  const [userSubjects, setUserSubjects] = useState([]);
  const [activeSubjectId, setActiveSubjectId] = useState(GENERAL_SUBJECT_ID);
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
const [inputFocused, setInputFocused] = useState(false);

// Cognitive load tracking
const lastAssistantFinishRef = useRef(null);

useEffect(() => {
  if (!showTutorial || tutorialStep === 0 || tutorialStep === 3 || tutorialStep === 6) return;
  
  const updatePositions = () => {
    const positions = {};
    
    const newConv = document.querySelector('button[class*="bg-\\[\\#0071e3\\]"]');
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

useChatStorage(chatsBySubject, ['General'], currentSubject, currentChatId);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const abortControllerRef = useRef(null);
  const recognitionRef = useRef(null);
  const lastAnalyzedChatRef = useRef({ chatId: null, messageCount: 0 });


  // Background analysis function - extracts mastery data from chat sessions
  const triggerBackgroundAnalysis = async (forceChatId = null) => {
    const authToken = typeof window !== 'undefined' ? localStorage.getItem('newton-auth-token') : null;
    if (!authToken) return;

    const chatIdToAnalyze = forceChatId || currentChatId;
    const chatToAnalyze = chatsBySubject[currentSubject]?.find(c => c.id === chatIdToAnalyze);
    if (!chatToAnalyze || !chatToAnalyze.messages) return;

    const messageCount = chatToAnalyze.messages.length;

    // Skip if already analyzed this chat at this message count (or higher)
    if (
      lastAnalyzedChatRef.current.chatId === chatIdToAnalyze &&
      lastAnalyzedChatRef.current.messageCount >= messageCount
    ) {
      return;
    }

    // Only analyze if there are at least 4 messages (2 exchanges)
    if (messageCount < 4) return;

    try {
      const response = await fetch('/api/chat/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          messages: chatToAnalyze.messages,
          chatId: chatIdToAnalyze,
          subject: currentSubject,
          classId: currentClass?.id || null
        })
      });

      if (response.ok) {
        lastAnalyzedChatRef.current = { chatId: chatIdToAnalyze, messageCount };
        console.log('Chat session analyzed for mastery data');
      }
    } catch (error) {
      console.error('Background analysis error:', error);
    }
  };

  // Trigger background analysis when leaving the page or switching tabs
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // User is leaving the tab - trigger analysis
        triggerBackgroundAnalysis();
      }
    };

    const handleBeforeUnload = () => {
      // User is closing/leaving the page - trigger analysis
      // Use sendBeacon for reliability during page unload
      const authToken = localStorage.getItem('newton-auth-token');
      if (!authToken || !currentChatId) return;

      const chatToAnalyze = chatsBySubject[currentSubject]?.find(c => c.id === currentChatId);
      if (!chatToAnalyze || chatToAnalyze.messages.length < 4) return;

      // Skip if already analyzed
      if (
        lastAnalyzedChatRef.current.chatId === currentChatId &&
        lastAnalyzedChatRef.current.messageCount >= chatToAnalyze.messages.length
      ) {
        return;
      }

      // Use sendBeacon for reliable delivery during unload
      const data = JSON.stringify({
        messages: chatToAnalyze.messages,
        chatId: currentChatId,
        subject: currentSubject,
        classId: currentClass?.id || null,
        token: authToken
      });

      navigator.sendBeacon('/api/chat/analyze-beacon', data);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentChatId, currentSubject, chatsBySubject, currentClass]);

  // Auto-resize textarea when input changes (handles typing + speech)
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 200) + 'px';
    }
  }, [input]);

  // Store classId for use after data loads
  const [pendingClassId, setPendingClassId] = useState(null);
  const [pendingSubjectName, setPendingSubjectName] = useState(null);
  const [pendingNewFromSubject, setPendingNewFromSubject] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';

    const urlParams = new URLSearchParams(window.location.search);
    const classId = urlParams.get('classId');
    const subjectParam = urlParams.get('subject');
    const fromLanding = urlParams.get('new') === 'true';

    // Store classId or subject name to be processed after data loads
    if (classId) {
      setPendingClassId(classId);
      if (fromLanding) setPendingNewFromSubject(true);
    } else if (subjectParam) {
      setPendingSubjectName(decodeURIComponent(subjectParam));
      if (fromLanding) setPendingNewFromSubject(true);
    } else {
      // No classId or subject - default to General
      setCurrentSubject('General');
      setCurrentClass(null);
    }

    if (fromLanding && !classId && !subjectParam) {
      const newChatId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setChatsBySubject(prev => ({
        ...prev,
        ['General']: [
          { id: newChatId, messages: [], date: new Date().toISOString() },
          ...(prev['General'] || [])
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

  // Handle flagged questions from quiz results
  useEffect(() => {
    if (!mounted || !dataLoaded || flaggedQuestionsProcessed) return;

    const flaggedParam = searchParams.get('flagged');
    const topicParam = searchParams.get('topic');
    const subjectParam = searchParams.get('subject');

    if (flaggedParam) {
      try {
        const flaggedQuestions = JSON.parse(decodeURIComponent(flaggedParam));
        if (flaggedQuestions && flaggedQuestions.length > 0) {
          setFlaggedQuestionsProcessed(true);

          // Create a new chat for this review session
          const newChatId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const subject = subjectParam || 'General';

          // Build the review message
          const questionsList = flaggedQuestions.map((q, i) =>
            `${i + 1}. [${q.level.toUpperCase()}] ${q.questionText}`
          ).join('\n');

          const reviewMessage = `I just finished a quiz on "${topicParam || 'this topic'}" and flagged these questions I didn't fully understand. Can you help me go through each one and explain the concepts?\n\n${questionsList}`;

          // Add the new chat with the initial message
          const newChat = {
            id: newChatId,
            messages: [],
            date: new Date().toISOString(),
            title: `Review: ${topicParam || 'Quiz Questions'}`
          };

          setChatsBySubject(prev => ({
            ...prev,
            [subject]: [newChat, ...(prev[subject] || [])]
          }));

          setCurrentSubject(subject);
          setCurrentChatId(newChatId);

          // Set the input with the review message so user can send it
          setInput(reviewMessage);

          // Clear the URL params
          window.history.replaceState({}, '', '/chat');
        }
      } catch (e) {
        console.error('Failed to parse flagged questions:', e);
      }
    }
  }, [mounted, dataLoaded, searchParams, flaggedQuestionsProcessed]);

  // Process class context after user data is loaded
  useEffect(() => {
    if (!dataLoaded || !pendingClassId) return;

    const shouldCreateNew = pendingNewFromSubject;

    const loadClassContext = async () => {
      try {
        const token = localStorage.getItem('newton-auth-token');
        if (!token) return;

        const res = await fetch('/api/student/classes', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        const cls = (data.classes || []).find(c => c.id === pendingClassId);
        if (!cls) return;

        setCurrentClass(cls);

        // Refresh subjects list (may have just enrolled via join-class)
        const subjectsRes = await fetch('/api/subjects', {
          headers: { Authorization: `Bearer ${token}` }
        });
        let freshSubjects = userSubjects;
        if (subjectsRes.ok) {
          const { subjects } = await subjectsRes.json();
          if (subjects?.length > 0) {
            freshSubjects = subjects;
            setUserSubjects(subjects);
          }
        }

        // Match class to a DB subject by QAN code first, then by name
        let matched = cls.qan_code
          ? freshSubjects.find(s => s.qanCode === cls.qan_code)
          : null;
        if (!matched) {
          matched = freshSubjects.find(s =>
            s.name.toLowerCase() === cls.subject.toLowerCase()
          );
        }

        const subjectKey = matched?.name || cls.subject;
        setCurrentSubject(subjectKey);
        if (matched) setActiveSubjectId(matched.id);

        // If new=true, always create a fresh chat named after the subject + syllabus
        if (shouldCreateNew) {
          const newChatId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const chatTitle = cls.qualTitle
            ? `${cls.subject} — ${cls.board} ${cls.qualTitle.replace(/^(AQA|OCR|Pearson|Pearson Edexcel|WJEC)\s*/i, '').trim()}`
            : cls.subject;
          const newChat = { id: newChatId, messages: [], date: new Date().toISOString(), title: chatTitle };

          // Still load existing history so the sidebar shows it, but prepend the new chat
          let existingChats = [];
          if (matched) {
            try {
              const histRes = await fetch(`/api/chat/history?subjectId=${matched.id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (histRes.ok) {
                const { chats: dbChats } = await histRes.json();
                existingChats = (dbChats || []).map(c => ({
                  id: c.id, messages: c.messages, date: c.date,
                }));
              }
            } catch (e) {
              console.error('Failed to load subject history:', e);
            }
          }

          setChatsBySubject(prev => ({
            ...prev,
            [subjectKey]: [newChat, ...existingChats]
          }));
          setCurrentChatId(newChatId);
          setPendingNewFromSubject(false);
          window.history.replaceState({}, '', '/chat');
          return;
        }

        // Not new — load existing history
        if (matched) {
          try {
            const histRes = await fetch(`/api/chat/history?subjectId=${matched.id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (histRes.ok) {
              const { chats: dbChats } = await histRes.json();
              const subjectChats = (dbChats || []).map(c => ({
                id: c.id, messages: c.messages, date: c.date,
              }));
              if (subjectChats.length > 0) {
                setChatsBySubject(prev => ({ ...prev, [subjectKey]: subjectChats }));
                setCurrentChatId(subjectChats[0].id);
                return;
              }
            }
          } catch (e) {
            console.error('Failed to load subject history:', e);
          }
        }

        // Fallback: ensure subject exists in chatsBySubject with a new chat
        setChatsBySubject(prev => {
          if (!prev[subjectKey]) {
            const newChatId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            setCurrentChatId(newChatId);
            return {
              ...prev,
              [subjectKey]: [{ id: newChatId, messages: [], date: new Date().toISOString() }]
            };
          }
          const subjectChats = prev[subjectKey] || [];
          if (subjectChats.length > 0) {
            setCurrentChatId(subjectChats[0].id);
          }
          return prev;
        });
      } catch (err) {
        console.error('Failed to load class context:', err);
      }
    };

    setPendingClassId(null);
    loadClassContext();
  }, [dataLoaded, pendingClassId]);

  // Process subject URL param (from subject pages) after data is loaded
  useEffect(() => {
    if (!dataLoaded || !pendingSubjectName || userSubjects.length === 0) return;

    const subjectName = pendingSubjectName;
    const shouldCreateNew = pendingNewFromSubject;

    const matched = userSubjects.find(s =>
      s.name.toLowerCase() === subjectName.toLowerCase()
    );

    const createNewSubjectChat = (name) => {
      const newChatId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newChat = { id: newChatId, messages: [], date: new Date().toISOString(), title: name };
      setChatsBySubject(prev => ({
        ...prev,
        [name]: [newChat, ...(prev[name] || [])]
      }));
      setCurrentSubject(name);
      setCurrentChatId(newChatId);
    };

    if (matched) {
      if (shouldCreateNew) {
        // Switch to subject then create a new chat named after it
        setActiveSubjectId(matched.id);
        createNewSubjectChat(matched.name);
      } else {
        handleSubjectSelect(matched);
      }
    } else {
      if (shouldCreateNew) {
        createNewSubjectChat(subjectName);
      } else {
        setCurrentSubject(subjectName);
      }
    }

    setPendingSubjectName(null);
    setPendingNewFromSubject(false);
    window.history.replaceState({}, '', '/chat');
  }, [dataLoaded, pendingSubjectName, userSubjects]);

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
    // Check URL params directly (state from mount effect isn't committed yet)
    const urlParams = new URLSearchParams(window.location.search);
    const hasPendingNavigation = !!(urlParams.get('classId') || urlParams.get('subject'));

    const token = localStorage.getItem('newton-auth-token');

    if (token) {
      try {
        const userResponse = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (userResponse.ok) {
  const userData = await userResponse.json();
  setCurrentUserEmail(userData.email);
  if (userData.qanCode) setCurrentQanCode(userData.qanCode);

  // Redirect admins to admin panel
  if (userData.isAdmin) {
    window.location.href = '/admin';
    return;
  }

  // Load user's enrolled subjects
  try {
    const subjectsRes = await fetch('/api/subjects', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (subjectsRes.ok) {
      const { subjects } = await subjectsRes.json();
      if (subjects && subjects.length > 0) {
        setUserSubjects(subjects);
      } else {
        // Ensure at least General subject exists
        setUserSubjects([{ id: GENERAL_SUBJECT_ID, name: 'General', board: null, level: null }]);
      }
    }
  } catch (e) {
    console.error('Failed to load subjects:', e);
  }

  // Load chat history for the active subject from DB
  try {
    const historyRes = await fetch(`/api/chat/history?subjectId=${GENERAL_SUBJECT_ID}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (historyRes.ok) {
      const { chats: dbChats } = await historyRes.json();
      if (dbChats && dbChats.length > 0) {
        const subjectChats = dbChats.map(c => ({
          id: c.id,
          messages: c.messages,
          date: c.date,
        }));
        setChatsBySubject(prev => ({ ...prev, General: subjectChats }));
        if (!hasPendingNavigation) {
          setCurrentChatId(subjectChats[0]?.id || null);
        }
        setIsLoadingData(false);
        setDataLoaded(true);
        return; // Skip JSONB fallback
      }
    }
  } catch (e) {
    console.error('Failed to load history from messages API:', e);
  }

          const chatData = await loadFromDB();

          localStorage.removeItem('newton-chats');
          localStorage.removeItem('newton-subjects');
          localStorage.removeItem('newton-current-subject');
          localStorage.removeItem('newton-current-chat-id');

          if (chatData && chatData.chatsBySubject) {
            // Load all subject chats from database
            const loadedChats = { ...chatData.chatsBySubject };
            // Ensure General exists
            if (!loadedChats['General']) {
              loadedChats['General'] = [{ id: 'initial', messages: [], date: new Date().toISOString() }];
            }
            setChatsBySubject(loadedChats);
            // Don't override currentChatId if navigating to a specific subject/class
            if (!hasPendingNavigation) {
              setCurrentChatId(chatData.currentChatId || null);
            }
          } else {
            setChatsBySubject({ 'General': [{ id: 'initial', messages: [], date: new Date().toISOString() }] });
            if (!hasPendingNavigation) {
              setCurrentChatId(null);
            }
          }
        } else {
          localStorage.removeItem('newton-auth-token');
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
      }
    }
    
    setIsLoadingData(false);
    setDataLoaded(true);
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

    if (showTutorial && tutorialStep === 1) {
      nextTutorialStep();
    }
  };

  const switchChat = (chatId) => {
    // Trigger background analysis of current chat before switching
    if (currentChatId && currentChatId !== chatId) {
      triggerBackgroundAnalysis(currentChatId);
    }
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
    // Trigger background analysis of current chat before switching subjects
    if (currentChatId) {
      triggerBackgroundAnalysis(currentChatId);
    }
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

  const handleSubjectSelect = async (subject) => {
    if (currentChatId) triggerBackgroundAnalysis(currentChatId);
    setActiveSubjectId(subject.id);
    setCurrentSubject(subject.name);

    // Load history from DB for this subject
    const token = localStorage.getItem('newton-auth-token');
    if (token) {
      try {
        const res = await fetch(`/api/chat/history?subjectId=${subject.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const { chats } = await res.json();
          const subjectChats = (chats || []).map(c => ({
            id: c.id,
            messages: c.messages,
            date: c.date,
          }));
          if (subjectChats.length === 0) {
            const newChatId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            subjectChats.push({ id: newChatId, messages: [], date: new Date().toISOString() });
          }
          setChatsBySubject(prev => ({ ...prev, [subject.name]: subjectChats }));
          setCurrentChatId(subjectChats[0]?.id || null);
        }
      } catch (e) {
        console.error('Failed to load subject history:', e);
      }
    }
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

// Position the single floating mascot next to the target element
  useEffect(() => {
    const updateMascotPosition = () => {
      const target = typingIndicatorRef.current || latestAssistantRef.current;
      const container = messagesContainerRef.current;
      if (!target || !container) {
        setMascotStyle(prev => ({ ...prev, opacity: 0 }));
        return;
      }
      const containerRect = container.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const top = targetRect.top - containerRect.top + container.scrollTop;
      const left = targetRect.left - containerRect.left;
      setMascotStyle({ top, left, opacity: 1 });
    };

    updateMascotPosition();
    const container = messagesContainerRef.current;
    if (container) container.addEventListener('scroll', updateMascotPosition);
    window.addEventListener('resize', updateMascotPosition);
    const observer = new MutationObserver(updateMascotPosition);
    if (container) observer.observe(container, { childList: true, subtree: true });
    return () => {
      if (container) container.removeEventListener('scroll', updateMascotPosition);
      window.removeEventListener('resize', updateMascotPosition);
      observer.disconnect();
    };
  }, [messages.length, isTyping]);

  // Reset tree when switching chats — show tree for empty, hide for existing
  useEffect(() => {
    if (messages.length === 0) {
      setShowTree(true);
      setTreeDetaching(false);
    } else {
      setShowTree(false);
      setTreeDetaching(false);
    }
  }, [currentChatId, messages.length]);

  const handleAppleFall = () => {
    setShowTree(false);
    setMascotDropping(true);
    setMascotExpression('falling');
    setTimeout(() => {
      setMascotDropping(false);
      setMascotExpression('thinking');
    }, 650);
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

    // Cognitive load: measure time since last assistant response
    if (lastAssistantFinishRef.current && messages.length > 0) {
      const latencyMs = Date.now() - lastAssistantFinishRef.current;
      const lastMsg = messages[messages.length - 1];
      const isMultiStep = lastMsg?.role === 'assistant' && (lastMsg.content?.includes('?') || lastMsg.content?.length > 300);
      const token = localStorage.getItem('newton-auth-token');
      if (token) {
        if (latencyMs < 3000 && isMultiStep) {
          fetch('/api/chat/latency', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ flag: 'GUESSING', latencyMs, sessionId: currentChatId, sessionType: 'chat' }),
          }).catch(() => {});
        } else if (latencyMs > 120000) {
          fetch('/api/chat/latency', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ flag: 'STRUGGLING', latencyMs, sessionId: currentChatId, sessionType: 'chat' }),
          }).catch(() => {});
          // Don't block — the encouragement will appear naturally in the next response
        }
      }
    }

    const userMessage = { role: 'user', content: input.trim(), timestamp: new Date().toISOString() };

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

    // First message: trigger tree detach animation, then floating mascot takes over
    if (showTree) {
      setTreeDetaching(true);
      setMascotExpression('falling');
      // After animation completes, switch to messages view
      setTimeout(() => {
        handleAppleFall();
        setTreeDetaching(false);
      }, 700);
    } else {
      setMascotDropping(true);
      setMascotExpression('falling');
      setTimeout(() => {
        setMascotDropping(false);
        setMascotExpression('thinking');
      }, 650);
    }

    try {
      abortControllerRef.current = new AbortController();
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          yearGroup: yearGroup || 'year9',
          showLinks: showLinkRecommendations,
          subject: currentSubject,
          qanCode: currentQanCode,
          subjectId: activeSubjectId
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
            ? { ...chat, messages: [...chat.messages, { role: 'assistant', content: '', timestamp: new Date().toISOString() }] }
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

      // Record when assistant finished for cognitive load tracking
      lastAssistantFinishRef.current = Date.now();

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

        // Save messages to DB (messages table)
        fetch('/api/chat/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            subjectId: activeSubjectId,
            chatId: activeChatId,
            messages: [userMessage, { role: 'assistant', content: assistantMessage }],
          }),
        }).catch(err => console.error('Save messages error:', err));
      }

      // Post-processing check: detect if Newton solved the student's exact problem
      const userText = input.trim();
      // Extract numbers from the student's message
      const userNumbers = userText.match(/\d+\.?\d*/g) || [];
      // Check if response contains a "= [final answer]" pattern using the student's exact numbers
      if (userNumbers.length >= 2) {
        // Look for patterns like "x = 6" or "= 30" that solve the student's equation
        const solutionPatterns = [
          /(?:^|[=:])\s*-?\d+\.?\d*\s*$/m,  // ends with = number
          /(?:therefore|so|thus|hence|answer is|equals?|result is)\s*-?\d+\.?\d*/i,
        ];
        const hasSolution = solutionPatterns.some(p => p.test(assistantMessage));
        // Check if most of the student's numbers appear in the response working
        const numberMatches = userNumbers.filter(n =>
          new RegExp(`(?<![\\d.])${n.replace('.', '\\.')}(?![\\d.])`).test(assistantMessage)
        );
        if (hasSolution && numberMatches.length >= userNumbers.length * 0.7) {
          // Newton likely solved their exact problem - append a redirect
          const redirectMsg = "\n\n---\n\n⚠️ *Hmm, I think I got a bit carried away there! Let me step back — I shouldn't solve your exact problem for you. Try applying the method I showed to your numbers, and let me know if you get stuck on a specific step!*";
          assistantMessage += redirectMsg;
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
      }

      // Detect mascot expression from response
      const lowerResp = assistantMessage.toLowerCase();
      if (/well done|correct|exactly right|great job|brilliant|that's right|perfect|excellent|nicely done/.test(lowerResp)) {
        setMascotExpression('celebrating');
        setTimeout(() => setMascotExpression('idle'), 3000);
      } else if (/not quite|try again|incorrect|not exactly|close but|almost|not right|not correct|that's not|that isn't|unfortunately|careful there|have another|think again|let's reconsider|reconsider|good attempt but|nice try but|not the answer|wrong/.test(lowerResp)) {
        setMascotExpression('wrong');
        setTimeout(() => setMascotExpression('idle'), 5000);
      } else {
        setMascotExpression('idle');
      }

      // Topic tracking - extract and save topic after AI response
      const authToken = localStorage.getItem('newton-auth-token');
      if (authToken && assistantMessage.length > 50) {
        try {
          // Get all messages for context
          const chatMessages = [...messages, userMessage, { role: 'assistant', content: assistantMessage }];

          // Extract topic from conversation
          const extractResponse = await fetch('/api/topics/extract', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
              messages: chatMessages.slice(-10),
              subject: currentSubject
            })
          });

          if (extractResponse.ok) {
            const { topic, subtopic, confidence } = await extractResponse.json();

            // Only track if confidence is reasonable and not just general chat
            if (confidence > 0.5 && topic !== 'General Discussion') {
              // Track the topic
              const trackResponse = await fetch('/api/topics/track', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                  topic,
                  subtopic,
                  subject: currentSubject,
                  classId: currentClass?.id || null,
                  conversationContext: {
                    lastUserMessage: userMessage.content,
                    lastAssistantMessage: assistantMessage.substring(0, 500)
                  }
                })
              });

              if (trackResponse.ok) {
                const { topic: savedTopic } = await trackResponse.json();
                setCurrentTopic(savedTopic);
                setTopicMessageCount(savedTopic.message_count);

                // Check if we should show rating modal (10+ messages on same topic)
                if (savedTopic.message_count >= 10 && savedTopic.message_count % 10 === 0) {
                  // Show rating modal every 10 messages on the same topic
                  setShowRatingModal(true);
                }


              }
            }
          }
        } catch (topicError) {
          console.error('Topic tracking error:', topicError);
          // Don't fail the main flow for topic tracking errors
        }
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
    // Prompt GCSE/A-Level students to pick their course
    if (['year10', 'year11', 'year12', 'year13'].includes(year) && currentUserEmail && !currentQanCode) {
      setShowCourseModal(true);
    }
  };

  const saveQanCode = async (qanCode) => {
    setCurrentQanCode(qanCode);
    setShowCourseModal(false);
    const token = localStorage.getItem('newton-auth-token');
    if (token) {
      await fetch('/api/auth/update-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ qanCode }),
      });
    }
  };

  if (!mounted) return null;

if (isLoadingData) {
  return (
    <div className="flex h-screen bg-black items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 mx-auto animate-pulse">
          <span className="text-2xl font-bold text-black">N</span>
        </div>
        <p className="text-neutral-400 font-medium">Loading your chats...</p>
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
   <div className="flex h-screen overflow-hidden" style={{ background: '#0B0B0C' }}>
      {/* Sidebar */}
      <div
  className={`${
    sidebarOpen ? 'w-72' : 'w-0'
  } flex flex-col transition-all duration-200 overflow-hidden md:relative fixed inset-y-0 left-0 z-50 border-r border-white/5 backdrop-blur-xl`}
  style={{ background: 'rgba(11,11,12,0.92)' }}
>
        {/* Sidebar Header */}
        <div className="px-5 py-5 border-b border-white/5">
          <Link
            href="/chat"
            className="flex items-center space-x-2.5 mb-5"
          >
            <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center">
              <span className="text-sm font-bold text-black">N</span>
            </div>
            <span className="text-[15px] font-semibold text-white tracking-tight">Newton</span>
          </Link>

          {currentUserEmail && (
            <p className="text-[11px] text-white/30 truncate mb-3">{currentUserEmail}</p>
          )}

          <button
            onClick={startNewChat}
            className="w-full px-4 py-2.5 bg-[#0071e3] hover:bg-[#0077ed] text-white text-sm font-medium rounded-full transition-colors duration-200"
          >
            New conversation
          </button>
        </div>

        {/* Subject Sidebar */}
        <div className="px-3 py-3 border-b border-white/5 overflow-y-auto max-h-48">
          <SubjectSidebar
            subjects={userSubjects}
            activeSubjectId={activeSubjectId}
            onSelect={handleSubjectSelect}
          />
        </div>

        {/* Chat List for Current Subject */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          {(() => {
            let chats = chatsBySubject[currentSubject] || [];

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

            const chatsWithMessages = chats.filter(c => c.messages.length > 0);

            if (chatsWithMessages.length === 0) {
              return (
                <div className="text-center py-8 text-neutral-500 text-sm">
                  No conversations yet
                </div>
              );
            }

            return chatsWithMessages.map((chat, chatIndex) => (
              <div
                key={chat.id}
                className={`relative group animate-fadeIn mb-2 ${menuOpen === `chat-${chat.id}` ? 'z-50' : ''}`}
                style={{ animationDelay: `${chatIndex * 40}ms` }}
              >
                <button
                  onClick={() => switchChat(chat.id)}
                  className={`
                    w-full px-3.5 py-2.5 text-left rounded-xl transition-colors duration-200
                    ${currentChatId === chat.id
                      ? 'bg-white/[0.08] text-white'
                      : 'hover:bg-white/[0.04] text-white/60'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    {chat.pinned && (
                      <svg className="w-3 h-3 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6l1 1 1-1v-6h5v-2l-2-2z"/>
                      </svg>
                    )}
                    <span className="text-sm font-medium text-neutral-100 truncate pr-6">
                      {generateChatTitle(chat.messages, chat.title)}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-500 mt-1.5">
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
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white/[0.1] rounded-lg transition-all duration-250"
                >
                  <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>

                {/* Chat Context Menu */}
                {menuOpen === `chat-${chat.id}` && (
                  <div
                    className="absolute right-2 top-full mt-1 bg-neutral-900/95 backdrop-blur-xl border border-white/[0.1] rounded-xl shadow-2xl z-50 min-w-[140px] overflow-hidden animate-scaleIn"
                    style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)' }}
                  >
                    <button
                      onClick={(e) => pinChat(currentSubject, chat.id, e)}
                      className="w-full text-left px-4 py-2.5 hover:bg-white/[0.06] text-neutral-300 text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4 text-amber-500" fill={chat.pinned ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6l1 1 1-1v-6h5v-2l-2-2z"/>
                      </svg>
                      {chat.pinned ? 'Unpin' : 'Pin'}
                    </button>
                    <button
                      onClick={(e) => archiveChat(currentSubject, chat.id, e)}
                      className="w-full text-left px-4 py-2.5 hover:bg-white/[0.06] text-neutral-300 text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                      Archive
                    </button>
                    <div className="h-px bg-white/[0.06]"></div>
                    <button
                      onClick={(e) => deleteChat(currentSubject, chat.id, e)}
                      className="w-full text-left px-4 py-2.5 hover:bg-red-500/10 text-red-400 text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ));
          })()}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/[0.06] bg-white/[0.02] backdrop-blur-xl space-y-2">
          {/* Navigation Links */}
          <div className="flex gap-2">
            <Link
              href="/dashboard"
              className="flex-1 px-3 py-2.5 text-neutral-400 hover:text-white hover:bg-white/[0.06] rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
              Dashboard
            </Link>
            <Link
              href="/quiz"
              className="flex-1 px-3 py-2.5 text-neutral-400 hover:text-white hover:bg-white/[0.06] rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
              </svg>
              Quizzes
            </Link>
          </div>
          {/* Archive & Settings */}
          <div className="flex gap-2">
            <Link
              href="/chat/archive"
              className="flex-1 px-4 py-3 bg-white/[0.05] backdrop-blur-sm border border-white/[0.08] text-neutral-300 rounded-2xl text-sm font-medium hover:bg-white/[0.08] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              <span>Archive</span>
              {Object.values(archivedChats).flat().length > 0 && (
                <span className="bg-white/[0.1] text-neutral-400 text-xs px-1.5 py-0.5 rounded-full">
                  {Object.values(archivedChats).flat().length}
                </span>
              )}
            </Link>
            <button
              onClick={() => setShowSettings(true)}
              className="px-4 py-3 bg-white/[0.05] backdrop-blur-sm border border-white/[0.08] text-neutral-300 rounded-2xl text-sm font-medium hover:bg-white/[0.08] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
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
        {/* Header */}
        <div
          className="h-12 border-b border-white/5 flex items-center justify-between px-4 sm:px-6 backdrop-blur-md"
          style={{ background: 'rgba(11,11,12,0.85)' }}
        >
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-white/[0.06] rounded-xl transition-colors duration-200"
            >
              <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1 className="text-sm font-medium text-white/80">{currentSubject}</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
  {yearGroup && (
    <div className="hidden sm:block px-2.5 py-1 text-[10px] text-white/40 border border-white/5 rounded-full">
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
    className={`px-3 py-1.5 border border-white/5 text-white/40 hover:text-red-400 hover:border-red-500/20 rounded-full text-[10px] transition-colors flex items-center gap-1.5 ${showTutorial && tutorialStep === 4 ? 'relative z-[102]' : ''}`}
  >
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
    <span className="hidden sm:inline">Report Issue</span>
  </button>
  <Link
    href="/chat"
    className="hidden sm:block text-sm font-bold text-neutral-100 hover:text-white transition-colors duration-250"
  >
    Newton
  </Link>
</div>
        </div>

        {/* Messages Area */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 sm:px-8 md:px-12 py-6 pb-[200px] relative">
          {/* Single floating mascot */}
          {showMascot && !showTree && messages.length > 0 && messages.some(m => m.role === 'assistant') && (
            <div
              ref={mascotRef}
              className={mascotDropping ? 'newton-apple-drop' : ''}
              style={{
                position: 'absolute',
                top: mascotStyle.top,
                left: mascotStyle.left,
                opacity: mascotStyle.opacity,
                zIndex: 10,
                transition: mascotDropping ? 'none' : 'top 0.15s ease-out, left 0.15s ease-out',
                pointerEvents: 'auto',
              }}
            >
              <NewtonMascot size={52} expression={mascotExpression} />
            </div>
          )}
          {/* Floating mascot for typing indicator (before first assistant message) */}
          {showMascot && !showTree && isTyping && !messages.some(m => m.role === 'assistant') && (
            <div
              ref={mascotRef}
              className="newton-apple-drop"
              style={{
                position: 'absolute',
                top: mascotStyle.top,
                left: mascotStyle.left,
                opacity: mascotStyle.opacity,
                zIndex: 10,
                pointerEvents: 'auto',
              }}
            >
              <NewtonMascot size={52} expression={mascotExpression} />
            </div>
          )}
          {(messages.length === 0 || treeDetaching) && showTree ? (
            /* Apple Drop - Empty Chat */
            <div className={`min-h-[100dvh] w-full flex flex-col items-center justify-center text-center pb-[250px] animate-fadeIn ${treeDetaching ? 'tree-scene-fade' : ''}`}>
              <div className="relative" style={{ height: '120px', width: '80px' }}>
                <div className={treeDetaching ? 'apple-drop-from-sky' : 'apple-float-idle'}>
                  <NewtonMascot size={72} expression={treeDetaching ? 'falling' : 'idle'} />
                </div>
              </div>

              <h2 className="text-3xl font-semibold text-white tracking-tight mt-4 mb-2">
                {!hasSeenWelcome ? 'Welcome to Newton' : 'New conversation'}
              </h2>
              <p className="text-base text-neutral-500 max-w-md px-4">
                {!hasSeenWelcome
                  ? "I\u2019ll guide you to understand it yourself."
                  : `Ask me anything about ${currentSubject.toLowerCase()}`
                }
              </p>
              <style>{`
                .apple-float-idle {
                  animation: apple-float 3s ease-in-out infinite;
                }
                @keyframes apple-float {
                  0%, 100% { transform: translateY(0); }
                  50% { transform: translateY(-8px); }
                }
                .apple-drop-from-sky {
                  animation: apple-sky-fall 0.7s cubic-bezier(0.55, 0, 1, 0.45) forwards;
                }
                @keyframes apple-sky-fall {
                  0% { transform: translateY(-60vh); opacity: 0; }
                  20% { opacity: 1; }
                  80% { opacity: 1; }
                  100% { transform: translateY(300px); opacity: 0; }
                }
              `}</style>
            </div>
          ) : (
            /* Messages List */
            <div className="max-w-4xl mx-auto space-y-5">
              {messages.map((message, index) => {
                const isLastAssistant = message.role === 'assistant' &&
                  index === messages.reduce((last, m, i) => m.role === 'assistant' ? i : last, -1);
                return (
                <MessageItem
                  key={index}
                  message={message}
                  index={index}
                  markdownComponents={markdownComponents}
                  assistantRef={isLastAssistant ? latestAssistantRef : undefined}
                />
                );
              })}
              
              {/* Typing Indicator */}
              {isTyping && (
                <div ref={typingIndicatorRef} className="flex gap-4 justify-start animate-fadeIn">
                  <div className="w-[52px] h-[52px] flex-shrink-0" />
                  <div
                    className="bg-white/[0.05] backdrop-blur-sm border border-white/[0.08] rounded-2xl px-5 py-4"
                    style={{ boxShadow: '0 2px 12px rgba(0, 0, 0, 0.2)' }}
                  >
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1.4s' }} />
                      <div className="w-2 h-2 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '200ms', animationDuration: '1.4s' }} />
                      <div className="w-2 h-2 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '400ms', animationDuration: '1.4s' }} />
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

      </div>

      {/* ── Input Area (fixed bottom, centered) ── */}
      <div className={`fixed bottom-0 ${sidebarOpen ? 'md:left-72' : 'left-0'} right-0 z-[100] flex flex-col items-center pb-6 pt-4 pointer-events-none`} style={{ background: 'linear-gradient(to top, #0B0B0C 50%, transparent)' }}>
        <div className="w-full max-w-3xl px-4 pointer-events-auto">
          <form onSubmit={sendMessage}>
            {/* File Upload Preview */}
            {uploadedFiles.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-2">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {file.type.startsWith('image/') ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      )}
                    </svg>
                    <span className="text-sm font-semibold text-blue-300">{file.name}</span>
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
              className="relative flex flex-col rounded-2xl border border-white/10 focus-within:border-white/20 transition-colors duration-200 shadow-lg shadow-black/40"
              style={{ background: 'rgba(18,18,20,0.95)', backdropFilter: 'blur(20px)' }}
              onDragOver={handleFileDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {isDragging && (
                <div className="absolute inset-0 bg-blue-500/10 border-4 border-dashed border-blue-400/50 flex items-center justify-center z-10">
                  <div className="text-center">
                    <svg className="w-12 h-12 mx-auto mb-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-blue-300 font-bold">Drop files here</p>
                    <p className="text-blue-400 text-sm">Images (max 10MB)</p>
                  </div>
                </div>
              )}
              <div className="flex items-start">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(e);
                    }
                  }}
                  placeholder={`Ask about ${currentSubject.toLowerCase()}...`}
                  className="w-full px-4 pt-3 pb-2 bg-transparent resize-none focus:outline-none text-white/90 placeholder-white/30 overflow-y-auto"
                  rows={1}
                  style={{
                    minHeight: '44px',
                    maxHeight: '200px',
                  }}
                />
              </div>

              {/* Bottom row: attach + mic + send */}
              <div className="px-2 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <label className="cursor-pointer p-2 hover:bg-white/[0.06] rounded-full transition-colors">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e.target.files)}
                      className="hidden"
                    />
                    <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </label>
                  <button
                    type="button"
                    onClick={toggleSpeechToText}
                    className={`p-2 rounded-full transition-all duration-200 ${
                      isListening
                        ? 'bg-red-500/15 text-red-400 animate-pulse'
                        : 'hover:bg-white/[0.06] text-white/40'
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
                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="p-2 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-200"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-fadeIn">
          <div
            className="bg-neutral-900/95 backdrop-blur-2xl border border-white/[0.1] rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-scaleIn"
            style={{
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 8px 24px rgba(0, 0, 0, 0.3)'
            }}
          >
            <div className="p-10 text-center">
              <div
                className="w-20 h-20 mx-auto bg-white rounded-3xl flex items-center justify-center mb-8"
              >
                <span className="text-3xl font-bold text-black">N</span>
              </div>
              <h2 className="text-3xl font-extrabold text-neutral-100 mb-4 tracking-tight">Welcome to Newton!</h2>
              <p className="text-neutral-400 mb-8 text-lg leading-relaxed">
                What year group are you in? This helps me adjust my teaching style for you.
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                {yearOptions.map((option, i) => (
                  <button
                    key={option.value}
                    onClick={() => saveYearGroup(option.value)}
                    className="px-6 py-4 bg-white/[0.05] backdrop-blur-sm hover:bg-white/[0.1] border border-white/[0.08] rounded-2xl text-left text-neutral-100 font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95 animate-slideUp"
                    style={{
                      animationDelay: `${i * 50}ms`,
                      animationFillMode: 'both'
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

      {/* Course Selection Modal (onboarding step 2) */}
      {showCourseModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-fadeIn">
          <div
            className="bg-neutral-900/95 backdrop-blur-2xl border border-white/[0.1] rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-scaleIn"
            style={{ boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 8px 24px rgba(0, 0, 0, 0.3)' }}
          >
            <div className="p-10 text-center">
              <div
                className="w-20 h-20 mx-auto bg-white rounded-3xl flex items-center justify-center mb-8"
              >
                <svg className="w-10 h-10 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h2 className="text-3xl font-extrabold text-neutral-100 mb-4 tracking-tight">
                What are you studying?
              </h2>
              <p className="text-neutral-400 mb-8 text-lg leading-relaxed">
                Pick your course so I can tailor my help to your exact syllabus.
              </p>
              <div className="text-left">
                <QualificationSelector
                  value={currentQanCode}
                  onSelect={(qan) => saveQanCode(qan)}
                  levelFilter={['year10', 'year11'].includes(yearGroup) ? 2 : 3}
                  placeholder={['year10', 'year11'].includes(yearGroup) ? 'Search GCSE courses...' : 'Search A-Level courses...'}
                />
              </div>
              <button
                onClick={() => setShowCourseModal(false)}
                className="mt-6 text-sm font-medium text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                I'll set this later
              </button>
            </div>
          </div>
        </div>
      )}

{/* Settings Modal */}
      {showSettings && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[200] p-6 animate-fadeIn"
          onClick={() => setShowSettings(false)}
        >
          <div
            className="bg-neutral-900/95 backdrop-blur-2xl border border-white/[0.1] rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
            style={{
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 8px 24px rgba(0, 0, 0, 0.3)'
            }}
          >
            <div className="p-10">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-extrabold text-neutral-100 tracking-tight">Settings</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-3 hover:bg-white/[0.06] rounded-2xl transition-all duration-250 hover:scale-105 active:scale-95"
                >
                  <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div>
                <label className="text-sm font-bold text-neutral-100 block mb-4">Year Group</label>
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
                          ? 'bg-[#0071e3] text-white'
                          : 'bg-white/[0.05] backdrop-blur-sm text-neutral-300 hover:bg-white/[0.1] border border-white/[0.08]'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-neutral-500 mt-5 font-medium">
                  Current: {yearOptions.find(y => y.value === yearGroup)?.label || 'Not set'}
                </p>
              </div>

              {currentUserEmail && ['year10', 'year11', 'year12', 'year13'].includes(yearGroup) && (
                <div className="mt-8 pt-8 border-t border-white/[0.06]">
                  <label className="text-sm font-bold text-neutral-100 block mb-4">My Course</label>
                  <QualificationSelector
                    value={currentQanCode}
                    onSelect={(qan) => saveQanCode(qan)}
                    levelFilter={['year10', 'year11'].includes(yearGroup) ? 2 : 3}
                    placeholder={['year10', 'year11'].includes(yearGroup) ? 'Search GCSE courses...' : 'Search A-Level courses...'}
                  />
                  <p className="text-xs text-neutral-500 mt-3 font-medium">
                    This helps Newton tailor its teaching to your exact syllabus.
                  </p>
                </div>
              )}

              <div className="mt-8 pt-8 border-t border-white/[0.06]">
                <label className="text-sm font-bold text-neutral-100 block mb-4">Preferences</label>
                <div
                  className="flex items-center justify-between p-4 bg-white/[0.04] border border-white/[0.06] rounded-2xl cursor-pointer hover:bg-white/[0.06] transition-colors"
                  onClick={() => setShowLinkRecommendations(!showLinkRecommendations)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/15 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-100">Link Recommendations</p>
                      <p className="text-xs text-neutral-500">Show helpful learning resources after each response</p>
                    </div>
                  </div>
                  <div className={`w-12 h-7 rounded-full transition-colors duration-200 ${showLinkRecommendations ? 'bg-blue-500' : 'bg-white/[0.1]'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 mt-1 ${showLinkRecommendations ? 'translate-x-6' : 'translate-x-1'}`} />
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => {
                    setShowSettings(false);
                    startTutorial();
                  }}
                  className="w-full px-5 py-4 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-xl font-semibold transition-colors duration-200 flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Retake Tutorial
                </button>
              </div>

              {currentUserEmail && (
                <div className="mt-4 pt-4 border-t border-white/[0.06]">
                  <button
                    onClick={() => {
                      localStorage.removeItem('newton-auth-token');
                      setCurrentUserEmail(null);
                      window.location.href = '/';
                    }}
                    className="w-full px-5 py-4 bg-red-500/15 border border-red-500/20 hover:bg-red-500/25 text-red-400 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
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
              <div className="bg-neutral-900/95 backdrop-blur-xl border border-white/[0.1] rounded-3xl shadow-2xl max-w-2xl w-full p-12 text-center animate-scaleIn">
                <div className="w-24 h-24 mx-auto bg-white rounded-3xl flex items-center justify-center mb-8">
                  <span className="text-4xl font-bold text-black">N</span>
                </div>
                <h2 className="text-4xl font-extrabold text-neutral-100 mb-4">Welcome to Newton!</h2>
                <p className="text-xl text-neutral-400 mb-8 leading-relaxed">
                  Let's take a quick tour. This will only take a minute!
                </p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={skipTutorial}
                    className="px-6 py-3 bg-white/[0.06] text-neutral-300 rounded-xl font-semibold hover:bg-white/[0.1] transition-all"
                  >
                    Skip Tour
                  </button>
                  <button
                    onClick={nextTutorialStep}
                    className="px-8 py-3 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-xl font-semibold transition-colors duration-200"
                  >
                    Start Tour →
                  </button>
                </div>
              </div>
            </div>
          )}

          {tutorialStep === 1 && (
  <div
    className="absolute bg-neutral-900/95 backdrop-blur-xl border border-white/[0.1] rounded-2xl p-6 shadow-2xl max-w-sm animate-slideIn pointer-events-auto"
    style={{
      top: '285px',
      left: sidebarOpen ? '300px' : '50px',
      zIndex: 102
    }}
            >
              <div className="absolute -top-3 -left-3 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                1
              </div>
              <h3 className="text-xl font-bold text-neutral-100 mb-2">New Conversations</h3>
              <p className="text-neutral-400 mb-4">
                Click "New conversation" to start a fresh chat. Each is automatically saved by subject!
              </p>
              <div className="flex gap-3 justify-end">
                <button onClick={skipTutorial} className="text-sm text-neutral-500 hover:text-neutral-300">
                  Skip
                </button>
                <button
                  onClick={nextTutorialStep}
                  className="px-4 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-lg font-semibold transition-colors duration-200"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {tutorialStep === 2 && (
  <div
    className="absolute bg-neutral-900/95 backdrop-blur-xl border border-white/[0.1] rounded-2xl p-6 shadow-2xl max-w-sm animate-slideIn pointer-events-auto"
    style={{
      top: '315px',
      left: sidebarOpen ? '265px' : '50px',
      zIndex: 102
    }}
            >
              <div className="absolute -top-3 -left-3 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                2
              </div>
              <h3 className="text-xl font-bold text-neutral-100 mb-2">Organize by Subject</h3>
              <p className="text-neutral-400 mb-4">
                Your chats are organized by subject. Switch between subjects to see all conversations about each topic!
              </p>
              <div className="flex gap-3 justify-end">
                <button onClick={skipTutorial} className="text-sm text-neutral-500 hover:text-neutral-300">
                  Skip
                </button>
                <button
                  onClick={nextTutorialStep}
                  className="px-4 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-lg font-semibold transition-colors duration-200"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {tutorialStep === 3 && (
            <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-auto" style={{ zIndex: 102 }}>
              <div className="bg-neutral-900/95 backdrop-blur-xl border border-white/[0.1] rounded-3xl shadow-2xl max-w-3xl w-full p-10 animate-scaleIn">
                <div className="absolute -top-3 -left-3 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                  3
                </div>
                <h3 className="text-2xl font-bold text-neutral-100 mb-6">How Newton Helps You Learn</h3>

                <div className="bg-white/[0.04] rounded-2xl p-6 mb-6">
                  <div className="flex gap-4 mb-4">
                    <div className="w-10 h-10 bg-neutral-400 rounded-xl flex items-center justify-center flex-shrink-0">
      <span className="text-xs font-bold text-white">You</span>
    </div>
                    <div className="flex-1 bg-white/[0.06] rounded-xl p-4 shadow-sm">
                      <p className="text-neutral-100">What's the answer to 2x + 5 = 15?</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-[#0071e3] rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-white">N</span>
                    </div>
                    <div className="flex-1 bg-blue-500/10 rounded-xl p-4 border-2 border-blue-500/20">
                      <p className="text-neutral-100 mb-3">Great question! Let's work through this together. First, what do you think we should do to get x by itself?</p>
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
    <p className="font-semibold text-neutral-100 mb-1">Newton Will:</p>
    <ul className="text-sm text-neutral-300 space-y-1">
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
    <p className="font-semibold text-neutral-100 mb-1">Newton Won't:</p>
    <ul className="text-sm text-neutral-300 space-y-1">
      <li>• Do your homework</li>
      <li>• Give direct answers</li>
      <li>• Write your essays</li>
    </ul>
  </div>
</div>

                <div className="flex gap-3 justify-end">
                  <button onClick={skipTutorial} className="text-sm text-neutral-500 hover:text-neutral-300">
                    Skip
                  </button>
                  <button
                    onClick={nextTutorialStep}
                    className="px-6 py-3 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-xl font-semibold transition-colors duration-200"
                  >
                    Next →
                  </button>
                </div>
              </div>
            </div>
          )}

          {tutorialStep === 4 && (
            <div
              className="absolute bg-neutral-900/95 backdrop-blur-xl border border-white/[0.1] rounded-2xl p-6 shadow-2xl max-w-sm animate-slideIn pointer-events-auto"
              style={{
                top: '80px',
                right: '50px',
                zIndex: 102
              }}
            >
              <div className="absolute -top-3 -left-3 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                4
              </div>
              <h3 className="text-xl font-bold text-neutral-100 mb-2">Report Issues</h3>
              <p className="text-neutral-400 mb-4">
                Encounter a bug? Click "Report Issue" to let us know and we'll fix it right away!
              </p>
              <div className="flex gap-3 justify-end">
                <button onClick={skipTutorial} className="text-sm text-neutral-500 hover:text-neutral-300">
                  Skip
                </button>
                <button
                  onClick={nextTutorialStep}
                  className="px-4 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-lg font-semibold transition-colors duration-200"
                >
                  {currentUserEmail ? 'Next →' : 'Finish! 🚀'}
                </button>
              </div>
            </div>
          )}

          {tutorialStep === 5 && currentUserEmail && (
  <div
    className="absolute bg-neutral-900/95 backdrop-blur-xl border border-white/[0.1] rounded-2xl p-6 shadow-2xl max-w-sm animate-slideIn pointer-events-auto"
    style={{
      top: '230px',
      left: sidebarOpen ? '300px' : '50px',
      zIndex: 102
    }}
            >
              <div className="absolute -top-3 -left-3 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                5
              </div>
              <h3 className="text-xl font-bold text-neutral-100 mb-2">Your Dashboard</h3>
              <p className="text-neutral-400 mb-4">
                Visit your Dashboard to see learning progress and analytics. Let's check it out!
              </p>
              <div className="flex gap-3 justify-end">
                <button onClick={skipTutorial} className="text-sm text-neutral-500 hover:text-neutral-300">
                  Skip
                </button>
                <button
                  onClick={() => {
                    window.location.href = '/dashboard?tutorial=true';
                  }}
                  className="px-4 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-lg font-semibold transition-colors duration-200"
                >
                  Visit Dashboard →
                </button>
              </div>
            </div>
          )}

          {tutorialStep === 6 && (
            <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-auto" style={{ zIndex: 102 }}>
              <div className="bg-neutral-900/95 backdrop-blur-xl border border-white/[0.1] rounded-3xl shadow-2xl max-w-2xl w-full p-10 text-center animate-scaleIn">
                <div className="w-20 h-20 mx-auto bg-emerald-500 rounded-3xl flex items-center justify-center mb-6">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-3xl font-bold text-neutral-100 mb-4">You're All Set!</h3>
                <p className="text-xl text-neutral-400 mb-8">
                  Ready to start learning? Ask Newton your first question!
                </p>
                <button
                  onClick={closeTutorial}
                  className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-colors duration-200 text-lg"
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
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-fadeIn"
          onClick={() => setShowReportIssue(false)}
        >
          <div
            className="bg-neutral-900/95 backdrop-blur-2xl border border-white/[0.1] rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
            style={{
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 8px 24px rgba(0, 0, 0, 0.3)'
            }}
          >
            <div className="p-10">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-extrabold text-neutral-100 tracking-tight">Report Issue</h2>
                <button
                  onClick={() => {
                    setShowReportIssue(false);
                    setScreenshot(null);
                  }}
                  className="p-3 hover:bg-white/[0.06] rounded-2xl transition-all duration-250 hover:scale-105 active:scale-95"
                >
                  <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-bold text-neutral-100 block mb-4">
                    Describe the issue you encountered
                  </label>
                  <textarea
                    value={reportIssueText}
                    onChange={(e) => setReportIssueText(e.target.value)}
                    placeholder="Please describe what happened, what you expected, and any steps to reproduce the issue..."
                    rows={6}
                    className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all text-neutral-100 placeholder:text-neutral-500"
                  />
                </div>

                <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <input
                    type="checkbox"
                    id="includeChat"
                    checked={includeChat}
                    onChange={(e) => setIncludeChat(e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="includeChat" className="text-sm font-semibold text-neutral-100 cursor-pointer flex-1">
                    Include current chat conversation (helps us debug faster)
                  </label>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-bold text-neutral-100 block">
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
                      className="w-full px-4 py-3 bg-white/[0.04] hover:bg-white/[0.08] border-2 border-dashed border-white/[0.1] rounded-xl font-semibold text-neutral-300 transition-all flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Capture Screenshot
                    </button>
                  ) : (
                    <div className="relative p-4 bg-emerald-500/10 border-2 border-emerald-500/20 rounded-xl">
                      <div className="flex items-center gap-3">
                        <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm font-semibold text-emerald-300">Screenshot captured</span>
                        <button
                          onClick={() => setScreenshot(null)}
                          className="ml-auto text-sm text-red-400 hover:text-red-300 font-semibold"
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
                    className="flex-1 px-6 py-3 bg-white/[0.06] text-neutral-300 rounded-xl font-semibold hover:bg-white/[0.1] transition-all duration-250"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReportIssue}
                    disabled={reportIssueSubmitting || !reportIssueText.trim()}
                    className="flex-1 px-6 py-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl font-semibold hover:bg-red-500/30 hover:shadow-lg transition-all duration-250 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {reportIssueSubmitting ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Understanding Rating Modal */}
      {showRatingModal && currentTopic && (
        <UnderstandingRatingModal
          topicName={currentTopic.topic}
          topicId={currentTopic.id}
          messageCount={topicMessageCount}
          classId={currentClass?.id}
          onClose={() => setShowRatingModal(false)}
          onSubmit={(data) => {
            console.log('Rating submitted:', data);
          }}
        />
      )}



      {/* Apple drop animation (global, not scoped) */}
      <style dangerouslySetInnerHTML={{ __html: `
        .newton-apple-drop {
          animation: newton-apple-gravity 0.6s cubic-bezier(0.33, 0, 0.67, 0.33) forwards;
        }
        @keyframes newton-apple-gravity {
          0% { transform: translateY(-80px); opacity: 0; }
          30% { opacity: 1; }
          70% { transform: translateY(5px); }
          85% { transform: translateY(-8px); }
          95% { transform: translateY(2px); }
          100% { transform: translateY(0); }
        }
        .tree-scene-fade {
          animation: tree-fade-out 0.8s ease-out forwards;
          pointer-events: none;
        }
        @keyframes tree-fade-out {
          0% { opacity: 1; }
          70% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}} />
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

// Wrapper component with Suspense boundary for useSearchParams
export default function Newton() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-neutral-200 border-t-neutral-800 rounded-full animate-spin"></div>
          <p className="text-neutral-500 text-sm">Loading Newton...</p>
        </div>
      </div>
    }>
      <NewtonContent />
    </Suspense>
  );
}