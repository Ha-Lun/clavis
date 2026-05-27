"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "@/context/chat-context";
import { DEFAULT_MODEL } from "@/lib/models";
import {
  Layers,
  Paperclip, Plus, Loader2, Upload, Link as LinkIcon, X, ArrowUp, Globe,
  Users, FolderPlus, FileText, Check, ChevronDown
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

export function HomePrompt({ userName }: { userName?: string }) {
  const [content, setContent] = useState("");
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { chats, setChats } = useChat();



  const hasContent = content.trim().length > 0 || attachments.length > 0;

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
      const createRes = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model }),
      });
      const { chat } = await createRes.json();
      if (!chat) throw new Error("Failed to create chat");
      const chatWithId = { ...chat, id: chat.$id ?? chat.id };
      setChats([chatWithId, ...chats]);

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

  return (
    <div
      className="relative flex flex-col items-center justify-center h-full w-full max-w-2xl mx-auto px-4 pb-16 overflow-hidden"
    >

      {/* ─── Wordmark ─── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="mb-12 text-center"
      >
        <h1 className="font-cinzel text-[42px] md:text-[52px] font-normal tracking-[0.06em] text-foreground leading-none">
          Clavis
        </h1>
        <p className="mt-3 text-[14px] text-muted-foreground/60 font-light tracking-wide">
          {userName ? `Greetings, ${userName}. Begin your inquiry.` : "Begin your inquiry."}
        </p>
      </motion.div>

      {/* ─── Main Input Box ─── */}
      <motion.div
        className="w-full"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          animate={{
            boxShadow: isFocused
              ? "0 0 0 1px rgba(168,124,62,0.35), 0 0 24px rgba(168,124,62,0.08)"
              : "0 0 0 1px rgba(0,0,0,0)",
          }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className={cn(
            "relative flex flex-col rounded-xl bg-card transition-colors duration-100",
            "border",
            isFocused ? "border-primary/40" : "border-border"
          )}
        >
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
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Pose your question."
            rows={3}
            className={cn(
              "w-full resize-none bg-transparent",
              "text-[16px] font-light leading-relaxed text-foreground",
              "outline-none placeholder:text-muted-foreground/35",
              "pt-5 px-5 pb-2 scrollbar-thin"
            )}
            disabled={isSubmitting}
          />

          {/* Bottom toolbar */}
          <div className="flex items-center justify-between px-4 pb-4">
            <div className="flex items-center gap-1">
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

              {/* Mode Selection Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="h-7 flex items-center gap-1.5 rounded-md px-2 text-muted-foreground/40 hover:text-muted-foreground/60 hover:bg-foreground/[0.05] transition-all duration-150 cursor-pointer"
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span className="text-[11px] font-medium tracking-tight">Mode</span>
                    <ChevronDown className="h-2.5 w-2.5 opacity-40" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48 bg-popover border-border p-1">
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    onClick={() => setWebSearchEnabled((prev) => !prev)}
                    className="cursor-pointer gap-2 py-2 px-2.5 text-[13px] rounded-md focus:bg-foreground/[0.05]"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <Globe className={cn("h-3.5 w-3.5", webSearchEnabled ? "text-primary" : "text-muted-foreground/50")} />
                      <span>Web Search</span>
                    </div>
                    {webSearchEnabled && <Check className="h-3 w-3 text-primary" />}
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => useProjectStore.getState().setCreateDialogOpen(true)}
                    className="cursor-pointer gap-2 py-2 px-2.5 text-[13px] rounded-md focus:bg-foreground/[0.05]"
                  >
                    <FolderPlus className="h-3.5 w-3.5 text-muted-foreground/50" />
                    <span>New Project</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    asChild
                    className="cursor-pointer gap-2 py-2 px-2.5 text-[13px] rounded-md focus:bg-foreground/[0.05]"
                  >
                    <Link href="/dashboard/council" className="flex items-center gap-2 w-full">
                      <Users className="h-3.5 w-3.5 text-muted-foreground/50" />
                      <span>Model Council</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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

    </div>
  );
}
