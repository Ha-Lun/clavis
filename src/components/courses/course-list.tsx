
import { BookOpen, Check, Library } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Course } from "./types";

interface CourseListProps {
  courses: Course[];
  selectedCourseId: string;
  onSelect: (courseId: string) => void;
  loading?: boolean;
}

export function CourseList({ courses, selectedCourseId, onSelect, loading }: CourseListProps) {
  if (loading) return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-xl border border-border bg-card" />)}</div>;
  if (courses.length === 0) return <div className="rounded-xl border border-dashed border-border bg-card/40 px-6 py-12 text-center"><Library className="mx-auto mb-3 size-7 text-primary/70" /><p className="text-sm text-foreground">No courses cached yet</p><p className="mt-1 text-xs text-muted-foreground">Load your courses to get started.</p></div>;

  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{courses.map((course) => {
    const selected = course.id === selectedCourseId;
    const name = course.name || course.title || course.id;
    return <button key={course.id} type="button" onClick={() => onSelect(course.id)} aria-pressed={selected} className={cn("group relative rounded-xl border p-4 text-left transition-all", selected ? "border-primary/60 bg-primary/[0.08] shadow-stripe-ambient" : "border-border bg-card hover:border-primary/40 hover:bg-card/80")}>
      <div className="mb-3 flex items-start justify-between gap-3"><span className={cn("flex size-8 items-center justify-center rounded-lg", selected ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}><BookOpen className="size-4" /></span>{selected && <Check className="size-4 text-primary" aria-label="Selected" />}</div>
      <p className="truncate text-sm font-medium text-foreground">{name}</p>
      {course.code && <p className="mt-1 truncate text-xs text-muted-foreground">{course.code}</p>}
      {course.description && <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{course.description}</p>}
    </button>;
  })}</div>;
}
