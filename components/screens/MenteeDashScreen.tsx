"use client";

import { useToast } from "../ToastProvider";
import { Pill } from "../ui/Pill";
import { StarRating } from "../ui/StarRating";

export function MenteeDashScreen() {
  const { showToast } = useToast();

  return (
    <div className="container">
      <h2 className="section-title">Welcome back, Kavindi 👋</h2>
      <p className="section-sub">
        Mentor Session 2026 ·{" "}
        <Pill variant="indigo" dot>Published</Pill>
      </p>

      <div className="dash-grid">
        <div>
          <div className="assign-hero">
            <span className="label">Your Mentor</span>
            <h2>Tharindu Jayasooriya</h2>
            <div className="sub">9th Batch · BICT · Web Development, Cloud Computing</div>
            <span className="star-pill">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
                <path d="M12 2l2.9 6.3 6.6.7-4.9 4.5 1.3 6.5L12 16.9 6.1 20l1.3-6.5L2.5 9l6.6-.7z" />
              </svg>
              Assignment: 1st Choice
            </span>
          </div>

          <div className="card" style={{ marginTop: 20 }}>
            <h3 className="card-title">
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="var(--indigo-light)" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="8" r="4" /><path d="M4 21v-1a7 7 0 0 1 14 0v1" />
              </svg>
              Mentor Contact
            </h3>
            <div className="info-row">
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" />
              </svg>
              <div><b>Email</b>tharindu.j@fot.ruh.ac.lk</div>
            </div>
            <div className="info-row">
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.6 2z" />
              </svg>
              <div><b>WhatsApp (preferred)</b>071 234 5678</div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 20 }}>
            <h3 className="card-title">
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="var(--indigo-light)" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="8" r="4" /><path d="M4 21v-1a7 7 0 0 1 14 0v1" />
              </svg>
              Your Mentor Group
            </h3>
            <div className="mentee-item">
              <div className="avatar" style={{ background: "linear-gradient(135deg,#0ea5e9,#6366f1)" }} aria-hidden="true">SD</div>
              <div>
                <h4>Sahan Dissanayake <Pill variant="gray" className="ml-1.5">Other mentee</Pill></h4>
                <div className="meta">10th Batch · BICT · Interests: Mobile Development</div>
              </div>
            </div>
            <p className="hint">You share your mentor group with one other mentee. Say hi at the first session!</p>
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
              <div><b>Group</b>Group 14 · Table C-3</div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 20 }}>
            <h3 className="card-title">
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" aria-hidden="true">
                <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.8-.9L3 21l2-4.9a8.4 8.4 0 1 1 16-4.6z" />
              </svg>
              Session Feedback
            </h3>
            <StarRating label="How useful was the Mentor Session?" />
            <label htmlFor="mentee-feedback-comment">Comments &amp; suggestions</label>
            <textarea id="mentee-feedback-comment" placeholder="How helpful was your mentor? Would you participate again?" />
            <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => showToast("Thank you! Feedback submitted ✓")}>
              Submit Feedback
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
