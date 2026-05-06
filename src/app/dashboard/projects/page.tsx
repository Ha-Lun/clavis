"use client";

import { useEffect, useState } from "react";
import { useProjectStore } from "@/stores/project-store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { FolderOpen, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

export default function ProjectsPage() {
  const { projects, setProjects, removeProject, setCreateDialogOpen } =
    useProjectStore();
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
            onClick={() => setCreateDialogOpen(true)}
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
              onClick={() => setCreateDialogOpen(true)}
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
      </div>
    </div>
  );
}
