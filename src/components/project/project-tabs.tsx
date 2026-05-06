"use client";

import { useState } from "react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, FileText, Settings, Save, UploadCloud } from "lucide-react";
import { getModelInfo } from "@/lib/models";
import type { Chat, Project } from "@/lib/appwrite/types";

interface ProjectTabsProps {
  project: Project;
  chats: Chat[];
}

export function ProjectTabs({ project, chats }: ProjectTabsProps) {
  const [instructions, setInstructions] = useState(project.instructions || "");
  const [isSaving, setIsSaving] = useState(false);

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

  return (
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
        </div>

        {chats.length === 0 ? (
          <div className="text-center py-16 animate-fade-in border border-dashed border-border rounded-[16px] bg-secondary/20">
            <MessageSquare className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground text-[15px] font-light">
              No chats assigned to this project yet
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {chats.map((chat) => {
              const model = getModelInfo(chat.model as string);
              return (
                <Link
                  key={chat.$id || chat.id}
                  href={`/dashboard/chat/${chat.$id || chat.id}`}
                  className="group"
                >
                  <Card className="h-full bg-card border border-border shadow-stripe-ambient hover:shadow-stripe-elevated hover:border-primary transition-all duration-300 rounded-[16px] overflow-hidden">
                    <CardHeader className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <CardTitle className="text-lg font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                          {chat.title as string}
                        </CardTitle>
                        <Badge
                          variant="secondary"
                          className="text-[10px] shrink-0 bg-secondary text-muted-foreground hover:bg-border font-medium tracking-wide rounded-[6px]"
                        >
                          {model.shortName}
                        </Badge>
                      </div>
                      <CardDescription className="text-[13px] text-muted-foreground font-light pt-2">
                        {new Date((chat.$updatedAt || chat.updatedAt) as string).toLocaleDateString()}
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
          <Button variant="outline" size="sm" className="gap-2 h-9 rounded-[8px]">
            <UploadCloud className="h-4 w-4" />
            Upload File
          </Button>
        </div>
        
        <div className="text-center py-16 animate-fade-in border border-dashed border-border rounded-[16px] bg-secondary/20">
          <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-muted-foreground text-[15px] font-light">
            No files uploaded yet. Coming soon!
          </p>
        </div>
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
  );
}