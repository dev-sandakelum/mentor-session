"use client";

import { usePathname, useRouter } from "next/navigation";

interface RouteConfig {
  destination: string;
  label: string;
  /** When true, renders an icon-only home button instead of a labelled back button */
  homeIcon?: boolean;
}

const ROUTE_MAP: Record<string, RouteConfig> = {
  "/mentee/prefs":     { destination: "/", label: "Home", homeIcon: true },
  "/mentee/dashboard": { destination: "/", label: "Home", homeIcon: true },
  "/mentor":           { destination: "/", label: "Home", homeIcon: true },
};

export function BackButton() {
  const pathname = usePathname();
  const router = useRouter();

  const config = ROUTE_MAP[pathname];
  if (!config) return null;

  if (config.homeIcon) {
    return (
      <button
        onClick={() => router.push(config.destination)}
        aria-label="Go to Home"
        className="home-icon-btn"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" />
          <path d="M9 21V12h6v9" />
        </svg>
      </button>
    );
  }

  return (
    <button
      onClick={() => router.push(config.destination)}
      aria-label={`Back to ${config.label}`}
      className="back-btn"
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 15 15"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M9 3L5 7.5 9 12" />
      </svg>
      {config.label}
    </button>
  );
}
