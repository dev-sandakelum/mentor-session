"use client";
import React, { useEffect, useRef, useState } from "react";

interface Props {
  /** Changes when the scene TYPE changes — drives crossfade. */
  sceneKey: string;
  children: React.ReactNode;
}

/**
 * SceneTransition — smooth crossfade + subtle upward slide between any two scenes.
 *
 * Strategy:
 * - Keep the previous scene mounted underneath while animating it out.
 * - Animate the new scene in on top.
 * - Once the exit animation finishes (~750 ms), drop the previous scene from the DOM.
 */
export function SceneTransition({ sceneKey, children }: Props) {
  const [current,  setCurrent]  = useState<{ key: string; node: React.ReactNode }>({ key: sceneKey, node: children });
  const [outgoing, setOutgoing] = useState<{ key: string; node: React.ReactNode } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (sceneKey === current.key) {
      // Same scene type — update node in-place (e.g. allocation progress ticks)
      setCurrent({ key: sceneKey, node: children });
      return;
    }
    // New scene type — push old one to outgoing, bring new one in
    setOutgoing({ key: current.key, node: current.node });
    setCurrent({ key: sceneKey, node: children });

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setOutgoing(null), 750);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneKey]);

  // Keep current node up-to-date (children can change without sceneKey changing)
  useEffect(() => {
    setCurrent(prev => ({ ...prev, node: children }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children]);

  return (
    <div style={{ position:"fixed", inset:0, isolation:"isolate" }}>
      <style>{`
        @keyframes st-enter {
          from { opacity: 0; transform: translateY(18px) scale(.985); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes st-exit {
          from { opacity: 1; transform: translateY(0)     scale(1);    }
          to   { opacity: 0; transform: translateY(-14px) scale(.985); }
        }
      `}</style>

      {/* Outgoing layer — fades out underneath */}
      {outgoing && (
        <div key={outgoing.key} style={{ position:"absolute", inset:0, zIndex:1, animation:"st-exit 0.65s cubic-bezier(0.4,0,0.2,1) forwards", pointerEvents:"none" }}>
          {outgoing.node}
        </div>
      )}

      {/* Current layer — fades in on top */}
      <div key={current.key} style={{ position:"absolute", inset:0, zIndex:2, animation: outgoing ? "st-enter 0.65s cubic-bezier(0.16,1,0.3,1) forwards" : undefined }}>
        {current.node}
      </div>
    </div>
  );
}
