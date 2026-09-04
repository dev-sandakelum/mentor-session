import { NextResponse } from "next/server";
import { ApiError, apiError, databaseError, requireAdmin } from "@/lib/api";
import { getCurrentSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

// DELETE /api/admin/data?target=mentees|mentors|preferences
export async function DELETE(request: Request) {
  try {
    requireAdmin(request);
    const target = new URL(request.url).searchParams.get("target");
    if (target !== "mentees" && target !== "mentors" && target !== "preferences") {
      throw new ApiError('target must be "mentees", "mentors", or "preferences".');
    }

    const supabase = getSupabaseAdmin();
    const session = await getCurrentSession();

    if (target === "mentees") {
      await supabase.from("allocations").delete().eq("session_id", session.id);
      await supabase.from("mentor_preferences")
        .delete()
        .in("mentee_id",
          (await supabase.from("mentees").select("id").eq("session_id", session.id)).data?.map((r) => r.id) ?? []);
      const { error } = await supabase.from("mentees").delete().eq("session_id", session.id);
      if (error) throw databaseError("Unable to remove mentees.", error.code);
      await supabase.from("allocation_logs").insert({
        session_id: session.id, action: "Bulk delete — mentees",
        detail: "All mentees (and their preferences / allocations) removed by an administrator.",
      });
      return NextResponse.json({ ok: true, removed: "mentees" });
    }

    if (target === "mentors") {
      const { count: allocCount } = await supabase
        .from("allocations").select("id", { count: "exact", head: true }).eq("session_id", session.id);
      if (allocCount && allocCount > 0)
        throw new ApiError("Cannot remove mentors while allocations exist. Reset allocations first.", 409);
      const { error } = await supabase.from("mentors").delete().eq("session_id", session.id);
      if (error) throw databaseError("Unable to remove mentors.", error.code);
      await supabase.from("allocation_logs").insert({
        session_id: session.id, action: "Bulk delete — mentors",
        detail: "All mentors removed by an administrator.",
      });
      return NextResponse.json({ ok: true, removed: "mentors" });
    }

    // target === "preferences"
    const { data: menteeRows } = await supabase
      .from("mentees").select("id").eq("session_id", session.id);
    const ids = (menteeRows ?? []).map((r) => r.id);
    if (ids.length) {
      const { error: prefErr } = await supabase
        .from("mentor_preferences").delete().in("mentee_id", ids);
      if (prefErr) throw databaseError("Unable to clear preferences.", prefErr.code);
      const { error: tsErr } = await supabase
        .from("mentees").update({ preference_submitted_at: null }).eq("session_id", session.id);
      if (tsErr) throw databaseError("Unable to reset preference timestamps.", tsErr.code);
    }
    await supabase.from("allocation_logs").insert({
      session_id: session.id, action: "Bulk clear — preferences",
      detail: "All mentor preferences cleared and submission timestamps reset by an administrator.",
    });
    return NextResponse.json({ ok: true, removed: "preferences" });
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
