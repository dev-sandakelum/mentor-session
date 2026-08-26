import { NextResponse } from "next/server";
import { ApiError, apiError, databaseError, isUuid } from "@/lib/api";
import { getCurrentSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    const menteeId = new URL(request.url).searchParams.get("menteeId");
    if (!menteeId || !isUuid(menteeId)) throw new ApiError("A valid menteeId is required.");
    const supabase = getSupabaseAdmin();
    const session = await getCurrentSession();
    const { data: mentee, error: menteeError } = await supabase
      .from("mentees").select("id, full_name, batch, academic_interests, technical_interests")
      .eq("id", menteeId).eq("session_id", session.id).maybeSingle();
    if (menteeError) throw databaseError("Unable to load mentee dashboard.", menteeError.code);
    if (!mentee) throw new ApiError("Mentee registration was not found.", 404);
    const { data: allocation, error: allocationError } = await supabase
      .from("allocations").select("mentor_id, method, matched_priority")
      .eq("mentee_id", mentee.id).eq("session_id", session.id).maybeSingle();
    if (allocationError) throw databaseError("Unable to load allocation.", allocationError.code);
    if (!allocation) return NextResponse.json({ session, mentee, allocation: null });
    const { data: mentor, error: mentorError } = await supabase
      .from("mentors").select("id, full_name, batch, email, phone, communication_method, academic_interests, technical_interests")
      .eq("id", allocation.mentor_id).single();
    if (mentorError) throw databaseError("Unable to load mentor details.", mentorError.code);
    const { data: groupAllocations, error: groupError } = await supabase
      .from("allocations").select("mentee_id").eq("session_id", session.id).eq("mentor_id", mentor.id).neq("mentee_id", mentee.id);
    if (groupError) throw databaseError("Unable to load mentor group.", groupError.code);
    const groupIds = (groupAllocations ?? []).map((item) => item.mentee_id);
    const { data: group, error: membersError } = groupIds.length
      ? await supabase.from("mentees").select("id, full_name, batch, academic_interests, technical_interests").in("id", groupIds)
      : { data: [], error: null };
    if (membersError) throw databaseError("Unable to load mentor group.", membersError.code);
    return NextResponse.json({ session, mentee, allocation: { ...allocation, mentor, group: group ?? [] } });
  } catch (error) {
    return apiError(error);
  }
}
