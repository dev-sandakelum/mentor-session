import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { getAvailableMentors, getCurrentSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [session, mentors] = await Promise.all([getCurrentSession(), getAvailableMentors()]);
    return NextResponse.json({ session, mentors });
  } catch (error) {
    return apiError(error);
  }
}
