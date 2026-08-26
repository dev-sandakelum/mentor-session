"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { postJson } from "@/lib/client-api";
import { useToast } from "../ToastProvider";
import { Pill } from "../ui/Pill";
import { StarRating } from "../ui/StarRating";
import { menteeSessionDaysLeft, readMenteeSession, type MenteeSession } from "@/lib/mentee-session";

type DashboardData = {
  session: { title: string; status: string; event_starts_at: string | null; venue: string | null };
  mentee: { id: string; full_name: string; batch: string; academic_interests: string[]; technical_interests: string[] };
  allocation: null | {
    method: string;
    matched_priority: number | null;
    mentor: {
      full_name: string;
      batch: string;
      email: string;
      phone: string;
      communication_method: string;
      academic_interests: string[];
      technical_interests: string[];
    };
    group: { id: string; full_name: string; batch: string; academic_interests: string[]; technical_interests: string[] }[];
  };
};

function interests(person: { academic_interests: string[]; technical_interests: string[] }) {
  return [...person.academic_interests, ...person.technical_interests].join(", ") || "No interests listed";
}

function ordinal(priority: number) {
  return priority === 1 ? "1st" : priority === 2 ? "2nd" : "3rd";
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function MenteeDashScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [data, setData] = useState<DashboardData>();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<MenteeSession | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const stored = readMenteeSession();
    setSession(stored);

    if (!stored) {
      setLoading(false);
      return;
    }

    fetch(`/api/dashboard/mentee?menteeId=${encodeURIComponent(stored.id)}`)
      .then(async (response) => {
        const payload: unknown = await response.json();
        if (!response.ok) {
          throw new Error(
            typeof payload === "object" && payload && "error" in payload && typeof payload.error === "string"
              ? payload.error
              : "Unable to load your dashboard.",
          );
        }
        return payload as DashboardData;
      })
      .then(setData)
      .catch(() => {
        /* Allocation data is not published yet — the placeholder state covers it. */
      })
      .finally(() => setLoading(false));
  }, []);

  const submitFeedback = async () => {
    if (!rating) return showToast("Please choose a star rating first.");
    setSending(true);
    try {
      await postJson("/api/feedback", {
        participantType: "mentee",
        participantId: data?.mentee.id ?? session?.id,
        rating,
        comment,
      });
      showToast("Thank you! Feedback submitted.");
      setComment("");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Feedback could not be submitted.");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <p className="muted">Loading your dashboard…</p>
      </div>
    );
  }

  // ── Not signed in ─────────────────────────────────────────────────────────
  if (!session) {
    return (
      <div className="container narrow">
        <h2 className="section-title">Mentee Dashboard</h2>
        <p className="section-sub">Sign in with your name, phone number and TG number to see your mentor.</p>
        <div className="card">
          <button className="btn btn-primary" type="button" onClick={() => router.push("/mentee")}>
            Sign in as a mentee
            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  const displayName = data?.mentee.full_name ?? session.fullName;
  const allocation = data?.allocation ?? null;
  const daysLeft = menteeSessionDaysLeft(session);

  return (
    <div className="container">
      <div className="dash-head">
        <div>
          <h2 className="section-title">Welcome back, {displayName.split(" ")[0]}</h2>
          <p className="section-sub" style={{ marginBottom: 0 }}>
            {data?.session.title ?? "Mentor Session 2026"} ·{" "}
            <Pill variant="indigo" dot>
              {(data?.session.status ?? "open").toUpperCase()}
            </Pill>
          </p>
        </div>
        <Pill variant="gray">
          Device session · {daysLeft} {daysLeft === 1 ? "day" : "days"} left
        </Pill>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <div className="ident">
          <div className="ident-avatar" aria-hidden="true">
            {initials(displayName)}
          </div>
          <div className="ident-body">
            <h3 className="ident-name">{displayName}</h3>
            <p className="ident-meta">
              {session.tgNumber} · {session.phone}
            </p>
          </div>
        </div>
      </div>

      {!allocation ? (
        <div className="card" style={{ marginTop: 20 }}>
          <h3 className="card-title">Allocation pending</h3>
          <p className="muted">
            Your details are saved on this device. Your mentor will appear here once the administrator publishes
            allocations.
          </p>
          <button
            className="btn btn-outline btn-sm"
            type="button"
            style={{ marginTop: 14 }}
            onClick={() => router.push("/mentee/prefs")}
          >
            Review my preferences
          </button>
        </div>
      ) : (
        <div className="dash-grid" style={{ marginTop: 20 }}>
          <div>
            <div className="assign-hero">
              <span className="label">Your Mentor</span>
              <h2>{allocation.mentor.full_name}</h2>
              <div className="sub">
                {allocation.mentor.batch} · {interests(allocation.mentor)}
              </div>
              <span className="star-pill">
                Assignment:{" "}
                {allocation.matched_priority ? `${ordinal(allocation.matched_priority)} Choice` : "Fallback"}
              </span>
            </div>

            <div className="card" style={{ marginTop: 20 }}>
              <h3 className="card-title">Mentor Contact</h3>
              <div className="info-row">
                <div>
                  <b>Email</b>
                  {allocation.mentor.email}
                </div>
              </div>
              <div className="info-row">
                <div>
                  <b>{allocation.mentor.communication_method} (preferred)</b>
                  {allocation.mentor.phone}
                </div>
              </div>
            </div>

            <div className="card" style={{ marginTop: 20 }}>
              <h3 className="card-title">Your Mentor Group</h3>
              {allocation.group.length === 0 ? (
                <p className="muted">You are currently the only assigned mentee.</p>
              ) : (
                allocation.group.map((member) => (
                  <div className="mentee-item" key={member.id}>
                    <div className="avatar" aria-hidden="true">
                      {initials(member.full_name)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <h4>
                        {member.full_name}{" "}
                        <Pill variant="gray" className="ml-1.5">
                          Other mentee
                        </Pill>
                      </h4>
                      <div className="meta">
                        {member.batch} · {interests(member)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <div className="card">
              <h3 className="card-title">Session Details</h3>
              <div className="info-row">
                <div>
                  <b>Date &amp; Time</b>
                  {data?.session.event_starts_at
                    ? new Date(data.session.event_starts_at).toLocaleString()
                    : "To be announced"}
                </div>
              </div>
              <div className="info-row">
                <div>
                  <b>Venue</b>
                  {data?.session.venue ?? "To be announced"}
                </div>
              </div>
            </div>

            <div className="card" style={{ marginTop: 20 }}>
              <h3 className="card-title">Session Feedback</h3>
              <StarRating label="How useful was the Mentor Session?" value={rating} onChange={setRating} />
              <label htmlFor="mentee-feedback-comment">Comments &amp; suggestions</label>
              <textarea
                id="mentee-feedback-comment"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="How helpful was your mentor?"
              />
              <button
                className="btn btn-primary btn-sm fb-submit"
                disabled={sending}
                style={{ marginTop: 12 }}
                onClick={() => void submitFeedback()}
              >
                {sending ? "Submitting…" : "Submit Feedback"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
