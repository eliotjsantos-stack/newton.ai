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
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
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
        body: JSON.stringify({ email, code, password, yearGroup: accountType === 'teacher' ? null : yearGroup, accountType, teacherCode: accountType === 'teacher' ? teacherCode : undefined, fullName: accountType === 'teacher' ? fullName.trim() : `${firstName.trim()} ${lastName.trim()}`.trim(), preferredTitle: accountType === 'teacher' ? titleToSave : undefined })
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

  const inputClass = "w-full px-3 py-2.5 bg-[var(--c-canvas)] border border-[var(--c-border)] rounded-md text-sm text-[var(--c-text)] placeholder:text-[var(--c-text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--c-accent-ring)] focus:border-[var(--c-accent)] transition-colors";
  const selectClass = "w-full px-3 py-2.5 bg-[var(--c-canvas)] border border-[var(--c-border)] rounded-md text-sm text-[var(--c-text)] focus:outline-none focus:ring-2 focus:ring-[var(--c-accent-ring)] focus:border-[var(--c-accent)] transition-colors";

  return (
    <div className="min-h-screen bg-[var(--c-canvas)] flex items-center justify-center p-4">
      <div className="w-full max-w-[420px]">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center gap-2.5 mb-3">
            <div className="w-9 h-9 bg-[var(--c-text)] rounded-lg flex items-center justify-center shrink-0">
              <span className="text-base font-bold text-white">N</span>
            </div>
            <span className="font-display text-xl text-[var(--c-text)]">Newton</span>
          </Link>
          <p className="text-sm text-[var(--c-text-muted)]">Create your free account</p>
        </div>

        {/* Card */}
        <div className="bg-[var(--c-card)] rounded-xl card-shadow p-7">

          {/* Account Type Toggle */}
          <div className="flex rounded-lg bg-[var(--c-canvas)] p-1 mb-6 border border-[var(--c-border)]">
            <button
              type="button"
              onClick={() => { setAccountType('student'); setError(''); }}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${accountType === 'student' ? 'bg-white/10 text-white card-shadow' : 'text-[var(--c-text-muted)] hover:text-[var(--c-text-soft)]'}`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => { setAccountType('teacher'); setError(''); }}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${accountType === 'teacher' ? 'bg-white/10 text-white card-shadow' : 'text-[var(--c-text-muted)] hover:text-[var(--c-text-soft)]'}`}
            >
              Teacher
            </button>
          </div>

          {accountType === 'teacher' && (
            <div className="mb-5 px-3.5 py-3 bg-[#0071E3]/10 border border-[#0071E3]/20 rounded-lg">
              <p className="text-xs text-[#0071E3]">For authorised teachers only. You will need a teacher access code.</p>
            </div>
          )}

          {/* Step indicator */}
          <div className="flex items-center justify-center mb-6">
            {[1, 2].map((s, i) => (
              <>
                <div
                  key={s}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${step >= s ? 'bg-[var(--c-accent)] text-white' : 'bg-[var(--c-canvas)] text-[var(--c-text-muted)] border border-[var(--c-border)]'}`}
                >
                  {s}
                </div>
                {i === 0 && (
                  <div className={`w-12 h-px mx-1 transition-colors ${step >= 2 ? 'bg-[var(--c-accent)]' : 'bg-[var(--c-border)]'}`} />
                )}
              </>
            ))}
          </div>

          {error && (
            <div className="mb-5 px-3.5 py-3 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Step 1: Email */}
          {step === 1 && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--c-text-soft)] mb-1.5 uppercase tracking-wide">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@school.ac.uk"
                  required
                  className={inputClass}
                />
                <p className="text-xs text-[var(--c-text-faint)] mt-1.5">We&apos;ll send a 6-digit verification code</p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[var(--c-accent)] hover:bg-[var(--c-accent-hover)] text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
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
                <label className="block text-xs font-medium text-[var(--c-text-soft)] mb-1.5 uppercase tracking-wide">Verification code</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength="6"
                  required
                  className="w-full px-3 py-2.5 bg-[var(--c-canvas)] border border-[var(--c-border)] rounded-md text-center text-2xl tracking-widest font-mono text-[var(--c-text)] placeholder:text-[var(--c-text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--c-accent-ring)] focus:border-[var(--c-accent)] transition-colors"
                />
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-xs text-[var(--c-text-faint)]">Sent to {email}</p>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendCooldown > 0 || loading}
                    className="text-xs font-medium text-[var(--c-accent)] hover:text-[var(--c-accent-hover)] disabled:text-[var(--c-text-faint)] transition-colors"
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--c-text-soft)] mb-1.5 uppercase tracking-wide">Create password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 characters, 1 number" required className={inputClass} />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--c-text-soft)] mb-1.5 uppercase tracking-wide">Confirm password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" required className={inputClass} />
              </div>

              {accountType === 'teacher' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-[var(--c-text-soft)] mb-1.5 uppercase tracking-wide">Full name</label>
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Sarah Johnson" required className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--c-text-soft)] mb-1.5 uppercase tracking-wide">How should students address you?</label>
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

              {accountType === 'student' && (
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-[var(--c-text-soft)] mb-1.5 uppercase tracking-wide">First name</label>
                    <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Eliot" required className={inputClass} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-[var(--c-text-soft)] mb-1.5 uppercase tracking-wide">Last name</label>
                    <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Santos" required className={inputClass} />
                  </div>
                </div>
              )}

              {accountType === 'teacher' ? (
                <div>
                  <label className="block text-xs font-medium text-[var(--c-text-soft)] mb-1.5 uppercase tracking-wide">Teacher access code</label>
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
                    className="w-full px-3 py-2.5 bg-[var(--c-canvas)] border border-[var(--c-border)] rounded-md text-center text-lg tracking-widest font-mono text-[var(--c-text)] placeholder:text-[var(--c-text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--c-accent-ring)] focus:border-[var(--c-accent)] transition-colors"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-[var(--c-text-soft)] mb-1.5 uppercase tracking-wide">Year group</label>
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
                className="w-full py-2.5 bg-[var(--c-accent)] hover:bg-[var(--c-accent-hover)] text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating account...
                  </span>
                ) : 'Create account'}
              </button>

              <button
                type="button"
                onClick={() => { setStep(1); setError(''); }}
                className="w-full py-2 text-[var(--c-text-muted)] hover:text-[var(--c-text-soft)] text-sm transition-colors"
              >
                ← Back to email
              </button>
            </form>
          )}

          <div className="mt-5 pt-5 border-t border-[var(--c-border)] text-center">
            <p className="text-sm text-[var(--c-text-muted)]">
              Already have an account?{' '}
              <Link href="/login" className="text-[var(--c-accent)] font-medium hover:text-[var(--c-accent-hover)] transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-[var(--c-text-faint)] mt-5">
          By creating an account, you agree to use Newton for learning purposes only
        </p>
      </div>
    </div>
  );
}
