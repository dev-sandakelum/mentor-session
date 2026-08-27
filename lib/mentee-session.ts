/**
 * Mentee session helpers — persists the mentee UUID in both localStorage
 * (fast sync read) and a 7-day client cookie (survives tab/browser close).
 */

const KEY = "mentor-session-mentee-id";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

export function getMenteeId(): string | null {
  if (typeof window === "undefined") return null;
  // Prefer localStorage; fall back to cookie
  const fromStorage = window.localStorage.getItem(KEY);
  if (fromStorage) return fromStorage;
  const match = document.cookie.match(new RegExp(`(?:^|; )${KEY}=([^;]+)`));
  if (match) {
    // Re-sync localStorage if cookie still alive
    window.localStorage.setItem(KEY, match[1]);
    return match[1];
  }
  return null;
}

export function setMenteeId(id: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, id);
  document.cookie = `${KEY}=${encodeURIComponent(id)}; max-age=${COOKIE_MAX_AGE}; path=/; SameSite=Lax`;
}

export function clearMenteeId(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  // Expire the cookie immediately
  document.cookie = `${KEY}=; max-age=0; path=/; SameSite=Lax`;
}
