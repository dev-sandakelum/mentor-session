"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function MentorNav() {
  const pathname = usePathname();

  return (
    <nav className="nav" aria-label="Mentor navigation">
      <Link
        href="/mentor"
        className={pathname === "/mentor" ? "active" : ""}
        aria-current={pathname === "/mentor" ? "page" : undefined}
      >
        Mentor Directory
      </Link>
    </nav>
  );
}
