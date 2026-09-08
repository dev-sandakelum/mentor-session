import { NextResponse } from "next/server";
import { apiError, databaseError } from "@/lib/api";
import { getCurrentSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// GET /api/display/registrations
// Public — returns live mentee registration count + the most recent joiner
// name for the display screen.
export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const session  = await getCurrentSession();

    // Run count and latest-joiner queries in parallel.
    const [countResult, latestResult] = await Promise.all([
      supabase
        .from("mentees")
        .select("id", { count: "exact", head: true })
        .eq("session_id", session.id),
      supabase
        .from("mentees")
        .select("full_name, created_at")
        .eq("session_id", session.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (countResult.error)  throw databaseError("Unable to load registration count.", countResult.error.code);
    if (latestResult.error) throw databaseError("Unable to load latest mentee.", latestResult.error.code);

    return NextResponse.json({
      count:      countResult.count ?? 0,
      latestName: (latestResult.data?.full_name as string | null) ?? null,
      latestAt:   (latestResult.data?.created_at as string | null) ?? null,
    });
  } catch (e) {
    return apiError(e);
  }
}
