"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { logout } from "@/lib/appwrite/auth-actions";
import { useChat } from "@/context/chat-context";
import { useProjectStore } from "@/stores/project-store";
import { useUIStore } from "@/stores/ui-store";
import type { Chat, Project } from "@/lib/appwrite/types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  MessageSquare,
  FolderOpen,
  LogOut,
  Trash2,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Loader2,
  Pin,
  PinOff,
  Settings,
  RotateCcw,
  X,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";

interface SidebarProviderProps {
  initialChats: Chat[];
  initialProjects: Project[];
  userEmail: string;
  userId: string;
}

export function SidebarProvider({
  initialChats,
  initialProjects,
  userEmail,
  userId,
}: SidebarProviderProps) {
  const { setChats } = useChat();
  const { setProjects } = useProjectStore();
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) {
      setIsCollapsed(saved === "true");
    }
  }, []);

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem("sidebar-collapsed", String(next));
  };

  useEffect(() => {
    setChats(initialChats);
    setProjects(initialProjects);
  }, [initialChats, initialProjects, setChats, setProjects]);

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex border-r border-border bg-card flex-col z-20 overflow-hidden transition-[width] duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
        style={{ width: isCollapsed ? 60 : 272, flexShrink: 0 }}
      >
        <SidebarContent
          userEmail={userEmail}
          userId={userId}
          onClose={() => setSidebarOpen(false)}
          isCollapsed={isCollapsed}
          toggleCollapse={toggleCollapse}
        />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-[272px] p-0 bg-card border-r border-border">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarContent
            userEmail={userEmail}
            userId={userId}
            onClose={() => setSidebarOpen(false)}
            isCollapsed={false}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}

