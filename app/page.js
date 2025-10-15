'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

function fixMathNotation(text) {
  // Fix display math: [ equation ] → $$equation$$
  text = text.replace(/\[\s*([^\]]+)\s*\]/g, '$$$$1$$');
  
  // Fix inline math with backslashes: \( equation \) → $equation$
  text = text.replace(/\\\(\s*([^)]+)\s*\\\)/g, '$$1$');
  
  // Fix inline variables in parentheses: (x), (a), (b) etc → $x$, $a$, $b$
  // Only convert if it's a single letter/simple expression
  text = text.replace(/\(([a-zA-Z])\)/g, '$$$1$$');
  text = text.replace(/\(([a-zA-Z]\s*[<>=≠]\s*\d+)\)/g, '$$$1$$');
  text = text.replace(/\(([a-zA-Z]\s*\\[a-z]+\s*\d+)\)/g, '$$$1$$');
  
  // Fix complex inline expressions like (x^2 - 5x + 6 = 0)
  text = text.replace(/\(([a-zA-Z0-9\s\+\-\*\/\^=]+)\)/g, (match, expr) => {
    // Only convert if it contains math operators
    if (expr.match(/[\+\-\*\/\^=]/)) {
      return `$${expr}$`;
    }
    return match; // Leave normal parentheses alone
  });
  
  // Fix expressions like (b^2 - 4ac)
  text = text.replace(/\(([a-zA-Z0-9\^\s\+\-\*]+)\)/g, (match, expr) => {
    if (expr.match(/\^/)) {
      return `$${expr}$`;
    }
    return match;
  });
  
  return text;
}

export default function Newton() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
          // Apply math notation fix before displaying
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
    <div className="min-h-screen bg-white flex flex-col">
      <div className="text-center py-12 px-4">
        <h1 className="text-5xl font-semibold text-gray-900 mb-2 tracking-tight">
          Newton
        </h1>
        <p className="text-lg text-gray-500">
          AI Learning Assistant for Students
        </p>
      </div>

      <div className="flex-1 max-w-3xl w-full mx-auto px-4 pb-32">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            Start a conversation to begin learning...
          </div>
        ) : (
          <div className="space-y-6">
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
                    remarkPlugins={[remarkMath]} 
                    rehypePlugins={[rehypeKatex]}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.content === '' && (
              <div className="text-gray-400">Thinking...</div>
            )}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="flex gap-3 items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Newton for help with your learning..."
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
  );
}