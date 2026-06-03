"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MessageCircle, Pin, Search, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Chat } from "@/lib/appwrite/types";

interface ChatsHistoryProps {
  chats: Chat[];
}

function getTimePeriod(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - startOfToday.getDay());

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  if (date >= startOfToday) return "Today";
  if (date >= startOfYesterday) return "Yesterday";
  if (date >= startOfWeek) return "This Week";
  if (date >= startOfMonth) return "This Month";
  return "Older";
}

function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const TIME_PERIOD_ORDER = ["Today", "Yesterday", "This Week", "This Month", "Older"];

export function ChatsHistory({ chats }: ChatsHistoryProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return chats;
    const q = search.toLowerCase();
    return chats.filter(
      (chat) =>
        chat.title.toLowerCase().includes(q) ||
        chat.model.toLowerCase().includes(q)
    );
  }, [chats, search]);

  // Split into pinned and unpinned
  const pinned = useMemo(() => filtered.filter((c) => c.isPinned), [filtered]);
  const unpinned = useMemo(() => filtered.filter((c) => !c.isPinned), [filtered]);

  // Group unpinned by time period
  const grouped = useMemo(() => {
    const groups: Record<string, Chat[]> = {};
    for (const chat of unpinned) {
      const period = getTimePeriod(chat.$updatedAt);
      if (!groups[period]) groups[period] = [];
      groups[period].push(chat);
    }
    return groups;
  }, [unpinned]);

  const orderedPeriods = TIME_PERIOD_ORDER.filter((p) => grouped[p]?.length);

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 lg:px-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className="font-cinzel text-[24px] font-normal tracking-[0.04em] text-foreground">
          Chat History
        </h1>
        <p className="mt-1 text-[12px] text-muted-foreground/60">
          {chats.length} {chats.length === 1 ? "conversation" : "conversations"}
        </p>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
        className="mt-6"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats..."
            className={cn(
              "w-full bg-card border border-border rounded-lg",
              "pl-9 pr-4 py-2.5",
              "text-[14px] font-light text-foreground",
              "placeholder:text-muted-foreground/35",
              "outline-none",
              "focus:border-primary/40 focus:shadow-[0_0_0_1px_rgba(168,124,62,0.3),0_0_16px_rgba(168,124,62,0.1)]",
              "transition-all duration-200"
            )}
          />
        </div>
      </motion.div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mt-20 flex flex-col items-center text-center"
        >
          <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
            <Inbox className="size-5 text-primary/60" />
          </div>
          <p className="text-[14px] text-muted-foreground/60 font-light">
            {search.trim() ? "No chats match your search." : "No conversations yet."}
          </p>
        </motion.div>
      )}

      {/* Pinned Section */}
      {pinned.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="mt-8"
        >
          <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-widest px-1 mb-2">
            Pinned
          </p>
          <div className="space-y-px">
            {pinned.map((chat, i) => (
              <ChatRow key={chat.$id} chat={chat} index={i} showPin />
            ))}
          </div>
        </motion.div>
      )}

      {/* Grouped Sections */}
      {orderedPeriods.map((period, sectionIdx) => (
        <motion.div
          key={period}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.1 + sectionIdx * 0.04 }}
          className="mt-8"
        >
          <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-widest px-1 mb-2">
            {period}
          </p>
          <div className="space-y-px">
            {grouped[period].map((chat, i) => (
              <ChatRow key={chat.$id} chat={chat} index={i} />
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function ChatRow({
  chat,
  index,
  showPin,
}: {
  chat: Chat;
  index: number;
  showPin?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.03, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        href={`/dashboard/chat/${chat.$id}`}
        className={cn(
          "group flex items-center gap-3 px-3 py-2.5 rounded-lg",
          "transition-colors duration-150",
          "hover:bg-foreground/[0.04]"
        )}
      >
        <MessageCircle className="size-3.5 shrink-0 text-muted-foreground/40 group-hover:text-primary transition-colors duration-150" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {showPin && (
              <Pin className="size-2.5 shrink-0 text-primary/70" />
            )}
            <span className="text-[13px] text-foreground truncate group-hover:text-foreground transition-colors">
              {chat.title}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground/50 mt-0.5 truncate">
            {chat.model}
          </p>
        </div>

        <span className="text-[11px] text-muted-foreground/40 shrink-0 tabular-nums">
          {getRelativeTime(chat.$updatedAt)}
        </span>
      </Link>
    </motion.div>
  );
}
