'use client';

import { useState, useEffect } from 'react';

export default function StatusRibbon({ currentSubject, currentTopic, tabSwitchCount = 0 }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const hours = String(Math.floor(elapsed / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
  const seconds = String(elapsed % 60).padStart(2, '0');

  return (
    <div className="border-b border-gray-200 h-9 flex items-center justify-between px-4 text-[11px] shrink-0 z-50 bg-white">
      {/* Left: Breadcrumb path */}
      <div className="flex items-center gap-1.5 text-gray-500 min-w-0 truncate">
        <span className="font-medium">{currentSubject || 'General'}</span>
        {currentTopic && (
          <>
            <span className="text-gray-300">/</span>
            <span className="text-gray-600 truncate">{currentTopic}</span>
          </>
        )}
      </div>

      {/* Center: Integrity status */}
      <div className="flex items-center gap-1.5">
        <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
        <span className="text-emerald-600 font-medium">Secure</span>
      </div>

      {/* Right: Session timer */}
      <div className="flex items-center gap-2 text-gray-400 tabular-nums">
        <span>{hours}:{minutes}:{seconds}</span>
      </div>
    </div>
  );
}
