/**
 * Super-admin authentication — separate from the regular admin session.
 *
 * Uses a single bearer token stored in SUPER_ADMIN_KEY env var.
 * Never exposed to the browser or logs.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

function getSuperAdminKey(): string {
  const key = process.env.SUPER_ADMIN_KEY;
  if (!key || key.length < 32) {
    throw new Error("SUPER_ADMIN_KEY is not configured or is too short (min 32 chars). Add it to .env.local.");
  }
  return key;
}

function safeEqual(a: string, b: string): boolean {
  // Constant-time compare via HMAC to avoid timing attacks
  const key = "timing-safe-compare";
  const ha = createHmac("sha256", key).update(a).digest();
  const hb = createHmac("sha256", key).update(b).digest();
  return ha.length === hb.length && timingSafeEqual(ha, hb);
}

/**
 * Verify the Authorization header contains the correct super-admin bearer token.
 * Throws if not authenticated.
 */
export function requireSuperAdmin(request: Request): void {
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) {
    throw new Error("__SUPER_ADMIN_AUTH_REQUIRED__");
  }
  let key: string;
  try {
    key = getSuperAdminKey();
  } catch {
    throw new Error("__SUPER_ADMIN_NOT_CONFIGURED__");
  }
  if (!safeEqual(token, key)) {
    throw new Error("__SUPER_ADMIN_AUTH_REQUIRED__");
  }
}

export function isSuperAdminError(e: unknown): boolean {
  return (
    e instanceof Error &&
    (e.message === "__SUPER_ADMIN_AUTH_REQUIRED__" ||
      e.message === "__SUPER_ADMIN_NOT_CONFIGURED__")
  );
}
