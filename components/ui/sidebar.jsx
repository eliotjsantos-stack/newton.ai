"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Settings, LogOut, ChevronLeft, Search,
} from "lucide-react";

export function Sidebar({ user, navItems, onLogout }) {
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  const pathname = usePathname();

  return (
    <aside className={cn(
      "flex flex-col h-screen bg-white border-r border-neutral-100 transition-all duration-300 ease-in-out shrink-0",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-100">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-amber-500 flex items-center justify-center">
              <span className="text-white font-semibold text-sm">N</span>
            </div>
            <span className="font-semibold text-neutral-900 text-sm">Newton</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md hover:bg-neutral-100 transition-colors ml-auto"
        >
          <ChevronLeft className={cn(
            "h-4 w-4 text-neutral-500 transition-transform duration-300",
            collapsed && "rotate-180"
          )} />
        </button>
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="p-3 border-b border-neutral-100">
          <div className="flex items-center gap-2 px-3 py-2 bg-neutral-50 rounded-md border border-neutral-200">
            <Search className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              className="bg-transparent text-sm text-neutral-600 placeholder:text-neutral-400 outline-none w-full"
            />
          </div>
        </div>
      )}

      {/* Nav Items */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : ""}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-150",
                isActive
                  ? "bg-amber-50 text-amber-700 font-medium"
                  : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900",
                collapsed && "justify-center px-2"
              )}
            >
              <item.icon className={cn(
                "h-4 w-4 shrink-0",
                isActive ? "text-amber-600" : "text-neutral-400"
              )} />
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && item.badge && (
                <span className="ml-auto text-xs bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-neutral-100 space-y-0.5">
        <Link href="/settings" className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-md text-sm text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-colors",
          collapsed && "justify-center px-2"
        )}>
          <Settings className="h-4 w-4 shrink-0 text-neutral-400" />
          {!collapsed && <span>Settings</span>}
        </Link>
        {onLogout && (
          <button onClick={onLogout} className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-red-500 hover:bg-red-50 transition-colors",
            collapsed && "justify-center px-2"
          )}>
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        )}
        {!collapsed && user && (
          <div className="flex items-center gap-3 px-3 py-2 mt-1 rounded-md bg-neutral-50 border border-neutral-100">
            <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <span className="text-xs font-medium text-amber-700">
                {user.name?.charAt(0)?.toUpperCase() ?? "?"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-neutral-900 truncate">{user.name}</p>
              <p className="text-xs text-neutral-400 truncate">{user.role}</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
          </div>
        )}
      </div>
    </aside>
  );
}
