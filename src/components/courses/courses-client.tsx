"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CourseList } from "./course-list";
import { CourseQuestion } from "./course-question";
import { CourseSelector } from "./course-selector";
import { CourseSyncStatus } from "./course-sync-status";
import type { Course } from "./types";

const COURSES_CACHE_KEY = "clavis:courses";

async function readCoursesResponse(response: Response): Promise<{ courses?: Course[]; error?: string }> {
  const type = response.headers.get("content-type") ?? "";
  if (type.includes("application/json")) return response.json();
  const text = await response.text();
  return { error: text || `Unable to load courses (${response.status})` };
}

export function CoursesClient() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const saveCourses = (nextCourses: Course[]) => {
    setCourses(nextCourses);
    if (typeof window !== "undefined") localStorage.setItem(COURSES_CACHE_KEY, JSON.stringify(nextCourses));
    setSelectedCourseId((current) => nextCourses.some((course) => course.id === current) ? current : nextCourses[0]?.id ?? "");
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const cached = window.localStorage.getItem(COURSES_CACHE_KEY);
        if (cached && !cancelled) {
          const parsed = JSON.parse(cached) as Course[];
          if (Array.isArray(parsed)) saveCourses(parsed);
        }
        const response = await fetch("/api/courses");
        const data = await readCoursesResponse(response);
        if (!response.ok) throw new Error(data.error || "Unable to load courses");
        if (!cancelled && Array.isArray(data.courses)) {
          setLoadError(null);
          saveCourses(data.courses);
        }
      } catch (error) {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : "Unable to load courses");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, []);

  const selectedCourse = useMemo(() => courses.find((course) => course.id === selectedCourseId), [courses, selectedCourseId]);

  return (
    <div className="h-full overflow-y-auto scrollbar-thin bg-background px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <p className="mb-2 text-[11px] uppercase tracking-[0.24em] text-primary">Learning library</p>
            <h1 className="text-3xl font-light tracking-tight text-foreground">My Courses</h1>
            <p className="mt-1 text-[15px] font-light text-muted-foreground">Choose a course and start a focused conversation with your study material.</p>
          </div>
          <CourseSyncStatus onCoursesLoaded={saveCourses} onError={setLoadError} />
        </div>

        {loadError && (
          <div className="mb-5 rounded-lg border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-300" role="alert">
            {loadError}
            {courses.length > 0 && <span className="ml-1 text-red-300/70">Showing cached courses.</span>}
          </div>
        )}

        <CourseList courses={courses} selectedCourseId={selectedCourseId} onSelect={setSelectedCourseId} loading={loading} />

        <section className="mt-8 border-t border-border pt-6" aria-labelledby="course-chat-heading">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 id="course-chat-heading" className="text-lg font-medium text-foreground">Ask about a course</h2>
              <p className="mt-1 text-sm text-muted-foreground">Your question will open in a new course chat.</p>
            </div>
            <CourseSelector courses={courses} value={selectedCourseId} onChange={setSelectedCourseId} />
          </div>
          {selectedCourse ? <CourseQuestion courseId={selectedCourse.id} onChatCreated={(chatId) => router.push(`/dashboard/chat/${chatId}`)} /> : <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">Select a course to ask your first question.</p>}
        </section>
      </div>
    </div>
  );
}
