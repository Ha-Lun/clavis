"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Paperclip, Send, Loader2, Square, Upload, FileText, Link as LinkIcon, X, ArrowUp, Globe } from "lucide-react";
import { cn, Attachment } from "@/lib/utils";
import { ModelSelector } from "./model-selector";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatInputProps {
  onSend: (content: string, options?: { webSearch?: boolean }) => void;
  onStop?: () => void;
  isStreaming: boolean;
  chatId: string;
  currentModel: string;
}

export function ChatInput({ onSend, onStop, isStreaming, chatId, currentModel }: ChatInputProps) {
  const [content, setContent] = useState("");
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isGlobalDragging, setIsGlobalDragging] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasContent = content.trim().length > 0 || attachments.length > 0;

  const handleSubmit = useCallback(() => {
    const trimmedContent = content.trim();
    if (!trimmedContent && attachments.length === 0) return;
    if (isStreaming) return;
    if (content.length > 30000) return;

    let finalContent = trimmedContent;
    if (attachments.length > 0) {
      const attachmentString = attachments
        .map((a) => `📎 ${a.name}: ${a.url}`)
        .join("\n");
      finalContent = finalContent
        ? `${finalContent}\n${attachmentString}`
        : attachmentString;
    }

    onSend(finalContent, { webSearch: webSearchEnabled });
    setContent("");
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [content, isStreaming, onSend, attachments, webSearchEnabled]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  };

  const processFile = async (file: File) => {
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

      const { file: uploadedFile, url } = await res.json();
      setAttachments((prev) => [...prev, { id: uploadedFile.$id, name: file.name, url }]);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  useEffect(() => {
    let dragCounter = 0;

    const handleWindowDragEnter = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer?.types.includes('Files')) {
        dragCounter++;
        setIsGlobalDragging(true);
      }
    };

    const handleWindowDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter === 0) {
        setIsGlobalDragging(false);
      }
    };

    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleWindowDrop = async (e: DragEvent) => {
      e.preventDefault();
      dragCounter = 0;
      setIsGlobalDragging(false);
      
      const file = e.dataTransfer?.files?.[0];
      if (!file) return;
      await processFile(file);
    };

    window.addEventListener('dragenter', handleWindowDragEnter);
    window.addEventListener('dragleave', handleWindowDragLeave);
    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('drop', handleWindowDrop);

    return () => {
      window.removeEventListener('dragenter', handleWindowDragEnter);
      window.removeEventListener('dragleave', handleWindowDragLeave);
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, []);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // If the mouse is still inside the container (e.g. over the textarea), don't remove highlighting
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const removeAttachment = async (url: string) => {
    const attachment = attachments.find((a) => a.url === url);
    setAttachments((prev) => prev.filter((a) => a.url !== url));

    if (attachment && attachment.id) {
      try {
        await fetch(`/api/files/${attachment.id}`, { method: "DELETE" });
      } catch (err) {
        console.error("Failed to delete attachment from server", err);
      }
    }
  };

  return (
    <>
      <AnimatePresence>
        {isGlobalDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm border-4 border-dashed border-primary/50 m-4 rounded-3xl"
          >
            <div className="flex flex-col items-center justify-center p-10 bg-card/80 rounded-2xl shadow-2xl pointer-events-none">
              <Upload className="size-16 text-primary/70 mb-4 animate-bounce" />
              <h2 className="text-2xl font-semibold text-foreground mb-2">Drop to upload</h2>
              <p className="text-muted-foreground">Attach this file to your conversation</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="px-4 pb-6 pt-2">
        <div className="max-w-3xl mx-auto">
        {/* Main input container */}
        <motion.div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          animate={{
            boxShadow: isStreaming
              ? [
                  "0 0 0 1px rgba(168,124,62,0.15), 0 0 0px rgba(168,124,62,0)",
                  "0 0 0 2px rgba(168,124,62,0.5), 0 0 20px rgba(168,124,62,0.15)",
                  "0 0 0 1px rgba(168,124,62,0.15), 0 0 0px rgba(168,124,62,0)"
                ]
              : isFocused || isDragging
                ? "0 0 0 1px rgba(168,124,62,0.35), 0 0 20px rgba(168,124,62,0.08)"
                : "0 0 0 1px rgba(0,0,0,0.0), 0 0 0px rgba(168,124,62,0.0)",
          }}
          transition={{
            boxShadow: isStreaming
              ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
              : { type: "spring", stiffness: 400, damping: 25 },
          }}
          className={cn(
            "relative flex flex-col rounded-xl transition-colors duration-100",
            "bg-card border",
            isStreaming ? "border-transparent" : isFocused || isDragging ? "border-primary/40" : "border-border",
            isDragging && "ring-2 ring-primary/60 bg-primary/5"
          )}
        >

          {/* Attachments */}
          <AnimatePresence>
            {attachments.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-2 px-4 pt-3 pb-1">
                  {attachments.map((file, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.9, y: 4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex items-center gap-1.5 bg-secondary border border-border rounded-md px-2.5 py-1"
                    >
                      <FileText className="size-3.5 text-muted-foreground" />
                      <span className="text-[12px] font-medium text-foreground max-w-[140px] truncate">
                        {file.name}
                      </span>
                      <button
                        onClick={() => removeAttachment(file.url)}
                        className="ml-0.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      >
                        <X className="size-3" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Pose your question."
            rows={1}
            className={cn(
              "w-full resize-none bg-transparent",
              "text-[15px] font-light text-foreground",
              "outline-none placeholder:text-muted-foreground/40",
              "pt-4 pb-2 px-5",
              "max-h-[200px] scrollbar-thin",
              "transition-all duration-100"
            )}
            disabled={isStreaming}
            id="chat-message-input"
          />

          {/* Bottom toolbar */}
          <div className="flex items-center justify-between px-3 pb-3">
            {/* Left: attachment + web search */}
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
                  <button
                    type="button"
                    className={cn(
                      "size-7 flex items-center justify-center rounded-md",
                      "text-muted-foreground/60 hover:text-muted-foreground",
                      "hover:bg-foreground/[0.05] transition-colors cursor-pointer"
                    )}
                    disabled={uploading}
                    id="file-upload-button"
                  >
                    {uploading ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Paperclip className="size-3.5" />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-popover border-border">
                  <DropdownMenuItem
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer gap-2 text-[13px]"
                  >
                    <Upload className="size-3.5" />
                    <span>Upload from computer</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer gap-2 text-[13px] opacity-40 pointer-events-none">
                    <FileText className="size-3.5" />
                    <span>Import from project</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer gap-2 text-[13px] opacity-40 pointer-events-none">
                    <LinkIcon className="size-3.5" />
                    <span>Link URL</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Web search toggle */}
              <button
                type="button"
                onClick={() => setWebSearchEnabled((prev) => !prev)}
                className={cn(
                  "h-7 flex items-center gap-1.5 rounded-md px-2 transition-all duration-150 cursor-pointer",
                  webSearchEnabled
                    ? "bg-primary/15 text-primary hover:bg-primary/20"
                    : "text-muted-foreground/40 hover:text-muted-foreground/60 hover:bg-foreground/[0.05]"
                )}
                id="web-search-toggle"
              >
                <Globe className="size-3.5" />
                <span className="hidden sm:inline-block text-[11px] font-medium tracking-tight">Search</span>
              </button>
            </div>

            {/* Right: model selector + send/stop */}
            <div className="flex items-center gap-2">
              <ModelSelector chatId={chatId} currentModel={currentModel} />

              {isStreaming ? (
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  className={cn(
                    "size-7 flex items-center justify-center rounded-md",
                    "bg-muted text-muted-foreground",
                    "hover:bg-muted/80 transition-colors cursor-pointer"
                  )}
                  onClick={onStop}
                  id="stop-message-button"
                >
                  <Square className="size-3 fill-current" />
                </motion.button>
              ) : (
                <motion.button
                  whileHover={hasContent ? { scale: 1.05 } : {}}
                  whileTap={hasContent ? { scale: 0.92 } : {}}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  className={cn(
                    "size-7 flex items-center justify-center rounded-md transition-all duration-100",
                    hasContent
                      ? "bg-primary text-primary-foreground shadow-glow cursor-pointer"
                      : "bg-secondary text-muted-foreground/40 cursor-default"
                  )}
                  onClick={handleSubmit}
                  disabled={!hasContent}
                  id="send-message-button"
                >
                  <ArrowUp className="size-3.5" />
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>

        <p className="text-[11px] text-muted-foreground/30 text-center mt-2.5 tracking-tight">
          Shift + Enter for a new line
        </p>
      </div>
    </div>
    </>
  );
}
