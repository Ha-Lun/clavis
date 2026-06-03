"use client";

import { useState, useEffect, useRef } from "react";
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
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ProjectTabsProps {
  project: Project;
  chats: Chat[];
}

interface ProjectFile {
  $id: string;
  name: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

export function ProjectTabs({ project, chats: initialChats }: ProjectTabsProps) {
  const router = useRouter();
  const { removeChat, chats: globalChats, setChats: setGlobalChats } = useChat();
  const [localChats, setLocalChats] = useState<Chat[]>(initialChats);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [instructions, setInstructions] = useState(project.instructions || "");
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  
  // Undo state
  const [showUndo, setShowUndo] = useState(false);
  const [undoChat, setUndoChat] = useState<Chat | null>(null);
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchFiles();
    return () => {
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
      }
    };
  }, [project.$id]);

  const fetchFiles = async () => {
    setIsLoadingFiles(true);
    try {
      const res = await fetch(`/api/projects/${project.$id}/files`);
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
      const res = await fetch(`/api/projects/${project.$id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instructions }),
      });
      if (!res.ok) throw new Error("Failed to save");
    } catch (err) {
      console.error("Failed to save instructions:", err);
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
      formData.append("projectId", project.$id);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        fetchFiles();
      }
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      const res = await fetch(`/api/files/${fileId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setFiles((prev) => prev.filter((f) => f.$id !== fileId));
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete file");
    }
  };

  const handleCreateChat = async () => {
    setIsCreatingChat(true);
    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          projectId: project.$id 
        }),
      });
      
      const { chat } = await res.json();
      if (chat) {
        router.push(`/dashboard/chat/${chat.$id}`);
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
    const chatToDelete = localChats.find(c => c.$id === chatId);
    if (!chatToDelete) return;

    // Clear any existing undo timer
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
    }

    // Optimistic UI update
    setLocalChats((prev) => prev.filter((c) => c.$id !== chatId));
    removeChat(chatId);

    // Show undo popup
    setUndoChat(chatToDelete);
    setShowUndo(true);

    // Start timer for real deletion
    undoTimerRef.current = setTimeout(async () => {
      try {
        await fetch(`/api/chats/${chatId}`, { method: "DELETE" });
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

    const chatId = undoChat.$id;
    
    // Restore locally
    setLocalChats(prev => [undoChat, ...prev].sort((a, b) => 
      new Date(b.$updatedAt as string).getTime() - 
      new Date(a.$updatedAt as string).getTime()
    ));

    // Restore globally
    setGlobalChats([undoChat, ...globalChats]);

    setShowUndo(false);
    setUndoChat(null);
  };

  return (
    <>
    <Tabs defaultValue="chats" className="w-full">
      <div className="flex items-center justify-between mb-6">
        <TabsList className="bg-secondary/50 p-1 rounded-xl">
          <TabsTrigger value="chats" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-6 py-2 text-[13px] font-medium transition-all">
            <MessageSquare className="size-4 mr-2" />
            Chats
          </TabsTrigger>
          <TabsTrigger value="files" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-6 py-2 text-[13px] font-medium transition-all">
            <FileText className="size-4 mr-2" />
            Files
          </TabsTrigger>
          <TabsTrigger value="settings" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-6 py-2 text-[13px] font-medium transition-all">
            <Settings className="size-4 mr-2" />
            Instructions
          </TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-2">
          {showUndo && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 border border-accent/20 rounded-full text-[12px] text-accent animate-in fade-in slide-in-from-right-4 duration-300">
              <span>Chat deleted</span>
              <button 
                onClick={handleUndoDelete}
                className="flex items-center gap-1 font-medium hover:underline"
              >
                <RotateCcw className="size-3" />
                Undo
              </button>
              <button onClick={() => setShowUndo(false)} className="p-0.5 hover:bg-accent/20 rounded">
                <X className="size-3" />
              </button>
            </div>
          )}
          
          <Button
            onClick={handleCreateChat}
            disabled={isCreatingChat}
            size="sm"
            className="h-9 gap-2 bg-primary hover:bg-primary/90 text-white rounded-lg shadow-stripe-ambient px-4 font-normal"
          >
            {isCreatingChat ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            New Chat
          </Button>
        </div>
      </div>

      <TabsContent value="chats" className="mt-0 focus-visible:ring-0">
        <div className="space-y-4">
          {localChats.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-border rounded-[20px] bg-card/30">
              <div className="size-14 rounded-full bg-primary/5 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="size-7 text-primary/40" />
              </div>
              <h3 className="text-lg font-light text-foreground mb-1">No project chats</h3>
              <p className="text-muted-foreground text-[15px] font-light">
                No chats assigned to this project yet
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {localChats.map((chat) => {
                const model = getModelInfo(chat.model as string);
                const chatId = chat.$id;
                return (
                  <Link
                    key={chatId}
                    href={`/dashboard/chat/${chatId}`}
                    className="group"
                  >
                    <Card className="h-full bg-card border border-border hover:border-primary/30 transition-colors duration-100 rounded-xl overflow-hidden relative cursor-pointer">
                      <CardHeader className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <CardTitle className="text-[15px] font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors pr-6">
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
                          <span>Updated {new Date(chat.$updatedAt as string).toLocaleDateString()}</span>
                          <button
                            onClick={(e) => handleDeleteChat(chatId, e)}
                            className="p-1 text-muted-foreground/40 hover:text-accent hover:bg-accent/10 rounded-md transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="files" className="mt-0 focus-visible:ring-0">
        <Card className="bg-card border-border rounded-[20px] shadow-stripe-ambient overflow-hidden">
          <div className="p-6">
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
                className="h-9 gap-2 text-xs font-normal border-border bg-transparent hover:bg-secondary/50 rounded-lg"
                onClick={() => document.getElementById("project-file-upload")?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <UploadCloud className="size-3.5" />
                )}
                Upload
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
            <div className="text-center py-16 border border-dashed border-border rounded-[16px] bg-secondary/5">
              <FileText className="size-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-[15px] font-light">
                No files uploaded yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {files.map((file) => (
                <Card key={file.$id} className="bg-card border border-border hover:border-primary/30 transition-colors duration-100 rounded-xl overflow-hidden">
                  <CardHeader className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FileText className="size-5 text-primary shrink-0" />
                        <div className="overflow-hidden">
                          <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                          <p className="text-[11px] text-muted-foreground font-light">
                            {(file.sizeBytes / 1024).toFixed(1)} KB • {new Date(file.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-muted-foreground hover:text-primary transition-colors"
                        >
                          <ExternalLink className="size-4" />
                        </a>
                        <button
                          onClick={() => handleDeleteFile(file.$id)}
                          className="p-2 text-muted-foreground hover:text-accent transition-colors"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="settings" className="mt-0 focus-visible:ring-0">
        <Card className="bg-card border-border rounded-[20px] shadow-stripe-ambient">
          <div className="p-6">
            <h2 className="text-xl font-light tracking-tight text-foreground mb-4">Project Instructions</h2>
            <p className="text-muted-foreground text-[14px] font-light mb-6">
              Custom instructions applied to all chats within this project.
            </p>
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. You are a senior frontend engineer. Focus on accessibility and performance..."
              className="min-h-[300px] bg-secondary/20 border-border focus:border-primary/50 text-foreground font-light text-[15px] p-5 rounded-xl resize-none shadow-none"
            />
            <div className="flex justify-end mt-6">
              <Button
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="gap-2 bg-primary hover:bg-primary/90 text-white shadow-stripe-ambient rounded-lg px-6 font-normal"
              >
                {isSaving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        </Card>
      </TabsContent>
    </Tabs>

      {/* Undo Popup */}
      <div 
        className={cn(
          "fixed bottom-6 right-6 z-50 transition-all duration-300 transform",
          showUndo ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"
        )}
      >
        <div className="bg-[#1a1a24] text-foreground border border-border/50 px-4 py-3 rounded-xl shadow-2xl flex items-center justify-between gap-4 text-sm min-w-[280px] max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex flex-col min-w-0">
            <span className="font-medium text-[13px]">Chat deleted</span>
            <span className="text-[11px] text-muted-foreground truncate">{undoChat?.title}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0 border-l border-border/30 pl-4">
            <button
              onClick={handleUndoDelete}
              className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-white/[0.05] text-primary rounded-lg transition-colors text-[13px] font-semibold"
            >
              <RotateCcw className="size-3.5" />
              Undo
            </button>
            <button 
              onClick={() => setShowUndo(false)}
              className="p-1.5 hover:bg-white/[0.05] rounded-lg transition-colors text-muted-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
