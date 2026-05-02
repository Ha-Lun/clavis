"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Paperclip, Send, Loader2, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModelSelector } from "./model-selector";

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(() => {
    if (!content.trim() || isStreaming) return;
    onSend(content);
    setContent("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [content, isStreaming, onSend]);

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

      if (res.ok) {
        const { url } = await res.json();
        setContent((prev) =>
          prev ? `${prev}\n📎 ${file.name}: ${url}` : `📎 ${file.name}: ${url}`
        );
      }
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="p-4 pb-6">
      <div className="max-w-3xl mx-auto">
        <div className="relative flex flex-col bg-white/5 rounded-[24px] border border-[#7c3aed]/30 backdrop-blur-[12px] focus-within:shadow-[0_0_20px_rgba(124,58,237,0.15)] focus-within:border-[#7c3aed]/50 transition-all duration-300">
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Ask Flux anything..."
            rows={1}
            className={cn(
              "w-full resize-none bg-transparent text-[15px] outline-none placeholder:text-muted-foreground/50 pt-4 pb-2 px-5 max-h-[200px] scrollbar-thin"
            )}
            disabled={isStreaming}
            id="chat-message-input"
          />

          {/* Bottom Toolbar */}
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-1">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                id="file-upload-input"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-muted-foreground/60 hover:text-[#c9a84c] hover:bg-[#c9a84c]/10 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                id="file-upload-button"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Paperclip className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <ModelSelector chatId={chatId} currentModel={currentModel} />
              
              {isStreaming ? (
                <Button
                  size="icon"
                  className="h-8 w-8 shrink-0 rounded-full transition-all duration-200 bg-red-500/10 text-red-500 hover:bg-red-500/20"
                  onClick={onStop}
                  id="stop-message-button"
                >
                  <Square className="h-3.5 w-3.5 fill-current" />
                </Button>
              ) : (
                <Button
                  size="icon"
                  className={cn(
                    "h-8 w-8 shrink-0 rounded-full transition-all duration-200",
                    content.trim()
                      ? "bg-[#c9a84c] text-[#0f0d1a] hover:bg-[#c9a84c]/90"
                      : "bg-white/5 text-muted-foreground/40"
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
        </div>
        <p className="text-[10px] text-muted-foreground/40 text-center mt-3 tracking-tight">
          Shift + Enter for new line
        </p>
      </div>
    </div>
  );
}
