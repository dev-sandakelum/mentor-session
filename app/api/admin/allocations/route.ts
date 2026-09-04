import { NextResponse } from "next/server";
import { ApiError, apiError, databaseError, readJson, requireAdmin } from "@/lib/api";
import { getCurrentSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type Mentor = { id: string; full_name: string; capacity: number };
type Preference = { mentee_id: string; mentor_id: string; priority: number };
type Mentee = { id: string; full_name: string; preference_submitted_at: string; student_id: string };
type ZeroAssignment = { mentee_student_id: string; mentor_id: string };
type PlannedAllocation = { mentee_id: string; mentor_id: string; method: "preference" | "fallback" | "manual"; matched_priority: number | null };

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function planAllocations(
  mentors: Mentor[],
  mentees: Mentee[],           // mentees who submitted preferences (FCFS order)
  allMentees: Mentee[],        // every registered mentee in the session
  preferences: Preference[],
  zeroAssignments: ZeroAssignment[], // pre-assignments by student_id
  includeFallback: boolean,
) {
  const available = new Map(mentors.map((mentor) => [mentor.id, mentor.capacity]));
  const preferencesByMentee = new Map<string, Preference[]>();
  preferences.forEach((preference) => {
    const list = preferencesByMentee.get(preference.mentee_id) ?? [];
    list.push(preference);
    preferencesByMentee.set(preference.mentee_id, list);
  });
  preferencesByMentee.forEach((list) => list.sort((a, b) => a.priority - b.priority));

  // Build a student_id → mentee_id lookup for zero-priority resolution
  const studentIdToMentee = new Map(allMentees.map((m) => [m.student_id, m]));

  const planned: PlannedAllocation[] = [];
  const allocatedMenteeIds = new Set<string>();

  // ── Phase 0: Zero-priority pre-assignments ──
  // Silently applied first; these mentees are excluded from all subsequent phases.
  for (const za of zeroAssignments) {
    const mentee = studentIdToMentee.get(za.mentee_student_id);
    if (!mentee) continue; // mentee hasn't registered yet — skip silently
    if (allocatedMenteeIds.has(mentee.id)) continue; // already handled (shouldn't happen)
    const cap = available.get(za.mentor_id) ?? 0;
    if (cap <= 0) continue; // mentor is full — skip silently
    available.set(za.mentor_id, cap - 1);
    planned.push({ mentee_id: mentee.id, mentor_id: za.mentor_id, method: "manual", matched_priority: null });
    allocatedMenteeIds.add(mentee.id);
  }

  // ── Phase 1: FCFS preference matching ──
  for (const mentee of mentees) {
    if (allocatedMenteeIds.has(mentee.id)) continue; // already placed in Phase 0
    const match = preferencesByMentee.get(mentee.id)?.find((preference) => (available.get(preference.mentor_id) ?? 0) > 0);
    if (!match) continue;
    available.set(match.mentor_id, (available.get(match.mentor_id) ?? 1) - 1);
    planned.push({ mentee_id: mentee.id, mentor_id: match.mentor_id, method: "preference", matched_priority: match.priority });
    allocatedMenteeIds.add(mentee.id);
  }

  // ── Phase 2: Fallback ──
  if (includeFallback) {
    const unallocated = shuffled(allMentees.filter((m) => !allocatedMenteeIds.has(m.id)));
    const mentorsWithCapacity = shuffled(mentors.filter((m) => (available.get(m.id) ?? 0) > 0));
    let mentorIdx = 0;

    for (const mentee of unallocated) {
      while (mentorIdx < mentorsWithCapacity.length && (available.get(mentorsWithCapacity[mentorIdx].id) ?? 0) <= 0) {
        mentorIdx++;
      }
      if (mentorIdx >= mentorsWithCapacity.length) break;

      const mentor = mentorsWithCapacity[mentorIdx];
      available.set(mentor.id, (available.get(mentor.id) ?? 1) - 1);
      planned.push({ mentee_id: mentee.id, mentor_id: mentor.id, method: "fallback", matched_priority: null });
      allocatedMenteeIds.add(mentee.id);
    }
  }

  const unmatched = allMentees.filter((m) => !allocatedMenteeIds.has(m.id));
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
    const [
      { data: mentors,        error: mentorError    },
      { data: mentees,        error: menteeError     },
      { data: allMentees,     error: allMenteesError },
      { data: preferences,    error: preferenceError },
      { data: zeroRows,       error: zeroError       },
    ] = await Promise.all([
      supabase.from("mentors").select("id, full_name, capacity").eq("session_id", session.id).eq("is_approved", true),
      supabase.from("mentees").select("id, full_name, student_id, preference_submitted_at").eq("session_id", session.id).not("preference_submitted_at", "is", null).order("preference_submitted_at"),
      supabase.from("mentees").select("id, full_name, student_id, preference_submitted_at").eq("session_id", session.id),
      supabase.from("mentor_preferences").select("mentee_id, mentor_id, priority"),
      // Zero-priority pre-assignments — fetched silently; errors are non-fatal
      supabase.from("zero_priority_assignments").select("mentee_student_id, mentor_id").eq("session_id", session.id),
    ]);
    if (mentorError || menteeError || allMenteesError || preferenceError) {
      throw databaseError("Unable to load allocation data.", mentorError?.code ?? menteeError?.code ?? allMenteesError?.code ?? preferenceError?.code);
    }
    // Zero-priority errors are silently swallowed (table may not exist yet)
    const zeroAssignments: ZeroAssignment[] = zeroError ? [] : (zeroRows ?? []);

    const result = planAllocations(mentors ?? [], mentees ?? [], allMentees ?? [], preferences ?? [], zeroAssignments, includeFallback);
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

    const menteeNames = new Map((allMentees ?? []).map((mentee) => [mentee.id, mentee.full_name]));
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
