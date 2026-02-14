'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RoleWrapper({ children }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('newton-auth-token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (data.accountType === 'teacher') {
          setAuthorized(true);
        } else {
          router.push('/dashboard');
        }
      })
      .catch(() => {
        router.push('/login');
      })
      .finally(() => setChecking(false));
  }, [router]);

  if (checking || !authorized) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }

  return children;
}
