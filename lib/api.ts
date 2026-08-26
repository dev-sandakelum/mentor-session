import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/admin-auth";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
    public readonly field?: string,
  ) {
    super(message);
  }
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new ApiError("Request body must be a JSON object.");
    }
    return body as Record<string, unknown>;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("Request body must contain valid JSON.");
  }
}

type StringFieldOptions = { optional?: boolean; max?: number };

export function stringField(value: unknown, field: string, options?: { optional?: false; max?: number }): string;
export function stringField(value: unknown, field: string, options: { optional: true; max?: number }): string | null;
export function stringField(value: unknown, field: string, options?: StringFieldOptions): string | null {
  if ((value === undefined || value === null || value === "") && options?.optional) return null;
  if (typeof value !== "string" || !value.trim()) throw new ApiError(`${field} is required.`);
  const result = value.trim();
  if (options?.max && result.length > options.max) throw new ApiError(`${field} is too long.`);
  return result;
}

export function stringArray(value: unknown, field: string, max = 12) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || !item.trim())) {
    throw new ApiError(`${field} must be a list of text values.`);
  }
  if (value.length > max) throw new ApiError(`${field} may contain at most ${max} values.`);
  return [...new Set(value.map((item) => item.trim()))];
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function apiError(error: unknown) {
  if (error instanceof ApiError) return NextResponse.json({ error: error.message, field: error.field }, { status: error.status });
  if (error instanceof Error && error.message.startsWith("Supabase is not configured")) {
    return NextResponse.json({ error: error.message }, { status: 503 });
  }
  if (error instanceof Error && error.message.startsWith("Admin login is not configured")) {
    return NextResponse.json({ error: error.message }, { status: 503 });
  }
  console.error(error);
  return NextResponse.json({ error: "An unexpected server error occurred." }, { status: 500 });
}

export function databaseError(message: string, code?: string) {
  if (code === "23505") return new ApiError("A record with those details already exists.", 409);
  console.error(`[databaseError] ${message} (code: ${code ?? "none"})`);
  return new ApiError(message, 500);
}

export function requireAdmin(request: Request) {
  if (!hasAdminSession(request)) {
    throw new ApiError("Administrator authentication is required.", 401);
  }
}
