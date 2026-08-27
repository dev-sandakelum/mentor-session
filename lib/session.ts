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

// Shape returned by Supabase — the control-flag columns may not exist pre-migration
type RawSession = {
  id: string;
  year: number;
  title: string;
  status: string;
  registration_open: boolean;
  mentor_reg_open?: boolean | null;
  mentee_reg_open?: boolean | null;
  prefs_open?: boolean | null;
};

export type SessionConfig = RawSession & {
  // Normalised — always present, falls back to registration_open
  mentor_reg_open: boolean;
  mentee_reg_open: boolean;
  prefs_open: boolean;
};

export async function getCurrentSession(requireRegistration = false): Promise<SessionConfig> {
  const supabase = getSupabaseAdmin();

  // Try fetching the new control columns; fall back gracefully if they don't exist yet
  const { data, error } = await supabase
    .from("mentor_sessions")
    .select("id, year, title, status, registration_open")
    .order("year", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw databaseError("Unable to load the current session.", error.code);
  if (!data) throw new ApiError("No mentor session has been configured yet.", 404);

  // Attempt to fetch the new flags in a separate query so a missing column
  // only affects that query, not the whole app
  const raw = data as RawSession;
  let mentor_reg_open = raw.registration_open;
  let mentee_reg_open = raw.registration_open;
  let prefs_open      = raw.registration_open;

  const { data: flags, error: flagsError } = await supabase
    .from("mentor_sessions")
    .select("mentor_reg_open, mentee_reg_open, prefs_open")
    .eq("id", raw.id)
    .single();

  // code 42703 = column does not exist — silently ignore, keep fallback values
  if (!flagsError && flags) {
    mentor_reg_open = flags.mentor_reg_open ?? raw.registration_open;
    mentee_reg_open = flags.mentee_reg_open ?? raw.registration_open;
    prefs_open      = flags.prefs_open      ?? raw.registration_open;
  }

  const session: SessionConfig = {
    ...raw,
    mentor_reg_open,
    mentee_reg_open,
    prefs_open,
  };

  if (requireRegistration && (!session.registration_open || session.status !== "registration")) {
    throw new ApiError("Registration is currently closed.", 403);
  }

  return session;
}

export async function getAvailableMentors(): Promise<MentorSummary[]> {
  const supabase = getSupabaseAdmin();
  const session = await getCurrentSession();

  // First try with is_approved filter (post-migration)
  let mentors: { id: string; full_name: string; batch: string | null; profile_photo_url: string | null; capacity: number }[] | null = null;

  const withFilter = await supabase
    .from("mentors")
    .select("id, full_name, batch, profile_photo_url, capacity")
    .eq("session_id", session.id)
    .eq("is_approved", true)
    .order("full_name");

  if (withFilter.error) {
    if (withFilter.error.code === "42703") {
      // Column doesn't exist yet — fall back to returning all mentors
      const fallback = await supabase
        .from("mentors")
        .select("id, full_name, batch, profile_photo_url, capacity")
        .eq("session_id", session.id)
        .order("full_name");
      if (fallback.error) throw databaseError("Unable to load mentors.", fallback.error.code);
      mentors = fallback.data;
    } else {
      throw databaseError("Unable to load mentors.", withFilter.error.code);
    }
  } else {
    mentors = withFilter.data;
  }

  const mentorIds = (mentors ?? []).map((m) => m.id);
  const { data: allocations, error: allocationError } = mentorIds.length
    ? await supabase.from("allocations").select("mentor_id").eq("session_id", session.id).in("mentor_id", mentorIds)
    : { data: [], error: null };
  if (allocationError) throw databaseError("Unable to load mentor capacity.", allocationError.code);

  const counts = new Map<string, number>();
  allocations?.forEach((a) => counts.set(a.mentor_id, (counts.get(a.mentor_id) ?? 0) + 1));

  return (mentors ?? []).map((m) => ({
    id: m.id,
    fullName: m.full_name,
    batch: m.batch,
    profilePhotoUrl: m.profile_photo_url,
    capacity: m.capacity,
    allocatedCount: counts.get(m.id) ?? 0,
  }));
}
