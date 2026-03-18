"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, MessageSquare, BookOpen, Archive, Settings, LayoutDashboard, GraduationCap } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sidebar, SidebarBody, useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

function generateChatTitle(messages, chatTitle) {
  if (chatTitle) return chatTitle;
  if (!messages || messages.length === 0) return "New chat";
  const first = messages.find((m) => m.role === "user");
  if (!first) return "New chat";
  const title = first.content.slice(0, 40);
  return title.length < first.content.length ? title + "..." : title;
}

function SidebarInner({
  currentSubject,
  currentChatId,
  chatsBySubject,
  userSubjects,
  currentUserEmail,
  yearGroup,
  onNewChat,
  onSwitchChat,
  onSwitchSubject,
  onShowSettings,
  archivedChats,
  menuOpen,
  setMenuOpen,
  onPinChat,
  onArchiveChat,
  onDeleteChat,
}) {
  const { open, animate } = useSidebar();
  const [expandedSubjectId, setExpandedSubjectId] = useState(null);
  const pathname = usePathname();

  const handleSubjectClick = (subject) => {
    onSwitchSubject(subject);
    if (expandedSubjectId === subject.id) {
      setExpandedSubjectId(null);
    } else {
      setExpandedSubjectId(subject.id);
    }
  };

  const labelVisible = !animate || open;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Logo */}
      <div className="flex items-center gap-3 px-2 pb-4 flex-shrink-0">
        <div className="w-8 h-8 bg-[#0071E3] rounded-[8px] flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-white">N</span>
        </div>
        <motion.span
          animate={{ display: labelVisible ? "inline-block" : "none", opacity: labelVisible ? 1 : 0 }}
          className="text-white font-semibold text-[15px] tracking-tight whitespace-nowrap"
        >
          Newton
        </motion.span>
      </div>

      {/* Top links */}
      <div className="flex flex-col gap-0.5 flex-shrink-0">
        {/* New chat */}
        <button
          onClick={onNewChat}
          className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors w-full text-left group"
        >
          <Plus className="w-5 h-5 text-white/40 group-hover:text-white/70 transition-colors flex-shrink-0" strokeWidth={1.75} />
          <motion.span
            animate={{ display: labelVisible ? "inline-block" : "none", opacity: labelVisible ? 1 : 0 }}
            className="text-white/70 text-sm whitespace-nowrap"
          >
            New conversation
          </motion.span>
        </button>

        {/* Dashboard */}
        <Link
          href="/dashboard"
          className={cn("flex items-center gap-3 px-2 py-2 rounded-lg transition-colors group", pathname === "/dashboard" ? "bg-white/8" : "hover:bg-white/5")}
        >
          <LayoutDashboard className={cn("w-5 h-5 flex-shrink-0 transition-colors", pathname === "/dashboard" ? "text-white" : "text-white/40 group-hover:text-white/70")} strokeWidth={1.75} />
          <motion.span
            animate={{ display: labelVisible ? "inline-block" : "none", opacity: labelVisible ? 1 : 0 }}
            className={cn("text-sm whitespace-nowrap", pathname === "/dashboard" ? "text-white font-medium" : "text-white/70")}
          >
            Dashboard
          </motion.span>
        </Link>

        {/* Chat */}
        <Link
          href="/chat"
          className={cn("flex items-center gap-3 px-2 py-2 rounded-lg transition-colors group", pathname?.startsWith("/chat") ? "bg-white/8" : "hover:bg-white/5")}
        >
          <MessageSquare className={cn("w-5 h-5 flex-shrink-0 transition-colors", pathname?.startsWith("/chat") ? "text-white" : "text-white/40 group-hover:text-white/70")} strokeWidth={1.75} />
          <motion.span
            animate={{ display: labelVisible ? "inline-block" : "none", opacity: labelVisible ? 1 : 0 }}
            className={cn("text-sm whitespace-nowrap", pathname?.startsWith("/chat") ? "text-white font-medium" : "text-white/70")}
          >
            Chat
          </motion.span>
        </Link>

        {/* Quizzes */}
        <Link
          href="/quiz"
          className={cn("flex items-center gap-3 px-2 py-2 rounded-lg transition-colors group", pathname?.startsWith("/quiz") ? "bg-white/8" : "hover:bg-white/5")}
        >
          <GraduationCap className={cn("w-5 h-5 flex-shrink-0 transition-colors", pathname?.startsWith("/quiz") ? "text-white" : "text-white/40 group-hover:text-white/70")} strokeWidth={1.75} />
          <motion.span
            animate={{ display: labelVisible ? "inline-block" : "none", opacity: labelVisible ? 1 : 0 }}
            className={cn("text-sm whitespace-nowrap", pathname?.startsWith("/quiz") ? "text-white font-medium" : "text-white/70")}
          >
            Quizzes
          </motion.span>
        </Link>
      </div>

      {/* Divider */}
      <div className="my-3 border-t border-white/6 flex-shrink-0" />

      {/* Subject list */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-0.5 min-h-0">
        {userSubjects.map((subject) => {
          const isActiveSubject = currentSubject === subject.name;
          const isExpanded = expandedSubjectId === subject.id && open;

          const subjectChats = (chatsBySubject[subject.name] || [])
            .filter((c) => c.messages && c.messages.length > 0)
            .sort((a, b) => {
              if (a.pinned && !b.pinned) return -1;
              if (!a.pinned && b.pinned) return 1;
              return new Date(b.date) - new Date(a.date);
            });

          return (
            <div key={subject.id}>
              {/* Subject row */}
              <button
                onClick={() => handleSubjectClick(subject)}
                className={cn(
                  "flex items-center gap-3 px-2 py-2 rounded-lg transition-colors w-full text-left group",
                  isActiveSubject ? "bg-white/8" : "hover:bg-white/5"
                )}
              >
                <BookOpen
                  className={cn(
                    "w-5 h-5 flex-shrink-0 transition-colors",
                    isActiveSubject ? "text-white" : "text-white/40 group-hover:text-white/70"
                  )}
                  strokeWidth={1.75}
                />
                <motion.span
                  animate={{ display: labelVisible ? "inline-block" : "none", opacity: labelVisible ? 1 : 0 }}
                  className={cn(
                    "text-sm flex-1 truncate whitespace-nowrap text-left",
                    isActiveSubject ? "text-white font-medium" : "text-white/70"
                  )}
                >
                  {subject.name}
                  {subject.board && (
                    <span className="ml-1.5 text-white/30 font-normal text-xs">{subject.board}</span>
                  )}
                </motion.span>
              </button>

              {/* Nested chat list — only when expanded and sidebar is open */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="pl-8 pr-1 pt-0.5 pb-1 space-y-0.5">
                      {subjectChats.length === 0 ? (
                        <p className="text-[11px] text-white/30 italic px-2 py-1.5">No conversations yet</p>
                      ) : (
                        subjectChats.map((chat) => (
                          <div
                            key={chat.id}
                            className={`relative group/chat ${menuOpen === `chat-${chat.id}` ? "z-50" : ""}`}
                          >
                            <button
                              onClick={() => onSwitchChat(chat.id)}
                              className={cn(
                                "w-full text-left px-2 py-1.5 rounded-md transition-colors",
                                currentChatId === chat.id ? "bg-white/10" : "hover:bg-white/6"
                              )}
                            >
                              <p
                                className={cn(
                                  "text-[12px] font-medium truncate",
                                  currentChatId === chat.id ? "text-white" : "text-white/60"
                                )}
                              >
                                {generateChatTitle(chat.messages, chat.title)}
                              </p>
                              <p className="text-[10px] text-white/30 mt-0.5">
                                {new Date(chat.date).toLocaleDateString("en-GB", {
                                  day: "numeric",
                                  month: "short",
                                })}
                              </p>
                            </button>

                            {/* Context menu trigger */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpen(menuOpen === `chat-${chat.id}` ? null : `chat-${chat.id}`);
                              }}
                              className="absolute right-0.5 top-1/2 -translate-y-1/2 opacity-0 group-hover/chat:opacity-100 p-1 hover:bg-white/8 rounded transition-all"
                            >
                              <svg className="w-3 h-3 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                              </svg>
                            </button>

                            {/* Context menu */}
                            {menuOpen === `chat-${chat.id}` && (
                              <div
                                className="absolute right-0 top-full mt-1 rounded-xl shadow-lg z-50 min-w-[140px] overflow-hidden"
                                style={{ background: "#333333", border: "1px solid rgba(255,255,255,0.08)" }}
                              >
                                <button
                                  onClick={(e) => onPinChat(subject.name, chat.id, e)}
                                  className="w-full text-left px-3 py-2.5 hover:bg-white/6 text-white/70 text-xs font-medium transition-colors flex items-center gap-2"
                                >
                                  <svg className="w-3.5 h-3.5 text-white/40" fill={chat.pinned ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                    <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6l1 1 1-1v-6h5v-2l-2-2z" />
                                  </svg>
                                  {chat.pinned ? "Unpin" : "Pin"}
                                </button>
                                <button
                                  onClick={(e) => onArchiveChat(subject.name, chat.id, e)}
                                  className="w-full text-left px-3 py-2.5 hover:bg-white/6 text-white/70 text-xs font-medium transition-colors flex items-center gap-2"
                                >
                                  <svg className="w-3.5 h-3.5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                  </svg>
                                  Archive
                                </button>
                                <div style={{ height: "1px", background: "rgba(255,255,255,0.06)" }} />
                                <button
                                  onClick={(e) => onDeleteChat(subject.name, chat.id, e)}
                                  className="w-full text-left px-3 py-2.5 hover:bg-red-500/10 text-red-400 text-xs font-medium transition-colors flex items-center gap-2"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Divider */}
      <div className="my-3 border-t border-white/6 flex-shrink-0" />

      {/* Bottom section */}
      <div className="flex flex-col gap-0.5 flex-shrink-0">
        {/* Archive */}
        <Link
          href="/chat/archive"
          className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors group"
        >
          <Archive className="w-5 h-5 text-white/40 group-hover:text-white/70 transition-colors flex-shrink-0" strokeWidth={1.75} />
          <motion.span
            animate={{ display: labelVisible ? "inline-block" : "none", opacity: labelVisible ? 1 : 0 }}
            className="text-white/70 text-sm whitespace-nowrap"
          >
            Archive
          </motion.span>
        </Link>

        {/* Settings */}
        <button
          onClick={onShowSettings}
          className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors w-full text-left group"
        >
          <Settings className="w-5 h-5 text-white/40 group-hover:text-white/70 transition-colors flex-shrink-0" strokeWidth={1.75} />
          <motion.span
            animate={{ display: labelVisible ? "inline-block" : "none", opacity: labelVisible ? 1 : 0 }}
            className="text-white/70 text-sm whitespace-nowrap"
          >
            Settings
          </motion.span>
        </button>

        {/* User avatar */}
        <div className="flex items-center gap-3 px-2 py-2 mt-1">
          <div className="w-7 h-7 rounded-full bg-[#0071E3] flex items-center justify-center flex-shrink-0">
            <span className="text-[11px] font-bold text-white">
              {currentUserEmail?.[0]?.toUpperCase() || "U"}
            </span>
          </div>
          <motion.span
            animate={{ display: labelVisible ? "inline-block" : "none", opacity: labelVisible ? 1 : 0 }}
            className="text-white/50 text-xs truncate whitespace-nowrap"
          >
            {currentUserEmail || "Account"}
          </motion.span>
        </div>
      </div>
    </div>
  );
}

export default function NewtonSidebar({
  currentSubject,
  currentChatId,
  chatsBySubject,
  userSubjects,
  currentUserEmail,
  yearGroup,
  sidebarOpen,
  setSidebarOpen,
  onNewChat,
  onSwitchChat,
  onSwitchSubject,
  onShowSettings,
  archivedChats,
  showLinkRecommendations,
  setShowLinkRecommendations,
  menuOpen,
  setMenuOpen,
  onPinChat,
  onArchiveChat,
  onDeleteChat,
}) {
  return (
    <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} animate={true}>
      <SidebarBody className="justify-between">
        <SidebarInner
          currentSubject={currentSubject}
          currentChatId={currentChatId}
          chatsBySubject={chatsBySubject}
          userSubjects={userSubjects}
          currentUserEmail={currentUserEmail}
          yearGroup={yearGroup}
          onNewChat={onNewChat}
          onSwitchChat={onSwitchChat}
          onSwitchSubject={onSwitchSubject}
          onShowSettings={onShowSettings}
          archivedChats={archivedChats}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          onPinChat={onPinChat}
          onArchiveChat={onArchiveChat}
          onDeleteChat={onDeleteChat}
        />
      </SidebarBody>
    </Sidebar>
  );
}
