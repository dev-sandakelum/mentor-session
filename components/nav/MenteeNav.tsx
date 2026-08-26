"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/mentee",           label: "Mentee Registration" },
  { href: "/mentee/prefs",     label: "Preference Selection" },
  { href: "/mentee/dashboard", label: "Mentee Dashboard" },
];

export function MenteeNav() {
  const pathname = usePathname();

  return (
    <nav className="nav" aria-label="Mentee navigation">
      {TABS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={pathname === href ? "active" : ""}
          aria-current={pathname === href ? "page" : undefined}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
