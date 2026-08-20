"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/mentor",           label: "Mentor Registration" },
  { href: "/mentor/dashboard", label: "Mentor Dashboard" },
];

export function MentorNav() {
  const pathname = usePathname();

  return (
    <nav className="nav" aria-label="Mentor navigation">
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
