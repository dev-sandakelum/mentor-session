"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getMenteeId } from "@/lib/mentee-session";
import { MenteeRegScreen } from "@/components/screens/MenteeRegScreen";

export default function MenteeRootPage() {
  const router = useRouter();

  useEffect(() => {
    const menteeId = getMenteeId();
    if (!menteeId) return; // not registered — show registration form

    // Registered — check if preferences already submitted
    fetch(`/api/preferences?menteeId=${encodeURIComponent(menteeId)}`)
      .then((res) => res.json())
      .then((data: unknown) => {
        const prefs = (data as { preferences?: unknown[] })?.preferences ?? [];
        if (prefs.length > 0) {
          router.replace("/mentee/dashboard");
        } else {
          router.replace("/mentee/prefs");
        }
      })
      .catch(() => {
        // On error fall back to prefs page
        router.replace("/mentee/prefs");
      });
  }, [router]);

  // If not registered, render the registration form
  // (redirects above will unmount this before the user sees a flash)
  return <MenteeRegScreen />;
}
