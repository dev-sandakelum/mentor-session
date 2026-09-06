import { NextResponse } from "next/server";
import { apiError, databaseError } from "@/lib/api";
import { getCurrentSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// GET /api/display/allocations
// Public — returns committed allocation pairs for the live allocation display scene.
export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const session  = await getCurrentSession();

    const { data: allocs, error: allocError } = await supabase
      .from("allocations")
      .select("method, matched_priority, mentee_id, mentor_id")
      .eq("session_id", session.id)
      .order("allocated_at", { ascending: false })
      .limit(200);

    if (allocError) throw databaseError("Unable to load allocations.", allocError.code);
    if (!allocs || allocs.length === 0) {
      return NextResponse.json({ allocations: [], fcfsCount: 0, fallbackCount: 0, total: 0, menteeTotal: 0 });
    }

    // Resolve names in one query each
    const menteeIds = [...new Set(allocs.map((a) => a.mentee_id))];
    const mentorIds = [...new Set(allocs.map((a) => a.mentor_id))];

    const [{ data: mentees }, { data: mentors }, { data: menteeCount }] = await Promise.all([
      supabase.from("mentees").select("id, full_name").in("id", menteeIds),
      supabase.from("mentors").select("id, full_name").in("id", mentorIds),
      supabase.from("mentees").select("id", { count: "exact", head: true }).eq("session_id", session.id),
    ]);

    const menteeMap = new Map((mentees ?? []).map((m) => [m.id as string, m.full_name as string]));
    const mentorMap = new Map((mentors ?? []).map((m) => [m.id as string, m.full_name as string]));

    const allocations = allocs.map((a) => ({
      mentee:  menteeMap.get(a.mentee_id)  ?? "Unknown",
      mentor:  mentorMap.get(a.mentor_id)  ?? "Unknown",
      method:  a.method as "preference" | "fallback" | "manual",
      priority: a.matched_priority as number | null,
    }));

    const fcfsCount     = allocations.filter((a) => a.method === "preference").length;
    const fallbackCount = allocations.filter((a) => a.method !== "preference").length;

    return NextResponse.json({
      allocations,
      fcfsCount,
      fallbackCount,
      total:      allocs.length,
      menteeTotal: menteeCount ?? 0,
    });
  } catch (e) {
    return apiError(e);
  }
}
