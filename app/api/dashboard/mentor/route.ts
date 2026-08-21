import { NextResponse } from "next/server";
import { ApiError, apiError, databaseError, isUuid } from "@/lib/api";
import { getCurrentSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    const mentorId = new URL(request.url).searchParams.get("mentorId");
    if (!mentorId || !isUuid(mentorId)) throw new ApiError("A valid mentorId is required.");
    const supabase = getSupabaseAdmin();
    const session = await getCurrentSession();
    const { data: mentor, error: mentorError } = await supabase
      .from("mentors").select("id, full_name, student_id, batch, approval_status, capacity, academic_interests, technical_interests")
      .eq("id", mentorId).eq("session_id", session.id).maybeSingle();
    if (mentorError) throw databaseError("Unable to load mentor dashboard.", mentorError.code);
    if (!mentor) throw new ApiError("Mentor registration was not found.", 404);
    const { data: allocations, error: allocationError } = await supabase
      .from("allocations").select("mentee_id, method, matched_priority").eq("session_id", session.id).eq("mentor_id", mentor.id);
    if (allocationError) throw databaseError("Unable to load allocated mentees.", allocationError.code);
    const menteeIds = (allocations ?? []).map((item) => item.mentee_id);
    const { data: mentees, error: menteeError } = menteeIds.length
      ? await supabase.from("mentees").select("id, full_name, batch, academic_interests, technical_interests").in("id", menteeIds)
      : { data: [], error: null };
    if (menteeError) throw databaseError("Unable to load allocated mentees.", menteeError.code);
    const menteesById = new Map((mentees ?? []).map((mentee) => [mentee.id, mentee]));
    return NextResponse.json({
      session,
      mentor,
      mentees: (allocations ?? []).map((allocation) => ({ ...allocation, mentee: menteesById.get(allocation.mentee_id) })),
    });
  } catch (error) {
    return apiError(error);
  }
}
