"use client";
import React from "react";

export function IdleScene() {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", background: "#000" }}>
      {/* Background looping video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      >
        <source src="/display/cover/bg.mp4" type="video/mp4" />
      </video>

      {/* Centered fixed overlay image */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src="/display/cover/Transparant_overlay.png"
          alt=""
          style={{
            maxWidth: "115%",
            maxHeight: "115%",
            objectFit: "contain",
          }}
        />
      </div>
    </div>
  );
}
