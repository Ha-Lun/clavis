import { NextRequest, NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { createSessionClient } from "@/lib/appwrite/server";
import { COLLECTIONS, DATABASE_ID } from "@/lib/appwrite/config";
import type { CourseRecord } from "@/lib/courses/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await createSessionClient();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await session.account.get();
    
    // admin.databases fails when API key is empty, use session.databases
    const result = await session.databases.listDocuments(DATABASE_ID, COLLECTIONS.COURSES, [
      Query.equal("user_id", user.$id),
      Query.orderAsc("name"),
      Query.limit(100),
    ]);
    
    const courses = (result.documents as unknown as CourseRecord[]).map((course) => ({
      id: course.$id,
      name: course.name,
      code: course.course_code,
      provider: "canvas",
      updatedAt: course.last_synced_at,
      syncStatus: course.sync_status,
      indexedSourceCount: course.indexed_source_count,
      canvasUrl: course.canvas_url,
    }));
    return NextResponse.json({ courses });
  } catch (error: any) {
    console.error("[GET /api/courses]", error?.message);
    return NextResponse.json({ error: "Courses are not configured yet. Run the Appwrite course schema migration." }, { status: 503 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await createSessionClient();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await session.account.get();

    const { searchParams } = new URL(request.url);
    let courseId = searchParams.get("id");
    if (!courseId) {
      try {
        const body = await request.json();
        courseId = body.id;
      } catch (e) {
        // ignore JSON parse error
      }
    }
    if (!courseId) return NextResponse.json({ error: "Course ID is required" }, { status: 400 });

    let course: any;
    try {
      course = await session.databases.getDocument(DATABASE_ID, COLLECTIONS.COURSES, courseId);
    } catch (e: any) {
      if (e.code === 404) {
        return NextResponse.json({ success: true, message: "Course already removed" });
      }
      throw e;
    }
    if ((course as any).user_id !== user.$id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Cascading deletes for COURSE_SOURCES and COURSE_CHUNKS using session (user owns them)
    try {
      while (true) {
        const sourcesResult = await session.databases.listDocuments(DATABASE_ID, COLLECTIONS.COURSE_SOURCES, [
          Query.equal("course_id", courseId),
          Query.equal("user_id", user.$id),
          Query.limit(100)
        ]);
        if (sourcesResult.documents.length === 0) break;
        await Promise.all(sourcesResult.documents.map(source => 
          session.databases.deleteDocument(DATABASE_ID, COLLECTIONS.COURSE_SOURCES, source.$id)
        ));
      }
    } catch (e) {
      console.error("[DELETE /api/courses] Error deleting sources:", e);
    }

    try {
      while (true) {
        const chunksResult = await session.databases.listDocuments(DATABASE_ID, COLLECTIONS.COURSE_CHUNKS, [
          Query.equal("course_id", courseId),
          Query.equal("user_id", user.$id),
          Query.limit(100)
        ]);
        if (chunksResult.documents.length === 0) break;
        await Promise.all(chunksResult.documents.map(chunk => 
          session.databases.deleteDocument(DATABASE_ID, COLLECTIONS.COURSE_CHUNKS, chunk.$id)
        ));
      }
    } catch (e) {
      console.error("[DELETE /api/courses] Error deleting chunks:", e);
    }

    // Finally delete the course
    await session.databases.deleteDocument(DATABASE_ID, COLLECTIONS.COURSES, courseId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[DELETE /api/courses]", error?.message);
    return NextResponse.json({ error: "Failed to delete course" }, { status: 500 });
  }
}
