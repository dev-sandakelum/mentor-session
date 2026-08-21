"use client";

import { useEffect, useState } from "react";
import { postJson } from "@/lib/client-api";
import { useToast } from "../ToastProvider";
import { Pill } from "../ui/Pill";
import { StarRating } from "../ui/StarRating";

type DashboardData = {
  session: { title: string; status: string; event_starts_at: string | null; venue: string | null };
  mentor: { id: string; full_name: string; student_id: string; batch: string; approval_status: string; capacity: number; academic_interests: string[]; technical_interests: string[] };
  mentees: { method: string; matched_priority: number | null; mentee?: { id: string; full_name: string; batch: string; academic_interests: string[]; technical_interests: string[] } }[];
};

export function MentorDashScreen() {
  const { showToast } = useToast();
  const [data, setData] = useState<DashboardData>();
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const mentorId = window.localStorage.getItem("mentor-session-mentor-id");
    if (!mentorId) { queueMicrotask(() => setLoading(false)); return; }
    fetch(`/api/dashboard/mentor?mentorId=${encodeURIComponent(mentorId)}`)
      .then(async (response) => { const payload: unknown = await response.json(); if (!response.ok) throw new Error(typeof payload === "object" && payload && "error" in payload && typeof payload.error === "string" ? payload.error : "Unable to load your dashboard."); return payload as DashboardData; })
      .then(setData).catch((error: unknown) => showToast(error instanceof Error ? error.message : "Unable to load your dashboard.")).finally(() => setLoading(false));
  }, [showToast]);

  const submitFeedback = async () => {
    if (!data) return;
    if (!rating) return showToast("Please choose a star rating first.");
    setSending(true);
    try { await postJson("/api/feedback", { participantType: "mentor", participantId: data.mentor.id, rating, comment }); showToast("Thank you! Feedback submitted ✓"); }
    catch (error) { showToast(error instanceof Error ? error.message : "Feedback could not be submitted."); }
    finally { setSending(false); }
  };

  if (loading) return <div className="container"><p className="muted">Loading your dashboard…</p></div>;
  if (!data) return <div className="container"><h2 className="section-title">Mentor Dashboard</h2><div className="form-note">Register as a mentor first to view your dashboard.</div></div>;
  const { mentor, session, mentees } = data;
  const interests = [...mentor.academic_interests, ...mentor.technical_interests];
  return <div className="container"><h2 className="section-title">Mentor Dashboard</h2><p className="section-sub">{session.title} · <Pill variant="indigo" dot>{session.status.toUpperCase()}</Pill></p>
    <div className="dash-grid"><div>
      <div className="card"><div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}><div className="avatar" style={{ width: 64, height: 64, fontSize: 22 }} aria-hidden="true">{mentor.full_name.split(" ").map((word) => word[0]).slice(0, 2).join("")}</div><div style={{ flex: 1 }}><h3>{mentor.full_name} <Pill variant={mentor.approval_status === "approved" ? "green" : "amber"} className="ml-1.5">{mentor.approval_status}</Pill></h3><div className="muted">{mentor.batch} · {mentor.student_id}</div><div className="tags" style={{ marginTop: 8 }}>{interests.map((interest) => <span className="tag" key={interest}>{interest}</span>)}</div></div><div style={{ textAlign: "right" }}><div className="muted">Capacity</div><div style={{ fontSize: 22, fontWeight: 800 }}>{mentees.length} / {mentor.capacity}</div></div></div></div>
      <div className="card" style={{ marginTop: 20 }}><h3 className="card-title">My Mentees</h3>{mentees.length === 0 ? <p className="muted">No mentees have been assigned yet.</p> : mentees.map(({ mentee, matched_priority, method }, index) => mentee && <div className="mentee-item" key={mentee.id}><div className="avatar" aria-hidden="true">{mentee.full_name.split(" ").map((word) => word[0]).slice(0, 2).join("")}</div><div style={{ flex: 1 }}><h4>{index + 1}. {mentee.full_name}</h4><div className="meta">{mentee.batch} · Interests: {[...mentee.academic_interests, ...mentee.technical_interests].join(", ")}</div></div><Pill variant={method === "fallback" ? "gray" : "amber"}>{matched_priority ? `${matched_priority}${matched_priority === 1 ? "st" : matched_priority === 2 ? "nd" : "rd"} Choice` : "Fallback"}</Pill></div>)}</div>
    </div><div><div className="card"><h3 className="card-title">Session Details</h3><div className="info-row"><div><b>Date &amp; Time</b>{session.event_starts_at ? new Date(session.event_starts_at).toLocaleString() : "To be announced"}</div></div><div className="info-row"><div><b>Venue</b>{session.venue ?? "To be announced"}</div></div></div>
      <div className="card" style={{ marginTop: 20 }}><h3 className="card-title">Mentor Feedback</h3><StarRating label="How was your mentoring experience?" value={rating} onChange={setRating} /><label htmlFor="mentor-feedback-comment">Suggestions for future Mentor Sessions</label><textarea id="mentor-feedback-comment" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Was communication effective?" /><button className="btn btn-primary btn-sm" disabled={sending} style={{ marginTop: 12 }} onClick={submitFeedback}>{sending ? "Submitting…" : "Submit Feedback"}</button></div>
    </div></div>
  </div>;
}
