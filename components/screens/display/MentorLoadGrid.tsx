"use client";
import React, { useEffect, useRef, useState } from "react";

export interface MentorLoadEntry {
  name: string;
  allocated: number;
  capacity: number;
}

function tileStyle(allocated: number, capacity: number): React.CSSProperties {
  const level =
    capacity > 0
      ? allocated === 0 ? 0 : allocated < capacity * 0.34 ? 1 : allocated < capacity * 0.67 ? 2 : allocated < capacity ? 3 : 4
      : allocated === 0 ? 0 : allocated === 1 ? 1 : allocated <= 3 ? 2 : allocated <= 5 ? 3 : 4;

  if (level === 0) return { background:"rgba(140,190,255,.08)", border:"1px solid rgba(140,190,255,.12)", color:"#7d97c2" };
  if (level === 1) return { background:"rgba(79,157,255,.22)",  border:"1px solid rgba(79,157,255,.38)",  color:"#c3d8ff" };
  if (level === 2) return { background:"rgba(79,157,255,.42)",  border:"1px solid rgba(94,225,255,.5)",   color:"#fff" };
  if (level === 3) return { background:"rgba(94,225,255,.55)",  border:"1px solid rgba(94,225,255,.75)",  color:"#fff" };
  return {
    background:"linear-gradient(145deg,rgba(255,199,102,.6),rgba(94,225,255,.35))",
    border:"1px solid #ffc766",
    color:"#fff",
    boxShadow:"0 0 16px rgba(255,199,102,.32)",
  };
}

function ini(name: string) {
  return name
    .split(/\s+/)
    .filter((w) => w.length > 1 || /^[A-Z]$/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

interface Props {
  mentors: MentorLoadEntry[];
  /** Name of the mentor whose tile should flash right now (null = none). */
  hitName: string | null;
  /** When true, skips the staggered entrance animation (e.g. during live allocation). */
  disableEntrance?: boolean;
}

/**
 * MentorLoadGrid — auto-fitting constellation grid of mentor load tiles.
 *
 * On first render of each tile it plays a staggered `mlg-tile-in` entrance
 * animation (scale + fade, 18 ms between tiles).
 * Each tile also flashes (`alloc-tile-hit` + sweep) when `hitName` matches.
 */
export function MentorLoadGrid({ mentors, hitName, disableEntrance = false }: Props) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const [cols, setCols]         = useState(6);
  const [tileSize, setTileSize] = useState(44);

  // Tracks hit-animation restarts (key changes force re-mount → restart CSS anim)
  const hitCountRef = useRef<Map<string, number>>(new Map());

  // Tracks which names have already been introduced so we only play the
  // entrance animation once per tile, not on every re-render.
  const seenRef     = useRef<Map<string, number>>(new Map()); // name → entrance index

  // Auto-fit grid columns to available space
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const fit = () => {
      const W = el.clientWidth, H = el.clientHeight, n = mentors.length;
      if (!W || !H || !n) return;
      const GAP = 6;
      let best = { cols: 6, size: 0 };
      for (let c = 4; c <= 12; c++) {
        const rows = Math.ceil(n / c);
        const size = Math.min((W - GAP * (c - 1)) / c, (H - GAP * (rows - 1)) / rows);
        if (size > best.size) best = { cols: c, size };
      }
      setCols(best.cols);
      setTileSize(Math.floor(best.size));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [mentors.length]);

  // Bump hit counter for matching tile → key change → animation restart
  if (hitName) {
    hitCountRef.current.set(hitName, (hitCountRef.current.get(hitName) ?? 0) + 1);
  }

  // Assign entrance indices to new tiles (runs synchronously during render so
  // every new tile immediately gets a stable delay before its first paint)
  mentors.forEach((m) => {
    if (!seenRef.current.has(m.name)) {
      seenRef.current.set(m.name, seenRef.current.size);
    }
  });

  return (
    <>
      <style>{`
        @keyframes mlg-tile-in {
          0%   { opacity: 0; transform: scale(0.55); }
          60%  { opacity: 1; transform: scale(1.08); }
          100% { opacity: 1; transform: scale(1);    }
        }
      `}</style>

      <div
        ref={containerRef}
        style={{
          display:"grid",
          gridTemplateColumns:`repeat(${cols},${tileSize}px)`,
          gridAutoRows:`${tileSize}px`,
          gap:6,
          alignContent:"start",
          justifyContent:"center",
          width:"100%",
          height:"100%",
          overflow:"hidden",
        }}
      >
        {mentors.map((m) => {
          const isHit        = hitName === m.name;
          const hitCount     = hitCountRef.current.get(m.name) ?? 0;
          const entranceIdx  = seenRef.current.get(m.name) ?? 0;
          const fontSize     = Math.max(9, Math.floor(tileSize * 0.27));
          // 18 ms stagger per tile, capped so the last tile doesn't wait forever
          const entranceDelay = `${Math.min(entranceIdx * 18, 1200)}ms`;

          return (
            <div
              key={`${m.name}-${hitCount}`}
              title={`${m.name} · ${m.allocated}${m.capacity ? `/${m.capacity}` : ""}`}
              style={{
                position:"relative",
                borderRadius:10,
                display:"flex", flexDirection:"column",
                alignItems:"center", justifyContent:"center",
                gap:2,
                fontSize:`${fontSize}px`,
                fontWeight:800,
                fontFamily:"Manrope,sans-serif",
                cursor:"default",
                overflow:"hidden",
                transition:"background .45s,border-color .45s,box-shadow .45s",
                // Entrance plays once on load; disabled during live allocation; hit overrides with bounce
                animation: isHit
                  ? "alloc-tile-hit .7s cubic-bezier(.34,1.56,.64,1)"
                  : disableEntrance
                    ? undefined
                    : `mlg-tile-in .42s cubic-bezier(.34,1.56,.64,1) ${entranceDelay} both`,
                ...tileStyle(m.allocated, m.capacity),
              }}
            >
              {/* Sweep flash on hit */}
              {isHit && (
                <div style={{ position:"absolute", inset:0, background:"linear-gradient(100deg,transparent,rgba(255,255,255,.35),transparent)", animation:"alloc-sweep .55s cubic-bezier(.2,.8,.2,1) forwards", pointerEvents:"none" }} />
              )}

              <span>{ini(m.name)}</span>

              {/* Count: dots ≤5, number badge >5 */}
              {m.allocated > 0 && (
                m.allocated <= 5 ? (
                  <div style={{ display:"flex", gap:2 }}>
                    {Array.from({ length: m.allocated }, (_, j) => (
                      <span key={j} style={{
                        width:3, height:3, borderRadius:"50%",
                        background:"currentColor", opacity:.9, display:"inline-block",
                        animation: isHit && j === m.allocated - 1
                          ? "alloc-dot-in .35s cubic-bezier(.34,1.56,.64,1) both"
                          : undefined,
                      }} />
                    ))}
                  </div>
                ) : (
                  <span style={{
                    fontSize:`${Math.max(8, Math.floor(tileSize * 0.22))}px`,
                    fontWeight:800, lineHeight:1, opacity:.9,
                    animation: isHit ? "alloc-dot-in .35s cubic-bezier(.34,1.56,.64,1) both" : undefined,
                  }}>
                    {m.allocated}
                  </span>
                )
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
