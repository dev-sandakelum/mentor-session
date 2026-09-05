import { NextResponse } from "next/server";
import { apiError, readJson, requireAdmin } from "@/lib/api";
import { getDisplayState, setDisplayState, type DisplayScene } from "@/lib/display-state";

export const dynamic = "force-dynamic";

// GET /api/display/state — SSE stream
// Polls Supabase every 2s and pushes state to all connected /display clients.
// Polling is used because Vercel serverless can't hold pub/sub subscribers across instances.
export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let lastUpdatedAt = 0;
      let closed = false;

      const send = (data: object) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch { closed = true; }
      };

      // Send current state immediately
      const initial = await getDisplayState();
      lastUpdatedAt = initial.updatedAt;
      send(initial);

      // Poll every 2s for changes
      const poll = setInterval(async () => {
        if (closed) { clearInterval(poll); return; }
        try {
          const state = await getDisplayState();
          if (state.updatedAt > lastUpdatedAt) {
            lastUpdatedAt = state.updatedAt;
            send(state);
          }
        } catch { /* ignore polling errors */ }
      }, 2000);

      // Keepalive ping every 20s
      const ping = setInterval(() => {
        if (closed) { clearInterval(ping); return; }
        try { controller.enqueue(encoder.encode(`: ping\n\n`)); }
        catch { closed = true; clearInterval(ping); }
      }, 20_000);

      return () => {
        closed = true;
        clearInterval(poll);
        clearInterval(ping);
      };
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type":      "text/event-stream",
      "Cache-Control":     "no-cache, no-transform",
      "Connection":        "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

// POST /api/display/state — admin sets current scene
export async function POST(request: Request) {
  try {
    requireAdmin(request);
    const body  = await readJson(request);
    const scene = body.scene as DisplayScene;
    if (!scene?.type) throw new Error("scene.type is required.");
    const state = await setDisplayState(scene);
    return NextResponse.json(state);
  } catch (error) {
    return apiError(error);
  }
}
