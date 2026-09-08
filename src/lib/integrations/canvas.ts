export interface CanvasEvent {
  id: number;
  title: string;
  start_at: string;
  end_at: string;
  description: string;
  context_name: string;
  html_url: string;
}

export interface CanvasCourse {
  id: number;
  name: string;
  course_code: string;
}



function validateUrl(urlString: string): string {
  const parsed = new URL(urlString);
  if (parsed.protocol !== 'https:') {
    throw new Error('Only HTTPS URLs are allowed');
  }
  const hostname = parsed.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname === '0.0.0.0' || hostname === '169.254.169.254') {
    throw new Error('Invalid hostname');
  }
  if (/^10\./.test(hostname) || /^192\.168\./.test(hostname) || /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)) {
    throw new Error('Invalid hostname');
  }
  return urlString;
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 8000) {
  const fetchUrl = validateUrl(url);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(fetchUrl, {
      ...options,
      signal: controller.signal,
      redirect: "error",
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

export async function testCanvasConnection(canvasUrl: string, token: string): Promise<boolean> {
  try {
    const baseUrl = canvasUrl.replace(/\/$/, '');
    await fetchWithTimeout(`${baseUrl}/api/v1/users/self/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return true;
  } catch (err) {
    return false;
  }
}

export async function getCanvasUpcomingEvents(canvasUrl: string, token: string): Promise<CanvasEvent[]> {
  const baseUrl = canvasUrl.replace(/\/$/, '');
  return fetchWithTimeout(`${baseUrl}/api/v1/users/self/upcoming_events`, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export async function getCanvasCourses(canvasUrl: string, token: string): Promise<CanvasCourse[]> {
  const baseUrl = canvasUrl.replace(/\/$/, '');
  return fetchWithTimeout(`${baseUrl}/api/v1/courses?enrollment_state=active`, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

