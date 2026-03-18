'use client';

import { useEffect, useState, useCallback } from 'react';

const LEVEL_COLORS = {
  5: { bg: 'bg-red-500/15', border: 'border-red-500/40', text: 'text-red-400', badge: 'bg-red-500 text-white', dot: 'bg-red-500' },
  4: { bg: 'bg-orange-500/15', border: 'border-orange-500/40', text: 'text-orange-400', badge: 'bg-orange-500 text-white', dot: 'bg-orange-500' },
  3: { bg: 'bg-yellow-500/15', border: 'border-yellow-500/40', text: 'text-yellow-400', badge: 'bg-yellow-500 text-black', dot: 'bg-yellow-500' },
  2: { bg: 'bg-blue-500/15', border: 'border-blue-500/40', text: 'text-blue-400', badge: 'bg-blue-500 text-white', dot: 'bg-blue-500' },
  1: { bg: 'bg-white/5', border: 'border-white/10', text: 'text-white/50', badge: 'bg-white/20 text-white/60', dot: 'bg-white/30' },
};

const LEVEL_LABELS = { 5: 'URGENT', 4: 'HIGH', 3: 'CONCERN', 2: 'LOW', 1: 'MONITOR' };

function levelColors(level) {
  return LEVEL_COLORS[level] || LEVEL_COLORS[1];
}

function formatDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-GB', { timeZone: 'Europe/London', dateStyle: 'short', timeStyle: 'short' });
}

