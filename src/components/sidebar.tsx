"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { logout } from "@/lib/appwrite/auth-actions";
import { useChatStore } from "@/stores/chat-store";
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
  const { setChats } = useChatStore();
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
  const { chats, removeChat } = useChatStore();
  const { projects } = useProjectStore();
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

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className={cn(
        "p-4 flex items-center justify-between",
        isCollapsed && "flex-col gap-4 px-0"
      )}>
        <Link 
          href="/dashboard" 
          className={cn(
            "flex items-center gap-2 group",
            isCollapsed && "justify-center w-full"
          )}
        >
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          {!isCollapsed && (
            <span className="text-xl font-light tracking-tight text-foreground">
              Flux
            </span>
          )}
        </Link>
        
        <div className={cn("flex items-center gap-1", isCollapsed && "flex-col")}>
          <ThemeToggle className="h-8 w-8" />
          {toggleCollapse && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCollapse}
              className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
            >
              {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>

      {/* New Chat Button */}
      <div className={cn("px-4 mb-4", isCollapsed && "px-2")}>
        <Button
          onClick={handleNewChat}
          className={cn(
            "w-full justify-start gap-2 bg-card text-foreground border border-border hover:border-primary shadow-stripe-ambient hover:shadow-stripe-elevated transition-all duration-300 rounded-[8px] font-normal",
            isCollapsed && "justify-center px-0 h-10"
          )}
        >
          <Plus className="h-4 w-4 text-primary" />
          {!isCollapsed && <span>New Chat</span>}
        </Button>
      </div>

      {!isCollapsed && <Separator className="bg-border" />}

      {/* Main Content */}
      <ScrollArea className={cn("flex-1 px-3", isCollapsed && "hidden")}>
        <div className="py-4">
          {/* Chats section */}
          <div className="mb-6">
            <div className="flex items-center justify-between px-2 mb-2 group">
              <button 
                onClick={() => setIsChatsOpen(!isChatsOpen)}
                className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground uppercase tracking-[0.05em] hover:text-foreground transition-colors"
              >
                {isChatsOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                Recent
              </button>
            </div>
            {isChatsOpen && (
              <div className="space-y-0.5">
                {chats.length === 0 ? (
                  <p className="px-2 text-xs text-muted-foreground/60 italic">No history</p>
                ) : (
                  chats.map((chat) => {
                    const chatId = chat.$id ?? chat.id;
                    const isActive = pathname === `/dashboard/chat/${chatId}`;
                    return (
                      <Link
                        key={chatId}
                        href={`/dashboard/chat/${chatId}`}
                        className={cn(
                          "group flex items-center gap-2 px-2 py-1.5 rounded-[6px] text-[13px] transition-all duration-150 text-muted-foreground hover:bg-primary/5 hover:text-foreground",
                          isActive && "bg-primary/10 text-foreground font-medium"
                        )}
                      >
                        <MessageSquare className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-primary" : "text-muted-foreground/60")} />
                        <span className="flex-1 truncate">{chat.title}</span>
                        <button
                          onClick={(e) => handleDeleteChat(chatId, e)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-muted-foreground hover:text-accent"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </Link>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Projects section */}
          <div>
            <div className="flex items-center justify-between px-2 mb-2">
              <button 
                onClick={() => setIsProjectsOpen(!isProjectsOpen)}
                className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground uppercase tracking-[0.05em] hover:text-foreground transition-colors"
              >
                {isProjectsOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                Projects
              </button>
            </div>
            {isProjectsOpen && (
              <div className="space-y-0.5">
                {projects.length === 0 ? (
                  <p className="px-2 text-xs text-muted-foreground/60 italic">No projects</p>
                ) : (
                  projects.map((project) => {
                    const projectId = project.$id ?? project.id;
                    const isActive = pathname === `/dashboard/projects/${projectId}`;
                    return (
                      <Link
                        key={projectId}
                        href={`/dashboard/projects/${projectId}`}
                        className={cn(
                          "flex items-center gap-2 px-2 py-1.5 rounded-[6px] text-[13px] transition-all duration-150 text-muted-foreground hover:bg-primary/5 hover:text-foreground",
                          isActive && "bg-primary/10 text-foreground font-medium"
                        )}
                      >
                        <FolderOpen className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-primary" : "text-muted-foreground/60")} />
                        <span className="truncate">{project.name}</span>
                      </Link>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className={cn("p-4 border-t border-border mt-auto", isCollapsed && "px-2")}>
        <div className={cn("flex items-center gap-3", isCollapsed && "flex-col")}>
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary shrink-0">
            {userEmail.charAt(0).toUpperCase()}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium truncate text-foreground">{userEmail}</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className={cn("h-8 w-8 text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors rounded-full", isCollapsed && "h-10 w-10")}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
