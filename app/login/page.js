'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to log in');
      }

     localStorage.setItem('newton-auth-token', data.token);

      const urlParams = new URLSearchParams(window.location.search);
      const redirect = urlParams.get('redirect');

      // Check account type to route correctly
      const meResponse = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${data.token}` }
      });
      const meData = await meResponse.json();

      if (redirect === '/admin') {
        if (meData.isAdmin || meData.accountType === 'teacher') {
          router.push('/admin');
        } else {
          setError('Access denied. Admin only.');
          localStorage.removeItem('newton-auth-token');
        }
      } else if (meData.accountType === 'teacher') {
        router.push('/teacher/classes');
      } else {
        router.push('/chat');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <span className="text-lg font-bold text-black">N</span>
            </div>
            <h1 className="text-3xl font-bold text-[#f5f5f7] tracking-tight">Newton</h1>
          </Link>
          <p className="text-[#a1a1a6] mt-3">Welcome back</p>
        </div>

        {/* Card */}
        <div
          className="bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] rounded-3xl shadow-2xl p-8"
          style={{ boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)' }}
        >
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl animate-slideIn">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-neutral-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@school.ac.uk"
                required
                className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all text-neutral-100 font-medium placeholder:text-neutral-500"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-neutral-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all text-neutral-100 font-medium placeholder:text-neutral-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#0071e3] hover:bg-[#0077ed] text-white font-semibold rounded-xl transition-colors duration-200 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging in...
                </span>
              ) : 'Log In'}
            </button>
          </form>

          {/* Signup Link */}
          <div className="mt-6 pt-6 border-t border-white/[0.06] text-center">
            <p className="text-sm text-neutral-400">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-blue-400 font-semibold hover:text-blue-300 transition-all">
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-neutral-500 mt-6">
          Secure login for Newton students
        </p>
      </div>

      <style jsx global>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
