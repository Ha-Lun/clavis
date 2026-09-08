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

export interface CanvasAssignment {
  id: number;
  name: string;
  description: string;
  due_at: string;
  html_url: string;
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
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

export async function getCanvasAssignments(canvasUrl: string, token: string, courseId: number): Promise<CanvasAssignment[]> {
  const baseUrl = canvasUrl.replace(/\/$/, '');
  return fetchWithTimeout(`${baseUrl}/api/v1/courses/${courseId}/assignments`, {
    headers: { Authorization: `Bearer ${token}` }
  });
}
