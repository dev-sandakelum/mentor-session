"use client";
import React from "react";

/**
 * RoboStyles — injects robot-face keyframes once per page.
 * The <style> tag is idempotent (duplicate @keyframe names just overwrite).
 */
export function RoboStyles() {
  return (
    <style>{`
      @keyframes robo-blink {
        0%,44%,48%,52%,100% { transform: scaleY(1); }
        46%,50%             { transform: scaleY(0.08); }
      }
      @keyframes robo-glance-l {
        0%,30%,70%,100% { left:20%; top:39%; }
        35%,45%         { left:25%; top:37%; }
        50%,60%         { left:15%; top:41%; }
        65%             { left:20%; top:39%; }
      }
      @keyframes robo-glance-r {
        0%,30%,70%,100% { right:20%; top:39%; }
        35%,45%         { right:15%; top:37%; }
        50%,60%         { right:25%; top:41%; }
        65%             { right:20%; top:39%; }
      }
      @keyframes robo-scan {
        0%   { transform: translateY(-100%); opacity:0; }
        10%  { opacity:1; }
        90%  { opacity:1; }
        100% { transform: translateY(100%);  opacity:0; }
      }
      @keyframes robo-halo {
        0%,100% { opacity:.55; transform:scale(1);    }
        50%     { opacity:1;   transform:scale(1.08); }
      }
      @keyframes robo-breathe {
        0%,100% { box-shadow: 0 20px 70px rgba(79,157,255,.45), 0 0 0 1px rgba(255,255,255,.12), inset 0 2px 0 rgba(255,255,255,.2); }
        50%     { box-shadow: 0 24px 90px rgba(79,157,255,.75), 0 0 0 1px rgba(255,255,255,.18), inset 0 2px 0 rgba(255,255,255,.28); }
      }
    `}</style>
  );
}

/**
 * RobotLogoMark — animated blue rounded-square robot face.
 *
 * @param size  CSS length string, e.g. `"clamp(40px,3.4vh,52px)"`
 * @param glow  Show pulsing halo ring (loading screens only)
 */
export function RobotLogoMark({ size, glow = false }: { size: string; glow?: boolean }) {
  return (
    <div style={{ position:"relative", flexShrink:0 }}>
      {glow && (
        <div style={{
          position:"absolute", inset:"-35%", borderRadius:"50%",
          background:"radial-gradient(circle,rgba(79,157,255,.32) 0%,transparent 70%)",
          filter:"blur(32px)", pointerEvents:"none",
          animation:"robo-halo 3s ease-in-out infinite",
        }} />
      )}
      <div style={{
        position:"relative",
        width: size, height: size,
        borderRadius:"30%",
        background:"linear-gradient(145deg,#4f9dff,#2d6cf0)",
        boxShadow: glow
          ? "0 0 0 1px rgba(255,255,255,.12), inset 0 2px 0 rgba(255,255,255,.2)"
          : "0 10px 32px rgba(79,157,255,.35)",
        animation: glow ? "robo-breathe 3s ease-in-out infinite" : undefined,
        overflow:"hidden",
        display:"flex", alignItems:"center", justifyContent:"center",
      }}>
        {/* Scan sweep */}
        <div style={{
          position:"absolute", inset:0,
          background:"linear-gradient(180deg,transparent 30%,rgba(255,255,255,.13) 50%,transparent 70%)",
          animation:"robo-scan 4s ease-in-out infinite",
          pointerEvents:"none",
        }} />
        {/* Left eye */}
        <div style={{
          position:"absolute", width:"22%", height:"22%",
          background:"#06122e", borderRadius:"30%",
          top:"39%", left:"20%",
          animation:"robo-blink 5s ease-in-out infinite, robo-glance-l 9s ease-in-out infinite",
          boxShadow: glow ? "inset 0 1px 3px rgba(0,0,0,.8)" : undefined,
        }} />
        {/* Right eye */}
        <div style={{
          position:"absolute", width:"22%", height:"22%",
          background:"#06122e", borderRadius:"30%",
          top:"39%", right:"20%",
          animation:"robo-blink 5s ease-in-out infinite, robo-glance-r 9s ease-in-out infinite",
          boxShadow: glow ? "inset 0 1px 3px rgba(0,0,0,.8)" : undefined,
        }} />
      </div>
    </div>
  );
}
