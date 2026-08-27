import { NextResponse } from "next/server";
import { apiError, databaseError, requireAdmin } from "@/lib/api";
import { getCurrentSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    requireAdmin(request);
    const supabase = getSupabaseAdmin();
    const session = await getCurrentSession();

    // Fetch full session config including control flags
    const { data: sessionConfig } = await supabase
      .from("mentor_sessions")
      .select("id, title, status, registration_open, mentor_reg_open, mentee_reg_open, prefs_open, event_starts_at, venue")
      .eq("id", session.id)
      .single();

    const sessionFull = sessionConfig ?? { ...session, mentor_reg_open: false, mentee_reg_open: false, prefs_open: false, event_starts_at: null, venue: null };

    const [
      { data: mentors,     error: mentorError     },
      { data: mentees,     error: menteeError      },
      { data: allocations, error: allocationError  },
      { data: preferences, error: preferenceError  },
      { data: logs,        error: logError         },
    ] = await Promise.all([
      supabase.from("mentors").select("id, full_name, student_id, email, phone, batch, communication_method, profile_photo_url, capacity").eq("session_id", session.id).order("full_name"),
      supabase.from("mentees").select("id, full_name, student_id, email, phone, batch, preference_submitted_at").eq("session_id", session.id).order("full_name"),
      supabase.from("allocations").select("mentee_id, mentor_id, method, matched_priority, allocated_at").eq("session_id", session.id).order("allocated_at"),
      supabase.from("mentor_preferences").select("mentee_id, mentor_id, priority"),
      supabase.from("allocation_logs").select("id, action, detail, created_at").eq("session_id", session.id).order("created_at", { ascending: false }).limit(8),
    ]);

    if (mentorError || menteeError || allocationError || preferenceError || logError) {
      throw databaseError("Unable to load admin dashboard data.", mentorError?.code ?? menteeError?.code ?? allocationError?.code ?? preferenceError?.code ?? logError?.code);
    }

    // Fetch is_approved separately — gracefully degrades if migration hasn't run (42703)
    const { data: approvalRows } = await supabase
      .from("mentors")
      .select("id, is_approved")
      .eq("session_id", session.id);

    // Build lookup — if column doesn't exist, approvalRows entries won't have the key
    const migrationDone = Array.isArray(approvalRows) && approvalRows.length > 0 && "is_approved" in approvalRows[0];
    const approvalMap = new Map<string, boolean>();
    if (migrationDone) {
      (approvalRows ?? []).forEach((r) => {
        approvalMap.set(r.id, (r as { is_approved: boolean }).is_approved ?? true);
      });
    }

    const mentorList = (mentors ?? []).map((m) => ({
      ...m,
      // If migration hasn't run default to true so existing data stays visible
      is_approved: migrationDone ? (approvalMap.get(m.id) ?? true) : true,
    }));

    const menteeList     = mentees ?? [];
    const allocationList = allocations ?? [];

    const pendingMentors  = mentorList.filter((m) => !m.is_approved);
    const approvedMentors = mentorList.filter((m) => m.is_approved);

    const menteeNames = new Map(menteeList.map((mentee) => [mentee.id, mentee.full_name]));
    const mentorNames = new Map(mentorList.map((mentor) => [mentor.id, mentor.full_name]));

    const preferenceNames = new Map<string, string[]>();
    (preferences ?? []).forEach((preference) => {
      const names = preferenceNames.get(preference.mentee_id) ?? [];
      names[preference.priority - 1] = mentorNames.get(preference.mentor_id) ?? "Unknown mentor";
      preferenceNames.set(preference.mentee_id, names);
    });

    const allocationsByMentor = new Map<string, number>();
    allocationList.forEach((allocation) => allocationsByMentor.set(allocation.mentor_id, (allocationsByMentor.get(allocation.mentor_id) ?? 0) + 1));
    const allocationsByMentee  = new Map(allocationList.map((allocation) => [allocation.mentee_id, allocation]));
    const allocatedMenteeIds   = new Set(allocationList.map((allocation) => allocation.mentee_id));
    const submittedMentees     = menteeList.filter((mentee) => mentee.preference_submitted_at);
    const matched              = allocationList.filter((allocation) => allocation.method === "preference").length;

    return NextResponse.json({
      session: sessionFull,
      stats: {
        totalMentors:          approvedMentors.length,
        pendingApprovals:      pendingMentors.length,
        totalMentees:          menteeList.length,
        submittedPreferences:  submittedMentees.length,
        totalCapacity:         approvedMentors.reduce((total, mentor) => total + mentor.capacity, 0),
        assigned:              allocationList.length,
        unassigned:            submittedMentees.filter((mentee) => !allocatedMenteeIds.has(mentee.id)).length,
        availableCapacity:     approvedMentors.reduce((total, mentor) => total + Math.max(mentor.capacity - (allocationsByMentor.get(mentor.id) ?? 0), 0), 0),
        firstChoice:           allocationList.filter((allocation) => allocation.matched_priority === 1).length,
        secondChoice:          allocationList.filter((allocation) => allocation.matched_priority === 2).length,
        thirdChoice:           allocationList.filter((allocation) => allocation.matched_priority === 3).length,
        fallback:              allocationList.filter((allocation) => allocation.method === "fallback").length,
        manual:                allocationList.filter((allocation) => allocation.method === "manual").length,
        preferenceSatisfaction: allocationList.length ? Math.round((matched / allocationList.length) * 1000) / 10 : 0,
      },
      allocations: allocationList.map((allocation) => ({
        mentee:          menteeNames.get(allocation.mentee_id) ?? "Unknown mentee",
        mentor:          mentorNames.get(allocation.mentor_id) ?? "Unknown mentor",
        submittedAt:     menteeList.find((mentee) => mentee.id === allocation.mentee_id)?.preference_submitted_at,
        method:          allocation.method,
        matchedPriority: allocation.matched_priority,
      })),
      unmatched: submittedMentees.filter((mentee) => !allocatedMenteeIds.has(mentee.id)).map((mentee) => ({
        mentee:      mentee.full_name,
        preferences: preferenceNames.get(mentee.id) ?? [],
      })),
      mentorLoads: approvedMentors.map((mentor) => ({
        name:     mentor.full_name,
        assigned: allocationsByMentor.get(mentor.id) ?? 0,
        capacity: mentor.capacity,
      })),
      mentors: mentorList,
      mentees: menteeList.map((mentee) => {
        const allocation = allocationsByMentee.get(mentee.id);
        return {
          ...mentee,
          assignedMentor:   allocation ? mentorNames.get(allocation.mentor_id) ?? "Unknown mentor" : null,
          allocationMethod: allocation?.method ?? null,
          matchedPriority:  allocation?.matched_priority ?? null,
        };
      }),
      logs: logs ?? [],
    });
  } catch (error) {
    return apiError(error);
  }
}
