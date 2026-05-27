import { createSessionClient } from "@/lib/appwrite/server";
import { DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/config";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const client = await createSessionClient();
    if (!client) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await client.account.get();
    const prefs = await client.account.getPrefs();

    return NextResponse.json({
      id: user.$id,
      email: user.email,
      name: user.name,
      prefs,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const client = await createSessionClient();
    if (!client) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    if (body.name !== undefined) {
      await client.account.updateName(body.name);
    }

    if (body.prefs !== undefined) {
      const currentPrefs = await client.account.getPrefs();
      const updatedPrefs = { ...currentPrefs, ...body.prefs };
      await client.account.updatePrefs(updatedPrefs);

      // Sync the user's profile with the database so admins can keep track
      try {
        const user = await client.account.get();
        const profileData = {
          user_id: user.$id,
          email: user.email,
          name: user.name,
          is_pro: updatedPrefs.subscriptionTier === "pro",
        };
        
        try {
          // Attempt to update an existing profile
          await client.databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.PROFILES,
            user.$id,
            profileData
          );
        } catch (updateErr: any) {
          // If the profile doesn't exist (404), create it using the user's ID as the document ID
          if (updateErr.code === 404) {
            await client.databases.createDocument(
              DATABASE_ID,
              COLLECTIONS.PROFILES,
              user.$id,
              profileData
            );
          }
        }
      } catch (err) {
        console.error("Failed to sync profile:", err);
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
