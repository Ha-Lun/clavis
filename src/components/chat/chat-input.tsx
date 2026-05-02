"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Paperclip, Send, Loader2, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (content: string) => void;
  onStop?: () => void;
  isStreaming: boolean;
  chatId: string;
}

export function ChatInput({ onSend, onStop, isStreaming, chatId }: ChatInputProps) {
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
    <div className="p-4">
      <div className="max-w-3xl mx-auto">
        <div className="relative flex items-end gap-2 bg-white/5 rounded-[32px] border border-[#7c3aed]/30 backdrop-blur-[12px] px-3 py-2 focus-within:shadow-[0_0_0_2px_rgba(124,58,237,0.4)] transition-all duration-200">
          {/* File upload */}
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
            className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
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

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className={cn(
              "flex-1 resize-none bg-transparent text-base outline-none placeholder:text-muted-foreground py-2 px-1 max-h-[200px] scrollbar-thin"
            )}
            disabled={isStreaming}
            id="chat-message-input"
          />

          {/* Send / Stop */}
          {isStreaming ? (
            <Button
              size="icon"
              className="h-9 w-9 shrink-0 transition-all duration-200 bg-transparent text-red-400 hover:bg-red-400/10 hover:text-red-300"
              onClick={onStop}
              id="stop-message-button"
            >
              <Square className="h-4 w-4 fill-current" />
            </Button>
          ) : (
            <Button
              size="icon"
              className={cn(
                "h-9 w-9 shrink-0 transition-all duration-200",
                content.trim()
                  ? "bg-transparent text-[#c9a84c] hover:animate-spin-slow hover:bg-[#c9a84c]/10"
                  : "bg-transparent text-muted-foreground"
              )}
              onClick={handleSubmit}
              disabled={!content.trim()}
              id="send-message-button"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground text-center mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
