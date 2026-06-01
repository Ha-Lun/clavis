import { createSessionClient, createAdminClient } from "@/lib/appwrite/server";
import { DATABASE_ID, COLLECTIONS, BUCKET_ID } from "@/lib/appwrite/config";
import { NextRequest, NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { Project } from "@/lib/appwrite/types";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = await createSessionClient();
    if (!client) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await client.account.get();
    const admin = await createAdminClient();
    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;

    const existing = await admin.databases.getDocument(
      dbId,
      COLLECTIONS.PROJECTS,
      params.id
    ) as unknown as Project;

    if (existing.user_id !== user.$id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    
    // Create an object with only the fields we want to update
    const updateData: any = {};
    if (body.instructions !== undefined) updateData.instructions = body.instructions;
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.isPinned !== undefined) updateData.isPinned = body.isPinned;

    const updated = await admin.databases.updateDocument(
      dbId,
      COLLECTIONS.PROJECTS,
      params.id,
      updateData
    );

    return NextResponse.json({ project: updated });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = await createSessionClient();
    if (!client) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await client.account.get();
    const admin = await createAdminClient();
    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;

    // Verify ownership
    const existing = await admin.databases.getDocument(
      dbId,
      COLLECTIONS.PROJECTS,
      params.id
    ) as unknown as Project;

    if (existing.user_id !== user.$id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Cascade: delete all files associated with this project
    try {
      const projectFiles = await admin.databases.listDocuments(
        dbId,
        COLLECTIONS.FILES,
        [Query.equal("project_id", params.id), Query.limit(100)]
      );

      for (const doc of projectFiles.documents) {
        const fileDoc = doc as any;
        try {
          if (fileDoc.file_id) {
            await admin.storage.deleteFile(BUCKET_ID, fileDoc.file_id).catch(() => {});
          }
          await admin.databases.deleteDocument(
            dbId,
            COLLECTIONS.FILES,
            fileDoc.$id
          );
        } catch (err) {
          console.log(`[DELETE project] Failed to delete file ${fileDoc.$id}`);
        }
      }
    } catch (err) {
      console.log(`[DELETE project] Failed to list project files`);
    }

    await admin.databases.deleteDocument(
      dbId,
      COLLECTIONS.PROJECTS,
      params.id
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
