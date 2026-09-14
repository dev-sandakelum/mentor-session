"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getMenteeId } from "@/lib/mentee-session";
import { PrefsScreen } from "@/components/screens/PrefsScreen";

export default function PrefsPage() {
  const router = useRouter();

  useEffect(() => {
    const menteeId = getMenteeId();

    // Not registered at all — send to registration
    if (!menteeId) {
      router.replace("/mentee");
      return;
    }

    // Already submitted preferences — send straight to dashboard
    fetch(`/api/preferences?menteeId=${encodeURIComponent(menteeId)}`)
      .then((res) => res.json())
      .then((data: unknown) => {
        const prefs = (data as { preferences?: unknown[] })?.preferences ?? [];
        if (prefs.length > 0) {
          router.replace("/mentee/dashboard");
        }
      })
      .catch(() => {
        // On error just stay on prefs page
      });
  }, [router]);

  return <PrefsScreen />;
}
