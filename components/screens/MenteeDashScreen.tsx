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
      id: string;
      full_name: string;
      batch: string;
      email: string;
      phone: string;
      communication_method: string;
      profile_photo_url?: string | null;
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

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

// ── SVG Icons ────────────────────────────────────────────────────────────────
const MailIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden="true">
    <rect x="2" y="5" width="16" height="12" rx="2" />
    <path d="M2 7l8 5 8-5" />
  </svg>
);
const PhoneIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden="true">
    <path d="M4 3h4l2 4-2.5 1.5a10 10 0 004 4L13 10l4 2v4a1 1 0 01-1 1C6.716 17 3 13.284 3 4a1 1 0 011-1z" />
  </svg>
);
const CalendarIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden="true">
    <rect x="2" y="4" width="16" height="14" rx="2" />
    <path d="M6 2v3M14 2v3M2 9h16" />
  </svg>
);
const PinIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden="true">
    <path d="M10 2a6 6 0 016 6c0 4-6 10-6 10S4 12 4 8a6 6 0 016-6z" />
    <circle cx="10" cy="8" r="2" />
  </svg>
);
const UserGroupIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden="true">
    <circle cx="7" cy="7" r="3" />
    <path d="M1 17c0-3.3 2.7-6 6-6" />
    <circle cx="14" cy="7" r="3" />
    <path d="M19 17c0-3.3-2.7-6-6-6" />
    <path d="M7 17c0-3.3 2.7-6 6-6" />
  </svg>
);
const StarIconSvg = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden="true">
    <path d="M10 2l2.4 5 5.6.8-4 3.9 1 5.5L10 14.5l-5 2.7 1-5.5L2 7.8l5.6-.8z" />
  </svg>
);
const ClockIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden="true">
    <circle cx="10" cy="10" r="8" />
    <path d="M10 6v4l2.5 2.5" />
  </svg>
);

