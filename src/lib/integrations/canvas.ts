export interface CanvasEvent {
  id: string | number;
  title: string;
  start_at: string;
  end_at: string;
  description: string;
  context_name: string;
  html_url: string;
  location_name?: string;
  location_address?: string;
  [key: string]: unknown;
}

export interface CanvasCourse {
  id: string | number;
  name: string;
  course_code: string;
  syllabus_body?: string | null;
  [key: string]: unknown;
}

export interface CanvasPage {
  page_id: string | number;
  url: string;
  title: string;
  body?: string | null;
  html_url?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface CanvasAssignment {
  id: string | number;
  name: string;
  description?: string | null;
  due_at?: string | null;
  html_url?: string;
  points_possible?: number | null;
  [key: string]: unknown;
}

export interface CanvasModule {
  id: string | number;
  name: string;
  position?: number;
  items_count?: number;
  items?: CanvasModuleItem[];
  [key: string]: unknown;
}

export interface CanvasFile {
  id: string | number;
  display_name: string;
  filename: string;
  url?: string;
  html_url?: string;
  size?: number;
  "content-type"?: string;
  [key: string]: unknown;
}

const canvasCache = new Map<string, { data: any; response: Response; expires: number }>();

export function clearCanvasCache(token?: string) {
  if (token) {
    for (const key of canvasCache.keys()) {
      if (key.startsWith(token + ":")) {
        canvasCache.delete(key);
      }
    }
  } else {
    canvasCache.clear();
  }
}

function getCacheTTL(url: string): number {
  if (url.includes("/courses?enrollment_state=active") || url.includes("/courses?")) return 24 * 60 * 60 * 1000;
  if (url.includes("include[]=syllabus_body") || url.includes("/modules") || url.includes("/pages")) return 3 * 60 * 60 * 1000;
  if (url.includes("/assignments") || url.includes("only_announcements=true") || url.includes("/calendar_events")) return 15 * 60 * 1000;
  return 0;
}

const DEFAULT_TIMEOUT_MS = 8_000;
const MAX_PAGES = 100;
const API_PATH = "/api/v1";

/**
 * Normalizes a user-provided Canvas instance URL and rejects common SSRF targets.
 * Canvas instances must be addressed over HTTPS; credentials, query strings, and
 * fragments are not meaningful for an instance URL and are rejected.
 */
export function normalizeCanvasUrl(canvasUrl: string): string {
  if (typeof canvasUrl !== "string" || canvasUrl.trim() === "") {
    throw new Error("Canvas URL is required");
  }

  let parsed: URL;
  try {
    parsed = new URL(canvasUrl.trim());
  } catch {
    throw new Error("Invalid Canvas URL");
  }

  if (parsed.protocol !== "https:") {
    throw new Error("Only HTTPS URLs are allowed");
  }
  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error("Canvas URL must not contain credentials, a query, or a fragment");
  }

  let hostname = parsed.hostname.toLowerCase().replace(/\.$/, "");
  if (hostname === "studium.uu.se") {
    hostname = "uppsala.instructure.com";
  }

  if (isBlockedHostname(hostname)) {
    throw new Error("Invalid Canvas hostname");
  }

  parsed.hostname = hostname;
  parsed.pathname = parsed.pathname.replace(/\/+$/, "");
  return parsed.toString().replace(/\/$/, "");
}

function isBlockedHostname(hostname: string): boolean {
  const normalized = hostname.replace(/^\[|\]$/g, "");
  const blockedNames = new Set([
    "localhost",
    "localhost.localdomain",
    "ip6-localhost",
    "ip6-loopback",
    "0.0.0.0",
    "169.254.169.254",
    "metadata.google.internal",
  ]);

  if (blockedNames.has(normalized)) return true;
  if (
    normalized === "::1" ||
    normalized === "::" ||
    normalized.startsWith("fe80:") ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("::ffff:127.") ||
    normalized.startsWith("::ffff:10.") ||
    normalized.startsWith("::ffff:192.168.")
  ) return true;
  if (/^10\./.test(normalized) || /^127\./.test(normalized) || /^192\.168\./.test(normalized)) {
    return true;
  }
  return /^172\.(1[6-9]|2\d|3[0-1])\./.test(normalized);
}