function SidebarContent({
  userEmail,
  userId: _userId,
  onClose,
  isCollapsed,
  toggleCollapse,
}: {
  userEmail: string;
  userId: string;
  onClose: () => void;
  isCollapsed: boolean;
  toggleCollapse?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { chats, removeChat, setChats, toggleChatPin } = useChat();
  const { projects, toggleProjectPin, removeProject, setProjects } = useProjectStore();
  const [isChatsOpen, setIsChatsOpen] = useState(true);
  const [isProjectsOpen, setIsProjectsOpen] = useState(true);
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  // Undo state
  const [localProjects, setLocalProjects] = useState<Project[]>(projects);
  const [undoProject, setUndoProject] = useState<Project | null>(null);
  const [showUndoProject, setShowUndoProject] = useState(false);
  const undoProjectTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [undoChat, setUndoChat] = useState<Chat | null>(null);
  const [showUndoChat, setShowUndoChat] = useState(false);
  const undoChatTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync projects to local state unless we are in the middle of undo flow
  useEffect(() => {
    setLocalProjects(projects);
  }, [projects]);

  const handlePinChat = async (chatId: string, isPinned: boolean, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleChatPin(chatId, isPinned);
    try {
      const res = await fetch(`/api/chats/${chatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned }),
      });
      if (!res.ok) throw new Error("Failed to pin chat");
    } catch (err) {
      console.error("Pin error:", err);
      toggleChatPin(chatId, !isPinned);
    }
  };

  const handlePinProject = async (projectId: string, isPinned: boolean, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleProjectPin(projectId, isPinned);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned }),
      });
      if (!res.ok) throw new Error("Failed to pin project");
    } catch (err) {
      console.error("Pin error:", err);
      toggleProjectPin(projectId, !isPinned);
    }
  };

  const handleDeleteProject = async (projectId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Find project to undo later
    const projectToDelete = localProjects.find(p => (p.$id ?? p.id) === projectId);
    if (!projectToDelete) return;

    // Clear any existing timer
    if (undoProjectTimerRef.current) {
      clearTimeout(undoProjectTimerRef.current);
    }

    // Optimistic UI update
    setLocalProjects((prev) => prev.filter((p) => (p.$id ?? p.id) !== projectId));
    removeProject(projectId);

    if (pathname === `/dashboard/projects/${projectId}`) {
      router.push("/dashboard");
    }

    // Show undo popup
    setUndoProject(projectToDelete);
    setShowUndoProject(true);

    // Set timer for actual deletion
    undoProjectTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Delete failed");
        setShowUndoProject(false);
        setUndoProject(null);
      } catch (err) {
        console.error("Failed to delete project permanently:", err);
        // Optionally revert if it completely fails, but we usually let it silently fail if connection drops
      }
    }, 5000);
  };

  const handleUndoProjectDelete = () => {
    if (!undoProject) return;

    if (undoProjectTimerRef.current) {
      clearTimeout(undoProjectTimerRef.current);
      undoProjectTimerRef.current = null;
    }

    // Restore locally
    const restoredProjects = [undoProject, ...localProjects].sort((a, b) => 
      a.name.localeCompare(b.name)
    );
    setLocalProjects(restoredProjects);
    
    // Restore in global store
    const currentGlobal = useProjectStore.getState().projects;
    if (!currentGlobal.find(p => (p.$id ?? p.id) === (undoProject.$id ?? undoProject.id))) {
      setProjects([undoProject, ...currentGlobal].sort((a, b) => a.name.localeCompare(b.name)));
    }

    setShowUndoProject(false);
    setTimeout(() => setUndoProject(null), 300);
  };

  const handleNewChat = async () => {
    if (isCreatingChat) return;
    setIsCreatingChat(true);
    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const { chat } = await res.json();
      if (chat) {
        const chatWithId = { ...chat, id: chat.$id ?? chat.id };
        setChats([chatWithId, ...chats]);
        router.push(`/dashboard/chat/${chatWithId.id}`);
        onClose();
      }
    } catch (err) {
      console.error("Failed to create chat:", err);
    } finally {
      setIsCreatingChat(false);
    }
  };

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // Find chat to undo later
    const chatToDelete = chats.find((c) => (c.$id ?? (c as any).id) === chatId);
    if (!chatToDelete) return;

    // Clear any existing timer
    if (undoChatTimerRef.current) {
      clearTimeout(undoChatTimerRef.current);
    }

    // Optimistic UI update
    removeChat(chatId);
    if (pathname === `/dashboard/chat/${chatId}`) {
      router.push("/dashboard");
    }

    // Show undo popup
    setUndoChat(chatToDelete);
    setShowUndoChat(true);

    // Set timer for actual deletion
    undoChatTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/chats/${chatId}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Delete failed");
        setShowUndoChat(false);
        setUndoChat(null);
      } catch (err) {
        console.error("Failed to delete chat permanently:", err);
      }
    }, 5000);
  };

  const handleUndoChatDelete = () => {
    if (!undoChat) return;

    if (undoChatTimerRef.current) {
      clearTimeout(undoChatTimerRef.current);
      undoChatTimerRef.current = null;
    }

    // Restore in global store
    if (!chats.find(c => (c.$id ?? (c as any).id) === (undoChat.$id ?? (undoChat as any).id))) {
      setChats([undoChat, ...chats].sort((a, b) => {
        const dateA = new Date(a.$updatedAt).getTime();
        const dateB = new Date(b.$updatedAt).getTime();
        return dateB - dateA;
      }));
    }

    setShowUndoChat(false);
    setTimeout(() => setUndoChat(null), 300);
  };

  const handleLogout = async () => {
    await logout();
  };

  const avatarInitial = userEmail.charAt(0).toUpperCase();

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Header */}
      <div
        className={cn(
          "h-14 flex items-center justify-between px-4 shrink-0 border-b border-border",
          isCollapsed && "justify-center px-0"
        )}
      >
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-2.5 min-w-0",
            isCollapsed && "justify-center"
          )}
          onClick={onClose}
        >
          {/* Roman-inspired key icon */}
          <div className="h-6 w-6 rounded-md bg-primary/15 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 text-primary" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" stroke="currentColor">
              <circle cx="12" cy="6" r="4" />
              <circle cx="12" cy="6" r="1.5" />
              <path d="M12 10v11" />
              <path d="M12 17h4v4h-2v-2h-2" />
            </svg>
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                className="font-cinzel text-[15px] font-normal tracking-[0.05em] text-foreground overflow-hidden whitespace-nowrap"
              >
                Clavis
              </motion.span>
            )}
          </AnimatePresence>
        </Link>

        <div className={cn("flex items-center shrink-0", isCollapsed && "hidden")}>
          <ThemeToggle className="h-7 w-7" />
          {toggleCollapse && (
            <button
              type="button"
              onClick={toggleCollapse}
              className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-foreground/[0.05] transition-colors cursor-pointer"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="h-3.5 w-3.5" />
              ) : (
                <PanelLeftClose className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>

        {/* Collapsed: show expand icon */}
        {isCollapsed && toggleCollapse && (
          <button
            type="button"
            onClick={toggleCollapse}
            className="absolute bottom-auto h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-foreground/[0.05] transition-colors cursor-pointer"
            title="Expand sidebar"
          >
            <PanelLeftOpen className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* New Chat Button */}
      <div className={cn("px-3 py-3 shrink-0", isCollapsed && "px-2")}>
        <motion.button
          type="button"
          onClick={handleNewChat}
          disabled={isCreatingChat}
          whileTap={{ scale: 0.97 }}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-md",
            "text-[13px] font-medium text-muted-foreground",
            "bg-transparent border border-border",
            "hover:border-primary/20 hover:text-foreground hover:bg-foreground/[0.03]",
            "transition-colors duration-150 cursor-pointer",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            isCollapsed && "justify-center px-0"
          )}
        >
          {isCreatingChat ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
          ) : (
            <Plus className="h-3.5 w-3.5 shrink-0" />
          )}
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="truncate"
              >
                {isCreatingChat ? "Creating..." : "New chat"}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Council Link */}
      <div className={cn("px-3 pb-2 shrink-0", isCollapsed && "px-2")}>
        <Link
          href="/dashboard/council"
          onClick={onClose}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-md",
            "text-[13px] font-medium",
            "transition-colors duration-150",
            isCollapsed && "justify-center px-0",
            pathname === "/dashboard/council"
              ? "bg-primary/[0.08] text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]"
          )}
        >
          <Users className="h-3.5 w-3.5 shrink-0" />
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="truncate"
              >
                Council
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Main scrollable content */}
      <ScrollArea className={cn("flex-1 w-full min-w-0", isCollapsed && "hidden")}>
        <div className="px-2 pb-4 space-y-5">

          {/* Chats section */}
          <div>
            <button
              type="button"
              onClick={() => setIsChatsOpen(!isChatsOpen)}
              className="flex items-center gap-1 px-2 py-1 w-full text-[10px] font-medium text-muted-foreground/60 uppercase tracking-widest hover:text-muted-foreground transition-colors cursor-pointer"
            >
              {isChatsOpen ? (
                <ChevronDown className="h-2.5 w-2.5" />
              ) : (
                <ChevronRight className="h-2.5 w-2.5" />
              )}
              <span>Recent</span>
            </button>

            <AnimatePresence>
              {isChatsOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden mt-0.5"
                >
                  <div className="space-y-px">
                    {chats.length === 0 ? (
                      <p className="px-2 py-1.5 text-[12px] text-muted-foreground/40 italic">
                        No chats yet
                      </p>
                    ) : (
                      [...chats]
                        .sort((a, b) => {
                          if (a.isPinned && !b.isPinned) return -1;
                          if (!a.isPinned && b.isPinned) return 1;
                          return (
                            new Date((b.$updatedAt || b.updatedAt) as string).getTime() -
                            new Date((a.$updatedAt || a.updatedAt) as string).getTime()
                          );
                        })
                        .map((chat) => {
                          const chatId = chat.$id ?? chat.id;
                          const isActive = pathname === `/dashboard/chat/${chatId}`;

                          return (
                            <div
                              key={chatId}
                              className={cn(
                                "group relative flex items-center rounded-md transition-colors duration-100 h-8",
                                isActive
                                  ? "bg-primary/[0.08] dark:bg-primary/[0.08]"
                                  : "hover:bg-foreground/[0.04] dark:hover:bg-foreground/[0.04]"
                              )}
                            >
                              {/* Active indicator bar */}
                              {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-primary rounded-r-full" />
                              )}

                              {/* Chat link — takes full width, text truncates */}
                              <Link
                                href={`/dashboard/chat/${chatId}`}
                                className="flex items-center gap-2 pl-2 pr-12 py-1.5 absolute inset-0 min-w-0"
                              >
                                <MessageSquare
                                  className={cn(
                                    "h-3.5 w-3.5 shrink-0",
                                    isActive ? "text-primary" : "text-muted-foreground/40"
                                  )}
                                />
                                <span
                                  className={cn(
                                    "truncate text-[13px] leading-tight",
                                    isActive
                                      ? "text-foreground font-medium"
                                      : "text-muted-foreground group-hover:text-foreground transition-colors"
                                  )}
                                >
                                  {chat.title}
                                </span>
                              </Link>

                              {/* Action buttons — positioned on the right, with bg to mask text */}
                              <div
                                className={cn(
                                  "absolute right-0 top-0 bottom-0 flex items-center gap-0.5 pr-1 pl-8 z-10",
                                  "transition-opacity duration-150",
                                  // Gradient mask from transparent to surface
                                  isActive
                                    ? "bg-gradient-to-l from-card from-70% via-card to-transparent"
                                    : "bg-gradient-to-l from-card from-70% via-card to-transparent",
                                  // Always visible if pinned, otherwise hover-only
                                  chat.isPinned
                                    ? "opacity-100"
                                    : "opacity-0 group-hover:opacity-100"
                                )}
                              >
                                <button
                                  type="button"
                                  onClick={(e) => handlePinChat(chatId, !chat.isPinned, e)}
                                  className={cn(
                                    "h-6 w-6 flex items-center justify-center rounded transition-colors cursor-pointer",
                                    chat.isPinned
                                      ? "text-primary hover:text-primary/70"
                                      : "text-muted-foreground/50 hover:text-muted-foreground"
                                  )}
                                  title={chat.isPinned ? "Unpin" : "Pin"}
                                >
                                  {chat.isPinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteChat(chatId, e)}
                                  className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground/50 hover:text-red-400 transition-colors cursor-pointer"
                                  title="Delete"
                                  aria-label="Delete chat"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Projects section */}
          <div>
            <div className="flex items-center justify-between px-2 py-1">
              <button
                type="button"
                onClick={() => setIsProjectsOpen(!isProjectsOpen)}
                className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground/60 uppercase tracking-widest hover:text-muted-foreground transition-colors cursor-pointer"
              >
                {isProjectsOpen ? (
                  <ChevronDown className="h-2.5 w-2.5" />
                ) : (
                  <ChevronRight className="h-2.5 w-2.5" />
                )}
                <span>Projects</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  useProjectStore.getState().setCreateDialogOpen(true);
                }}
                className="p-0.5 text-muted-foreground/40 hover:text-muted-foreground transition-colors cursor-pointer"
                title="New project"
                aria-label="New project"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            <AnimatePresence>
              {isProjectsOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden mt-0.5"
                >
                  <div className="space-y-px">
                    {projects.length === 0 ? (
                      <p className="px-2 py-1.5 text-[12px] text-muted-foreground/40 italic">
                        No projects
                      </p>
                    ) : (
                      [...localProjects]
                        .sort((a, b) => {
                          if (a.isPinned && !b.isPinned) return -1;
                          if (!a.isPinned && b.isPinned) return 1;
                          return a.name.localeCompare(b.name);
                        })
                        .map((project) => {
                          const projectId = project.$id ?? project.id;
                          const isActive = pathname === `/dashboard/projects/${projectId}`;

                          return (
                            <div
                              key={projectId}
                              className={cn(
                                "group relative flex items-center rounded-md transition-colors duration-100 h-8",
                                isActive
                                  ? "bg-primary/[0.08]"
                                  : "hover:bg-foreground/[0.04]"
                              )}
                            >
                              {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-primary rounded-r-full" />
                              )}

                              {/* Project link — full width, text truncates */}
                              <Link
                                href={`/dashboard/projects/${projectId}`}
                                className="flex items-center gap-2 pl-2 pr-10 py-1.5 absolute inset-0 min-w-0"
                              >
                                <FolderOpen
                                  className={cn(
                                    "h-3.5 w-3.5 shrink-0",
                                    isActive ? "text-primary" : "text-muted-foreground/40"
                                  )}
                                />
                                <span
                                  className={cn(
                                    "truncate text-[13px] leading-tight",
                                    isActive
                                      ? "text-foreground font-medium"
                                      : "text-muted-foreground group-hover:text-foreground transition-colors"
                                  )}
                                >
                                  {project.name}
                                </span>
                              </Link>

                              {/* Pin button — absolute right with gradient mask */}
                              <div
                                className={cn(
                                  "absolute right-0 top-0 bottom-0 flex items-center pr-1 pl-8 z-10",
                                  "transition-opacity duration-150",
                                  isActive
                                    ? "bg-gradient-to-l from-card from-70% via-card to-transparent"
                                    : "bg-gradient-to-l from-card from-70% via-card to-transparent",
                                  project.isPinned
                                    ? "opacity-100"
                                    : "opacity-0 group-hover:opacity-100"
                                )}
                              >
                                <button
                                  type="button"
                                  onClick={(e) => handlePinProject(projectId, !project.isPinned, e)}
                                  className={cn(
                                    "h-6 w-6 flex items-center justify-center rounded transition-colors cursor-pointer",
                                    project.isPinned
                                      ? "text-primary hover:text-primary/70"
                                      : "text-muted-foreground/50 hover:text-muted-foreground"
                                  )}
                                  title={project.isPinned ? "Unpin" : "Pin"}
                                >
                                  {project.isPinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteProject(projectId, e)}
                                  className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground/50 hover:text-red-400 transition-colors cursor-pointer"
                                  title="Delete"
                                  aria-label="Delete project"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className={cn(
        "mt-auto px-3 py-3 border-t border-border shrink-0",
        isCollapsed && "px-2"
      )}>
        <div className={cn(
          "flex items-center gap-2.5 min-w-0",
          isCollapsed && "flex-col gap-2"
        )}>
          {/* Avatar */}
          <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center text-[11px] font-semibold text-primary shrink-0">
            {avatarInitial}
          </div>

          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="flex-1 min-w-0"
              >
                <p className="text-[12px] font-medium truncate text-foreground">{userEmail}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className={cn("flex items-center gap-1 shrink-0", isCollapsed && "flex-col")}>
            <Link
              href="/dashboard/settings"
              className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-foreground/[0.05] transition-colors cursor-pointer"
              title="Settings"
            >
              <Settings className="h-3.5 w-3.5" />
            </Link>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-foreground/[0.05] transition-colors rounded-md cursor-pointer"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Global Undo Popups (Project & Chat) */}
        <div 
          className={cn(
            "fixed bottom-6 right-6 z-50 flex flex-col gap-3 items-end transition-all duration-300 transform",
            (showUndoProject || showUndoChat) ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"
          )}
        >
          {/* Project Undo Popup */}
          {showUndoProject && (
            <div className="bg-card text-foreground border border-border/50 px-4 py-3 rounded-xl shadow-2xl flex items-center justify-between gap-4 text-sm min-w-[280px] max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-[13px]">Project deleted</span>
                <span className="text-[11px] text-muted-foreground truncate">{undoProject?.name}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0 border-l border-border/30 pl-4">
                <button
                  onClick={handleUndoProjectDelete}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-foreground/[0.05] text-primary rounded-lg transition-colors text-[13px] font-semibold"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Undo
                </button>
                <button
                  onClick={() => setShowUndoProject(false)}
                  className="p-1.5 hover:bg-foreground/[0.05] rounded-lg transition-colors text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Chat Undo Popup */}
          {showUndoChat && (
            <div className="bg-card text-foreground border border-border/50 px-4 py-3 rounded-xl shadow-2xl flex items-center justify-between gap-4 text-sm min-w-[280px] max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-[13px]">Chat deleted</span>
                <span className="text-[11px] text-muted-foreground truncate">{undoChat?.title}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0 border-l border-border/30 pl-4">
                <button
                  onClick={handleUndoChatDelete}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-foreground/[0.05] text-primary rounded-lg transition-colors text-[13px] font-semibold"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Undo
                </button>
                <button
                  onClick={() => setShowUndoChat(false)}
                  className="p-1.5 hover:bg-foreground/[0.05] rounded-lg transition-colors text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}