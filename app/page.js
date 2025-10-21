'use client';

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';

function fixMathNotation(text) {
  // Don't process anything that's already inside $ or $$ delimiters
  const parts = text.split(/(\$\$[^$]+\$\$|\$[^$]+\$)/);
  
  return parts.map((part, index) => {
    // If this part is already math notation (odd indices), return as-is
    if (index % 2 === 1) return part;
    
    // Only process non-math text parts
    // Fix single letter variables in text: (a), (b), (c)
    part = part.replace(/\(([a-zA-Z])\)/g, '$$$1$$');
    
    // Fix display math brackets: [ equation ]
    part = part.replace(/\[\s*([^\]]+)\s*\]/g, '$$$$$$1$$$$');
    
    return part;
  }).join('');
}

export default function Newton() {
  // Default subjects
  const defaultSubjects = ['General', 'Maths', 'Science', 'English', 'History', 'Languages'];

  const [currentSubject, setCurrentSubject] = useState('General');
  const [subjects, setSubjects] = useState(defaultSubjects);
  const [chatsBySubject, setChatsBySubject] = useState(
    defaultSubjects.reduce((acc, subject) => {
      acc[subject] = [];
      return acc;
    }, {})
  );
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [openMenuSubject, setOpenMenuSubject] = useState(null);
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatsBySubject[currentSubject]]);

  // Get current subject's messages
  const messages = chatsBySubject[currentSubject] || [];
  const setMessages = (newMessages) => {
    setChatsBySubject(prev => ({
      ...prev,
      [currentSubject]: typeof newMessages === 'function' 
        ? newMessages(prev[currentSubject] || []) 
        : newMessages
    }));
  };

  // Add new subject
  const addSubject = () => {
    const newSubjectName = prompt('Enter new subject name:');
    if (newSubjectName && !subjects.includes(newSubjectName)) {
      setSubjects([...subjects, newSubjectName]);
      setChatsBySubject(prev => ({...prev, [newSubjectName]: []}));
      setCurrentSubject(newSubjectName);
    }
  };

  // Rename subject
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
    }
    setOpenMenuSubject(null);
  };

  // Delete subject
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
      if (currentSubject === subjectName) setCurrentSubject(subjects[0]);
    }
    setOpenMenuSubject(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
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
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Subjects</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {subjects.map((subject) => (
            <div
              key={subject}
              className={`group relative flex items-center justify-between p-3 mb-1 rounded-lg transition ${
                currentSubject === subject
                  ? 'bg-gray-900 text-white'
                  : 'hover:bg-gray-200 text-gray-700'
              }`}
            >
              <button
                onClick={() => setCurrentSubject(subject)}
                className="flex-1 text-left"
              >
                {subject}
                {chatsBySubject[subject]?.length > 0 && (
                  <span className="ml-2 text-xs opacity-70">
                    ({chatsBySubject[subject].length})
                  </span>
                )}
              </button>
              
              {/* Three dots menu */}
              <div className="relative">
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
                
                {/* Dropdown menu */}
                {openMenuSubject === subject && (
                  <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
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

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col" onClick={() => setOpenMenuSubject(null)}>
        <div className="text-center py-8 px-4 border-b border-gray-200">
          <h1 className="text-4xl font-semibold text-gray-900 mb-1">
            Newton
          </h1>
          <p className="text-sm text-gray-500">
            {currentSubject} • AI Learning Assistant
          </p>
        </div>

        <div className="flex-1 max-w-4xl w-full mx-auto px-4 pb-32 overflow-y-auto">
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
                    <ReactMarkdown 
                      remarkPlugins={[remarkMath, remarkGfm]} 
                      rehypePlugins={[rehypeKatex]}
                      components={{
                        a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" />
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
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

        <div className="fixed bottom-0 right-0 left-64 bg-white border-t border-gray-200 p-4">
          <div className="max-w-4xl mx-auto">
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