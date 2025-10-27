'use client';

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';



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
  if (messages.length === 0) return 'New Chat';
  const firstUserMessage = messages.find(m => m.role === 'user');
  if (!firstUserMessage) return 'New Chat';
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
  const [openMenuSubject, setOpenMenuSubject] = useState(null);
  const [openChatMenu, setOpenChatMenu] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [suggestedSubject, setSuggestedSubject] = useState(null);
  const [dismissedSuggestion, setDismissedSuggestion] = useState(false);
  const [mounted, setMounted] = useState(false); 

  const messagesEndRef = useRef(null);
useEffect(() => {
  setMounted(true);
}, []);
useEffect(() => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('newton-current-chat-id');
  }
}, []);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('newton-current-subject', currentSubject);
    }
  }, [currentSubject]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('newton-subjects', JSON.stringify(subjects));
    }
  }, [subjects]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('newton-chats', JSON.stringify(chatsBySubject));
    }
  }, [chatsBySubject]);

//  useEffect(() => {
//   if (typeof window !== 'undefined') {
//      localStorage.setItem('newton-current-chat-id', currentChatId);
//    }
//  }, [currentChatId]);

  useEffect(() => {
    if (input.trim().length > 10) {
      const detected = detectSubject(input);
      if (detected && detected !== currentSubject && !dismissedSuggestion) {
        setSuggestedSubject(detected);
      } else {
        setSuggestedSubject(null);
      }
    } else {
      setSuggestedSubject(null);
    }
  }, [input, currentSubject, dismissedSuggestion]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const currentChat = currentChatId ? chatsBySubject[currentSubject]?.find(chat => chat.id === currentChatId) : null;
const messages = currentChat?.messages || [];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const setMessages = (newMessages) => {
    setChatsBySubject(prev => ({
      ...prev,
      [currentSubject]: prev[currentSubject].map(chat =>
        chat.id === currentChatId
          ? {
              ...chat,
              messages: typeof newMessages === 'function' ? newMessages(chat.messages) : newMessages,
              date: new Date().toISOString()
            }
          : chat
      )
    }));
  };

  const createNewChat = () => {
    const newChatId = Date.now().toString();
    setChatsBySubject(prev => ({
      ...prev,
      [currentSubject]: [
        { id: newChatId, messages: [], date: new Date().toISOString() },
        ...prev[currentSubject]
      ]
    }));
    setCurrentChatId(newChatId);
  };

  const deleteChat = (chatId) => {
  const chats = chatsBySubject[currentSubject];
  
  if (chats.length === 1) {
    // If it's the last chat, just clear it instead of deleting
    if (confirm('Clear this chat?')) {
      setChatsBySubject(prev => ({
        ...prev,
        [currentSubject]: [{
          id: chatId,
          messages: [],
          date: new Date().toISOString()
        }]
      }));
    }
  } else {
    // If there are multiple chats, delete normally
    if (confirm('Delete this chat?')) {
      setChatsBySubject(prev => ({
        ...prev,
        [currentSubject]: prev[currentSubject].filter(chat => chat.id !== chatId)
      }));
      if (currentChatId === chatId) {
        const remainingChats = chats.filter(chat => chat.id !== chatId);
        setCurrentChatId(remainingChats[0].id);
      }
    }
  }
  setOpenChatMenu(null);
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

  const renameSubject = (oldName) => {
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
    setOpenMenuSubject(null);
  };

  const deleteSubject = (subjectName) => {
    if (subjects.length === 1) {
      alert('Cannot delete the last subject!');
      return;
    }
    if (confirm(`Delete "${subjectName}" and all its chats?`)) {
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
    }
    setOpenMenuSubject(null);
  };

  const toggleSubject = (subject) => {
    if (expandedSubject === subject) {
      setExpandedSubject(null);
    } else {
      setExpandedSubject(subject);
      setCurrentSubject(subject);
      const firstChat = chatsBySubject[subject]?.[0];
      if (firstChat) setCurrentChatId(firstChat.id);
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  
  const trimmedInput = input.trim();
  console.log('Submit clicked, input:', trimmedInput);
  
  if (!trimmedInput || isLoading) {
    console.log('Blocked: empty or loading');
    return;
  }

  setDismissedSuggestion(false);
  setSuggestedSubject(null);

  // If no chat selected, create new one
  if (!currentChatId) {
    console.log('Creating new chat');
    // ...
  }

  const userMessage = { role: 'user', content: trimmedInput };
  console.log('Adding user message:', userMessage);
  setMessages(prev => [...prev, userMessage]);
  setInput('');
  setIsLoading(true);

  try {
    console.log('Fetching API...');
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        assistantMessage += chunk;
        
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content = fixMathNotation(assistantMessage);
          return newMessages;
        });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  }
if (!mounted) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-gray-400">Loading...</div>
    </div>
  );
}


  return (
    <div className="min-h-screen bg-white flex">
      {sidebarOpen && (
        <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col fixed left-0 top-0 bottom-0 z-10">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Subjects</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 hover:bg-gray-200 rounded"
              title="Close sidebar"
            >
              ✕
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            {subjects.map((subject) => (
              <div key={subject} className="mb-1">
                <div
                  className={`group relative flex items-center justify-between p-3 rounded-lg transition ${
                    currentSubject === subject
                      ? 'bg-gray-900 text-white'
                      : 'hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <button
                    onClick={() => toggleSubject(subject)}
                    className="flex-1 text-left flex items-center gap-2"
                  >
                    <span className="text-sm">{expandedSubject === subject ? '▼' : '▶'}</span>
                    {subject}
                    <span className="ml-2 text-xs opacity-70">
                      ({chatsBySubject[subject]?.length || 0})
                    </span>
                  </button>
                  
                  <div className="relative flex gap-1">
                    {expandedSubject === subject && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          createNewChat();
                        }}
                        className="p-1 px-2 rounded hover:bg-gray-700 text-sm"
                        title="New chat"
                      >
                        +
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuSubject(openMenuSubject === subject ? null : subject);
                      }}
                      className={`p-1 px-2 rounded hover:bg-gray-300 text-lg ${
                        currentSubject === subject ? 'text-white hover:bg-gray-700' : 'text-gray-600'
                      }`}
                    >
                      ⋯
                    </button>
                  </div>
                  
                  {openMenuSubject === subject && (
                    <div className="absolute right-0 top-12 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          renameSubject(subject);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 text-sm rounded-t-lg"
                      >
                        Rename
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSubject(subject);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 text-sm rounded-b-lg"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                {expandedSubject === subject && (
                  <div className="ml-4 mt-1 space-y-1">
                    {chatsBySubject[subject]?.map((chat) => (
                      <div
                        key={chat.id}
                        className={`group relative p-2 rounded-lg transition cursor-pointer text-sm ${
                          currentChatId === chat.id
                            ? 'bg-gray-300 text-gray-900'
                            : 'hover:bg-gray-200 text-gray-600'
                        }`}
                        onClick={() => {
                          setCurrentSubject(subject);
                          setCurrentChatId(chat.id);
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate" suppressHydrationWarning>
                              {typeof window !== 'undefined' ? generateChatTitle(chat.messages) : 'Chat'}
                            </p>
                            <p className="text-xs opacity-70 mt-1" suppressHydrationWarning>
  {new Date(chat.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
</p>
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenChatMenu(openChatMenu === chat.id ? null : chat.id);
                            }}
                            className="p-1 rounded hover:bg-gray-400 text-sm ml-2"
                          >
                            ⋯
                          </button>
                        </div>

                        {openChatMenu === chat.id && (
                          <div className="absolute right-2 top-10 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[100px]">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteChat(chat.id);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 text-sm rounded-lg"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="p-2 border-t border-gray-200">
            <button
              onClick={addSubject}
              className="w-full p-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
            >
              + Add Subject
            </button>
          </div>
        </div>
      )}

      <div className={`flex-1 flex flex-col ${sidebarOpen ? 'ml-80' : 'ml-0'} transition-all`} onClick={() => { setOpenMenuSubject(null); setOpenChatMenu(null); }}>
        <div className="text-center py-8 px-4 border-b border-gray-200 relative">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="absolute left-4 top-8 p-2 hover:bg-gray-100 rounded"
              title="Open sidebar"
            >
              ☰
            </button>
          )}
          <h1 className="text-4xl font-semibold text-gray-900 mb-1">
            Newton
          </h1>
          <p className="text-sm text-gray-500">
            {currentSubject} • AI Learning Assistant
          </p>
        </div>

       <div className="flex-1 max-w-4xl w-full mx-auto px-4 pb-32 overflow-y-auto">
          <div suppressHydrationWarning>
            {messages.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                Start a conversation about {currentSubject}...
              </div>
            ) : (
              <div className="space-y-6 py-6">
                {messages.map((message, i) => (
                  <div
                    key={i}
                    className={`p-5 rounded-2xl border ${
                      message.role === 'user'
                        ? 'bg-gray-50 border-gray-200'
                        : 'bg-white border-gray-200 shadow-sm'
                    }`}
                  >
                    <div className="text-gray-900 leading-relaxed prose prose-sm max-w-none prose-headings:font-semibold prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-1">
  {(() => {
    const content = message.content;
    const graphMatch = content.match(/<GRAPH>([\s\S]*?)<\/GRAPH>/);
    
    
    
    return (
      <ReactMarkdown 
        remarkPlugins={[remarkMath, remarkGfm]} 
        rehypePlugins={[rehypeKatex]}
        components={{
          a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" />
        }}
      >
        {content}
      </ReactMarkdown>
    );
  })()}
</div>
                  </div>
                ))}
                {isLoading && messages[messages.length - 1]?.content === '' && (
                  <div className="text-gray-400">Thinking...</div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        <div className={`fixed bottom-0 right-0 ${sidebarOpen ? 'left-80' : 'left-0'} bg-white border-t border-gray-200 p-4 transition-all`}>
          <div className="max-w-4xl mx-auto">
            {suggestedSubject && (
              <div className="mb-2">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💡</span>
                    <span className="text-sm text-gray-700">
                      This looks like a <strong>{suggestedSubject}</strong> question.
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setCurrentSubject(suggestedSubject);
                        setExpandedSubject(suggestedSubject);
                        const firstChat = chatsBySubject[suggestedSubject]?.[0];
                        if (firstChat) setCurrentChatId(firstChat.id);
                        setSuggestedSubject(null);
                      }}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      Switch to {suggestedSubject}
                    </button>
                    <button
                      onClick={() => {
                        setSuggestedSubject(null);
                        setDismissedSuggestion(true);
                      }}
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                    >
                      Stay in {currentSubject}
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="flex gap-3 items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Ask Newton about ${currentSubject}...`}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors font-medium"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}