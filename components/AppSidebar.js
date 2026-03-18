'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, MessageSquare, BookOpen, Settings, LogOut } from 'lucide-react';

const SPRING = 'cubic-bezier(0.25, 1.1, 0.4, 1)';

const NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/chat',      icon: MessageSquare,   label: 'Chat' },
  { href: '/quiz',      icon: BookOpen,         label: 'Quizzes' },
];

export default function AppSidebar({ onLogout }) {
  const pathname = usePathname();
  const router   = useRouter();

  const isActive = (href) => {
    if (href === '/chat') return pathname === '/chat' || pathname.startsWith('/chat/');
    if (href === '/quiz') return pathname === '/quiz' || pathname.startsWith('/quiz/');
    return pathname === href;
  };

  const handleLogout = () => {
    if (onLogout) { onLogout(); return; }
    localStorage.removeItem('newton-auth-token');
    router.push('/login');
  };

  return (
    <aside
      className="flex flex-col items-center h-screen sticky top-0 z-30 shrink-0 w-[60px]"
      style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border-subtle)' }}
    >
      {/* Logo mark */}
      <div className="flex items-center justify-center w-full h-14 shrink-0">
        <Link href="/dashboard" className="flex items-center justify-center">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)' }}
          >
            <span className="text-white font-bold text-xs leading-none">N</span>
          </div>
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col items-center gap-0.5 px-2 flex-1 pt-1 w-full">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className="flex items-center justify-center rounded-lg w-10 h-10 transition-all duration-300"
              style={{
                transitionTimingFunction: SPRING,
                background: active ? 'var(--amber-dim)' : 'transparent',
                color: active ? 'var(--amber)' : 'var(--text-muted)',
              }}
              onMouseOver={e => { if (!active) { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
              onMouseOut={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; } }}
            >
              <Icon size={16} strokeWidth={active ? 2 : 1.75} />
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="flex flex-col items-center gap-0.5 px-2 pb-4 shrink-0 w-full">
        <Link
          href="/settings"
          title="Settings"
          className="flex items-center justify-center rounded-lg w-10 h-10 transition-all duration-300"
          style={{ transitionTimingFunction: SPRING, color: 'var(--text-muted)' }}
          onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <Settings size={16} strokeWidth={1.75} />
        </Link>
        <button
          onClick={handleLogout}
          title="Logout"
          className="flex items-center justify-center rounded-lg w-10 h-10 transition-all duration-300"
          style={{ transitionTimingFunction: SPRING, color: 'var(--text-muted)' }}
          onMouseOver={e => { e.currentTarget.style.background = 'var(--danger-dim)'; e.currentTarget.style.color = 'var(--danger)'; }}
          onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <LogOut size={16} strokeWidth={1.75} />
        </button>
      </div>
    </aside>
  );
}
