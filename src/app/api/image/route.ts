import { createSessionClient, createAdminClient } from "@/lib/appwrite/server";
import { BUCKET_ID } from "@/lib/appwrite/config";
import { NextRequest, NextResponse } from "next/server";
import { ID, InputFile } from "node-appwrite";

export const dynamic = "force-dynamic";

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || "";
const NVIDIA_IMAGE_ENDPOINT = "https://ai.api.nvidia.com/v1/genai/stabilityai/stable-diffusion-3-medium";

interface ImageGenRequest {
  prompt: string;
  negative_prompt?: string;
  seed?: number;
  steps?: number;
  width?: number;
  height?: number;
  cfg_scale?: number;
}

/**
 * POST /api/image
 * Generate an image using NVIDIA NIM SD3 Medium and save to Appwrite Storage.
 * Returns the Appwrite file URL.
 */
export async function POST(request: NextRequest) {
  console.log("[API /image] START: Received request");

  try {
    // Auth check
    const client = await createSessionClient();
    if (!client) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await client.account.get();
    const body: ImageGenRequest = await request.json();

    if (!body.prompt || body.prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Missing prompt" },
        { status: 400 }
      );
    }

    if (!NVIDIA_API_KEY) {
      return NextResponse.json(
        { error: "NVIDIA_API_KEY not configured" },
        { status: 500 }
      );
    }

    console.log("[API /image] Generating for:", body.prompt.slice(0, 80));

    // Call NVIDIA SD3 Medium
    const nvidiaPayload: any = {
      prompt: body.prompt,
      model: "sd3",
      aspect_ratio: "1:1",
      cfg_scale: body.cfg_scale ?? 5,
      steps: body.steps ?? 50,
      seed: body.seed ?? 0,
      output_format: "jpeg",
      mode: "text-to-image",
    };

    if (body.negative_prompt) {
      nvidiaPayload.negative_prompt = body.negative_prompt;
    }

    const nvidiaRes = await fetch(NVIDIA_IMAGE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${NVIDIA_API_KEY}`,
      },
      body: JSON.stringify(nvidiaPayload),
      signal: AbortSignal.timeout(60000), // 60s timeout
    });

    if (!nvidiaRes.ok) {
      const errorText = await nvidiaRes.text().catch(() => "Unknown error");
      console.error("[API /image] NVIDIA API error:", nvidiaRes.status, errorText);
      
      if (nvidiaRes.status === 429) {
        return NextResponse.json(
          { error: "Image generation is busy. Please try again in a moment." },
          { status: 429 }
        );
      }
      
      return NextResponse.json(
        { error: `Image generation failed: ${nvidiaRes.status}` },
        { status: 502 }
      );
    }

    const nvidiaData = await nvidiaRes.json();
    const base64Image = nvidiaData?.image || nvidiaData?.artifacts?.[0]?.base64;

    if (!base64Image) {
      console.error("[API /image] No image data in response:", JSON.stringify(nvidiaData).slice(0, 200));
      return NextResponse.json(
        { error: "No image generated" },
        { status: 502 }
      );
    }

    console.log("[API /image] Image generated, saving to storage...");

    // Convert base64 to buffer and upload to Appwrite Storage
    const imageBuffer = Buffer.from(base64Image, "base64");
    const fileName = `clavis-gen-${Date.now()}.png`;
    const inputFile = InputFile.fromBuffer(imageBuffer, fileName);

    const admin = await createAdminClient();
    const uploadedFile = await admin.storage.createFile(
      BUCKET_ID,
      ID.unique(),
      inputFile
    );

    // Build the public file URL
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
    const fileUrl = `${endpoint}/storage/buckets/${BUCKET_ID}/files/${uploadedFile.$id}/view?project=${projectId}`;

    console.log("[API /image] Image saved:", uploadedFile.$id);

    return NextResponse.json({
      url: fileUrl,
      fileId: uploadedFile.$id,
      prompt: body.prompt,
    });
  } catch (err: any) {
    console.error("[API /image] Error:", err);
    
    if (err.name === "TimeoutError" || err.message?.includes("timeout")) {
      return NextResponse.json(
        { error: "Image generation timed out. Please try again." },
        { status: 504 }
      );
    }
    
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
