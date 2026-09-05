"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  /** Total mentees being allocated */
  total: number;
  /** Call when the cinematic should close (after animation completes) */
  onDone: () => void;
}

// Fake name pools for background ghost rows
const FIRST = ["Kavindi","Pasindu","Nethmi","Ravindu","Dilani","Thilina","Amali","Buddhika",
               "Chathurika","Dasun","Eranga","Fathima","Geeth","Hasini","Isuru","Janani",
               "Kasun","Lahiru","Malsha","Nuwan","Oshadi","Pranith","Ruwini","Sandali",
               "Thashmika","Umindu","Vinura","Wanisha","Yohan","Zeenath"];
const LAST  = ["Wickramasinghe","Fernando","Perera","Senanayake","Rathnayake","Jayasinghe",
               "Silva","Dissanayake","Bandara","Gunawardena","Rodrigo","Mendis","Pathirana",
               "Amarasinghe","Liyanage","Samaraweera","Weerasinghe","Herath","Tennakoon"];
const METHODS = ["1st choice","1st choice","1st choice","2nd choice","2nd choice","Fallback"];
const METHOD_COLORS: Record<string,string> = {
  "1st choice":  "#22c55e",
  "2nd choice":  "#f59e0b",
  "Fallback":    "#94a3b8",
};

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function fakeName() { return `${rand(FIRST)} ${rand(LAST)}`; }

interface GhostRow { id: number; mentee: string; mentor: string; method: string; age: number }

const DURATION_MS  = 3800; // total cinematic duration
const TICKER_MS    = 60;   // counter tick interval
const ROW_INTERVAL = 280;  // new ghost row every N ms
const ROW_LIFE     = 1800; // how long a row stays visible

export function AllocationCinematic({ total, onDone }: Props) {
  const [count,    setCount]    = useState(0);
  const [rows,     setRows]     = useState<GhostRow[]>([]);
  const [phase,    setPhase]    = useState<"in" | "run" | "out">("in");
  const rowIdRef = useRef(0);
  const startRef = useRef(Date.now());

  // Count-up ticker
  useEffect(() => {
    startRef.current = Date.now();
    const interval = setInterval(() => {
      const elapsed  = Date.now() - startRef.current;
      const progress = Math.min(elapsed / (DURATION_MS * 0.75), 1);
      // ease-out cubic
      const eased    = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * total));
      if (progress >= 1) clearInterval(interval);
    }, TICKER_MS);
    return () => clearInterval(interval);
  }, [total]);

  // Ghost row spawner
  useEffect(() => {
    const interval = setInterval(() => {
      const id = ++rowIdRef.current;
      setRows((prev) => [
        ...prev.slice(-12), // keep max 12 rows
        { id, mentee: fakeName(), mentor: fakeName(), method: rand(METHODS), age: 0 },
      ]);
    }, ROW_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  // Age rows so they fade out
  useEffect(() => {
    const interval = setInterval(() => {
      setRows((prev) =>
        prev
          .map((r) => ({ ...r, age: r.age + 80 }))
          .filter((r) => r.age < ROW_LIFE),
      );
    }, 80);
    return () => clearInterval(interval);
  }, []);

  // Phase transitions
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("run"), 200);
    const t2 = setTimeout(() => setPhase("out"), DURATION_MS - 500);
    const t3 = setTimeout(() => onDone(), DURATION_MS);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  const opacity = phase === "in" ? 0 : phase === "out" ? 0 : 1;

  return (
    <div
      aria-live="assertive"
      aria-label="Allocation running"
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(10, 10, 30, 0.97)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        overflow: "hidden",
        opacity,
        transition: phase === "in"
          ? "opacity 0.3s ease"
          : phase === "out"
          ? "opacity 0.5s ease"
          : "none",
      }}
    >
      {/* ── Ghost allocation rows in background ── */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: 6, padding: "0 20px",
        overflow: "hidden",
      }}>
        {rows.map((row) => {
          const rowOpacity = Math.max(0, 1 - row.age / ROW_LIFE) * 0.22;
          return (
            <div
              key={row.id}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                color: "#fff", fontSize: 12.5, fontWeight: 500,
                opacity: rowOpacity,
                transition: "opacity 0.08s linear",
                maxWidth: 480, width: "100%",
              }}
            >
              <span style={{ flex: 1, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "rgba(255,255,255,0.7)" }}>
                {row.mentee}
              </span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", flexShrink: 0 }}>→</span>
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "rgba(255,255,255,0.7)" }}>
                {row.mentor}
              </span>
              <span style={{
                flexShrink: 0, fontSize: 10.5, fontWeight: 700,
                color: METHOD_COLORS[row.method] ?? "#94a3b8",
                minWidth: 64, textAlign: "right",
              }}>
                {row.method}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Centre content ── */}
      <div style={{ position: "relative", textAlign: "center", userSelect: "none" }}>
        {/* Glow ring */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%,-50%)",
          width: 280, height: 280, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Big counter */}
        <div style={{
          fontSize: "clamp(96px, 18vw, 160px)",
          fontWeight: 800,
          lineHeight: 1,
          color: "#fff",
          letterSpacing: "-4px",
          fontVariantNumeric: "tabular-nums",
          textShadow: "0 0 60px rgba(99,102,241,0.6)",
          position: "relative",
        }}>
          {count}
        </div>

        {/* Label */}
        <div style={{
          marginTop: 16, fontSize: 14, fontWeight: 600,
          color: "rgba(199,210,254,0.8)",
          letterSpacing: "3px", textTransform: "uppercase",
        }}>
          Allocating
        </div>

        {/* Animated dots */}
        <div style={{ marginTop: 20, display: "flex", justifyContent: "center", gap: 8 }}>
          {[0,1,2].map((i) => (
            <div key={i} style={{
              width: 7, height: 7, borderRadius: "50%",
              background: "#6366f1",
              animation: `ac-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
            }} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes ac-dot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40%            { transform: scale(1.2); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
