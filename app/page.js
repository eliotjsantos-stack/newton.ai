'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

function fixMathNotation(text) {
  // Fix display math: [ equation ] → $$equation$$
  text = text.replace(/\[\s*([^\]]+)\s*\]/g, '$$$$1$$');
  
  // Fix lists of variables: ( a, b, ) and ( c ) → $a, b,$ and $c$
  text = text.replace(/\(\s*([a-zA-Z]\s*,\s*[a-zA-Z]\s*,?\s*)\)/g, '$$1$');
  
  // Fix ALL single letter/variable in parentheses: (x), (a), (b), (c)
  text = text.replace(/\(\s*([a-zA-Z])\s*\)/g, '$$1$');
  
  // Fix math comparisons: (a > 0), (a < 0), (a = 0), (a ≠ 0)
  text = text.replace(/\(\s*([a-zA-Z])\s*([<>=≠∈]+)\s*([0-9a-zA-Z]+)\s*\)/g, '$$$1 $2 $3$$');
  
  // Fix expressions with operators: (x - p), (2a), (ac)
  text = text.replace(/\(([a-zA-Z0-9]{1,3})\)/g, '$$1$');
  
  // Fix any parentheses containing math operators: ^, +, -, *, /, =
  text = text.replace(/\(([^)]*[\^\+\-\*\/=_][^)]*)\)/g, (match, content) => {
    // Don't convert if it looks like a normal sentence
    if (content.length > 30 || content.includes(' the ') || content.includes(' a ') || content.includes(' is ')) {
      return match;
    }
    return `$${content}$`;
  });
  
  // Fix fractions and complex expressions with \frac, \sqrt, etc
  text = text.replace(/\(([^)]*\\[a-z]+[^)]*)\)/g, '$$1$');
  
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
          // Apply math notation fix
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
                components={{
                a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" />
          }}
                 linkTarget="_blank"
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
}// Force redeploy Wed 15 Oct 2025 19:48:38 BST
