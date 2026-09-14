"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getJson, postJson } from "@/lib/client-api";
import { useToast } from "../ToastProvider";
import { getMenteeId } from "@/lib/mentee-session";

interface Mentor {
  id: string;
  fullName: string;
  batch: string | null;
  profilePhotoUrl: string | null;
  capacity: number;
  allocatedCount: number;
}

const GRADIENTS = [
  "linear-gradient(135deg,#6366f1,#312e81)",
  "linear-gradient(135deg,#0ea5e9,#1d4ed8)",
  "linear-gradient(135deg,#f472b6,#9d174d)",
  "linear-gradient(135deg,#22c55e,#166534)",
  "linear-gradient(135deg,#f59e0b,#b45309)",
  "linear-gradient(135deg,#a855f7,#6b21a8)",
];

const RANKS = [
  {
    label: "1st Priority",
    shortLabel: "1st",
    color: "#f59e0b",
    colorVar: "var(--amber)",
    bg: "linear-gradient(135deg,#fffbeb,#fef3c7)",
    border: "#fcd34d",
    glow: "rgba(245,158,11,0.18)",
    icon: "⭐",
  },
  {
    label: "2nd Priority",
    shortLabel: "2nd",
    color: "#4f46e5",
    colorVar: "var(--indigo-light)",
    bg: "linear-gradient(135deg,#f5f3ff,#eef2ff)",
    border: "#a5b4fc",
    glow: "rgba(79,70,229,0.15)",
    icon: "🥈",
  },
  {
    label: "3rd Priority",
    shortLabel: "3rd",
    color: "#64748b",
    colorVar: "var(--gray-500)",
    bg: "linear-gradient(135deg,#f8fafc,#f1f5f9)",
    border: "#cbd5e1",
    glow: "rgba(100,116,139,0.12)",
    icon: "🥉",
  },
] as const;

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function MentorAvatar({
  mentor,
  index,
  size = 40,
}: {
  mentor: Mentor;
  index: number;
  size?: number;
}) {
  const gradient = GRADIENTS[index % GRADIENTS.length];
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        flexShrink: 0,
        background: gradient,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: Math.round(size * 0.32),
        fontWeight: 800,
        color: "#fff",
        letterSpacing: "-0.5px",
        boxShadow: "0 2px 8px rgba(15,23,42,0.2)",
      }}
    >
      {mentor.profilePhotoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mentor.profilePhotoUrl}
          alt={mentor.fullName}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          draggable={false}
        />
      ) : (
        initials(mentor.fullName)
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   BOTTOM SHEET
═══════════════════════════════════════════ */
interface BottomSheetProps {
  rank: (typeof RANKS)[number];
  rankIndex: number;
  mentors: Mentor[];
  loading: boolean;
  selected: Mentor | undefined;
  disabledIds: Set<string>;
  onSelect: (mentor: Mentor | null) => void;
  onClose: () => void;
}

function BottomSheet({
  rank,
  rankIndex,
  mentors,
  loading,
  selected,
  disabledIds,
  onSelect,
  onClose,
}: BottomSheetProps) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const filtered = mentors;

  return (
    <>
      <div className="mpd-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        className="mpd-bottom-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={`Select ${rank.label}`}
      >
        {/* Drag handle */}
        <div className="mpd-sheet-handle" aria-hidden="true" />

        {/* Coloured header strip */}
        <div
          className="mpd-sheet-header"
          style={{ borderBottom: `3px solid ${rank.color}` }}
        >
          <span
            className="mpd-sheet-rank-chip"
            style={{ background: rank.color }}
          >
            {rank.icon} {rank.label}
          </span>
          <button
            className="mpd-sheet-close"
            onClick={onClose}
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M1 1l12 12M13 1L1 13"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* List */}
        <div className="mpd-list">
          {loading &&
            [0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="mpd-list-skeleton"
                aria-hidden="true"
              />
            ))}

          {!loading && filtered.length === 0 && (
            <div className="mpd-empty">
              <div className="mpd-empty-icon">🔍</div>
              <p>No mentors available</p>
            </div>
          )}

          {!loading &&
            filtered.map((mentor) => {
              const isFull = mentor.allocatedCount >= mentor.capacity;
              const isOtherPick = disabledIds.has(mentor.id);
              const isCurrent = selected?.id === mentor.id;
              const isDisabled = (isOtherPick || isFull) && !isCurrent;
              const idx = mentors.indexOf(mentor);

              return (
                <button
                  key={mentor.id}
                  className={[
                    "mpd-option",
                    isCurrent ? "mpd-option-active" : "",
                    isDisabled ? "mpd-option-dim" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => {
                    if (isDisabled) return;
                    onSelect(isCurrent ? null : mentor);
                    onClose();
                  }}
                  style={
                    isCurrent
                      ? ({
                          "--opt-accent": rank.color,
                          "--opt-bg": rank.bg,
                        } as React.CSSProperties)
                      : undefined
                  }
                >
                  {/* Index badge over avatar */}
                  <span className="mpd-opt-avatar-wrap">
                    <MentorAvatar mentor={mentor} index={idx} size={46} />
                    <span className="mpd-opt-idx">{idx + 1}</span>
                  </span>

                  <span className="mpd-opt-info">
                    <span className="mpd-opt-name">{mentor.fullName}</span>
                    <span className="mpd-opt-meta">
                      {mentor.batch && (
                        <span className="mpd-opt-batch">{mentor.batch}</span>
                      )}
                      {isFull && (
                        <span className="mpd-tag mpd-tag-full">Full</span>
                      )}
                      {isOtherPick && !isCurrent && (
                        <span className="mpd-tag mpd-tag-taken">Taken</span>
                      )}
                    </span>
                  </span>

                  {isCurrent && (
                    <span
                      className="mpd-opt-check"
                      style={{ color: rank.color }}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                      >
                        <circle cx="10" cy="10" r="9" fill={rank.color} />
                        <path
                          d="M6 10l3 3 5-5"
                          stroke="#fff"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  )}
                </button>
              );
            })}
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════
   PICKER CARD (closed state)
═══════════════════════════════════════════ */
interface PickerCardProps {
  rank: (typeof RANKS)[number];
  rankIndex: number;
  selected: Mentor | undefined;
  mentors: Mentor[];
  loading: boolean;
  onOpen: () => void;
}

function PickerCard({
  rank,
  rankIndex,
  selected,
  mentors,
  loading,
  onOpen,
}: PickerCardProps) {
  const idx = selected ? mentors.indexOf(selected) : -1;
  const filled = !!selected;

  return (
    <button
      className={`mpd-card${filled ? " mpd-card-filled" : ""}`}
      style={
        {
          "--card-color": rank.color,
          "--card-bg": rank.bg,
          "--card-border": rank.border,
          "--card-glow": rank.glow,
        } as React.CSSProperties
      }
      onClick={onOpen}
      disabled={loading}
      aria-haspopup="dialog"
      aria-label={`${rank.label}: ${filled ? selected!.fullName : "not selected"}`}
    >
      {/* Left: rank badge */}
      <span
        className="mpd-card-rank"
        style={{ background: rank.color }}
      >
        {rankIndex + 1}
      </span>

      {/* Centre: avatar + info */}
      <span className="mpd-card-body">
        {filled ? (
          <MentorAvatar mentor={selected!} index={idx} size={44} />
        ) : (
          <span className="mpd-card-empty-avatar" aria-hidden="true">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </span>
        )}

        <span className="mpd-card-text">
          {filled ? (
            <>
              <span
                className="mpd-card-name"
                style={{ color: "var(--gray-900)" }}
              >
                {selected!.fullName}
              </span>
              <span className="mpd-card-sub" style={{ color: rank.color }}>
                {selected!.batch ?? rank.label}
              </span>
            </>
          ) : (
            <>
              <span className="mpd-card-name mpd-card-placeholder">
                {loading ? "Loading…" : "Tap to choose"}
              </span>
              <span className="mpd-card-sub" style={{ color: rank.color }}>
                {rank.label}
              </span>
            </>
          )}
        </span>
      </span>

      {/* Right: chevron */}
      <span className="mpd-card-chevron" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path
            d="M5 7l4 4 4-4"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </button>
  );
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════ */
const SLOT_LABELS = [
  "⭐ 1st Priority",
  "🥈 2nd Priority",
  "🥉 3rd Priority",
] as const;

export function MobilePrefsScreen() {
  const router = useRouter();
  const { showToast } = useToast();

  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [picks, setPicks] = useState<(string | null)[]>([null, null, null]);
  const [openSheet, setOpenSheet] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getJson<{ mentors: Mentor[] }>("/api/mentors")
      .then((d) => setMentors(d.mentors))
      .catch((e: unknown) =>
        showToast(e instanceof Error ? e.message : "Unable to load mentors.")
      )
      .finally(() => setLoading(false));
  }, [showToast]);

  const byId = (id: string | null) =>
    id ? mentors.find((m) => m.id === id) : undefined;

  const setPick = (rankIdx: number, mentor: Mentor | null) =>
    setPicks((prev) => {
      const next = [...prev];
      next[rankIdx] = mentor?.id ?? null;
      return next;
    });

  const allPicked = picks.every(Boolean);
  const pickedCount = picks.filter(Boolean).length;

  const submit = async () => {
    const menteeId = getMenteeId();
    if (!menteeId)
      return showToast("Register as a mentee before selecting mentors.");
    if (!allPicked) return;
    setSubmitting(true);
    try {
      const res = await postJson<{
        submittedAt: string;
        preferences: { mentorName?: string }[];
      }>("/api/preferences", { menteeId, mentorIds: picks as string[] });
      void res; // response consumed by dashboard
      showToast("Preferences submitted ✓");
      sessionStorage.setItem("prefs-just-submitted", "1");
      router.push("/mentee/dashboard");
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : "Could not submit preferences."
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Active selection ── */
  return (
    <>
      <div className="mpd-layout">
        {/* ── Zone 2: hero + picker cards ── */}
        <div className="mpd-zone2">
          {/* Mini header */}
          <div className="mpd-hero">
            <p className="mpd-hero-title">Choose Your Mentors</p>
            <p className="mpd-hero-sub">
              Rank 3 mentors in order of preference
            </p>
          </div>

          {/* 3 picker cards */}
          <div className="mpd-cards">
            {[0, 1, 2].map((ri) => (
              <PickerCard
                key={ri}
                rank={RANKS[ri]}
                rankIndex={ri}
                selected={byId(picks[ri])}
                mentors={mentors}
                loading={loading}
                onOpen={() => setOpenSheet(ri)}
              />
            ))}
          </div>
        </div>

        {/* ── Zone 3: action bar ── */}
        <div className="mpd-zone3">
          {/* Progress bar */}
          <div className="mpd-prog-bar-wrap">
            <div className="mpd-prog-bar-track">
              <div
                className="mpd-prog-bar-fill"
                style={{ width: `${(pickedCount / 3) * 100}%` }}
              />
            </div>
            <span className="mpd-prog-label">
              {pickedCount === 3
                ? "Ready to submit"
                : `${pickedCount} of 3 selected`}
            </span>
          </div>

          {/* Buttons */}
          <div className="mpd-act-row">
            <button
              className="mpd-btn-clear"
              onClick={() => setPicks([null, null, null])}
              disabled={pickedCount === 0}
            >
              Clear
            </button>
            <button
              className="mpd-btn-submit"
              disabled={!allPicked || submitting}
              onClick={submit}
            >
              {submitting ? (
                <span className="mpd-btn-spinner" />
              ) : (
                <>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                  >
                    <path
                      d="M2 8h10M8 4l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Confirm &amp; Submit
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom sheet portal */}
      {openSheet !== null && (
        <BottomSheet
          rank={RANKS[openSheet]}
          rankIndex={openSheet}
          mentors={mentors}
          loading={loading}
          selected={byId(picks[openSheet])}
          disabledIds={
            new Set(
              picks
                .filter((_, i) => i !== openSheet)
                .filter(Boolean) as string[]
            )
          }
          onSelect={(m) => setPick(openSheet, m)}
          onClose={() => setOpenSheet(null)}
        />
      )}
    </>
  );
}
