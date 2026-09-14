"use client";
import React, { useEffect, useRef, useState } from "react";
import { REG_NAMES, REG_SUBS, MILESTONE_STEP, REEL_TRACK_LEN } from "./shared";

export function LiveRegistrationsScene() {
  const CIRC = 2 * Math.PI * 150; // 942.477…

  // ── Canvas / animation refs ───────────────────────────────────────────────
  const starsCanvasRef = useRef<HTMLCanvasElement>(null);
  const confCanvasRef  = useRef<HTMLCanvasElement>(null);
  const stageRef       = useRef<HTMLDivElement>(null);
  const numElRef       = useRef<HTMLDivElement>(null);
  const cometRef       = useRef<SVGGElement>(null);
  const flashColorRef  = useRef("rgba(79,157,255,.10)");

  const starsRef = useRef<{ x:number;y:number;vx:number;vy:number;r:number;tw:number;ix:number;iy:number }[]>([]);
  const confRef  = useRef<{ x:number;y:number;vx:number;vy:number;r:number;rot:number;vr:number;life:number;decay:number;color:string;shape:number }[]>([]);
  const wRef  = useRef(0);
  const hRef  = useRef(0);
  const t0Ref = useRef(0);
  const rafRef = useRef(0);

  // ── Live-data refs ────────────────────────────────────────────────────────
  const lastJoinRef  = useRef<number | null>(null);
  const joinTimesRef = useRef<number[]>([]);
  const countRef     = useRef(0);

  // ── ID counters ───────────────────────────────────────────────────────────
  const toastIdRef = useRef(0);
  const chipIdRef  = useRef(0);
  const shockIdRef = useRef(0);

  // ── React state ───────────────────────────────────────────────────────────
  const [count,       setCount]       = useState<number | null>(null);
  const [history,     setHistory]     = useState<{ v: number; down: boolean }[]>([]);
  const [bump,        setBump]        = useState(false);
  const [dipCls,      setDipCls]      = useState(false);
  const [goldCls,     setGoldCls]     = useState(false);
  const [glitch,      setGlitch]      = useState(false);
  const [shake,       setShake]       = useState(false);
  const [toGo,        setToGo]        = useState(MILESTONE_STEP);
  const [nextGold,    setNextGold]    = useState(false);
  const [lastPopd,    setLastPopd]    = useState(false);
  const [arcOffset,   setArcOffset]   = useState(CIRC);
  const [isMilestone, setIsMilestone] = useState(false);
  const [showRose,    setShowRose]    = useState(false);
  const [banner,      setBanner]      = useState<string | null>(null);
  const [lastAgo,     setLastAgo]     = useState("—");
  const [rate,        setRate]        = useState(0);
  const [flashKey,    setFlashKey]    = useState(0);
  const [cometKey,    setCometKey]    = useState(0);
  const [toasts,      setToasts]      = useState<{ id:number;name:string;sub:string;hue:number;out:boolean }[]>([]);
  const [chips,       setChips]       = useState<{ id:number;text:string;kind:string;dx:number;dy:number }[]>([]);
  const [shocks,      setShocks]      = useState<{ id:number;kind:string }[]>([]);

  // ── Stars + confetti canvas loop ──────────────────────────────────────────
  useEffect(() => {
    const sc = starsCanvasRef.current;
    const cc = confCanvasRef.current;
    if (!sc || !cc) return;
    const sx = sc.getContext("2d")!;
    const cx = cc.getContext("2d")!;

    function resize() {
      const W = window.innerWidth, H = window.innerHeight;
      wRef.current = W; hRef.current = H;
      const dpr = window.devicePixelRatio || 1;
      for (const c of [sc, cc] as HTMLCanvasElement[]) {
        c.width = W * dpr; c.height = H * dpr;
        c.style.width = W + "px"; c.style.height = H + "px";
      }
      sx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(170, Math.floor(W * H / 11000));
      starsRef.current = Array.from({ length: n }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - .5) * .12, vy: (Math.random() - .5) * .12,
        r: Math.random() * 1.4 + .4, tw: Math.random() * Math.PI * 2, ix: 0, iy: 0,
      }));
    }
    resize();
    window.addEventListener("resize", resize);

    t0Ref.current = performance.now();
    function frame(now: number) {
      const dt = Math.min(2, (now - t0Ref.current) / 16.67);
      t0Ref.current = now;
      const W = wRef.current, H = hRef.current;
      const stars = starsRef.current;

      sx.clearRect(0, 0, W, H);
      for (const s of stars) {
        s.x += (s.vx + s.ix) * dt; s.y += (s.vy + s.iy) * dt;
        s.ix *= .94; s.iy *= .94; s.tw += .02 * dt;
        if (s.x < -5) s.x = W + 5; if (s.x > W + 5) s.x = -5;
        if (s.y < -5) s.y = H + 5; if (s.y > H + 5) s.y = -5;
      }
      sx.strokeStyle = "rgba(94,225,255,.07)"; sx.lineWidth = 1;
      for (let i = 0; i < stars.length; i++) for (let j = i + 1; j < stars.length; j++) {
        const a = stars[i], b = stars[j], dx = a.x - b.x, dy = a.y - b.y;
        if (dx * dx + dy * dy < 110 * 110) { sx.beginPath(); sx.moveTo(a.x, a.y); sx.lineTo(b.x, b.y); sx.stroke(); }
      }
      for (const s of stars) {
        const al = .35 + Math.sin(s.tw) * .3;
        sx.fillStyle = `rgba(160,205,255,${al.toFixed(3)})`;
        sx.beginPath(); sx.arc(s.x, s.y, s.r, 0, Math.PI * 2); sx.fill();
      }

      cx.clearRect(0, 0, W, H);
      const conf = confRef.current;
      if (conf.length) {
        confRef.current = conf.filter(p => p.life > 0);
        for (const p of confRef.current) {
          p.vy += .12 * dt; p.vx *= .985; p.vy *= .985;
          p.x += p.vx * dt; p.y += p.vy * dt;
          p.rot += p.vr * dt; p.life -= p.decay * dt;
          cx.save(); cx.globalAlpha = Math.max(0, p.life);
          cx.translate(p.x, p.y); cx.rotate(p.rot);
          cx.fillStyle = p.color; cx.shadowColor = p.color; cx.shadowBlur = 8;
          if (p.shape) { cx.fillRect(-p.r, -p.r * .5, p.r * 2, p.r); }
          else { cx.beginPath(); cx.arc(0, 0, p.r * .7, 0, Math.PI * 2); cx.fill(); }
          cx.restore();
        }
      }
      rafRef.current = requestAnimationFrame(frame);
    }
    rafRef.current = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener("resize", resize); };
  }, []);

  // ── Star ripple ───────────────────────────────────────────────────────────
  const ripple = React.useCallback((strength: number) => {
    const W = wRef.current, H = hRef.current;
    const cx = W / 2, cy = H / 2;
    for (const s of starsRef.current) {
      const dx = s.x - cx, dy = s.y - cy, d = Math.hypot(dx, dy) || 1;
      const f = strength * 90 / d;
      s.ix += dx / d * f; s.iy += dy / d * f;
    }
  }, []);

  // ── Canvas confetti burst ─────────────────────────────────────────────────
  const burst = React.useCallback((n: number, colors: string[], speed: number) => {
    const W = wRef.current, H = hRef.current;
    const cx = W / 2, cy = H / 2 - 10;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = speed * (.4 + Math.random());
      confRef.current.push({
        x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - speed * .5,
        r: Math.random() * 4 + 2, rot: Math.random() * Math.PI, vr: (Math.random() - .5) * .3,
        life: 1, decay: .008 + Math.random() * .012,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: Math.random() < .5 ? 0 : 1,
      });
    }
  }, []);

  // ── Odometer ─────────────────────────────────────────────────────────────
  const renderOdometer = React.useCallback((n: number, dir: number) => {
    const el = numElRef.current;
    if (!el) return;
    const str = String(n);
    // Clear non-reel children (safety)
    [...el.children].forEach(c => { if (!(c as HTMLElement).classList.contains("lr-reel")) c.remove(); });
    // Add reels
    while (el.children.length < str.length) {
      const reel = document.createElement("div");
      reel.className = "lr-reel lr-reel-enter";
      reel.dataset.pos = "10";
      const track = document.createElement("div");
      track.className = "lr-reel-track";
      for (let i = 0; i < REEL_TRACK_LEN; i++) {
        const s = document.createElement("span"); s.textContent = String(i % 10); track.appendChild(s);
      }
      track.style.transform = "translateY(-10em)";
      reel.appendChild(track);
      el.prepend(reel);
      setTimeout(() => reel.classList.remove("lr-reel-enter"), 700);
    }
    while (el.children.length > str.length) el.firstElementChild?.remove();
    [...el.children].forEach((reel, i) => {
      const d = +str[i];
      const track = reel.firstElementChild as HTMLElement;
      if (!track) return;
      let pos = +(reel as HTMLElement).dataset.pos!;
      const cur = pos % 10;
      if (cur === d) return;
      const delta = dir >= 0 ? (d - cur + 10) % 10 : -((cur - d + 10) % 10);
      if (pos + delta < 0 || pos + delta >= REEL_TRACK_LEN) {
        track.style.transition = "none"; pos = 10 + cur;
        track.style.transform = `translateY(${-pos}em)`; void track.offsetWidth; track.style.transition = "";
      }
      pos += delta;
      (reel as HTMLElement).dataset.pos = String(pos);
      track.style.transform = `translateY(${-pos}em)`;
      const t = (reel as HTMLElement & { _rt?: ReturnType<typeof setTimeout> })._rt;
      if (t) clearTimeout(t);
      (reel as HTMLElement & { _rt?: ReturnType<typeof setTimeout> })._rt = setTimeout(() => {
        const p = +(reel as HTMLElement).dataset.pos!;
        const nn = 10 + (p % 10);
        if (nn !== p) {
          track.style.transition = "none"; (reel as HTMLElement).dataset.pos = String(nn);
          track.style.transform = `translateY(${-nn}em)`; void track.offsetWidth; track.style.transition = "";
        }
      }, 900);
    });
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const popClass = React.useCallback((set: React.Dispatch<React.SetStateAction<boolean>>, ms: number) => {
    set(true); setTimeout(() => set(false), ms);
  }, []);

  const addShock = React.useCallback((kind: string) => {
    const id = ++shockIdRef.current;
    setShocks(p => [...p, { id, kind }]);
    setTimeout(() => setShocks(p => p.filter(s => s.id !== id)), 1000);
  }, []);

  const addChip = React.useCallback((text: string, kind: string) => {
    const id = ++chipIdRef.current;
    const stage = stageRef.current;
    const r = stage ? stage.offsetWidth * 0.33 : 120;
    const ang = (Math.random() * 120 - 60) * Math.PI / 180;
    setChips(p => [...p, { id, text, kind, dx: Math.sin(ang) * r - 10, dy: -Math.cos(ang) * r * .55 - 20 }]);
    setTimeout(() => setChips(p => p.filter(c => c.id !== id)), 1400);
  }, []);

  const addToast = React.useCallback(() => {
    const name = REG_NAMES[Math.floor(Math.random() * REG_NAMES.length)];
    const sub  = REG_SUBS[Math.floor(Math.random() * REG_SUBS.length)];
    const hue  = [...name].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 360, 7);
    const id   = ++toastIdRef.current;
    setToasts(p => [...p.slice(-3), { id, name, sub, hue, out: false }]);
    setTimeout(() => setToasts(p => p.map(t => t.id === id ? { ...t, out: true } : t)), 4200);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4800);
  }, []);

  const updateProgress = React.useCallback((n: number) => {
    const inStep = n % MILESTONE_STEP;
    setArcOffset(CIRC * (1 - Math.min(1, Math.max(0, inStep / MILESTONE_STEP))));
    setToGo(inStep === 0 ? MILESTONE_STEP : MILESTONE_STEP - inStep);
    setNextGold(inStep >= MILESTONE_STEP - 2 && n > 0);
  }, [CIRC]);

  // ── Core increment effects ────────────────────────────────────────────────
  const runIncrementEffects = React.useCallback((newCount: number) => {
    const milestone = newCount % MILESTONE_STEP === 0;
    renderOdometer(newCount, +1);
    setHistory(h => [...h.slice(-23), { v: newCount, down: false }]);
    lastJoinRef.current = Date.now();
    joinTimesRef.current = [...joinTimesRef.current.filter(t => Date.now() - t < 60000), Date.now()];
    popClass(setBump, 600); popClass(setGlitch, 350); popClass(setLastPopd, 500);
    addChip("+1", milestone ? "gold" : "");
    setCometKey(k => k + 1);
    if (milestone) {
      setArcOffset(0); setIsMilestone(true); setShowRose(false);
      popClass(setGoldCls, 900); popClass(setShake, 500);
      addShock("gold"); setTimeout(() => addShock("gold"), 150); setTimeout(() => addShock(""), 300);
      flashColorRef.current = "rgba(255,209,102,.16)"; setFlashKey(k => k + 1);
      ripple(3.2); burst(160, ["#ffd166","#fff3c4","#5ee1ff","#ffffff","#ff9f68"], 9);
      setBanner(`✦ ${newCount} mentees — milestone reached`);
      setTimeout(() => setBanner(null), 3200);
      setTimeout(() => { setIsMilestone(false); setArcOffset(CIRC); updateProgress(newCount); }, 1500);
    } else {
      updateProgress(newCount); setShowRose(false); addShock("");
      flashColorRef.current = "rgba(79,157,255,.10)"; setFlashKey(k => k + 1);
      ripple(1.4); burst(26, ["#5ee1ff","#4f9dff","#ffffff","#a5b4fc"], 5);
    }
  }, [addChip, addShock, burst, popClass, renderOdometer, ripple, updateProgress, CIRC]);

  const handleIncrementNoToast = React.useCallback((n: number) => {
    runIncrementEffects(n);
  }, [runIncrementEffects]);

  // ── Poll API ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    let lastSeenAt: string | null = null;

    const poll = async () => {
      try {
        const res = await fetch("/api/display/registrations");
        if (!res.ok) return;
        const data = await res.json() as { count: number; latestName: string | null; latestAt: string | null };
        if (cancelled) return;

        if (data.latestAt) {
          const ts = new Date(data.latestAt).getTime();
          if (!lastJoinRef.current || ts > lastJoinRef.current) lastJoinRef.current = ts;
        }

        setCount(prev => {
          const n = data.count;
          if (prev === null) {
            countRef.current = n; updateProgress(n); renderOdometer(n, +1);
            setHistory([{ v: n, down: false }]); lastSeenAt = data.latestAt;
          } else if (n > prev) {
            countRef.current = n;
            if (data.latestAt && data.latestAt !== lastSeenAt && data.latestName) {
              lastSeenAt = data.latestAt;
              const realName = data.latestName;
              const sub = REG_SUBS[Math.floor(Math.random() * REG_SUBS.length)];
              const hue = [...realName].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 360, 7);
              const id  = ++toastIdRef.current;
              setToasts(p => [...p.slice(-3), { id, name: realName, sub, hue, out: false }]);
              setTimeout(() => setToasts(p => p.map(t => t.id === id ? { ...t, out: true } : t)), 4200);
              setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4800);
            }
            handleIncrementNoToast(n);
          } else if (n < prev) {
            countRef.current = n; renderOdometer(n, -1);
            setHistory(h => [...h.slice(-23), { v: n, down: true }]);
            popClass(setDipCls, 500); popClass(setShake, 400);
            setShowRose(true); setTimeout(() => setShowRose(false), 700);
            addShock("rose"); addChip("−1", "minus");
            flashColorRef.current = "rgba(255,107,139,.09)"; setFlashKey(k => k + 1);
            ripple(-1); updateProgress(n);
          }
          return n;
        });
      } catch { /* ignore */ }
    };
    poll();
    const iv = setInterval(poll, 3000);
    return () => { cancelled = true; clearInterval(iv); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleIncrementNoToast, updateProgress, popClass, addShock, addChip, renderOdometer, ripple]);

  // ── Meta ticker ───────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => {
      const lj = lastJoinRef.current;
      if (lj) {
        const s = Math.round((Date.now() - lj) / 1000);
        setLastAgo(s < 3 ? "just now" : s < 60 ? `${s}s ago` : `${Math.floor(s / 60)}m ago`);
      }
      joinTimesRef.current = joinTimesRef.current.filter(t => t > Date.now() - 60000);
      setRate(joinTimesRef.current.length);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const displayCount = count ?? 0;

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ position:"fixed", inset:0, fontFamily:'"Manrope",sans-serif', WebkitFontSmoothing:"antialiased", color:"#eef5ff", background:"radial-gradient(ellipse 130% 90% at 50% -10%,#0d1b4a 0%,#030a1c 55%,#020810 100%)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", overflow:"hidden", minHeight:"100vh" }}>

      <canvas ref={starsCanvasRef} style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0 }} />

      {/* Aurora */}
      <div style={{ position:"fixed", left:"50%", top:"50%", width:"120vmax", height:"120vmax", margin:"-60vmax 0 0 -60vmax", borderRadius:"50%", pointerEvents:"none", filter:"blur(70px)", opacity:.22, willChange:"transform", background:"conic-gradient(from 0deg,transparent 0deg,rgba(79,157,255,.7) 60deg,transparent 120deg,rgba(99,102,241,.6) 200deg,transparent 260deg,rgba(94,225,255,.5) 320deg,transparent 360deg)", animation:"lr-aurora-a 60s linear infinite" }} />
      <div style={{ position:"fixed", left:"50%", top:"50%", width:"120vmax", height:"120vmax", margin:"-60vmax 0 0 -60vmax", borderRadius:"50%", pointerEvents:"none", filter:"blur(70px)", opacity:.16, willChange:"transform", background:"conic-gradient(from 180deg,transparent 0deg,rgba(94,225,255,.5) 90deg,transparent 180deg,rgba(99,102,241,.5) 270deg,transparent 360deg)", animation:"lr-aurora-a 85s linear infinite reverse" }} />

      {/* Grid */}
      <div style={{ position:"fixed", inset:"-72px", pointerEvents:"none", zIndex:0, backgroundImage:"linear-gradient(rgba(79,157,255,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(79,157,255,.045) 1px,transparent 1px)", backgroundSize:"72px 72px", WebkitMaskImage:"radial-gradient(ellipse 80% 80% at 50% 50%,#000 20%,transparent 75%)", maskImage:"radial-gradient(ellipse 80% 80% at 50% 50%,#000 20%,transparent 75%)", animation:"lr-grid 40s linear infinite" }} />

      {/* Orbs */}
      <div style={{ position:"fixed", width:"55vw", height:"55vw", top:"-20%", left:"50%", transform:"translateX(-50%)", borderRadius:"50%", background:"radial-gradient(circle,rgba(79,157,255,.22) 0%,transparent 70%)", filter:"blur(80px)", pointerEvents:"none", zIndex:0, animation:"lr-orb1 18s ease-in-out infinite" }} />
      <div style={{ position:"fixed", width:"35vw", height:"35vw", bottom:"-8%", left:"8%",  borderRadius:"50%", background:"radial-gradient(circle,rgba(99,102,241,.22) 0%,transparent 70%)", filter:"blur(70px)", pointerEvents:"none", zIndex:0, animation:"lr-orb2 24s ease-in-out infinite" }} />
      <div style={{ position:"fixed", width:"35vw", height:"35vw", bottom:"-8%", right:"8%", borderRadius:"50%", background:"radial-gradient(circle,rgba(94,225,255,.16) 0%,transparent 70%)", filter:"blur(70px)", pointerEvents:"none", zIndex:0, animation:"lr-orb3 20s ease-in-out infinite" }} />

      {/* Vignette */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:1, background:"radial-gradient(ellipse 90% 90% at 50% 50%,transparent 55%,rgba(2,8,16,.65) 100%)" }} />

      {/* Flash overlay */}
      <div key={flashKey} style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:2, background:`radial-gradient(circle at 50% 50%,${flashColorRef.current},transparent 65%)`, animation: flashKey > 0 ? "lr-flash .8s ease-out forwards" : "none", opacity: flashKey > 0 ? 1 : 0 }} />

      <canvas ref={confCanvasRef} style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:30 }} />

      {/* Header logo */}
      <div style={{ position:"absolute", top:"clamp(20px,3vh,40px)", left:"50%", transform:"translateX(-50%)", zIndex:5, animation:"lr-float 6s ease-in-out infinite" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo2.png" alt="Logo" onError={(e) => { (e.target as HTMLImageElement).style.display="none"; }} style={{ width:"clamp(32px,2.8vh,42px)", height:"clamp(32px,2.8vh,42px)", objectFit:"contain", display:"block", filter:"drop-shadow(0 0 14px rgba(79,157,255,.55))" }} />
      </div>

      {/* Live pill */}
      <div style={{ position:"fixed", top:"clamp(20px,3vh,40px)", right:"clamp(20px,3vw,40px)", zIndex:5, display:"flex", alignItems:"center", gap:10, background:"rgba(8,20,50,.75)", border:"1px solid rgba(140,190,255,.13)", borderRadius:999, padding:"9px 18px", fontSize:13, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:"#c3d6f5", backdropFilter:"blur(10px)", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(110deg,transparent 30%,rgba(140,190,255,.12) 50%,transparent 70%)", animation:"lr-pill-sheen 6s ease-in-out infinite", pointerEvents:"none" }} />
        <div style={{ width:9, height:9, borderRadius:"50%", background:"#4f9dff", flexShrink:0, boxShadow:"0 0 0 0 rgba(79,157,255,.6)", animation:"lr-live-dot 1.8s infinite" }} />
        <span>Live</span>
        <span style={{ display:"inline-flex", alignItems:"flex-end", gap:2, height:12, marginLeft:2 }}>
          {[0,-.3,-.6,-.15].map((delay, i) => (
            <i key={i} style={{ width:3, height:4, background:"#5ee1ff", borderRadius:2, opacity:.8, display:"inline-block", animation:`lr-eq 1.1s ease-in-out ${delay}s infinite` }} />
          ))}
        </span>
      </div>

      {/* Milestone banner */}
      <div style={{ position:"fixed", top:"clamp(80px,12vh,120px)", left:"50%", transform:`translateX(-50%) translateY(${banner ? 0 : -30}px)`, opacity: banner ? 1 : 0, transition:"transform .6s cubic-bezier(.34,1.56,.64,1),opacity .4s", display:"flex", alignItems:"center", gap:12, padding:"12px 26px", borderRadius:999, zIndex:9, background:"linear-gradient(90deg,rgba(255,209,102,.15),rgba(255,209,102,.05))", border:"1px solid rgba(255,209,102,.5)", boxShadow:"0 0 40px rgba(255,209,102,.35)", fontWeight:800, letterSpacing:".12em", textTransform:"uppercase", fontSize:14, color:"#ffd166", backdropFilter:"blur(12px)", pointerEvents:"none" }}>
        <span style={{ display:"inline-block", animation:"lr-spin 3s linear infinite" }}>✦</span>
        <span>{banner}</span>
        <span style={{ display:"inline-block", animation:"lr-spin 3s linear infinite" }}>✦</span>
      </div>

      {/* Ring stage */}
      <div ref={stageRef} style={{ position:"relative", zIndex:3, width:"clamp(280px,36vw,440px)", height:"clamp(280px,36vw,440px)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, animation: shake ? "lr-shake .5s cubic-bezier(.36,.07,.19,.97) both" : "lr-float 7s ease-in-out infinite" }}>

        <div style={{ position:"absolute", width:"118%", height:"118%", borderRadius:"50%", border:"1px solid rgba(79,157,255,.12)", pointerEvents:"none", animation:"lr-idle-ring 4.5s ease-out 0s infinite" }} />
        <div style={{ position:"absolute", width:"108%", height:"108%", borderRadius:"50%", border:"1px solid rgba(79,157,255,.07)", pointerEvents:"none", animation:"lr-idle-ring 4.5s ease-out -1.5s infinite" }} />
        <div style={{ position:"absolute", width:"128%", height:"128%", borderRadius:"50%", border:"1px solid rgba(94,225,255,.05)", pointerEvents:"none", animation:"lr-idle-ring 4.5s ease-out -3s infinite" }} />

        <div style={{ position:"absolute", inset:0, borderRadius:"50%", pointerEvents:"none", background:"conic-gradient(from 0deg,transparent 0deg 300deg,rgba(94,225,255,.28) 360deg)", WebkitMask:"radial-gradient(circle,transparent 69%,#000 70%,#000 80%,transparent 81%)", mask:"radial-gradient(circle,transparent 69%,#000 70%,#000 80%,transparent 81%)", animation:"lr-spin 7s linear infinite", opacity:.85 }} />

        {shocks.map(s => {
          const col = s.kind === "rose" ? "#ff6b8b" : s.kind === "gold" ? "#ffd166" : "#5ee1ff";
          const glow = s.kind === "rose" ? "0 0 20px #ff6b8b" : s.kind === "gold" ? "0 0 40px #ffd166,inset 0 0 40px #ffd166" : "0 0 30px #4f9dff,inset 0 0 30px #4f9dff";
          return <div key={s.id} style={{ position:"absolute", left:"50%", top:"50%", width:"75%", height:"75%", margin:"-37.5% 0 0 -37.5%", borderRadius:"50%", border:`2px solid ${col}`, pointerEvents:"none", opacity:0, boxShadow:glow, animation:"lr-shock 1s cubic-bezier(.2,.8,.2,1) forwards" }} />;
        })}

        <svg viewBox="0 0 400 400" style={{ position:"absolute", inset:0, width:"100%", height:"100%", overflow:"visible" }}>
          <defs>
            <linearGradient id="lr-grad"  x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#4f9dff"/><stop offset="100%" stopColor="#5ee1ff"/></linearGradient>
            <linearGradient id="lr-gold"  x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#ffd166"/><stop offset="100%" stopColor="#fff3c4"/></linearGradient>
            <linearGradient id="lr-rose"  x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#ff6b8b"/><stop offset="100%" stopColor="#ffa3b8"/></linearGradient>
            <linearGradient id="lr-tail" gradientUnits="userSpaceOnUse" x1="136.6" y1="64.1" x2="200" y2="50">
              <stop offset="0%" stopColor="#5ee1ff" stopOpacity="0"/><stop offset="100%" stopColor="#ffffff" stopOpacity="1"/>
            </linearGradient>
            <filter id="lr-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="lr-glow-s" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          <g style={{ transformOrigin:"200px 200px", animation:"lr-spin 120s linear infinite" }}>
            {Array.from({ length: 72 }, (_, i) => {
              const major = i % 6 === 0, a = (i / 72) * Math.PI * 2;
              const r1 = 186, r2 = major ? 198 : 193;
              return <line key={i} x1={(200 + r1 * Math.sin(a)).toFixed(2)} y1={(200 - r1 * Math.cos(a)).toFixed(2)} x2={(200 + r2 * Math.sin(a)).toFixed(2)} y2={(200 - r2 * Math.cos(a)).toFixed(2)} stroke={major ? "rgba(94,225,255,.55)" : "rgba(79,157,255,.22)"} strokeWidth={major ? 2 : 1} strokeLinecap="round" />;
            })}
          </g>
          <circle cx="200" cy="200" r="172" fill="none" stroke="rgba(94,225,255,.22)" strokeWidth="1.5" strokeDasharray="2 9" style={{ transformOrigin:"200px 200px", animation:"lr-spin 80s linear infinite reverse" }} />
          <circle cx="200" cy="200" r="150" fill="none" stroke={isMilestone ? "rgba(255,209,102,.25)" : "rgba(79,157,255,.12)"} strokeWidth="7" style={{ transition:"stroke .4s" }} />
          <circle cx="200" cy="200" r="150" fill="none" stroke={isMilestone ? "url(#lr-gold)" : showRose ? "url(#lr-rose)" : "url(#lr-grad)"} strokeWidth="7" strokeLinecap="round" transform="rotate(-90 200 200)" strokeDasharray={`${CIRC} ${CIRC}`} strokeDashoffset={arcOffset} filter="url(#lr-glow-s)" style={{ transition:"stroke-dashoffset .9s cubic-bezier(.2,.8,.2,1),stroke .4s" }} />
          {[{r:50,sz:3.5,col:"#5ee1ff",dur:"14s",dir:""},{r:28,sz:2.5,col:"#8fb8ff",dur:"22s",dir:"reverse"},{r:78,sz:2,col:"#c7b3ff",dur:"9s",dir:""}].map((s,i) => (
            <g key={i} style={{ transformOrigin:"200px 200px", animation:`lr-spin ${s.dur} linear infinite ${s.dir}` }}>
              <circle cx="200" cy={200-s.r} r={s.sz} fill={s.col} filter="url(#lr-glow)" opacity={i>0?.8:1} />
            </g>
          ))}
          <g key={cometKey} ref={cometRef} style={{ transformOrigin:"200px 200px", animation: cometKey > 0 ? "lr-comet 1.15s cubic-bezier(.25,.75,.25,1) forwards" : "none", opacity:0 }}>
            <path d="M136.6 64.1 A150 150 0 0 1 200 50" stroke="url(#lr-tail)" strokeWidth="5" strokeLinecap="round" fill="none" />
            <circle cx="200" cy="50" r="6" fill="#fff" filter="url(#lr-glow)" />
          </g>
        </svg>

        <div style={{ position:"absolute", textAlign:"center", pointerEvents:"none", zIndex:4 }}>
          {count === null && <div style={{ fontSize:"clamp(88px,11.5vw,150px)", fontWeight:800, lineHeight:1, color:"rgba(140,190,255,.4)", filter:"drop-shadow(0 0 26px rgba(79,157,255,.3))" }}>—</div>}
          <div ref={numElRef} aria-live="polite" style={{ fontSize:"clamp(88px,11.5vw,150px)", fontWeight:800, lineHeight:1, fontVariantNumeric:"tabular-nums", color:"#fff", display: count === null ? "none" : "flex", justifyContent:"center", filter: bump ? "drop-shadow(0 0 40px rgba(94,225,255,.95))" : dipCls ? "drop-shadow(0 0 30px rgba(255,107,139,.8))" : goldCls ? "drop-shadow(0 0 46px rgba(255,209,102,1))" : "drop-shadow(0 0 26px rgba(79,157,255,.55))", transform: bump ? "scale(1.12)" : dipCls ? "scale(.94)" : goldCls ? "scale(1.18)" : "scale(1)", transition:"transform .5s cubic-bezier(.34,1.56,.64,1),filter .3s", animation: glitch ? "lr-glitch .35s steps(2) 1" : "lr-num-breathe 5s ease-in-out infinite" }} />
          <div style={{ fontSize:"clamp(12px,1.3vw,18px)", fontWeight:700, letterSpacing:".22em", textTransform:"uppercase", marginTop:8, background:"linear-gradient(90deg,rgba(140,190,255,.45) 0%,rgba(140,190,255,.45) 40%,#fff 50%,rgba(140,190,255,.45) 60%,rgba(140,190,255,.45) 100%)", backgroundSize:"250% 100%", WebkitBackgroundClip:"text", backgroundClip:"text", color:"transparent", animation:"lr-shimmer 4.5s linear infinite" }}>
            mentees registered
          </div>
        </div>

        {chips.map(c => (
          <div key={c.id} style={{ position:"absolute", left:"50%", top:"50%", fontWeight:800, fontSize: c.kind==="gold" ? "clamp(22px,2.6vw,34px)" : "clamp(18px,2vw,26px)", color: c.kind==="minus" ? "#ff6b8b" : c.kind==="gold" ? "#ffd166" : "#5ee1ff", textShadow:`0 0 ${c.kind==="gold"?22:18}px ${c.kind==="minus"?"#ff6b8b":c.kind==="gold"?"#ffd166":"#5ee1ff"}`, pointerEvents:"none", zIndex:6, ["--dx" as string]:`${c.dx}px`, ["--dy" as string]:`${c.dy}px`, animation:"lr-chip 1.3s cubic-bezier(.2,.8,.2,1) forwards" }}>
            {c.text}
          </div>
        ))}
      </div>

      {/* Meta stats */}
      <div style={{ display:"flex", gap:12, marginTop:"clamp(22px,3.2vh,40px)", zIndex:3, flexWrap:"wrap", justifyContent:"center" }}>
        {[
          { border: nextGold ? "rgba(255,209,102,.5)" : "rgba(140,190,255,.12)", dot: nextGold ? "#ffd166" : "#5ee1ff", content: <><b style={{color:"#fff"}}>{toGo}</b> to next milestone</> },
          { border: lastPopd ? "rgba(94,225,255,.5)" : "rgba(140,190,255,.12)", dot: "#5ee1ff", content: <>Last joined <b style={{color:"#fff"}}>{lastAgo}</b></>, scale: lastPopd },
          { border: "rgba(140,190,255,.12)", dot: "#5ee1ff", content: <><b style={{color:"#fff"}}>{rate}</b> / min</> },
        ].map((s, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 14px", borderRadius:999, background:"rgba(8,20,50,.6)", border:`1px solid ${s.border}`, fontSize:12, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", color:"rgba(195,214,245,.75)", backdropFilter:"blur(8px)", transform: ("scale" in s && s.scale) ? "scale(1.08)" : "scale(1)", transition:"border-color .3s,transform .3s cubic-bezier(.34,1.56,.64,1)" }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:s.dot, boxShadow:`0 0 8px ${s.dot}` }} />
            <span>{s.content}</span>
          </div>
        ))}
      </div>

      {/* Sparkline */}
      {history.length > 1 && (
        <div style={{ display:"flex", alignItems:"flex-end", gap:5, height:44, marginTop:18, zIndex:3 }}>
          {(() => {
            const maxH = Math.max(...history.map(x => x.v));
            return history.map((h, i) => {
              const px = maxH > 0 ? Math.round((h.v / maxH) * 40) : 4;
              const isLast = i === history.length - 1;
              return <div key={i} style={{ width:7, height:`${Math.max(px,4)}px`, borderRadius:4, transformOrigin:"bottom", flexShrink:0, background: h.down ? "linear-gradient(180deg,#ff6b8b,rgba(255,107,139,.2))" : isLast ? "linear-gradient(180deg,#fff,#5ee1ff)" : "linear-gradient(180deg,rgba(79,157,255,.6),rgba(79,157,255,.18))", boxShadow: isLast ? "0 0 12px #5ee1ff" : h.down ? "0 0 10px rgba(255,107,139,.6)" : undefined, transition:"height .6s cubic-bezier(.34,1.56,.64,1),background .4s", animation:"lr-bar-in .5s cubic-bezier(.34,1.56,.64,1) both" }} />;
            });
          })()}
        </div>
      )}

      {/* Joiner feed */}
      <div style={{ position:"fixed", left:"clamp(18px,3vw,40px)", bottom:"clamp(24px,5vh,48px)", display:"flex", flexDirection:"column", gap:10, zIndex:8, pointerEvents:"none" }}>
        {toasts.map(t => (
          <div key={t.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 16px 10px 10px", borderRadius:16, background:"rgba(8,20,50,.78)", border:"1px solid rgba(140,190,255,.16)", backdropFilter:"blur(12px)", boxShadow:"0 10px 30px rgba(0,0,0,.35),0 0 0 1px rgba(94,225,255,.05) inset", transformOrigin:"left center", animation: t.out ? "lr-toast-out .5s ease-in forwards" : "lr-toast-in .6s cubic-bezier(.34,1.56,.64,1) both" }}>
            <div style={{ position:"relative", width:38, height:38, borderRadius:"50%", flexShrink:0, display:"grid", placeItems:"center", fontWeight:800, fontSize:13, color:"#fff", background:`linear-gradient(135deg,hsl(${t.hue} 90% 60%),hsl(${(t.hue+50)%360} 90% 55%))`, boxShadow:`0 0 16px hsl(${t.hue} 90% 60% / .6)` }}>
              {t.name.split(" ").map((w: string) => w[0]).join("")}
              <div style={{ position:"absolute", inset:-4, borderRadius:"50%", border:`2px solid hsl(${t.hue} 90% 65%)`, animation:"lr-avatar-ring 1.2s ease-out forwards", pointerEvents:"none" }} />
            </div>
            <div>
              <div style={{ fontWeight:800, fontSize:14, color:"#fff" }}>{t.name}</div>
              <div style={{ fontSize:11, fontWeight:600, letterSpacing:".06em", textTransform:"uppercase", color:"rgba(140,190,255,.7)", marginTop:2 }}>{t.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&display=swap');
        @keyframes lr-spin         { to { transform: rotate(360deg); } }
        @keyframes lr-aurora-a     { to { transform: rotate(360deg); } }
        @keyframes lr-grid         { to { background-position: 72px 72px; } }
        @keyframes lr-float        { 0%,100%{translate:0 0} 50%{translate:0 -6px} }
        @keyframes lr-orb1         { 0%,100%{transform:translateX(-50%) translate(0,0)}   50%{transform:translateX(-50%) translate(4vw,-5vh)} }
        @keyframes lr-orb2         { 0%,100%{transform:translate(0,0)} 50%{transform:translate(3vw,-4vh)} }
        @keyframes lr-orb3         { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-4vw,3vh)} }
        @keyframes lr-pill-sheen   { 0%,60%{transform:translateX(-120%)} 100%{transform:translateX(120%)} }
        @keyframes lr-live-dot     { 70%{box-shadow:0 0 0 10px rgba(79,157,255,0)} 100%{box-shadow:0 0 0 0 rgba(79,157,255,0)} }
        @keyframes lr-eq           { 0%,100%{height:4px} 50%{height:12px} }
        @keyframes lr-idle-ring    { 0%{opacity:.7;transform:scale(.96)} 70%,100%{opacity:0;transform:scale(1.06)} }
        @keyframes lr-shock        { 0%{opacity:.9;transform:scale(.92)} 100%{opacity:0;transform:scale(1.7)} }
        @keyframes lr-comet        { 0%{transform:rotate(0deg);opacity:0} 10%{opacity:1} 85%{opacity:1} 100%{transform:rotate(360deg);opacity:0} }
        @keyframes lr-num-breathe  { 0%,100%{filter:drop-shadow(0 0 22px rgba(79,157,255,.45))} 50%{filter:drop-shadow(0 0 40px rgba(94,225,255,.75))} }
        @keyframes lr-shimmer      { to{background-position:-250% 0} }
        @keyframes lr-glitch       { 0%{transform:translate(0) skewX(0);filter:drop-shadow(-4px 0 0 rgba(255,0,80,.8)) drop-shadow(4px 0 0 rgba(0,255,255,.8))} 50%{transform:translate(-3px,1px) skewX(-4deg)} 100%{transform:translate(0) skewX(0)} }
        @keyframes lr-shake        { 10%,90%{transform:translate(-1px,0)} 20%,80%{transform:translate(2px,0)} 30%,50%,70%{transform:translate(-3px,0)} 40%,60%{transform:translate(3px,0)} }
        @keyframes lr-chip         { 0%{opacity:0;transform:translate(var(--dx),calc(var(--dy) + 20px)) scale(.6)} 20%{opacity:1;transform:translate(var(--dx),var(--dy)) scale(1.15)} 100%{opacity:0;transform:translate(calc(var(--dx) * 1.3),calc(var(--dy) - 90px)) scale(.9)} }
        @keyframes lr-flash        { 0%{opacity:1} 100%{opacity:0} }
        @keyframes lr-bar-in       { from{transform:scaleY(0);opacity:0} to{transform:scaleY(1);opacity:1} }
        @keyframes lr-toast-in     { from{opacity:0;transform:translateX(-40px) scale(.8)} to{opacity:1;transform:none} }
        @keyframes lr-toast-out    { to{opacity:0;transform:translateX(-20px) scale(.9)} }
        @keyframes lr-avatar-ring  { from{transform:scale(1);opacity:1} to{transform:scale(1.8);opacity:0} }
        .lr-reel { height:1em;overflow:hidden;display:inline-block;margin:0 -.015em }
        .lr-reel-enter { animation:lr-reel-in .6s cubic-bezier(.34,1.56,.64,1) both }
        @keyframes lr-reel-in { from{opacity:0;transform:translateY(-.4em) scale(.6)} to{opacity:1;transform:none} }
        .lr-reel-track { display:flex;flex-direction:column;transition:transform .75s cubic-bezier(.22,1.15,.36,1);will-change:transform }
        .lr-reel-track span { height:1em;line-height:1;display:block }
        @media (prefers-reduced-motion:reduce) { *,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important} }
      `}</style>

      {/* suppress unused */}
      {/* {displayCount} */}
    </div>
  );
}
