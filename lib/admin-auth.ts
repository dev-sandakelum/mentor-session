import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "mentor_session_admin";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

type AdminSession = { role: "admin"; exp: number };

function getConfig() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!email || !password || !secret) {
    throw new Error("Admin login is not configured. Add ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_SESSION_SECRET to .env.local.");
  }
  return { email, password, secret };
}

function encode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function decode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function verifyAdminCredentials(email: string, password: string) {
  const config = getConfig();
  return safeEqual(email, config.email) && safeEqual(password, config.password);
}

export function createAdminSession() {
  const { secret } = getConfig();
  const payload: AdminSession = { role: "admin", exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS };
  const encoded = encode(JSON.stringify(payload));
  return `${encoded}.${sign(encoded, secret)}`;
}

export function hasAdminSession(request: Request) {
  try {
    const { secret } = getConfig();
    const cookieHeader = request.headers.get("cookie") ?? "";
    const session = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${ADMIN_SESSION_COOKIE}=`))?.slice(ADMIN_SESSION_COOKIE.length + 1);
    if (!session) return false;
    const [encoded, signature, ...rest] = session.split(".");
    if (!encoded || !signature || rest.length || !safeEqual(signature, sign(encoded, secret))) return false;
    const payload: unknown = JSON.parse(decode(encoded));
    return typeof payload === "object" && payload !== null && "role" in payload && "exp" in payload && payload.role === "admin" && typeof payload.exp === "number" && payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export const adminSessionCookie = {
  httpOnly: true,
  maxAge: SESSION_MAX_AGE_SECONDS,
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};
