"use client";

import { useEffect, useRef, useState } from "react";
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
  { label: "1st Priority", color: "var(--amber)", bg: "#fef3c7", borderColor: "#f59e0b" },
  { label: "2nd Priority", color: "var(--indigo-light)", bg: "#eef2ff", borderColor: "#6366f1" },
  { label: "3rd Priority", color: "var(--gray-500)", bg: "var(--gray-100)", borderColor: "var(--gray-400)" },
] as const;

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function MentorThumb({ mentor, index, size = 36 }: { mentor: Mentor; index: number; size?: number }) {
  const gradient = GRADIENTS[index % GRADIENTS.length];
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%", overflow: "hidden",
        flexShrink: 0, background: gradient,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.33, fontWeight: 800, color: "rgba(255,255,255,0.95)",
        border: "2px solid rgba(255,255,255,0.8)",
        boxShadow: "0 1px 4px rgba(15,23,42,0.18)",
      }}
    >
      {mentor.profilePhotoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={mentor.profilePhotoUrl} alt={mentor.fullName}
          style={{ width: "100%", height: "100%", objectFit: "cover" }} draggable={false} />
      ) : (
        initials(mentor.fullName)
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Bottom-sheet (fixed overlay, slides up)
───────────────────────────────────────────── */
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
  rank, rankIndex, mentors, loading,
  selected, disabledIds, onSelect, onClose,
}: BottomSheetProps) {
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Lock body scroll while sheet is open
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setTimeout(() => searchRef.current?.focus(), 140);
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Close on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const filtered = search.trim()
    ? mentors.filter((m) => {
        const q = search.toLowerCase();
        return m.fullName.toLowerCase().includes(q) || (m.batch ?? "").toLowerCase().includes(q);
      })
    : mentors;

  return (
    <>
      {/* Backdrop */}
      <div className="mpd-backdrop" onClick={onClose} aria-hidden="true" />

      {/* Sheet */}
      <div className="mpd-bottom-sheet" role="dialog" aria-modal="true" aria-label={`Select ${rank.label}`}>
        {/* Drag handle */}
        <div className="mpd-sheet-handle" aria-hidden="true" />

        {/* Header */}
        <div className="mpd-sheet-header">
          <span className="mpd-sheet-rank-badge" style={{ background: rank.color }}>
            {rankIndex + 1}
          </span>
          <span className="mpd-sheet-title">Choose {rank.label}</span>
          <button className="mpd-sheet-close" onClick={onClose} aria-label="Close picker">✕</button>
        </div>

        {/* Search */}
        <div className="mpd-search-wrap">
          <svg className="mpd-search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.6" />
            <path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <input
            ref={searchRef}
            className="mpd-search"
            type="search"
            placeholder="Search by name or batch…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search mentors"
          />
          {search && (
            <button className="mpd-search-clear" onClick={() => setSearch("")} aria-label="Clear search">✕</button>
          )}
        </div>

        {/* Remove current selection */}
        {selected && (
          <button className="mpd-clear-row" onClick={() => { onSelect(null); onClose(); }}>
            <span className="mpd-clear-x">✕</span>
            <span>Remove current selection</span>
          </button>
        )}

        {/* Mentor list — this is the only thing that scrolls */}
        <div className="mpd-list">
          {loading && (
            <div style={{ padding: "16px" }}>
              {[0,1,2,3,4].map((i) => (
                <div key={i} className="mpd-skeleton" style={{ height: 56, marginBottom: 8 }} aria-hidden="true" />
              ))}
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <p className="mpd-empty">
              {search ? `No mentors match "${search}"` : "No mentors available."}
            </p>
          )}
          {!loading && filtered.map((mentor) => {
            const isFull = mentor.allocatedCount >= mentor.capacity;
            const isOtherPick = disabledIds.has(mentor.id);
            const isCurrentlySelected = selected?.id === mentor.id;
            const isDisabled = (isOtherPick || isFull) && !isCurrentlySelected;
            const mentorIndex = mentors.indexOf(mentor);
            return (
              <button
                key={mentor.id}
                className={[
                  "mpd-option",
                  isCurrentlySelected ? "mpd-option-selected" : "",
                  isDisabled ? "mpd-option-disabled" : "",
                ].filter(Boolean).join(" ")}
                role="option"
                aria-selected={isCurrentlySelected}
                aria-disabled={isDisabled}
                onClick={() => {
                  if (isDisabled) return;
                  onSelect(isCurrentlySelected ? null : mentor);
                  onClose();
                }}
              >
                <MentorThumb mentor={mentor} index={mentorIndex} size={44} />
                <span className="mpd-option-info">
                  <span className="mpd-option-name">{mentor.fullName}</span>
                  <span className="mpd-option-meta">
                    {mentor.batch && <span className="mpd-option-batch">{mentor.batch}</span>}
                    {isFull && <span className="mpd-full-pill">Full</span>}
                    {isOtherPick && !isCurrentlySelected && (
                      <span className="mpd-taken-pill">Taken</span>
                    )}
                  </span>
                </span>
                <span className="mpd-option-num" aria-hidden="true">{mentorIndex + 1}</span>
                {isCurrentlySelected && (
                  <span className="mpd-option-check" aria-hidden="true">✓</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   Closed picker row
───────────────────────────────────────────── */
interface PickerRowProps {
  rank: (typeof RANKS)[number];
  rankIndex: number;
  selected: Mentor | undefined;
  mentors: Mentor[];
  loading: boolean;
  onOpen: () => void;
}

function PickerRow({ rank, rankIndex, selected, mentors, loading, onOpen }: PickerRowProps) {
  const mentorIndex = selected ? mentors.indexOf(selected) : -1;
  const filled = !!selected;

  return (
    <button
      className={`mpd-row${filled ? " mpd-row-filled" : ""}`}
      style={{
        "--rank-color": rank.color,
        "--rank-border": rank.borderColor,
        "--rank-bg": rank.bg,
      } as React.CSSProperties}
      onClick={onOpen}
      disabled={loading}
      aria-haspopup="dialog"
    >
      <span className="mpd-row-badge" style={{ background: rank.color }}>{rankIndex + 1}</span>

      <span className="mpd-row-body">
        {filled ? (
          <MentorThumb mentor={selected!} index={mentorIndex} size={42} />
        ) : (
          <span className="mpd-row-empty-thumb" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </span>
        )}
        <span className="mpd-row-text">
          <span className="mpd-row-name" style={{ color: filled ? "var(--gray-900)" : "var(--gray-400)" }}>
            {filled ? selected!.fullName : (loading ? "Loading mentors…" : "Tap to select a mentor")}
          </span>
          <span className="mpd-row-sub" style={{ color: filled ? rank.color : "var(--gray-400)" }}>
            {filled ? (selected!.batch ?? rank.label) : rank.label}
          </span>
        </span>
      </span>

      <span className="mpd-row-right">
        <svg className="mpd-row-chevron" width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <path d="M5 7l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </button>
  );
}

/* ─────────────────────────────────────────────
   Main export — self-contained, fetches its own data
───────────────────────────────────────────── */
const SLOT_LABELS = ["⭐ 1st Priority", "2nd Priority", "3rd Priority"] as const;

export function MobilePrefsScreen() {
  const { showToast } = useToast();

  // Own data-fetching — not relying on parent passing props
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);

  const [picks, setPicks] = useState<(string | null)[]>([null, null, null]);
  const [openSheet, setOpenSheet] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [lockedNames, setLockedNames] = useState<string[]>([]);
  const [submittedAt, setSubmittedAt] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getJson<{ mentors: Mentor[] }>("/api/mentors")
      .then((payload) => setMentors(payload.mentors))
      .catch((err: unknown) => showToast(err instanceof Error ? err.message : "Unable to load mentors."))
      .finally(() => setLoading(false));
  }, [showToast]);

  const mentorById = (id: string | null) => id ? mentors.find((m) => m.id === id) : undefined;

  const handleSelect = (rankIdx: number, mentor: Mentor | null) => {
    setPicks((prev) => { const next = [...prev]; next[rankIdx] = mentor?.id ?? null; return next; });
  };

  const allPicked = picks.every(Boolean);
  const pickedCount = picks.filter(Boolean).length;

  const submitPrefs = async () => {
    const menteeId = getMenteeId();
    if (!menteeId) return showToast("Register as a mentee before selecting mentors.");
    if (!allPicked) return;
    setSubmitting(true);
    try {
      const result = await postJson<{ submittedAt: string; preferences: { mentorName?: string }[] }>(
        "/api/preferences", { menteeId, mentorIds: picks as string[] }
      );
      setLockedNames(result.preferences.map((p) => p.mentorName ?? "Mentor"));
      setSubmittedAt(result.submittedAt);
      setSubmitted(true);
      showToast("Preferences submitted — FCFS position recorded ✓");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Preferences could not be submitted.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Submitted ── */
  if (submitted) {
    return (
      <div className="mpd-layout">
        <div className="mpd-submitted-zone">
          <div className="submitted-box" style={{ margin: "0 16px", padding: "28px 20px" }}>
            <div className="check">✓</div>
            <h2 className="section-title" style={{ color: "var(--green)", fontSize: "1.3rem" }}>
              Preferences Submitted ✓
            </h2>
            <p className="muted" style={{ fontSize: 13, margin: "6px 0 2px" }}>Submitted:</p>
            <div className="ts" style={{ fontSize: 12 }}>
              {submittedAt ? new Date(submittedAt).toLocaleString() : ""}
            </div>
            <p style={{ fontSize: 13, fontWeight: 600, marginTop: 10 }}>🔒 Preferences locked.</p>
            <p className="muted" style={{ fontSize: 12.5, marginTop: 6 }}>
              Allocation is processed <b>First Come, First Served.</b>
            </p>
          </div>
          <div className="card" style={{ margin: "14px 16px 0" }}>
            <h3 className="card-title">Your locked preferences</h3>
            {lockedNames.map((name, i) => (
              <div key={name} className={`pref-slot filled${i === 0 ? " first" : ""}`}>
                <span className="slot-label">{SLOT_LABELS[i]}</span>
                <div className="slot-name">{name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── Active selection ── */
  return (
    <>
      <div className="mpd-layout">
        {/* Zone 2 — picker rows */}
        <div className="mpd-zone2">
          <p className="mpd-zone2-hint">Pick your top 3 mentors in order of preference.</p>
          <div className="mpd-pickers">
            {[0, 1, 2].map((rankIdx) => (
              <PickerRow
                key={rankIdx}
                rank={RANKS[rankIdx]}
                rankIndex={rankIdx}
                selected={mentorById(picks[rankIdx])}
                mentors={mentors}
                loading={loading}
                onOpen={() => setOpenSheet(rankIdx)}
              />
            ))}
          </div>
        </div>

        {/* Zone 3 — action bar */}
        <div className="mpd-zone3">
          <div className="mpd-progress">
            {[0, 1, 2].map((i) => (
              <div key={i}
                className={`mpd-dot${picks[i] ? " mpd-dot-on" : ""}`}
                style={picks[i] ? ({ "--dc": RANKS[i].color } as React.CSSProperties) : undefined}
              />
            ))}
            <span className="mpd-progress-text">{pickedCount} / 3 selected</span>
          </div>
          <div className="mpd-actions">
            <button className="btn btn-ghost btn-sm"
              onClick={() => setPicks([null, null, null])}
              disabled={pickedCount === 0}>
              Clear all
            </button>
            <button className="btn btn-primary mpd-submit-btn"
              disabled={!allPicked || submitting}
              onClick={submitPrefs}>
              {submitting ? "Submitting…" : "Confirm & Submit"}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom sheet — rendered at root level so z-index is unaffected */}
      {openSheet !== null && (
        <BottomSheet
          rank={RANKS[openSheet]}
          rankIndex={openSheet}
          mentors={mentors}
          loading={loading}
          selected={mentorById(picks[openSheet])}
          disabledIds={new Set(picks.filter((_, i) => i !== openSheet).filter(Boolean) as string[])}
          onSelect={(m) => handleSelect(openSheet, m)}
          onClose={() => setOpenSheet(null)}
        />
      )}
    </>
  );
}
