"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ChevronLeft, Search, Settings, LogOut } from "lucide-react";

const SIDEBAR_TRANSITION = {
  duration: 0.25,
  ease: [0.4, 0, 0.2, 1],
};

export function NavSidebar({ user, navItems = [], onLogout }) {
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  const pathname = usePathname();

  const filteredItems = search
    ? navItems.filter(item => item.label.toLowerCase().includes(search.toLowerCase()))
    : navItems;

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 56 : 220 }}
      transition={SIDEBAR_TRANSITION}
      className="flex flex-col h-screen bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] shrink-0 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center h-14 px-4 border-b border-[var(--border-subtle)] shrink-0">
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2 overflow-hidden"
            >
              <div className="w-6 h-6 rounded-md bg-[var(--amber)] flex items-center justify-center shrink-0">
                <span className="text-[var(--text-inverse)] font-bold text-xs leading-none">N</span>
              </div>
              <span className="font-semibold text-[var(--text-primary)] text-sm tracking-tight whitespace-nowrap">Newton</span>
            </motion.div>
          )}
        </AnimatePresence>

        {collapsed && (
          <div className="w-6 h-6 rounded-md bg-[var(--amber)] flex items-center justify-center mx-auto">
            <span className="text-[var(--text-inverse)] font-bold text-xs leading-none">N</span>
          </div>
        )}

        <motion.button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "ml-auto p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors shrink-0",
            collapsed && "mx-auto ml-auto"
          )}
          whileTap={{ scale: 0.92 }}
        >
          <motion.div
            animate={{ rotate: collapsed ? 180 : 0 }}
            transition={SIDEBAR_TRANSITION}
          >
            <ChevronLeft className="h-4 w-4" />
          </motion.div>
        </motion.button>
      </div>

      {/* Search */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="px-3 pt-3 pb-2 shrink-0 overflow-hidden"
          >
            <div className="flex items-center gap-2 px-2.5 py-2 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-default)] hover:border-[var(--border-strong)] transition-colors">
              <Search className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search"
                className="bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none w-full"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nav Items */}
      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
        {filteredItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "relative flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-colors duration-150 group",
                isActive
                  ? "text-[var(--amber)] bg-[var(--amber-dim)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]",
                collapsed && "justify-center px-0"
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[var(--amber)] rounded-full"
                  transition={{ duration: 0.2 }}
                />
              )}

              <item.icon className={cn(
                "h-4 w-4 shrink-0",
                isActive ? "text-[var(--amber)]" : "text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]"
              )} />

              <AnimatePresence initial={false}>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {!collapsed && item.badge && (
                <span className="ml-auto text-[10px] font-medium bg-[var(--amber-dim)] text-[var(--amber)] px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-[var(--border-subtle)] space-y-0.5 shrink-0">
        <Link
          href="/settings"
          title={collapsed ? "Settings" : undefined}
          className={cn(
            "flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors",
            collapsed && "justify-center px-0"
          )}
        >
          <Settings className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden whitespace-nowrap"
              >
                Settings
              </motion.span>
            )}
          </AnimatePresence>
        </Link>

        {onLogout && (
          <button
            onClick={onLogout}
            title={collapsed ? "Logout" : undefined}
            className={cn(
              "w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:text-[var(--danger)] hover:bg-[var(--danger-dim)] transition-colors",
              collapsed && "justify-center px-0"
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        )}

        {/* User area */}
        {user && (
          <div className={cn(
            "flex items-center gap-2.5 px-2.5 py-2 mt-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)]",
            collapsed && "justify-center px-0 border-transparent bg-transparent"
          )}>
            <div className="w-7 h-7 rounded-full bg-[var(--amber-dim)] border border-[var(--amber)]/20 flex items-center justify-center shrink-0">
              <span className="text-xs font-medium text-[var(--amber)]">
                {user.name?.charAt(0)?.toUpperCase() ?? "?"}
              </span>
            </div>
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex-1 min-w-0 overflow-hidden"
                >
                  <p className="text-xs font-medium text-[var(--text-primary)] truncate">{user.name}</p>
                  <p className="text-[10px] text-[var(--text-muted)] truncate capitalize">{user.role ?? "Student"}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.aside>
  );
}
