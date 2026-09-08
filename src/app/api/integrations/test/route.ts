import { NextRequest } from "next/server";
import { testCanvasConnection } from "@/lib/integrations/canvas";
import { fetchAndParseCalendar } from "@/lib/integrations/calendar";
import { createSessionClient } from "@/lib/appwrite/server";

export async function POST(req: NextRequest) {
  try {
    const client = await createSessionClient();
    if (!client) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    const prefs = await client.account.getPrefs();

    const body = await req.json();
    const { type, canvasUrl, calendarIcsUrl } = body;
    const canvasToken = body.canvasToken || (prefs as any).canvasToken;

    if (type === "canvas") {
      if (!canvasUrl || !canvasToken) {
        return new Response(JSON.stringify({ success: false, message: "Missing Canvas URL or token" }), { status: 400 });
      }
      
      const success = await testCanvasConnection(canvasUrl, canvasToken);
      if (success) {
        return new Response(JSON.stringify({ success: true, message: "Canvas connection successful" }), { status: 200 });
      } else {
        return new Response(JSON.stringify({ success: false, message: "Canvas connection failed" }), { status: 400 });
      }
    } else if (type === "calendar") {
      if (!calendarIcsUrl) {
        return new Response(JSON.stringify({ success: false, message: "Missing calendar ICS URL" }), { status: 400 });
      }
      
      try {
        const events = await fetchAndParseCalendar(calendarIcsUrl);
        return new Response(JSON.stringify({ success: true, message: "Calendar connection successful", details: { eventCount: events.length } }), { status: 200 });
      } catch (err: any) {
        return new Response(JSON.stringify({ success: false, message: err.message }), { status: 400 });
      }
    } else {
      return new Response(JSON.stringify({ success: false, message: "Invalid integration type" }), { status: 400 });
    }
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, message: "Internal server error" }), { status: 500 });
  }
}