function coursePath(courseId: number | string): string {
  const value = String(courseId).trim();
  if (!/^\d+$/.test(value)) {
    throw new Error("Canvas course ID must be a positive integer");
  }
  return encodeURIComponent(value);
}

function apiUrl(canvasUrl: string, path: string): string {
  return `${normalizeCanvasUrl(canvasUrl)}${API_PATH}${path}`;
}

function authorizationHeaders(token: string): HeadersInit {
  if (typeof token !== "string" || token.trim() === "") {
    throw new Error("Canvas token is required");
  }
  return { Authorization: `Bearer ${token}`, Accept: "application/json+canvas-string-ids" };
}

async function fetchJson<T>(url: string, token: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<{ data: T; response: Response }> {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new Error("Canvas request timeout must be positive");
  }

  const ttl = getCacheTTL(url);
  const cacheKey = token + ":" + url;
  if (ttl > 0) {
    const cached = canvasCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return { data: cached.data as T, response: cached.response.clone() };
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let currentUrl = url;
    let response = await fetch(currentUrl, {
      headers: authorizationHeaders(token),
      redirect: "manual",
      signal: controller.signal,
    });

    let redirects = 0;
    while ([301, 302, 303, 307, 308].includes(response.status) && redirects < 5) {
      const location = response.headers.get("location");
      if (!location) break;
      const nextUrl = new URL(location, currentUrl);
      if (nextUrl.protocol !== "https:" || isBlockedHostname(nextUrl.hostname)) {
        throw new Error("Canvas redirect points to an invalid host");
      }
      currentUrl = nextUrl.toString();
      response = await fetch(currentUrl, {
        headers: authorizationHeaders(token),
        redirect: "manual",
        signal: controller.signal,
      });
      redirects++;
    }

    if (!response.ok) {
      throw new Error(`Canvas request failed: HTTP ${response.status}`);
    }
    const data = await response.json();
    if (ttl > 0) {
      canvasCache.set(cacheKey, { data, response: response.clone(), expires: Date.now() + ttl });
    }
    return { data: data as T, response };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Canvas request timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function validatePaginationUrl(url: URL, expectedOrigin: string): void {
  if (url.protocol !== "https:" || url.username || url.password || isBlockedHostname(url.hostname) || url.origin !== expectedOrigin) {
    throw new Error("Canvas pagination link points to an invalid host");
  }
}

function nextLink(response: Response, currentUrl: string, expectedOrigin: string): string | undefined {
  const linkHeader = response.headers.get("link");
  if (!linkHeader) return undefined;

  for (const link of linkHeader.split(",")) {
    const match = link.match(/<([^>]+)>\s*;\s*rel\s*=\s*["']?([^"';,]+)["']?/i);
    if (!match) continue;
    const relations = match[2].split(/\s+/).map((relation) => relation.toLowerCase());
    if (!relations.includes("next")) continue;

    const next = new URL(match[1], currentUrl);
    // Pagination links are server-controlled, but must still pass the same SSRF checks.
    validatePaginationUrl(next, expectedOrigin);
    return next.toString();
  }
  return undefined;
}

async function fetchAll<T>(firstUrl: string, token: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T[]> {
  const results: T[] = [];
  let url: string | undefined = firstUrl;
  const expectedOrigin = new URL(firstUrl).origin;

  for (let page = 0; url && page < MAX_PAGES; page += 1) {
    const currentUrl = url;
    const { data, response } = await fetchJson<T[]>(currentUrl, token, timeoutMs);
    if (!Array.isArray(data)) throw new Error("Canvas returned an invalid paginated response");
    results.push(...data);
    url = nextLink(response, currentUrl, expectedOrigin);
  }

  if (url) throw new Error(`Canvas pagination exceeded the ${MAX_PAGES}-page limit`);
  return results;
}

export async function testCanvasConnection(canvasUrl: string, token: string): Promise<boolean> {
  try {
    await fetchJson(apiUrl(canvasUrl, "/users/self/profile"), token);
    return true;
  } catch {
    return false;
  }
}

export async function getCanvasUpcomingEvents(canvasUrl: string, token: string): Promise<CanvasEvent[]> {
  return fetchAll<CanvasEvent>(apiUrl(canvasUrl, "/users/self/upcoming_events"), token);
}

/** Returns all active courses, following Canvas pagination links. */
export async function getCanvasCourses(canvasUrl: string, token: string): Promise<CanvasCourse[]> {
  return fetchAll<CanvasCourse>(apiUrl(canvasUrl, "/courses?enrollment_state=active&include[]=term&per_page=100"), token);
}

export async function getCanvasSyllabus(
  canvasUrl: string,
  token: string,
  courseId: number | string,
): Promise<string | null> {
  const course = await fetchJson<CanvasCourse>(
    apiUrl(canvasUrl, `/courses/${coursePath(courseId)}?include[]=syllabus_body`),
    token,
  );
  return course.data.syllabus_body ?? null;
}

export async function getCanvasPages(canvasUrl: string, token: string, courseId: number | string): Promise<CanvasPage[]> {
  return fetchAll<CanvasPage>(apiUrl(canvasUrl, `/courses/${coursePath(courseId)}/pages`), token);
}

export async function getCanvasPage(canvasUrl: string, token: string, courseId: number | string, pageId: string): Promise<CanvasPage> {
  return (await fetchJson<CanvasPage>(apiUrl(canvasUrl, `/courses/${coursePath(courseId)}/pages/${encodeURIComponent(pageId)}`), token)).data;
}

export async function getCanvasAssignments(
  canvasUrl: string,
  token: string,
  courseId: number | string,
): Promise<CanvasAssignment[]> {
  return fetchAll<CanvasAssignment>(apiUrl(canvasUrl, `/courses/${coursePath(courseId)}/assignments?per_page=50&order_by=due_at`), token);
}

export interface CanvasModuleItem {
  id: string | number;
  title: string;
  type: string;
  url?: string;
  html_url?: string;
  page_url?: string;
  content_id?: string | number;
  [key: string]: unknown;
}

export async function getCanvasModules(canvasUrl: string, token: string, courseId: number | string): Promise<CanvasModule[]> {
  return fetchAll<CanvasModule>(apiUrl(canvasUrl, `/courses/${coursePath(courseId)}/modules?include[]=items&per_page=100`), token);
}

export async function getCanvasFiles(canvasUrl: string, token: string, courseId: number | string): Promise<CanvasFile[]> {
  return fetchAll<CanvasFile>(apiUrl(canvasUrl, `/courses/${coursePath(courseId)}/files`), token);
}

export async function getCanvasCourseDetails(canvasUrl: string, token: string, courseId: number | string): Promise<CanvasCourse> {
  const { data } = await fetchJson<CanvasCourse>(
    apiUrl(canvasUrl, `/courses/${coursePath(courseId)}?include[]=syllabus_body&include[]=term`),
    token
  );
  return data;
}

export interface CanvasAnnouncement {
  id: string | number;
  title: string;
  message: string;
  posted_at: string;
  [key: string]: unknown;
}

export async function getCanvasAnnouncements(canvasUrl: string, token: string, courseId: number | string): Promise<CanvasAnnouncement[]> {
  return fetchAll<CanvasAnnouncement>(
    apiUrl(canvasUrl, `/courses/${coursePath(courseId)}/discussion_topics?only_announcements=true&per_page=10`),
    token
  );
}

export async function getCanvasCalendarEvents(canvasUrl: string, token: string, courseId: number | string): Promise<CanvasEvent[]> {
  return fetchAll<CanvasEvent>(
    apiUrl(canvasUrl, `/calendar_events?context_codes[]=course_${coursePath(courseId)}&all_events=true&per_page=50`),
    token
  );
}
