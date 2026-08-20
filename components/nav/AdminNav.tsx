"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [{ href: "/admin", label: "Admin Dashboard", isAdmin: true }];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="nav" aria-label="Admin navigation">
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
