"use client";

import { useEffect, useState } from "react";
import { postJson, getJson } from "@/lib/client-api";
import { getMenteeId } from "@/lib/mentee-session";
import { useToast } from "../ToastProvider";
import { Pill } from "../ui/Pill";
import { StarRating } from "../ui/StarRating";
import { MentorCard } from "../ui/MentorCard";

type SessionData = {
  title: string;
  status: string;
  event_starts_at: string | null;
  venue: string | null;
};

type DashboardData = {
  session: SessionData;
  mentee: { id: string; full_name: string; batch: string };
  allocation: null | {
    method: string;
    matched_priority: number | null;
    mentor: {
      full_name: string;
      batch: string;
      email: string;
      phone: string;
      communication_method: string;
    };
    group: { id: string; full_name: string; batch: string }[];
  };
};

type PreferenceMentor = {
  id: string;
  full_name: string;
  batch: string | null;
  profile_photo_url: string | null;
};

type Preference = {
  priority: number;
  submitted_at: string;
  mentors: PreferenceMentor | null;
};

const PRIO_LABELS = ["⭐ 1st Choice", "2nd Choice", "3rd Choice"] as const;
const ALLOCATED_STATUSES = new Set(["allocation", "published", "closed"]);

function ordinal(n: number) {
  return `${n}${n === 1 ? "st" : n === 2 ? "nd" : "rd"}`;
}

