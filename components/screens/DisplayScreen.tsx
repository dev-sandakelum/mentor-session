"use client";

import React, { useEffect, useRef, useState } from "react";
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
      background: "#0f0c29",
      backgroundImage: "url('/display/cover.png')",
      backgroundSize: "contain",
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

// ─── Particle field canvas hook ──────────────────────────────────────────────

function useParticleCanvas(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animId: number;

    interface Pt { x: number; y: number; vx: number; vy: number; r: number }
    let w = 0, h = 0, dpr = 1;
    let pts: Pt[] = [];

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.width  = window.innerWidth  * dpr;
      h = canvas.height = window.innerHeight * dpr;
      canvas.style.width  = window.innerWidth  + "px";
      canvas.style.height = window.innerHeight + "px";
      const count = Math.min(90, Math.floor((window.innerWidth * window.innerHeight) / 20000));
      pts = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25 * dpr,
        vy: (Math.random() - 0.5) * 0.25 * dpr,
        r:  (Math.random() * 1.6 + 0.6) * dpr,
      }));
    };
    resize();
    window.addEventListener("resize", resize);

    const LINK = 130;
    const frame = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(180,190,255,0.55)";
        ctx.fill();
      }
      const L = LINK * dpr;
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d  = Math.hypot(dx, dy);
          if (d < L) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(129,140,248,${0.16 * (1 - d / L)})`;
            ctx.lineWidth = dpr;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(frame);
    };
    frame();

    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, [canvasRef]);
}

// ─── Premium MentorCard scene ─────────────────────────────────────────────────

function MentorCardScene({ scene }: { scene: Extract<DisplayScene, { type: "mentor-card" }> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useParticleCanvas(canvasRef);

  const prevKeyRef   = useRef("");
  const [transClass, setTransClass] = useState("mc-enter-right");
  const [renderKey,  setRenderKey]  = useState(0);
  const [vis,        setVis]        = useState(false);
  const key = `${scene.mentor.id}-${scene.index}`;

  // Detect mentor change and pick slide direction
  useEffect(() => {
    const isFirst = prevKeyRef.current === "";
    if (prevKeyRef.current !== key) {
      if (!isFirst) {
        const wasIdx = parseInt(prevKeyRef.current.split("-").pop() ?? "0");
        setTransClass(scene.index > wasIdx ? "mc-enter-right" : "mc-enter-left");
      }
      prevKeyRef.current = key;
      setRenderKey((n) => n + 1);
    }
  }, [key, scene.index]);

  // Trigger vis on every render-key change (covers first load + subsequent changes)
  useEffect(() => {
    setVis(false);
    const t = setTimeout(() => setVis(true), 80);
    return () => clearTimeout(t);
  }, [renderKey]);

  const { mentor, mentees } = scene;
  const initials = mentor.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div style={{ position:"fixed", inset:0, background:"#05050f", fontFamily:"'Inter',system-ui,sans-serif", WebkitFontSmoothing:"antialiased" }}>

      {/* ── Background layer ── */}
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(120% 120% at 15% 0%,#14123a 0%,transparent 55%), radial-gradient(120% 120% at 100% 100%,#0d1b2a 0%,transparent 55%), linear-gradient(160deg,#06061a 0%,#0b0b22 55%,#070714 100%)", overflow:"hidden" }}>
        <canvas ref={canvasRef} style={{ position:"absolute", inset:0 }} />
        {/* Aurora blobs */}
        <div style={{ position:"absolute", width:"46vw", height:"46vw", top:"-14%", right:"-8%", borderRadius:"50%", background:"radial-gradient(circle,rgba(99,102,241,0.9) 0%,rgba(99,102,241,0) 68%)", filter:"blur(70px)", opacity:0.55, mixBlendMode:"screen", animation:"mcDrift1 22s ease-in-out infinite" }} />
        <div style={{ position:"absolute", width:"40vw", height:"40vw", bottom:"-16%", left:"-6%", borderRadius:"50%", background:"radial-gradient(circle,rgba(168,85,247,0.75) 0%,rgba(168,85,247,0) 68%)", filter:"blur(70px)", opacity:0.55, mixBlendMode:"screen", animation:"mcDrift2 26s ease-in-out infinite" }} />
        <div style={{ position:"absolute", width:"34vw", height:"34vw", top:"30%", left:"42%", borderRadius:"50%", background:"radial-gradient(circle,rgba(34,211,238,0.5) 0%,rgba(34,211,238,0) 68%)", filter:"blur(70px)", opacity:0.55, mixBlendMode:"screen", animation:"mcDrift3 30s ease-in-out infinite" }} />
        <div style={{ position:"absolute", width:"26vw", height:"26vw", bottom:"6%", right:"20%", borderRadius:"50%", background:"radial-gradient(circle,rgba(251,191,36,0.35) 0%,rgba(251,191,36,0) 68%)", filter:"blur(70px)", opacity:0.55, mixBlendMode:"screen", animation:"mcDrift1 34s ease-in-out infinite reverse" }} />
        {/* Grid */}
        <div style={{ position:"absolute", inset:-2, backgroundImage:"linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)", backgroundSize:"60px 60px", maskImage:"radial-gradient(120% 90% at 50% 40%,#000 30%,transparent 75%)", WebkitMaskImage:"radial-gradient(120% 90% at 50% 40%,#000 30%,transparent 75%)" }} />
        {/* Vignette */}
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(120% 120% at 50% 45%,transparent 55%,rgba(0,0,0,0.55) 100%)", pointerEvents:"none" }} />
      </div>

      {/* ── Card ── */}
      <div style={{ position:"relative", zIndex:2, width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", padding:"5vh 5vw", perspective:1600 }}>
        <div
          className={`mc-card ${transClass} ${vis ? "mc-vis" : ""}`}
          style={{
            position:"relative",
            width:"min(1120px,94vw)", maxHeight:"88vh",
            display:"flex", alignItems:"stretch",
            gap:"clamp(20px,3.5vw,56px)",
            padding:"clamp(26px,4vh,52px) clamp(28px,4vw,60px)",
            borderRadius:30,
            background:"linear-gradient(160deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))",
            backdropFilter:"blur(26px) saturate(140%)",
            WebkitBackdropFilter:"blur(26px) saturate(140%)",
            boxShadow:"0 40px 120px -30px rgba(0,0,0,0.75),inset 0 1px 0 rgba(255,255,255,0.12)",
          }}
        >
          {/* Static conic gradient border — no rotation */}
          <div style={{ position:"absolute", inset:0, borderRadius:30, padding:"1.5px", background:"conic-gradient(from 45deg,#6366f1,#a855f7,#ec4899,#22d3ee,#fbbf24,#6366f1)", WebkitMask:"linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0)", WebkitMaskComposite:"xor", maskComposite:"exclude", opacity:0.6, pointerEvents:"none" }} />
          {/* Sheen */}
          <div style={{ position:"absolute", inset:0, borderRadius:30, background:"linear-gradient(115deg,transparent 30%,rgba(255,255,255,0.10) 48%,transparent 66%)", backgroundSize:"250% 100%", animation:"mcSheen 7s ease-in-out infinite", pointerEvents:"none" }} />

          {/* ── LEFT: Mentor ── */}
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center", gap:"clamp(10px,1.6vh,18px)", flexShrink:0, width:"clamp(210px,26vw,320px)" }}>
            {/* Photo shell */}
            <div style={{ position:"relative", width:"clamp(150px,20vw,232px)", height:"clamp(150px,20vw,232px)" }}>
              {/* Halo */}
              <div style={{ position:"absolute", inset:"-18%", borderRadius:"50%", background:"radial-gradient(circle,rgba(99,102,241,0.5) 0%,transparent 65%)", filter:"blur(14px)", animation:"mcHalo 3.4s ease-in-out infinite" }} />
              {/* Spinning ring */}
              <div style={{ position:"absolute", inset:0, borderRadius:"50%", padding:4, background:"conic-gradient(from 0deg,#6366f1,#22d3ee,#a855f7,#ec4899,#fbbf24,#6366f1)", WebkitMask:"linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0)", WebkitMaskComposite:"xor", maskComposite:"exclude", animation:"mcSpinRing 6s linear infinite" }} />
              {/* Photo */}
              <div style={{ position:"absolute", inset:8, borderRadius:"50%", overflow:"hidden", background:"#14122e", boxShadow:"inset 0 0 30px rgba(0,0,0,0.6)" }}>
                {mentor.photoUrl
                  ? <img src={mentor.photoUrl} alt={mentor.name} style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center 20%", display:"block" }} />
                  : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"clamp(38px,5.5vw,74px)", fontWeight:800, background:"linear-gradient(135deg,#a5b4fc,#f0abfc 50%,#fcd34d)", WebkitBackgroundClip:"text", backgroundClip:"text", color:"transparent" }}>{initials}</div>
                }
              </div>
            </div>

            {/* Name */}
            <div style={{ fontFamily:"'Sora','Inter',sans-serif", fontSize:"clamp(19px,2.3vw,32px)", fontWeight:800, lineHeight:1.15, letterSpacing:"-0.5px", background:"linear-gradient(120deg,#ffffff 0%,#dbe3ff 45%,#eaccff 100%)", WebkitBackgroundClip:"text", backgroundClip:"text", color:"transparent" }}>
              {mentor.name}
            </div>
            {mentor.studentId && (
              <div style={{ fontFamily:"ui-monospace,monospace", fontSize:"clamp(11px,1.15vw,14px)", letterSpacing:1, color:"rgba(199,210,254,0.5)" }}>
                {mentor.studentId}
              </div>
            )}
            {/* Badge */}
            <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"linear-gradient(120deg,rgba(99,102,241,0.22),rgba(168,85,247,0.18))", border:"1px solid rgba(165,180,252,0.35)", borderRadius:99, padding:"6px 16px", fontSize:"clamp(11px,1.05vw,13px)", fontWeight:700, color:"#e0e7ff", boxShadow:"0 6px 20px -8px rgba(99,102,241,0.6)" }}>
              <span style={{ width:7, height:7, borderRadius:"50%", background:"#34d399", boxShadow:"0 0 0 0 rgba(52,211,153,0.7)", display:"inline-block", animation:"mcLivePulse 2s ease-out infinite", flexShrink:0 }} />
              {mentor.batch ?? "9th"} Batch · {mentor.communicationMethod}
            </div>

            {/* Position */}
            <div style={{ fontSize:"clamp(10px,1vw,13px)", color:"rgba(199,210,254,0.25)", letterSpacing:1 }}>
              {scene.index + 1} / {scene.total}
            </div>
          </div>

          {/* ── DIVIDER ── */}
          <div style={{ position:"relative", width:1, alignSelf:"stretch", margin:"1vh 0", background:"linear-gradient(to bottom,transparent,rgba(165,180,252,0.35) 20%,rgba(165,180,252,0.35) 80%,transparent)", flexShrink:0 }}>
            <div style={{ position:"absolute", left:"50%", top:0, width:6, height:6, borderRadius:"50%", transform:"translate(-50%,0)", background:"#fff", boxShadow:"0 0 12px 3px rgba(165,180,252,0.9)", animation:"mcSpark 3.6s ease-in-out infinite" }} />
          </div>

          {/* ── RIGHT: Mentees ── */}
          <div style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column", justifyContent:"center", gap:"clamp(8px,1.4vh,16px)" }}>
            {/* Header */}
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:"0.4vh" }}>
              <div style={{ fontFamily:"'Space Grotesk','Inter',sans-serif", fontSize:"clamp(10px,1vw,13px)", fontWeight:600, letterSpacing:4, textTransform:"uppercase", color:"rgba(199,210,254,0.55)", whiteSpace:"nowrap" }}>
                Assigned Mentees
              </div>
              <div style={{ fontSize:11, fontWeight:700, color:"#c7d2fe", background:"rgba(99,102,241,0.18)", border:"1px solid rgba(99,102,241,0.35)", borderRadius:99, padding:"2px 9px" }}>
                {mentees.length}
              </div>
              <div style={{ flex:1, height:1, background:"linear-gradient(to right,rgba(165,180,252,0.35),transparent)" }} />
            </div>

            {/* Mentee rows */}
            {mentees.length === 0 ? (
              <div style={{ fontSize:"clamp(14px,1.8vw,20px)", color:"rgba(199,210,254,0.3)", fontStyle:"italic" }}>
                No mentees assigned yet
              </div>
            ) : mentees.map((mentee, i) => (
              <div
                key={mentee.studentId}
                style={{
                  position:"relative", display:"flex", alignItems:"center",
                  gap:"clamp(12px,1.6vw,22px)",
                  background:"rgba(255,255,255,0.045)",
                  border:"1px solid rgba(255,255,255,0.09)",
                  borderRadius:16,
                  padding:"clamp(11px,1.5vh,17px) clamp(15px,2vw,24px)",
                  overflow:"hidden",
                  opacity: vis ? 1 : 0,
                  transform: vis ? "translateX(0)" : "translateX(26px)",
                  transition: `opacity 0.55s cubic-bezier(0.16,1,0.3,1) ${0.18 + i*0.11}s, transform 0.55s cubic-bezier(0.34,1.56,0.64,1) ${0.18 + i*0.11}s`,
                }}
              >
                {/* Left accent bar */}
                <div style={{ position:"absolute", left:0, top:0, bottom:0, width:3, background:"linear-gradient(to bottom,#6366f1,#a855f7)", transform: vis ? "scaleY(1)" : "scaleY(0)", transformOrigin:"top", transition: `transform 0.4s cubic-bezier(0.16,1,0.3,1) ${0.3 + i*0.11}s` }} />
                {/* Number */}
                <div style={{ width:"clamp(32px,3vw,44px)", height:"clamp(32px,3vw,44px)", borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Sora','Inter',sans-serif", fontSize:"clamp(12px,1.2vw,16px)", fontWeight:800, color:"#fff", background:"linear-gradient(135deg,rgba(99,102,241,0.55),rgba(168,85,247,0.45))", border:"1px solid rgba(199,210,254,0.35)", boxShadow:"0 6px 18px -6px rgba(99,102,241,0.7),inset 0 1px 0 rgba(255,255,255,0.25)" }}>
                  {i + 1}
                </div>
                <div>
                  <div style={{ fontFamily:"'Sora','Inter',sans-serif", fontSize:"clamp(15px,1.7vw,22px)", fontWeight:700, color:"#f4f6ff", letterSpacing:"-0.2px" }}>
                    {mentee.name}
                  </div>
                  <div style={{ fontFamily:"ui-monospace,monospace", fontSize:"clamp(10px,1vw,13px)", color:"rgba(199,210,254,0.5)", marginTop:3, letterSpacing:"0.5px" }}>
                    {mentee.studentId}
                  </div>
                </div>
                <div style={{ marginLeft:"auto", color:"rgba(199,210,254,0.3)", fontSize:18 }}>→</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes mcDrift1  { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-6vw,5vh) scale(1.12)} }
        @keyframes mcDrift2  { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(7vw,-4vh) scale(1.15)} }
        @keyframes mcDrift3  { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-5vw,-6vh) scale(0.85)} }
        @keyframes mcSheen { 0%{background-position:160% 0} 55%{background-position:-60% 0} 100%{background-position:-60% 0} }
        @keyframes mcHalo { 0%,100%{opacity:0.55;transform:scale(1)} 50%{opacity:0.95;transform:scale(1.06)} }
        @keyframes mcSpinRing { to{transform:rotate(360deg)} }
        @keyframes mcLivePulse { 0%{box-shadow:0 0 0 0 rgba(52,211,153,0.6)} 70%{box-shadow:0 0 0 8px rgba(52,211,153,0)} 100%{box-shadow:0 0 0 0 rgba(52,211,153,0)} }
        @keyframes mcSpark { 0%{top:6%;opacity:0} 15%{opacity:1} 85%{opacity:1} 100%{top:94%;opacity:0} }
        @keyframes mcCardIn { from{opacity:0;transform:translateY(28px) scale(0.96)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes mcEnterRight { from{opacity:0;transform:translateX(40px)} to{opacity:1;transform:translateX(0)} }
        @keyframes mcEnterLeft  { from{opacity:0;transform:translateX(-40px)} to{opacity:1;transform:translateX(0)} }

        .mc-card { opacity:0; animation: mcCardIn 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s forwards; }
        .mc-enter-right.mc-vis { animation: mcEnterRight 0.5s cubic-bezier(0.16,1,0.3,1) forwards; }
        .mc-enter-left.mc-vis  { animation: mcEnterLeft  0.5s cubic-bezier(0.16,1,0.3,1) forwards; }
      `}</style>
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
      {scene.type === "idle"        && <IdleScene />}
      {scene.type === "allocation"  && <AllocationScene scene={scene} />}
      {scene.type === "results"     && <ResultsScene   scene={scene} />}
      {scene.type === "custom"      && <CustomScene    scene={scene} />}
      {scene.type === "mentor-card" && <MentorCardScene scene={scene} />}
    </div>
  );
}
