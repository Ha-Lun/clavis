"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@/context/chat-context";
import { DEFAULT_MODEL } from "@/lib/models";
import { Button } from "@/components/ui/button";
import { Send, Sparkles, Code, FileText, Lightbulb, Mail, Bug, Paperclip, Plus, Loader2, Upload, Link as LinkIcon, X } from "lucide-react";
import { cn, Attachment } from "@/lib/utils";
import { ModelSelector } from "@/components/chat/model-selector";
import { useProjectStore } from "@/stores/project-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence, useMotionValue, useMotionTemplate } from "framer-motion";

const SUGGESTIONS = [
  { icon: Sparkles, label: "Explain a concept" },
  { icon: Code, label: "Write some code" },
  { icon: FileText, label: "Summarise a document" },
  { icon: Lightbulb, label: "Brainstorm ideas" },
  { icon: Mail, label: "Draft an email" },
  { icon: Bug, label: "Debug my code" },
];

function FluidCard({
  children,
  onClick,
  className,
  disabled,
  ...props
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.button
      onMouseMove={handleMouseMove}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative group overflow-hidden flex flex-col items-start gap-4 p-5 text-left glass-card border border-glass-border rounded-luxury-md transition-all duration-300 outline-none w-full cursor-pointer select-none",
        className
      )}
      whileHover={{ y: -4, scale: 1.02, borderColor: "rgba(197, 160, 89, 0.4)", boxShadow: "0 12px 24px -10px rgba(197, 160, 89, 0.08)" }}
      whileTap={{ scale: 0.98 }}
      {...props}
    >
      {/* Wave glow background that tracks mouse */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-luxury-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              160px circle at ${mouseX}px ${mouseY}px,
              rgba(197, 160, 89, 0.08) 0%,
              rgba(83, 58, 253, 0.03) 60%,
              transparent 100%
            )
          `,
        }}
      />
      
      {/* Animated fluid wave contour line inside card */}
      <div className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <svg className="w-full h-full fill-gold/15 animate-wave-flow" viewBox="0 0 100 10" preserveAspectRatio="none">
          <path d="M0,5 C30,8 70,2 100,5 L100,10 L0,10 Z" />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col gap-3 w-full h-full">
        {children}
      </div>
    </motion.button>
  );
}

export function HomePrompt() {
  const [content, setContent] = useState("");
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { chats, setChats } = useChat();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      // We don't have a chatId yet, but the API expects one.
      // Let's pass a placeholder since the API uses it for storage path but HomePrompt
      // will create a NEW chat and then navigate.
      formData.append("chatId", "new-chat");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

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
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
      // Step 1: Create the chat
      const createRes = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model }),
      });
      const { chat } = await createRes.json();
      
      if (!chat) {
        throw new Error("Failed to create chat");
      }
      
      const chatWithId = { ...chat, id: chat.$id ?? chat.id };
      const chatId = chatWithId.id;
      
      console.log("[HomePrompt] Chat created:", chatId);
      
      // Update chat list
      setChats([chatWithId, ...chats]);
      
      // Bundle attachments into the message
      let finalContent = trimmedContent;
      if (attachments.length > 0) {
        const attachmentString = attachments
          .map((a) => `📎 ${a.name}: ${a.url}`)
          .join("\n");
        finalContent = finalContent
          ? `${finalContent}\n${attachmentString}`
          : attachmentString;
      }

      // Step 2: Navigate with message in URL - chat page will handle it
      router.push(`/dashboard/chat/${chatId}?msg=${encodeURIComponent(finalContent)}`);
      
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center h-full w-full max-w-3xl mx-auto px-4 pb-12"
    >
      {/* Wordmark */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="mb-14 text-center select-none relative"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-ambient-glow-gold rounded-full filter blur-[45px] opacity-40 pointer-events-none" />
        <h1 className="text-7xl md:text-[90px] font-serif font-light tracking-[0.1em] text-gold-shimmer text-transparent bg-clip-text select-none">
          FLUX
        </h1>
        <p className="text-[11px] font-medium tracking-[0.25em] uppercase text-muted-foreground/50 mt-3">
          AI Luxury Experience
        </p>
      </motion.div>

      {/* Main Input Box */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full relative flex flex-col gap-0 glass-panel rounded-luxury-lg border border-glass-border shadow-velvet-elevated focus-within:border-gold-accent/40 focus-within:shadow-gold-aura transition-all duration-300"
      >
        {/* File Attachments Preview */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 px-6 pt-6 pb-1">
            <AnimatePresence>
              {attachments.map((file, i) => (
                <motion.div
                  key={file.url}
                  initial={{ opacity: 0, scale: 0.8, x: -10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8, x: 10 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="flex items-center gap-2 bg-secondary/30 border border-glass-border rounded-luxury-sm px-3 py-1.5 group/chip relative overflow-hidden"
                >
                  <FileText className="h-4 w-4 text-primary opacity-70" />
                  <span className="text-[14px] font-medium text-foreground max-w-[200px] truncate">
                    {file.name}
                  </span>
                  <button
                    onClick={() => removeAttachment(file.url)}
                    className="p-0.5 hover:bg-glass-highlight rounded-full transition-colors text-muted-foreground hover:text-foreground relative z-10"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything..."
          rows={3}
          className="w-full resize-none bg-transparent text-[18px] md:text-[20px] font-light leading-relaxed outline-none placeholder:text-muted-foreground/60 pt-6 px-6 pb-2 scrollbar-thin text-foreground"
          disabled={isSubmitting}
        />
        
        {/* Bottom Bar */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-1">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileUpload}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  disabled={uploading || isSubmitting}
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin pointer-events-none" />
                  ) : (
                    <Paperclip className="h-4 w-4 pointer-events-none" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-card/90 backdrop-blur-md border-border">
                <DropdownMenuItem
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer gap-2"
                >
                  <Upload className="h-4 w-4" />
                  <span>Upload from computer</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer gap-2 opacity-50 pointer-events-none">
                  <FileText className="h-4 w-4" />
                  <span>Import from project</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer gap-2 opacity-50 pointer-events-none">
                  <LinkIcon className="h-4 w-4" />
                  <span>Link URL</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-3">
            <ModelSelector 
              currentModel={model} 
              onModelChange={(newModel) => setModel(newModel as typeof model)}
            />

            <Button
              size="icon"
              className={cn(
                "h-9 w-9 shrink-0 rounded-md transition-all duration-300",
                content.trim()
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_2px_12px_rgba(197,160,89,0.3)]"
                  : "bg-secondary text-muted-foreground"
              )}
              onClick={() => handleSubmit()}
              disabled={!content.trim() || isSubmitting}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Suggestion Cards */}
      <motion.div
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: 0.04,
              delayChildren: 0.3,
            }
          }
        }}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full mt-16"
      >
        {SUGGESTIONS.map((s, i) => (
          <motion.div
            key={i}
            variants={{
              hidden: { opacity: 0, y: 15, scale: 0.98 },
              show: { opacity: 1, y: 0, scale: 1 }
            }}
          >
            <FluidCard
              onClick={() => handleSubmit(s.label)}
              disabled={isSubmitting}
            >
              <s.icon className="h-5 w-5 text-primary opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="text-[15px] font-light text-foreground/80 group-hover:text-foreground transition-colors duration-300">
                {s.label}
              </span>
            </FluidCard>
          </motion.div>
        ))}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 15, scale: 0.98 },
            show: { opacity: 1, y: 0, scale: 1 }
          }}
        >
          <FluidCard
            onClick={() => useProjectStore.getState().setCreateDialogOpen(true)}
            className="border-dashed border-muted/40"
          >
            <Plus className="h-5 w-5 text-primary opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="text-[15px] font-light text-foreground/80 group-hover:text-foreground transition-colors duration-300">
              New Project
            </span>
          </FluidCard>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
