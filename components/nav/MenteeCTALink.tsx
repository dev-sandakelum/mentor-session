"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getMenteeId } from "@/lib/mentee-session";

/**
 * Single smart header link for the root page.
 * - No session  → "Register as Mentee" → /mentee
 * - Has session → "Select Preferences →" → /mentee/prefs
 */
export function MenteeCTALink() {
  const [href, setHref] = useState("/mentee");
  const [label, setLabel] = useState("Register as Mentee");

  useEffect(() => {
    const syncLinkState = () => {
      const hasMentee = Boolean(getMenteeId());
      setHref(hasMentee ? "/mentee/prefs" : "/mentee");
      setLabel(hasMentee ? "Select Preferences" : "Register as Mentee");
    };

    syncLinkState();

    const handleSessionUpdate = () => syncLinkState();
    window.addEventListener("mentee-session-change", handleSessionUpdate);
    window.addEventListener("storage", handleSessionUpdate);
    document.addEventListener("visibilitychange", handleSessionUpdate);

    return () => {
      window.removeEventListener("mentee-session-change", handleSessionUpdate);
      window.removeEventListener("storage", handleSessionUpdate);
      document.removeEventListener("visibilitychange", handleSessionUpdate);
    };
  }, []);

  return (
    <div style={{ marginLeft: "auto" }}>
      <Link
        href={href}
        className="btn btn-primary"
        style={{ fontSize: 13, padding: "8px 18px" }}
      >
        {label}
        <svg
          className="icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden="true"
        >
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </Link>
    </div>
  );
}