// ── Allocated view ────────────────────────────────────────────────────────────
function AllocatedView({
  data,
  rating,
  comment,
  sending,
  onRatingChange,
  onCommentChange,
  onFeedback,
}: {
  data: DashboardData;
  rating: number;
  comment: string;
  sending: boolean;
  onRatingChange: (v: number) => void;
  onCommentChange: (v: string) => void;
  onFeedback: () => void;
}) {
  const { session, allocation } = data;
  if (!allocation) return null;
  const { mentor, group, matched_priority, method } = allocation;

  return (
    <div className="mdash-allocated">
      {/* ── Hero mentor card ── */}
      <div className="mdash-mentor-hero">
        <div className="mdash-mentor-avatar">
          {mentor.full_name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
        </div>
        <div className="mdash-mentor-info">
          <p className="mdash-mentor-label">Your Assigned Mentor</p>
          <h2 className="mdash-mentor-name">{mentor.full_name}</h2>
          <p className="mdash-mentor-batch">{mentor.batch}</p>
          <span className="mdash-assignment-pill">
            {method === "fallback"
              ? "Fallback assignment"
              : `Matched on your ${ordinal(matched_priority ?? 1)} choice`}
          </span>
        </div>
      </div>

      <div className="mdash-grid">
        {/* Left column */}
        <div className="mdash-col">
          {/* Contact */}
          <div className="card">
            <h3 className="card-title">Contact your mentor</h3>
            <div className="mdash-contact-row">
              <span className="mdash-contact-icon" aria-hidden="true">✉</span>
              <div>
                <p className="mdash-contact-label">Email</p>
                <a href={`mailto:${mentor.email}`} className="mdash-contact-value">{mentor.email}</a>
              </div>
            </div>
            <div className="mdash-contact-row">
              <span className="mdash-contact-icon" aria-hidden="true">📱</span>
              <div>
                <p className="mdash-contact-label">{mentor.communication_method} (preferred)</p>
                <span className="mdash-contact-value">{mentor.phone}</span>
              </div>
            </div>
          </div>

          {/* Mentor group */}
          <div className="card" style={{ marginTop: 16 }}>
            <h3 className="card-title">Your mentor group</h3>
            {group.length === 0 ? (
              <p className="muted" style={{ fontSize: 13 }}>You are the only mentee assigned to this mentor.</p>
            ) : (
              <div className="mdash-group-list">
                {group.map((member) => (
                  <div className="mdash-group-member" key={member.id}>
                    <div className="mdash-group-avatar" aria-hidden="true">
                      {member.full_name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                    </div>
                    <div>
                      <p className="mdash-group-name">{member.full_name}</p>
                      <p className="mdash-group-batch">{member.batch}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="mdash-col">
          {/* Session */}
          <div className="card">
            <h3 className="card-title">Session details</h3>
            <div className="mdash-detail-row">
              <span className="mdash-detail-icon" aria-hidden="true">📅</span>
              <div>
                <p className="mdash-contact-label">Date &amp; Time</p>
                <p className="mdash-contact-value">
                  {session.event_starts_at
                    ? new Date(session.event_starts_at).toLocaleString()
                    : "To be announced"}
                </p>
              </div>
            </div>
            <div className="mdash-detail-row">
              <span className="mdash-detail-icon" aria-hidden="true">📍</span>
              <div>
                <p className="mdash-contact-label">Venue</p>
                <p className="mdash-contact-value">{session.venue ?? "To be announced"}</p>
              </div>
            </div>
          </div>

          {/* Feedback */}
          <div className="card" style={{ marginTop: 16 }}>
            <h3 className="card-title">Session feedback</h3>
            <StarRating label="How useful was the Mentor Session?" value={rating} onChange={onRatingChange} />
            <label htmlFor="mentee-feedback-comment" style={{ marginTop: 12, display: "block" }}>
              Comments &amp; suggestions
            </label>
            <textarea
              id="mentee-feedback-comment"
              value={comment}
              onChange={(e) => onCommentChange(e.target.value)}
              placeholder="How helpful was your mentor?"
            />
            <button
              className="btn btn-primary btn-sm"
              disabled={sending}
              style={{ marginTop: 12 }}
              onClick={onFeedback}
            >
              {sending ? "Submitting…" : "Submit Feedback"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Pending view (preferences submitted, waiting for allocation) ──────────────
function PendingView({ prefs }: { prefs: Preference[] }) {
  return (
    <div className="mdash-pending">
      <div className="mdash-pending-banner">
        <div className="mdash-pending-icon" aria-hidden="true">⏳</div>
        <div>
          <h3 className="mdash-pending-title">Allocation in progress</h3>
          <p className="mdash-pending-sub">
            Your preferences have been recorded. Your assigned mentor will appear here once the administrator publishes allocations.
          </p>
        </div>
      </div>

      {prefs.length > 0 && (
        <>
          <h3 className="dash-section-label" style={{ marginTop: 28 }}>Your submitted preferences</h3>
          <div className="dash-prefs-grid">
            {prefs.map((pref) => {
              const m = pref.mentors;
              if (!m) return null;
              return (
                <div key={m.id} className="dash-pref-item">
                  <div className="dash-pref-badge">
                    {PRIO_LABELS[pref.priority - 1] ?? `Priority ${pref.priority}`}
                  </div>
                  <MentorCard
                    id={m.id}
                    fullName={m.full_name}
                    batch={m.batch}
                    profilePhotoUrl={m.profile_photo_url}
                    index={pref.priority - 1}
                    priority={pref.priority as 1 | 2 | 3}
                  />
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function MenteeDashScreen() {
  const { showToast } = useToast();
  const [data, setData] = useState<DashboardData>();
  const [prefs, setPrefs] = useState<Preference[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const menteeId = getMenteeId();
    if (!menteeId) { queueMicrotask(() => setLoading(false)); return; }

    Promise.all([
      fetch(`/api/dashboard/mentee?menteeId=${encodeURIComponent(menteeId)}`)
        .then(async (res) => {
          const payload: unknown = await res.json();
          if (!res.ok) throw new Error(
            typeof payload === "object" && payload && "error" in payload && typeof payload.error === "string"
              ? payload.error : "Unable to load your dashboard."
          );
          return payload as DashboardData;
        }),
      getJson<{ preferences: Preference[] }>(`/api/preferences?menteeId=${encodeURIComponent(menteeId)}`)
        .then((p) => p.preferences)
        .catch(() => [] as Preference[]),
    ])
      .then(([dashData, prefData]) => { setData(dashData); setPrefs(prefData); })
      .catch((err: unknown) => showToast(err instanceof Error ? err.message : "Unable to load your dashboard."))
      .finally(() => setLoading(false));
  }, [showToast]);

  const submitFeedback = async () => {
    if (!data) return;
    if (!rating) return showToast("Please choose a star rating first.");
    setSending(true);
    try {
      await postJson("/api/feedback", { participantType: "mentee", participantId: data.mentee.id, rating, comment });
      showToast("Thank you! Feedback submitted ✓");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Feedback could not be submitted.");
    } finally { setSending(false); }
  };

  if (loading) return <div className="container"><p className="muted">Loading your dashboard…</p></div>;
  if (!data) return (
    <div className="container">
      <h2 className="section-title">Mentee Dashboard</h2>
      <div className="form-note">Register as a mentee first to view your dashboard.</div>
    </div>
  );

  const { session, mentee, allocation } = data;
  const allocationPublished = ALLOCATED_STATUSES.has(session.status);

  return (
    <div className="container">
      {/* Header */}
      <div className="mdash-header">
        <div>
          <h2 className="section-title" style={{ marginBottom: 4 }}>
            Welcome, {mentee.full_name.split(" ")[0]} 👋
          </h2>
          <p className="section-sub" style={{ marginBottom: 0 }}>
            {session.title}&nbsp;·&nbsp;
            <Pill variant={allocationPublished ? "green" : "indigo"} dot>
              {session.status.toUpperCase()}
            </Pill>
          </p>
        </div>
      </div>

      {/* Body — three states */}
      {allocationPublished && allocation ? (
        // State 1: Allocation published and I have a mentor
        <AllocatedView
          data={data}
          rating={rating}
          comment={comment}
          sending={sending}
          onRatingChange={setRating}
          onCommentChange={setComment}
          onFeedback={submitFeedback}
        />
      ) : allocationPublished && !allocation ? (
        // State 2: Allocation phase but I wasn't assigned (edge case)
        <div className="card">
          <h3 className="card-title">No allocation found</h3>
          <p className="muted">The allocation has been processed but you were not assigned a mentor. Please contact the administrator.</p>
        </div>
      ) : prefs.length > 0 ? (
        // State 3: Still in registration, preferences submitted
        <PendingView prefs={prefs} />
      ) : (
        // State 4: Registered but no preferences yet
        <div className="card">
          <h3 className="card-title">Select your mentors</h3>
          <p className="muted">You haven&apos;t submitted your preferences yet. Go to Preference Selection to choose your top 3 mentors.</p>
        </div>
      )}
    </div>
  );
}
