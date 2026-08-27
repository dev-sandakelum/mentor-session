import { NextResponse } from "next/server";
import { ApiError, apiError, databaseError, requireAdmin } from "@/lib/api";
import { getCurrentSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

// DELETE /api/admin/data?target=mentees|mentors
export async function DELETE(request: Request) {
  try {
    requireAdmin(request);
    const target = new URL(request.url).searchParams.get("target");
    if (target !== "mentees" && target !== "mentors") {
      throw new ApiError('target must be "mentees" or "mentors".');
    }

    const supabase = getSupabaseAdmin();
    const session = await getCurrentSession();

    if (target === "mentees") {
      // Remove preferences and allocations first (FK deps), then mentees
      await supabase.from("allocations").delete().eq("session_id", session.id);
      await supabase.from("mentor_preferences")
        .delete()
        .in(
          "mentee_id",
          (await supabase.from("mentees").select("id").eq("session_id", session.id)).data?.map((r) => r.id) ?? [],
        );
      const { error } = await supabase.from("mentees").delete().eq("session_id", session.id);
      if (error) throw databaseError("Unable to remove mentees.", error.code);

      await supabase.from("allocation_logs").insert({
        session_id: session.id,
        action: "Bulk delete — mentees",
        detail: "All mentees (and their preferences / allocations) removed by an administrator.",
      });
      return NextResponse.json({ ok: true, removed: "mentees" });
    }

    // target === "mentors"
    // Must clear allocations first, then mentors
    const { count: allocCount } = await supabase
      .from("allocations")
      .select("id", { count: "exact", head: true })
      .eq("session_id", session.id);

    if (allocCount && allocCount > 0) {
      throw new ApiError(
        "Cannot remove mentors while allocations exist. Reset allocations first.",
        409,
      );
    }

    const { error } = await supabase.from("mentors").delete().eq("session_id", session.id);
    if (error) throw databaseError("Unable to remove mentors.", error.code);

    await supabase.from("allocation_logs").insert({
      session_id: session.id,
      action: "Bulk delete — mentors",
      detail: "All mentors removed by an administrator.",
    });
    return NextResponse.json({ ok: true, removed: "mentors" });
  } catch (error) {
    return apiError(error);
  }
}

// GET /api/admin/data?target=mentors|mentees|allocations
export async function GET(request: Request) {
  try {
    requireAdmin(request);
    const target = new URL(request.url).searchParams.get("target");
    if (target !== "mentors" && target !== "mentees" && target !== "allocations") {
      throw new ApiError('target must be "mentors", "mentees", or "allocations".');
    }

    const supabase = getSupabaseAdmin();
    const session = await getCurrentSession();

    if (target === "mentors") {
      const { data, error } = await supabase
        .from("mentors")
        .select("full_name, student_id, email, phone, batch, communication_method, capacity, is_approved")
        .eq("session_id", session.id)
        .order("full_name");
      if (error) throw databaseError("Unable to export mentors.", error.code);
      return NextResponse.json({ rows: data ?? [] });
    }

    if (target === "mentees") {
      const { data, error } = await supabase
        .from("mentees")
        .select("full_name, student_id, email, phone, batch, preference_submitted_at")
        .eq("session_id", session.id)
        .order("full_name");
      if (error) throw databaseError("Unable to export mentees.", error.code);
      return NextResponse.json({ rows: data ?? [] });
    }

    // target === "allocations"
    const { data: allocs, error: allocError } = await supabase
      .from("allocations")
      .select("method, matched_priority, allocated_at, mentee_id, mentor_id")
      .eq("session_id", session.id)
      .order("allocated_at");
    if (allocError) throw databaseError("Unable to export allocations.", allocError.code);

    // Resolve names
    const [{ data: mentors }, { data: mentees }] = await Promise.all([
      supabase.from("mentors").select("id, full_name, student_id, email").eq("session_id", session.id),
      supabase.from("mentees").select("id, full_name, student_id, email").eq("session_id", session.id),
    ]);
    const mentorMap = new Map((mentors ?? []).map((m) => [m.id, m]));
    const menteeMap = new Map((mentees ?? []).map((m) => [m.id, m]));

    const rows = (allocs ?? []).map((a) => {
      const mentor = mentorMap.get(a.mentor_id);
      const mentee = menteeMap.get(a.mentee_id);
      return {
        mentee_name:       mentee?.full_name ?? "",
        mentee_student_id: mentee?.student_id ?? "",
        mentee_email:      mentee?.email ?? "",
        mentor_name:       mentor?.full_name ?? "",
        mentor_student_id: mentor?.student_id ?? "",
        mentor_email:      mentor?.email ?? "",
        method:            a.method,
        matched_priority:  a.matched_priority,
        allocated_at:      a.allocated_at,
      };
    });

    return NextResponse.json({ rows });
  } catch (error) {
    return apiError(error);
  }
}