// ── Mentor photo / avatar ──────────────────────────────────────────────────────
function MentorAvatar({
  photoUrl,
  name,
  size = 80,
  className = "",
}: {
  photoUrl?: string | null;
  name: string;
  size?: number;
  className?: string;
}) {
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name}
        className={`mdash-mentor-photo ${className}`}
        style={{ width: size, height: size }}
        draggable={false}
      />
    );
  }
  return (
    <div
      className={`mdash-mentor-avatar ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.3 }}
      aria-hidden="true"
    >
      {getInitials(name)}
    </div>
  );
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

  const matchLabel =
    method === "fallback"
      ? "Fallback assignment"
      : `Matched on your ${ordinal(matched_priority ?? 1)} choice`;

  const isFirstChoice = method !== "fallback" && matched_priority === 1;

  return (
    <div className="mdash-allocated">

      {/* ── Hero banner ── */}
      <div className="mdash-hero-banner">
        {/* Decorative blobs */}
        <div className="mdash-hero-blob mdash-hero-blob-1" aria-hidden="true" />
        <div className="mdash-hero-blob mdash-hero-blob-2" aria-hidden="true" />

        <div className="mdash-hero-photo-wrap">
          <MentorAvatar
            photoUrl={mentor.profile_photo_url}
            name={mentor.full_name}
            size={88}
            className="mdash-hero-avatar-img"
          />
          {isFirstChoice && (
            <span className="mdash-hero-star-badge" aria-label="1st choice match">⭐</span>
          )}
        </div>

        <div className="mdash-hero-text">
          <p className="mdash-mentor-label">Your Assigned Mentor</p>
          <h2 className="mdash-mentor-name">{mentor.full_name}</h2>
          <p className="mdash-mentor-batch">{mentor.batch}</p>
          <span className="mdash-assignment-pill">{matchLabel}</span>
        </div>
      </div>

      {/* ── Two-column detail grid ── */}
      <div className="mdash-grid">

        {/* Left column */}
        <div className="mdash-col">

          {/* Contact card */}
          <div className="card mdash-info-card">
            <h3 className="card-title">
              <span className="mdash-card-icon mdash-card-icon-indigo"><MailIcon /></span>
              Contact your mentor
            </h3>
            <div className="mdash-contact-row">
              <span className="mdash-contact-icon" aria-hidden="true"><MailIcon /></span>
              <div>
                <p className="mdash-contact-label">Email</p>
                <a href={`mailto:${mentor.email}`} className="mdash-contact-value">{mentor.email}</a>
              </div>
            </div>
            <div className="mdash-contact-row">
              <span className="mdash-contact-icon" aria-hidden="true"><PhoneIcon /></span>
              <div>
                <p className="mdash-contact-label">{mentor.communication_method} (preferred)</p>
                <span className="mdash-contact-value">{mentor.phone}</span>
              </div>
            </div>
          </div>

          {/* Mentor group card */}
          <div className="card mdash-info-card" style={{ marginTop: 14 }}>
            <h3 className="card-title">
              <span className="mdash-card-icon mdash-card-icon-green"><UserGroupIcon /></span>
              Your mentor group
            </h3>
            {group.length === 0 ? (
              <p className="muted" style={{ fontSize: 13 }}>
                You are the only mentee assigned to this mentor.
              </p>
            ) : (
              <div className="mdash-group-list">
                {group.map((member, i) => (
                  <div className="mdash-group-member" key={member.id}>
                    <div
                      className="mdash-group-avatar"
                      style={{ "--gi": i } as React.CSSProperties}
                      aria-hidden="true"
                    >
                      {getInitials(member.full_name)}
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

          {/* Session details card */}
          {/* <div className="card mdash-info-card">
            <h3 className="card-title">
              <span className="mdash-card-icon mdash-card-icon-amber"><CalendarIcon /></span>
              Session details
            </h3>
            <div className="mdash-detail-row">
              <span className="mdash-detail-icon" aria-hidden="true"><CalendarIcon /></span>
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
              <span className="mdash-detail-icon" aria-hidden="true"><PinIcon /></span>
              <div>
                <p className="mdash-contact-label">Venue</p>
                <p className="mdash-contact-value">{session.venue ?? "To be announced"}</p>
              </div>
            </div>
          </div> */}

          {/* Feedback card */}
          <div className="card mdash-info-card" style={{ marginTop: 14 }}>
            <h3 className="card-title">
              <span className="mdash-card-icon mdash-card-icon-amber"><StarIconSvg /></span>
              Session feedback
            </h3>
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
              className="btn btn-primary btn-sm fb-submit"
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
        <div className="mdash-pending-icon" aria-hidden="true"><ClockIcon /></div>
        <div>
          <h3 className="mdash-pending-title">Allocation in progress</h3>
          <p className="mdash-pending-sub">
            Your preferences have been recorded. Your assigned mentor will appear here once the
            administrator publishes allocations.
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

  if (loading) {
    return (
      <div className="container">
        <div className="mdash-skeleton-header" />
        <div className="mdash-skeleton-hero" />
        <div className="mdash-grid" style={{ marginTop: 16 }}>
          <div className="mdash-skeleton-card" />
          <div className="mdash-skeleton-card" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container">
        <h2 className="section-title">Mentee Dashboard</h2>
        <div className="form-note">Register as a mentee first to view your dashboard.</div>
      </div>
    );
  }

  const { session, mentee, allocation } = data;
  const allocationPublished = ALLOCATED_STATUSES.has(session.status);
  const firstName = mentee.full_name.split(" ")[0];

  return (
    <div className="container">
      {/* ── Page header ── */}
      <div className="mdash-header">
        <div>
          <h2 className="section-title" style={{ marginBottom: 4 }}>
            Welcome, {firstName} 👋
          </h2>
          <p className="section-sub" style={{ marginBottom: 0 }}>
            {session.title}&nbsp;·&nbsp;
            <Pill variant={allocationPublished ? "green" : "indigo"} dot>
              {session.status.toUpperCase()}
            </Pill>
          </p>
        </div>

      </div>

      {/* ── Body — four states ── */}
      {allocationPublished && allocation ? (
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
        <div className="card">
          <h3 className="card-title">No allocation found</h3>
          <p className="muted">
            The allocation has been processed but you were not assigned a mentor. Please contact the administrator.
          </p>
        </div>
      ) : prefs.length > 0 ? (
        <PendingView prefs={prefs} />
      ) : (
        <div className="card">
          <h3 className="card-title">Select your mentors</h3>
          <p className="muted">
            You haven&apos;t submitted your preferences yet. Go to Preference Selection to choose your top 3 mentors.
          </p>
        </div>
      )}
    </div>
  );
}
