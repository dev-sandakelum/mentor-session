import { NextResponse } from "next/server";
import { ApiError, apiError, databaseError, isUuid, readJson, stringField } from "@/lib/api";
import { getCurrentSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const participantType = body.participantType;
    const participantId = typeof body.participantId === "string" ? body.participantId : "";
    const rating = body.rating;
    if (participantType !== "mentor" && participantType !== "mentee") throw new ApiError("Participant type is invalid.");
    if (!isUuid(participantId)) throw new ApiError("A valid participantId is required.");
    if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) throw new ApiError("Rating must be between 1 and 5.");
    const session = await getCurrentSession();
    const { error } = await getSupabaseAdmin().from("feedback").insert({
      session_id: session.id,
      participant_type: participantType,
      participant_id: participantId,
      rating,
      comment: stringField(body.comment, "Comment", { optional: true, max: 2000 }),
    });
    if (error) throw databaseError("Unable to submit feedback.", error.code);
    return NextResponse.json({ message: "Feedback submitted." }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
