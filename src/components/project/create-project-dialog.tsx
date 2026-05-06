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
      <DialogContent className="bg-card border-border rounded-[16px] shadow-stripe-elevated sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-light tracking-tight text-foreground">Create Project</DialogTitle>
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
              className="bg-background border-border text-foreground focus-visible:ring-primary focus-visible:border-primary h-11 px-4 rounded-[8px]"
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
              className="bg-background border-border text-foreground focus-visible:ring-primary focus-visible:border-primary px-4 py-3 rounded-[8px] resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className="bg-card border-border text-foreground hover:bg-secondary rounded-[8px] font-normal"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || creating}
            className="bg-primary hover:bg-primary/90 text-white shadow-stripe-ambient rounded-[8px] font-normal"
          >
            {creating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
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