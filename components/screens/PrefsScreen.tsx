"use client";

import { useEffect, useState } from "react";
import { getJson, postJson } from "@/lib/client-api";
import { useToast } from "../ToastProvider";
import { MentorCard } from "../ui/MentorCard";

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

const SLOT_LABELS = ["⭐ 1st Priority", "2nd Priority", "3rd Priority"] as const;

export function PrefsScreen() {
  const { showToast } = useToast();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [picks, setPicks] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [lockedNames, setLockedNames] = useState<string[]>([]);
  const [submittedAt, setSubmittedAt] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getJson<{ mentors: Mentor[] }>("/api/mentors")
      .then((payload) => setMentors(payload.mentors))
      .catch((error: unknown) => showToast(error instanceof Error ? error.message : "Unable to load mentors."))
      .finally(() => setLoading(false));
  }, [showToast]);

  const mentorById = (id: string) => mentors.find((mentor) => mentor.id === id);

  const toggleMentor = (id: string, isFull: boolean) => {
    const index = picks.indexOf(id);
    if (index > -1) {
      setPicks(picks.filter((pick) => pick !== id));
      return;
    }
    if (isFull) return showToast("This mentor is full and cannot be selected.");
    if (picks.length >= 3) return showToast("You already picked 3 mentors — remove one to change your selection.");
    setPicks([...picks, id]);
  };

  const submitPrefs = async () => {
    const menteeId = window.localStorage.getItem("mentor-session-mentee-id");
    if (!menteeId) return showToast("Register as a mentee before selecting mentors.");
    if (picks.length !== 3) return;
    setSubmitting(true);
    try {
      const result = await postJson<{ submittedAt: string; preferences: { mentorName?: string }[] }>("/api/preferences", { menteeId, mentorIds: picks });
      setLockedNames(result.preferences.map((preference) => preference.mentorName ?? "Mentor"));
      setSubmittedAt(result.submittedAt);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      showToast("Preferences submitted — FCFS position recorded ✓");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Preferences could not be submitted.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="container">
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <div className="submitted-box">
            <div className="check">✓</div>
            <h2 className="section-title" style={{ color: "var(--green)" }}>Preferences Submitted ✓</h2>
            <p className="muted" style={{ fontSize: 14, margin: "6px 0" }}>Submitted:</p>
            <div className="ts">{submittedAt ? new Date(submittedAt).toLocaleString() : ""}</div>
            <p style={{ fontSize: 14, fontWeight: 600, marginTop: 10 }}>🔒 Your preferences are locked.</p>
            <p className="muted" style={{ fontSize: 13.5, marginTop: 6 }}>Allocation will be processed according to <b>First Come, First Served.</b></p>
          </div>
          <div className="card" style={{ marginTop: 18 }}>
            <h3 className="card-title">Your locked preferences</h3>
            {lockedNames.map((name, index) => (
              <div key={name} className={`pref-slot filled${index === 0 ? " first" : ""}`}>
                <span className="slot-label">{SLOT_LABELS[index]}</span><div className="slot-name">{name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h2 className="section-title">Choose your top 3 mentors</h2>
      <p className="section-sub">Your preferences are processed in submission order. Each mentor can accept only their available capacity.</p>
      <div className="pref-layout">
        <div className="mentor-grid">
          {loading && <p className="muted">Loading available mentors…</p>}
          {!loading && mentors.length === 0 && <p className="muted">No approved mentors are available yet.</p>}
          {mentors.map((mentor, index) => {
            const isFull = mentor.allocatedCount >= mentor.capacity;
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
                priority={isSelected ? priorityIndex + 1 : undefined}
                isFull={isFull}
                onClick={() => toggleMentor(mentor.id, isFull)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleMentor(mentor.id, isFull); } }}
              />
            );
          })}
        </div>
        <aside className="pref-summary" aria-label="Your selected preferences"><div className="card"><h3 className="card-title">Your Preferences</h3>
          {SLOT_LABELS.map((label, index) => {
            const picked = picks[index]; const pickedMentor = picked ? mentorById(picked) : undefined;
            return <div key={label} className={`pref-slot${picked ? " filled" : ""}${picked && index === 0 ? " first" : ""}`}>
              {picked && <button className="slot-clear" aria-label={`Remove ${pickedMentor?.fullName ?? "mentor"}`} onClick={() => toggleMentor(picked, false)}>✕ remove</button>}
              <span className="slot-label">{label}</span><div className="slot-name">{pickedMentor?.fullName ?? "Not selected yet"}</div>
            </div>;
          })}
          <p className="hint" style={{ margin: "4px 0 14px" }}>Select three different mentors. Once submitted, these preferences are locked.</p>
          <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} disabled={picks.length !== 3 || submitting} onClick={submitPrefs}>{submitting ? "Submitting…" : "Confirm & Submit"}</button>
          <button className="btn btn-ghost btn-sm" style={{ width: "100%", justifyContent: "center", marginTop: 8 }} onClick={() => setPicks([])}>Clear all</button>
        </div></aside>
      </div>
    </div>
  );
}
