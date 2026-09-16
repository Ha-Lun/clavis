import { useState } from "react";
import { BookOpen, Check, Library, Trash2, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Course } from "./types";

interface CourseListProps {
  courses: Course[];
  selectedCourseId: string;
  onSelect: (courseId: string) => void;
  onRemove?: (courseId: string) => void | Promise<void>;
  loading?: boolean;
}

function CourseCard({ course, selected, onSelect, onRemove }: { course: Course; selected: boolean; onSelect: () => void; onRemove?: () => void | Promise<void> }) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const name = course.name || course.title || course.id;

  return (
    <div 
      role="button" 
      tabIndex={0} 
      onClick={onSelect} 
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      aria-pressed={selected} 
      className={cn("group relative rounded-xl border p-4 text-left transition-all", selected ? "border-primary/60 bg-primary/[0.08] shadow-stripe-ambient" : "border-border bg-card hover:border-primary/40 hover:bg-card/80")}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <span className={cn("flex size-8 items-center justify-center rounded-lg", selected ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}>
          <BookOpen className="size-4" />
        </span>
        <div className="flex items-center gap-2">
          {onRemove && (
            <div className="flex items-center gap-1 z-20">
              {isConfirming ? (
                <button
                  type="button"
                  disabled={isDeleting}
                  className="flex items-center gap-1 bg-destructive/10 text-destructive px-2 py-1 rounded-md transition-colors hover:bg-destructive/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={async (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setIsDeleting(true);
                    await onRemove();
                  }}
                >
                  {isDeleting ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
                  <span className="text-[10px] font-medium uppercase tracking-wider">
                    {isDeleting ? "Removing..." : "Confirm"}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setIsConfirming(true);
                  }}
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </div>
          )}
          {isConfirming && !isDeleting && (
            <button
              type="button"
              className="p-1 z-20 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setIsConfirming(false);
              }}
            >
              <X className="size-3.5" />
            </button>
          )}
          {selected && !isConfirming && <Check className="size-4 text-primary" aria-label="Selected" />}
        </div>
      </div>
      <p className="truncate text-sm font-medium text-foreground">{name}</p>
      {course.code && <p className="mt-1 truncate text-xs text-muted-foreground">{course.code}</p>}
      {course.description && <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{course.description}</p>}
    </div>
  );
}

export function CourseList({ courses, selectedCourseId, onSelect, onRemove, loading }: CourseListProps) {
  if (loading) return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-xl border border-border bg-card" />)}</div>;
  if (courses.length === 0) return <div className="rounded-xl border border-dashed border-border bg-card/40 px-6 py-12 text-center"><Library className="mx-auto mb-3 size-7 text-primary/70" /><p className="text-sm text-foreground">No courses cached yet</p><p className="mt-1 text-xs text-muted-foreground">Load your courses to get started.</p></div>;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <CourseCard 
          key={course.id} 
          course={course} 
          selected={course.id === selectedCourseId} 
          onSelect={() => onSelect(course.id)} 
          onRemove={onRemove ? () => onRemove(course.id) : undefined}
        />
      ))}
    </div>
  );
}
