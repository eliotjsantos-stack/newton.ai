'use client';

import { useState, useEffect } from 'react';
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
  const [accountType, setAccountType] = useState('student');
  const [teacherCode, setTeacherCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [preferredTitle, setPreferredTitle] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [isCustomTitle, setIsCustomTitle] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

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
      setResendCooldown(60);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleResendCode = async () => {
    if (resendCooldown > 0 || loading) return;
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to resend code');
      if (data.devCode) setDevCode(data.devCode);
      setCode('');
      setResendCooldown(60);
      setError('');
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
      const titleToSave = isCustomTitle ? customTitle.trim() : preferredTitle;
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, password, yearGroup: accountType === 'teacher' ? null : yearGroup, accountType, teacherCode: accountType === 'teacher' ? teacherCode : undefined, fullName: accountType === 'teacher' ? fullName.trim() : undefined, preferredTitle: accountType === 'teacher' ? titleToSave : undefined })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create account');
      }

      // Store token and redirect based on account type
      localStorage.setItem('newton-auth-token', data.token);
      router.push(accountType === 'teacher' ? '/teacher/classes' : '/chat');
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
          <p className="text-[#a1a1a6] mt-3">Create your account</p>
        </div>

        {/* Card */}
        <div
          className="bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] rounded-3xl shadow-2xl p-8"
          style={{ boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)' }}
        >
          {/* Account Type Toggle */}
          <div className="flex rounded-xl bg-white/[0.04] border border-white/[0.06] p-1 mb-6">
            <button
              type="button"
              onClick={() => { setAccountType('student'); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${accountType === 'student' ? 'bg-white/[0.1] text-neutral-100' : 'text-neutral-500 hover:text-neutral-300'}`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => { setAccountType('teacher'); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${accountType === 'teacher' ? 'bg-white/[0.1] text-neutral-100' : 'text-neutral-500 hover:text-neutral-300'}`}
            >
              Teacher
            </button>
          </div>
          {accountType === 'teacher' && (
            <div className="mb-6 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <p className="text-xs text-amber-400">For authorised teachers only. You will need a teacher access code.</p>
            </div>
          )}

          {/* Progress Indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${step >= 1 ? 'bg-[#0071e3] text-white' : 'bg-white/[0.05] text-neutral-500'}`}>
              1
            </div>
            <div className={`w-16 h-1 transition-all ${step >= 2 ? 'bg-[#0071e3]' : 'bg-white/[0.05]'}`}></div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${step >= 2 ? 'bg-[#0071e3] text-white' : 'bg-white/[0.05] text-neutral-500'}`}>
              2
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl animate-slideIn">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Dev Code Display (Development Only) */}


          {/* Step 1: Email */}
          {step === 1 && (
            <form onSubmit={handleSendCode} className="animate-fadeIn">
              <div className="mb-6">
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
                <p className="text-xs text-neutral-500 mt-2">
                  We&apos;ll send you a 6-digit verification code
                </p>
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
                <label className="block text-sm font-semibold text-neutral-300 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength="6"
                  required
                  className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all text-center text-2xl tracking-widest font-mono text-neutral-100 placeholder:text-neutral-500"
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-neutral-500">Sent to: {email}</p>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendCooldown > 0 || loading}
                    className="text-xs font-semibold text-blue-400 hover:text-blue-300 disabled:text-neutral-400 disabled:no-underline transition-colors"
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-neutral-300 mb-2">
                  Create Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters, 1 number"
                  required
                  className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all text-neutral-100 font-medium placeholder:text-neutral-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-neutral-300 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all text-neutral-100 font-medium placeholder:text-neutral-500"
                />
              </div>

              {accountType === 'teacher' && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-neutral-300 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Sarah Johnson"
                      required
                      className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all text-neutral-100 font-medium placeholder:text-neutral-500"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-neutral-300 mb-2">
                      How should students address you?
                    </label>
                    <select
                      value={isCustomTitle ? 'custom' : preferredTitle}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'custom') {
                          setIsCustomTitle(true);
                          setPreferredTitle('custom');
                        } else {
                          setIsCustomTitle(false);
                          setPreferredTitle(val);
                          setCustomTitle('');
                        }
                      }}
                      required
                      className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all text-neutral-100 font-medium"
                    >
                      <option value="">Select a title...</option>
                      <option value="Mr">Mr</option>
                      <option value="Mrs">Mrs</option>
                      <option value="Miss">Miss</option>
                      <option value="Ms">Ms</option>
                      <option value="Mx">Mx</option>
                      <option value="Dr">Dr</option>
                      <option value="Sir">Sir</option>
                      <option value="first_name">First name</option>
                      <option value="last_name">Last name</option>
                      <option value="custom">Custom...</option>
                    </select>
                    {isCustomTitle && (
                      <input
                        type="text"
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        placeholder="Enter your custom title"
                        required
                        className="w-full mt-2 px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all text-neutral-100 font-medium placeholder:text-neutral-500"
                        autoFocus
                      />
                    )}
                  </div>
                </>
              )}

              {accountType === 'teacher' ? (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-neutral-300 mb-2">
                    Teacher Access Code
                  </label>
                  <input
                    type="text"
                    value={teacherCode}
                    onChange={(e) => {
                      let val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                      if (val.length > 4) val = val.slice(0, 4) + '-' + val.slice(4);
                      setTeacherCode(val.slice(0, 9));
                    }}
                    maxLength={9}
                    placeholder="XXXX-XXXX"
                    required
                    className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all text-center text-lg tracking-widest font-mono text-neutral-100 placeholder:text-neutral-500"
                  />
                </div>
              ) : (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-neutral-300 mb-2">
                    Year Group
                  </label>
                  <select
                    value={yearGroup}
                    onChange={(e) => setYearGroup(e.target.value)}
                    className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all text-neutral-100 font-medium"
                  >
                    {yearGroups.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#0071e3] hover:bg-[#0077ed] text-white font-semibold rounded-xl transition-colors duration-200 disabled:opacity-50 mb-4"
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
                className="w-full py-2 text-neutral-400 hover:text-neutral-100 text-sm transition-colors"
              >
                ← Back to email
              </button>
            </form>
          )}

          {/* Login Link */}
          <div className="mt-6 pt-6 border-t border-white/[0.06] text-center">
            <p className="text-sm text-neutral-400">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-400 font-semibold hover:text-blue-300 transition-all">
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
