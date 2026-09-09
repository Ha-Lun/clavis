"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { logout } from "@/lib/appwrite/auth-actions";
import { useChat } from "@/context/chat-context";
import { useProjectStore } from "@/stores/project-store";
import { useUIStore } from "@/stores/ui-store";
import type { Chat, Project } from "@/lib/appwrite/types";
import { Button } from "@/components/ui/button";
import {
  Plus,
  MessageCircle,
  FolderOpen,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Users,
  BookOpen,
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
  const [isCollapsed, setIsCollapsed] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) {
      setIsCollapsed(saved === "true");
    } else {
      setIsCollapsed(true);
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

  const handleNewChat = () => {
    router.push(`/dashboard/chat/new`);
    onClose();
  };

  const handleLogout = async () => {
    await logout();
  };

  const avatarInitial = userEmail.charAt(0).toUpperCase();

  return (
    <div className="flex flex-col size-full overflow-hidden">
      {/* Header */}
      <div
        className={cn(
          "h-14 flex items-center justify-between px-4 shrink-0 border-b border-border relative group/header",
          isCollapsed && "justify-center px-0"
        )}
      >
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-2.5 min-w-0 transition-all duration-200",
            isCollapsed && "justify-center group-hover/header:opacity-0 group-hover/header:scale-75 group-hover/header:pointer-events-none"
          )}
          onClick={onClose}
        >
          {/* Roman-inspired key icon */}
          <div className="size-6 rounded-md bg-primary/15 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" fill="none" className="size-3.5 text-primary" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" stroke="currentColor">
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
          <ThemeToggle className="size-7" />
          {toggleCollapse && (
            <button
              type="button"
              onClick={toggleCollapse}
              className="size-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-foreground/[0.05] transition-colors cursor-pointer"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="size-3.5" />
              ) : (
                <PanelLeftClose className="size-3.5" />
              )}
            </button>
          )}
        </div>

        {/* Collapsed: show expand icon on hover */}
        {isCollapsed && toggleCollapse && (
          <button
            type="button"
            onClick={toggleCollapse}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-foreground/[0.05] transition-all duration-200 opacity-0 scale-75 pointer-events-none group-hover/header:opacity-100 group-hover/header:scale-100 group-hover/header:pointer-events-auto cursor-pointer"
            title="Expand sidebar"
          >
            <PanelLeftOpen className="size-3.5" />
          </button>
        )}
      </div>

      {/* Navigation Content */}
      <div className={cn("flex-1 overflow-y-auto w-full min-w-0 py-4 space-y-1", isCollapsed ? "px-2" : "px-3")}>
        {/* New Chat */}
        <motion.button
          type="button"
          onClick={handleNewChat}
          whileTap={{ scale: 0.97 }}
          className={cn(
            "flex items-center transition-colors duration-150 cursor-pointer bg-transparent border",
            "hover:text-foreground hover:bg-foreground/[0.03]",
            isCollapsed 
              ? "justify-center size-9 mx-auto rounded-md border-border hover:border-primary/20 mb-4" 
              : "w-full gap-2 px-3 py-2 rounded-md text-[13px] font-medium text-muted-foreground border-border hover:border-primary/20 mb-4"
          )}
          title="New chat"
        >
          <Plus className="size-3.5 shrink-0" />
          {!isCollapsed && <span className="truncate">New chat</span>}
        </motion.button>

        {/* Chats Link */}
        <Link
          href="/dashboard/chats"
          onClick={onClose}
          className={cn(
            "flex items-center transition-colors duration-150",
            isCollapsed 
              ? "justify-center size-9 mx-auto rounded-full" 
              : "w-full gap-2 px-3 py-2 rounded-md text-[13px] font-medium",
            pathname === "/dashboard/chats" || pathname.startsWith("/dashboard/chat/")
              ? "bg-primary/[0.08] text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]"
          )}
          title="Chats"
        >
          <MessageCircle className={isCollapsed ? "size-4 shrink-0" : "size-3.5 shrink-0"} />
          {!isCollapsed && <span className="truncate">Chats</span>}
        </Link>

        {/* Projects Link */}
        <Link
          href="/dashboard/projects"
          onClick={onClose}
          className={cn(
            "flex items-center transition-colors duration-150",
            isCollapsed 
              ? "justify-center size-9 mx-auto rounded-full" 
              : "w-full gap-2 px-3 py-2 rounded-md text-[13px] font-medium",
            pathname === "/dashboard/projects" || pathname.startsWith("/dashboard/projects/")
              ? "bg-primary/[0.08] text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]"
          )}
          title="Projects"
        >
          <FolderOpen className={isCollapsed ? "size-3.5 shrink-0" : "size-3.5 shrink-0"} />
          {!isCollapsed && <span className="truncate">Projects</span>}
        </Link>

        {/* My Courses Link */}
        <Link
          href="/dashboard/courses"
          onClick={onClose}
          className={cn(
            "flex items-center transition-colors duration-150",
            isCollapsed 
              ? "justify-center size-9 mx-auto rounded-full" 
              : "w-full gap-2 px-3 py-2 rounded-md text-[13px] font-medium",
            pathname === "/dashboard/courses" || pathname.startsWith("/dashboard/courses/")
              ? "bg-primary/[0.08] text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]"
          )}
          title="My Courses"
        >
          <BookOpen className={isCollapsed ? "size-4 shrink-0" : "size-3.5 shrink-0"} />
          {!isCollapsed && <span className="truncate">My Courses</span>}
        </Link>

        {/* Model Council Link */}
        <Link
          href="/dashboard/council"
          onClick={onClose}
          className={cn(
            "flex items-center transition-colors duration-150",
            isCollapsed 
              ? "justify-center size-9 mx-auto rounded-full" 
              : "w-full gap-2 px-3 py-2 rounded-md text-[13px] font-medium",
            pathname === "/dashboard/council"
              ? "bg-primary/[0.08] text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]"
          )}
          title="Model Council"
        >
          <Users className={isCollapsed ? "size-4 shrink-0" : "size-3.5 shrink-0"} />
          {!isCollapsed && <span className="truncate">Model Council</span>}
        </Link>
      </div>

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
          <div className="size-7 rounded-full bg-primary/15 flex items-center justify-center text-[11px] font-semibold text-primary shrink-0">
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
                <div className="flex items-center gap-2">
                  <p className="text-[12px] font-medium truncate text-foreground">{userEmail}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className={cn("flex items-center gap-1 shrink-0", isCollapsed && "flex-col")}>
            <Link
              href="/dashboard/settings"
              className="size-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-foreground/[0.05] transition-colors cursor-pointer"
              title="Settings"
            >
              <Settings className="size-3.5" />
            </Link>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="size-7 text-muted-foreground hover:text-foreground hover:bg-foreground/[0.05] transition-colors rounded-md cursor-pointer"
              title="Sign out"
            >
              <LogOut className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
