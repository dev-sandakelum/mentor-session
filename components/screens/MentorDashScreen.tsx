"use client";

import { useToast } from "../ToastProvider";
import { Pill } from "../ui/Pill";
import { StarRating } from "../ui/StarRating";

export function MentorDashScreen() {
  const { showToast } = useToast();

  return (
    <div className="container">
      <h2 className="section-title">Mentor Dashboard</h2>
      <p className="section-sub">
        Mentor Session 2026 ·{" "}
        <Pill variant="indigo" dot>Published</Pill>
      </p>

      <div className="dash-grid">
        <div>
          <div className="card">
            <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ width: 64, height: 64, borderRadius: 18, background: "linear-gradient(135deg,var(--indigo-light),var(--indigo-dark))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 22 }} aria-hidden="true">
                TJ
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <h3 style={{ fontSize: 18 }}>
                  Tharindu Jayasooriya{" "}
                  <Pill variant="green" className="ml-1.5">Approved</Pill>
                </h3>
                <div className="muted" style={{ fontSize: 13.5 }}>9th Batch · BICT · TG/2022/0456</div>
                <div className="tags" style={{ marginTop: 8, marginBottom: 0 }}>
                  {["Web Development", "Cloud Computing", "DevOps", "Career Guidance"].map((t) => (
                    <span key={t} className="tag">{t}</span>
                  ))}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, color: "var(--gray-500)", fontWeight: 600 }}>Capacity</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "var(--green)" }}>2 / 2</div>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 20 }}>
            <h3 className="card-title">
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="var(--indigo-light)" strokeWidth="2" aria-hidden="true">
                <circle cx="9" cy="8" r="3.5" /><path d="M2 20v-.5a7 7 0 0 1 14 0v.5" />
                <circle cx="17.5" cy="9" r="2.5" /><path d="M16 20v-.3a5.5 5.5 0 0 1 6-5.4" />
              </svg>
              My Mentees
            </h3>
            <div className="mentee-item">
              <div className="avatar" style={{ background: "linear-gradient(135deg,#f472b6,#a855f7)" }} aria-hidden="true">KW</div>
              <div style={{ flex: 1 }}>
                <h4>1. Kavindi Wickramasinghe</h4>
                <div className="meta">Batch: 10th (Junior) · BICT · Interests: Web Development</div>
              </div>
              <Pill variant="amber">⭐ 1st Choice</Pill>
            </div>
            <div className="mentee-item">
              <div className="avatar" style={{ background: "linear-gradient(135deg,#0ea5e9,#6366f1)" }} aria-hidden="true">SD</div>
              <div style={{ flex: 1 }}>
                <h4>2. Sahan Dissanayake</h4>
                <div className="meta">Batch: 10th (Junior) · BICT · Interests: AI, Mobile Development</div>
              </div>
              <Pill variant="indigo">2nd Choice</Pill>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => showToast("Opening WhatsApp group chat… (mock)")}>
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.8-.9L3 21l2-4.9a8.4 8.4 0 1 1 16-4.6z" />
              </svg>
              Message my mentee group
            </button>
          </div>
        </div>

        <div>
          <div className="card">
            <h3 className="card-title">
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="var(--indigo-light)" strokeWidth="2" aria-hidden="true">
                <rect x="3" y="4" width="18" height="17" rx="2" /><path d="M8 2v4M16 2v4M3 10h18" />
              </svg>
              Session Details
            </h3>
            <div className="info-row">
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="3" y="4" width="18" height="17" rx="2" /><path d="M8 2v4M16 2v4M3 10h18" />
              </svg>
              <div><b>Date &amp; Time</b>Saturday, 5 September 2026 · 9:00 AM</div>
            </div>
            <div className="info-row">
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" />
              </svg>
              <div><b>Venue</b>Main Auditorium, Faculty of Technology</div>
            </div>
            <div className="info-row">
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
              </svg>
              <div><b>Assigned Group</b>Group 14 · Table C-3</div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 20 }}>
            <h3 className="card-title">
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" aria-hidden="true">
                <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.8-.9L3 21l2-4.9a8.4 8.4 0 1 1 16-4.6z" />
              </svg>
              Mentor Feedback
            </h3>
            <StarRating label="How was your mentoring experience?" />
            <label htmlFor="mentor-feedback-comment">Suggestions for future Mentor Sessions</label>
            <textarea id="mentor-feedback-comment" placeholder="Was communication effective? Would you mentor again?" />
            <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => showToast("Thank you! Feedback submitted ✓")}>
              Submit Feedback
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
