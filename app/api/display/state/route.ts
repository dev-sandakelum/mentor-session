import { NextResponse } from "next/server";
import { apiError, readJson, requireAdmin } from "@/lib/api";
import { getDisplayState, setDisplayState, subscribeDisplay, type DisplayScene } from "@/lib/display-state";

export const dynamic = "force-dynamic";

// GET /api/display/state  — SSE stream for the /display page
export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send current state immediately on connect
      const send = (data: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch { /* client disconnected */ }
      };

      send(getDisplayState());

      // Subscribe to future updates
      const unsub = subscribeDisplay((state) => send(state));

      // Keepalive ping every 15s so the connection stays alive through proxies
      const ping = setInterval(() => {
        try { controller.enqueue(encoder.encode(`: ping\n\n`)); } catch { clearInterval(ping); }
      }, 15_000);

      // Cleanup when client disconnects
      return () => { unsub(); clearInterval(ping); };
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type":  "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection":    "keep-alive",
      "X-Accel-Buffering": "no", // disable nginx buffering
    },
  });
}

// POST /api/display/state  — admin sets current display scene
export async function POST(request: Request) {
  try {
    requireAdmin(request);
    const body = await readJson(request);
    const scene = body.scene as DisplayScene;
    if (!scene?.type) throw new Error("scene.type is required.");
    const state = setDisplayState(scene);
    return NextResponse.json(state);
  } catch (error) {
    return apiError(error);
  }
}
