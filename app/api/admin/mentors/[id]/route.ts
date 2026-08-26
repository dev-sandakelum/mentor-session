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

    const fields = parseMentorFields(body);
    const updates: Record<string, unknown> = {};
    if (body.fullName !== undefined) updates.full_name = fields.fullName;
    if (body.studentId !== undefined) updates.student_id = fields.studentId;
    if (body.email !== undefined) updates.email = fields.email;
    if (body.phone !== undefined) updates.phone = fields.phone;
    if (body.batch !== undefined) updates.batch = fields.batch;
    if (body.communicationMethod !== undefined) updates.communication_method = fields.communicationMethod;
    if (body.academicInterests !== undefined) updates.academic_interests = fields.academicInterests;
    if (body.technicalInterests !== undefined) updates.technical_interests = fields.technicalInterests;
    if (body.profilePhotoUrl !== undefined) updates.profile_photo_url = fields.profilePhotoUrl;
    if (body.capacity !== undefined) updates.capacity = fields.capacity;

    if (!Object.keys(updates).length) throw new ApiError("No mentor fields were provided to update.");

    const { data, error } = await supabase
      .from("mentors")
      .update(updates)
      .eq("id", id)
      .select("id, full_name, student_id, email, phone, batch, communication_method, academic_interests, technical_interests, profile_photo_url, capacity")
      .single();

    if (error?.code === "23505") throw databaseError("A mentor with this student ID or email already exists.", error.code);
    if (error) throw databaseError("Unable to update mentor.", error.code);
    return NextResponse.json({ mentor: data });
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
