/**
 * Temporary mentee session, stored client-side in a cookie for 7 days.
 * No password — a mentee identifies with name + phone + TG (student) number.
 * The cookie is readable by the server too, so the backend can pick it up later.
 */

export const MENTEE_COOKIE = "mentor_session_mentee";
export const MENTEE_SESSION_DAYS = 7;

const MAX_AGE_SECONDS = MENTEE_SESSION_DAYS * 24 * 60 * 60;

export type MenteeSession = {
  /** Server-issued id when available, otherwise a local placeholder. */
  id: string;
  fullName: string;
  phone: string;
  /** TG / student number, e.g. TG/IT/2025/1234 */
  tgNumber: string;
  /** Epoch ms when this device session stops being valid. */
  expiresAt: number;
  /** True when the record was created without a server round-trip. */
  local?: boolean;
};

function isMenteeSession(value: unknown): value is MenteeSession {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.fullName === "string" &&
    typeof v.phone === "string" &&
    typeof v.tgNumber === "string" &&
    typeof v.expiresAt === "number"
  );
}

export function readMenteeSession(): MenteeSession | null {
  if (typeof document === "undefined") return null;

  const raw = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${MENTEE_COOKIE}=`))
    ?.slice(MENTEE_COOKIE.length + 1);

  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(raw));
    if (!isMenteeSession(parsed)) return null;
    if (parsed.expiresAt <= Date.now()) {
      clearMenteeSession();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveMenteeSession(input: Omit<MenteeSession, "expiresAt">): MenteeSession {
  const session: MenteeSession = {
    ...input,
    expiresAt: Date.now() + MAX_AGE_SECONDS * 1000,
  };

  if (typeof document !== "undefined") {
    const value = encodeURIComponent(JSON.stringify(session));
    document.cookie = `${MENTEE_COOKIE}=${value}; path=/; max-age=${MAX_AGE_SECONDS}; samesite=lax`;
  }

  return session;
}

export function clearMenteeSession() {
  if (typeof document === "undefined") return;
  document.cookie = `${MENTEE_COOKIE}=; path=/; max-age=0; samesite=lax`;
}

/** Whole days left before the device session expires (minimum 0). */
export function menteeSessionDaysLeft(session: MenteeSession): number {
  return Math.max(0, Math.ceil((session.expiresAt - Date.now()) / (24 * 60 * 60 * 1000)));
}

export function menteeFirstName(session: MenteeSession): string {
  return session.fullName.trim().split(/\s+/)[0] || session.fullName;
}
