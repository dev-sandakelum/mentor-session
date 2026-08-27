import { NextResponse } from "next/server";
import { ApiError, apiError, databaseError, isUuid, readJson, requireAdmin } from "@/lib/api";
import { getCurrentSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

// POST /api/admin/allocations/manual
// Manually assign one mentee to one mentor (overrides any existing allocation for that mentee)
export async function POST(request: Request) {
  try {
    requireAdmin(request);
    const body = await readJson(request);

    const menteeId = typeof body.menteeId === "string" ? body.menteeId : "";
    const mentorId = typeof body.mentorId === "string" ? body.mentorId : "";

    if (!isUuid(menteeId)) throw new ApiError("A valid menteeId is required.");
    if (!isUuid(mentorId)) throw new ApiError("A valid mentorId is required.");

    const supabase = getSupabaseAdmin();
    const session = await getCurrentSession();

    // Verify mentee belongs to this session
    const { data: mentee, error: menteeErr } = await supabase
      .from("mentees")
      .select("id, full_name")
      .eq("id", menteeId)
      .eq("session_id", session.id)
      .maybeSingle();
    if (menteeErr) throw databaseError("Unable to verify mentee.", menteeErr.code);
    if (!mentee) throw new ApiError("Mentee not found in this session.", 404);

    // Verify mentor belongs to this session and is approved
    const { data: mentor, error: mentorErr } = await supabase
      .from("mentors")
      .select("id, full_name, capacity, is_approved")
      .eq("id", mentorId)
      .eq("session_id", session.id)
      .maybeSingle();
    if (mentorErr) throw databaseError("Unable to verify mentor.", mentorErr.code);
    if (!mentor) throw new ApiError("Mentor not found in this session.", 404);
    const isApproved = (mentor as { is_approved?: boolean }).is_approved;
    if (isApproved === false) {
      throw new ApiError(`${mentor.full_name} is not approved and cannot be assigned mentees.`, 409);
    }

    // Check mentor capacity (excluding the mentee being assigned, in case of reassignment)
    const { count: currentLoad, error: loadErr } = await supabase
      .from("allocations")
      .select("id", { count: "exact", head: true })
      .eq("session_id", session.id)
      .eq("mentor_id", mentorId)
      .neq("mentee_id", menteeId);
    if (loadErr) throw databaseError("Unable to check mentor capacity.", loadErr.code);
    if ((currentLoad ?? 0) >= mentor.capacity) {
      throw new ApiError(`${mentor.full_name} is at full capacity (${mentor.capacity} mentees).`, 409);
    }

    // Upsert — replace any existing allocation for this mentee
    const { error: upsertErr } = await supabase
      .from("allocations")
      .upsert(
        { session_id: session.id, mentee_id: menteeId, mentor_id: mentorId, method: "manual", matched_priority: null },
        { onConflict: "mentee_id" }
      );
    if (upsertErr) throw databaseError("Unable to save manual assignment.", upsertErr.code);

    // Audit log
    await supabase.from("allocation_logs").insert({
      session_id: session.id,
      action: "Manual assignment",
      detail: `${mentee.full_name} manually assigned to ${mentor.full_name}.`,
    });

    return NextResponse.json({ ok: true, mentee: mentee.full_name, mentor: mentor.full_name });
  } catch (error) {
    return apiError(error);
  }
}

// DELETE /api/admin/allocations/manual?menteeId=<uuid>
// Remove a specific mentee's allocation
export async function DELETE(request: Request) {
  try {
    requireAdmin(request);
    const menteeId = new URL(request.url).searchParams.get("menteeId") ?? "";
    if (!isUuid(menteeId)) throw new ApiError("A valid menteeId is required.");

    const supabase = getSupabaseAdmin();
    const session = await getCurrentSession();

    const { data: mentee } = await supabase
      .from("mentees").select("full_name").eq("id", menteeId).eq("session_id", session.id).maybeSingle();

    const { error } = await supabase
      .from("allocations")
      .delete()
      .eq("mentee_id", menteeId)
      .eq("session_id", session.id);
    if (error) throw databaseError("Unable to remove allocation.", error.code);

    await supabase.from("allocation_logs").insert({
      session_id: session.id,
      action: "Allocation removed",
      detail: mentee ? `Allocation for ${mentee.full_name} was removed by an administrator.` : "An allocation was removed.",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
