import { NextResponse } from "next/server";
import { ApiError, apiError, databaseError, isUuid, readJson, requireAdmin } from "@/lib/api";
import { getCurrentSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function PATCH(request: Request, context: RouteContext<"/api/admin/mentors/[id]">) {
  try {
    requireAdmin(request);
    const { id } = await context.params;
    if (!isUuid(id)) throw new ApiError("A valid mentor id is required.");
    const body = await readJson(request);
    const approvalStatus = body.approvalStatus;
    if (approvalStatus !== "approved" && approvalStatus !== "rejected") throw new ApiError("Approval status must be approved or rejected.");
    const capacity = body.capacity;
    if (capacity !== undefined && (typeof capacity !== "number" || !Number.isInteger(capacity) || capacity < 1 || capacity > 10)) {
      throw new ApiError("Capacity must be a whole number between 1 and 10.");
    }
    const session = await getCurrentSession();
    const updates: { approval_status: "approved" | "rejected"; reviewed_at: string; capacity?: number } = {
      approval_status: approvalStatus,
      reviewed_at: new Date().toISOString(),
    };
    if (capacity !== undefined) updates.capacity = capacity;
    const { data, error } = await getSupabaseAdmin()
      .from("mentors")
      .update(updates)
      .eq("id", id)
      .eq("session_id", session.id)
      .select("id, full_name, approval_status, capacity")
      .maybeSingle();
    if (error) throw databaseError("Unable to update mentor approval.", error.code);
    if (!data) throw new ApiError("Mentor was not found.", 404);
    return NextResponse.json({ mentor: data });
  } catch (error) {
    return apiError(error);
  }
}
