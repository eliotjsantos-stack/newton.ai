'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) setError('Invalid reset link. Please request a new one.');
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      return setError('Password must be at least 8 characters.');
    }
    if (password !== confirm) {
      return setError('Passwords do not match.');
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--c-canvas)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center gap-3">
            <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
              <span className="text-lg font-bold text-white">N</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Newton</h1>
          </Link>
          <p className="text-gray-500 text-sm mt-2">Set a new password</p>
        </div>

        <div className="bg-[var(--c-card)] border border-white/8 rounded-2xl shadow-sm p-6 sm:p-8">
          {done ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-white mb-2">Password updated</h2>
              <p className="text-sm text-gray-500 mb-6">Your password has been changed. You can now log in with your new password.</p>
              <Link
                href="/login"
                className="inline-block px-6 py-2.5 bg-[#0071E3] text-white text-sm font-semibold rounded-xl hover:bg-[#0058B3] transition-colors"
              >
                Go to login
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-600 text-sm font-medium">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                    minLength={8}
                    disabled={!token}
                    className="w-full px-3.5 py-2.5 bg-[var(--bg-surface)] border border-white/12 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0071E3]/30 focus:border-[#0071E3]/40 transition-all text-white placeholder:text-white/40 text-sm disabled:opacity-40"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat your new password"
                    required
                    disabled={!token}
                    className="w-full px-3.5 py-2.5 bg-[var(--bg-surface)] border border-white/12 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0071E3]/30 focus:border-[#0071E3]/40 transition-all text-white placeholder:text-white/40 text-sm disabled:opacity-40"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !token}
                  className="w-full py-2.5 bg-[#0071E3] hover:bg-[#0058B3] text-white font-semibold rounded-xl transition-colors duration-200 disabled:opacity-50 text-sm"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </span>
                  ) : 'Set New Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
