import { createHash } from "node:crypto";
import { ID, Query, type Databases } from "node-appwrite";
import { COLLECTIONS, DATABASE_ID } from "@/lib/appwrite/config";
import type { CourseChunkRecord, CourseSourceRecord } from "./types";

export const COURSE_CHUNKER_VERSION = "course-v1";

export function normalizeCourseText(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function hashContent(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function chunkCourseText(text: string, maxChars = 3600, overlap = 400): string[] {
  const normalized = normalizeCourseText(text);
  if (!normalized) return [];
  const chunks: string[] = [];
  let start = 0;
  while (start < normalized.length) {
    let end = Math.min(start + maxChars, normalized.length);
    if (end < normalized.length) {
      const boundary = normalized.lastIndexOf("\n\n", end);
      const sentence = normalized.lastIndexOf(". ", end);
      if (boundary > start + maxChars * 0.55) end = boundary;
      else if (sentence > start + maxChars * 0.65) end = sentence + 1;
    }
    const chunk = normalized.slice(start, end).trim();
    if (chunk) chunks.push(chunk);
    if (end >= normalized.length) break;
    start = Math.max(end - overlap, start + 1);
  }
  return chunks;
}

export async function replaceSourceChunks(
  databases: Databases,
  source: CourseSourceRecord,
): Promise<number> {
  let cursor: string | undefined;
  do {
    const queries = [Query.equal("source_id", source.$id), Query.limit(100)];
    if (cursor) queries.push(Query.cursorAfter(cursor));
    const oldChunks = await databases.listDocuments(DATABASE_ID, COLLECTIONS.COURSE_CHUNKS, queries);
    await Promise.all(oldChunks.documents.map((chunk) =>
      databases.deleteDocument(DATABASE_ID, COLLECTIONS.COURSE_CHUNKS, chunk.$id),
    ));
    cursor = oldChunks.documents.length === 100 ? oldChunks.documents[oldChunks.documents.length - 1].$id : undefined;
  } while (cursor);

  const chunks = chunkCourseText(source.content);
  for (let index = 0; index < chunks.length; index += 1) {
    const content = chunks[index];
    await databases.createDocument(DATABASE_ID, COLLECTIONS.COURSE_CHUNKS, ID.unique(), {
      user_id: source.user_id,
      course_id: source.course_id,
      source_id: source.$id,
      source_hash: source.content_hash,
      chunk_index: index,
      heading: source.title,
      content: `${source.source_url ? `Source URL: ${source.source_url}\n` : ""}${content}`,
    });
  }
  return chunks.length;
}

function terms(question: string): string[] {
  return Array.from(new Set(
    question.toLowerCase().normalize("NFKC").match(new RegExp("[\\p{L}\\p{N}_]{3,}", "gu")) ?? [],
  )).slice(0, 8);
}

export function classifyReadingPriority(text: string, title: string = ""): "mandatory" | "optional" | "general" {
  const mandatoryRegex = /\b(obligatorisk|krav|krävs|kurslitteratur|obligatoriskt|mandatory|required|compulsory|essential reading)\b/i;
  const optionalRegex = /\b(valfri|valfritt|frivillig|frivilligt|rekommenderad|rekommenderat|fördjupning|optional|recommended|supplementary|further reading)\b/i;
  
  const content = `${title} ${text}`;
  if (mandatoryRegex.test(content)) return "mandatory";
  if (optionalRegex.test(content)) return "optional";
  return "general";
}

export async function retrieveCourseContext(
  databases: Databases,
  userId: string,
  courseId: string,
  question: string,
): Promise<{ text: string; citations: Array<{ id: string; title: string; url: string | null }> }> {
  const searchTerms = terms(question);
  const queries = [
    Query.equal("user_id", userId),
    Query.equal("course_id", courseId),
    Query.limit(100),
  ];
  // Appwrite installations with smaller attribute limits do not have a full-text field.
  // The chunk collection is still bounded to the selected course and reranked locally.
  const result = await databases.listDocuments(DATABASE_ID, COLLECTIONS.COURSE_CHUNKS, queries);

  let scored = (result.documents as unknown as CourseChunkRecord[]).map((chunk) => {
    const haystack = `${chunk.heading ?? ""} ${chunk.content}`.toLowerCase();
    const score = searchTerms.reduce((total, term) => total + (haystack.includes(term) ? 1 : 0), 0);
    return { chunk, score };
  }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 8);

  if (scored.length === 0) {
    scored = (result.documents as unknown as CourseChunkRecord[]).slice(0, 3).map(chunk => ({ chunk, score: 0 }));
  }

  const citations = scored.map(({ chunk }, index) => {
    let title = chunk.heading || "Course material";
    const priority = classifyReadingPriority(chunk.content, title);
    if (priority === "mandatory") title = `[MANDATORY READING] ${title}`;
    if (priority === "optional") title = `[OPTIONAL READING] ${title}`;
    return {
      id: `S${index + 1}`,
      title,
      url: chunk.content.match(/Source URL: (https?:\/\/[^\s]+)/)?.[1] ?? null,
    };
  });
  const text = scored.map(({ chunk }, index) => {
    let title = chunk.heading || "Course material";
    const priority = classifyReadingPriority(chunk.content, title);
    if (priority === "mandatory") title = `[MANDATORY READING] ${title}`;
    if (priority === "optional") title = `[OPTIONAL READING] ${title}`;
    return `[S${index + 1}] ${title}\n${chunk.content}`;
  }).join("\n\n");
  return { text, citations };
}

export function fingerprintSources(sources: CourseSourceRecord[]): string {
  return hashContent(sources.map((source) => `${source.$id}:${source.content_hash}`).sort().join("|"));
}
