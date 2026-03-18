'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setSubmitted(true);
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
          <p className="text-gray-500 text-sm mt-2">Reset your password</p>
        </div>

        <div className="bg-[var(--c-card)] border border-white/8 rounded-2xl shadow-sm p-6 sm:p-8">
          {submitted ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-[#0071E3]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-[#0071E3]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-white mb-2">Check your email</h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">
                If an account exists for <span className="text-white font-medium">{email}</span>, we&apos;ve sent a password reset link. Check your inbox and spam folder.
              </p>
              <Link href="/login" className="text-sm text-[#0071E3] hover:text-[#0071E3] transition-colors font-semibold">
                Back to login
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-600 text-sm font-medium">{error}</p>
                </div>
              )}

              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                Enter the email address you used to sign up and we&apos;ll send you a reset link.
              </p>

              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@school.ac.uk"
                    required
                    className="w-full px-3.5 py-2.5 bg-[var(--bg-surface)] border border-white/12 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0071E3]/30 focus:border-[#0071E3]/40 transition-all text-white placeholder:text-white/40 text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-[#0071E3] hover:bg-[#0058B3] text-white font-semibold rounded-xl transition-colors duration-200 disabled:opacity-50 text-sm"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </span>
                  ) : 'Send Reset Link'}
                </button>
              </form>

              <div className="mt-5 pt-5 border-t border-gray-100 text-center">
                <p className="text-sm text-gray-500">
                  Remember your password?{' '}
                  <Link href="/login" className="text-[#0071E3] font-semibold hover:text-[#0071E3] transition-colors">
                    Log in
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
