import { NextResponse } from "next/server";
import { ApiError, apiError, databaseError, readJson } from "@/lib/api";
import { parseMentorFields } from "@/lib/mentor-fields";
import { getCurrentSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    // Public registration — mentor reg must be open
    const session = await getCurrentSession();
    // mentor_reg_open is always present on SessionConfig (getCurrentSession handles the fallback)
    const mentorRegOpen = session.mentor_reg_open;
    if (!mentorRegOpen) {
      throw new ApiError("Mentor registration is currently closed.", 403);
    }
    const body = await readJson(request);
    const fields = parseMentorFields(body, { requireAll: true });

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
      throw new ApiError("Enter a valid university email address.", 400, "email");
    }

    const supabase = getSupabaseAdmin();

    // Check for duplicate registration in this session
    const { data: existing } = await supabase
      .from("mentors")
      .select("id, is_approved")
      .eq("session_id", session.id)
      .eq("student_id", fields.studentId)
      .maybeSingle();

    if (existing) {
      const statusMsg = (existing as { is_approved?: boolean }).is_approved
        ? "You are already registered as an approved mentor for this session."
        : "Your registration is already submitted and awaiting approval.";
      throw new ApiError(statusMsg, 409);
    }

    const { data, error } = await supabase
      .from("mentors")
      .insert({
        session_id: session.id,
        full_name: fields.fullName,
        student_id: fields.studentId,
        email: fields.email,
        phone: fields.phone,
        batch: fields.batch,
        communication_method: fields.communicationMethod,
        capacity: fields.capacity,
        is_approved: false, // always pending for self-registered mentors
      })
      .select("id, full_name")
      .single();

    if (error?.code === "23505") {
      throw new ApiError("A registration with this student ID or email already exists.", 409);
    }
    if (error) throw databaseError("Unable to save your registration.", error.code);

    return NextResponse.json(
      { mentor: { id: data.id, fullName: data.full_name } },
      { status: 201 }
    );
  } catch (error) {
    return apiError(error);
  }
}
