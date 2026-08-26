import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { getCurrentSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getCurrentSession();
    return NextResponse.json({ ok: true, session: { year: session.year, status: session.status } });
  } catch (error) {
    return apiError(error);
  }
}
