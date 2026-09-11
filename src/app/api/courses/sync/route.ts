import { NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import { createSessionClient, createAdminClient } from "@/lib/appwrite/server";
import { COLLECTIONS, DATABASE_ID } from "@/lib/appwrite/config";
import {
  getCanvasAssignments,
  getCanvasCourses,
  getCanvasModules,
  getCanvasPages,
  getCanvasPage,
  getCanvasSyllabus,
  getCanvasAnnouncements,
  getCanvasCalendarEvents,
  getCanvasFiles,
} from "@/lib/integrations/canvas";
import { extractTextFromBuffer } from "@/lib/extract-text";
import { fingerprintSources, hashContent, normalizeCourseText, replaceSourceChunks } from "@/lib/courses/knowledge";
import type { CourseRecord, CourseSourceRecord } from "@/lib/courses/types";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

function text(value: unknown): string {
  return typeof value === "string" ? normalizeCourseText(value) : "";
}

async function upsertSource(
  admin: Awaited<ReturnType<typeof createAdminClient>>,
  userId: string,
  course: CourseRecord,
  input: { externalId: string; type: string; title: string; content: string; url?: string | null; updatedAt?: string | null },
): Promise<{ source: CourseSourceRecord; chunks: number }> {
  const content = text(input.content);
  if (!content) return { source: null as never, chunks: 0 };
  const contentHash = hashContent(content);
  const existing = await admin.databases.listDocuments(DATABASE_ID, COLLECTIONS.COURSE_SOURCES, [
    Query.equal("user_id", userId),
    Query.equal("course_id", course.$id),
    Query.equal("external_id", input.externalId),
    Query.limit(1),
  ]);
  let source: CourseSourceRecord;
  if (existing.documents[0]) {
    const document = existing.documents[0] as unknown as CourseSourceRecord;
    if (document.content_hash === contentHash) return { source: document, chunks: 0 };
    source = await admin.databases.updateDocument(DATABASE_ID, COLLECTIONS.COURSE_SOURCES, document.$id, {
      source_type: input.type,
      title: input.title.slice(0, 255),
      source_url: input.url ?? null,
      content_hash: contentHash,
      content: content.slice(0, 99999),
      updated_at: input.updatedAt ?? null,
      indexed_at: new Date().toISOString(),
    }) as unknown as CourseSourceRecord;
  } else {
    source = await admin.databases.createDocument(DATABASE_ID, COLLECTIONS.COURSE_SOURCES, ID.unique(), {
      user_id: userId,
      course_id: course.$id,
      external_id: input.externalId,
      source_type: input.type,
      title: input.title.slice(0, 255),
      source_url: input.url ?? null,
      content_hash: contentHash,
      content: content.slice(0, 99999),
      updated_at: input.updatedAt ?? null,
      indexed_at: new Date().toISOString(),
    }) as unknown as CourseSourceRecord;
  }
  return { source, chunks: await replaceSourceChunks(admin.databases, source) };
}

async function syncCourse(
  admin: Awaited<ReturnType<typeof createAdminClient>>,
  userId: string,
  course: CourseRecord,
  canvasUrl: string,
  token: string,
): Promise<{ count: number; errors: string[] }> {
  const errors: string[] = [];
  const sources: CourseSourceRecord[] = [];
  let count = 0;
  const add = async (input: Parameters<typeof upsertSource>[3]) => {
    try {
      const result = await upsertSource(admin, userId, course, input);
      if (result.source) sources.push(result.source);
      count += result.chunks;
    } catch (error: any) {
      errors.push(`${input.title}: ${error?.message || "failed"}`);
    }
  };

  try {
    const syllabus = await getCanvasSyllabus(canvasUrl, token, course.external_id);
    await add({ externalId: "syllabus", type: "syllabus", title: "Course syllabus", content: syllabus || "" });
  } catch (error: any) { errors.push(`Syllabus: ${error?.message || "failed"}`); }

  try {
    const pages = await getCanvasPages(canvasUrl, token, course.external_id);
    const BATCH_SIZE = 5;
    for (let i = 0; i < pages.length; i += BATCH_SIZE) {
      const batch = pages.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(async (page) => {
        try {
          const detail = await getCanvasPage(canvasUrl, token, course.external_id, page.url || String(page.page_id));
          await add({ externalId: `page:${page.page_id}`, type: "page", title: detail.title || page.title, content: detail.body || "", url: detail.html_url || page.html_url, updatedAt: detail.updated_at || page.updated_at });
        } catch {
          await add({ externalId: `page:${page.page_id}`, type: "page", title: page.title, content: page.body || "", url: page.html_url, updatedAt: page.updated_at });
        }
      }));
    }
  } catch (error: any) { errors.push(`Pages: ${error?.message || "failed"}`); }

  try {
    const assignments = await getCanvasAssignments(canvasUrl, token, course.external_id);
    for (const assignment of assignments) {
      const details = [assignment.description, assignment.due_at ? `Due: ${assignment.due_at}` : "", assignment.points_possible != null ? `Points: ${assignment.points_possible}` : ""].filter(Boolean).join("\n");
      await add({ externalId: `assignment:${assignment.id}`, type: "assignment", title: assignment.name, content: details, url: assignment.html_url });
    }
  } catch (error: any) { errors.push(`Assignments: ${error?.message || "failed"}`); }

  try {
    const modules = await getCanvasModules(canvasUrl, token, course.external_id);
    for (const module of modules) {
      const items = module.items || [];
      const itemText = items.map(item => `  - [${item.type}] ${item.title}`).join("\n");
      const content = `Module: ${module.name}\nItems:\n${itemText}`;
      await add({ externalId: `module:${module.id}`, type: "modules", title: `Module: ${module.name}`, content });
    }
  } catch (error: any) { errors.push(`Modules: ${error?.message || "failed"}`); }

  try {
    const announcements = await getCanvasAnnouncements(canvasUrl, token, course.external_id);
    for (const a of announcements) {
      const content = `Posted at: ${a.posted_at}\n\n${a.message || ""}`;
      await add({ externalId: `announcement:${a.id}`, type: "announcement", title: `Announcement: ${a.title}`, content });
    }
  } catch (error: any) { errors.push(`Announcements: ${error?.message || "failed"}`); }

  try {
    const events = await getCanvasCalendarEvents(canvasUrl, token, course.external_id);
    for (const e of events) {
      const content = `Start: ${e.start_at}\nEnd: ${e.end_at}\nLocation: ${e.location_name || e.location_address || "None"}\n\n${e.description || ""}`;
      await add({ externalId: `event:${e.id}`, type: "calendar_event", title: `Event: ${e.title}`, content });
    }
  } catch (error: any) { errors.push(`Calendar Events: ${error?.message || "failed"}`); }

  try {
    const files = await getCanvasFiles(canvasUrl, token, course.external_id);
    const documentExtensions = [".pdf", ".docx", ".doc", ".pptx", ".txt", ".md"];
    const validFiles = files
      .filter((file: any) => {
        const ext = file.filename.slice(file.filename.lastIndexOf(".")).toLowerCase();
        return documentExtensions.includes(ext) && file.size < 15 * 1024 * 1024;
      })
      .slice(0, 20);

    for (const file of validFiles) {
      const existing = await admin.databases.listDocuments(DATABASE_ID, COLLECTIONS.COURSE_SOURCES, [
        Query.equal("user_id", userId),
        Query.equal("course_id", course.$id),
        Query.equal("external_id", `file:${file.id}`),
        Query.limit(1),
      ]);
      
      const doc = existing.documents[0] as any;
      if (doc && doc.updated_at === file.updated_at) {
        sources.push(doc as unknown as CourseSourceRecord);
        continue; // Unchanged
      }

      try {
        if (!file.url) continue;
        const res = await fetch(file.url, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error(`Failed to download file: ${res.statusText}`);
        
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const extraction = await extractTextFromBuffer(buffer, file.display_name || file.filename);
        
        if (extraction.text) {
          await add({
            externalId: `file:${file.id}`,
            type: "file",
            title: `File: ${file.display_name || file.filename}`,
            content: extraction.text,
            url: file.html_url || file.url,
            updatedAt: typeof file.updated_at === "string" ? file.updated_at : null,
          });
        }
      } catch (err: any) {
        errors.push(`File ${file.display_name || file.filename}: ${err?.message || "failed"}`);
      }
    }
  } catch (error: any) { errors.push(`Files: ${error?.message || "failed"}`); }

  const fingerprint = fingerprintSources(sources);
  await admin.databases.updateDocument(DATABASE_ID, COLLECTIONS.COURSES, course.$id, {
    sync_status: errors.length > 0 ? "partial" : "ready",
    indexed_source_count: sources.length,
    content_fingerprint: fingerprint,
    last_synced_at: new Date().toISOString(),
    sync_error: errors.length ? errors.join("; ").slice(0, 3999) : null,
  });
  return { count, errors };
}

export async function POST(request: Request) {
  try {
    const session = await createSessionClient();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await session.account.get();
    const prefs = await session.account.getPrefs() as Record<string, unknown>;
    const canvasUrl = typeof prefs.canvasUrl === "string" ? prefs.canvasUrl : "";
    const token = typeof prefs.canvasToken === "string" ? prefs.canvasToken : "";
    if (!canvasUrl || !token) return NextResponse.json({ error: "Connect Canvas/Studium in Settings first." }, { status: 400 });

    let body: any = {};
    try {
      body = await request.json();
    } catch (e) {}
    const targetCourseId = body.courseId;
    let targetExternalId: string | null = null;

    const admin = await createAdminClient();

    if (targetCourseId) {
      try {
        const doc = await admin.databases.getDocument(DATABASE_ID, COLLECTIONS.COURSES, targetCourseId);
        if ((doc as any).user_id !== user.$id) {
          return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }
        targetExternalId = (doc as any).external_id;
      } catch (e) {
        // if not found by appwrite ID, maybe it is the external ID directly
        targetExternalId = String(targetCourseId);
      }
    }

    const canvasCourses = await getCanvasCourses(canvasUrl, token);
    let coursesToSync = canvasCourses;
    if (targetExternalId) {
      coursesToSync = canvasCourses.filter(c => String(c.id) === targetExternalId);
    }

    const stored: CourseRecord[] = [];
    let failures = 0;
    for (const canvasCourse of coursesToSync) {
      const existing = await admin.databases.listDocuments(DATABASE_ID, COLLECTIONS.COURSES, [
        Query.equal("user_id", user.$id),
        Query.equal("external_id", String(canvasCourse.id)),
        Query.limit(1),
      ]);
      const values = {
        user_id: user.$id,
        external_id: String(canvasCourse.id),
        name: canvasCourse.name || `Course ${canvasCourse.id}`,
        course_code: canvasCourse.course_code || null,
        term_name: typeof (canvasCourse as any).term?.name === "string" ? (canvasCourse as any).term.name : null,
        canvas_url: `${canvasUrl.replace(/\/$/, "")}/courses/${canvasCourse.id}`,
        is_active: true,
        sync_status: "syncing",
        indexed_source_count: 0,
        content_fingerprint: null,
        last_synced_at: null,
        sync_error: null,
      };
      const course = existing.documents[0]
        ? await admin.databases.updateDocument(DATABASE_ID, COLLECTIONS.COURSES, existing.documents[0].$id, values)
        : await admin.databases.createDocument(DATABASE_ID, COLLECTIONS.COURSES, ID.unique(), values);
      const record = course as unknown as CourseRecord;
      try {
        const syncResult = await syncCourse(admin, user.$id, record, canvasUrl, token);
        if (syncResult.errors.length > 0) failures += 1;
      } catch (error: any) {
        failures += 1;
        await admin.databases.updateDocument(DATABASE_ID, COLLECTIONS.COURSES, record.$id, { sync_status: "failed", sync_error: error?.message || "Sync failed" });
      }
    }
    const result = await admin.databases.listDocuments(DATABASE_ID, COLLECTIONS.COURSES, [Query.equal("user_id", user.$id), Query.orderAsc("name"), Query.limit(100)]);
    stored.push(...(result.documents as unknown as CourseRecord[]));
    return NextResponse.json({
      courses: stored.map((course) => ({ id: course.$id, name: course.name, code: course.course_code, provider: "canvas", updatedAt: course.last_synced_at, syncStatus: course.sync_status, indexedSourceCount: course.indexed_source_count })),
      job: { id: "completed", jobId: "completed", status: failures ? "failed" : "completed", progress: 100, message: failures ? `${failures} courses need attention; the available course list was loaded.` : "Courses are up to date." },
    });
  } catch (error: any) {
    console.error("[POST /api/courses/sync]", error?.message);
    return NextResponse.json({ error: error?.message || "Course sync failed" }, { status: 500 });
  }
}
