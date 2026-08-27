import { ApiError, databaseError } from "@/lib/api";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type MentorSummary = {
  id: string;
  fullName: string;
  batch: string | null;
  profilePhotoUrl: string | null;
  capacity: number;
  allocatedCount: number;
};

export async function getCurrentSession(requireRegistration = false) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("mentor_sessions")
    .select("id, year, title, status, registration_open")
    .order("year", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw databaseError("Unable to load the current session.", error.code);
  if (!data) throw new ApiError("No mentor session has been configured yet.", 404);
  if (requireRegistration && (!data.registration_open || data.status !== "registration")) {
    throw new ApiError("Registration is currently closed.", 403);
  }
  return data;
}

export async function getAvailableMentors(): Promise<MentorSummary[]> {
  const supabase = getSupabaseAdmin();
  const session = await getCurrentSession();
  const { data: mentors, error: mentorError } = await supabase
    .from("mentors")
    .select("id, full_name, batch, profile_photo_url, capacity")
    .eq("session_id", session.id)
    .order("full_name");
  if (mentorError) throw databaseError("Unable to load mentors.", mentorError.code);

  const mentorIds = (mentors ?? []).map((mentor) => mentor.id);
  const { data: allocations, error: allocationError } = mentorIds.length
    ? await supabase.from("allocations").select("mentor_id").eq("session_id", session.id).in("mentor_id", mentorIds)
    : { data: [], error: null };
  if (allocationError) throw databaseError("Unable to load mentor capacity.", allocationError.code);

  const counts = new Map<string, number>();
  allocations?.forEach((allocation) => counts.set(allocation.mentor_id, (counts.get(allocation.mentor_id) ?? 0) + 1));
  return (mentors ?? []).map((mentor) => ({
    id: mentor.id,
    fullName: mentor.full_name,
    batch: mentor.batch,
    profilePhotoUrl: mentor.profile_photo_url,
    capacity: mentor.capacity,
    allocatedCount: counts.get(mentor.id) ?? 0,
  }));
}
