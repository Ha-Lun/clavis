import { FormEvent, useState, useRef, useCallback } from "react";
import { useChat } from "@/context/chat-context";
import { ArrowUp, Loader2, Paperclip, Globe, X, FileText, Upload, Link as LinkIcon } from "lucide-react";
import { ModelSelector } from "@/components/chat/model-selector";
import { DEFAULT_MODEL } from "@/lib/models";
import { cn, Attachment } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CourseQuestionProps {
  courseId: string;
  onChatCreated: (chatId: string) => void;
}

export function CourseQuestion({ courseId, onChatCreated }: CourseQuestionProps) {
  const { chats, setChats } = useChat();
  const [question, setQuestion] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isFocused, setIsFocused] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasContent = question.trim().length > 0 || attachments.length > 0;

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuestion(e.target.value);
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  };

  const processFile = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("chatId", "new-chat");
      
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const { file: uploadedFile, url } = await res.json();
      setAttachments((prev) => [...prev, { id: uploadedFile.$id, name: file.name, url }]);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processFile(file);
  };

  const removeAttachment = async (url: string) => {
    const attachment = attachments.find((a) => a.url === url);
    setAttachments((prev) => prev.filter((a) => a.url !== url));
    if (attachment?.id) {
      try {
        await fetch(`/api/files/${attachment.id}`, { method: "DELETE" });
      } catch (err) {
        console.error("Failed to delete", err);
      }
    }
  };

  const submit = async () => {
    const trimmed = question.trim();
    if (!hasContent || !courseId || creating) return;
    setCreating(true);
    setError(null);
    try {
      const response = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, model: DEFAULT_MODEL })
      });
      const data = await response.json() as any;
      if (!response.ok) throw new Error(data.error || "Unable to create course chat");
      
      const chatId = data.chat?.$id ?? data.chat?.id;
      if (!chatId) throw new Error("The new chat did not include an id");
      if (data.chat) setChats([data.chat, ...chats]);

      // Link files
      const fileIds = attachments.map(a => a.id).filter(Boolean);
      if (fileIds.length > 0) {
        await Promise.all(fileIds.map(id => 
          fetch(`/api/files/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId })
          }).catch(console.error)
        ));
      }

      let finalContent = trimmed;
      if (attachments.length > 0) {
        const attachmentString = attachments.map((a) => `📎 ${a.name}: ${a.url}`).join("\n");
        finalContent = finalContent ? `${finalContent}\n${attachmentString}` : attachmentString;
      }

      onChatCreated(`${chatId}?msg=${encodeURIComponent(finalContent)}&ws=${webSearchEnabled ? '1' : '0'}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to create course chat");
      setCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div>
      <div
        className={cn(
          "relative flex flex-col rounded-2xl bg-card transition-colors duration-100",
          "border shadow-stripe-ambient p-1",
          isFocused ? "border-primary/40 focus-within:border-primary/40" : "border-border"
        )}
      >
        <AnimatePresence>
          {attachments.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-2 px-3 pt-2">
                {attachments.map((file, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center gap-1.5 bg-secondary border border-border rounded-md px-2.5 py-1"
                  >
                    <FileText className="size-3.5 text-muted-foreground" />
                    <span className="text-[12px] font-medium text-foreground max-w-[140px] truncate">
                      {file.name}
                    </span>
                    <button
                      type="button"
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

        <textarea
          ref={textareaRef}
          value={question}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Ask a question about this course..."
          rows={1}
          className={cn(
            "w-full resize-none bg-transparent",
            "text-[15px] font-light leading-relaxed text-foreground",
            "outline-none placeholder:text-muted-foreground/35",
            "pt-3 pb-2 px-3",
            "max-h-[200px] scrollbar-thin",
            "transition-all duration-100"
          )}
          disabled={creating}
        />

        <div className="flex items-center justify-between px-2 pb-2">
          <div className="flex items-center gap-1">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileUpload}
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
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              type="button"
              onClick={() => setWebSearchEnabled((prev) => !prev)}
              className={cn(
                "h-7 flex items-center gap-1.5 rounded-md px-2 transition-all duration-150 cursor-pointer",
                webSearchEnabled
                  ? "bg-primary/15 text-primary hover:bg-primary/20"
                  : "text-muted-foreground/40 hover:text-muted-foreground/60 hover:bg-foreground/[0.05]"
              )}
              title="Toggle web search"
            >
              <Globe className="size-3.5" />
              <span className="hidden sm:inline-block text-[11px] font-medium tracking-tight">Search</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <ModelSelector />

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
              onClick={submit}
              disabled={!hasContent || creating}
            >
              {creating ? <Loader2 className="size-3.5 animate-spin" /> : <ArrowUp className="size-3.5" />}
            </motion.button>
          </div>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground/30 text-center mt-2 tracking-tight">
        Shift + Enter for a new line
      </p>
      {error && <p className="mt-2 text-xs text-red-400 text-center">{error}</p>}
    </div>
  );
}
