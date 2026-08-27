import { NextResponse } from "next/server";
import { ApiError, apiError, databaseError, readJson, stringField } from "@/lib/api";
import { getCurrentSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const session = await getCurrentSession();
    // Graceful fallback: if mentee_reg_open column doesn't exist yet, fall back to registration_open
    const menteeRegOpen = "mentee_reg_open" in session ? session.mentee_reg_open : session.registration_open;
    if (!menteeRegOpen) throw new ApiError("Mentee registration is currently closed.", 403);
    const studentId = stringField(body.studentId, "Student ID", { max: 50 });
    const row = {
      session_id: session.id,
      full_name: stringField(body.fullName, "Full name", { max: 120 }),
      student_id: studentId,
      email: `${studentId.replace(/\//g, "-").toLowerCase()}@mentor-session.local`,
      phone: stringField(body.phone, "Contact number", { max: 30 }),
      batch: "10th",
      academic_interests: [],
      technical_interests: [],
    };
    // Try insert; on unique conflict return the existing record
    const supabase = getSupabaseAdmin();
    let { data, error } = await supabase.from("mentees").insert(row).select("id, full_name").single();
    if (error) {
      if (error.code === "23505") {
        const existing = await supabase
          .from("mentees")
          .select("id, full_name")
          .eq("student_id", row.student_id)
          .eq("session_id", session.id)
          .maybeSingle();
        if (existing.error) throw databaseError("Unable to save mentee registration.", existing.error.code);
        if (existing.data) {
          data = existing.data;
        } else {
          console.error("[registrations/mentee] 23505 conflict detail:", error.message, error.details);
          throw new ApiError("A registration with those details already exists in this session.", 409);
        }
      } else {
        throw databaseError("Unable to save mentee registration.", error.code);
      }
    }
    return NextResponse.json({ mentee: { id: data.id, fullName: data.full_name } }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
