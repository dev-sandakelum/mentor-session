"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getJson, postJson } from "@/lib/client-api";
import { useToast } from "../ToastProvider";
import { MentorCard } from "../ui/MentorCard";
import { MentorPicker, type PickerMentor } from "../ui/MentorPicker";
import { readMenteeSession, type MenteeSession } from "@/lib/mentee-session";

interface Mentor {
  id: string;
  fullName: string;
  batch: string | null;
  academicInterests: string[];
  technicalInterests: string[];
  profilePhotoUrl: string | null;
  capacity: number;
  allocatedCount: number;
}

const SLOT_LABELS = ["1st Priority", "2nd Priority", "3rd Priority"] as const;

export function PrefsScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [picks, setPicks] = useState<(string | null)[]>([null, null, null]);
  const [submitted, setSubmitted] = useState(false);
  const [lockedNames, setLockedNames] = useState<string[]>([]);
  const [submittedAt, setSubmittedAt] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [session, setSession] = useState<MenteeSession | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    setSession(readMenteeSession());
    setSessionChecked(true);
  }, []);

  useEffect(() => {
    getJson<{ mentors: Mentor[] }>("/api/mentors")
      .then((payload) => setMentors(payload.mentors))
      .catch((error: unknown) => showToast(error instanceof Error ? error.message : "Unable to load mentors."))
      .finally(() => setLoading(false));
  }, [showToast]);

  /** Stable directory numbers, assigned by the order mentors are listed. */
  const numbered = useMemo(
    () =>
      mentors.map((mentor, index) => ({
        ...mentor,
        number: index + 1,
        isFull: mentor.allocatedCount >= mentor.capacity,
      })),
    [mentors],
  );

  const pickerMentors: PickerMentor[] = useMemo(
    () =>
      numbered.map((mentor) => ({
        id: mentor.id,
        number: mentor.number,
        fullName: mentor.fullName,
        batch: mentor.batch,
        profilePhotoUrl: mentor.profilePhotoUrl,
        isFull: mentor.isFull,
      })),
    [numbered],
  );

  const chosen = picks.filter((pick): pick is string => !!pick);
  const complete = chosen.length === 3;
  const mentorById = (id: string) => numbered.find((mentor) => mentor.id === id);

  /** Grid interaction: fill the first empty slot, or clear if already picked. */
  const toggleMentor = (id: string, isFull: boolean) => {
    const existing = picks.indexOf(id);
    if (existing > -1) {
      setPicks(picks.map((pick, index) => (index === existing ? null : pick)));
      return;
    }
    if (isFull) return showToast("This mentor is full and cannot be selected.");
    const empty = picks.indexOf(null);
    if (empty === -1) return showToast("You already picked 3 mentors — remove one to change your selection.");
    setPicks(picks.map((pick, index) => (index === empty ? id : pick)));
  };

  const setSlot = (slot: number, mentorId: string | null) => {
    setPicks(picks.map((pick, index) => (index === slot ? mentorId : pick)));
  };

  const submitPrefs = async () => {
    if (!session) return showToast("Sign in as a mentee before selecting mentors.");
    if (!complete) return;

    setSubmitting(true);
    try {
      const result = await postJson<{ submittedAt: string; preferences: { mentorName?: string }[] }>(
        "/api/preferences",
        { menteeId: session.id, mentorIds: chosen },
      );
      setLockedNames(result.preferences.map((preference) => preference.mentorName ?? "Mentor"));
      setSubmittedAt(result.submittedAt);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      showToast("Preferences submitted — FCFS position recorded.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Preferences could not be submitted.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Not signed in ─────────────────────────────────────────────────────────
  if (sessionChecked && !session) {
    return (
      <div className="container narrow">
        <h2 className="section-title">Choose your top 3 mentors</h2>
        <p className="section-sub">Sign in first so your preferences can be recorded against your TG number.</p>
        <div className="card">
          <div className="form-note" style={{ marginBottom: 16 }}>
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
            <span>You need your name, phone number and TG number. It only takes a moment.</span>
          </div>
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

  // ── Locked confirmation ───────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="container narrow">
        <div className="submitted-box">
          <div className="check">✓</div>
          <h2 className="section-title" style={{ color: "var(--green)" }}>
            Preferences Submitted
          </h2>
          <p className="muted" style={{ fontSize: 14, margin: "6px 0" }}>
            Submitted:
          </p>
          <div className="ts">{submittedAt ? new Date(submittedAt).toLocaleString() : ""}</div>
          <p style={{ fontSize: 14, fontWeight: 600, marginTop: 10 }}>Your preferences are locked.</p>
          <p className="muted" style={{ fontSize: 13.5, marginTop: 6 }}>
            Allocation will be processed according to <b>First Come, First Served.</b>
          </p>
        </div>

        <div className="card" style={{ marginTop: 18 }}>
          <h3 className="card-title">Your locked preferences</h3>
          {lockedNames.map((name, index) => (
            <div key={name} className={`pref-slot filled${index === 0 ? " first" : ""}`}>
              <span className="slot-label">{SLOT_LABELS[index]}</span>
              <div className="slot-name">{name}</div>
            </div>
          ))}
          <button
            className="btn btn-outline"
            type="button"
            style={{ marginTop: 14, width: "100%", justifyContent: "center" }}
            onClick={() => router.push("/mentee/dashboard")}
          >
            Go to my dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Selection ─────────────────────────────────────────────────────────────
  return (
    <div className="container">
      <h2 className="section-title">Choose your top 3 mentors</h2>
      <p className="section-sub">
        Preferences are processed in submission order. Each mentor is listed with a number — use it to find them quickly.
      </p>

      {/* ── Mobile: three dropdowns ── */}
      <div className="pref-mobile">
        <div className="card">
          <h3 className="card-title">Your three picks</h3>
          {loading && <p className="muted">Loading mentors…</p>}
          {!loading && numbered.length === 0 && <p className="muted">No mentors are available yet.</p>}

          {!loading && numbered.length > 0 && (
            <div className="mp-stack">
              {SLOT_LABELS.map((label, slot) => (
                <MentorPicker
                  key={label}
                  label={label}
                  slot={slot + 1}
                  mentors={pickerMentors}
                  value={picks[slot]}
                  takenIds={picks.filter((pick, index): pick is string => !!pick && index !== slot)}
                  onChange={(mentorId) => setSlot(slot, mentorId)}
                />
              ))}

              <p className="hint" style={{ margin: "2px 0 0" }}>
                {complete ? "All three slots filled — you're ready to submit." : `${chosen.length} of 3 selected.`}
              </p>

              <button
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center" }}
                disabled={!complete || submitting}
                onClick={() => void submitPrefs()}
              >
                {submitting ? "Submitting…" : "Confirm & Submit"}
              </button>
              <button
                className="btn btn-ghost btn-sm"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={() => setPicks([null, null, null])}
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Desktop: card grid + sticky summary ── */}
      <div className="pref-layout pref-desktop">
        <div className="mentor-grid">
          {loading && <p className="muted">Loading available mentors…</p>}
          {!loading && numbered.length === 0 && <p className="muted">No approved mentors are available yet.</p>}

          {numbered.map((mentor, index) => {
            const priorityIndex = picks.indexOf(mentor.id);
            const isSelected = priorityIndex > -1;
            return (
              <MentorCard
                key={mentor.id}
                id={mentor.id}
                fullName={mentor.fullName}
                batch={mentor.batch}
                academicInterests={mentor.academicInterests}
                technicalInterests={mentor.technicalInterests}
                profilePhotoUrl={mentor.profilePhotoUrl}
                index={index}
                number={mentor.number}
                priority={isSelected ? priorityIndex + 1 : undefined}
                isFull={mentor.isFull}
                onClick={() => toggleMentor(mentor.id, mentor.isFull)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    toggleMentor(mentor.id, mentor.isFull);
                  }
                }}
              />
            );
          })}
        </div>

        <aside className="pref-summary" aria-label="Your selected preferences">
          <div className="card">
            <h3 className="card-title">Your Preferences</h3>
            {SLOT_LABELS.map((label, index) => {
              const picked = picks[index];
              const pickedMentor = picked ? mentorById(picked) : undefined;
              return (
                <div
                  key={label}
                  className={`pref-slot${picked ? " filled" : ""}${picked && index === 0 ? " first" : ""}`}
                >
                  {picked && (
                    <button
                      className="slot-clear"
                      aria-label={`Remove ${pickedMentor?.fullName ?? "mentor"}`}
                      onClick={() => setSlot(index, null)}
                    >
                      ✕ remove
                    </button>
                  )}
                  <span className="slot-label">{label}</span>
                  <div className="slot-name">
                    {pickedMentor ? `#${pickedMentor.number} · ${pickedMentor.fullName}` : "Not selected yet"}
                  </div>
                </div>
              );
            })}
            <p className="hint" style={{ margin: "4px 0 14px" }}>
              Select three different mentors. Once submitted, these preferences are locked.
            </p>
            <button
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
              disabled={!complete || submitting}
              onClick={() => void submitPrefs()}
            >
              {submitting ? "Submitting…" : "Confirm & Submit"}
            </button>
            <button
              className="btn btn-ghost btn-sm"
              style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
              onClick={() => setPicks([null, null, null])}
            >
              Clear all
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
