"use client";

import { create } from "zustand";
import type { Project } from "@/lib/appwrite/types";

interface ProjectState {
  projects: Project[];
  isCreateDialogOpen: boolean;
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  removeProject: (projectId: string) => void;
  toggleProjectPin: (projectId: string, isPinned: boolean) => void;
  setCreateDialogOpen: (isOpen: boolean) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  isCreateDialogOpen: false,
  setProjects: (projects) => set({ projects }),
  addProject: (project) =>
    set((state) => ({ projects: [project, ...state.projects] })),
  removeProject: (projectId) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.$id !== projectId),
    })),
  toggleProjectPin: (projectId, isPinned) =>
    set((state) => ({
      projects: state.projects.map((p) => {
        return p.$id === projectId ? { ...p, isPinned } : p;
      }),
    })),
  setCreateDialogOpen: (isOpen) => set({ isCreateDialogOpen: isOpen }),
}));
