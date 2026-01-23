'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import Link from 'next/link';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAndLoadUsers();
  }, []);

  const checkAdminAndLoadUsers = async () => {
    const token = localStorage.getItem('newton-auth-token');
    
    if (!token) {
      window.location.href = '/login';
      return;
    }

    try {
      // Check if current user is admin
      const meResponse = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const meData = await meResponse.json();
      
      if (!meData.isAdmin) {
        alert('Access denied. Admin only.');
        window.location.href = '/chat';
        return;
      }
      
      setIsAdmin(true);

      // Load all users
      const usersResponse = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const usersData = await usersResponse.json();
      setUsers(usersData.users || []);
      
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to load admin dashboard');
      window.location.href = '/chat';
    } finally {
      setLoading(false);
    }
  };

  const selectUser = (user) => {
    setSelectedUser(user);
    setSelectedSubject(null);
    setSelectedChat(null);
  };

  const selectSubject = (subject) => {
    setSelectedSubject(subject);
    setSelectedChat(null);
  };

  const selectChat = (chat) => {
    setSelectedChat(chat);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-100">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-2xl flex items-center justify-center shadow-2xl mb-4 mx-auto animate-pulse">
            <span className="text-2xl font-bold text-white">A</span>
          </div>
          <p className="text-neutral-600 font-medium">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="flex h-screen bg-neutral-100">
      {/* Users Sidebar */}
      <div className="w-80 bg-white border-r border-neutral-200 flex flex-col">
        <div className="p-6 border-b border-neutral-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-neutral-900">Admin Panel</h1>
            <Link 
              href="/chat"
              className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              Back to Chat
            </Link>
          </div>
          <p className="text-sm text-neutral-600">{users.length} total users</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {users.map(user => (
            <div
              key={user.id}
              onClick={() => selectUser(user)}
              className={`p-4 rounded-xl mb-2 cursor-pointer transition-all ${
  selectedUser?.id === user.id
    ? 'bg-neutral-800 text-white'
    : 'bg-white hover:bg-neutral-50 border border-neutral-200'
}`}
            >
              <div className="flex items-center justify-between mb-1">
                <p className={`font-semibold truncate ${selectedUser?.id === user.id ? 'text-white' : 'text-neutral-900'}`}>{user.email}</p>
                {user.is_admin && (
                  <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full font-bold">
                    ADMIN
                  </span>
                )}
              </div>
              <p className={`text-sm ${selectedUser?.id === user.id ? 'text-neutral-300' : 'text-neutral-700 font-medium'}`}>
                {user.year_group} • {new Date(user.created_at).toLocaleDateString()}
              </p>
              {user.chat_data?.chatsBySubject && (
                <p className={`text-xs mt-1 ${selectedUser?.id === user.id ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  {Object.keys(user.chat_data.chatsBySubject).length} subjects
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Subjects List */}
      {selectedUser && (
        <div className="w-72 bg-white border-r border-neutral-200 flex flex-col">
          <div className="p-6 border-b border-neutral-200">
            <h2 className="text-xl font-bold text-neutral-900 mb-1">{selectedUser.email}</h2>
            <p className="text-sm text-neutral-600">Select a subject to view chats</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {selectedUser.chat_data?.chatsBySubject ? (
              Object.entries(selectedUser.chat_data.chatsBySubject).map(([subject, chats]) => (
                <div
                  key={subject}
                  onClick={() => selectSubject(subject)}
                  className={`p-4 rounded-xl mb-2 cursor-pointer transition-all ${
  selectedSubject === subject
    ? 'bg-neutral-800 text-white'
    : 'bg-white hover:bg-neutral-50 border border-neutral-200'
}`}
                >
                  <p className={`font-semibold mb-1 ${selectedSubject === subject ? 'text-white' : 'text-neutral-900'}`}>{subject}</p>
                  <p className={`text-sm ${selectedSubject === subject ? 'text-neutral-300' : 'text-neutral-700 font-medium'}`}>
                    {chats.filter(c => c.messages?.length > 0).length} conversations
                  </p>
                </div>
              ))
            ) : (
              <p className="text-neutral-500 text-sm text-center mt-8">No chat data yet</p>
            )}
          </div>
        </div>
      )}

      {/* Chats List */}
      {selectedUser && selectedSubject && (
        <div className="w-80 bg-white border-r border-neutral-200 flex flex-col">
          <div className="p-6 border-b border-neutral-200">
            <h3 className="text-lg font-bold text-neutral-900 mb-1">{selectedSubject}</h3>
            <p className="text-sm text-neutral-600">Select a conversation</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {selectedUser.chat_data.chatsBySubject[selectedSubject]
              .filter(chat => chat.messages?.length > 0)
              .map(chat => (
                <div
                  key={chat.id}
                  onClick={() => selectChat(chat)}
                  className={`p-4 rounded-xl mb-2 cursor-pointer transition-all ${
  selectedChat?.id === chat.id
    ? 'bg-neutral-800 text-white'
    : 'bg-white hover:bg-neutral-50 border border-neutral-200'
}`}
                >
                  <p className={`text-sm mb-1 line-clamp-2 ${
                    selectedChat?.id === chat.id ? 'text-neutral-100' : 'text-neutral-700'
                  }`}>
                    {chat.messages[0]?.content?.substring(0, 60)}...
                  </p>
                  <p className={`text-xs ${selectedChat?.id === chat.id ? 'text-neutral-400' : 'text-neutral-600'}`}>
                    {chat.messages.length} messages • {new Date(chat.date).toLocaleDateString()}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}
{/* Chat Viewer */}
      <div className="flex-1 flex flex-col bg-neutral-50">
        {selectedChat ? (
          <>
            <div className="p-6 bg-white border-b border-neutral-200">
              <h3 className="text-lg font-bold text-neutral-900">
                {selectedUser.email} - {selectedSubject}
              </h3>
              <p className="text-sm text-neutral-600">
                {selectedChat.messages.length} messages • {new Date(selectedChat.date).toLocaleString()}
              </p>
              <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  <strong>Read-only mode:</strong> You're viewing this conversation as an admin. You cannot send messages.
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto space-y-4">
                {selectedChat.messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
  className={`max-w-[80%] rounded-2xl p-4 overflow-hidden ${
    message.role === 'user'
      ? 'bg-neutral-900 text-white'
      : 'bg-white border border-neutral-300 text-neutral-900'
  }`}
>
  <div className="prose prose-sm prose-neutral max-w-none overflow-x-auto [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 [&_li]:my-1 [&_p]:my-2 [&_h1]:text-lg [&_h1]:font-bold [&_h1]:my-3 [&_h2]:text-base [&_h2]:font-bold [&_h2]:my-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:my-2">
    <ReactMarkdown
      remarkPlugins={[remarkMath, remarkGfm]}
      rehypePlugins={[rehypeKatex]}
      components={{
        code: ({ node, inline, className, children, ...props }) => {
  return inline ? (
    <code className="bg-neutral-100 text-pink-600 px-1.5 py-0.5 rounded font-mono text-sm" {...props}>
      {children}
    </code>
  ) : (
    <pre className="bg-neutral-50 border border-neutral-200 p-4 rounded-lg overflow-x-auto my-3">
      <code className="text-sm font-mono text-neutral-800 block whitespace-pre-wrap leading-relaxed" {...props}>
        {children}
      </code>
    </pre>
  );
},
        p: ({ children }) => <p className="my-2 leading-relaxed">{children}</p>,
        ul: ({ children }) => <ul className="list-disc ml-6 my-2 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal ml-6 my-2 space-y-1">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        h1: ({ children }) => <h1 className="text-lg font-bold my-3">{children}</h1>,
        h2: ({ children }) => <h2 className="text-base font-bold my-2">{children}</h2>,
        h3: ({ children }) => <h3 className="text-sm font-semibold my-2">{children}</h3>,
      }}
    >
      {message.content}
    </ReactMarkdown>
  </div>
</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-neutral-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="font-medium">Select a conversation to view</p>
              <p className="text-sm mt-1">Choose a user, subject, and chat from the left</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}