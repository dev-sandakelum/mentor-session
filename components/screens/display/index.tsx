"use client";
import React, { useEffect, useRef, useState } from "react";
import type { DisplayState, DisplayScene } from "@/lib/display-state";

import { IdleScene }             from "./IdleScene";
import { ThankYouScene }         from "./ThankYouScene";
import { CustomScene }           from "./CustomScene";
import { ResultsScene }          from "./ResultsScene";
import { LiveRegistrationsScene } from "./LiveRegistrationsScene";
import { AllocationScene }       from "./AllocationScene";
import { MentorCarouselScene }   from "./MentorCarouselScene";
import { MentorCardScene }       from "./MentorCardScene";
import { SceneTransition }       from "./SceneTransition";

// ─── Main display screen ──────────────────────────────────────────────────────

export function DisplayScreen() {
  const [state, setState] = useState<DisplayState | null>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const connect = () => {
      const es = new EventSource("/api/display/state");
      esRef.current = es;
      es.onmessage = (e) => {
        try { setState(JSON.parse(e.data as string) as DisplayState); } catch { /* ignore */ }
      };
      es.onerror = () => { es.close(); setTimeout(connect, 3000); };
    };
    connect();
    return () => esRef.current?.close();
  }, []);

  const scene = state?.scene ?? ({ type: "idle" } as DisplayScene);

  // Stable key — drives crossfade only on scene TYPE changes
  const sceneKey =
    scene.type === "mentor-card"
      ? `mentor-card-${(scene as Extract<DisplayScene, { type: "mentor-card" }>).mentor.id}`
      : scene.type;

  const sceneNode = (
    <>
      {scene.type === "idle"               && <IdleScene />}
      {scene.type === "thankyou"           && <ThankYouScene />}
      {scene.type === "live-registrations" && <LiveRegistrationsScene />}
      {scene.type === "mentor-carousel"    && <MentorCarouselScene scene={scene} />}
      {scene.type === "allocation"         && <AllocationScene     scene={scene} />}
      {scene.type === "results"            && <ResultsScene        scene={scene} />}
      {scene.type === "custom"             && <CustomScene         scene={scene} />}
      {scene.type === "mentor-card"        && <MentorCardScene     scene={scene} />}
    </>
  );

  return (
    <div style={{ position:"fixed", inset:0, background:"#0f0c29", fontFamily:"inherit" }}>
      <SceneTransition sceneKey={sceneKey}>
        {sceneNode}
      </SceneTransition>
    </div>
  );
}
