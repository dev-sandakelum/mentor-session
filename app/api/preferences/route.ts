import { NextResponse } from "next/server";
import { ApiError, apiError, databaseError, isUuid, readJson } from "@/lib/api";
import { getCurrentSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const menteeId = new URL(request.url).searchParams.get("menteeId");
    if (!menteeId || !isUuid(menteeId)) throw new ApiError("A valid menteeId is required.");
    const { data, error } = await getSupabaseAdmin()
      .from("mentor_preferences")
      .select("priority, submitted_at, mentors(full_name)")
      .eq("mentee_id", menteeId)
      .order("priority");
    if (error) throw databaseError("Unable to load preferences.", error.code);
    return NextResponse.json({ preferences: data ?? [] });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const menteeId = typeof body.menteeId === "string" ? body.menteeId : "";
    const mentorIds = body.mentorIds;
    if (!isUuid(menteeId)) throw new ApiError("A valid menteeId is required.");
    if (!Array.isArray(mentorIds) || mentorIds.length !== 3 || mentorIds.some((id) => typeof id !== "string" || !isUuid(id))) {
      throw new ApiError("Select exactly three valid mentors.");
    }
    if (new Set(mentorIds).size !== 3) throw new ApiError("Each preference must be a different mentor.");

    const supabase = getSupabaseAdmin();
    const session = await getCurrentSession(true);
    const { data: mentee, error: menteeError } = await supabase
      .from("mentees")
      .select("id, preference_submitted_at")
      .eq("id", menteeId)
      .eq("session_id", session.id)
      .maybeSingle();
    if (menteeError) throw databaseError("Unable to verify mentee registration.", menteeError.code);
    if (!mentee) throw new ApiError("Mentee registration was not found.", 404);
    if (mentee.preference_submitted_at) throw new ApiError("Preferences have already been submitted and are locked.", 409);

    const { data: mentors, error: mentorError } = await supabase
      .from("mentors")
      .select("id, full_name")
      .eq("session_id", session.id)
      .eq("approval_status", "approved")
      .in("id", mentorIds);
    if (mentorError) throw databaseError("Unable to verify mentors.", mentorError.code);
    if ((mentors ?? []).length !== 3) throw new ApiError("One or more selected mentors are no longer available.", 409);

    const submittedAt = new Date().toISOString();
    const { error: preferenceError } = await supabase.from("mentor_preferences").insert(
      mentorIds.map((mentorId, index) => ({ mentee_id: menteeId, mentor_id: mentorId, priority: index + 1, submitted_at: submittedAt })),
    );
    if (preferenceError) throw databaseError("Unable to save preferences.", preferenceError.code);
    const { error: lockError } = await supabase.from("mentees").update({ preference_submitted_at: submittedAt }).eq("id", menteeId);
    if (lockError) throw databaseError("Unable to lock preferences.", lockError.code);
    const names = new Map((mentors ?? []).map((mentor) => [mentor.id, mentor.full_name]));
    return NextResponse.json({ submittedAt, preferences: mentorIds.map((id, index) => ({ priority: index + 1, mentorName: names.get(id) })) }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
