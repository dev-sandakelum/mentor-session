"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/",        label: "Home" },
  { href: "/mentee",  label: "Mentee" },
  { href: "/mentor",  label: "Mentors" },
  { href: "/admin",   label: "Admin", isAdmin: true },
];

export function HomeNav() {
  const pathname = usePathname();

  return (
    <nav className="nav" aria-label="Main navigation">
      {TABS.map(({ href, label, isAdmin }) => (
        <Link
          key={href}
          href={href}
          className={[
            isAdmin ? "admin-tab" : "",
            pathname === href ? "active" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-current={pathname === href ? "page" : undefined}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
