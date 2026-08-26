import { NextResponse } from "next/server";
import { ApiError, apiError, databaseError, readJson, requireAdmin } from "@/lib/api";
import { getCurrentSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type Mentor = { id: string; full_name: string; capacity: number };
type Preference = { mentee_id: string; mentor_id: string; priority: number };
type Mentee = { id: string; full_name: string; preference_submitted_at: string };
type PlannedAllocation = { mentee_id: string; mentor_id: string; method: "preference" | "fallback"; matched_priority: number | null };

function planAllocations(mentors: Mentor[], mentees: Mentee[], preferences: Preference[], includeFallback: boolean) {
  const available = new Map(mentors.map((mentor) => [mentor.id, mentor.capacity]));
  const preferencesByMentee = new Map<string, Preference[]>();
  preferences.forEach((preference) => {
    const list = preferencesByMentee.get(preference.mentee_id) ?? [];
    list.push(preference);
    preferencesByMentee.set(preference.mentee_id, list);
  });
  preferencesByMentee.forEach((list) => list.sort((a, b) => a.priority - b.priority));

  const planned: PlannedAllocation[] = [];
  const unmatched: Mentee[] = [];
  for (const mentee of mentees) {
    const match = preferencesByMentee.get(mentee.id)?.find((preference) => (available.get(preference.mentor_id) ?? 0) > 0);
    if (!match) {
      unmatched.push(mentee);
      continue;
    }
    available.set(match.mentor_id, (available.get(match.mentor_id) ?? 1) - 1);
    planned.push({ mentee_id: mentee.id, mentor_id: match.mentor_id, method: "preference", matched_priority: match.priority });
  }

  if (includeFallback) {
    for (const mentee of unmatched.splice(0)) {
      const fallbackMentor = mentors.find((mentor) => (available.get(mentor.id) ?? 0) > 0);
      if (!fallbackMentor) {
        unmatched.push(mentee);
        continue;
      }
      available.set(fallbackMentor.id, (available.get(fallbackMentor.id) ?? 1) - 1);
      planned.push({ mentee_id: mentee.id, mentor_id: fallbackMentor.id, method: "fallback", matched_priority: null });
    }
  }

  return { planned, unmatched, mentorNames: new Map(mentors.map((mentor) => [mentor.id, mentor.full_name])) };
}

export async function POST(request: Request) {
  try {
    requireAdmin(request);
    const body = await readJson(request);
    const mode = body.mode === "commit" ? "commit" : body.mode === "preview" ? "preview" : null;
    if (!mode) throw new ApiError("Mode must be either preview or commit.");
    const includeFallback = body.includeFallback === true;
    const supabase = getSupabaseAdmin();
    const session = await getCurrentSession();
    const [{ data: mentors, error: mentorError }, { data: mentees, error: menteeError }, { data: preferences, error: preferenceError }] = await Promise.all([
      supabase.from("mentors").select("id, full_name, capacity").eq("session_id", session.id).eq("approval_status", "approved"),
      supabase.from("mentees").select("id, full_name, preference_submitted_at").eq("session_id", session.id).not("preference_submitted_at", "is", null).order("preference_submitted_at"),
      supabase.from("mentor_preferences").select("mentee_id, mentor_id, priority"),
    ]);
    if (mentorError || menteeError || preferenceError) {
      throw databaseError("Unable to load allocation data.", mentorError?.code ?? menteeError?.code ?? preferenceError?.code);
    }

    const result = planAllocations(mentors ?? [], mentees ?? [], preferences ?? [], includeFallback);
    if (mode === "commit") {
      const { error: deleteError } = await supabase.from("allocations").delete().eq("session_id", session.id);
      if (deleteError) throw databaseError("Unable to replace previous allocations.", deleteError.code);
      if (result.planned.length) {
        const { error: insertError } = await supabase.from("allocations").insert(result.planned.map((allocation) => ({ ...allocation, session_id: session.id })));
        if (insertError) throw databaseError("Unable to save allocations.", insertError.code);
      }
      const { error: logError } = await supabase.from("allocation_logs").insert({
        session_id: session.id,
        action: includeFallback ? "FCFS allocation committed with fallback" : "FCFS allocation committed",
        detail: `${result.planned.length} mentees allocated; ${result.unmatched.length} unmatched.`,
      });
      if (logError) throw databaseError("Allocation was saved, but the audit log could not be written.", logError.code);
    }

    const menteeNames = new Map((mentees ?? []).map((mentee) => [mentee.id, mentee.full_name]));
    return NextResponse.json({
      mode,
      allocationCount: result.planned.length,
      unmatchedCount: result.unmatched.length,
      allocations: result.planned.map((allocation) => ({
        mentee: menteeNames.get(allocation.mentee_id),
        mentor: result.mentorNames.get(allocation.mentor_id),
        method: allocation.method,
        matchedPriority: allocation.matched_priority,
      })),
      unmatched: result.unmatched.map((mentee) => mentee.full_name),
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    requireAdmin(request);
    const session = await getCurrentSession();
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("allocations").delete().eq("session_id", session.id);
    if (error) throw databaseError("Unable to reset allocations.", error.code);
    const { error: logError } = await supabase.from("allocation_logs").insert({
      session_id: session.id,
      action: "Allocation reset",
      detail: "All allocations were removed by an administrator.",
    });
    if (logError) throw databaseError("Allocations were reset, but the audit log could not be written.", logError.code);
    return NextResponse.json({ message: "Allocations reset." });
  } catch (error) {
    return apiError(error);
  }
}
