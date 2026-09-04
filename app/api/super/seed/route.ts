import { NextResponse } from "next/server";
import { ApiError, apiError, databaseError, readJson } from "@/lib/api";
import { requireSuperAdmin, isSuperAdminError } from "@/lib/super-admin-auth";
import { getCurrentSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { SEED_MENTEES, menteeStudentId } from "@/data/seed-mentees";
import { SEED_MENTORS, mentorStudentId, MENTOR_BATCH } from "@/data/seed-mentors-real";

function superAdminGuard(request: Request) {
  try {
    requireSuperAdmin(request);
  } catch (e) {
    if (isSuperAdminError(e)) throw new ApiError("Not found.", 404);
    throw e;
  }
}

// POST /api/super/seed
// Body: { target: "mentees" | "mentors" | "preferences" }
export async function POST(request: Request) {
  try {
    superAdminGuard(request);
    const body   = await readJson(request);
    const target = body.target;
    if (target !== "mentees" && target !== "mentors" && target !== "preferences") {
      throw new ApiError('target must be "mentees", "mentors", or "preferences".');
    }

    const supabase = getSupabaseAdmin();
    const session  = await getCurrentSession();

    // ── Inject mentors ────────────────────────────────────────────────────
    if (target === "mentors") {
      if (!SEED_MENTORS.length) return NextResponse.json({ ok: true, inserted: 0, total: 0 });

      const rows = SEED_MENTORS.map((m) => ({
        session_id:           session.id,
        full_name:            m.fullName,
        student_id:           mentorStudentId(m.last4),
        email:                m.email,
        phone:                m.phone,
        batch:                MENTOR_BATCH,
        communication_method: m.communicationMethod,
        capacity:             m.capacity,
        is_approved:          true,
        // profilePhotoUrl is optional — only present in real seed data
        ...("profilePhotoUrl" in m && (m as { profilePhotoUrl?: string | null }).profilePhotoUrl !== undefined
          ? { profile_photo_url: (m as { profilePhotoUrl?: string | null }).profilePhotoUrl }
          : {}),
      }));

      const { data, error } = await supabase
        .from("mentors")
        .upsert(rows, { onConflict: "session_id,student_id", ignoreDuplicates: true })
        .select("id");

      if (error) throw databaseError("Unable to inject mentors.", error.code);
      return NextResponse.json({ ok: true, inserted: data?.length ?? 0, total: rows.length });
    }

    // ── Inject mentees ────────────────────────────────────────────────────
    if (target === "mentees") {
      if (!SEED_MENTEES.length) return NextResponse.json({ ok: true, inserted: 0, total: 0 });

      const now = new Date();
      const rows = SEED_MENTEES.map((m, i) => {
        const sid = menteeStudentId(m.last4);
        // Spread submission times 1 second apart to simulate FCFS order
        const submittedAt = new Date(now.getTime() + i * 1000).toISOString();
        return {
          session_id:               session.id,
          full_name:                m.fullName,
          student_id:               sid,
          email:                    `${sid.replace(/\//g, "-").toLowerCase()}@mentor-session.local`,
          phone:                    m.phone,
          batch:                    "10th",
          preference_submitted_at:  submittedAt,
        };
      });

      const { data, error } = await supabase
        .from("mentees")
        .upsert(rows, { onConflict: "session_id,student_id", ignoreDuplicates: true })
        .select("id");

      if (error) throw databaseError("Unable to inject mentees.", error.code);
      return NextResponse.json({ ok: true, inserted: data?.length ?? 0, total: rows.length });
    }

    // ── Inject preferences ────────────────────────────────────────────────
    // Requires mentors and mentees to already be injected.
    const [
      { data: menteeRows, error: menteeErr },
      { data: mentorRows, error: mentorErr },
    ] = await Promise.all([
      supabase.from("mentees").select("id, student_id").eq("session_id", session.id),
      supabase.from("mentors").select("id, student_id").eq("session_id", session.id).eq("is_approved", true),
    ]);
    if (menteeErr) throw databaseError("Unable to load mentees for preferences.", menteeErr.code);
    if (mentorErr) throw databaseError("Unable to load mentors for preferences.", mentorErr.code);

    const menteeMap = new Map((menteeRows ?? []).map((r) => [r.student_id as string, r.id as string]));
    const mentorMap = new Map((mentorRows ?? []).map((r) => [r.student_id as string, r.id as string]));

    const prefRows: { mentee_id: string; mentor_id: string; priority: number; submitted_at: string }[] = [];
    const now = new Date();

    for (let i = 0; i < SEED_MENTEES.length; i++) {
      const m      = SEED_MENTEES[i];
      const sid    = menteeStudentId(m.last4);
      const menteeId = menteeMap.get(sid);
      if (!menteeId) continue; // mentee not yet inserted — skip

      const submittedAt = new Date(now.getTime() + i * 1000).toISOString();

      for (let p = 0; p < 3; p++) {
        const mentorSid  = `TG/2024/${m.prefs[p].padStart(4, "0")}`;
        const mentorId   = mentorMap.get(mentorSid);
        if (!mentorId) continue; // mentor not found — skip this pref
        prefRows.push({ mentee_id: menteeId, mentor_id: mentorId, priority: p + 1, submitted_at: submittedAt });
      }
    }

    if (!prefRows.length) {
      return NextResponse.json({ ok: true, inserted: 0, total: 0, note: "No preferences to insert — inject mentors and mentees first." });
    }

    // Insert in batches of 50 to avoid request size limits
    let inserted = 0;
    const BATCH = 50;
    for (let i = 0; i < prefRows.length; i += BATCH) {
      const chunk = prefRows.slice(i, i + BATCH);
      const { data, error } = await supabase
        .from("mentor_preferences")
        .upsert(chunk, { onConflict: "mentee_id,priority", ignoreDuplicates: true })
        .select("mentee_id");
      if (error) throw databaseError("Unable to inject preferences.", error.code);
      inserted += data?.length ?? 0;
    }

    return NextResponse.json({ ok: true, inserted, total: prefRows.length });
  } catch (e) {
    return apiError(e);
  }
}
