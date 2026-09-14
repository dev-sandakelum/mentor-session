"use client";

import { usePathname, useRouter } from "next/navigation";

interface RouteConfig {
  destination: string;
  label: string;
}

const ROUTE_MAP: Record<string, RouteConfig> = {
  "/mentee/prefs":     { destination: "/",             label: "Home" },
  "/mentee/dashboard": { destination: "/mentee/prefs", label: "Preferences" },
  "/mentor":           { destination: "/",             label: "Home" },
};

export function BackButton() {
  const pathname = usePathname();
  const router = useRouter();

  const config = ROUTE_MAP[pathname];
  if (!config) return null;

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
