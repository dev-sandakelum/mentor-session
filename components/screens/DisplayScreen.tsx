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

function ThankYouScene() {
  return (
    <div style={{
      width: "100%",
      height: "100%",
      background: "#0f0c29",
      backgroundImage: "url('/display/thank_you.png')",
      backgroundSize: "contain",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    }} />
  );
}

function LiveRegistrationsScene() {
  const [count,    setCount]    = useState<number | null>(null);
  const [prevCount, setPrevCount] = useState<number | null>(null);
  const [bump,     setBump]     = useState(false);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const res  = await fetch("/api/display/registrations");
        if (!res.ok) return;
        const data = await res.json() as { count: number };
        if (!cancelled) {
          setCount((prev) => {
            if (prev !== null && data.count !== prev) {
              setPrevCount(prev);
              setBump(true);
              setTimeout(() => setBump(false), 600);
            }
            return data.count;
          });
        }
      } catch { /* ignore */ }
    };

    poll();
    const iv = setInterval(poll, 3000);
    return () => { cancelled = true; clearInterval(iv); };
  }, []);

  const displayCount = count ?? 0;

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "linear-gradient(145deg,#06061a 0%,#0b0b22 55%,#070714 100%)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      overflow: "hidden",
    }}>
      {/* Aurora blobs */}
      <div style={{ position:"absolute", width:"50vw", height:"50vw", top:"-15%", right:"-10%", borderRadius:"50%", background:"radial-gradient(circle,rgba(99,102,241,0.6) 0%,transparent 70%)", filter:"blur(80px)", opacity:0.4, animation:"mcDrift1 22s ease-in-out infinite", pointerEvents:"none" }} />
      <div style={{ position:"absolute", width:"40vw", height:"40vw", bottom:"-15%", left:"-8%", borderRadius:"50%", background:"radial-gradient(circle,rgba(168,85,247,0.5) 0%,transparent 70%)", filter:"blur(80px)", opacity:0.35, animation:"mcDrift2 28s ease-in-out infinite", pointerEvents:"none" }} />

      {/* Label */}
      <div style={{
        fontSize: "clamp(13px,1.8vw,22px)", fontWeight: 700,
        letterSpacing: "4px", textTransform: "uppercase",
        color: "rgba(199,210,254,0.5)", marginBottom: "3vh",
      }}>
        Registrations
      </div>

      {/* Big counter */}
      <div style={{ position: "relative", lineHeight: 1 }}>
        {/* Glow */}
        <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:"40vw", height:"40vw", maxWidth:500, borderRadius:"50%", background:"radial-gradient(circle,rgba(99,102,241,0.3) 0%,transparent 65%)", pointerEvents:"none" }} />
        <div style={{
          fontSize: "clamp(100px,20vw,260px)", fontWeight: 800,
          color: "#fff", letterSpacing: "-6px", fontVariantNumeric: "tabular-nums",
          textShadow: "0 0 100px rgba(99,102,241,0.7)",
          transform: bump ? "scale(1.08)" : "scale(1)",
          transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
          position: "relative", display: "inline-block",
        }}>
          {count === null ? "—" : displayCount}
        </div>
      </div>

      {/* Sub label */}
      <div style={{
        marginTop: "3vh",
        fontSize: "clamp(12px,1.5vw,18px)", fontWeight: 600,
        color: "rgba(199,210,254,0.45)", letterSpacing: "2px",
      }}>
        mentees registered
      </div>

      {/* Live indicator */}
      <div style={{ marginTop: "2vh", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#34d399", animation: "mcLivePulse 2s ease-out infinite" }} />
        <span style={{ fontSize: "clamp(10px,1vw,13px)", fontWeight: 600, color: "rgba(199,210,254,0.4)", letterSpacing: "1px" }}>
          LIVE · updates every 3s
        </span>
      </div>

      <style>{`
        @keyframes mcDrift1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-5vw,4vh) scale(1.1)} }
        @keyframes mcDrift2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(6vw,-4vh) scale(1.12)} }
        @keyframes mcLivePulse { 0%{box-shadow:0 0 0 0 rgba(52,211,153,0.6)} 70%{box-shadow:0 0 0 10px rgba(52,211,153,0)} 100%{box-shadow:0 0 0 0 rgba(52,211,153,0)} }
      `}</style>
    </div>
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

// ─── Mentor Carousel scene ───────────────────────────────────────────────────

interface CarouselMentor { id: string; name: string; batch: string | null; photoUrl: string | null; allocatedCount: number; capacity: number }

function MentorCarouselScene() {
  const canvasRef2 = useRef<HTMLCanvasElement>(null);
  useParticleCanvas(canvasRef2);

  const [mentors,  setMentors]  = useState<CarouselMentor[]>([]);
  const [active,   setActive]   = useState(0);
  const [noAnim,   setNoAnim]   = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const INTERVAL = 3200;
  const total = mentors.length;

  // Load mentors once
  useEffect(() => {
    fetch("/api/display/mentors")
      .then((r) => r.json())
      .then((d: { mentors?: CarouselMentor[] }) => {
        setMentors(d.mentors ?? []);
        // Allow animations after first paint
        requestAnimationFrame(() => requestAnimationFrame(() => setNoAnim(false)));
      })
      .catch(() => {/* ignore */});
  }, []);

  // Auto-advance
  useEffect(() => {
    if (total < 2) return;
    timerRef.current = setTimeout(() => {
      setActive((a) => (a + 1) % total);
    }, INTERVAL);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [active, total]);

  if (total === 0) {
    return (
      <div style={{ position:"fixed", inset:0, background:"#05070f", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ color:"rgba(199,210,254,0.5)", fontSize:18, fontWeight:600 }}>Loading mentors…</div>
      </div>
    );
  }

  // Slot calculation — same as new2.html
  const mid = Math.floor(total / 2);
  const slotFor = (offset: number) => {
    if (offset === 0) return "center";
    if (offset === 1 && total > 1) return "right";
    if (offset === total - 1 && total > 2) return "left";
    return offset <= mid ? "hidden-right" : "hidden-left";
  };

  const initials = (name: string) => name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div style={{ position:"fixed", inset:0, background:"#05070f", fontFamily:"'Inter',system-ui,sans-serif", WebkitFontSmoothing:"antialiased", display:"grid", gridTemplateRows:"auto 1fr auto", overflow:"hidden" }}>

      {/* Background */}
      <div style={{ position:"fixed", inset:0, background:"radial-gradient(120% 120% at 15% 0%,#0d2a66 0%,transparent 55%),radial-gradient(120% 120% at 100% 100%,#0a1c3d 0%,transparent 55%),linear-gradient(160deg,#060a1c 0%,#0a1230 55%,#04060f 100%)", overflow:"hidden" }}>
        <canvas ref={canvasRef2} style={{ position:"absolute", inset:0 }} />
        <div style={{ position:"absolute", width:"46vw", height:"46vw", top:"-14%", right:"-8%", borderRadius:"50%", background:"radial-gradient(circle,rgba(59,130,246,.9) 0%,transparent 68%)", filter:"blur(70px)", opacity:.55, mixBlendMode:"screen", animation:"mc2Drift1 24s ease-in-out infinite" }} />
        <div style={{ position:"absolute", width:"40vw", height:"40vw", bottom:"-16%", left:"-6%", borderRadius:"50%", background:"radial-gradient(circle,rgba(56,189,248,.6) 0%,transparent 68%)", filter:"blur(70px)", opacity:.55, mixBlendMode:"screen", animation:"mc2Drift2 28s ease-in-out infinite" }} />
        <div style={{ position:"absolute", width:"34vw", height:"34vw", top:"30%", left:"42%", borderRadius:"50%", background:"radial-gradient(circle,rgba(34,211,238,.35) 0%,transparent 68%)", filter:"blur(70px)", opacity:.55, mixBlendMode:"screen", animation:"mc2Drift3 32s ease-in-out infinite" }} />
        <div style={{ position:"absolute", inset:-2, backgroundImage:"linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px)", backgroundSize:"60px 60px", maskImage:"radial-gradient(120% 90% at 50% 40%,#000 30%,transparent 75%)", WebkitMaskImage:"radial-gradient(120% 90% at 50% 40%,#000 30%,transparent 75%)" }} />
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(120% 120% at 50% 45%,transparent 55%,rgba(0,0,0,.6) 100%)" }} />
      </div>

      {/* Header */}
      <header style={{ position:"relative", zIndex:2, display:"flex", justifyContent:"space-between", alignItems:"center", padding:"clamp(18px,3vh,32px) clamp(18px,4vw,40px) 0", fontFamily:"'Space Grotesk',sans-serif", fontSize:12, letterSpacing:".14em", textTransform:"uppercase", color:"#c7d2fe", opacity:.7 }}>
        <span>Mentor Session</span>
        <span style={{ display:"inline-flex", alignItems:"center", gap:8 }}>
          <span style={{ width:6, height:6, borderRadius:"50%", background:"#22d3ee", boxShadow:"0 0 10px #22d3ee", display:"inline-block", animation:"mc2LivePulse 2s ease-out infinite" }} />
          Autoplay
        </span>
        <span>2026</span>
      </header>

      {/* Stage */}
      <div style={{ position:"relative", zIndex:2, width:"100%", perspective:1500, perspectiveOrigin:"50% 35%", userSelect:"none", WebkitUserSelect:"none" }}>
        {mentors.map((mentor, i) => {
          const offset = (i - active + total) % total;
          const slot   = slotFor(offset);
          const isCenter = slot === "center";

          const CARD_W = "clamp(210px,32vw,300px)";
          const SHIFT  = "clamp(160px,27vw,270px)";

          const transforms: Record<string, string> = {
            "center":       "translate3d(0,0,0) rotateY(0deg) scale(1)",
            "right":        `translate3d(${SHIFT},0,-180px) rotateY(-16deg) scale(0.74)`,
            "left":         `translate3d(calc(${SHIFT} * -1),0,-180px) rotateY(16deg) scale(0.74)`,
            "hidden-right": `translate3d(calc(${SHIFT} * 1.75),0,-360px) rotateY(-26deg) scale(0.58)`,
            "hidden-left":  `translate3d(calc(${SHIFT} * -1.75),0,-360px) rotateY(26deg) scale(0.58)`,
          };

          return (
            <div key={mentor.id}
              onClick={() => { if (!isCenter) { setActive(i); if (timerRef.current) clearTimeout(timerRef.current); } }}
              style={{
                position:"absolute", top:0, left:"50%",
                width: CARD_W,
                marginLeft:`calc(${CARD_W} / -2)`,
                transformOrigin:"50% 40%",
                cursor: isCenter ? "default" : "pointer",
                pointerEvents: ["center","left","right"].includes(slot) ? "auto" : "none",
                transition: noAnim ? "none" : "transform 0.85s cubic-bezier(0.32,0.72,0,1), opacity 0.85s cubic-bezier(0.32,0.72,0,1), filter 0.85s cubic-bezier(0.32,0.72,0,1)",
                transform: transforms[slot] ?? transforms["hidden-right"],
                opacity: ["hidden-left","hidden-right"].includes(slot) ? 0 : 0.9,
                filter: isCenter ? "none" : "saturate(0.85)",
                zIndex: isCenter ? 10 : ["left","right"].includes(slot) ? 5 : 1,
              }}
            >
              {/* Photo card */}
              <div style={{
                position:"relative", width:"100%", height:"clamp(240px,34vw,300px)",
                borderRadius:24, overflow:"hidden",
                background:"linear-gradient(180deg,#274a8a 0%,#1c3766 100%)",
                boxShadow: isCenter
                  ? "0 50px 110px -26px rgba(0,0,0,.9),0 0 0 1px rgba(255,255,255,.14),0 0 90px -14px rgba(59,130,246,.75)"
                  : "0 40px 90px -26px rgba(0,0,0,.85),0 0 0 1px rgba(255,255,255,.1),0 0 60px -16px rgba(59,130,246,.35)",
              }}>
                {/* Shade for non-center */}
                {!isCenter && <div style={{ position:"absolute", inset:0, zIndex:1, background:"rgba(4,6,14,.55)" }} />}

                {/* Photo or initials */}
                {mentor.photoUrl
                  ? <img src={mentor.photoUrl} alt={mentor.name} style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center 25%", display:"block" }} />
                  : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"clamp(48px,7vw,80px)", fontWeight:800, color:"transparent", background:"linear-gradient(135deg,#93c5fd,#dbeafe 50%,#bfdbfe)", WebkitBackgroundClip:"text", backgroundClip:"text" }}>
                      {initials(mentor.name)}
                    </div>
                }

                {/* Gradient overlay */}
                <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom,rgba(6,10,25,.15) 0%,transparent 40%,rgba(6,10,25,.55) 100%)", pointerEvents:"none" }} />

                {/* Name at top */}
                <div style={{ position:"absolute", top:16, left:0, right:0, textAlign:"center", padding:"0 10px", zIndex:2, fontFamily:"'Sora','Inter',sans-serif", fontWeight:700, fontSize:17, color:"#fff", textShadow:"0 2px 14px rgba(0,0,0,.6)" }}>
                  {mentor.name}
                </div>

                {/* Badge at bottom — hidden on center (panel takes over) */}
                <div style={{ position:"absolute", bottom:14, left:"50%", transform:`translateX(-50%) translateY(${isCenter ? 14 : 0}px)`, opacity: isCenter ? 0 : 1, display:"inline-flex", alignItems:"center", gap:6, whiteSpace:"nowrap", background:"linear-gradient(120deg,#3b82f6,#2563eb)", border:"1px solid rgba(255,255,255,.25)", borderRadius:99, padding:"7px 16px", fontFamily:"'Space Grotesk',sans-serif", fontSize:11.5, fontWeight:600, color:"#fff", boxShadow:"0 14px 30px -12px rgba(37,99,235,.9),inset 0 1px 0 rgba(255,255,255,.3)", zIndex:2, transition:"transform 0.85s cubic-bezier(0.32,0.72,0,1),opacity 0.85s cubic-bezier(0.32,0.72,0,1)" }}>
                  {mentor.batch ?? "9th"} Batch
                </div>
              </div>

              {/* Expanded panel for center card */}
              <div style={{
                display:"grid",
                gridTemplateRows: isCenter ? "1fr" : "0fr",
                transition: noAnim ? "none" : "grid-template-rows 0.85s cubic-bezier(0.32,0.72,0,1)",
              }}>
                <div style={{ overflow:"hidden", minHeight:0 }}>
                  <div style={{
                    position:"relative", marginTop:14,
                    background:"linear-gradient(160deg,rgba(30,58,138,.32),rgba(10,16,40,.5))",
                    backdropFilter:"blur(18px) saturate(140%)", WebkitBackdropFilter:"blur(18px) saturate(140%)",
                    borderRadius:18, padding:"18px 20px 20px",
                    boxShadow:"0 24px 50px -26px rgba(0,0,0,.7),inset 0 1px 0 rgba(255,255,255,.08)",
                    opacity: isCenter ? 1 : 0,
                    transform: isCenter ? "translateY(0) scale(1)" : "translateY(-10px) scale(.97)",
                    transition: noAnim ? "none" : `opacity 0.42s cubic-bezier(0.32,0.72,0,1) ${isCenter ? "0.1s" : "0s"}, transform 0.85s cubic-bezier(0.34,1.3,0.64,1)`,
                  }}>
                    {/* Conic border */}
                    <div style={{ position:"absolute", inset:0, borderRadius:18, padding:"1.2px", background:"conic-gradient(from 45deg,#3b82f6,#22d3ee,#6366f1,#38bdf8,#3b82f6)", WebkitMask:"linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0)", WebkitMaskComposite:"xor", maskComposite:"exclude", opacity:.55, pointerEvents:"none" }} />

                    <div style={{ fontFamily:"'Space Grotesk',ui-monospace,monospace", fontSize:11, letterSpacing:".1em", textTransform:"uppercase", color:"#c7d2fe", opacity:.75, marginBottom:10, display:"flex", justifyContent:"space-between" }}>
                      <span>[{String(i + 1).padStart(2,"0")}]</span>
                      <span>{i + 1} / {total}</span>
                    </div>
                    <div style={{ fontFamily:"'Sora','Inter',sans-serif", fontSize:19, fontWeight:700, letterSpacing:"-.2px", marginBottom:4, color:"#fff" }}>
                      {mentor.name}
                    </div>
                    <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:12, color:"#38bdf8", marginBottom:8, letterSpacing:".02em" }}>
                      {mentor.batch ?? "9th"} Batch · {mentor.allocatedCount}/{mentor.capacity} mentees
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <div style={{ flex:1, height:4, background:"rgba(255,255,255,0.08)", borderRadius:99, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${Math.min((mentor.allocatedCount / Math.max(mentor.capacity, 1)) * 100, 100)}%`, background:"linear-gradient(90deg,#3b82f6,#22d3ee)", borderRadius:99, transition:"width 0.6s ease" }} />
                      </div>
                      <span style={{ fontSize:11, color:"rgba(199,210,254,0.5)", fontFamily:"ui-monospace,monospace", flexShrink:0 }}>
                        {mentor.capacity - mentor.allocatedCount} slots left
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dots + counter */}
      <div style={{ position:"relative", zIndex:3, display:"flex", alignItems:"center", justifyContent:"center", gap:18, padding:"0 18px clamp(18px,4vh,36px)" }}>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", justifyContent:"center" }}>
          {mentors.map((_, i) => (
            <div key={i} onClick={() => { setActive(i); if (timerRef.current) clearTimeout(timerRef.current); }}
              style={{
                width: i === active ? 28 : 18, height:3,
                background: i === active ? "linear-gradient(90deg,#3b82f6,#22d3ee)" : "rgba(199,210,254,.18)",
                borderRadius:2, cursor:"pointer", transition:"width 0.4s cubic-bezier(0.32,0.72,0,1), background 0.3s",
                boxShadow: i === active ? "0 0 12px rgba(59,130,246,0.7)" : "none",
              }}
            />
          ))}
        </div>
        <span style={{ fontFamily:"'Space Grotesk',ui-monospace,monospace", fontSize:11, letterSpacing:".12em", color:"#c7d2fe", opacity:.6, minWidth:"5ch", textAlign:"center" }}>
          {String(active + 1).padStart(2,"0")} / {String(total).padStart(2,"0")}
        </span>
      </div>

      <style>{`
        @keyframes mc2Drift1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-6vw,5vh) scale(1.12)} }
        @keyframes mc2Drift2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(7vw,-4vh) scale(1.15)} }
        @keyframes mc2Drift3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-5vw,-6vh) scale(0.85)} }
        @keyframes mc2LivePulse { 0%{box-shadow:0 0 0 0 rgba(34,211,238,0.6)} 70%{box-shadow:0 0 0 8px rgba(34,211,238,0)} 100%{box-shadow:0 0 0 0 rgba(34,211,238,0)} }
      `}</style>
    </div>
  );
}

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
  const [phase,      setPhase]      = useState<"enter-right" | "enter-left" | "exit-right" | "exit-left" | "idle">("enter-right");
  const [renderKey,  setRenderKey]  = useState(0);
  const [vis,        setVis]        = useState(false);
  const key = `${scene.mentor.id}-${scene.index}`;

  // Detect mentor change → exit old → enter new
  useEffect(() => {
    const isFirst = prevKeyRef.current === "";
    if (prevKeyRef.current !== key) {
      if (!isFirst) {
        // Determine direction
        const wasIdx = parseInt(prevKeyRef.current.split("-").pop() ?? "0");
        const goRight = scene.index > wasIdx;

        // Phase 1: exit current card
        setPhase(goRight ? "exit-left" : "exit-right");
        setVis(false);

        // Phase 2: after exit animation completes, swap content and enter
        const t = setTimeout(() => {
          prevKeyRef.current = key;
          setRenderKey((n) => n + 1);
          setPhase(goRight ? "enter-right" : "enter-left");
        }, 380); // matches exit duration
        return () => clearTimeout(t);
      }
      prevKeyRef.current = key;
      setRenderKey((n) => n + 1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Trigger vis shortly after each render-key change
  useEffect(() => {
    setVis(false);
    const t = setTimeout(() => setVis(true), 60);
    return () => clearTimeout(t);
  }, [renderKey]);

  const { mentor, mentees } = scene;
  const initials = mentor.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div style={{ position:"fixed", inset:0, background:"#0a0826", fontFamily:"'Inter',system-ui,sans-serif", WebkitFontSmoothing:"antialiased" }}>

      {/* ── Background ── */}
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(120% 120% at 15% 0%,#1a1550 0%,transparent 55%),radial-gradient(120% 120% at 100% 100%,#0d1b2a 0%,transparent 55%),linear-gradient(160deg,#0a0826 0%,#120f38 55%,#070714 100%)", overflow:"hidden" }}>
        <canvas ref={canvasRef} style={{ position:"absolute", inset:0 }} />
        <div style={{ position:"absolute", width:"46vw", height:"46vw", top:"-14%", right:"-8%", borderRadius:"50%", background:"radial-gradient(circle,rgba(99,102,241,0.9) 0%,transparent 68%)", filter:"blur(70px)", opacity:0.55, mixBlendMode:"screen", animation:"mcDrift1 22s ease-in-out infinite" }} />
        <div style={{ position:"absolute", width:"40vw", height:"40vw", bottom:"-16%", left:"-6%", borderRadius:"50%", background:"radial-gradient(circle,rgba(168,85,247,0.75) 0%,transparent 68%)", filter:"blur(70px)", opacity:0.55, mixBlendMode:"screen", animation:"mcDrift2 26s ease-in-out infinite" }} />
        <div style={{ position:"absolute", width:"34vw", height:"34vw", top:"30%", left:"42%", borderRadius:"50%", background:"radial-gradient(circle,rgba(34,211,238,0.4) 0%,transparent 68%)", filter:"blur(70px)", opacity:0.55, mixBlendMode:"screen", animation:"mcDrift3 30s ease-in-out infinite" }} />
        <div style={{ position:"absolute", width:"26vw", height:"26vw", bottom:"6%", right:"20%", borderRadius:"50%", background:"radial-gradient(circle,rgba(124,92,245,0.45) 0%,transparent 68%)", filter:"blur(70px)", opacity:0.55, mixBlendMode:"screen", animation:"mcDrift1 34s ease-in-out infinite reverse" }} />
        <div style={{ position:"absolute", inset:-2, backgroundImage:"linear-gradient(rgba(255,255,255,0.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.035) 1px,transparent 1px)", backgroundSize:"60px 60px", maskImage:"radial-gradient(120% 90% at 50% 40%,#000 30%,transparent 75%)", WebkitMaskImage:"radial-gradient(120% 90% at 50% 40%,#000 30%,transparent 75%)" }} />
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(120% 120% at 50% 45%,transparent 55%,rgba(0,0,0,0.6) 100%)", pointerEvents:"none" }} />
      </div>

      {/* ── Scene ── */}
      <div style={{ position:"relative", zIndex:2, width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", padding:"5vh 5vw", perspective:1600 }}>
        <div className={`mc-card mc-${phase} ${vis ? "mc-vis" : ""}`}
          style={{ position:"relative", width:"min(1180px,92vw)", display:"flex", alignItems:"center" }}>

          {/* ── LEFT: Portrait card ── */}
          <div style={{
            position:"relative", zIndex:3, flexShrink:0,
            width:"clamp(240px,27vw,400px)", aspectRatio:"400/580", maxHeight:"84vh",
            borderRadius:"clamp(28px,3vw,46px)", overflow:"hidden",
            background:"linear-gradient(180deg,#86b6ea 0%,#a8cdf0 55%,#cbd9f4 100%)",
            boxShadow:"0 50px 120px -30px rgba(0,0,0,0.85),0 0 0 1px rgba(255,255,255,0.18),0 0 80px -20px rgba(124,92,245,0.6)",
            animation:"mcPortraitFloat 7s ease-in-out infinite",
          }}>
            {/* Halo glow behind portrait */}
            <div style={{ position:"absolute", inset:"-6%", borderRadius:"50%", background:"radial-gradient(circle,rgba(124,92,245,0.55) 0%,transparent 65%)", filter:"blur(30px)", animation:"mcHalo 3.4s ease-in-out infinite", pointerEvents:"none" }} />

            {mentor.photoUrl
              ? <img src={mentor.photoUrl} alt={mentor.name} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", objectPosition:"center 30%", display:"block", transform:"scale(1.02)" }} />
              : <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Sora','Inter',sans-serif", fontSize:"clamp(64px,8vw,120px)", fontWeight:800, color:"transparent", background:"linear-gradient(135deg,#ffffff,#e9e4ff 50%,#c4b5fd)", WebkitBackgroundClip:"text", backgroundClip:"text" }}>{initials}</div>
            }

            {/* Scrims */}
            <div style={{ position:"absolute", inset:"0 0 auto 0", height:"46%", background:"linear-gradient(to bottom,rgba(40,30,110,0.55) 0%,rgba(40,30,110,0.25) 45%,transparent 100%)", pointerEvents:"none" }} />
            <div style={{ position:"absolute", inset:"auto 0 0 0", height:"32%", background:"linear-gradient(to top,rgba(20,15,60,0.55),transparent)", pointerEvents:"none" }} />

            {/* Sheen sweep */}
            <div style={{ position:"absolute", inset:0, background:"linear-gradient(115deg,transparent 30%,rgba(255,255,255,0.18) 48%,transparent 66%)", backgroundSize:"250% 100%", animation:"mcSheen 7s ease-in-out infinite", pointerEvents:"none" }} />

            {/* Name + ID at top */}
            <div style={{ position:"absolute", top:"clamp(20px,3.4vh,38px)", left:0, right:0, textAlign:"center", padding:"0 18px", display:"flex", flexDirection:"column", gap:6, zIndex:2 }}>
              <div style={{ fontFamily:"'Sora','Inter',sans-serif", fontSize:"clamp(18px,2.3vw,30px)", fontWeight:700, lineHeight:1.15, letterSpacing:"-0.4px", color:"#fff", textShadow:"0 2px 18px rgba(20,10,60,0.55)" }}>
                {mentor.name}
              </div>
              {mentor.studentId && (
                <div style={{ fontFamily:"ui-monospace,monospace", fontSize:"clamp(11px,1.2vw,16px)", letterSpacing:"0.6px", color:"rgba(255,255,255,0.9)", textShadow:"0 2px 12px rgba(20,10,60,0.5)" }}>
                  {mentor.studentId}
                </div>
              )}
            </div>

            {/* Badge at bottom */}
            {/* <div style={{ position:"absolute", bottom:"clamp(18px,3vh,30px)", left:"50%", transform:"translateX(-50%)", display:"inline-flex", alignItems:"center", gap:10, whiteSpace:"nowrap", background:"linear-gradient(120deg,#7b5cf6,#6d4de0)", border:"1px solid rgba(255,255,255,0.28)", borderRadius:99, padding:"clamp(7px,1.1vh,11px) clamp(14px,1.8vw,22px)", fontSize:"clamp(12px,1.2vw,16px)", fontWeight:600, color:"#fff", boxShadow:"0 14px 34px -12px rgba(109,77,224,0.9),inset 0 1px 0 rgba(255,255,255,0.3)", zIndex:2 }}>
              <span style={{ width:7, height:7, borderRadius:"50%", background:"#34d399", animation:"mcLivePulse 2s ease-out infinite", flexShrink:0, display:"inline-block" }} />
              {mentor.batch ?? "9th"} Batch · {mentor.communicationMethod}
            </div> */}

            {/* Position indicator */}
            <div style={{ position:"absolute", top:"50%", right:12, transform:"translateY(-50%)", fontSize:"clamp(10px,0.9vw,13px)", color:"rgba(255,255,255,0.35)", letterSpacing:1, writingMode:"vertical-rl", textOrientation:"mixed", zIndex:2 }}>
              {scene.index + 1} / {scene.total}
            </div>
          </div>

          {/* ── RIGHT: Glass panel ── */}
          <div style={{
            position:"relative", zIndex:2, flex:1, minWidth:0,
            alignSelf:"center",
            height:"clamp(360px,68vh,520px)",
            marginLeft:"clamp(-24px,-2vw,-14px)",
            padding:"clamp(30px,5vh,56px) clamp(30px,4vw,60px) clamp(30px,5vh,56px) clamp(60px,7vw,110px)",
            borderRadius:24,
            background:"linear-gradient(160deg,rgba(60,40,140,0.28),rgba(20,15,60,0.35))",
            backdropFilter:"blur(24px) saturate(140%)", WebkitBackdropFilter:"blur(24px) saturate(140%)",
            boxShadow:"0 40px 110px -30px rgba(0,0,0,0.8),inset 0 1px 0 rgba(255,255,255,0.1)",
            display:"flex", flexDirection:"column", justifyContent:"center",
            gap:"clamp(14px,2.2vh,24px)",
          }}>
            {/* Static conic border on panel */}
            <div style={{ position:"absolute", inset:0, borderRadius:24, padding:"1.5px", background:"conic-gradient(from 45deg,#7c5cf5,#a855f7,#ec4899,#22d3ee,#6366f1,#7c5cf5)", WebkitMask:"linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0)", WebkitMaskComposite:"xor", maskComposite:"exclude", opacity:0.65, pointerEvents:"none" }} />
            {/* Sheen */}
            <div style={{ position:"absolute", inset:0, borderRadius:24, background:"linear-gradient(115deg,transparent 30%,rgba(255,255,255,0.07) 48%,transparent 66%)", backgroundSize:"250% 100%", animation:"mcSheen 7s ease-in-out infinite 1.2s", pointerEvents:"none" }} />

            {/* Header */}
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:"clamp(6px,1.2vh,12px)" }}>
              <div style={{ fontFamily:"'Space Grotesk','Inter',sans-serif", fontSize:"clamp(13px,1.25vw,17px)", fontWeight:600, letterSpacing:"3.5px", textTransform:"uppercase", color:"#f1f0ff", whiteSpace:"nowrap" }}>
                Assigned Mentees
              </div>
              <div style={{ fontFamily:"'Sora','Inter',sans-serif", fontSize:"clamp(11px,1vw,14px)", fontWeight:700, color:"#fff", background:"linear-gradient(135deg,rgba(124,92,245,0.6),rgba(109,77,224,0.5))", border:"1px solid rgba(199,210,254,0.35)", borderRadius:99, padding:"3px 11px", boxShadow:"0 6px 18px -8px rgba(124,92,245,0.9)" }}>
                {mentees.length}
              </div>
              <div style={{ flex:1, height:1, background:"linear-gradient(to right,rgba(165,180,252,0.35),transparent)" }} />
            </div>

            {/* Mentee rows */}
            {mentees.length === 0 ? (
              <div style={{ fontSize:"clamp(13px,1.4vw,17px)", color:"rgba(199,210,254,0.45)", padding:20, textAlign:"center", border:"1px dashed rgba(199,210,254,0.2)", borderRadius:16 }}>
                No mentees assigned yet
              </div>
            ) : mentees.map((mentee, i) => (
              <div key={mentee.studentId} style={{
                position:"relative", display:"flex", alignItems:"center",
                gap:"clamp(14px,1.8vw,26px)",
                background:"rgba(255,255,255,0.045)", border:"1px solid rgba(255,255,255,0.09)",
                borderRadius:18, padding:"clamp(13px,1.9vh,20px) clamp(18px,2.2vw,30px) clamp(13px,1.9vh,20px) clamp(22px,2.4vw,32px)",
                overflow:"hidden",
                opacity: vis ? 1 : 0,
                transform: vis ? "translateX(0)" : "translateX(26px)",
                transition: `opacity 0.55s cubic-bezier(0.16,1,0.3,1) ${0.18 + i*0.11}s, transform 0.55s cubic-bezier(0.34,1.56,0.64,1) ${0.18 + i*0.11}s`,
              }}>
                {/* Left accent bar */}
                <div style={{ position:"absolute", left:0, top:0, bottom:0, width:3, background:"linear-gradient(to bottom,#7b5cf6,#a855f7)", boxShadow:"0 0 14px rgba(168,85,247,0.7)", transform: vis ? "scaleY(1)" : "scaleY(0)", transformOrigin:"top", transition:`transform 0.4s cubic-bezier(0.16,1,0.3,1) ${0.3+i*0.11}s` }} />
                {/* Number badge */}
                <div style={{ width:"clamp(38px,3.4vw,52px)", height:"clamp(38px,3.4vw,52px)", borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Sora','Inter',sans-serif", fontSize:"clamp(15px,1.5vw,21px)", fontWeight:700, color:"#fff", background:"linear-gradient(135deg,#7b5cf6,#6d4de0)", border:"1px solid rgba(199,210,254,0.35)", boxShadow:"0 8px 22px -6px rgba(109,77,224,0.9),inset 0 1px 0 rgba(255,255,255,0.28)" }}>
                  {i + 1}
                </div>
                <div>
                  <div style={{ fontFamily:"'Sora','Inter',sans-serif", fontSize:"clamp(16px,1.7vw,24px)", fontWeight:600, color:"#f7f6ff", letterSpacing:"-0.2px" }}>
                    {mentee.name}
                  </div>
                  <div style={{ fontFamily:"ui-monospace,monospace", fontSize:"clamp(11px,1.05vw,15px)", color:"rgba(199,210,254,0.6)", marginTop:4, letterSpacing:"0.6px" }}>
                    {mentee.studentId}
                  </div>
                </div>
                <div style={{ marginLeft:"auto", color:"rgba(199,210,254,0.45)", fontSize:"clamp(20px,1.8vw,26px)" }}>→</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes mcDrift1  { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-6vw,5vh) scale(1.12)} }
        @keyframes mcDrift2  { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(7vw,-4vh) scale(1.15)} }
        @keyframes mcDrift3  { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-5vw,-6vh) scale(0.85)} }
        @keyframes mcSheen   { 0%{background-position:160% 0} 55%{background-position:-60% 0} 100%{background-position:-60% 0} }
        @keyframes mcHalo    { 0%,100%{opacity:0.5;transform:scale(1)} 50%{opacity:0.9;transform:scale(1.05)} }
        @keyframes mcLivePulse { 0%{box-shadow:0 0 0 0 rgba(52,211,153,0.6)} 70%{box-shadow:0 0 0 8px rgba(52,211,153,0)} 100%{box-shadow:0 0 0 0 rgba(52,211,153,0)} }
        @keyframes mcPortraitFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes mcCardIn      { from{opacity:0;transform:translateY(28px) scale(0.96)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes mcExitLeft    { from{opacity:1;transform:translateX(0) scale(1)} to{opacity:0;transform:translateX(-60px) scale(0.94)} }
        @keyframes mcExitRight   { from{opacity:1;transform:translateX(0) scale(1)} to{opacity:0;transform:translateX(60px) scale(0.94)} }
        @keyframes mcEnterRight  { from{opacity:0;transform:translateX(60px) scale(0.94)} to{opacity:1;transform:translateX(0) scale(1)} }
        @keyframes mcEnterLeft   { from{opacity:0;transform:translateX(-60px) scale(0.94)} to{opacity:1;transform:translateX(0) scale(1)} }

        .mc-card { opacity:0; animation: mcCardIn 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s forwards; }
        .mc-card.mc-exit-left   { animation: mcExitLeft  0.35s cubic-bezier(0.4,0,1,1) forwards; }
        .mc-card.mc-exit-right  { animation: mcExitRight 0.35s cubic-bezier(0.4,0,1,1) forwards; }
        .mc-card.mc-enter-right.mc-vis { animation: mcEnterRight 0.55s cubic-bezier(0.16,1,0.3,1) forwards; }
        .mc-card.mc-enter-left.mc-vis  { animation: mcEnterLeft  0.55s cubic-bezier(0.16,1,0.3,1) forwards; }
        .mc-card.mc-idle { opacity:0; }
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
      {scene.type === "idle"               && <IdleScene />}
      {scene.type === "thankyou"           && <ThankYouScene />}
      {scene.type === "live-registrations" && <LiveRegistrationsScene />}
      {scene.type === "mentor-carousel"    && <MentorCarouselScene />}
      {scene.type === "allocation"         && <AllocationScene scene={scene} />}
      {scene.type === "results"     && <ResultsScene   scene={scene} />}
      {scene.type === "custom"      && <CustomScene    scene={scene} />}
      {scene.type === "mentor-card" && <MentorCardScene scene={scene} />}
    </div>
  );
}
