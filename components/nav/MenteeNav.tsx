"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getMenteeId } from "@/lib/mentee-session";

export function MenteeNav() {
  const pathname = usePathname();
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    const id = getMenteeId();
    setRegistered(!!id);
  }, [pathname]); // re-check on every route change

  const tabs = registered
    ? [
        { href: "/mentee/prefs",     label: "Preference Selection" },
        { href: "/mentee/dashboard", label: "Mentee Dashboard" },
      ]
    : [
        { href: "/mentee", label: "Mentee Registration" },
      ];

  return (
    <nav className="nav" aria-label="Mentee navigation">
      {tabs.map(({ href, label }) => (
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
