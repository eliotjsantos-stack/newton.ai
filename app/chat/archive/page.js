'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

function generateChatTitle(messages, chatTitle) {
  if (chatTitle) return chatTitle;
  if (!messages || messages.length === 0) return 'Untitled chat';
  const firstUserMessage = messages.find(m => m.role === 'user');
  if (!firstUserMessage) return 'Untitled chat';
  const title = firstUserMessage.content.slice(0, 50);
  return title.length < firstUserMessage.content.length ? title + '...' : title;
}

export default function ArchivePage() {
  const [archivedChats, setArchivedChats] = useState({});
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('newton-archived-chats');
    if (saved) {
      try {
        setArchivedChats(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse archived chats:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('newton-archived-chats', JSON.stringify(archivedChats));
    }
  }, [archivedChats, mounted]);

  const restoreChat = (subject, chatId) => {
    const chatToRestore = archivedChats[subject]?.find(c => c.id === chatId);
    if (!chatToRestore) return;

    // Remove archivedAt property
    const { archivedAt, ...cleanChat } = chatToRestore;

    // Add back to active chats
    const activeChats = JSON.parse(localStorage.getItem('newton-chats') || '{}');
    activeChats[subject] = [cleanChat, ...(activeChats[subject] || [])];
    localStorage.setItem('newton-chats', JSON.stringify(activeChats));

    // Remove from archived
    setArchivedChats(prev => {
      const updated = { ...prev };
      updated[subject] = updated[subject].filter(c => c.id !== chatId);
      if (updated[subject].length === 0) {
        delete updated[subject];
      }
      return updated;
    });

    setSelectedChat(null);
  };

  const permanentlyDelete = (subject, chatId) => {
    if (!window.confirm('Permanently delete this chat? This cannot be undone.')) return;

    setArchivedChats(prev => {
      const updated = { ...prev };
      updated[subject] = updated[subject].filter(c => c.id !== chatId);
      if (updated[subject].length === 0) {
        delete updated[subject];
      }
      return updated;
    });

    setSelectedChat(null);
  };

  const subjects = Object.keys(archivedChats).filter(subj => archivedChats[subj]?.length > 0);
  const totalArchived = Object.values(archivedChats).flat().length;

  // Filter chats by search
  const getFilteredChats = (subject) => {
    const chats = archivedChats[subject] || [];
    if (!searchQuery.trim()) return chats;
    return chats.filter(chat => {
      const title = generateChatTitle(chat.messages, chat.title).toLowerCase();
      const content = chat.messages.map(m => m.content).join(' ').toLowerCase();
      return title.includes(searchQuery.toLowerCase()) || content.includes(searchQuery.toLowerCase());
    });
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/chat"
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Archived Chats</h1>
                <p className="text-sm text-gray-500">{totalArchived} archived conversation{totalArchived !== 1 ? 's' : ''}</p>
              </div>
            </div>

            {/* Search */}
            <div className="relative w-64">
              <input
                type="text"
                placeholder="Search archives..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 bg-gray-50 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-200 focus:bg-white transition-all placeholder:text-gray-400"
              />
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {totalArchived === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No archived chats</h2>
            <p className="text-gray-500 mb-6">Chats you archive will appear here</p>
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Chat
            </Link>
          </div>
        ) : (
          <div className="flex gap-8">
            {/* Sidebar - Subjects */}
            <div className="w-72 flex-shrink-0">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Subjects</h3>
                </div>
                <div className="p-2">
                  {subjects.map((subject) => {
                    const filteredChats = getFilteredChats(subject);
                    if (filteredChats.length === 0 && searchQuery) return null;

                    return (
                      <div key={subject} className="mb-1">
                        <button
                          onClick={() => setExpandedSubject(expandedSubject === subject ? null : subject)}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                            expandedSubject === subject
                              ? 'bg-gray-100'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <span className="font-medium text-gray-900">{subject}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                              {filteredChats.length}
                            </span>
                            <svg
                              className={`w-4 h-4 text-gray-400 transition-transform ${
                                expandedSubject === subject ? 'rotate-90' : ''
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </button>

                        {expandedSubject === subject && (
                          <div className="mt-1 ml-4 space-y-1">
                            {filteredChats.map((chat) => (
                              <button
                                key={chat.id}
                                onClick={() => setSelectedChat({ ...chat, subject })}
                                className={`w-full text-left px-4 py-2.5 rounded-lg transition-all text-sm ${
                                  selectedChat?.id === chat.id
                                    ? 'bg-amber-600 text-white'
                                    : 'hover:bg-gray-50 text-gray-700'
                                }`}
                              >
                                <div className="truncate font-medium">
                                  {generateChatTitle(chat.messages, chat.title)}
                                </div>
                                <div className={`text-xs mt-1 ${selectedChat?.id === chat.id ? 'text-amber-600' : 'text-gray-400'}`}>
                                  Archived {new Date(chat.archivedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Main Content - Chat Preview */}
            <div className="flex-1">
              {selectedChat ? (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  {/* Chat Header */}
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {selectedChat.subject}
                        </span>
                        <h2 className="text-lg font-semibold text-gray-900 mt-2">
                          {generateChatTitle(selectedChat.messages, selectedChat.title)}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                          {selectedChat.messages.length} messages &bull; Archived {new Date(selectedChat.archivedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="relative">
                        <button
                          onClick={() => setMenuOpen(!menuOpen)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>
                        {menuOpen && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-20">
                              <button
                                onClick={() => {
                                  restoreChat(selectedChat.subject, selectedChat.id);
                                  setMenuOpen(false);
                                }}
                                className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                              >
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Remove from Archive
                              </button>
                              <button
                                onClick={() => {
                                  permanentlyDelete(selectedChat.subject, selectedChat.id);
                                  setMenuOpen(false);
                                }}
                                className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
                    {selectedChat.messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-5 py-4 ${
                            message.role === 'user'
                              ? 'bg-gray-100 text-gray-900'
                              : 'bg-white border border-gray-200 text-gray-900'
                          }`}
                        >
                          <div className="prose prose-sm max-w-none">
                            <ReactMarkdown
                              remarkPlugins={[remarkMath, remarkGfm]}
                              rehypePlugins={[rehypeKatex]}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-gray-500">Select a chat to preview</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
