import { NextResponse } from "next/server";
import { ApiError, apiError, databaseError, isUuid, readJson, requireAdmin } from "@/lib/api";
import { parseMentorFields } from "@/lib/mentor-fields";
import { getCurrentSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function PATCH(request: Request, context: RouteContext<"/api/admin/mentors/[id]">) {
  try {
    requireAdmin(request);
    const { id } = await context.params;
    if (!isUuid(id)) throw new ApiError("A valid mentor id is required.");
    const body = await readJson(request);
    const session = await getCurrentSession();
    const supabase = getSupabaseAdmin();

    const { data: existing, error: existingError } = await supabase
      .from("mentors")
      .select("id")
      .eq("id", id)
      .eq("session_id", session.id)
      .maybeSingle();
    if (existingError) throw databaseError("Unable to load mentor.", existingError.code);
    if (!existing) throw new ApiError("Mentor was not found.", 404);

    // ── Core profile fields ───────────────────────────────────────────────────
    const fields = parseMentorFields(body);
    const coreUpdates: Record<string, unknown> = {};
    if (body.fullName            !== undefined) coreUpdates.full_name           = fields.fullName;
    if (body.studentId           !== undefined) coreUpdates.student_id          = fields.studentId;
    if (body.email               !== undefined) coreUpdates.email               = fields.email;
    if (body.phone               !== undefined) coreUpdates.phone               = fields.phone;
    if (body.batch               !== undefined) coreUpdates.batch               = fields.batch;
    if (body.communicationMethod !== undefined) coreUpdates.communication_method = fields.communicationMethod;
    if (body.profilePhotoUrl     !== undefined) coreUpdates.profile_photo_url   = fields.profilePhotoUrl;
    if (body.capacity            !== undefined) coreUpdates.capacity            = fields.capacity;

    // ── Approval field (require migration) ───────────────────────────────────
    const approvalUpdates: Record<string, unknown> = {};
    if (body.isApproved !== undefined) {
      if (typeof body.isApproved !== "boolean") {
        throw new ApiError("isApproved must be a boolean.");
      }
      approvalUpdates.is_approved = body.isApproved;
    }

    if (!Object.keys(coreUpdates).length && !Object.keys(approvalUpdates).length) {
      throw new ApiError("No mentor fields were provided to update.");
    }

    // Apply core updates first (always safe — no new columns)
    let savedMentor: Record<string, unknown> | null = null;

    if (Object.keys(coreUpdates).length) {
      const { data, error } = await supabase
        .from("mentors")
        .update(coreUpdates)
        .eq("id", id)
        .select("id, full_name, student_id, email, phone, batch, communication_method, profile_photo_url, capacity")
        .single();
      if (error?.code === "23505") throw databaseError("A mentor with this student ID or email already exists.", error.code);
      if (error) throw databaseError("Unable to update mentor.", error.code);
      savedMentor = data as Record<string, unknown>;
    }

    // Apply approval update separately — degrade gracefully if column doesn't exist
    let isApprovedResult: boolean | null = null;
    if (Object.keys(approvalUpdates).length) {
      const { error: aErr } = await supabase
        .from("mentors")
        .update(approvalUpdates)
        .eq("id", id);

      if (aErr) {
        if (aErr.code === "42703") {
          throw new ApiError(
            "Approval cannot be updated yet. Run the database migration first (add_mentor_approval_status.sql).",
            400
          );
        }
        throw databaseError("Unable to update mentor approval.", aErr.code);
      }

      const { data: aFetch } = await supabase
        .from("mentors")
        .select("is_approved")
        .eq("id", id)
        .single();

      if (aFetch) {
        isApprovedResult = (aFetch as { is_approved: boolean }).is_approved;
        savedMentor = { ...(savedMentor ?? {}), ...aFetch };
      }
    }

    // If only core fields were updated, fetch a fresh record
    if (!savedMentor) {
      const { data: fresh } = await supabase
        .from("mentors")
        .select("id, full_name, student_id, email, phone, batch, communication_method, profile_photo_url, capacity")
        .eq("id", id)
        .single();
      savedMentor = (fresh ?? {}) as Record<string, unknown>;
    }

    return NextResponse.json({
      mentor: {
        ...savedMentor,
        is_approved: isApprovedResult ?? ((savedMentor.is_approved as boolean | undefined) ?? true),
      },
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext<"/api/admin/mentors/[id]">) {
  try {
    requireAdmin(request);
    const { id } = await context.params;
    if (!isUuid(id)) throw new ApiError("A valid mentor id is required.");
    const session = await getCurrentSession();
    const supabase = getSupabaseAdmin();

    const { data: mentor, error: mentorError } = await supabase
      .from("mentors")
      .select("id, profile_photo_url")
      .eq("id", id)
      .eq("session_id", session.id)
      .maybeSingle();
    if (mentorError) throw databaseError("Unable to load mentor.", mentorError.code);
    if (!mentor) throw new ApiError("Mentor was not found.", 404);

    const { count, error: allocationError } = await supabase
      .from("allocations")
      .select("id", { count: "exact", head: true })
      .eq("mentor_id", id);
    if (allocationError) throw databaseError("Unable to check mentor allocations.", allocationError.code);
    if (count && count > 0) {
      throw new ApiError("Cannot delete a mentor who has assigned mentees. Remove allocations first.", 409);
    }

    const { error } = await supabase.from("mentors").delete().eq("id", id);
    if (error) throw databaseError("Unable to delete mentor.", error.code);

    if (mentor.profile_photo_url) {
      const { data: files } = await supabase.storage.from("mentor-avatars").list(`${session.id}`, { search: id });
      if (files?.length) {
        await supabase.storage.from("mentor-avatars").remove(files.map((f) => `${session.id}/${f.name}`));
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
