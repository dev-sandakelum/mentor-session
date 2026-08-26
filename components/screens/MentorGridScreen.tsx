"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getJson } from "@/lib/client-api";
import { useToast } from "../ToastProvider";
import { MentorCard } from "../ui/MentorCard";
import { Pill } from "../ui/Pill";

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

export function MentorGridScreen() {
  const { showToast } = useToast();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    getJson<{ mentors: Mentor[] }>("/api/mentors")
      .then((payload) => setMentors(payload.mentors))
      .catch((error: unknown) => showToast(error instanceof Error ? error.message : "Unable to load mentors."))
      .finally(() => setLoading(false));
  }, [showToast]);

  /** Directory numbers follow list order and stay stable while filtering. */
  const numbered = useMemo(
    () =>
      mentors.map((mentor, index) => ({
        ...mentor,
        number: index + 1,
        isFull: mentor.allocatedCount >= mentor.capacity,
      })),
    [mentors],
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return numbered;
    return numbered.filter((mentor) =>
      [
        String(mentor.number),
        mentor.fullName,
        mentor.batch ?? "",
        ...mentor.academicInterests,
        ...mentor.technicalInterests,
      ]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [numbered, query]);

  const openCount = numbered.filter((mentor) => !mentor.isFull).length;

  return (
    <div className="container">
      <h2 className="section-title">Senior Mentor Directory</h2>
      <p className="section-sub">
        Every mentor has a number. Note the numbers you like — you&apos;ll pick your top 3 by number.
      </p>

      <div className="dir-bar">
        <div className="dir-search">
          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <input
            type="search"
            aria-label="Search mentors by number, name or interest"
            placeholder="Search by number, name or interest…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="dir-meta">
          <Pill variant="indigo">{numbered.length} mentors</Pill>
          <Pill variant="green" dot>
            {openCount} open
          </Pill>
        </div>
      </div>

      <div className="form-note" style={{ marginBottom: 24 }}>
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
            <b>Sign in as a mentee</b>
          </Link>{" "}
          to pick your top&nbsp;3 choices. Mentor profiles are managed by administrators.
        </span>
      </div>

      {loading && <p className="muted">Loading mentors…</p>}
      {!loading && numbered.length === 0 && (
        <p className="muted">No mentors have been added yet. Check back soon.</p>
      )}
      {!loading && numbered.length > 0 && filtered.length === 0 && (
        <p className="muted">No mentors match &ldquo;{query}&rdquo;.</p>
      )}

      <div className="mentor-grid">
        {filtered.map((mentor) => (
          <MentorCard
            key={mentor.id}
            id={mentor.id}
            fullName={mentor.fullName}
            batch={mentor.batch}
            academicInterests={mentor.academicInterests}
            technicalInterests={mentor.technicalInterests}
            profilePhotoUrl={mentor.profilePhotoUrl}
            index={mentor.number - 1}
            number={mentor.number}
            isFull={mentor.isFull}
          />
        ))}
      </div>
    </div>
  );
}
