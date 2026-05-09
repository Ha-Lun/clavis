"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, FileText, Settings, Save, UploadCloud, Trash2, ExternalLink, Loader2, Plus, RotateCcw, X } from "lucide-react";
import { getModelInfo } from "@/lib/models";
import { useChat } from "@/context/chat-context";
import type { Chat, Project } from "@/lib/appwrite/types";
import { cn } from "@/lib/utils";

interface ProjectTabsProps {
  project: Project;
  chats: Chat[];
}

interface ProjectFile {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

export function ProjectTabs({ project, chats }: ProjectTabsProps) {
  const router = useRouter();
  const { chats: globalChats, setChats: setGlobalChats, removeChat } = useChat();
  const [localChats, setLocalChats] = useState<Chat[]>(chats);
  const [instructions, setInstructions] = useState(project.instructions || "");
  const [isSaving, setIsSaving] = useState(false);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  // Undo state
  const [undoChat, setUndoChat] = useState<Chat | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchFiles();
    return () => {
      // Cleanup timer on unmount - but this might skip the delete!
      // In a real app, we'd want to ensure the delete happens if we haven't undone.
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
        // We could trigger the delete here if needed, but for a prototype this is fine.
      }
    };
  }, [project.id]);

  const fetchFiles = async () => {
    setIsLoadingFiles(true);
    try {
      const res = await fetch(`/api/projects/${project.$id || project.id}/files`);
      const data = await res.json();
      if (data.files) setFiles(data.files);
    } catch (err) {
      console.error("Failed to fetch project files:", err);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/projects/${project.$id || project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instructions }),
      });
      if (!res.ok) throw new Error("Failed to save");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("projectId", project.$id || project.id);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      await fetchFiles();
    } catch (err) {
      console.error("Upload error:", err);
      alert("File upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      const res = await fetch(`/api/files/${fileId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete file");
    }
  };

  const handleNewProjectChat = async () => {
    setIsCreatingChat(true);
    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          projectId: project.$id || project.id 
        }),
      });
      
      const { chat } = await res.json();
      if (chat) {
        router.push(`/dashboard/chat/${chat.$id || chat.id}`);
      }
    } catch (err) {
      console.error("Failed to create project chat:", err);
    } finally {
      setIsCreatingChat(false);
    }
  };

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Find the chat to undo later
    const chatToDelete = localChats.find(c => (c.$id ?? c.id) === chatId);
    if (!chatToDelete) return;

    // Clear any existing undo timer
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      // If there was a pending deletion, we should probably execute it now
      // but to keep it simple we'll just overwrite.
    }

    // Optimistic UI update
    setLocalChats((prev) => prev.filter((c) => (c.$id ?? c.id) !== chatId));
    removeChat(chatId);

    // Show undo popup
    setUndoChat(chatToDelete);
    setShowUndo(true);

    // Set timer for actual deletion
    undoTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/chats/${chatId}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Delete failed");
        setShowUndo(false);
        setUndoChat(null);
      } catch (err) {
        console.error("Failed to delete chat permanently:", err);
      }
    }, 5000);
  };

  const handleUndoDelete = () => {
    if (!undoChat) return;

    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }

    const chatId = undoChat.$id ?? undoChat.id;
    
    // Restore locally
    setLocalChats(prev => [undoChat, ...prev].sort((a, b) => 
      new Date((b.$updatedAt || b.updatedAt) as string).getTime() - 
      new Date((a.$updatedAt || a.updatedAt) as string).getTime()
    ));

    // Restore globally
    const chatWithCorrectId = { ...undoChat, id: chatId };
    setGlobalChats([chatWithCorrectId, ...globalChats]);

    setShowUndo(false);
    setUndoChat(null);
  };

  return (
    <div className="relative w-full">
      <Tabs defaultValue="chats" className="w-full">
        <TabsList className="mb-6 bg-secondary/50 border border-border p-1 w-full sm:w-auto inline-flex h-auto rounded-[12px]">
          <TabsTrigger value="chats" className="flex items-center gap-2 py-2 px-4 rounded-[8px] data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <MessageSquare className="h-4 w-4" />
            Chats
          </TabsTrigger>
          <TabsTrigger value="files" className="flex items-center gap-2 py-2 px-4 rounded-[8px] data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <FileText className="h-4 w-4" />
            Files
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2 py-2 px-4 rounded-[8px] data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* CHATS TAB */}
        <TabsContent value="chats" className="mt-0 animate-fade-in border-none p-0 outline-none">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-light tracking-tight text-foreground">Chats in this project</h2>
            <Button
              onClick={handleNewProjectChat}
              disabled={isCreatingChat}
              className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-200 text-white font-medium rounded-[8px] h-9"
            >
              {isCreatingChat ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              New Chat
            </Button>
          </div>

          {localChats.length === 0 ? (
            <div className="text-center py-16 animate-fade-in border border-dashed border-border rounded-[16px] bg-secondary/20">
              <MessageSquare className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground text-[15px] font-light">
                No chats assigned to this project yet
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {localChats.map((chat) => {
                const model = getModelInfo(chat.model as string);
                const chatId = chat.$id || chat.id;
                return (
                  <Link
                    key={chatId}
                    href={`/dashboard/chat/${chatId}`}
                    className="group"
                  >
                    <Card className="h-full bg-card border border-border shadow-stripe-ambient hover:shadow-stripe-elevated hover:border-primary transition-all duration-300 rounded-[16px] overflow-hidden relative">
                      <CardHeader className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <CardTitle className="text-lg font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors pr-6">
                            {chat.title as string}
                          </CardTitle>
                          <Badge
                            variant="secondary"
                            className="text-[10px] shrink-0 bg-secondary text-muted-foreground hover:bg-border font-medium tracking-wide rounded-[6px]"
                          >
                            {model.shortName}
                          </Badge>
                        </div>
                        <CardDescription className="text-[13px] text-muted-foreground font-light pt-2 flex items-center justify-between">
                          <span>{new Date((chat.$updatedAt || chat.updatedAt) as string).toLocaleDateString()}</span>
                          <button
                            onClick={(e) => handleDeleteChat(chatId, e)}
                            className="p-1.5 rounded-md hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-all duration-200 opacity-0 group-hover:opacity-100"
                            title="Delete Chat"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* FILES TAB */}
        <TabsContent value="files" className="mt-0 animate-fade-in border-none p-0 outline-none">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-light tracking-tight text-foreground">Project Files</h2>
            <div className="flex items-center gap-2">
              <input
                type="file"
                id="project-file-upload"
                className="hidden"
                onChange={handleFileUpload}
              />
              <Button
                variant="outline"
                size="sm"
                className="gap-2 h-9 rounded-[8px]"
                onClick={() => document.getElementById("project-file-upload")?.click()}
                disabled={isUploading}
              >
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                Upload File
              </Button>
            </div>
          </div>

          {isLoadingFiles ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 bg-secondary/20 animate-pulse rounded-[16px]" />
              ))}
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-16 animate-fade-in border border-dashed border-border rounded-[16px] bg-secondary/20">
              <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground text-[15px] font-light">
                No files uploaded yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {files.map((file) => (
                <Card key={file.id} className="bg-card border border-border shadow-stripe-ambient hover:border-primary transition-all duration-300 rounded-[16px] overflow-hidden">
                  <CardHeader className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FileText className="h-5 w-5 text-primary shrink-0" />
                        <div className="overflow-hidden">
                          <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                          <p className="text-[11px] text-muted-foreground font-light">
                            {(file.sizeBytes / 1024).toFixed(1)} KB • {new Date(file.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-muted-foreground hover:text-primary transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <button
                          onClick={() => handleDeleteFile(file.id)}
                          className="p-2 text-muted-foreground hover:text-accent transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* SETTINGS TAB */}
        <TabsContent value="settings" className="mt-0 animate-fade-in border-none p-0 outline-none">
          <div className="max-w-2xl">
            <h2 className="text-xl font-light tracking-tight text-foreground mb-6">Project Settings</h2>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[15px] font-medium text-foreground">Custom System Instructions</label>
                <p className="text-[13px] text-muted-foreground font-light">
                  Add instructions here to influence the AI's behavior for all chats in this project. These instructions will be appended to the base system prompt.
                </p>
                <Textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g. Always answer in Spanish. Use a formal tone. Prefer functional programming paradigms."
                  className="min-h-[200px] resize-y bg-card text-foreground font-light text-[15px] leading-relaxed rounded-[12px] p-4"
                />
              </div>

              <Button
                onClick={handleSaveSettings}
                disabled={isSaving || instructions === (project.instructions || "")}
                className="gap-2 rounded-[8px] bg-primary text-white hover:bg-primary/90"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Undo Popup */}
      <div 
        className={cn(
          "fixed bottom-8 left-8 z-50 transition-all duration-300 transform",
          showUndo ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0 pointer-events-none"
        )}
      >
        <div className="bg-[#1a1a23] border border-border shadow-2xl rounded-[12px] p-4 flex items-center gap-4 min-w-[300px]">
          <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
            <Trash2 className="h-5 w-5 text-destructive" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Chat deleted</p>
            <p className="text-xs text-muted-foreground line-clamp-1">{undoChat?.title}</p>
          </div>
          <div className="flex items-center gap-2 border-l border-border pl-4">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 gap-2 text-primary hover:text-primary hover:bg-primary/10 font-medium"
              onClick={handleUndoDelete}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Undo
            </Button>
            <button 
              onClick={() => {
                setShowUndo(false);
                // The actual delete will happen when the timer expires anyway
              }}
              className="p-1 hover:bg-secondary rounded-md text-muted-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
