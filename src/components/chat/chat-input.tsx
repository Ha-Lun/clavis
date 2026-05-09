"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Paperclip, Send, Loader2, Square, Upload, FileText, Link as LinkIcon, X } from "lucide-react";
import { cn, Attachment } from "@/lib/utils";
import { ModelSelector } from "./model-selector";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";

interface ChatInputProps {
  onSend: (content: string) => void;
  onStop?: () => void;
  isStreaming: boolean;
  chatId: string;
  currentModel: string;
}

export function ChatInput({ onSend, onStop, isStreaming, chatId, currentModel }: ChatInputProps) {
  const [content, setContent] = useState("");
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmedContent = content.trim();
    if (!trimmedContent && attachments.length === 0) return;
    if (isStreaming) return;
    if (content.length > 30000) return; // Max length check

    let finalContent = trimmedContent;
    if (attachments.length > 0) {
      const attachmentString = attachments
        .map((a) => `📎 ${a.name}: ${a.url}`)
        .join("\n");
      finalContent = finalContent
        ? `${finalContent}\n${attachmentString}`
        : attachmentString;
    }

    onSend(finalContent);
    setContent("");
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [content, isStreaming, onSend, attachments]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    // Auto-resize
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("chatId", chatId);

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

  return (
    <div className="p-4 pb-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "relative flex flex-col glass-panel rounded-[20px] transition-all duration-500 border border-glass-border",
            isStreaming 
              ? "animate-border-glow shadow-gold-aura border-gold/40" 
              : "focus-within:shadow-gold-aura focus-within:border-gold-accent/40"
          )}
        >
          {/* File Attachments Preview */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 px-5 pt-4 pb-1">
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
                    <FileText className="h-3.5 w-3.5 text-primary opacity-70" />
                    <span className="text-[12px] font-medium text-foreground max-w-[150px] truncate">
                      {file.name}
                    </span>
                    <button
                      onClick={() => removeAttachment(file.url)}
                      className="p-0.5 hover:bg-glass-highlight rounded-full transition-colors text-muted-foreground hover:text-foreground relative z-10"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Ask Flux anything..."
            rows={1}
            className={cn(
              "w-full resize-none bg-transparent text-[16px] font-light text-foreground outline-none placeholder:text-muted-foreground/60 pt-5 pb-3 px-6 max-h-[200px] scrollbar-thin"
            )}
            disabled={isStreaming}
            id="chat-message-input"
          />

          {/* Bottom Toolbar */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-glass-border">
            <div className="flex items-center gap-1">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                id="file-upload-input"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full text-gold/60 hover:text-gold hover:bg-gold/10 transition-all duration-300"
                    disabled={uploading}
                    id="file-upload-button"
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin pointer-events-none" />
                    ) : (
                      <Paperclip className="h-4 w-4 pointer-events-none" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="glass-panel border-glass-border rounded-2xl">
                  <DropdownMenuItem
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer gap-2 text-foreground hover:text-gold"
                  >
                    <Upload className="h-4 w-4" />
                    <span className="font-light">Upload from computer</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer gap-2 opacity-50 pointer-events-none">
                    <FileText className="h-4 w-4" />
                    <span className="font-light">Import from project</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer gap-2 opacity-50 pointer-events-none">
                    <LinkIcon className="h-4 w-4" />
                    <span className="font-light">Link URL</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-3">
              <ModelSelector chatId={chatId} currentModel={currentModel} />

              {isStreaming ? (
                <Button
                  size="icon"
                  className="h-8 w-8 shrink-0 rounded-full transition-all duration-200 bg-void-elevated text-gold hover:bg-gold/20 border border-gold/30 animate-pulse"
                  onClick={onStop}
                  id="stop-message-button"
                >
                  <Square className="h-3 w-3 fill-current" />
                </Button>
              ) : (
                <Button
                  size="icon"
                  className={cn(
                    "h-8 w-8 shrink-0 rounded-full transition-all duration-300",
                    content.trim()
                      ? "bg-gold text-void-DEFAULT hover:bg-gold-light shadow-gold-glow"
                      : "bg-void-surface text-muted-foreground border border-glass-border"
                  )}
                  onClick={handleSubmit}
                  disabled={!content.trim()}
                  id="send-message-button"
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </motion.div>
        <p className="text-[10px] text-gold/30 text-center mt-4 tracking-widest uppercase font-medium">
          Shift + Enter for new line
        </p>
      </div>
    </div>
  );
}
