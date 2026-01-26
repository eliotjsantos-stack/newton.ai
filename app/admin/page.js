'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import Link from 'next/link';

export default function AdminDashboard() {
  const [currentTab, setCurrentTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYearGroup, setFilterYearGroup] = useState('all');
  const [unviewedReportsCount, setUnviewedReportsCount] = useState(0);

  useEffect(() => {
  if (currentTab === 'reports' && unviewedReportsCount > 0) {
    const markViewed = async () => {
      const token = localStorage.getItem('newton-auth-token');
      await fetch('/api/admin/reports/mark-viewed', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setUnviewedReportsCount(0);
    };
    markViewed();
  }
}, [currentTab, unviewedReportsCount]);
  
  useEffect(() => {
    checkAdminAndLoadData();
  }, []);

  const checkAdminAndLoadData = async () => {
    const token = localStorage.getItem('newton-auth-token');
    
    if (!token) {
      window.location.href = '/login?redirect=/admin';
      return;
    }

    try {
      // Check if current user is admin
      const meResponse = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const meData = await meResponse.json();
      
      if (!meData.isAdmin) {
        alert('Access denied. Admin privileges required.');
        localStorage.removeItem('newton-auth-token');
        window.location.href = '/login';
        return;
      }
      
      setIsAdmin(true);

      // Load all data
      await Promise.all([
        loadUsers(),
        loadReports(),
        loadAnalytics()
      ]);
      
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to load admin dashboard');
      window.location.href = '/login';
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    const token = localStorage.getItem('newton-auth-token');
    const response = await fetch('/api/admin/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setUsers(data.users || []);
  };

  const loadReports = async () => {
  const token = localStorage.getItem('newton-auth-token');
  const response = await fetch('/api/admin/reports', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  setReports(data.reports || []);
  setUnviewedReportsCount(data.unviewedCount || 0);
};

  const loadAnalytics = async () => {
    const token = localStorage.getItem('newton-auth-token');
    const response = await fetch('/api/admin/analytics', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setAnalytics(data);
  };

  const banUser = async (userId, shouldBan) => {
    if (!confirm(`Are you sure you want to ${shouldBan ? 'ban' : 'unban'} this user?`)) {
      return;
    }

    const token = localStorage.getItem('newton-auth-token');
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ banned: shouldBan })
    });

    if (response.ok) {
      alert(`User ${shouldBan ? 'banned' : 'unbanned'} successfully`);
      loadUsers();
    } else {
      alert('Failed to update user');
    }
  };

  const deleteUser = async (userId) => {
    if (!confirm('Are you sure you want to DELETE this user? This cannot be undone!')) {
      return;
    }

    const secondConfirm = prompt('Type DELETE to confirm:');
    if (secondConfirm !== 'DELETE') {
      alert('Deletion cancelled');
      return;
    }

    const token = localStorage.getItem('newton-auth-token');
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      alert('User deleted successfully');
      setSelectedUser(null);
      setSelectedSubject(null);
      setSelectedChat(null);
      loadUsers();
      loadAnalytics();
    } else {
      alert('Failed to delete user');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesYear = filterYearGroup === 'all' || user.year_group === filterYearGroup;
    return matchesSearch && matchesYear && !user.is_admin;
  });

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-900">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl flex items-center justify-center shadow-2xl mb-6 mx-auto animate-pulse">
            <span className="text-3xl font-bold text-white">A</span>
          </div>
          <p className="text-neutral-300 font-medium text-lg">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="flex h-screen bg-neutral-900">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-neutral-800 border-r border-neutral-700 flex flex-col">
        <div className="p-6 border-b border-neutral-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-lg font-bold text-white">A</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Admin Panel</h1>
              <p className="text-xs text-neutral-400">Newton AI</p>
            </div>
          </div>
     </div>

        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => setCurrentTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              currentTab === 'overview'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-neutral-300 hover:bg-neutral-700 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="font-semibold">Overview</span>
          </button>

          <button
            onClick={() => setCurrentTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              currentTab === 'users'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-neutral-300 hover:bg-neutral-700 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="font-semibold">Users</span>
            <span className="ml-auto bg-neutral-700 text-neutral-300 text-xs px-2 py-1 rounded-full">
              {users.filter(u => !u.is_admin).length}
            </span>
          </button>

          <button
            onClick={() => setCurrentTab('conversations')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              currentTab === 'conversations'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-neutral-300 hover:bg-neutral-700 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="font-semibold">Conversations</span>
          </button>

          <button
            onClick={() => setCurrentTab('reports')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              currentTab === 'reports'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-neutral-300 hover:bg-neutral-700 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="font-semibold">Reports</span>
            {unviewedReportsCount > 0 && (
  <span className="ml-auto bg-red-600 text-white text-xs px-2 py-1 rounded-full font-bold">
    {unviewedReportsCount}
  </span>
)}
          </button>

          <button
            onClick={() => setCurrentTab('analytics')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              currentTab === 'analytics'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-neutral-300 hover:bg-neutral-700 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="font-semibold">Analytics</span>
          </button>
        </nav>

        <div className="p-4 border-t border-neutral-700">
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-neutral-700 hover:bg-neutral-600 text-neutral-200 rounded-xl transition-all font-semibold"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Exit Admin
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-neutral-800 border-b border-neutral-700 px-8 py-6">
          <h2 className="text-2xl font-bold text-white capitalize">{currentTab}</h2>
          <p className="text-neutral-400 text-sm mt-1">
            {currentTab === 'overview' && 'System overview and key metrics'}
            {currentTab === 'users' && 'Manage user accounts and permissions'}
            {currentTab === 'conversations' && 'Monitor all user conversations'}
            {currentTab === 'reports' && 'Review reported issues from users'}
            {currentTab === 'analytics' && 'Usage statistics and insights'}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-neutral-900 p-8">
          {currentTab === 'overview' && analytics && (
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-6 hover:border-blue-600 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-neutral-400 text-sm font-medium">Total Users</p>
                    <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-white">{analytics.overview.totalUsers}</p>
                  <p className="text-xs text-neutral-500 mt-2">
                    +{analytics.overview.newUsersLast30Days} in last 30 days
                  </p>
                </div>

                <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-6 hover:border-green-600 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-neutral-400 text-sm font-medium">Active Users</p>
                    <div className="w-10 h-10 bg-green-600/20 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-white">{analytics.overview.activeUsers}</p>
                  <p className="text-xs text-neutral-500 mt-2">Last 7 days</p>
                </div>

                <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-6 hover:border-purple-600 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-neutral-400 text-sm font-medium">Total Chats</p>
                    <div className="w-10 h-10 bg-purple-600/20 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-white">{analytics.overview.totalChats}</p>
                  <p className="text-xs text-neutral-500 mt-2">{analytics.overview.totalMessages} messages</p>
                </div>

                <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-6 hover:border-red-600 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-neutral-400 text-sm font-medium">Reports</p>
                    <div className="w-10 h-10 bg-red-600/20 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-white">{analytics.overview.totalReports}</p>
                  <p className="text-xs text-neutral-500 mt-2">Issues reported</p>
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Subject Usage */}
                <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Subject Usage</h3>
                  <div className="space-y-3">
                    {Object.entries(analytics.subjectUsage)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 5)
                      .map(([subject, count]) => {
                        const percentage = (count / analytics.overview.totalChats) * 100;
                        return (
                          <div key={subject}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-neutral-300 font-medium">{subject}</span>
                              <span className="text-neutral-400">{count} chats ({percentage.toFixed(1)}%)</span>
                            </div>
                            <div className="w-full bg-neutral-700 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Year Group Distribution */}
                <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Year Group Distribution</h3>
                  <div className="space-y-3">
                    {Object.entries(analytics.yearGroupDistribution)
                      .sort(([, a], [, b]) => b - a)
                      .map(([yearGroup, count]) => {
                        const percentage = (count / analytics.overview.totalUsers) * 100;
                        const yearLabels = {
                          year7: 'Year 7',
                          year8: 'Year 8',
                          year9: 'Year 9',
                          year10: 'Year 10',
                          year11: 'Year 11',
                          year12: 'Year 12',
                          year13: 'Year 13'
                        };
                        return (
                          <div key={yearGroup}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-neutral-300 font-medium">{yearLabels[yearGroup] || yearGroup}</span>
                              <span className="text-neutral-400">{count} users ({percentage.toFixed(1)}%)</span>
                            </div>
                            <div className="w-full bg-neutral-700 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-green-600 to-emerald-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Recent User Activity</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-neutral-700">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-400">Email</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-400">Year Group</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-400">Chats</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-400">Last Active</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.users
                        .sort((a, b) => new Date(b.lastLogin || 0) - new Date(a.lastLogin || 0))
                        .slice(0, 10)
                        .map((user, index) => (
                          <tr key={index} className="border-b border-neutral-700/50 hover:bg-neutral-700/30 transition-colors">
                            <td className="py-3 px-4 text-sm text-neutral-300">{user.email}</td>
                            <td className="py-3 px-4 text-sm text-neutral-400">{user.yearGroup || 'Not set'}</td>
                            <td className="py-3 px-4 text-sm text-neutral-400">{user.chatCount}</td>
                            <td className="py-3 px-4 text-sm text-neutral-400">
                              {user.lastLogin
                                ? new Date(user.lastLogin).toLocaleDateString()
                                : 'Never'}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {currentTab === 'users' && (
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Search and Filter */}
              <div className="flex gap-4 items-center">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Search users by email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 pl-11 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-blue-600 transition-all"
                  />
                  <svg className="w-5 h-5 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <select
                  value={filterYearGroup}
                  onChange={(e) => setFilterYearGroup(e.target.value)}
                  className="px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-blue-600 transition-all"
                >
                  <option value="all">All Year Groups</option>
                  <option value="year7">Year 7</option>
                  <option value="year8">Year 8</option>
                  <option value="year9">Year 9</option>
                  <option value="year10">Year 10</option>
                  <option value="year11">Year 11</option>
                  <option value="year12">Year 12</option>
                  <option value="year13">Year 13</option>
                </select>
              </div>

              {/* Users Table */}
              <div className="bg-neutral-800 border border-neutral-700 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-neutral-700/50">
                      <tr>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-neutral-300">User</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-neutral-300">Year Group</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-neutral-300">Chats</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-neutral-300">Created</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-neutral-300">Last Active</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-neutral-300">Status</th>
                        <th className="text-right py-4 px-6 text-sm font-semibold text-neutral-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => {
                        const chatCount = user.chat_data?.chatsBySubject
                          ? Object.values(user.chat_data.chatsBySubject).reduce((acc, chats) => acc + chats.length, 0)
                          : 0;
                        
                        return (
                          <tr key={user.id} className="border-t border-neutral-700 hover:bg-neutral-700/30 transition-colors">
                            <td className="py-4 px-6">
                              <div>
                                <p className="text-sm font-medium text-white">{user.email}</p>
                                <p className="text-xs text-neutral-500">{user.id.substring(0, 8)}</p>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span className="text-sm text-neutral-300">{user.year_group || 'Not set'}</span>
                            </td>
                            <td className="py-4 px-6">
                              <span className="text-sm text-neutral-300">{chatCount}</span>
                            </td>
                            <td className="py-4 px-6">
                              <span className="text-sm text-neutral-400">
                                {new Date(user.created_at).toLocaleDateString()}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <span className="text-sm text-neutral-400">
                                {user.last_login
                                  ? new Date(user.last_login).toLocaleDateString()
                                  : 'Never'}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              {user.banned ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-600/20 text-red-400 text-xs font-semibold rounded-full">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                  </svg>
                                  Banned
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-600/20 text-green-400 text-xs font-semibold rounded-full">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Active
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setCurrentTab('conversations');
                                  }}
                                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-all"
                                >
                                  View Chats
                                </button>
                                <button
                                  onClick={() => banUser(user.id, !user.banned)}
                                  className={`px-3 py-1.5 ${
                                    user.banned
                                      ? 'bg-green-600 hover:bg-green-700'
                                      : 'bg-yellow-600 hover:bg-yellow-700'
                                  } text-white text-xs font-semibold rounded-lg transition-all`}
                                >
                                  {user.banned ? 'Unban' : 'Ban'}
                                </button>
                                <button
                                  onClick={() => deleteUser(user.id)}
                                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-all"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {currentTab === 'conversations' && (
            <div className="flex h-full gap-6">
              {/* User Selection */}
              <div className="w-60 bg-neutral-800 border border-neutral-700 rounded-2xl p-4 space-y-2 overflow-y-auto">
                <h3 className="text-sm font-bold text-white mb-3 px-2">Select User</h3>
                {users.filter(u => !u.is_admin).map((user) => (
                  <button
                    key={user.id}
                    onClick={() => {
                      setSelectedUser(user);
                      setSelectedSubject(null);
                      setSelectedChat(null);
                    }}
                    className={`w-full p-3 rounded-xl text-left transition-all ${
                      selectedUser?.id === user.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                    }`}
                  >
                    <p className="text-sm font-medium truncate">{user.email}</p>
                    <p className="text-xs opacity-70">
                      {user.chat_data?.chatsBySubject
                        ? Object.values(user.chat_data.chatsBySubject).reduce((acc, chats) => acc + chats.length, 0)
                        : 0}{' '}
                      chats
                    </p>
                  </button>
                ))}
              </div>

              {/* Subject Selection */}
              {selectedUser && selectedUser.chat_data?.chatsBySubject && (
                <div className="w-60 bg-neutral-800 border border-neutral-700 rounded-2xl p-4 space-y-2 overflow-y-auto">
                  <h3 className="text-sm font-bold text-white mb-3 px-2">Select Subject</h3>
                  {Object.keys(selectedUser.chat_data.chatsBySubject).map((subject) => (
                    <button
                      key={subject}
                      onClick={() => {
                        setSelectedSubject(subject);
                        setSelectedChat(null);
                      }}
                      className={`w-full p-3 rounded-xl text-left transition-all ${
                        selectedSubject === subject
                          ? 'bg-blue-600 text-white'
                          : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                      }`}
                    >
                      <p className="text-sm font-medium">{subject}</p>
                      <p className="text-xs opacity-70">
                        {selectedUser.chat_data.chatsBySubject[subject].length} chats
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {/* Chat Selection */}
              {selectedSubject && selectedUser.chat_data?.chatsBySubject[selectedSubject] && (
                <div className="w-60 bg-neutral-800 border border-neutral-700 rounded-2xl p-4 space-y-2 overflow-y-auto">
                  <h3 className="text-sm font-bold text-white mb-3 px-2">Select Chat</h3>
                  {selectedUser.chat_data.chatsBySubject[selectedSubject]
                    .filter(chat => chat.messages && chat.messages.length > 0)
                    .map((chat) => (
                      <button
                        key={chat.id}
                        onClick={() => setSelectedChat(chat)}
                        className={`w-full p-3 rounded-xl text-left transition-all ${
                          selectedChat?.id === chat.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                        }`}
                      >
                        <p className="text-sm line-clamp-2">
                          {chat.messages[0]?.content?.substring(0, 60)}...
                        </p>
                        <p className="text-xs opacity-70 mt-1">
                          {chat.messages.length} messages • {new Date(chat.date).toLocaleDateString()}
                        </p>
                      </button>
                    ))}
                </div>
              )}

              {/* Chat Viewer */}
              <div className="flex-1 bg-neutral-800 border border-neutral-700 rounded-2xl flex flex-col">
                {selectedChat ? (
                  <>
                    <div className="p-6 border-b border-neutral-700">
                      <h3 className="text-lg font-bold text-white">
                        {selectedUser.email} - {selectedSubject}
                      </h3>
                      <p className="text-sm text-neutral-400">
                        {selectedChat.messages.length} messages • {new Date(selectedChat.date).toLocaleString()}
                      </p>
                      <div className="mt-3 bg-yellow-900/30 border border-yellow-600/30 rounded-lg p-3">
                        <p className="text-xs text-yellow-400 font-medium">
                          ⚠️ Read-only mode: Viewing as admin
                        </p>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                      {selectedChat.messages.map((message, index) => (
                        <div
                          key={index}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
  className={`max-w-[90%] rounded-2xl p-5 ${
                              message.role === 'user'
                                ? 'bg-blue-600 text-white'
                                : 'bg-neutral-700 text-neutral-100'
                            }`}
                          >
                            <div className="prose prose-invert prose-sm max-w-none">
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
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center text-neutral-500">
                      <svg className="w-16 h-16 mx-auto mb-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <p className="font-medium">Select a conversation</p>
                      <p className="text-sm mt-1">Choose user → subject → chat</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentTab === 'reports' && (
            <div className="max-w-5xl mx-auto space-y-4">
              {reports.length === 0 ? (
                <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-12 text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-lg font-bold text-white mb-2">No Reports</h3>
                  <p className="text-neutral-400">No issues have been reported by users yet.</p>
                </div>
              ) : (
                reports.map((report, index) => (
                  <div key={index} className="bg-neutral-800 border border-neutral-700 rounded-2xl p-6 hover:border-red-600/50 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-600/20 rounded-xl flex items-center justify-center">
                          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">Report #{reports.length - index}</p>
                          <p className="text-xs text-neutral-400">
                            {report.user_email} • {report.year_group}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-neutral-500">
                        {new Date(report.created_at).toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-4">
                        <p className="text-xs font-semibold text-neutral-500 mb-2">Issue Description:</p>
                        <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap">
                          {report.issue}
                        </p>
                      </div>

                      {report.chat_context && (
                        <div className="bg-neutral-900 border border-blue-700/50 rounded-xl p-4">
                          <p className="text-xs font-semibold text-blue-400 mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            Chat Context ({JSON.parse(report.chat_context).subject}):
                          </p>
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {JSON.parse(report.chat_context).messages.map((msg, i) => (
                              <div key={i} className={`p-2 rounded text-xs ${msg.role === 'user' ? 'bg-blue-900/30 text-blue-200' : 'bg-neutral-800 text-neutral-400'}`}>
                                <span className="font-semibold">{msg.role === 'user' ? 'Student' : 'Newton'}:</span> {msg.content.substring(0, 200)}{msg.content.length > 200 ? '...' : ''}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {report.screenshot && (
                        <div className="bg-neutral-900 border border-purple-700/50 rounded-xl p-4">
                          <p className="text-xs font-semibold text-purple-400 mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Screenshot:
                          </p>
                          <img 
                            src={report.screenshot} 
                            alt="Issue screenshot" 
                            className="w-full rounded-lg border border-neutral-700"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {currentTab === 'analytics' && analytics && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Detailed Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-2xl font-bold text-white">{analytics.overview.totalUsers}</p>
                    <p className="text-sm text-neutral-400">Total Users</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{analytics.overview.activeUsers}</p>
                    <p className="text-sm text-neutral-400">Active Users (7d)</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{analytics.overview.totalChats}</p>
                    <p className="text-sm text-neutral-400">Total Chats</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{analytics.overview.totalMessages}</p>
                    <p className="text-sm text-neutral-400">Total Messages</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {analytics.overview.totalMessages > 0
                        ? (analytics.overview.totalMessages / analytics.overview.totalChats).toFixed(1)
                        : '0'}
                    </p>
                    <p className="text-sm text-neutral-400">Avg Messages/Chat</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {analytics.overview.totalUsers > 0
                        ? (analytics.overview.totalChats / analytics.overview.totalUsers).toFixed(1)
                        : '0'}
                    </p>
                    <p className="text-sm text-neutral-400">Avg Chats/User</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{analytics.overview.totalReports}</p>
                    <p className="text-sm text-neutral-400">Issues Reported</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {analytics.overview.totalUsers > 0
                        ? ((analytics.overview.activeUsers / analytics.overview.totalUsers) * 100).toFixed(0)
                        : '0'}%
                    </p>
                    <p className="text-sm text-neutral-400">Active Rate</p>
                  </div>
                </div>
              </div>

              {/* All users table for export */}
              <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">All Users Data</h3>
                  <button
                    onClick={() => {
                      const csv = [
                        ['Email', 'Year Group', 'Chats', 'Created', 'Last Login'],
                        ...analytics.users.map(u => [
                          u.email,
                          u.yearGroup || 'Not set',
                          u.chatCount,
                          new Date(u.createdAt).toLocaleDateString(),
                          u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'
                        ])
                      ].map(row => row.join(',')).join('\n');
                      
                      const blob = new Blob([csv], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `newton-users-${new Date().toISOString().split('T')[0]}.csv`;
                      a.click();
                    }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-all flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export CSV
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-neutral-700">
                      <tr>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-400">Email</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-400">Year Group</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-400">Chats</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-400">Created</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-400">Last Active</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.users.map((user, index) => (
                        <tr key={index} className="border-b border-neutral-700/50 hover:bg-neutral-700/30 transition-colors">
                          <td className="py-3 px-4 text-sm text-neutral-300">{user.email}</td>
                          <td className="py-3 px-4 text-sm text-neutral-400">{user.yearGroup || 'Not set'}</td>
                          <td className="py-3 px-4 text-sm text-neutral-400">{user.chatCount}</td>
                          <td className="py-3 px-4 text-sm text-neutral-400">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-sm text-neutral-400">
                            {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}