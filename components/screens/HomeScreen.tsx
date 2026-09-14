"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getMenteeId } from "@/lib/mentee-session";
import { LifecycleStepper } from "../ui/LifecycleStepper";
import type { LifecycleStep } from "../ui/LifecycleStepper";

const LIFECYCLE_STEPS: LifecycleStep[] = [
  { label: "Create Session",      status: "done",    sub: "Session configured"           },
  { label: "Configure Batches",   status: "done",    sub: "Mentor pool ready"             },
  { label: "Open Registration",   status: "done",    sub: "Mentors & mentees registered"  },
  { label: "Collect Preferences", status: "current", number: 4, sub: "In progress now"   },
  { label: "FCFS Allocation",     status: "pending", number: 5, sub: "Automated matching" },
  { label: "Random Fallback",     status: "pending", number: 6, sub: "Fill remaining spots"},
  { label: "Publish Results",     status: "pending", number: 7, sub: "Notify participants" },
  { label: "Session & Feedback",  status: "pending", number: 8, sub: "Event + survey"     },
];

export function HomeScreen() {
  const [ctaHref, setCtaHref] = useState("/mentee");
  const [ctaLabel, setCtaLabel] = useState("Register as Mentee");

  useEffect(() => {
    const syncCtaState = () => {
      const hasMentee = Boolean(getMenteeId());
      setCtaHref(hasMentee ? "/mentee/prefs" : "/mentee");
      setCtaLabel(hasMentee ? "Select Your Preferences" : "Register as Mentee");
    };

    syncCtaState();

    const handleSessionChange = () => syncCtaState();
    window.addEventListener("mentee-session-change", handleSessionChange);
    window.addEventListener("storage", handleSessionChange);
    document.addEventListener("visibilitychange", handleSessionChange);

    return () => {
      window.removeEventListener("mentee-session-change", handleSessionChange);
      window.removeEventListener("storage", handleSessionChange);
      document.removeEventListener("visibilitychange", handleSessionChange);
    };
  }, []);

  return (
    <div className="container">
      {/* Hero */}
      <div className="hero" role="banner" aria-label="Mentor session landing hero">
        <div className="hero-inner">
          <div className="hero-copy">
            <span className="kicker">
              <svg
                className="icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21v-1a7 7 0 0 1 14 0v1" />
              </svg>
              ICT Students&apos; Circle · Mentor Session 2026
            </span>

            <h1>
              Find your <em>senior mentor.</em>
            </h1>

            <p>
              Submit your preferences now and get matched with an experienced
              senior from your faculty — fairly and automatically.
            </p>
            <br />

            <div className="cta">
              <Link href={ctaHref} className="btn btn-white">
                <svg
                  className="icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                {ctaLabel}
              </Link>

              <Link href="/mentor" className="btn btn-glass">
                <svg
                  className="icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21v-1a7 7 0 0 1 14 0v1" />
                </svg>
                View Mentor Profiles
              </Link>
            </div>

          </div>

          {/* <div className="hero-visual" aria-hidden="true">
            <div className="hero-orb hero-orb-lg" />
            <div className="hero-orb hero-orb-sm" />
            <div className="hero-panel">
              <span className="hero-panel-tag">Open now</span>
              <strong>Mentor preferences</strong>
              <small>Live session · 2026 intake</small>
            </div>
          </div> */}
        </div>
      </div>

      {/* Session lifecycle — tells mentees exactly where things stand */}
      <div className="card" style={{ marginTop: 28 }}>
        <h3 className="card-title">
          <svg
            className="icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--indigo-light)"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          Session Progress
        </h3>
        <LifecycleStepper steps={LIFECYCLE_STEPS} />
      </div>

      {/* Inline footer */}
      <p
        style={{
          marginTop: 48,
          textAlign: "center",
          fontSize: 12,
          color: "var(--gray-400)",
          fontWeight: 500,
        }}
      >
        ICT Students&apos; Circle · Faculty of Technology · University of Ruhuna
      </p>
    </div>
  );
}
