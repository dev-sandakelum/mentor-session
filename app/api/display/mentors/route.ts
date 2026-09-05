import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { getAvailableMentors } from "@/lib/session";

export const dynamic = "force-dynamic";

// GET /api/display/mentors
// Public — returns approved mentors for the carousel display screen.
export async function GET() {
  try {
    const mentors = await getAvailableMentors();
    return NextResponse.json({
      mentors: mentors.map((m) => ({
        id:           m.id,
        name:         m.fullName,
        batch:        m.batch,
        photoUrl:     m.profilePhotoUrl,
        allocatedCount: m.allocatedCount,
        capacity:     m.capacity,
      })),
    });
  } catch (e) {
    return apiError(e);
  }
}
