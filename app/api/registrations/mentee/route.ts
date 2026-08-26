import { NextResponse } from "next/server";
import { apiError, databaseError, readJson, stringArray, stringField } from "@/lib/api";
import { getCurrentSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const session = await getCurrentSession(true);
    const row = {
      session_id: session.id,
      full_name: stringField(body.fullName, "Full name", { max: 120 }),
      student_id: stringField(body.studentId, "Student ID", { max: 50 }),
      email: stringField(body.email, "University email", { max: 254 }).toLowerCase(),
      phone: stringField(body.phone, "Contact number", { max: 30 }),
      batch: stringField(body.batch, "Batch", { max: 50 }),
      academic_interests: stringArray(body.academicInterests, "Academic interests"),
      technical_interests: stringArray(body.technicalInterests, "Technical interests"),
      guidance_needed: stringField(body.guidanceNeeded, "Guidance details", { optional: true, max: 2000 }),
    };
    const { data, error } = await getSupabaseAdmin().from("mentees").insert(row).select("id, full_name").single();
    if (error) throw databaseError("Unable to save mentee registration.", error.code);
    return NextResponse.json({ mentee: { id: data.id, fullName: data.full_name } }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
