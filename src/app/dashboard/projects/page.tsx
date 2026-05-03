"use client";

import { useState, useEffect } from "react";
import { useProjectStore } from "@/stores/project-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { FolderOpen, Plus, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";

export default function ProjectsPage() {
  const { projects, setProjects, addProject, removeProject } =
    useProjectStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch("/api/projects");
        const data = await res.json();
        setProjects(data.projects ?? []);
      } catch (err) {
        console.error("Failed to fetch projects:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [setProjects]);

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
        setDialogOpen(false);
        setName("");
        setDescription("");
      }
    } catch (err) {
      console.error("Failed to create project:", err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (projectId: string) => {
    try {
      await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
      removeProject(projectId);
    } catch (err) {
      console.error("Failed to delete project:", err);
    }
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-6 lg:p-8 bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-light tracking-tight text-foreground">Projects</h1>
            <p className="text-muted-foreground font-light text-[15px] mt-1">
              Organize your chats into projects
            </p>
          </div>
          <Button
            className="gap-2 bg-primary hover:bg-primary/90 text-white shadow-stripe-ambient rounded-[8px] font-normal px-5"
            onClick={() => setDialogOpen(true)}
            id="create-project-button"
          >
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse bg-card border-border rounded-[16px]">
                <CardHeader>
                  <div className="h-5 w-32 bg-secondary rounded" />
                  <div className="h-4 w-48 bg-secondary rounded mt-2" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="h-16 w-16 rounded-[16px] bg-primary/10 flex items-center justify-center mx-auto mb-6 shadow-stripe-ambient">
              <FolderOpen className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-light tracking-tight text-foreground mb-2">No projects yet</h2>
            <p className="text-muted-foreground text-[15px] font-light mb-8">
              Create a project to organize related chats
            </p>
            <Button 
              onClick={() => setDialogOpen(true)}
              className="bg-card text-foreground border border-border hover:border-primary hover:text-primary shadow-stripe-ambient hover:shadow-stripe-elevated rounded-[8px] font-normal"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create your first project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/dashboard/projects/${project.id}`}
                className="group"
              >
                <Card className="h-full bg-card border border-border shadow-stripe-ambient hover:shadow-stripe-elevated hover:border-primary transition-all duration-300 rounded-[16px] overflow-hidden">
                  <CardHeader className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <FolderOpen className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg font-medium text-foreground group-hover:text-primary transition-colors">
                          {project.name}
                        </CardTitle>
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleDelete(project.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-muted-foreground hover:text-accent hover:bg-accent/10 rounded-[6px]"
                        aria-label="Delete project"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {project.description && (
                      <CardDescription className="text-[13px] text-muted-foreground font-light line-clamp-2 pt-2 pl-8">
                        {project.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Create Project Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                onClick={() => setDialogOpen(false)}
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
      </div>
    </div>
  );
}
