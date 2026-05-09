"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { logout } from "@/lib/appwrite/auth-actions";
import { useChat } from "@/context/chat-context";
import { useProjectStore } from "@/stores/project-store";
import { useUIStore } from "@/stores/ui-store";
import type { Chat, Project } from "@/lib/appwrite/types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Zap,
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
        className={cn(
          "hidden lg:flex border-r border-border bg-secondary flex-col transition-all duration-200 ease-in-out z-20",
          isCollapsed ? "w-[60px]" : "w-72"
        )}
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
        <SheetContent side="left" className="w-72 p-0 bg-secondary border-r border-border">
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
  const { projects, toggleProjectPin } = useProjectStore();
  const [isChatsOpen, setIsChatsOpen] = useState(true);
  const [isProjectsOpen, setIsProjectsOpen] = useState(true);

  const [isCreatingChat, setIsCreatingChat] = useState(false);

  const handlePinChat = async (chatId: string, isPinned: boolean, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Optimistic update
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
      toggleChatPin(chatId, !isPinned); // Rollback
    }
  };

  const handlePinProject = async (projectId: string, isPinned: boolean, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Optimistic update
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
      toggleProjectPin(projectId, !isPinned); // Rollback
    }
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

    // Store a copy for potential rollback if the request fails
    const chatToDelete = chats.find((c) => (c.$id ?? c.id) === chatId);
    if (!chatToDelete) return;

    // 1. Optimistically remove from UI immediately
    removeChat(chatId);

    // 2. If we're currently viewing this chat, redirect to dashboard instantly
    if (pathname === `/dashboard/chat/${chatId}`) {
      router.push("/dashboard");
    }

    try {
      const res = await fetch(`/api/chats/${chatId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete chat on server");
    } catch (err) {
      console.error("Failed to delete chat:", err);
      // 3. Rollback: Add the chat back if the server delete failed
      setChats([chatToDelete, ...chats]);
      alert("Failed to delete chat. Please check your connection.");
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="flex flex-col h-full w-full min-w-0 overflow-hidden">
      {/* Header */}
      <div
        className={cn(
          "p-4 flex items-center justify-between min-w-0 shrink-0",
          isCollapsed && "flex-col gap-4 px-0"
        )}
      >
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-2 group min-w-0",
            isCollapsed && "justify-center w-full"
          )}
        >
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          {!isCollapsed && (
            <span className="text-xl font-light tracking-tight text-foreground truncate">
              Flux
            </span>
          )}
        </Link>

        <div className={cn("flex items-center gap-1 shrink-0", isCollapsed && "flex-col")}>
          <ThemeToggle className="h-8 w-8" />
          {toggleCollapse && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleCollapse}
              className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
            >
              {isCollapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* New Chat Button */}
      <div className={cn("px-4 mb-4 shrink-0", isCollapsed && "px-2")}>
        <Button
          type="button"
          onClick={handleNewChat}
          disabled={isCreatingChat}
          className={cn(
            "w-full justify-start gap-2 bg-card text-foreground border border-border hover:border-primary shadow-stripe-ambient hover:shadow-stripe-elevated transition-all duration-300 rounded-[8px] font-normal",
            isCollapsed && "justify-center px-0 h-10"
          )}
        >
          {isCreatingChat ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <Plus className="h-4 w-4 text-primary" />
          )}
          {!isCollapsed && <span className="truncate">{isCreatingChat ? "Creating..." : "New Chat"}</span>}
        </Button>
      </div>

      {!isCollapsed && <Separator className="bg-border shrink-0" />}

      {/* Main Content */}
      <ScrollArea className={cn("flex-1 w-full min-w-0", isCollapsed && "hidden")}>
        <div className="py-4 px-3 w-full min-w-0 flex flex-col gap-6 overflow-x-hidden">
          {/* Chats section */}
          <div className="w-full min-w-0">
            <div className="px-2 mb-2">
              <button
                type="button"
                onClick={() => setIsChatsOpen(!isChatsOpen)}
                className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground uppercase tracking-[0.05em] hover:text-foreground transition-colors w-full min-w-0"
              >
                {isChatsOpen ? (
                  <ChevronDown className="h-3 w-3 shrink-0" />
                ) : (
                  <ChevronRight className="h-3 w-3 shrink-0" />
                )}
                <span className="truncate">Recent</span>
              </button>
            </div>

            {isChatsOpen && (
              <div className="space-y-0.5 w-full min-w-0">
                {chats.length === 0 ? (
                  <p className="px-2 text-xs text-muted-foreground/60 italic">No history</p>
                ) : (
                  [...chats]
                    .sort((a, b) => {
                      if (a.isPinned && !b.isPinned) return -1;
                      if (!a.isPinned && b.isPinned) return 1;
                      return new Date((b.$updatedAt || b.updatedAt) as string).getTime() - 
                             new Date((a.$updatedAt || a.updatedAt) as string).getTime();
                    })
                    .map((chat) => {
                      const chatId = chat.$id ?? chat.id;
                      const isActive = pathname === `/dashboard/chat/${chatId}`;

                      return (
                        <div
                          key={chatId}
                          className={cn(
                            "group grid grid-cols-[1fr_auto] items-center w-full min-w-0 rounded-[6px] transition-colors duration-150 hover:bg-primary/5 pr-1",
                            isActive && "bg-primary/10"
                          )}
                        >
                          <Link
                            href={`/dashboard/chat/${chatId}`}
                            className="flex min-w-0 items-center gap-2 px-2 py-1.5 rounded-[6px] w-full"
                          >
                            <MessageSquare
                              className={cn(
                                "h-3.5 w-3.5 shrink-0",
                                isActive ? "text-primary" : "text-muted-foreground/60"
                              )}
                            />
                            <span
                              className={cn(
                                "truncate text-[13px] text-muted-foreground group-hover:text-foreground transition-colors",
                                isActive && "text-foreground font-medium"
                              )}
                            >
                              {chat.title}
                            </span>
                          </Link>

                          <div className="flex items-center">
                            <button
                              type="button"
                              onClick={(e) => handlePinChat(chatId, !chat.isPinned, e)}
                              className={cn(
                                "shrink-0 rounded-md p-1.5 transition-all duration-150",
                                chat.isPinned 
                                  ? "text-primary opacity-100" 
                                  : "text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-primary hover:bg-primary/10"
                              )}
                              title={chat.isPinned ? "Unpin chat" : "Pin chat"}
                            >
                              {chat.isPinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteChat(chatId, e)}
                              className="shrink-0 rounded-md p-1.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-500 transition-all duration-150"
                              title="Delete chat"
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
            )}
          </div>

          {/* Projects section */}
          <div className="w-full min-w-0">
            <div className="flex items-center justify-between px-2 mb-2 group gap-2 min-w-0">
              <button
                type="button"
                onClick={() => setIsProjectsOpen(!isProjectsOpen)}
                className="flex-1 flex items-center gap-1 text-[11px] font-medium text-muted-foreground uppercase tracking-[0.05em] hover:text-foreground transition-colors min-w-0"
              >
                {isProjectsOpen ? (
                  <ChevronDown className="h-3 w-3 shrink-0" />
                ) : (
                  <ChevronRight className="h-3 w-3 shrink-0" />
                )}
                <span className="truncate">Projects</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  useProjectStore.getState().setCreateDialogOpen(true);
                }}
                className="p-1 text-muted-foreground opacity-40 transition-all duration-150 shrink-0 hover:text-primary hover:opacity-100 group-hover:opacity-100"
                title="New project"
                aria-label="New project"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            {isProjectsOpen && (
              <div className="space-y-0.5 w-full min-w-0">
                {projects.length === 0 ? (
                  <p className="px-2 text-xs text-muted-foreground/60 italic">No projects</p>
                ) : (
                  [...projects]
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
                            "group grid grid-cols-[1fr_auto] items-center w-full min-w-0 rounded-[6px] transition-colors duration-150 hover:bg-primary/5 pr-1",
                            isActive && "bg-primary/10"
                          )}
                        >
                          <Link
                            href={`/dashboard/projects/${projectId}`}
                            className={cn(
                              "flex items-center gap-2 px-2 py-1.5 rounded-[6px] transition-all duration-150 text-muted-foreground hover:text-foreground min-w-0 w-full",
                              isActive && "bg-primary/10 text-foreground font-medium"
                            )}
                          >
                            <FolderOpen
                              className={cn(
                                "h-3.5 w-3.5 shrink-0",
                                isActive ? "text-primary" : "text-muted-foreground/60"
                              )}
                            />
                            <span className="truncate text-[13px] flex-1 min-w-0">{project.name}</span>
                          </Link>

                          <button
                            type="button"
                            onClick={(e) => handlePinProject(projectId, !project.isPinned, e)}
                            className={cn(
                              "shrink-0 rounded-md p-1.5 transition-all duration-150",
                              project.isPinned 
                                ? "text-primary opacity-100" 
                                : "text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-primary hover:bg-primary/10"
                            )}
                            title={project.isPinned ? "Unpin project" : "Pin project"}
                          >
                            {project.isPinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                          </button>
                        </div>
                      );
                    })
                )}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className={cn("p-4 border-t border-border mt-auto shrink-0", isCollapsed && "px-2")}>
        <div className={cn("flex items-center gap-3 w-full min-w-0", isCollapsed && "flex-col")}>
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary shrink-0">
            {userEmail.charAt(0).toUpperCase()}
          </div>

          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium truncate text-foreground">{userEmail}</p>
            </div>
          )}

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className={cn(
              "h-8 w-8 text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors rounded-full shrink-0",
              isCollapsed && "h-10 w-10"
            )}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}