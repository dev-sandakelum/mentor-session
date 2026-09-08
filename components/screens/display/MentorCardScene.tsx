"use client";
import React, { useEffect, useRef, useState } from "react";
import type { DisplayScene } from "@/lib/display-state";
import { useParticleCanvas } from "./useParticleCanvas";

export function MentorCardScene({ scene }: { scene: Extract<DisplayScene, { type: "mentor-card" }> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useParticleCanvas(canvasRef);

  const prevKeyRef  = useRef("");
  const [phase,     setPhase]     = useState<"enter-right"|"enter-left"|"exit-right"|"exit-left"|"idle">("enter-right");
  const [renderKey, setRenderKey] = useState(0);
  const [vis,       setVis]       = useState(false);

  const key = `${scene.mentor.id}-${scene.index}`;

  // Detect mentor change → exit old → enter new
  useEffect(() => {
    const isFirst = prevKeyRef.current === "";
    if (prevKeyRef.current !== key) {
      if (!isFirst) {
        const wasIdx = parseInt(prevKeyRef.current.split("-").pop() ?? "0");
        const goRight = scene.index > wasIdx;
        setPhase(goRight ? "exit-left" : "exit-right");
        setVis(false);
        const t = setTimeout(() => {
          prevKeyRef.current = key;
          setRenderKey(n => n + 1);
          setPhase(goRight ? "enter-right" : "enter-left");
        }, 380);
        return () => clearTimeout(t);
      }
      prevKeyRef.current = key;
      setRenderKey(n => n + 1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Trigger vis after each render-key change
  useEffect(() => {
    setVis(false);
    const t = setTimeout(() => setVis(true), 60);
    return () => clearTimeout(t);
  }, [renderKey]);

  const { mentor, mentees } = scene;
  const initials = mentor.name.split(" ").map((w: string) => w[0]).slice(0,2).join("").toUpperCase();

  return (
    <div style={{ position:"fixed", inset:0, background:"#0a0826", fontFamily:"'Inter',system-ui,sans-serif", WebkitFontSmoothing:"antialiased" }}>

      {/* Background */}
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(120% 120% at 15% 0%,#1a1550 0%,transparent 55%),radial-gradient(120% 120% at 100% 100%,#0d1b2a 0%,transparent 55%),linear-gradient(160deg,#0a0826 0%,#120f38 55%,#070714 100%)", overflow:"hidden" }}>
        <canvas ref={canvasRef} style={{ position:"absolute", inset:0 }} />
        <div style={{ position:"absolute", width:"46vw", height:"46vw", top:"-14%", right:"-8%",    borderRadius:"50%", background:"radial-gradient(circle,rgba(99,102,241,0.9) 0%,transparent 68%)",   filter:"blur(70px)", opacity:0.55, mixBlendMode:"screen", animation:"mcDrift1 22s ease-in-out infinite" }} />
        <div style={{ position:"absolute", width:"40vw", height:"40vw", bottom:"-16%", left:"-6%",  borderRadius:"50%", background:"radial-gradient(circle,rgba(168,85,247,0.75) 0%,transparent 68%)",  filter:"blur(70px)", opacity:0.55, mixBlendMode:"screen", animation:"mcDrift2 26s ease-in-out infinite" }} />
        <div style={{ position:"absolute", width:"34vw", height:"34vw", top:"30%", left:"42%",      borderRadius:"50%", background:"radial-gradient(circle,rgba(34,211,238,0.4) 0%,transparent 68%)",   filter:"blur(70px)", opacity:0.55, mixBlendMode:"screen", animation:"mcDrift3 30s ease-in-out infinite" }} />
        <div style={{ position:"absolute", width:"26vw", height:"26vw", bottom:"6%", right:"20%",   borderRadius:"50%", background:"radial-gradient(circle,rgba(124,92,245,0.45) 0%,transparent 68%)",  filter:"blur(70px)", opacity:0.55, mixBlendMode:"screen", animation:"mcDrift1 34s ease-in-out infinite reverse" }} />
        <div style={{ position:"absolute", inset:-2, backgroundImage:"linear-gradient(rgba(255,255,255,0.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.035) 1px,transparent 1px)", backgroundSize:"60px 60px", maskImage:"radial-gradient(120% 90% at 50% 40%,#000 30%,transparent 75%)", WebkitMaskImage:"radial-gradient(120% 90% at 50% 40%,#000 30%,transparent 75%)" }} />
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(120% 120% at 50% 45%,transparent 55%,rgba(0,0,0,0.6) 100%)", pointerEvents:"none" }} />
      </div>

      {/* Scene */}
      <div style={{ position:"relative", zIndex:2, width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", padding:"5vh 5vw", perspective:1600 }}>
        <div className={`mc-card mc-${phase} ${vis ? "mc-vis" : ""}`}
          style={{ position:"relative", width:"min(1180px,92vw)", display:"flex", alignItems:"center" }}>

          {/* Portrait card */}
          <div style={{
            position:"relative", zIndex:3, flexShrink:0,
            width:"clamp(240px,27vw,400px)", aspectRatio:"400/580", maxHeight:"84vh",
            borderRadius:"clamp(28px,3vw,46px)", overflow:"hidden",
            background:"linear-gradient(180deg,#86b6ea 0%,#a8cdf0 55%,#cbd9f4 100%)",
            boxShadow:"0 50px 120px -30px rgba(0,0,0,0.85),0 0 0 1px rgba(255,255,255,0.18),0 0 80px -20px rgba(124,92,245,0.6)",
            animation:"mcPortraitFloat 7s ease-in-out infinite",
          }}>
            <div style={{ position:"absolute", inset:"-6%", borderRadius:"50%", background:"radial-gradient(circle,rgba(124,92,245,0.55) 0%,transparent 65%)", filter:"blur(30px)", animation:"mcHalo 3.4s ease-in-out infinite", pointerEvents:"none" }} />

            {mentor.photoUrl
              ? <img src={mentor.photoUrl} alt={mentor.name} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", objectPosition:"center 30%", display:"block", transform:"scale(1.02)" }} />
              : <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Sora','Inter',sans-serif", fontSize:"clamp(64px,8vw,120px)", fontWeight:800, color:"transparent", background:"linear-gradient(135deg,#ffffff,#e9e4ff 50%,#c4b5fd)", WebkitBackgroundClip:"text", backgroundClip:"text" }}>{initials}</div>
            }

            {/* Scrims */}
            <div style={{ position:"absolute", inset:"0 0 auto 0", height:"46%", background:"linear-gradient(to bottom,rgba(40,30,110,0.55) 0%,rgba(40,30,110,0.25) 45%,transparent 100%)", pointerEvents:"none" }} />
            <div style={{ position:"absolute", inset:"auto 0 0 0", height:"32%", background:"linear-gradient(to top,rgba(20,15,60,0.55),transparent)", pointerEvents:"none" }} />
            <div style={{ position:"absolute", inset:0, background:"linear-gradient(115deg,transparent 30%,rgba(255,255,255,0.18) 48%,transparent 66%)", backgroundSize:"250% 100%", animation:"mcSheen 7s ease-in-out infinite", pointerEvents:"none" }} />

            {/* Name at top */}
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

            {/* Position indicator */}
            <div style={{ position:"absolute", top:"50%", right:12, transform:"translateY(-50%)", fontSize:"clamp(10px,0.9vw,13px)", color:"rgba(255,255,255,0.35)", letterSpacing:1, writingMode:"vertical-rl", textOrientation:"mixed", zIndex:2 }}>
              {scene.index + 1} / {scene.total}
            </div>
          </div>

          {/* Glass panel */}
          <div style={{
            position:"relative", zIndex:2, flex:1, minWidth:0, alignSelf:"center",
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
            <div style={{ position:"absolute", inset:0, borderRadius:24, padding:"1.5px", background:"conic-gradient(from 45deg,#7c5cf5,#a855f7,#ec4899,#22d3ee,#6366f1,#7c5cf5)", WebkitMask:"linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0)", WebkitMaskComposite:"xor", maskComposite:"exclude", opacity:0.65, pointerEvents:"none" }} />
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
                <div style={{ position:"absolute", left:0, top:0, bottom:0, width:3, background:"linear-gradient(to bottom,#7b5cf6,#a855f7)", boxShadow:"0 0 14px rgba(168,85,247,0.7)", transform: vis ? "scaleY(1)" : "scaleY(0)", transformOrigin:"top", transition:`transform 0.4s cubic-bezier(0.16,1,0.3,1) ${0.3+i*0.11}s` }} />
                <div style={{ width:"clamp(38px,3.4vw,52px)", height:"clamp(38px,3.4vw,52px)", borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Sora','Inter',sans-serif", fontSize:"clamp(15px,1.5vw,21px)", fontWeight:700, color:"#fff", background:"linear-gradient(135deg,#7b5cf6,#6d4de0)", border:"1px solid rgba(199,210,254,0.35)", boxShadow:"0 8px 22px -6px rgba(109,77,224,0.9),inset 0 1px 0 rgba(255,255,255,0.28)" }}>
                  {i + 1}
                </div>
                <div>
                  <div style={{ fontFamily:"'Sora','Inter',sans-serif", fontSize:"clamp(16px,1.7vw,24px)", fontWeight:600, color:"#f7f6ff", letterSpacing:"-0.2px" }}>{mentee.name}</div>
                  <div style={{ fontFamily:"ui-monospace,monospace", fontSize:"clamp(11px,1.05vw,15px)", color:"rgba(199,210,254,0.6)", marginTop:4, letterSpacing:"0.6px" }}>{mentee.studentId}</div>
                </div>
                <div style={{ marginLeft:"auto", color:"rgba(199,210,254,0.45)", fontSize:"clamp(20px,1.8vw,26px)" }}>→</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes mcDrift1        { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-6vw,5vh) scale(1.12)} }
        @keyframes mcDrift2        { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(7vw,-4vh) scale(1.15)} }
        @keyframes mcDrift3        { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-5vw,-6vh) scale(0.85)} }
        @keyframes mcSheen         { 0%{background-position:160% 0} 55%{background-position:-60% 0} 100%{background-position:-60% 0} }
        @keyframes mcHalo          { 0%,100%{opacity:0.5;transform:scale(1)} 50%{opacity:0.9;transform:scale(1.05)} }
        @keyframes mcPortraitFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes mcCardIn        { from{opacity:0;transform:translateY(28px) scale(0.96)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes mcExitLeft      { from{opacity:1;transform:translateX(0) scale(1)} to{opacity:0;transform:translateX(-60px) scale(0.94)} }
        @keyframes mcExitRight     { from{opacity:1;transform:translateX(0) scale(1)} to{opacity:0;transform:translateX(60px) scale(0.94)} }
        @keyframes mcEnterRight    { from{opacity:0;transform:translateX(60px) scale(0.94)} to{opacity:1;transform:translateX(0) scale(1)} }
        @keyframes mcEnterLeft     { from{opacity:0;transform:translateX(-60px) scale(0.94)} to{opacity:1;transform:translateX(0) scale(1)} }

        .mc-card                       { opacity:0; animation:mcCardIn 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s forwards; }
        .mc-card.mc-exit-left          { animation:mcExitLeft  0.35s cubic-bezier(0.4,0,1,1) forwards; }
        .mc-card.mc-exit-right         { animation:mcExitRight 0.35s cubic-bezier(0.4,0,1,1) forwards; }
        .mc-card.mc-enter-right.mc-vis { animation:mcEnterRight 0.55s cubic-bezier(0.16,1,0.3,1) forwards; }
        .mc-card.mc-enter-left.mc-vis  { animation:mcEnterLeft  0.55s cubic-bezier(0.16,1,0.3,1) forwards; }
        .mc-card.mc-idle               { opacity:0; }
      `}</style>
    </div>
  );
}
