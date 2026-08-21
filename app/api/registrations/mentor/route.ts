import { NextResponse } from "next/server";
import { ApiError, apiError, databaseError, readJson, stringArray, stringField } from "@/lib/api";
import { getCurrentSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const COMMUNICATION_METHODS = ["WhatsApp", "Email", "Phone Call", "In-Person"];

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const communicationMethod = stringField(body.communicationMethod, "Preferred communication method", { max: 40 });
    if (!COMMUNICATION_METHODS.includes(communicationMethod)) throw new ApiError("Preferred communication method is invalid.");
    const session = await getCurrentSession(true);
    const row = {
      session_id: session.id,
      full_name: stringField(body.fullName, "Full name", { max: 120 }),
      student_id: stringField(body.studentId, "Student ID", { max: 50 }),
      email: stringField(body.email, "University email", { max: 254 }).toLowerCase(),
      phone: stringField(body.phone, "Contact number", { max: 30 }),
      batch: stringField(body.batch, "Batch", { max: 50 }),
      communication_method: communicationMethod,
      academic_interests: stringArray(body.academicInterests, "Academic interests"),
      technical_interests: stringArray(body.technicalInterests, "Technical interests"),
      profile_photo_url: stringField(body.profilePhotoUrl, "Profile photo URL", { optional: true, max: 2048 }),
    };
    const { data, error } = await getSupabaseAdmin().from("mentors").insert(row).select("id, full_name, approval_status").single();
    if (error) throw databaseError("Unable to save mentor registration.", error.code);
    return NextResponse.json({ mentor: { id: data.id, fullName: data.full_name, approvalStatus: data.approval_status } }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
