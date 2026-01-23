'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: email, 2: verify code & password
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [yearGroup, setYearGroup] = useState('year9');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devCode, setDevCode] = useState(''); // For development

  const yearGroups = [
    { value: 'year7', label: 'Year 7 (Age 11-12)' },
    { value: 'year8', label: 'Year 8 (Age 12-13)' },
    { value: 'year9', label: 'Year 9 (Age 13-14)' },
    { value: 'year10', label: 'Year 10 (Age 14-15)' },
    { value: 'year11', label: 'Year 11 (Age 15-16)' },
    { value: 'year12', label: 'Year 12 (Age 16-17)' },
    { value: 'year13', label: 'Year 13 (Age 17-18)' }
  ];

  // Step 1: Send verification code
  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification code');
      }

      // Store dev code if in development
      if (data.devCode) {
        setDevCode(data.devCode);
      }

      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify code and create account
  const handleVerifyAndCreate = async (e) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, password, yearGroup })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create account');
      }

      // Store token and redirect to chat
      localStorage.setItem('newton-auth-token', data.token);
      router.push('/chat');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-4xl font-bold text-neutral-900 mb-2">Newton</h1>
          </Link>
          <p className="text-neutral-600">Create your account</p>
        </div>

        {/* Card */}
        <div 
          className="bg-white/80 backdrop-blur-xl border border-neutral-200/50 rounded-3xl shadow-2xl p-8"
          style={{ boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)' }}
        >
          {/* Progress Indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${step >= 1 ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-500'}`}>
              1
            </div>
            <div className={`w-16 h-1 transition-all ${step >= 2 ? 'bg-neutral-900' : 'bg-neutral-200'}`}></div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${step >= 2 ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-500'}`}>
              2
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl animate-slideIn">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Dev Code Display (Development Only) */}
          

          {/* Step 1: Email */}
          {step === 1 && (
            <form onSubmit={handleSendCode} className="animate-fadeIn">
              <div className="mb-6">
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@school.ac.uk"
                  required
                  className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all text-black font-medium placeholder:text-neutral-400"
                />
                <p className="text-xs text-neutral-500 mt-2">
                  We&apos;ll send you a 6-digit verification code
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-neutral-900 to-neutral-800 text-white font-semibold rounded-xl hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100"
                style={{ boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending Code...
                  </span>
                ) : 'Send Verification Code'}
              </button>
            </form>
          )}

          {/* Step 2: Verify Code & Create Password */}
          {step === 2 && (
            <form onSubmit={handleVerifyAndCreate} className="animate-fadeIn">
              <div className="mb-4">
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength="6"
                  required
                  className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all text-center text-2xl tracking-widest font-mono text-black placeholder:text-neutral-400"
                />
                <p className="text-xs text-neutral-500 mt-2">
                  Sent to: {email}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Create Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters, 1 number"
                  required
                  className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all text-black font-medium placeholder:text-neutral-400"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all text-black font-medium placeholder:text-neutral-400"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Year Group
                </label>
                <select
                  value={yearGroup}
                  onChange={(e) => setYearGroup(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all text-black font-medium placeholder:text-neutral-400"
                >
                  {yearGroups.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-neutral-900 to-neutral-800 text-white font-semibold rounded-xl hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100 mb-4"
                style={{ boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </span>
                ) : 'Create Account'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setError('');
                }}
                className="w-full py-2 text-neutral-600 hover:text-neutral-900 text-sm transition-colors"
              >
                ← Back to email
              </button>
            </form>
          )}

          {/* Login Link */}
          <div className="mt-6 pt-6 border-t border-neutral-200 text-center">
            <p className="text-sm text-neutral-600">
              Already have an account?{' '}
              <Link href="/login" className="text-neutral-900 font-semibold hover:underline transition-all">
                Log in
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-neutral-500 mt-6">
          By creating an account, you agree to use Newton for learning purposes only
        </p>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}