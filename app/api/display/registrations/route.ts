import { NextResponse } from "next/server";
import { apiError, databaseError } from "@/lib/api";
import { getCurrentSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// GET /api/display/registrations
// Public — returns live mentee registration count for the display screen.
export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const session  = await getCurrentSession();

    const { count, error } = await supabase
      .from("mentees")
      .select("id", { count: "exact", head: true })
      .eq("session_id", session.id);

    if (error) throw databaseError("Unable to load registration count.", error.code);

    return NextResponse.json({ count: count ?? 0 });
  } catch (e) {
    return apiError(e);
  }
}
