export interface CalendarEvent {
  summary: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  description?: string;
}

function validateUrl(urlString: string): string {
  let url = urlString;
  if (url.startsWith('webcal://')) {
    url = 'https://' + url.slice(9);
  }
  
  const parsed = new URL(url);
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

  return url;
}

export async function fetchAndParseCalendar(url: string): Promise<CalendarEvent[]> {
  try {
    let currentUrl = validateUrl(url);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    
    let response = await fetch(currentUrl, { signal: controller.signal, redirect: "manual" });
    
    let redirects = 0;
    while ([301, 302, 303, 307, 308].includes(response.status) && redirects < 5) {
      const location = response.headers.get("location");
      if (!location) break;
      
      const nextUrl = new URL(location, currentUrl);
      currentUrl = validateUrl(nextUrl.toString());
      
      response = await fetch(currentUrl, { signal: controller.signal, redirect: "manual" });
      redirects++;
    }

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Failed to fetch calendar: ${response.status}`);
    }

    const icsData = await response.text();
    return parseICS(icsData);
  } catch (error: any) {
    throw new Error(error?.message || "Calendar fetch/parse error");
  }
}

export function parseICS(icsData: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const lines = icsData.split(/\r?\n/);
  
  let inEvent = false;
  let currentEvent: Partial<CalendarEvent> = {};

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Handle folded lines
    while (i + 1 < lines.length && (lines[i + 1].startsWith(' ') || lines[i + 1].startsWith('\t'))) {
      i++;
      line += lines[i].slice(1);
    }

    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      currentEvent = {};
      continue;
    }

    if (line === 'END:VEVENT') {
      inEvent = false;
      if (currentEvent.summary && currentEvent.startDate && currentEvent.endDate) {
        events.push(currentEvent as CalendarEvent);
      }
      continue;
    }

    if (inEvent) {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;

      const keyPart = line.slice(0, colonIdx);
      const value = line.slice(colonIdx + 1).replace(/\\,/g, ',').replace(/\\n/g, '\n').replace(/\\;/g, ';');
      
      const key = keyPart.split(';')[0]; // Ignore parameters for now

      switch (key) {
        case 'SUMMARY':
          currentEvent.summary = value;
          break;
        case 'LOCATION':
          currentEvent.location = value;
          break;
        case 'DESCRIPTION':
          currentEvent.description = value;
          break;
        case 'DTSTART':
          currentEvent.startDate = parseICSDate(value);
          break;
        case 'DTEND':
          currentEvent.endDate = parseICSDate(value);
          break;
      }
    }
  }

  return events;
}

function parseICSDate(dateStr: string): Date {
  const year = parseInt(dateStr.slice(0, 4));
  const month = parseInt(dateStr.slice(4, 6)) - 1;
  const day = parseInt(dateStr.slice(6, 8));
  
  if (dateStr.length > 8) {
    const hour = parseInt(dateStr.slice(9, 11));
    const minute = parseInt(dateStr.slice(11, 13));
    const second = parseInt(dateStr.slice(13, 15));
    if (dateStr.endsWith('Z')) {
      return new Date(Date.UTC(year, month, day, hour, minute, second));
    }
    // Very basic timezone handling (assumes local time if not Z)
    return new Date(year, month, day, hour, minute, second);
  }
  
  return new Date(year, month, day);
}

export function filterEvents(events: CalendarEvent[], filter: "today" | "week" | "all" = "all"): CalendarEvent[] {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  if (filter === "all") return events;
  
  return events.filter(e => {
    if (filter === "today") {
      const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
      return e.startDate >= startOfToday && e.startDate < endOfToday;
    } else {
      const endOfWeek = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);
      return e.startDate >= startOfToday && e.startDate < endOfWeek;
    }
  });
}
