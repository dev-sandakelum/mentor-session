import { NextResponse } from "next/server";
import { ApiError, apiError, databaseError, readJson, requireAdmin } from "@/lib/api";
import { getCurrentSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const VALID_STATUSES = ["draft", "registration", "allocation", "published", "closed"] as const;
type SessionStatus = (typeof VALID_STATUSES)[number];

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

    if (body.registrationOpen !== undefined) {
      updates.registration_open = !!body.registrationOpen;
    }

    if (!Object.keys(updates).length) throw new ApiError("No fields provided to update.");

    const { data, error } = await supabase
      .from("mentor_sessions")
      .update(updates)
      .eq("id", session.id)
      .select("id, status, registration_open")
      .single();

    if (error) throw databaseError("Unable to update session config.", error.code);

    return NextResponse.json({ session: data });
  } catch (error) {
    return apiError(error);
  }
}
