import { NextResponse } from "next/server";
import { apiError, databaseError, readJson, requireAdmin } from "@/lib/api";
import { parseMentorFields } from "@/lib/mentor-fields";
import { getCurrentSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    requireAdmin(request);
    const body = await readJson(request);
    const fields = parseMentorFields(body, { requireAll: true });
    const session = await getCurrentSession();

    const { data, error } = await getSupabaseAdmin()
      .from("mentors")
      .insert({
        session_id: session.id,
        full_name: fields.fullName,
        student_id: fields.studentId,
        email: fields.email,
        phone: fields.phone,
        batch: fields.batch,
        communication_method: fields.communicationMethod,
        academic_interests: fields.academicInterests,
        technical_interests: fields.technicalInterests,
        profile_photo_url: fields.profilePhotoUrl,
        capacity: fields.capacity,
      })
      .select("id, full_name, student_id, email, phone, batch, communication_method, academic_interests, technical_interests, profile_photo_url, capacity")
      .single();

    if (error?.code === "23505") throw databaseError("A mentor with this student ID or email already exists.", error.code);
    if (error) throw databaseError("Unable to create mentor.", error.code);

    return NextResponse.json({ mentor: data }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
