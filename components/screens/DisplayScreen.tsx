"use client";

import { useEffect, useRef, useState } from "react";
import type { DisplayState, DisplayScene } from "@/lib/display-state";

// ─── Ghost row animation helpers ─────────────────────────────────────────────

const FIRST = ["Kavindi","Pasindu","Nethmi","Ravindu","Dilani","Thilina","Amali","Buddhika",
               "Chathurika","Dasun","Eranga","Fathima","Geeth","Hasini","Isuru","Janani",
               "Kasun","Lahiru","Malsha","Nuwan","Oshadi","Pranith","Ruwini","Sandali",
               "Thashmika","Umindu","Vinura","Wanisha","Yohan","Zeenath"];
const LAST  = ["Wickramasinghe","Fernando","Perera","Senanayake","Rathnayake","Jayasinghe",
               "Silva","Dissanayake","Bandara","Gunawardena","Rodrigo","Mendis","Pathirana",
               "Amarasinghe","Liyanage","Samaraweera","Weerasinghe","Herath","Tennakoon"];
const METHODS = ["1st choice","1st choice","1st choice","2nd choice","2nd choice","Fallback"];
const METHOD_COLORS: Record<string, string> = {
  "1st choice": "#22c55e", "2nd choice": "#f59e0b", "Fallback": "#94a3b8",
};
function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function fakeName() { return `${rand(FIRST)} ${rand(LAST)}`; }

interface GhostRow { id: number; mentee: string; mentor: string; method: string; age: number }

// ─── Scene renderers ─────────────────────────────────────────────────────────

