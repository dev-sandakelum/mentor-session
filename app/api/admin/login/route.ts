import { NextResponse } from "next/server";
import { adminSessionCookie, ADMIN_SESSION_COOKIE, createAdminSession, verifyAdminCredentials } from "@/lib/admin-auth";
import { ApiError, apiError, readJson, stringField } from "@/lib/api";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const email = stringField(body.email, "Email", { max: 254 });
    const password = stringField(body.password, "Password", { max: 1024 });
    if (!verifyAdminCredentials(email, password)) {
      throw new ApiError("Invalid administrator email or password.", 401);
    }
    const response = NextResponse.json({ authenticated: true });
    response.cookies.set(ADMIN_SESSION_COOKIE, createAdminSession(), adminSessionCookie);
    return response;
  } catch (error) {
    return apiError(error);
  }
}
