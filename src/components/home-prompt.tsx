"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "@/context/chat-context";
import { DEFAULT_MODEL } from "@/lib/models";
import {
  Layers,
  Paperclip, Plus, Loader2, Upload, Link as LinkIcon, X, ArrowUp, Globe,
  Users, FolderPlus, FileText, Check, ChevronDown, Ghost,
  Lightbulb, PenLine, Search, Code2, Sparkles
} from "lucide-react";
import Link from "next/link";
import { cn, Attachment } from "@/lib/utils";
import { ModelSelector } from "@/components/chat/model-selector";
import { useProjectStore } from "@/stores/project-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function getGreeting(): { text: string; emoji: string } {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "Good morning", emoji: "☀️" };
  if (hour < 17) return { text: "Good afternoon", emoji: "🌤️" };
  return { text: "Good evening", emoji: "✨" };
}

const SUGGESTION_CHIPS = [
  { label: "Brainstorm", icon: Lightbulb, prompt: "Help me brainstorm ideas for " },
  { label: "Write", icon: PenLine, prompt: "Help me write " },
  { label: "Research", icon: Search, prompt: "Research and summarize " },
  { label: "Code", icon: Code2, prompt: "Write code that " },
  { label: "Surprise me", icon: Sparkles, prompt: "" },
];

const SURPRISE_PROMPTS = [
  "Tell me something fascinating that most people don't know about.",
  "What's a thought-provoking philosophical question worth exploring?",
  "Describe an underrated piece of technology that changed the world.",
  "What's the most creative solution to a problem you can think of?",
  "Teach me something interesting in under 200 words.",
];

interface HomePromptProps {
  userName?: string;
  userTier?: string;
}

