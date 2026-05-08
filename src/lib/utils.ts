import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface Attachment {
  name: string;
  url: string;
}

/**
 * Extracts attachments from message content (pattern: 📎 filename: url)
 * and returns the cleaned content.
 */
export function extractAttachments(content: string) {
  const fileRegex = /📎\s*([^:\n]+):\s*(https?:\/\/[^\s\n]+)/g;
  const attachments: Attachment[] = [];
  
  // Use a copy to find all matches
  const matches = content.matchAll(fileRegex);
  for (const match of matches) {
    attachments.push({
      name: match[1].trim(),
      url: match[2].trim(),
    });
  }

  // Remove the attachment lines from the display content
  const cleanContent = content.replace(/📎\s*([^:\n]+):\s*(https?:\/\/[^\s\n]+)\n?/g, "").trim();

  return { attachments, cleanContent };
}
