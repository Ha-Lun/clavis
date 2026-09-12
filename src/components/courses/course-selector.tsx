import { BookOpen } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Course } from "./types";
import { cn } from "@/lib/utils";

interface CourseSelectorProps { 
  courses: Course[]; 
  value: string; 
  onChange: (courseId: string) => void; 
}

export function CourseSelector({ courses, value, onChange }: CourseSelectorProps) {
  // If value is empty, it means "General" or no course is selected.
  // We can pass "general" to the select and then map "general" -> "" in onChange.
  const selectValue = value || "general";

  return (
    <Select 
      value={selectValue} 
      onValueChange={(val) => onChange(val === "general" ? "" : val)} 
      disabled={courses.length === 0}
    >
      <SelectTrigger className="w-[180px] h-8 px-2.5 text-[12px] rounded-md border border-border bg-card/60 hover:bg-card text-muted-foreground hover:text-foreground flex items-center gap-1.5 shadow-none focus:ring-1 focus:ring-primary/40">
        <SelectValue placeholder="General" />
      </SelectTrigger>
      <SelectContent className="bg-[#0a0a0f]/95 border border-neutral-800/60 backdrop-blur-xl rounded-xl shadow-2xl shadow-black/80 animate-in fade-in-50 p-2">
        <SelectItem 
          value="general" 
          className="text-foreground text-[12px] font-light pl-8 pr-2.5 py-1.5 rounded-md hover:bg-white/[0.04] focus:bg-white/[0.04] cursor-pointer"
        >
          <span className="flex items-center gap-2">
            General
          </span>
        </SelectItem>
        {courses.map((course) => (
          <SelectItem 
            key={course.id} 
            value={course.id}
            className="text-foreground text-[12px] font-light pl-8 pr-2.5 py-1.5 rounded-md hover:bg-white/[0.04] focus:bg-white/[0.04] cursor-pointer"
          >
            <span className="flex items-center gap-2 truncate max-w-[200px]">
              <BookOpen className="size-3.5 text-primary shrink-0" />
              <span className="truncate">{course.name || course.title || course.id}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
