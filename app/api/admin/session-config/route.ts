import { NextResponse } from "next/server";
import { ApiError, apiError, databaseError, readJson, requireAdmin } from "@/lib/api";
import { getCurrentSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const VALID_STATUSES = ["draft", "registration", "allocation", "published", "closed"] as const;
type SessionStatus = (typeof VALID_STATUSES)[number];

export async function GET(request: Request) {
  try {
    requireAdmin(request);
    const session = await getCurrentSession();
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("mentor_sessions")
      .select("id, status, registration_open, mentor_reg_open, mentee_reg_open, prefs_open, event_starts_at, venue, title")
      .eq("id", session.id)
      .single();
    if (error) throw databaseError("Unable to load session config.", error.code);
    return NextResponse.json({ session: data });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    requireAdmin(request);
    const body = await readJson(request);
    const session = await getCurrentSession();
    const supabase = getSupabaseAdmin();

    const updates: Record<string, unknown> = {};

    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status as SessionStatus)) {
        throw new ApiError(`Status must be one of: ${VALID_STATUSES.join(", ")}`);
      }
      updates.status = body.status;
    }

    // Legacy flag — kept for lifecycle tab compatibility
    if (body.registrationOpen !== undefined) {
      updates.registration_open = !!body.registrationOpen;
    }

    // Granular control flags
    if (body.mentorRegOpen  !== undefined) updates.mentor_reg_open  = !!body.mentorRegOpen;
    if (body.menteeRegOpen  !== undefined) updates.mentee_reg_open  = !!body.menteeRegOpen;
    if (body.prefsOpen      !== undefined) updates.prefs_open       = !!body.prefsOpen;

    if (!Object.keys(updates).length) throw new ApiError("No fields provided to update.");

    const { data, error } = await supabase
      .from("mentor_sessions")
      .update(updates)
      .eq("id", session.id)
      .select("id, status, registration_open, mentor_reg_open, mentee_reg_open, prefs_open")
      .single();

    if (error) throw databaseError("Unable to update session config.", error.code);

    return NextResponse.json({ session: data });
  } catch (error) {
    return apiError(error);
  }
}
