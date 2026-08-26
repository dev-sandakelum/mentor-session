"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Home" },
  { href: "/mentee", label: "Sign In" },
  { href: "/mentee/prefs", label: "Preferences" },
  { href: "/mentee/dashboard", label: "Dashboard" },
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
