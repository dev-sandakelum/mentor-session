"use client";

import { clearMenteeId } from "@/lib/mentee-session";

export function DevBar() {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 40,
        right: 10,
        zIndex: 9999,
      }}
    >
      <button
        onClick={() => {
          clearMenteeId();
          localStorage.clear();
          location.reload();
        }}
        style={{
          background: "#ef4444",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          padding: "4px 10px",
          fontSize: 11,
          fontWeight: 700,
          fontFamily: "monospace",
          cursor: "pointer",
          opacity: 0.75,
          letterSpacing: 0.3,
        }}
        title="DEV: clear session and reload"
      >
        ⚠ CLEAR CACHE
      </button>
    </div>
  );
}
