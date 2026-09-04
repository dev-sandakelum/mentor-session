import { NextResponse } from "next/server";
import { ApiError, apiError, databaseError, isUuid, readJson } from "@/lib/api";
import { requireSuperAdmin, isSuperAdminError } from "@/lib/super-admin-auth";
import { getCurrentSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

// ─── helpers ─────────────────────────────────────────────────────────────────

function superAdminGuard(request: Request) {
  try {
    requireSuperAdmin(request);
  } catch (e) {
    if (isSuperAdminError(e)) {
      // Return a generic 404 — the route should be invisible to non-super-admins
      throw new ApiError("Not found.", 404);
    }
    throw e;
  }
}

// ─── GET /api/super/zero-priority ────────────────────────────────────────────
// List all pre-assignments + approved mentors for the current session.

export async function GET(request: Request) {
  try {
    superAdminGuard(request);
    const supabase = getSupabaseAdmin();
    const session  = await getCurrentSession();

    const [
      { data: assignments, error: aErr },
      { data: mentorRows,  error: mErr },
    ] = await Promise.all([
      supabase
        .from("zero_priority_assignments")
        .select("id, mentee_student_id, mentor_id, created_at, mentors(full_name, student_id)")
        .eq("session_id", session.id)
        .order("created_at"),
      supabase
        .from("mentors")
        .select("id, full_name, student_id")
        .eq("session_id", session.id)
        .eq("is_approved", true)
        .order("full_name"),
    ]);

    if (aErr) {
      if (aErr.code === "42P01") {
        // Table doesn't exist yet — return setup prompt instead of crashing
        return NextResponse.json({
          assignments: [],
          mentorList:  (mentorRows ?? []).map((m) => ({
            id:         m.id,
            full_name:  m.full_name,
            student_id: (m as { student_id?: string | null }).student_id ?? null,
          })),
          setupRequired: true,
        });
      }
      throw databaseError("Unable to load pre-assignments.", aErr.code);
    }

    return NextResponse.json({
      assignments: assignments ?? [],
      mentorList:  (mentorRows ?? []).map((m) => ({
        id:         m.id,
        full_name:  m.full_name,
        student_id: (m as { student_id?: string | null }).student_id ?? null,
      })),
    });
  } catch (e) {
    return apiError(e);
  }
}

// ─── POST /api/super/zero-priority ───────────────────────────────────────────
// Create a single pre-assignment.
// Body: { menteeStudentId: string, mentorId: string }

export async function POST(request: Request) {
  try {
    superAdminGuard(request);
    const body = await readJson(request);

    const menteeStudentId = typeof body.menteeStudentId === "string" ? body.menteeStudentId.trim() : "";
    const mentorParam     = typeof body.mentorId        === "string" ? body.mentorId.trim()        : "";

    if (!menteeStudentId) throw new ApiError("menteeStudentId is required.");
    if (!mentorParam)     throw new ApiError("mentorId is required.");

    const supabase = getSupabaseAdmin();
    const session  = await getCurrentSession();

    // Resolve mentor — accept either a UUID or a TG student number (e.g. TG/2024/0045)
    let resolvedMentorId = mentorParam;
    if (!isUuid(mentorParam)) {
      const { data: byStudentId, error: sidErr } = await supabase
        .from("mentors")
        .select("id, full_name, is_approved")
        .eq("session_id", session.id)
        .eq("student_id", mentorParam)
        .maybeSingle();
      if (sidErr) throw databaseError("Unable to look up mentor.", sidErr.code);
      if (!byStudentId) throw new ApiError(`No mentor found with student ID "${mentorParam}".`, 404);
      resolvedMentorId = byStudentId.id;
      if ((byStudentId as { is_approved?: boolean }).is_approved === false) {
        throw new ApiError("Mentor is not approved.", 409);
      }
    } else {
      // UUID path — still verify existence and approval
      const { data: mentor, error: mentorErr } = await supabase
        .from("mentors")
        .select("id, full_name, is_approved")
        .eq("id", mentorParam)
        .eq("session_id", session.id)
        .maybeSingle();
      if (mentorErr) throw databaseError("Unable to verify mentor.", mentorErr.code);
      if (!mentor)   throw new ApiError("Mentor not found in this session.", 404);
      if ((mentor as { is_approved?: boolean }).is_approved === false) {
        throw new ApiError("Mentor is not approved.", 409);
      }
    }

    const { error } = await supabase
      .from("zero_priority_assignments")
      .upsert(
        { session_id: session.id, mentee_student_id: menteeStudentId, mentor_id: resolvedMentorId },
        { onConflict: "session_id,mentee_student_id" },
      );
    if (error) {
      if (error.code === "42P01") throw new ApiError("Run add_zero_priority.sql in Supabase first.", 503);
      throw databaseError("Unable to save pre-assignment.", error.code);
    }

    // Fetch mentor name for response
    const { data: mentorRow } = await supabase
      .from("mentors").select("full_name").eq("id", resolvedMentorId).maybeSingle();

    return NextResponse.json({ ok: true, menteeStudentId, mentorName: mentorRow?.full_name ?? resolvedMentorId }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}

// ─── DELETE /api/super/zero-priority?id=<uuid> ───────────────────────────────
// Remove a single pre-assignment by its row id.

export async function DELETE(request: Request) {
  try {
    superAdminGuard(request);
    const id = new URL(request.url).searchParams.get("id") ?? "";
    if (!isUuid(id)) throw new ApiError("A valid assignment id is required.");

    const supabase = getSupabaseAdmin();
    const session  = await getCurrentSession();

    const { error } = await supabase
      .from("zero_priority_assignments")
      .delete()
      .eq("id", id)
      .eq("session_id", session.id);
    if (error) throw databaseError("Unable to remove pre-assignment.", error.code);

    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
