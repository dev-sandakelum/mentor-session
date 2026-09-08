"use client";
import React, { useEffect, useState } from "react";
import type { DisplayScene } from "@/lib/display-state";

export function ResultsScene({ scene }: { scene: Extract<DisplayScene, { type: "results" }> }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), 120); return () => clearTimeout(t); }, []);

  const stats = [
    { value: String(scene.assigned),  label: "Assigned",     color: "#22c55e", glow: "rgba(34,197,94,.35)",   sub: "mentees matched"   },
    { value: String(scene.unmatched), label: "Unmatched",    color: "#f59e0b", glow: "rgba(245,158,11,.35)",  sub: "need follow-up"    },
    { value: `${scene.satisfaction}%`,label: "Satisfaction", color: "#6366f1", glow: "rgba(99,102,241,.35)",  sub: "1st or 2nd choice" },
  ];

  return (
    <div style={{
      position:"fixed", inset:0,
      fontFamily:'"Roboto","DM Sans",system-ui,sans-serif',
      WebkitFontSmoothing:"antialiased",
      background:"radial-gradient(ellipse 120% 80% at 50% 0%,#0d1b4a 0%,#06091c 60%),linear-gradient(180deg,#06091c 0%,#040713 100%)",
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      overflow:"hidden",
    }}>
      {/* Background grid */}
      <div style={{ position:"absolute", inset:0, pointerEvents:"none",
        backgroundImage:"linear-gradient(rgba(99,102,241,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,.06) 1px,transparent 1px)",
        backgroundSize:"72px 72px",
        WebkitMaskImage:"radial-gradient(ellipse 80% 70% at 50% 50%,#000 20%,transparent 80%)",
        maskImage:"radial-gradient(ellipse 80% 70% at 50% 50%,#000 20%,transparent 80%)" }} />

      {/* Glow orbs */}
      <div style={{ position:"absolute", width:"55vw", height:"55vw", top:"-20%", left:"50%", transform:"translateX(-50%)", borderRadius:"50%", background:"radial-gradient(circle,rgba(99,102,241,.22) 0%,transparent 70%)", filter:"blur(60px)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", width:"30vw", height:"30vw", bottom:"-8%", left:"15%",  borderRadius:"50%", background:"radial-gradient(circle,rgba(34,197,94,.14) 0%,transparent 70%)",   filter:"blur(60px)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", width:"30vw", height:"30vw", bottom:"-8%", right:"15%", borderRadius:"50%", background:"radial-gradient(circle,rgba(245,158,11,.12) 0%,transparent 70%)",  filter:"blur(60px)", pointerEvents:"none" }} />

      {/* Logo + title */}
      <div style={{
        display:"flex", flexDirection:"column", alignItems:"center", gap:"clamp(10px,1.6vh,20px)",
        marginBottom:"clamp(28px,4.5vh,56px)",
        opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(-18px)",
        transition:"opacity .7s ease, transform .7s ease",
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo2.png" alt="Logo" style={{ width:"clamp(48px,6vh,80px)", height:"clamp(48px,6vh,80px)", objectFit:"contain" }} />
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
          <div style={{
            display:"inline-flex", alignItems:"center", gap:10,
            background:"rgba(34,197,94,.1)", border:"1px solid rgba(34,197,94,.3)",
            borderRadius:999, padding:"clamp(5px,.6vh,8px) clamp(14px,1.6vw,22px)",
          }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:"#22c55e", boxShadow:"0 0 10px #22c55e", animation:"res-pulse 2s ease-out infinite" }} />
            <span style={{ fontSize:"clamp(11px,1vw,14px)", fontWeight:700, letterSpacing:".14em", textTransform:"uppercase", color:"#86efac" }}>
              Allocation Complete
            </span>
          </div>
          <div style={{ fontSize:"clamp(13px,1.2vw,17px)", color:"rgba(199,210,254,.45)", fontWeight:400, letterSpacing:".04em" }}>
            Mentor Session 2026 · 9th Batch
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display:"flex", gap:"clamp(14px,2.5vw,36px)", flexWrap:"wrap", justifyContent:"center", alignItems:"stretch" }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            position:"relative",
            minWidth:"clamp(160px,18vw,240px)",
            padding:"clamp(24px,3.5vh,44px) clamp(28px,3vw,44px)",
            borderRadius:"clamp(20px,2vw,28px)",
            background:"linear-gradient(145deg,rgba(13,22,60,.85),rgba(6,10,30,.9))",
            border:"1px solid rgba(255,255,255,.07)",
            boxShadow:`0 0 0 1px rgba(255,255,255,.04),0 24px 60px rgba(0,0,0,.5),0 0 40px ${s.glow}`,
            backdropFilter:"blur(20px)",
            textAlign:"center",
            overflow:"hidden",
            opacity: vis ? 1 : 0,
            transform: vis ? "translateY(0) scale(1)" : "translateY(32px) scale(.96)",
            transition: `opacity .65s cubic-bezier(.16,1,.3,1) ${.1 + i*.12}s, transform .65s cubic-bezier(.16,1,.3,1) ${.1 + i*.12}s`,
          }}>
            <div style={{ position:"absolute", inset:0, borderRadius:"inherit", background:`radial-gradient(ellipse 80% 60% at 50% 0%,${s.glow} 0%,transparent 70%)`, pointerEvents:"none" }} />
            <div style={{ position:"absolute", top:0, left:"15%", right:"15%", height:2, background:`linear-gradient(90deg,transparent,${s.color},transparent)`, borderRadius:2 }} />
            <div style={{ fontSize:"clamp(52px,7.5vw,100px)", fontWeight:900, lineHeight:1, color:s.color, textShadow:`0 0 50px ${s.glow},0 0 20px ${s.glow}`, fontVariantNumeric:"tabular-nums", letterSpacing:"-.03em", position:"relative" }}>
              {s.value}
            </div>
            <div style={{ marginTop:"clamp(8px,1vh,14px)", fontSize:"clamp(11px,1vw,15px)", fontWeight:700, letterSpacing:".14em", textTransform:"uppercase", color:"rgba(199,210,254,.7)" }}>
              {s.label}
            </div>
            <div style={{ marginTop:"clamp(4px,.5vh,7px)", fontSize:"clamp(10px,.85vw,13px)", color:"rgba(199,210,254,.35)", fontWeight:400 }}>
              {s.sub}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes res-pulse { 0%{box-shadow:0 0 0 0 rgba(34,197,94,.6)} 70%{box-shadow:0 0 0 10px rgba(34,197,94,0)} 100%{box-shadow:0 0 0 0 rgba(34,197,94,0)} }
      `}</style>
    </div>
  );
}
