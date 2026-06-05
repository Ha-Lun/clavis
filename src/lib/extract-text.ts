/**
 * Shared text extraction utility for uploaded files.
 * Uses markitdown CLI for rich document formats (PDF, DOCX, PPTX, XLSX, etc.)
 * and falls back to raw UTF-8 for plain text files.
 */

import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, unlink } from "fs/promises";
import { extname, join } from "path";
import { tmpdir } from "os";

const execAsync = promisify(exec);

/** Max characters to keep from extracted text. Must fit Appwrite string attribute limit. */
export const MAX_EXTRACTED_CHARS = 999_999;

const TEXT_EXTENSIONS = new Set([
  ".md", ".py", ".js", ".ts", ".tsx", ".jsx", ".css", ".scss",
  ".json", ".txt", ".csv", ".html", ".htm", ".xml", ".yaml", ".yml",
  ".toml", ".ini", ".cfg", ".conf", ".sh", ".bash", ".zsh",
  ".sql", ".r", ".rb", ".go", ".rs", ".java", ".c", ".cpp", ".h",
  ".env", ".log", ".gitignore", ".dockerfile",
]);

function isTextFile(fileName: string, mimeType?: string | null): boolean {
  const ext = extname(fileName).toLowerCase();
  if (TEXT_EXTENSIONS.has(ext)) return true;
  if (mimeType?.startsWith("text/")) return true;
  if (mimeType === "application/json" || mimeType === "application/xml") return true;
  return false;
}

export interface ExtractionResult {
  text: string | null;
  method: "markitdown" | "plaintext" | "none";
  error?: string;
}

/**
 * Extract text content from a file buffer.
 * 
 * @param buffer - The raw file bytes
 * @param fileName - Original file name (used for extension detection)
 * @param mimeType - Optional MIME type
 * @returns ExtractionResult with the extracted text and method used
 */
export async function extractTextFromBuffer(
  buffer: Buffer,
  fileName: string,
  mimeType?: string | null,
): Promise<ExtractionResult> {
  const ext = extname(fileName) || "";
  const tempFileName = `extract-${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
  const tempFilePath = join(tmpdir(), tempFileName);

  try {
    // Write buffer to temp file for markitdown
    await writeFile(tempFilePath, buffer);

    // Try markitdown first — it handles PDF, DOCX, PPTX, XLSX, images, audio, etc.
    try {
      const execEnv = {
        ...process.env,
        PATH: `${process.env.PATH || ""}:/home/hannes/.local/bin:/usr/local/bin`,
      };
      const { stdout, stderr } = await execAsync(`markitdown "${tempFilePath}"`, {
        maxBuffer: 1024 * 1024 * 10, // 10MB
        timeout: 30_000, // 30s timeout
        env: execEnv,
      });

      const text = stdout.trim();

      if (stderr) {
        console.warn(`[extractText] markitdown stderr for ${fileName}:`, stderr.slice(0, 500));
      }

      if (text.length > 0) {
        console.log(`[extractText] markitdown success for ${fileName}: ${text.length} chars`);
        return {
          text: text.length > MAX_EXTRACTED_CHARS ? text.slice(0, MAX_EXTRACTED_CHARS) : text,
          method: "markitdown",
        };
      }

      // markitdown returned empty — fall through to plaintext check
      console.warn(`[extractText] markitdown returned empty for ${fileName}`);
    } catch (execErr: any) {
      console.error(`[extractText] markitdown failed for ${fileName}:`, execErr.message?.slice(0, 300));
    }

    // Fallback: try reading as plain text if file type suggests it
    if (isTextFile(fileName, mimeType)) {
      const text = buffer.toString("utf-8").trim();
      if (text.length > 0) {
        console.log(`[extractText] plaintext fallback for ${fileName}: ${text.length} chars`);
        return {
          text: text.length > MAX_EXTRACTED_CHARS ? text.slice(0, MAX_EXTRACTED_CHARS) : text,
          method: "plaintext",
        };
      }
    }

    console.warn(`[extractText] No text could be extracted from ${fileName}`);
    return { text: null, method: "none", error: "No text could be extracted" };
  } catch (err: any) {
    console.error(`[extractText] Setup error for ${fileName}:`, err.message);
    return { text: null, method: "none", error: err.message };
  } finally {
    // Always clean up temp file
    await unlink(tempFilePath).catch(() => {});
  }
}
