'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
const TITLE_OPTIONS = [
  { value: 'Mr', label: 'Mr' },
  { value: 'Mrs', label: 'Mrs' },
  { value: 'Miss', label: 'Miss' },
  { value: 'Ms', label: 'Ms' },
  { value: 'Mx', label: 'Mx' },
  { value: 'Dr', label: 'Dr' },
  { value: 'Sir', label: 'Sir' },
  { value: 'first_name', label: 'First name' },
  { value: 'last_name', label: 'Last name' },
  { value: 'custom', label: 'Custom...' },
];

export default function SettingsPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [preferredTitle, setPreferredTitle] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [isCustomTitle, setIsCustomTitle] = useState(false);

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem('newton-auth-token');
      if (!token) { window.location.href = '/login'; return; }
      try {
        const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (!data.isAdmin && data.accountType !== 'teacher') { window.location.href = '/login'; return; }
        setAuthorized(true);
        setEmail(data.email || '');
        setFullName(data.fullName || '');
        const savedTitle = data.preferredTitle || '';
        const isPredefined = TITLE_OPTIONS.some(opt => opt.value === savedTitle && opt.value !== 'custom');
        if (savedTitle && !isPredefined) {
          setIsCustomTitle(true);
          setPreferredTitle('custom');
          setCustomTitle(savedTitle);
        } else {
          setPreferredTitle(savedTitle);
        }
      } catch {
        window.location.href = '/login';
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const token = localStorage.getItem('newton-auth-token');
      const titleToSave = isCustomTitle ? customTitle.trim() : preferredTitle;
      const res = await fetch('/api/auth/update-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fullName: fullName.trim(), preferredTitle: titleToSave }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('newton-auth-token');
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-[3px] border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }
  if (!authorized) return null;

  const inputCls = "w-full px-3 py-2 bg-white/[0.05] border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#0071e3] focus:border-transparent transition-all placeholder:text-white/20";

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
        <p className="text-sm text-white/40 mt-1">Manage your account and preferences.</p>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-2">
          <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile */}
        <section className="bg-white/[0.05] border border-white/[0.06] rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-white mb-4">Profile</h2>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Email</label>
            <input type="email" value={email} disabled className={inputCls + ' opacity-50 cursor-not-allowed'} />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Full Name</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Preferred Title</label>
            <select
              value={isCustomTitle ? 'custom' : preferredTitle}
              onChange={e => {
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
              className={inputCls}
            >
              <option value="" className="bg-neutral-900 text-white">Select...</option>
              {TITLE_OPTIONS.map(t => (
                <option key={t.value} value={t.value} className="bg-neutral-900 text-white">{t.label}</option>
              ))}
            </select>
            {isCustomTitle && (
              <input
                type="text"
                value={customTitle}
                onChange={e => setCustomTitle(e.target.value)}
                placeholder="Enter your custom title"
                className={inputCls + ' mt-2'}
                autoFocus
              />
            )}
            <p className="text-xs text-white/40 mt-1">How students should address you.</p>
          </div>
        </section>

        <button type="submit" disabled={saving}
          className="w-full py-2.5 bg-[#0071e3] hover:bg-[#0077ED] disabled:bg-white/[0.1] text-white text-sm font-medium rounded-full transition-colors">
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </form>

      {/* Account */}
      <section className="mt-8 bg-white/[0.05] border border-white/[0.06] rounded-2xl p-6">
        <h2 className="text-base font-semibold text-white mb-4">Account</h2>
        <button onClick={handleLogout}
          className="px-4 py-2 bg-white/[0.05] border border-white/[0.06] hover:bg-white/[0.08] text-white text-sm font-medium rounded-full transition-colors">
          Log Out
        </button>
      </section>
    </div>
  );
}