function FlagRow({ flag, onMarkReviewed }) {
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState(flag.notes || '');
  const [saving, setSaving] = useState(false);
  const c = levelColors(flag.concern_level);

  async function saveNote() {
    setSaving(true);
    const token = localStorage.getItem('newton-auth-token');
    await fetch('/api/admin/safeguarding', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ id: flag.id, notes: note })
    });
    setSaving(false);
  }

  async function markReviewed() {
    const token = localStorage.getItem('newton-auth-token');
    await fetch('/api/admin/safeguarding', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        id: flag.id,
        reviewed: true,
        reviewed_at: new Date().toISOString()
      })
    });
    onMarkReviewed(flag.id);
  }

  const messages = Array.isArray(flag.conversation) ? flag.conversation : [];

  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} overflow-hidden transition-all`}>
      {/* Header row */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-white/5 transition-colors"
      >
        {/* Level badge */}
        <span className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${c.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
          {LEVEL_LABELS[flag.concern_level] || flag.concern_level} {flag.concern_level}/5
        </span>

        {/* Student info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{flag.student_name || 'Unknown student'}</p>
          <p className="text-xs text-white/50 truncate">{flag.student_email || '—'} · {flag.subject || 'General'}</p>
        </div>

        {/* Categories */}
        <div className="hidden md:flex flex-wrap gap-1 max-w-[240px]">
          {(flag.categories || []).slice(0, 3).map(cat => (
            <span key={cat} className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60">{cat}</span>
          ))}
        </div>

        {/* Date + reviewed */}
        <div className="shrink-0 text-right">
          <p className="text-xs text-white/50">{formatDate(flag.flagged_at || flag.created_at)}</p>
          {flag.reviewed && (
            <p className="text-xs text-green-400 mt-0.5">Reviewed</p>
          )}
        </div>

        {/* Chevron */}
        <svg className={`shrink-0 w-4 h-4 text-white/40 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-white/8 px-5 py-5 space-y-5">
          {/* AI Assessment */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/5 rounded-lg px-3 py-2">
              <p className="text-xs text-white/40 mb-0.5">Severity</p>
              <p className="text-sm font-medium text-white capitalize">{flag.severity || '—'}</p>
            </div>
            <div className="bg-white/5 rounded-lg px-3 py-2">
              <p className="text-xs text-white/40 mb-0.5">Confidence</p>
              <p className="text-sm font-medium text-white">{flag.confidence != null ? `${Math.round(flag.confidence * 100)}%` : '—'}</p>
            </div>
            <div className="bg-white/5 rounded-lg px-3 py-2 col-span-2">
              <p className="text-xs text-white/40 mb-0.5">Categories</p>
              <p className="text-sm text-white/80">{(flag.categories || []).join(', ') || '—'}</p>
            </div>
          </div>

          {/* Reasoning */}
          {flag.reasoning && (
            <div>
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5">AI Reasoning</p>
              <p className="text-sm text-white/70 leading-relaxed">{flag.reasoning}</p>
            </div>
          )}

          {/* Summary */}
          {flag.ai_summary && (
            <div>
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5">Summary</p>
              <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">{flag.ai_summary}</p>
            </div>
          )}

          {/* Conversation */}
          {messages.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Conversation</p>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {messages.map((m, i) => {
                  const isUser = m.role === 'user';
                  const text = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
                  return (
                    <div key={i} className={`rounded-lg px-3 py-2 text-sm ${isUser ? 'bg-white/8' : 'bg-blue-500/10'}`}>
                      <p className="text-xs text-white/40 mb-0.5 font-medium">{isUser ? (flag.student_name || 'Student') : 'Newton'}</p>
                      <p className="text-white/80 whitespace-pre-wrap">{text}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5">Notes</p>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
              placeholder="Add safeguarding officer notes..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/30 resize-none focus:outline-none focus:border-white/20"
            />
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={saveNote}
                disabled={saving}
                className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white/70 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save note'}
              </button>
              {!flag.reviewed && (
                <button
                  onClick={markReviewed}
                  className="text-xs px-3 py-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 transition-colors"
                >
                  Mark as reviewed
                </button>
              )}
              {flag.reviewed && (
                <span className="text-xs text-green-400">
                  Reviewed {formatDate(flag.reviewed_at)}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SafeguardingPage() {
  useEffect(() => {
    const token = localStorage.getItem('newton-auth-token');
    if (!token) {
      window.location.href = '/';
      return;
    }
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(r => r.json())
    .then(user => {
      if (!user.isAdmin) {
        window.location.href = '/dashboard';
      }
    })
    .catch(() => {
      window.location.href = '/';
    });
  }, []);

  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('unreviewed'); // 'all' | 'unreviewed' | 'flagged'
  const [minLevel, setMinLevel] = useState(1);

  const fetchFlags = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('newton-auth-token');
    const params = new URLSearchParams({ filter, minLevel });
    const res = await fetch(`/api/admin/safeguarding?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const { flags: data } = await res.json();
    setFlags(data || []);
    setLoading(false);
  }, [filter, minLevel]);

  useEffect(() => { fetchFlags(); }, [fetchFlags]);

  function handleMarkReviewed(id) {
    setFlags(prev => prev.map(f => f.id === id ? { ...f, reviewed: true, reviewed_at: new Date().toISOString() } : f));
  }

  function handlePrint() {
    window.print();
  }

  const counts = {
    5: flags.filter(f => f.concern_level === 5).length,
    4: flags.filter(f => f.concern_level === 4).length,
    3: flags.filter(f => f.concern_level === 3).length,
    2: flags.filter(f => f.concern_level === 2).length,
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 print:mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Safeguarding</h1>
            <p className="text-sm text-white/50 mt-0.5">Newton AI · Student welfare monitoring</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchFlags}
              className="text-sm px-3 py-1.5 rounded-lg bg-white/8 hover:bg-white/12 text-white/60 transition-colors print:hidden"
            >
              Refresh
            </button>
            <button
              onClick={handlePrint}
              className="text-sm px-3 py-1.5 rounded-lg bg-white/8 hover:bg-white/12 text-white/60 transition-colors print:hidden"
            >
              Print
            </button>
          </div>
        </div>

        {/* Summary counts */}
        <div className="grid grid-cols-4 gap-3 mb-6 print:hidden">
          {[5, 4, 3, 2].map(level => {
            const c = levelColors(level);
            return (
              <div key={level} className={`rounded-xl border ${c.border} ${c.bg} px-4 py-3`}>
                <p className={`text-2xl font-bold ${c.text}`}>{counts[level]}</p>
                <p className="text-xs text-white/50 mt-0.5">{LEVEL_LABELS[level]}</p>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6 print:hidden">
          <div className="flex rounded-lg border border-white/10 overflow-hidden">
            {[
              { key: 'unreviewed', label: 'Unreviewed' },
              { key: 'flagged', label: 'Flagged' },
              { key: 'all', label: 'All' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-3 py-1.5 text-sm transition-colors ${filter === key ? 'bg-white/12 text-white' : 'text-white/50 hover:text-white/70 hover:bg-white/5'}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40">Min level:</span>
            <div className="flex rounded-lg border border-white/10 overflow-hidden">
              {[1, 2, 3, 4, 5].map(l => (
                <button
                  key={l}
                  onClick={() => setMinLevel(l)}
                  className={`px-2.5 py-1.5 text-sm transition-colors ${minLevel === l ? 'bg-white/12 text-white' : 'text-white/50 hover:text-white/70 hover:bg-white/5'}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <span className="text-xs text-white/40 ml-auto">{flags.length} record{flags.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Flags list */}
        {loading ? (
          <div className="text-center py-16 text-white/40">Loading…</div>
        ) : flags.length === 0 ? (
          <div className="text-center py-16 text-white/40">
            <p className="text-lg mb-1">No records</p>
            <p className="text-sm">No safeguarding flags match the current filters.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {flags.map(flag => (
              <FlagRow key={flag.id} flag={flag} onMarkReviewed={handleMarkReviewed} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