export function HomePrompt({ userName, userTier }: HomePromptProps) {
  const [content, setContent] = useState("");
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(true);
  const [isIncognito, setIsIncognito] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0, offset: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { chats, setChats } = useChat();

  const greeting = getGreeting();
  const hasContent = content.trim().length > 0 || attachments.length > 0;

  // Auto-resize textarea
  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, []);

  useEffect(() => {
    autoResize();
  }, [content, autoResize]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("chatId", "new-chat");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Upload failed with status ${res.status}`);
      }
      const { url } = await res.json();
      setAttachments((prev) => [...prev, { name: file.name, url }]);
    } catch (err: any) {
      console.error("Upload failed:", err);
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (url: string) => {
    setAttachments((prev) => prev.filter((a) => a.url !== url));
  };

  const handleSubmit = async (text: string = content) => {
    const trimmedContent = text.trim();
    if (!trimmedContent && attachments.length === 0) return;
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      let chatWithId: any;
      
      if (isIncognito) {
        chatWithId = {
          id: `incognito-${Date.now()}`,
          title: "Incognito Chat",
          model,
          isIncognito: true
        };
      } else {
        const createRes = await fetch("/api/chats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model }),
        });
        const { chat } = await createRes.json();
        if (!chat) throw new Error("Failed to create chat");
        chatWithId = { ...chat, id: chat.$id ?? chat.id };
        setChats([chatWithId, ...chats]);
      }

      let finalContent = trimmedContent;
      if (attachments.length > 0) {
        const attachmentString = attachments.map((a) => `📎 ${a.name}: ${a.url}`).join("\n");
        finalContent = finalContent ? `${finalContent}\n${attachmentString}` : attachmentString;
      }
      router.push(`/dashboard/chat/${chatWithId.id}?msg=${encodeURIComponent(finalContent)}&ws=${webSearchEnabled ? '1' : '0'}`);
    } catch (err) {
      console.error("Failed to create chat:", err);
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const W = rect.width;
      const H = rect.height;

      const distTop = y;
      const distBottom = H - y;
      const distLeft = x;
      const distRight = W - x;
      const minDist = Math.min(distTop, distBottom, distLeft, distRight);

      let d = 0;
      if (minDist === distTop) d = x;
      else if (minDist === distRight) d = W + y;
      else if (minDist === distBottom) d = W + H + (W - x);
      else d = W + H + W + (H - y);

      const P = 2 * W + 2 * H;
      const offset = d / P;

      setMousePos({ x, y, offset });
    }
    setIsHovered(true);
  };

  const handleChipClick = (chip: typeof SUGGESTION_CHIPS[0]) => {
    if (chip.label === "Surprise me") {
      const randomPrompt = SURPRISE_PROMPTS[Math.floor(Math.random() * SURPRISE_PROMPTS.length)];
      handleSubmit(randomPrompt);
    } else {
      setContent(chip.prompt);
      textareaRef.current?.focus();
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center h-full w-full max-w-2xl mx-auto px-4 pb-16 overflow-hidden">

      {/* ─── Incognito Toggle (Top Right) ─── */}
      <div className="absolute top-4 right-4 md:fixed md:top-6 md:right-6 z-50 flex items-center gap-3">
        <AnimatePresence>
          {isIncognito && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="hidden sm:block text-[11px] md:text-[12px] text-primary/80 font-medium tracking-wide bg-primary/5 px-3 py-1.5 rounded-full border border-primary/10 backdrop-blur-md"
            >
              Chats are not saved
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => setIsIncognito(!isIncognito)}
          className={cn(
            "p-2.5 rounded-full transition-all duration-200 flex items-center justify-center cursor-pointer",
            isIncognito 
              ? "bg-primary/15 text-primary shadow-[0_0_15px_rgba(201,168,76,0.3)]" 
              : "text-muted-foreground/40 hover:text-muted-foreground hover:bg-foreground/[0.05]"
          )}
          title={isIncognito ? "Incognito Mode: ON" : "Incognito Mode: OFF"}
        >
          <Ghost className="h-5 w-5" />
        </button>
      </div>

      {/* ─── Centered Glow (behind input area) ─── */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: "600px",
          height: "400px",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -30%)",
          background: "radial-gradient(ellipse at center, rgba(168,124,62,0.08) 0%, rgba(168,124,62,0.03) 40%, rgba(168,124,62,0) 70%)",
        }}
        aria-hidden="true"
      />

      {/* ─── Key Icon & Time-Aware Greeting ─── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mb-10 text-center flex flex-col items-center select-none"
      >
        {/* Small key icon */}
        <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center mb-5">
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-primary" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" stroke="currentColor">
            <circle cx="12" cy="6" r="4" />
            <circle cx="12" cy="6" r="1.5" />
            <path d="M12 10v11" />
            <path d="M12 17h4v4h-2v-2h-2" />
          </svg>
        </div>

        <h1 className="text-[26px] md:text-[30px] font-light tracking-tight text-foreground leading-normal text-center">
          <span className="mr-2 select-none">{greeting.emoji}</span>
          {greeting.text}{userName ? `, ${userName}` : ""}
          {userTier === "pro" && (
            <span className="ml-3 inline-flex items-center justify-center align-middle px-2 py-0.5 rounded bg-primary/15 border border-primary/20 text-[10px] font-bold text-primary tracking-widest uppercase shadow-[0_0_10px_rgba(201,168,76,0.1)] select-none relative -top-[2px] h-5">
              Pro
            </span>
          )}
        </h1>
      </motion.div>

      {/* ─── Main Input Box ─── */}
      <motion.div
        className="w-full"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          ref={containerRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={() => setIsHovered(false)}
          animate={{
            boxShadow: isFocused
              ? "0 0 0 1px rgba(168,124,62,0.35), 0 0 24px rgba(168,124,62,0.08)"
              : isHovered
              ? "0 0 0 1px rgba(168,124,62,0.2), 0 0 16px rgba(168,124,62,0.05)"
              : "0 0 0 1px rgba(0,0,0,0)",
          }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className={cn(
            "relative flex flex-col rounded-xl bg-card transition-colors duration-200",
            "border",
            isFocused ? "border-primary/40" : isHovered ? "border-primary/25" : "border-border"
          )}
        >
          {/* Directional Flowing Border from Mouse Entry */}
          <AnimatePresence>
            {isHovered && !isFocused && (
              <svg 
                key={`${mousePos.x}-${mousePos.y}`}
                className="absolute inset-0 w-full h-full pointer-events-none z-0" 
                style={{ overflow: "visible" }}
              >
                {/* Clockwise flow */}
                <motion.rect
                  x="0" y="0" width="100%" height="100%"
                  rx="12" ry="12"
                  fill="none"
                  stroke="rgba(201,168,76,0.9)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  initial={{ pathLength: 0.15, pathOffset: mousePos.offset - 0.075, opacity: 0 }}
                  animate={{ pathOffset: mousePos.offset - 0.075 + 0.5, opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
                {/* Counter-clockwise flow */}
                <motion.rect
                  x="0" y="0" width="100%" height="100%"
                  rx="12" ry="12"
                  fill="none"
                  stroke="rgba(201,168,76,0.9)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  initial={{ pathLength: 0.15, pathOffset: mousePos.offset - 0.075, opacity: 0 }}
                  animate={{ pathOffset: mousePos.offset - 0.075 - 0.5, opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
              </svg>
            )}
          </AnimatePresence>

          {/* Attachments */}
          <AnimatePresence>
            {attachments.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-2 px-5 pt-4 pb-1">
                  {attachments.map((file, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-1.5 bg-secondary border border-border rounded-md px-2.5 py-1"
                    >
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-[12px] font-medium text-foreground max-w-[160px] truncate">
                        {file.name}
                      </span>
                      <button
                        onClick={() => removeAttachment(file.url)}
                        className="ml-0.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Ask anything..."
            rows={1}
            className={cn(
              "w-full resize-none bg-transparent",
              "text-[15px] font-light leading-relaxed text-foreground",
              "outline-none placeholder:text-muted-foreground/35",
              "pt-4 px-5 pb-2 scrollbar-thin"
            )}
            style={{ maxHeight: "200px" }}
            disabled={isSubmitting}
          />

          {/* Bottom toolbar */}
          <div className="flex items-center justify-between px-3 pb-3">
            <div className="flex items-center gap-0.5">
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground/50 hover:text-muted-foreground hover:bg-foreground/[0.05] transition-colors cursor-pointer"
                    disabled={uploading || isSubmitting}
                  >
                    {uploading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Paperclip className="h-3.5 w-3.5" />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-popover border-border">
                  <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="cursor-pointer gap-2 text-[13px]">
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload from computer</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer gap-2 text-[13px] opacity-40 pointer-events-none">
                    <FileText className="h-3.5 w-3.5" />
                    <span>Import from project</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer gap-2 text-[13px] opacity-40 pointer-events-none">
                    <LinkIcon className="h-3.5 w-3.5" />
                    <span>Link URL</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Web Search Toggle */}
              <button
                type="button"
                onClick={() => setWebSearchEnabled((prev) => !prev)}
                className={cn(
                  "h-8 w-8 flex items-center justify-center rounded-md transition-colors cursor-pointer",
                  webSearchEnabled
                    ? "text-primary bg-primary/10 hover:bg-primary/15"
                    : "text-muted-foreground/50 hover:text-muted-foreground hover:bg-foreground/[0.05]"
                )}
                title={webSearchEnabled ? "Web Search: ON" : "Web Search: OFF"}
              >
                <Globe className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <ModelSelector
                currentModel={model}
                onModelChange={(newModel) => setModel(newModel as typeof model)}
              />

              <motion.button
                whileHover={hasContent && !isSubmitting ? { scale: 1.05 } : {}}
                whileTap={hasContent && !isSubmitting ? { scale: 0.92 } : {}}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                className={cn(
                  "h-8 w-8 flex items-center justify-center rounded-md transition-all duration-100",
                  hasContent && !isSubmitting
                    ? "bg-primary text-primary-foreground shadow-glow cursor-pointer"
                    : "bg-secondary text-muted-foreground/30 cursor-default"
                )}
                onClick={() => handleSubmit()}
                disabled={!hasContent || isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ArrowUp className="h-3.5 w-3.5" />
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ─── Suggestion Chips ─── */}
      <motion.div
        className="flex flex-wrap items-center justify-center gap-2 mt-5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
      >
        {SUGGESTION_CHIPS.map((chip, i) => {
          const Icon = chip.icon;
          return (
            <motion.button
              key={chip.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.22 + i * 0.04, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => handleChipClick(chip)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-full",
                "text-[12px] font-medium text-muted-foreground/70",
                "border border-border/80 bg-card/50 backdrop-blur-sm",
                "hover:border-primary/30 hover:text-foreground hover:bg-card",
                "transition-all duration-200 cursor-pointer",
                "active:scale-95"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{chip.label}</span>
            </motion.button>
          );
        })}
      </motion.div>

    </div>
  );
}
