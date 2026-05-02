"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { logout } from "@/lib/appwrite/auth-actions";
import { useChatStore } from "@/stores/chat-store";
import { useProjectStore } from "@/stores/project-store";
import { useUIStore } from "@/stores/ui-store";
import { getModelInfo } from "@/lib/models";
import type { Chat, Project } from "@/lib/appwrite/types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Plus,
  MessageSquare,
  FolderOpen,
  LogOut,
  Trash2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";

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
  const { chats, setChats } = useChatStore();
  const { projects, setProjects } = useProjectStore();
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  useEffect(() => {
    setChats(initialChats);
    setProjects(initialProjects);
  }, [initialChats, initialProjects, setChats, setProjects]);

  const sidebarContent = (
    <SidebarContent
      chats={chats}
      projects={projects}
      userEmail={userEmail}
      userId={userId}
      onClose={() => setSidebarOpen(false)}
    />
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-72 border-r border-[#1e1a2e] bg-[#0f0d1a]/80 backdrop-blur-[12px] flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          {sidebarContent}
        </SheetContent>
      </Sheet>
    </>
  );
}

function SidebarContent({
  chats,
  projects,
  userEmail,
  userId,
  onClose,
}: {
  chats: Chat[];
  projects: Project[];
  userEmail: string;
  userId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { removeChat } = useChatStore();
  const [isChatsOpen, setIsChatsOpen] = useState(true);
  const [isProjectsOpen, setIsProjectsOpen] = useState(true);

  const handleNewChat = async () => {
    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const { chat } = await res.json();
      if (chat) {
        // Appwrite returns $id, map it
        const chatWithId = { ...chat, id: chat.$id ?? chat.id };
        useChatStore.getState().setChats([chatWithId, ...useChatStore.getState().chats]);
        router.push(`/dashboard/chat/${chatWithId.id}`);
        onClose();
      }
    } catch (err) {
      console.error("Failed to create chat:", err);
    }
  };

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await fetch(`/api/chats/${chatId}`, { method: "DELETE" });
      removeChat(chatId);
      if (pathname === `/dashboard/chat/${chatId}`) {
        router.push("/dashboard");
      }
    } catch (err) {
      console.error("Failed to delete chat:", err);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-[#c9a84c]/10 flex items-center justify-center">
          <Zap className="h-5 w-5 text-[#c9a84c]" />
        </div>
        <span className="text-xl font-bold text-[#c9a84c] drop-shadow-[0_0_8px_rgba(201,168,76,0.3)]">
          Flux
        </span>
      </div>

      {/* New Chat Button */}
      <div className="px-3 mb-2">
        <Button
          onClick={handleNewChat}
          className="w-full justify-start gap-2 bg-gradient-to-r from-[#7c3aed] to-[#a78bfa] border border-transparent hover:border-[#c9a84c] transition-all duration-200 text-[#f5f0ff]"
          id="new-chat-button"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      <Separator />

      {/* Chat List */}
      <ScrollArea className="flex-1 px-2">
        <div className="py-2">
          <div className="flex items-center justify-between px-2 mb-2">
            <button 
              onClick={() => setIsChatsOpen(!isChatsOpen)}
              className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-[#f5f0ff] transition-colors"
            >
              {isChatsOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              Recent Chats
            </button>
            <button
              onClick={handleNewChat}
              className="p-1 hover:bg-[#7c3aed]/20 rounded-full text-muted-foreground hover:text-[#c9a84c] transition-colors"
              aria-label="New Chat"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
          {isChatsOpen && (
            chats.length === 0 ? (
            <p className="px-2 text-sm text-muted-foreground">
              No chats yet
            </p>
          ) : (
            <div className="space-y-0.5">
              {chats.map((chat, index) => {
                const chatId = chat.$id ?? chat.id;
                const isActive =
                  pathname === `/dashboard/chat/${chatId}`;
                return (
                  <Link
                    key={chatId}
                    href={`/dashboard/chat/${chatId}`}
                    onClick={onClose}
                    style={{ animationDelay: `${index * 50}ms` }}
                    className={cn(
                      "group flex items-center gap-2 px-2 py-2 rounded-full text-base transition-all duration-150 hover:bg-[#7c3aed]/10 hover:shadow-[0_0_12px_rgba(124,58,237,0.1)] animate-slide-in-left opacity-0",
                      isActive && "bg-[#7c3aed]/10"
                    )}
                  >
                    <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium">
                        {chat.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground">
                          {formatTime(chat.$updatedAt ?? "")}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteChat(chatId, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-destructive"
                      aria-label="Delete chat"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </Link>
                );
              })}
            </div>
          )
          )}
        </div>

        <Separator className="my-2" />

        {/* Projects */}
        <div className="py-2">
          <div className="flex items-center justify-between px-2 mb-2">
            <button 
              onClick={() => setIsProjectsOpen(!isProjectsOpen)}
              className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-[#f5f0ff] transition-colors"
            >
              {isProjectsOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              Projects
            </button>
            <Link
              href="/dashboard/projects"
              onClick={onClose}
              className="p-1 hover:bg-[#7c3aed]/20 rounded-full text-muted-foreground hover:text-[#c9a84c] transition-colors"
              aria-label="New Project"
            >
              <Plus className="h-3 w-3" />
            </Link>
          </div>
          {isProjectsOpen && (
            projects.length === 0 ? (
            <p className="px-2 text-sm text-muted-foreground">
              No projects
            </p>
          ) : (
            <div className="space-y-0.5">
              {projects.map((project, index) => {
                const projectId = project.$id ?? project.id;
                return (
                  <Link
                    key={projectId}
                    href={`/dashboard/projects/${projectId}`}
                    onClick={onClose}
                    style={{ animationDelay: `${(chats.length + index) * 50}ms` }}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded-full text-base transition-all duration-150 hover:bg-[#7c3aed]/10 hover:shadow-[0_0_12px_rgba(124,58,237,0.1)] animate-slide-in-left opacity-0",
                      pathname ===
                        `/dashboard/projects/${projectId}` &&
                        "bg-[#7c3aed]/10"
                    )}
                  >
                    <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{project.name}</span>
                  </Link>
                );
              })}
            </div>
          )
          )}
        </div>
      </ScrollArea>

      <Separator />

      {/* User section */}
      <div className="p-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium text-primary">
            {userEmail.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{userEmail}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            id="logout-button"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
