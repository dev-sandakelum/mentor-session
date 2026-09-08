"use client";
import React, { useEffect, useRef, useState } from "react";
import type { DisplayScene } from "@/lib/display-state";
import { useParticleCanvas } from "./useParticleCanvas";

export interface CarouselMentor {
  id: string;
  name: string;
  batch: string | null;
  photoUrl: string | null;
  allocatedCount: number;
  capacity: number;
}

export function MentorCarouselScene({ scene }: { scene: Extract<DisplayScene, { type: "mentor-carousel" }> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useParticleCanvas(canvasRef);

  const [mentors,  setMentors]  = useState<CarouselMentor[]>([]);
  const [active,   setActive]   = useState(0);
  const [noAnim,   setNoAnim]   = useState(true);
  const [paused,   setPaused]   = useState(false);
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(0);
  const pausedRef = useRef(false);
  const totalRef  = useRef(0);

  const INTERVAL = 3500;

  useEffect(() => { activeRef.current = active; }, [active]);
  useEffect(() => { pausedRef.current = paused;  }, [paused]);

  // Load mentors once
  useEffect(() => {
    fetch("/api/display/mentors")
      .then(r => r.json())
      .then((d: { mentors?: CarouselMentor[] }) => {
        const list = d.mentors ?? [];
        setMentors(list);
        totalRef.current = list.length;
        requestAnimationFrame(() => requestAnimationFrame(() => setNoAnim(false)));
      })
      .catch(() => {/* ignore */});
  }, []);

  // Auto-advance
  useEffect(() => {
    const schedule = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        const t = totalRef.current;
        if (!pausedRef.current && t > 1) {
          setActive(a => {
            const safe = Number.isFinite(a) ? a : 0;
            const n = (safe + 1) % t;
            activeRef.current = n;
            return n;
          });
        }
        schedule();
      }, INTERVAL);
    };
    schedule();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Remote control
  const prevSeq = useRef<number | undefined>(undefined);
  useEffect(() => {
    const ctrl = scene.control;
    const seq  = scene.seq ?? 0;
    if (!ctrl) return;
    if (seq === prevSeq.current) return;
    prevSeq.current = seq;
    const t = totalRef.current;
    if (t < 1) return;
    if (ctrl === "next")  { activeRef.current = (activeRef.current + 1) % t;          setActive(activeRef.current); }
    if (ctrl === "prev")  { activeRef.current = (activeRef.current - 1 + t) % t;      setActive(activeRef.current); }
    if (ctrl === "pause") { setPaused(true);  pausedRef.current = true; }
    if (ctrl === "play")  { setPaused(false); pausedRef.current = false; }
    if (ctrl === "stop")  { activeRef.current = 0; setActive(0); setPaused(true); pausedRef.current = true; }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene.seq, scene.control]);

  const total      = mentors.length;
  const safeActive = Number.isFinite(active) ? ((active % total) + total) % total : 0;

  if (total === 0) {
    return (
      <div style={{ position:"fixed", inset:0, background:"#05070f", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ color:"rgba(199,210,254,0.5)", fontSize:18, fontWeight:600 }}>Loading mentors…</div>
      </div>
    );
  }

  const mid      = Math.floor(total / 2);
  const slotFor  = (offset: number) => {
    if (offset === 0)                         return "center";
    if (offset === 1 && total > 1)            return "right";
    if (offset === total - 1 && total > 2)    return "left";
    return offset <= mid ? "hidden-right" : "hidden-left";
  };
  const initials = (name: string) => name.split(" ").map(w => w[0]).slice(0,2).join("").toUpperCase();

  const CARD_W     = "clamp(280px,38vw,420px)";
  const CENTER_H   = "clamp(340px,44vw,500px)";
  const SHIFT      = "clamp(200px,32vw,360px)";
  const SIDE_SCALE = 0.70;

  return (
    <div style={{ position:"fixed", inset:0, background:"#05070f", fontFamily:"'Sora','Inter',system-ui,sans-serif", WebkitFontSmoothing:"antialiased", display:"flex", flexDirection:"column", overflow:"hidden" }}>

      {/* Background */}
      <div style={{ position:"fixed", inset:0, background:"radial-gradient(120% 120% at 15% 0%,#0d2a66 0%,transparent 55%),radial-gradient(120% 120% at 100% 100%,#0a1c3d 0%,transparent 55%),linear-gradient(160deg,#060a1c 0%,#0a1230 55%,#04060f 100%)", overflow:"hidden" }}>
        <canvas ref={canvasRef} style={{ position:"absolute", inset:0 }} />
        <div style={{ position:"absolute", width:"46vw", height:"46vw", top:"-14%", right:"-8%",  borderRadius:"50%", background:"radial-gradient(circle,rgba(59,130,246,.9) 0%,transparent 68%)",  filter:"blur(70px)", opacity:.55, mixBlendMode:"screen", animation:"mc2Drift1 24s ease-in-out infinite" }} />
        <div style={{ position:"absolute", width:"40vw", height:"40vw", bottom:"-16%", left:"-6%", borderRadius:"50%", background:"radial-gradient(circle,rgba(56,189,248,.6) 0%,transparent 68%)",  filter:"blur(70px)", opacity:.55, mixBlendMode:"screen", animation:"mc2Drift2 28s ease-in-out infinite" }} />
        <div style={{ position:"absolute", width:"34vw", height:"34vw", top:"30%", left:"42%",     borderRadius:"50%", background:"radial-gradient(circle,rgba(34,211,238,.35) 0%,transparent 68%)", filter:"blur(70px)", opacity:.55, mixBlendMode:"screen", animation:"mc2Drift3 32s ease-in-out infinite" }} />
        <div style={{ position:"absolute", inset:-2, backgroundImage:"linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px)", backgroundSize:"60px 60px", maskImage:"radial-gradient(120% 90% at 50% 40%,#000 30%,transparent 75%)", WebkitMaskImage:"radial-gradient(120% 90% at 50% 40%,#000 30%,transparent 75%)" }} />
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(120% 120% at 50% 45%,transparent 55%,rgba(0,0,0,.6) 100%)" }} />
      </div>

      {/* Header */}
      <header style={{ position:"relative", zIndex:2, flexShrink:0, display:"flex", justifyContent:"space-between", alignItems:"center", padding:"clamp(18px,3vh,32px) clamp(18px,4vw,40px) 0", fontFamily:"'Space Grotesk',sans-serif", fontSize:"clamp(11px,1.1vw,14px)", letterSpacing:".14em", textTransform:"uppercase", color:"#c7d2fe", opacity:.7 }}>
        <span>Mentor Session</span>
        <div style={{ display:"inline-flex", alignItems:"center", gap:8 }}>
          {paused && <span style={{ fontSize:"clamp(9px,0.9vw,12px)", letterSpacing:".1em", color:"rgba(199,210,254,0.45)" }}>PAUSED</span>}
          {!paused && <span style={{ width:6, height:6, borderRadius:"50%", background:"#22d3ee", boxShadow:"0 0 10px #22d3ee", display:"inline-block", animation:"mc2LivePulse 2s ease-out infinite" }} />}
        </div>
        <span>2026</span>
      </header>

      {/* Stage */}
      <div style={{ position:"relative", zIndex:2, flex:1, perspective:1500, perspectiveOrigin:"50% 40%", userSelect:"none", WebkitUserSelect:"none", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ position:"relative", width:0, height:0 }}>
          {mentors.map((mentor, i) => {
            const offset = (i - safeActive + total) % total;
            const slot   = slotFor(offset);
            const isCenter = slot === "center";
            const isHidden = slot === "hidden-left" || slot === "hidden-right";

            const transforms: Record<string, string> = {
              "center":       "translate3d(0,0,0) rotateY(0deg) scale(1)",
              "right":        `translate3d(${SHIFT},0,-200px) rotateY(-16deg) scale(${SIDE_SCALE})`,
              "left":         `translate3d(calc(${SHIFT} * -1),0,-200px) rotateY(16deg) scale(${SIDE_SCALE})`,
              "hidden-right": `translate3d(calc(${SHIFT} * 1.8),0,-400px) rotateY(-26deg) scale(0.48)`,
              "hidden-left":  `translate3d(calc(${SHIFT} * -1.8),0,-400px) rotateY(26deg) scale(0.48)`,
            };

            return (
              <div key={mentor.id}
                onClick={() => { if (!isCenter) setActive(i); }}
                style={{
                  position:"absolute", top:0, left:0,
                  width: CARD_W,
                  transform:`translateX(calc(${CARD_W} / -2)) translateY(-50%) ${transforms[slot] ?? transforms["hidden-right"]}`,
                  transformOrigin:"50% 40%",
                  willChange:"transform,opacity,filter",
                  cursor: isCenter ? "default" : "pointer",
                  pointerEvents: isHidden ? "none" : "auto",
                  transition: noAnim ? "none" : "transform 0.72s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.72s cubic-bezier(0.25,0.46,0.45,0.94), filter 0.72s cubic-bezier(0.25,0.46,0.45,0.94)",
                  opacity: isHidden ? 0 : isCenter ? 1 : 0.82,
                  filter: isCenter ? "none" : "saturate(0.75) brightness(0.85)",
                  zIndex: isCenter ? 10 : ["left","right"].includes(slot) ? 5 : 1,
                }}
              >
                {/* Photo */}
                <div style={{
                  position:"relative", width:"100%", height: CENTER_H,
                  borderRadius:28, overflow:"hidden",
                  background:"linear-gradient(180deg,#274a8a 0%,#1c3766 100%)",
                  boxShadow: isCenter
                    ? "0 60px 130px -26px rgba(0,0,0,.95),0 0 0 1px rgba(255,255,255,.16),0 0 100px -14px rgba(59,130,246,.85)"
                    : "0 32px 70px -20px rgba(0,0,0,.8),0 0 0 1px rgba(255,255,255,.09)",
                  transition: noAnim ? "none" : "box-shadow 0.72s cubic-bezier(0.25,0.46,0.45,0.94)",
                }}>
                  {!isCenter && <div style={{ position:"absolute", inset:0, zIndex:1, background:"rgba(4,6,14,.45)" }} />}
                  {mentor.photoUrl
                    ? <img src={mentor.photoUrl} alt={mentor.name} style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center 20%", display:"block" }} />
                    : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"clamp(52px,8vw,96px)", fontWeight:800, color:"transparent", background:"linear-gradient(135deg,#93c5fd,#dbeafe 50%,#bfdbfe)", WebkitBackgroundClip:"text", backgroundClip:"text" }}>
                        {initials(mentor.name)}
                      </div>
                  }
                  <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom,rgba(6,10,25,.1) 0%,transparent 35%,rgba(6,10,25,.6) 100%)", pointerEvents:"none" }} />
                  {/* Batch badge for side cards */}
                  <div style={{
                    position:"absolute", bottom:16, left:"50%",
                    transform:`translateX(-50%) translateY(${isCenter ? 20 : 0}px)`,
                    opacity: isCenter ? 0 : 1, zIndex:2,
                    display:"inline-flex", alignItems:"center", gap:6, whiteSpace:"nowrap",
                    background:"linear-gradient(120deg,#3b82f6,#2563eb)",
                    border:"1px solid rgba(255,255,255,.25)", borderRadius:99, padding:"8px 18px",
                    fontFamily:"'Space Grotesk',sans-serif", fontSize:"clamp(12px,1.15vw,15px)", fontWeight:600, color:"#fff",
                    boxShadow:"0 14px 30px -12px rgba(37,99,235,.9),inset 0 1px 0 rgba(255,255,255,.3)",
                    transition: noAnim ? "none" : "transform 0.72s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.72s cubic-bezier(0.25,0.46,0.45,0.94)",
                  }}>
                    {mentor.batch ?? "9th"} Batch
                  </div>
                </div>

                {/* Info panel (grid-row expand trick) */}
                <div style={{ display:"grid", gridTemplateRows: isCenter ? "1fr" : "0fr", transition: noAnim ? "none" : "grid-template-rows 0.72s cubic-bezier(0.25,0.46,0.45,0.94)" }}>
                  <div style={{ overflow:"hidden", minHeight:0 }}>
                    <div style={{
                      position:"relative", marginTop:16,
                      background:"linear-gradient(160deg,rgba(30,58,138,.32),rgba(10,16,40,.5))",
                      backdropFilter:"blur(18px) saturate(140%)", WebkitBackdropFilter:"blur(18px) saturate(140%)",
                      borderRadius:20, padding:"20px 24px 22px",
                      boxShadow:"0 24px 50px -26px rgba(0,0,0,.7),inset 0 1px 0 rgba(255,255,255,.08)",
                      opacity: isCenter ? 1 : 0,
                      transform: isCenter ? "translateY(0) scale(1)" : "translateY(-8px) scale(.98)",
                      transition: noAnim ? "none" : `opacity 0.38s cubic-bezier(0.25,0.46,0.45,0.94) ${isCenter ? "0.08s" : "0s"}, transform 0.72s cubic-bezier(0.25,0.46,0.45,0.94)`,
                    }}>
                      <div style={{ position:"absolute", inset:0, borderRadius:20, padding:"1.2px", background:"conic-gradient(from 45deg,#3b82f6,#22d3ee,#6366f1,#38bdf8,#3b82f6)", WebkitMask:"linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0)", WebkitMaskComposite:"xor", maskComposite:"exclude", opacity:.5, pointerEvents:"none" }} />
                      <div style={{ fontFamily:"'Space Grotesk',ui-monospace,monospace", fontSize:"clamp(11px,1vw,14px)", letterSpacing:".12em", textTransform:"uppercase", color:"#c7d2fe", opacity:.75, marginBottom:12, display:"flex", justifyContent:"space-between" }}>
                        <span>[{String(i+1).padStart(2,"0")}]</span>
                        <span>{i+1} / {total}</span>
                      </div>
                      <div style={{ fontFamily:"'Sora','Inter',sans-serif", fontSize:"clamp(22px,2.4vw,32px)", fontWeight:700, letterSpacing:"-.4px", lineHeight:1.15, marginBottom:6, color:"#fff", textShadow:"0 2px 20px rgba(59,130,246,0.3)" }}>
                        {mentor.name}
                      </div>
                      <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:"clamp(13px,1.25vw,17px)", color:"#38bdf8", fontWeight:600, letterSpacing:".04em" }}>
                        {mentor.batch ?? "9th"} Batch
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dots + counter */}
      <div style={{ position:"relative", zIndex:3, display:"flex", alignItems:"center", justifyContent:"center", gap:18, padding:"0 18px clamp(18px,4vh,36px)" }}>
        <div style={{ display:"flex", gap:7, flexWrap:"wrap", justifyContent:"center" }}>
          {mentors.map((_, i) => (
            <div key={i} onClick={() => setActive(i)}
              style={{ width: i===safeActive ? 32 : 20, height:4, background: i===safeActive ? "linear-gradient(90deg,#3b82f6,#22d3ee)" : "rgba(199,210,254,.18)", borderRadius:2, cursor:"pointer", transition:"width 0.4s cubic-bezier(0.25,0.46,0.45,0.94), background 0.3s", boxShadow: i===safeActive ? "0 0 14px rgba(59,130,246,0.75)" : "none" }}
            />
          ))}
        </div>
        <span style={{ fontFamily:"'Space Grotesk',ui-monospace,monospace", fontSize:"clamp(11px,1vw,14px)", letterSpacing:".12em", color:"#c7d2fe", opacity:.6, minWidth:"5ch", textAlign:"center" }}>
          {String(safeActive+1).padStart(2,"0")} / {String(total).padStart(2,"0")}
        </span>
      </div>

      <style>{`
        @keyframes mc2Drift1    { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-6vw,5vh) scale(1.12)} }
        @keyframes mc2Drift2    { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(7vw,-4vh) scale(1.15)} }
        @keyframes mc2Drift3    { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-5vw,-6vh) scale(0.85)} }
        @keyframes mc2LivePulse { 0%{box-shadow:0 0 0 0 rgba(34,211,238,0.6)} 70%{box-shadow:0 0 0 8px rgba(34,211,238,0)} 100%{box-shadow:0 0 0 0 rgba(34,211,238,0)} }
      `}</style>
    </div>
  );
}
