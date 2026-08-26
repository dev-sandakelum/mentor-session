"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../ToastProvider";
import { Pill } from "../ui/Pill";
import { postJson } from "@/lib/client-api";
import {
  MENTEE_SESSION_DAYS,
  clearMenteeSession,
  menteeSessionDaysLeft,
  readMenteeSession,
  saveMenteeSession,
  type MenteeSession,
} from "@/lib/mentee-session";

export function MenteeLoginScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [session, setSession] = useState<MenteeSession | null>(null);
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [tgNumber, setTgNumber] = useState("");

  useEffect(() => {
    setSession(readMenteeSession());
    setChecking(false);
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = fullName.trim();
    const contact = phone.trim();
    const tg = tgNumber.trim();
    if (!name || !contact || !tg) return;

    setSubmitting(true);
    let serverId: string | null = null;
    let offline = false;

    try {
      const result = await postJson<{ mentee: { id: string } }>("/api/mentee/login", {
        fullName: name,
        phone: contact,
        tgNumber: tg,
      });
      serverId = result.mentee.id;
    } catch {
      // The login endpoint is not wired up yet — keep the device session so the
      // rest of the flow stays usable, and pick up the server id on next login.
      offline = true;
    }

    const saved = saveMenteeSession({
      id: serverId ?? `local:${tg.toLowerCase()}`,
      fullName: name,
      phone: contact,
      tgNumber: tg,
      local: offline,
    });

    setSession(saved);
    setSubmitting(false);
    showToast(
      offline
        ? `Signed in on this device for ${MENTEE_SESSION_DAYS} days.`
        : `Welcome, ${name.split(" ")[0]}! Session saved for ${MENTEE_SESSION_DAYS} days.`,
    );
    router.push("/mentee/prefs");
  };

  const signOut = () => {
    clearMenteeSession();
    setSession(null);
    setFullName("");
    setPhone("");
    setTgNumber("");
    showToast("Signed out of this device.");
  };

  if (checking) {
    return (
      <div className="container narrow">
        <p className="muted">Checking your device session…</p>
      </div>
    );
  }

  // ── Already signed in on this device ──────────────────────────────────────
  if (session) {
    const daysLeft = menteeSessionDaysLeft(session);
    return (
      <div className="container narrow">
        <h2 className="section-title">You&apos;re signed in</h2>
        <p className="section-sub">
          This device remembers you for the rest of the session ·{" "}
          <Pill variant="green" dot>
            {daysLeft} {daysLeft === 1 ? "day" : "days"} left
          </Pill>
        </p>

        <div className="card">
          <div className="ident">
            <div className="ident-avatar" aria-hidden="true">
              {session.fullName
                .split(/\s+/)
                .map((word) => word[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </div>
            <div className="ident-body">
              <h3 className="ident-name">{session.fullName}</h3>
              <p className="ident-meta">
                {session.tgNumber} · {session.phone}
              </p>
            </div>
          </div>

          <div className="ident-actions">
            <button className="btn btn-primary" type="button" onClick={() => router.push("/mentee/prefs")}>
              Choose my mentors
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
            <button className="btn btn-outline" type="button" onClick={() => router.push("/mentee/dashboard")}>
              My dashboard
            </button>
            <button className="btn btn-ghost" type="button" onClick={signOut}>
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Login form ────────────────────────────────────────────────────────────
  return (
    <div className="container narrow">
      <h2 className="section-title">Mentee Sign In</h2>
      <p className="section-sub">
        Mentor Session 2026 · Junior Batch (10th) ·{" "}
        <Pill variant="green" dot>
          Open
        </Pill>
      </p>

      <div className="card">
        <div className="form-note">
          <svg
            className="icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ flex: "none", marginTop: 1 }}
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          <span>
            No password needed. Enter your details once — this device stays signed in for{" "}
            <b>{MENTEE_SESSION_DAYS} days</b> so you can come back to your preferences and dashboard.
          </span>
        </div>

        <form className="form-grid" onSubmit={(event) => void handleSubmit(event)}>
          <div className="full">
            <label htmlFor="login-name">
              Full Name <span className="req">*</span>
            </label>
            <input
              id="login-name"
              name="fullName"
              type="text"
              autoComplete="name"
              placeholder="e.g., Kavindi Wickramasinghe"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="login-phone">
              Phone Number <span className="req">*</span>
            </label>
            <input
              id="login-phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="07X XXX XXXX"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="login-tg">
              TG Number <span className="req">*</span>
            </label>
            <input
              id="login-tg"
              name="tgNumber"
              type="text"
              placeholder="TG/IT/2025/1234"
              value={tgNumber}
              onChange={(event) => setTgNumber(event.target.value)}
              required
            />
            <p className="hint">Your student number, exactly as issued by the faculty.</p>
          </div>

          <div className="full form-actions">
            <button className="btn btn-ghost" type="button" onClick={() => router.push("/")}>
              Cancel
            </button>
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign in & choose mentors"}
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
