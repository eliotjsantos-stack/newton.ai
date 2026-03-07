'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [yearGroup, setYearGroup] = useState('year9');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devCode, setDevCode] = useState('');
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
      if (!response.ok) throw new Error(data.error || 'Failed to send verification code');
      if (data.devCode) setDevCode(data.devCode);
      setStep(2);
      setResendCooldown(60);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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

  const handleVerifyAndCreate = async (e) => {
    e.preventDefault();
    setError('');
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
      if (!response.ok) throw new Error(data.error || 'Failed to create account');
      localStorage.setItem('newton-auth-token', data.token);
      router.push(accountType === 'teacher' ? '/teacher/classes' : '/chat');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-gray-900 placeholder:text-gray-400 text-sm";
  const selectClass = "w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-gray-900 text-sm";

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
              <span className="text-lg font-bold text-white">N</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Newton</h1>
          </Link>
          <p className="text-gray-500 text-sm mt-2">Create your free account</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 sm:p-8">
          {/* Account Type Toggle */}
          <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => { setAccountType('student'); setError(''); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${accountType === 'student' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => { setAccountType('teacher'); setError(''); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${accountType === 'teacher' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Teacher
            </button>
          </div>

          {accountType === 'teacher' && (
            <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-xs text-amber-700 font-medium">For authorised teachers only. You will need a teacher access code.</p>
            </div>
          )}

          {/* Progress Indicator */}
          <div className="flex items-center justify-center mb-7">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs transition-all ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>1</div>
            <div className={`w-14 h-0.5 transition-all ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs transition-all ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>2</div>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Step 1: Email */}
          {step === 1 && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@school.ac.uk"
                  required
                  className={inputClass}
                />
                <p className="text-xs text-gray-400 mt-1.5">We&apos;ll send a 6-digit verification code</p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 text-sm"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending code...
                  </span>
                ) : 'Send verification code'}
              </button>
            </form>
          )}

          {/* Step 2: Verify + Create */}
          {step === 2 && (
            <form onSubmit={handleVerifyAndCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Verification code</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength="6"
                  required
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-center text-2xl tracking-widest font-mono text-gray-900 placeholder:text-gray-300"
                />
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-xs text-gray-400">Sent to {email}</p>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendCooldown > 0 || loading}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 disabled:text-gray-400 transition-colors"
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Create password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 characters, 1 number" required className={inputClass} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" required className={inputClass} />
              </div>

              {accountType === 'teacher' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Sarah Johnson" required className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">How should students address you?</label>
                    <select
                      value={isCustomTitle ? 'custom' : preferredTitle}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'custom') { setIsCustomTitle(true); setPreferredTitle('custom'); }
                        else { setIsCustomTitle(false); setPreferredTitle(val); setCustomTitle(''); }
                      }}
                      required
                      className={selectClass}
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
                      <input type="text" value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} placeholder="Enter your custom title" required className={`${inputClass} mt-2`} autoFocus />
                    )}
                  </div>
                </>
              )}

              {accountType === 'teacher' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Teacher access code</label>
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
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-center text-lg tracking-widest font-mono text-gray-900 placeholder:text-gray-300"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Year group</label>
                  <select value={yearGroup} onChange={(e) => setYearGroup(e.target.value)} className={selectClass}>
                    {yearGroups.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 text-sm"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating account...
                  </span>
                ) : 'Create account'}
              </button>

              <button
                type="button"
                onClick={() => { setStep(1); setError(''); }}
                className="w-full py-2 text-gray-500 hover:text-gray-700 text-sm transition-colors"
              >
                ← Back to email
              </button>
            </form>
          )}

          <div className="mt-5 pt-5 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">
          By creating an account, you agree to use Newton for learning purposes only
        </p>
      </div>
    </div>
  );
}
