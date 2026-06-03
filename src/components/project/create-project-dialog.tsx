"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProjectStore } from "@/stores/project-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

export function CreateProjectDialog() {
  const router = useRouter();
  const { isCreateDialogOpen, setCreateDialogOpen, addProject } = useProjectStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
        }),
      });
      const data = await res.json();
      if (data.project) {
        addProject(data.project);
        setCreateDialogOpen(false);
        setName("");
        setDescription("");
        router.push(`/dashboard/projects/${data.project.$id || data.project.id}`);
      }
    } catch (err) {
      console.error("Failed to create project:", err);
    } finally {
      setCreating(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setName("");
      setDescription("");
    }
    setCreateDialogOpen(open);
  };

  return (
    <Dialog open={isCreateDialogOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-card border-border rounded-xl sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-medium tracking-tight text-foreground">New project</DialogTitle>
          <DialogDescription className="text-muted-foreground font-light">
            Projects help you organize related chats together.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-4">
          <div className="space-y-3">
            <Label htmlFor="project-name" className="text-foreground font-medium">Name</Label>
            <Input
              id="project-name"
              placeholder="My Project"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 bg-background border-border text-foreground text-[14px] font-light rounded-md focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:border-primary/40"
            />
          </div>
          <div className="space-y-3">
            <Label htmlFor="project-description" className="text-foreground font-medium">
              Description (optional)
            </Label>
            <Textarea
              id="project-description"
              placeholder="What's this project about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="bg-background border-border text-foreground text-[14px] font-light rounded-md resize-none focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:border-primary/40"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className="bg-card border-border text-foreground hover:bg-secondary rounded-md text-[13px] cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || creating}
            className="bg-primary hover:bg-primary/90 text-white rounded-md text-[13px] cursor-pointer"
          >
            {creating ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Creating&hellip;
              </>
            ) : (
              "Create"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}