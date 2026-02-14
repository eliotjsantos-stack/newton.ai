'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useIntegrity — Academic integrity monitoring hook.
 *
 * Automatically tracks:
 *   - Tab/window switches (visibilitychange)
 *
 * Returns:
 *   - `logEvent(eventType, metadata)` for imperative use (PASTE_BLOCKED, COPY_BLOCKED, etc.)
 *   - `tabSwitchCount` — number of tab switches in the current session
 *   - `resetTabSwitchCount()` — reset after Flash Fire challenge
 *
 * @param {Object} opts
 * @param {'chat'|'quiz'} opts.sessionType
 * @param {string|null}   opts.sessionId
 * @param {boolean}       opts.enabled - set false to disable (default true)
 */
export default function useIntegrity({ sessionType = 'chat', sessionId = null, enabled = true } = {}) {
  const sessionIdRef = useRef(sessionId);
  sessionIdRef.current = sessionId;
  const [tabSwitchCount, setTabSwitchCount] = useState(0);

  const logEvent = useCallback(async (eventType, metadata = {}) => {
    if (!enabled) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('newton-auth-token') : null;
      if (!token) return;

      await fetch('/api/integrity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionType,
          sessionId: sessionIdRef.current,
          eventType,
          metadata,
        }),
      });
    } catch {
      // Silent fail — integrity logging should never break the UX
    }
  }, [sessionType, enabled]);

  const resetTabSwitchCount = useCallback(() => setTabSwitchCount(0), []);

  // Auto-track tab switches
  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount(prev => prev + 1);
        logEvent('TAB_SWITCH', { timestamp: new Date().toISOString() });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enabled, logEvent]);

  return { logEvent, tabSwitchCount, resetTabSwitchCount };
}
