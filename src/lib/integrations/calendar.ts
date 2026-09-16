import { rrulestr } from 'rrule';

export interface CalendarEvent {
  summary: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  description?: string;
  isAllDay?: boolean;
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
  let currentEvent: any = {};

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
      if (currentEvent.summary && currentEvent.startDate) {
        // Handle duration / missing end date
        if (!currentEvent.endDate) {
          if (currentEvent.duration) {
            currentEvent.endDate = new Date(currentEvent.startDate.getTime() + currentEvent.duration);
          } else if (currentEvent.isAllDay) {
            currentEvent.endDate = new Date(currentEvent.startDate.getTime() + 24 * 60 * 60 * 1000 - 1);
          } else {
            currentEvent.endDate = new Date(currentEvent.startDate.getTime() + 60 * 60 * 1000);
          }
        }
        
        if (currentEvent.rrule) {
          // expand RRULE
          try {
            const rule = rrulestr(currentEvent.rrule, { dtstart: currentEvent.startDate });
            const now = new Date();
            const past = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
            const future = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
            const occurrences = rule.between(past, future, true);
            const durationMs = currentEvent.endDate.getTime() - currentEvent.startDate.getTime();
            
            for (const date of occurrences) {
              events.push({
                summary: currentEvent.summary,
                startDate: date,
                endDate: new Date(date.getTime() + durationMs),
                location: currentEvent.location,
                description: currentEvent.description,
                isAllDay: currentEvent.isAllDay
              });
            }
          } catch (e) {
            // fallback if RRULE parse fails
            events.push(currentEvent as CalendarEvent);
          }
        } else {
          events.push(currentEvent as CalendarEvent);
        }
      }
      continue;
    }

    if (inEvent) {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;

      const keyPart = line.slice(0, colonIdx);
      const value = line.slice(colonIdx + 1).replace(/\\,/g, ',').replace(/\\n/g, '\n').replace(/\\;/g, ';');
      
      const keyParams = keyPart.split(';');
      const key = keyParams[0];

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
          currentEvent.isAllDay = keyParams.includes('VALUE=DATE');
          currentEvent.startDate = parseICSDate(value, currentEvent.isAllDay);
          break;
        case 'DTEND':
          currentEvent.endDate = parseICSDate(value, keyParams.includes('VALUE=DATE'));
          if (keyParams.includes('VALUE=DATE')) {
              currentEvent.endDate = new Date(currentEvent.endDate.getTime() - 1);
          }
          break;
        case 'DURATION':
          currentEvent.duration = parseDuration(value);
          break;
        case 'RRULE':
          currentEvent.rrule = value;
          break;
      }
    }
  }

  return events;
}

function parseDuration(durStr: string): number {
  let ms = 0;
  const match = durStr.match(/P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?/);
  if (match) {
    const weeks = parseInt(match[1] || '0');
    const days = parseInt(match[2] || '0');
    const hours = parseInt(match[3] || '0');
    const mins = parseInt(match[4] || '0');
    const secs = parseInt(match[5] || '0');
    ms = (((weeks * 7 + days) * 24 + hours) * 60 + mins) * 60 * 1000 + secs * 1000;
  }
  return ms;
}

function parseICSDate(dateStr: string, isAllDay: boolean = false): Date {
  const year = parseInt(dateStr.slice(0, 4));
  const month = parseInt(dateStr.slice(4, 6)) - 1;
  const day = parseInt(dateStr.slice(6, 8));
  
  if (dateStr.length > 8 && !isAllDay) {
    const hour = parseInt(dateStr.slice(9, 11));
    const minute = parseInt(dateStr.slice(11, 13));
    const second = parseInt(dateStr.slice(13, 15));
    if (dateStr.endsWith('Z')) {
      return new Date(Date.UTC(year, month, day, hour, minute, second));
    }
    return new Date(year, month, day, hour, minute, second);
  }
  
  if (isAllDay) {
      return new Date(year, month, day, 0, 0, 0);
  }
  return new Date(year, month, day);
}

export function filterEvents(events: CalendarEvent[], filter: "today" | "tomorrow" | "week" | "month" | "upcoming" | "all" = "upcoming"): CalendarEvent[] {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  events.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  
  if (filter === "all") return events;
  
  let filtered = events.filter(e => {
    if (filter === "today") {
      const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
      return e.startDate >= startOfToday && e.startDate < endOfToday;
    } else if (filter === "tomorrow") {
      const startOfTomorrow = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
      const endOfTomorrow = new Date(startOfTomorrow.getTime() + 24 * 60 * 60 * 1000);
      return e.startDate >= startOfTomorrow && e.startDate < endOfTomorrow;
    } else if (filter === "week") {
      const endOfWeek = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);
      return e.startDate >= startOfToday && e.startDate < endOfWeek;
    } else if (filter === "month") {
      const endOfMonth = new Date(startOfToday.getTime() + 30 * 24 * 60 * 60 * 1000);
      return e.startDate >= startOfToday && e.startDate < endOfMonth;
    } else { // upcoming
      return e.startDate >= startOfToday;
    }
  });

  if (filter === "upcoming" || filter === undefined) {
    filtered = filtered.slice(0, 50);
  }

  return filtered;
}
