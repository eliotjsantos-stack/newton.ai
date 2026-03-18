'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NavSidebar } from '@/components/NavSidebar';
import {
  LayoutGrid,
  Plus,
  Users,
  BarChart2,
  Settings,
} from 'lucide-react';

const navItems = [
  { href: '/teacher/classes',      label: 'My Classes',    icon: LayoutGrid },
  { href: '/teacher/create-class', label: 'Create Class',  icon: Plus },
  { href: '/teacher/students',     label: 'Students',      icon: Users },
  { href: '/teacher/analytics',    label: 'Analytics',     icon: BarChart2 },
  { href: '/teacher/settings',     label: 'Settings',      icon: Settings },
];

// NavSidebar expects icon as a component reference, wrap for compatibility
const navItemsForSidebar = navItems.map(item => ({
  href: item.href,
  label: item.label,
  icon: item.icon,
}));

export default function TeacherLayout({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('newton-auth-token');
    if (token) {
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => {
          if (d.fullName || d.email) {
            setUser({ name: d.fullName || d.email, role: 'teacher' });
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('newton-auth-token');
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <NavSidebar
          user={user}
          navItems={navItemsForSidebar}
          onLogout={handleLogout}
        />
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0" style={{ background: 'rgba(0,0,0,0.6)' }} />
        </div>
      )}

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 md:hidden transform transition-transform duration-250 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <NavSidebar
          user={user}
          navItems={navItemsForSidebar}
          onLogout={handleLogout}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Mobile header */}
        <div
          className="sticky top-0 z-20 md:hidden flex items-center gap-3 px-4 py-3"
          style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)' }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 -ml-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseOver={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Newton Teacher</p>
        </div>

        <main className="p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
