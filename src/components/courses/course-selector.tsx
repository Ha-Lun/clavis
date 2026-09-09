
import { BookOpen } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Course } from "./types";

interface CourseSelectorProps { courses: Course[]; value: string; onChange: (courseId: string) => void; }
export function CourseSelector({ courses, value, onChange }: CourseSelectorProps) {
  return <Select value={value} onValueChange={onChange} disabled={courses.length === 0}><SelectTrigger className="w-full rounded-lg border-border bg-card sm:w-[280px]"><SelectValue placeholder="Select a course" /></SelectTrigger><SelectContent>{courses.map((course) => <SelectItem key={course.id} value={course.id}><span className="flex items-center gap-2"><BookOpen className="size-3.5 text-primary" />{course.name || course.title || course.id}</span></SelectItem>)}</SelectContent></Select>;
}