function IdleScene() {
  return (
    <div style={{
      width: "100%",
      height: "100%",
      backgroundImage: "url('/display/cover.png')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    }} />
  );
}

function AllocationScene({ scene }: { scene: Extract<DisplayScene, { type: "allocation" }> }) {
  const [count, setCount] = useState(0);
  const [rows,  setRows]  = useState<GhostRow[]>([]);
  const rowIdRef = useRef(0);
  const startRef = useRef(Date.now());

  // Count-up
  useEffect(() => {
    startRef.current = Date.now();
    const DURATION = 7000;
    const iv = setInterval(() => {
      const elapsed  = Date.now() - startRef.current;
      const progress = Math.min(elapsed / (DURATION * 0.80), 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * scene.count));
      if (progress >= 1) clearInterval(iv);
    }, 60);
    return () => clearInterval(iv);
  }, [scene.count]);

  // Ghost rows
  useEffect(() => {
    const iv = setInterval(() => {
      const id = ++rowIdRef.current;
      setRows((prev) => [...prev.slice(-14), { id, mentee: fakeName(), mentor: fakeName(), method: rand(METHODS), age: 0 }]);
    }, 380);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const iv = setInterval(() => {
      setRows((prev) => prev.map((r) => ({ ...r, age: r.age + 80 })).filter((r) => r.age < 3000));
    }, 80);
    return () => clearInterval(iv);
  }, []);

  return (
    <div style={{
      width:"100%", height:"100%",
      background:"rgba(10,10,30,0.97)",
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      overflow:"hidden", position:"relative",
    }}>
      {/* Ghost rows */}
      <div style={{
        position:"absolute", inset:0, pointerEvents:"none",
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
        gap:8, padding:"0 10%", overflow:"hidden",
      }}>
        {rows.map((row) => {
          const opacity = Math.max(0, 1 - row.age / 3000) * 0.22;
          return (
            <div key={row.id} style={{
              display:"flex", alignItems:"center", gap:16,
              color:"#fff", fontSize:"clamp(11px,1.2vw,15px)", fontWeight:500,
              opacity, transition:"opacity 0.08s linear",
              maxWidth:600, width:"100%",
            }}>
              <span style={{ flex:1, textAlign:"right", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", color:"rgba(255,255,255,0.7)" }}>{row.mentee}</span>
              <span style={{ color:"rgba(255,255,255,0.25)", flexShrink:0 }}>→</span>
              <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", color:"rgba(255,255,255,0.7)" }}>{row.mentor}</span>
              <span style={{ flexShrink:0, fontSize:"clamp(9px,1vw,12px)", fontWeight:700, color: METHOD_COLORS[row.method], minWidth:72, textAlign:"right" }}>{row.method}</span>
            </div>
          );
        })}
      </div>

      {/* Centre */}
      <div style={{ position:"relative", textAlign:"center", userSelect:"none" }}>
        <div style={{
          position:"absolute", top:"50%", left:"50%",
          transform:"translate(-50%,-50%)",
          width:"40vw", height:"40vw", maxWidth:500, maxHeight:500,
          borderRadius:"50%",
          background:"radial-gradient(circle,rgba(99,102,241,0.28) 0%,transparent 70%)",
          pointerEvents:"none",
        }} />
        <div style={{
          fontSize:"clamp(80px,15vw,200px)", fontWeight:800, lineHeight:1,
          color:"#fff", letterSpacing:"-4px", fontVariantNumeric:"tabular-nums",
          textShadow:"0 0 80px rgba(99,102,241,0.7)",
          position:"relative",
        }}>
          {count}
        </div>
        <div style={{ marginTop:16, fontSize:"clamp(12px,1.5vw,18px)", fontWeight:600, color:"rgba(199,210,254,0.8)", letterSpacing:"4px", textTransform:"uppercase" }}>
          Allocating
        </div>
        {scene.total > 0 && (
          <div style={{ marginTop:8, fontSize:"clamp(11px,1.2vw,15px)", color:"rgba(199,210,254,0.4)" }}>
            of {scene.total} mentees
          </div>
        )}
        <div style={{ marginTop:24, display:"flex", justifyContent:"center", gap:10 }}>
          {[0,1,2].map((i) => (
            <div key={i} style={{
              width:"clamp(6px,0.8vw,10px)", height:"clamp(6px,0.8vw,10px)",
              borderRadius:"50%", background:"#6366f1",
              animation:`ds-dot 1.8s ease-in-out ${i*0.3}s infinite`,
            }} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes ds-dot {
          0%,80%,100% { transform:scale(0.6); opacity:0.4; }
          40%          { transform:scale(1.3); opacity:1; }
        }
      `}</style>
    </div>
  );
}

function ResultsScene({ scene }: { scene: Extract<DisplayScene, { type: "results" }> }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), 100); return () => clearTimeout(t); }, []);

  return (
    <div style={{
      width:"100%", height:"100%",
      background:"linear-gradient(145deg,#0f0c29,#1a1a3e)",
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      gap:"3vh",
    }}>
      <div style={{
        fontSize:"clamp(14px,2vw,20px)", fontWeight:700,
        letterSpacing:"4px", textTransform:"uppercase",
        color:"rgba(199,210,254,0.5)",
      }}>
        Allocation Complete
      </div>

      <div style={{ display:"flex", gap:"4vw", flexWrap:"wrap", justifyContent:"center" }}>
        {[
          { value: scene.assigned,     label: "Assigned",   color: "#22c55e" },
          { value: scene.unmatched,    label: "Unmatched",  color: "#f59e0b" },
          { value: `${scene.satisfaction}%`, label: "Satisfaction", color: "#6366f1" },
        ].map((stat, i) => (
          <div key={i} style={{
            textAlign:"center",
            opacity: vis ? 1 : 0,
            transform: vis ? "translateY(0)" : "translateY(30px)",
            transition: `opacity 0.6s ease ${i*0.15}s, transform 0.6s ease ${i*0.15}s`,
          }}>
            <div style={{
              fontSize:"clamp(48px,8vw,120px)", fontWeight:800,
              color: stat.color, lineHeight:1,
              textShadow:`0 0 40px ${stat.color}66`,
            }}>
              {stat.value}
            </div>
            <div style={{ fontSize:"clamp(12px,1.5vw,18px)", fontWeight:600, color:"rgba(199,210,254,0.6)", marginTop:8, letterSpacing:"2px", textTransform:"uppercase" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CustomScene({ scene }: { scene: Extract<DisplayScene, { type: "custom" }> }) {
  return (
    <div style={{
      width:"100%", height:"100%",
      background:"linear-gradient(145deg,#0f0c29,#302b63)",
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      textAlign:"center", padding:"0 8vw",
    }}>
      <div style={{
        fontSize:"clamp(28px,5vw,72px)", fontWeight:800,
        color:"#fff", lineHeight:1.2, letterSpacing:"-0.5px",
        textShadow:"0 0 60px rgba(99,102,241,0.5)",
      }}>
        {scene.text}
      </div>
      {scene.sub && (
        <div style={{ marginTop:20, fontSize:"clamp(14px,2vw,24px)", color:"rgba(199,210,254,0.6)", fontWeight:500 }}>
          {scene.sub}
        </div>
      )}
    </div>
  );
}

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
      es.onerror = () => {
        es.close();
        setTimeout(connect, 3000); // reconnect after 3s
      };
    };
    connect();
    return () => esRef.current?.close();
  }, []);

  const scene = state?.scene ?? { type: "idle" } as DisplayScene;

  return (
    <div style={{
      position:"fixed", inset:0,
      background:"#0f0c29",
      fontFamily:"inherit",
    }}>
      {scene.type === "idle"       && <IdleScene />}
      {scene.type === "allocation" && <AllocationScene scene={scene} />}
      {scene.type === "results"    && <ResultsScene   scene={scene} />}
      {scene.type === "custom"     && <CustomScene    scene={scene} />}
    </div>
  );
}
