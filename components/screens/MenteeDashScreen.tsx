"use client";

import { useEffect, useState } from "react";
import { postJson } from "@/lib/client-api";
import { useToast } from "../ToastProvider";
import { Pill } from "../ui/Pill";
import { StarRating } from "../ui/StarRating";

type DashboardData = {
  session: { title: string; status: string; event_starts_at: string | null; venue: string | null };
  mentee: { id: string; full_name: string; batch: string; academic_interests: string[]; technical_interests: string[] };
  allocation: null | {
    method: string; matched_priority: number | null;
    mentor: { full_name: string; batch: string; email: string; phone: string; communication_method: string; academic_interests: string[]; technical_interests: string[] };
    group: { id: string; full_name: string; batch: string; academic_interests: string[]; technical_interests: string[] }[];
  };
};

function interests(person: { academic_interests: string[]; technical_interests: string[] }) {
  return [...person.academic_interests, ...person.technical_interests].join(", ") || "No interests listed";
}

export function MenteeDashScreen() {
  const { showToast } = useToast();
  const [data, setData] = useState<DashboardData>();
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const menteeId = window.localStorage.getItem("mentor-session-mentee-id");
    if (!menteeId) { queueMicrotask(() => setLoading(false)); return; }
    fetch(`/api/dashboard/mentee?menteeId=${encodeURIComponent(menteeId)}`)
      .then(async (response) => {
        const payload: unknown = await response.json();
        if (!response.ok) throw new Error(typeof payload === "object" && payload && "error" in payload && typeof payload.error === "string" ? payload.error : "Unable to load your dashboard.");
        return payload as DashboardData;
      })
      .then(setData)
      .catch((error: unknown) => showToast(error instanceof Error ? error.message : "Unable to load your dashboard."))
      .finally(() => setLoading(false));
  }, [showToast]);

  const submitFeedback = async () => {
    if (!data) return;
    if (!rating) return showToast("Please choose a star rating first.");
    setSending(true);
    try {
      await postJson("/api/feedback", { participantType: "mentee", participantId: data.mentee.id, rating, comment });
      showToast("Thank you! Feedback submitted ✓");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Feedback could not be submitted.");
    } finally { setSending(false); }
  };

  if (loading) return <div className="container"><p className="muted">Loading your dashboard…</p></div>;
  if (!data) return <div className="container"><h2 className="section-title">Mentee Dashboard</h2><div className="form-note">Register as a mentee first to view your dashboard.</div></div>;
  const { session, mentee, allocation } = data;

  return <div className="container">
    <h2 className="section-title">Welcome back, {mentee.full_name.split(" ")[0]} 👋</h2>
    <p className="section-sub">{session.title} · <Pill variant="indigo" dot>{session.status.toUpperCase()}</Pill></p>
    {!allocation ? <div className="card"><h3 className="card-title">Allocation pending</h3><p className="muted">Your registration is saved. Your mentor will appear here after the administrator publishes allocations.</p></div> :
      <div className="dash-grid"><div>
        <div className="assign-hero"><span className="label">Your Mentor</span><h2>{allocation.mentor.full_name}</h2><div className="sub">{allocation.mentor.batch} · {interests(allocation.mentor)}</div>
          <span className="star-pill">Assignment: {allocation.matched_priority ? `${allocation.matched_priority}${allocation.matched_priority === 1 ? "st" : allocation.matched_priority === 2 ? "nd" : "rd"} Choice` : "Fallback"}</span>
        </div>
        <div className="card" style={{ marginTop: 20 }}><h3 className="card-title">Mentor Contact</h3>
          <div className="info-row"><div><b>Email</b>{allocation.mentor.email}</div></div>
          <div className="info-row"><div><b>{allocation.mentor.communication_method} (preferred)</b>{allocation.mentor.phone}</div></div>
        </div>
        <div className="card" style={{ marginTop: 20 }}><h3 className="card-title">Your Mentor Group</h3>
          {allocation.group.length === 0 ? <p className="muted">You are currently the only assigned mentee.</p> : allocation.group.map((member) => <div className="mentee-item" key={member.id}><div className="avatar" aria-hidden="true">{member.full_name.split(" ").map((word) => word[0]).slice(0, 2).join("")}</div><div><h4>{member.full_name} <Pill variant="gray" className="ml-1.5">Other mentee</Pill></h4><div className="meta">{member.batch} · Interests: {interests(member)}</div></div></div>)}
        </div>
      </div><div>
        <div className="card"><h3 className="card-title">Session Details</h3>
          <div className="info-row"><div><b>Date &amp; Time</b>{session.event_starts_at ? new Date(session.event_starts_at).toLocaleString() : "To be announced"}</div></div>
          <div className="info-row"><div><b>Venue</b>{session.venue ?? "To be announced"}</div></div>
        </div>
        <div className="card" style={{ marginTop: 20 }}><h3 className="card-title">Session Feedback</h3><StarRating label="How useful was the Mentor Session?" value={rating} onChange={setRating} />
          <label htmlFor="mentee-feedback-comment">Comments &amp; suggestions</label><textarea id="mentee-feedback-comment" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="How helpful was your mentor?" />
          <button className="btn btn-primary btn-sm" disabled={sending} style={{ marginTop: 12 }} onClick={submitFeedback}>{sending ? "Submitting…" : "Submit Feedback"}</button>
        </div>
      </div></div>}
  </div>;
}
