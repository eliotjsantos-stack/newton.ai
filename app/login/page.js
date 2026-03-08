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
    <div className="min-h-screen bg-[var(--c-canvas)] flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center gap-2.5 mb-3">
            <div className="w-9 h-9 bg-[var(--c-text)] rounded-lg flex items-center justify-center shrink-0">
              <span className="text-base font-bold text-white">N</span>
            </div>
            <span className="font-display text-xl text-[var(--c-text)]">Newton</span>
          </Link>
          <p className="text-sm text-[var(--c-text-muted)]">Welcome back — sign in to continue</p>
        </div>

        {/* Card */}
        <div className="bg-[var(--c-card)] rounded-xl card-shadow p-7">

          {error && (
            <div className="mb-5 px-3.5 py-3 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--c-text-soft)] mb-1.5 uppercase tracking-wide">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@school.ac.uk"
                required
                className="w-full px-3 py-2.5 bg-[var(--c-canvas)] border border-[var(--c-border)] rounded-md text-sm text-[var(--c-text)] placeholder:text-[var(--c-text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--c-accent-ring)] focus:border-[var(--c-accent)] transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-[var(--c-text-soft)] uppercase tracking-wide">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs text-[var(--c-accent)] hover:text-[var(--c-accent-hover)] font-medium transition-colors">
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full px-3 py-2.5 bg-[var(--c-canvas)] border border-[var(--c-border)] rounded-md text-sm text-[var(--c-text)] placeholder:text-[var(--c-text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--c-accent-ring)] focus:border-[var(--c-accent)] transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[var(--c-accent)] hover:bg-[var(--c-accent-hover)] text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 mt-1"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign in'}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-[var(--c-border)] text-center">
            <p className="text-sm text-[var(--c-text-muted)]">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-[var(--c-accent)] font-medium hover:text-[var(--c-accent-hover)] transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-[var(--c-text-faint)] mt-5">
          Secure login · Newton Learning Platform
        </p>
      </div>
    </div>
  );
}
