"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getJson } from "@/lib/client-api";
import { useToast } from "../ToastProvider";

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

const GRADIENTS = [
  "linear-gradient(135deg,#6366f1,#312e81)",
  "linear-gradient(135deg,#0ea5e9,#1d4ed8)",
  "linear-gradient(135deg,#f472b6,#9d174d)",
  "linear-gradient(135deg,#22c55e,#166534)",
  "linear-gradient(135deg,#f59e0b,#b45309)",
  "linear-gradient(135deg,#a855f7,#6b21a8)",
];

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("");
}

export function MentorGridScreen() {
  const { showToast } = useToast();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getJson<{ mentors: Mentor[] }>("/api/mentors")
      .then((payload) => setMentors(payload.mentors))
      .catch((error: unknown) =>
        showToast(error instanceof Error ? error.message : "Unable to load mentors."),
      )
      .finally(() => setLoading(false));
  }, [showToast]);

  return (
    <div className="container">
      <h2 className="section-title">Senior Mentor Directory</h2>
      <p className="section-sub">
        Browse mentors for this session. Mentees can register and submit
        their top&nbsp;3 preferences from this pool.
      </p>

      <div className="form-note" style={{ marginBottom: 28 }}>
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
        <span>
          Want to request a mentor?{" "}
          <Link href="/mentee">
            <b>Register as a mentee</b>
          </Link>{" "}
          to pick your top&nbsp;3 choices. Mentor profiles are managed by administrators.
        </span>
      </div>

      <div className="mentor-grid">
        {loading && <p className="muted">Loading mentors…</p>}
        {!loading && mentors.length === 0 && (
          <p className="muted">No mentors have been added yet. Check back soon.</p>
        )}

        {mentors.map((mentor, index) => {
          const isFull = mentor.allocatedCount >= mentor.capacity;

          return (
            <div
              key={mentor.id}
              className={`mentor-card${isFull ? " full" : ""}`}
              style={{ cursor: "default" }}
            >
              {/* ── Photo / avatar area ── */}
              <div className="card-photo">
                {mentor.profilePhotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mentor.profilePhotoUrl} alt={`${mentor.fullName} profile photo`} />
                ) : (
                  <div
                    className="card-photo-fallback"
                    style={{ background: GRADIENTS[index % GRADIENTS.length] }}
                    aria-hidden="true"
                  >
                    {initials(mentor.fullName)}
                  </div>
                )}
                {/* Mentor index — 1-based, always visible */}
                <div className="card-index" aria-label={`Mentor number ${index + 1}`}>
                  {index + 1}
                </div>
                {isFull && <div className="card-full-overlay">Full</div>}
              </div>

              {/* ── Info area ── */}
              <div className="card-info">
                <h4 className="card-mentor-name">{mentor.fullName}</h4>
                <div className="card-batch">{mentor.batch ?? "—"}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
