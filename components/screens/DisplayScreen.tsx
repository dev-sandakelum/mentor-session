"use client";

import React, { useEffect, useRef, useState } from "react";
import type { DisplayState, DisplayScene } from "@/lib/display-state";

// Allocation scene helpers — name pools used by the AllocationScene queue
const FIRST = ["Kavindi","Pasindu","Nethmi","Ravindu","Dilani","Thilina","Amali","Buddhika",
               "Chathurika","Dasun","Eranga","Fathima","Geeth","Hasini","Isuru","Janani",
               "Kasun","Lahiru","Malsha","Nuwan","Oshadi","Pranith","Ruwini","Sandali",
               "Thashmika","Umindu","Vinura","Wanisha","Yohan","Zeenath"];
const LAST  = ["Wickramasinghe","Fernando","Perera","Senanayake","Rathnayake","Jayasinghe",
               "Silva","Dissanayake","Bandara","Gunawardena","Rodrigo","Mendis","Pathirana",
               "Amarasinghe","Liyanage","Samaraweera","Weerasinghe","Herath","Tennakoon"];
function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

// Scene renderers

function IdleScene() {
  return (
    <div style={{
      width: "100%",
      height: "100%",
      background: "#0f0c29",
      backgroundImage: "url('/display/Mentor_Flayer.jpg.jpeg')",
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

// ─── Name pool for joiner toasts ──────────────────────────────────────────────
const REG_NAMES = [
  "Amaya P.","Kasun J.","Nethmi S.","Ravindu W.","Sanduni F.","Tharindu D.",
  "Ishara M.","Dilini R.","Aisha K.","Liam O.","Sofia R.","Noah B.",
  "Priya N.","Yuki T.","Mateo G.","Zara H.","Ethan C.","Hana L.",
  "Omar A.","Chloe D.","Sahan G.","Nimesha K.","Arjun V.","Maya S.",
  "Leo F.","Ines M.",
];
const REG_SUBS = ["just registered","joined the cohort","signed up","is in!"];
const MILESTONE_STEP = 10;

// ── Odometer reel helpers (module-level, no DOM dependency) ──────────────────
const REEL_TRACK_LEN = 30; // digits 0-9 repeated ×3

function LiveRegistrationsScene() {
  const CIRC = 2 * Math.PI * 150; // 942.477…

  // ── Refs ─────────────────────────────────────────────────────────────────────
  const starsCanvasRef  = useRef<HTMLCanvasElement>(null);
  const confCanvasRef   = useRef<HTMLCanvasElement>(null);
  const stageRef        = useRef<HTMLDivElement>(null);
  const numElRef        = useRef<HTMLDivElement>(null);
  const cometRef        = useRef<SVGGElement>(null);
  const flashColorRef   = useRef("rgba(79,157,255,.10)");

  // canvas-animation state kept in refs (never needs React re-render)
  const starsRef  = useRef<{ x:number;y:number;vx:number;vy:number;r:number;tw:number;ix:number;iy:number }[]>([]);
  const confRef   = useRef<{ x:number;y:number;vx:number;vy:number;r:number;rot:number;vr:number;life:number;decay:number;color:string;shape:number }[]>([]);
  const wRef      = useRef(0);
  const hRef      = useRef(0);
  const t0Ref     = useRef(0);
  const rafRef    = useRef(0);

  // live-data refs
  const lastJoinRef  = useRef<number | null>(null);
  const joinTimesRef = useRef<number[]>([]);
  const countRef     = useRef(0);

  // id counters
  const toastIdRef = useRef(0);
  const chipIdRef  = useRef(0);
  const shockIdRef = useRef(0);

  // ── React state ──────────────────────────────────────────────────────────────
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

  // ── Stars + confetti canvas loop ──────────────────────────────────────────────
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

      // stars
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

      // confetti
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
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // ── Star ripple ───────────────────────────────────────────────────────────────
  const ripple = React.useCallback((strength: number) => {
    const W = wRef.current, H = hRef.current;
    const cx = W / 2, cy = H / 2;
    for (const s of starsRef.current) {
      const dx = s.x - cx, dy = s.y - cy, d = Math.hypot(dx, dy) || 1;
      const f = strength * 90 / d;
      s.ix += dx / d * f; s.iy += dy / d * f;
    }
  }, []);

  // ── Canvas confetti burst ─────────────────────────────────────────────────────
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

  // ── Odometer ─────────────────────────────────────────────────────────────────
  const renderOdometer = React.useCallback((n: number, dir: number) => {
    const el = numElRef.current;
    if (!el) return;
    const str = String(n);

    // Remove any non-reel children React may have left (safety guard)
    [...el.children].forEach(c => {
      if (!(c as HTMLElement).classList.contains("lr-reel")) c.remove();
    });

    // add reels
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
    // remove extra reels
    while (el.children.length > str.length) el.firstElementChild?.remove();
    // move each reel
    [...el.children].forEach((reel, i) => {
      const d = +str[i];
      const track = reel.firstElementChild as HTMLElement;
      if (!track) return;
      let pos = +(reel as HTMLElement).dataset.pos!;
      const cur = pos % 10;
      if (cur === d) return;
      const delta = dir >= 0 ? (d - cur + 10) % 10 : -((cur - d + 10) % 10);
      if (pos + delta < 0 || pos + delta >= REEL_TRACK_LEN) {
        track.style.transition = "none";
        pos = 10 + cur;
        track.style.transform = `translateY(${-pos}em)`;
        void track.offsetWidth;
        track.style.transition = "";
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
          track.style.transition = "none";
          (reel as HTMLElement).dataset.pos = String(nn);
          track.style.transform = `translateY(${-nn}em)`;
          void track.offsetWidth;
          track.style.transition = "";
        }
      }, 900);
    });
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────────
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
    // start exit animation
    setTimeout(() => setToasts(p => p.map(t => t.id === id ? { ...t, out: true } : t)), 4200);
    // remove from DOM
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4800);
  }, []);

  const updateProgress = React.useCallback((n: number) => {
    const inStep = n % MILESTONE_STEP;
    const pct = inStep / MILESTONE_STEP;
    setArcOffset(CIRC * (1 - Math.min(1, Math.max(0, pct))));
    setToGo(inStep === 0 ? MILESTONE_STEP : MILESTONE_STEP - inStep);
    setNextGold(inStep >= MILESTONE_STEP - 2 && n > 0);
  }, [CIRC]);

  // ── Increment handler ─────────────────────────────────────────────────────────
  // ── Core increment animation (shared by both toast variants) ─────────────────
  const runIncrementEffects = React.useCallback((newCount: number) => {
    const milestone = newCount % MILESTONE_STEP === 0;
    renderOdometer(newCount, +1);
    setHistory(h => [...h.slice(-23), { v: newCount, down: false }]);
    lastJoinRef.current = Date.now();
    joinTimesRef.current = [...joinTimesRef.current.filter(t => Date.now() - t < 60000), Date.now()];

    popClass(setBump, 600);
    popClass(setGlitch, 350);
    popClass(setLastPopd, 500);
    addChip(`+1`, milestone ? "gold" : "");
    setCometKey(k => k + 1);

    if (milestone) {
      setArcOffset(0);
      setIsMilestone(true);
      setShowRose(false);
      popClass(setGoldCls, 900);
      popClass(setShake, 500);
      addShock("gold");
      setTimeout(() => addShock("gold"), 150);
      setTimeout(() => addShock(""), 300);
      flashColorRef.current = "rgba(255,209,102,.16)";
      setFlashKey(k => k + 1);
      ripple(3.2);
      burst(160, ["#ffd166","#fff3c4","#5ee1ff","#ffffff","#ff9f68"], 9);
      setBanner(`✦ ${newCount} mentees — milestone reached`);
      setTimeout(() => setBanner(null), 3200);
      setTimeout(() => {
        setIsMilestone(false);
        setArcOffset(CIRC);
        updateProgress(newCount);
      }, 1500);
    } else {
      updateProgress(newCount);
      setShowRose(false);
      addShock("");
      flashColorRef.current = "rgba(79,157,255,.10)";
      setFlashKey(k => k + 1);
      ripple(1.4);
      burst(26, ["#5ee1ff","#4f9dff","#ffffff","#a5b4fc"], 5);
    }
  }, [addChip, addShock, burst, popClass, renderOdometer, ripple, updateProgress, CIRC]);

  // Used when no real name is available (shouldn't happen in normal flow)
  const handleIncrement = React.useCallback((newCount: number) => {
    addToast();
    runIncrementEffects(newCount);
  }, [addToast, runIncrementEffects]);

  // Used by the poll when a real name toast is fired separately
  const handleIncrementNoToast = React.useCallback((newCount: number) => {
    runIncrementEffects(newCount);
  }, [runIncrementEffects]);

  // ── Poll API ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    // Track the last joiner name+timestamp we've already acted on, so we
    // don't fire a toast on every 3-second poll for the same person.
    let lastSeenAt: string | null = null;

    const poll = async () => {
      try {
        const res = await fetch("/api/display/registrations");
        if (!res.ok) return;
        const data = await res.json() as { count: number; latestName: string | null; latestAt: string | null };
        if (cancelled) return;

        // Sync the "last joined" ref from the real DB timestamp so the
        // "X ago" ticker stays accurate even after a page reload.
        if (data.latestAt) {
          const ts = new Date(data.latestAt).getTime();
          if (!lastJoinRef.current || ts > lastJoinRef.current) {
            lastJoinRef.current = ts;
          }
        }

        setCount(prev => {
          const n = data.count;
          if (prev === null) {
            // First load — set everything up without triggering animations.
            countRef.current = n;
            updateProgress(n);
            renderOdometer(n, +1);
            setHistory([{ v: n, down: false }]);
            lastSeenAt = data.latestAt;
          } else if (n > prev) {
            // New registration(s) arrived.
            countRef.current = n;
            // Fire real toast only if it's a new joiner we haven't shown yet.
            if (data.latestAt && data.latestAt !== lastSeenAt && data.latestName) {
              lastSeenAt = data.latestAt;
              // Temporarily override addToast to use the real name.
              const realName = data.latestName;
              const sub      = REG_SUBS[Math.floor(Math.random() * REG_SUBS.length)];
              const hue      = [...realName].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 360, 7);
              const id       = ++toastIdRef.current;
              setToasts(p => [...p.slice(-3), { id, name: realName, sub, hue, out: false }]);
              setTimeout(() => setToasts(p => p.map(t => t.id === id ? { ...t, out: true } : t)), 4200);
              setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4800);
            }
            handleIncrementNoToast(n);
          } else if (n < prev) {
            // A registration was removed.
            countRef.current = n;
            renderOdometer(n, -1);
            setHistory(h => [...h.slice(-23), { v: n, down: true }]);
            popClass(setDipCls, 500);
            popClass(setShake, 400);
            setShowRose(true);
            setTimeout(() => setShowRose(false), 700);
            addShock("rose");
            addChip("−1", "minus");
            flashColorRef.current = "rgba(255,107,139,.09)";
            setFlashKey(k => k + 1);
            ripple(-1);
            updateProgress(n);
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

  // ── Live meta ticker ──────────────────────────────────────────────────────────
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

  return (
    <div style={{
      position:"fixed", inset:0,
      fontFamily:'"Manrope",sans-serif', WebkitFontSmoothing:"antialiased",
      color:"#eef5ff",
      background:"radial-gradient(ellipse 130% 90% at 50% -10%,#0d1b4a 0%,#030a1c 55%,#020810 100%)",
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      overflow:"hidden", minHeight:"100vh",
    }}>

      {/* ── Stars canvas ── */}
      <canvas ref={starsCanvasRef} style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0 }} />

      {/* ── Aurora layers ── */}
      <div style={{ position:"fixed", left:"50%", top:"50%", width:"120vmax", height:"120vmax", margin:"-60vmax 0 0 -60vmax", borderRadius:"50%", pointerEvents:"none", filter:"blur(70px)", opacity:.22, willChange:"transform", background:"conic-gradient(from 0deg,transparent 0deg,rgba(79,157,255,.7) 60deg,transparent 120deg,rgba(99,102,241,.6) 200deg,transparent 260deg,rgba(94,225,255,.5) 320deg,transparent 360deg)", animation:"lr-aurora-a 60s linear infinite" }} />
      <div style={{ position:"fixed", left:"50%", top:"50%", width:"120vmax", height:"120vmax", margin:"-60vmax 0 0 -60vmax", borderRadius:"50%", pointerEvents:"none", filter:"blur(70px)", opacity:.16, willChange:"transform", background:"conic-gradient(from 180deg,transparent 0deg,rgba(94,225,255,.5) 90deg,transparent 180deg,rgba(99,102,241,.5) 270deg,transparent 360deg)", animation:"lr-aurora-a 85s linear infinite reverse" }} />

      {/* ── Grid ── */}
      <div style={{ position:"fixed", inset:"-72px", pointerEvents:"none", zIndex:0, backgroundImage:"linear-gradient(rgba(79,157,255,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(79,157,255,.045) 1px,transparent 1px)", backgroundSize:"72px 72px", WebkitMaskImage:"radial-gradient(ellipse 80% 80% at 50% 50%,#000 20%,transparent 75%)", maskImage:"radial-gradient(ellipse 80% 80% at 50% 50%,#000 20%,transparent 75%)", animation:"lr-grid 40s linear infinite" }} />

      {/* ── Orbs ── */}
      <div style={{ position:"fixed", width:"55vw", height:"55vw", top:"-20%", left:"50%", transform:"translateX(-50%)", borderRadius:"50%", background:"radial-gradient(circle,rgba(79,157,255,.22) 0%,transparent 70%)", filter:"blur(80px)", pointerEvents:"none", zIndex:0, animation:"lr-orb1 18s ease-in-out infinite" }} />
      <div style={{ position:"fixed", width:"35vw", height:"35vw", bottom:"-8%", left:"8%",  borderRadius:"50%", background:"radial-gradient(circle,rgba(99,102,241,.22) 0%,transparent 70%)", filter:"blur(70px)", pointerEvents:"none", zIndex:0, animation:"lr-orb2 24s ease-in-out infinite" }} />
      <div style={{ position:"fixed", width:"35vw", height:"35vw", bottom:"-8%", right:"8%", borderRadius:"50%", background:"radial-gradient(circle,rgba(94,225,255,.16) 0%,transparent 70%)", filter:"blur(70px)", pointerEvents:"none", zIndex:0, animation:"lr-orb3 20s ease-in-out infinite" }} />

      {/* ── Vignette ── */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:1, background:"radial-gradient(ellipse 90% 90% at 50% 50%,transparent 55%,rgba(2,8,16,.65) 100%)" }} />

      {/* ── Flash overlay ── */}
      <div key={flashKey} style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:2, background:`radial-gradient(circle at 50% 50%,${flashColorRef.current},transparent 65%)`, animation: flashKey > 0 ? "lr-flash .8s ease-out forwards" : "none", opacity: flashKey > 0 ? 1 : 0 }} />

      {/* ── Confetti canvas ── */}
      <canvas ref={confCanvasRef} style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:30 }} />

      {/* ── Header logo ── */}
      <div style={{ position:"absolute", top:"clamp(20px,3vh,40px)", left:"50%", transform:"translateX(-50%)", zIndex:5, animation:"lr-float 6s ease-in-out infinite" }}>
        <img src="/logo2.png" alt="Logo" onError={(e) => { (e.target as HTMLImageElement).style.display="none"; }} style={{ width:"clamp(32px,2.8vh,42px)", height:"clamp(32px,2.8vh,42px)", objectFit:"contain", display:"block", filter:"drop-shadow(0 0 14px rgba(79,157,255,.55))" }} />
      </div>

      {/* ── Live pill ── */}
      <div style={{ position:"fixed", top:"clamp(20px,3vh,40px)", right:"clamp(20px,3vw,40px)", zIndex:5, display:"flex", alignItems:"center", gap:10, background:"rgba(8,20,50,.75)", border:"1px solid rgba(140,190,255,.13)", borderRadius:999, padding:"9px 18px", fontSize:13, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:"#c3d6f5", backdropFilter:"blur(10px)", overflow:"hidden" }}>
        {/* sheen sweep */}
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(110deg,transparent 30%,rgba(140,190,255,.12) 50%,transparent 70%)", animation:"lr-pill-sheen 6s ease-in-out infinite", pointerEvents:"none" }} />
        <div style={{ width:9, height:9, borderRadius:"50%", background:"#4f9dff", flexShrink:0, boxShadow:"0 0 0 0 rgba(79,157,255,.6)", animation:"lr-live-dot 1.8s infinite" }} />
        <span>Live</span>
        <span style={{ display:"inline-flex", alignItems:"flex-end", gap:2, height:12, marginLeft:2 }}>
          {[0,-.3,-.6,-.15].map((delay, i) => (
            <i key={i} style={{ width:3, height:4, background:"#5ee1ff", borderRadius:2, opacity:.8, display:"inline-block", animation:`lr-eq 1.1s ease-in-out ${delay}s infinite` }} />
          ))}
        </span>
      </div>

      {/* ── Milestone banner ── */}
      <div style={{ position:"fixed", top:"clamp(80px,12vh,120px)", left:"50%", transform:`translateX(-50%) translateY(${banner ? 0 : -30}px)`, opacity: banner ? 1 : 0, transition:"transform .6s cubic-bezier(.34,1.56,.64,1),opacity .4s", display:"flex", alignItems:"center", gap:12, padding:"12px 26px", borderRadius:999, zIndex:9, background:"linear-gradient(90deg,rgba(255,209,102,.15),rgba(255,209,102,.05))", border:"1px solid rgba(255,209,102,.5)", boxShadow:"0 0 40px rgba(255,209,102,.35)", fontWeight:800, letterSpacing:".12em", textTransform:"uppercase", fontSize:14, color:"#ffd166", backdropFilter:"blur(12px)", pointerEvents:"none" }}>
        <span style={{ display:"inline-block", animation:"lr-spin 3s linear infinite" }}>✦</span>
        <span>{banner}</span>
        <span style={{ display:"inline-block", animation:"lr-spin 3s linear infinite" }}>✦</span>
      </div>

      {/* ── Ring stage ── */}
      <div
        ref={stageRef}
        style={{ position:"relative", zIndex:3, width:"clamp(280px,36vw,440px)", height:"clamp(280px,36vw,440px)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, animation: shake ? "lr-shake .5s cubic-bezier(.36,.07,.19,.97) both" : "lr-float 7s ease-in-out infinite" }}
      >
        {/* idle pulse rings */}
        <div style={{ position:"absolute", width:"118%", height:"118%", borderRadius:"50%", border:"1px solid rgba(79,157,255,.12)", pointerEvents:"none", animation:"lr-idle-ring 4.5s ease-out 0s infinite" }} />
        <div style={{ position:"absolute", width:"108%", height:"108%", borderRadius:"50%", border:"1px solid rgba(79,157,255,.07)", pointerEvents:"none", animation:"lr-idle-ring 4.5s ease-out -1.5s infinite" }} />
        <div style={{ position:"absolute", width:"128%", height:"128%", borderRadius:"50%", border:"1px solid rgba(94,225,255,.05)", pointerEvents:"none", animation:"lr-idle-ring 4.5s ease-out -3s infinite" }} />

        {/* radar sweep */}
        <div style={{ position:"absolute", inset:0, borderRadius:"50%", pointerEvents:"none", background:"conic-gradient(from 0deg,transparent 0deg 300deg,rgba(94,225,255,.28) 360deg)", WebkitMask:"radial-gradient(circle,transparent 69%,#000 70%,#000 80%,transparent 81%)", mask:"radial-gradient(circle,transparent 69%,#000 70%,#000 80%,transparent 81%)", animation:"lr-spin 7s linear infinite", opacity:.85 }} />

        {/* shockwaves */}
        {shocks.map(s => {
          const col = s.kind === "rose" ? "#ff6b8b" : s.kind === "gold" ? "#ffd166" : "#5ee1ff";
          const glow = s.kind === "rose" ? "0 0 20px #ff6b8b" : s.kind === "gold" ? "0 0 40px #ffd166,inset 0 0 40px #ffd166" : "0 0 30px #4f9dff,inset 0 0 30px #4f9dff";
          return <div key={s.id} style={{ position:"absolute", left:"50%", top:"50%", width:"75%", height:"75%", margin:"-37.5% 0 0 -37.5%", borderRadius:"50%", border:`2px solid ${col}`, pointerEvents:"none", opacity:0, boxShadow:glow, animation:"lr-shock 1s cubic-bezier(.2,.8,.2,1) forwards" }} />;
        })}

        {/* SVG ring */}
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

          {/* tick ring — orbits slowly */}
          <g style={{ transformOrigin:"200px 200px", animation:"lr-spin 120s linear infinite" }}>
            {Array.from({ length: 72 }, (_, i) => {
              const major = i % 6 === 0;
              const a = (i / 72) * Math.PI * 2;
              const r1 = 186, r2 = major ? 198 : 193;
              const x1 = 200 + r1 * Math.sin(a), y1 = 200 - r1 * Math.cos(a);
              const x2 = 200 + r2 * Math.sin(a), y2 = 200 - r2 * Math.cos(a);
              return <line key={i} x1={x1.toFixed(2)} y1={y1.toFixed(2)} x2={x2.toFixed(2)} y2={y2.toFixed(2)} stroke={major ? "rgba(94,225,255,.55)" : "rgba(79,157,255,.22)"} strokeWidth={major ? 2 : 1} strokeLinecap="round" />;
            })}
          </g>

          {/* dashed counter-rotating ring */}
          <circle cx="200" cy="200" r="172" fill="none" stroke="rgba(94,225,255,.22)" strokeWidth="1.5" strokeDasharray="2 9" style={{ transformOrigin:"200px 200px", animation:"lr-spin 80s linear infinite reverse" }} />

          {/* dim track */}
          <circle cx="200" cy="200" r="150" fill="none" stroke={isMilestone ? "rgba(255,209,102,.25)" : "rgba(79,157,255,.12)"} strokeWidth="7" style={{ transition:"stroke .4s" }} />

          {/* progress arc */}
          <circle cx="200" cy="200" r="150" fill="none"
            stroke={isMilestone ? "url(#lr-gold)" : showRose ? "url(#lr-rose)" : "url(#lr-grad)"}
            strokeWidth="7" strokeLinecap="round"
            transform="rotate(-90 200 200)"
            strokeDasharray={`${CIRC} ${CIRC}`}
            strokeDashoffset={arcOffset}
            filter="url(#lr-glow-s)"
            style={{ transition:"stroke-dashoffset .9s cubic-bezier(.2,.8,.2,1),stroke .4s" }}
          />

          {/* satellites */}
          <g style={{ transformOrigin:"200px 200px", animation:"lr-spin 14s linear infinite" }}>
            <circle cx="200" cy="50"  r="3.5" fill="#5ee1ff" filter="url(#lr-glow)" />
          </g>
          <g style={{ transformOrigin:"200px 200px", animation:"lr-spin 22s linear infinite reverse" }}>
            <circle cx="200" cy="28"  r="2.5" fill="#8fb8ff" filter="url(#lr-glow)" opacity=".8" />
          </g>
          <g style={{ transformOrigin:"200px 200px", animation:"lr-spin 9s linear infinite" }}>
            <circle cx="200" cy="78"  r="2"   fill="#c7b3ff" filter="url(#lr-glow)" opacity=".8" />
          </g>

          {/* comet — re-keyed on every registration to restart animation */}
          <g key={cometKey} ref={cometRef} style={{ transformOrigin:"200px 200px", animation: cometKey > 0 ? "lr-comet 1.15s cubic-bezier(.25,.75,.25,1) forwards" : "none", opacity: cometKey > 0 ? 0 : 0 }}>
            <path d="M136.6 64.1 A150 150 0 0 1 200 50" stroke="url(#lr-tail)" strokeWidth="5" strokeLinecap="round" fill="none" />
            <circle cx="200" cy="50" r="6" fill="#fff" filter="url(#lr-glow)" />
          </g>
        </svg>

        {/* odometer counter */}
        <div style={{ position:"absolute", textAlign:"center", pointerEvents:"none", zIndex:4 }}>
          {/* Loading dash — shown only before first poll result, sits OUTSIDE numElRef */}
          {count === null && (
            <div style={{
              fontSize:"clamp(88px,11.5vw,150px)", fontWeight:800, lineHeight:1,
              color:"rgba(140,190,255,.4)",
              filter:"drop-shadow(0 0 26px rgba(79,157,255,.3))",
            }}>—</div>
          )}
          {/* numElRef is always empty from React's side — reels are injected imperatively */}
          <div
            ref={numElRef}
            aria-live="polite"
            style={{
              fontSize:"clamp(88px,11.5vw,150px)", fontWeight:800, lineHeight:1,
              fontVariantNumeric:"tabular-nums", color:"#fff",
              display: count === null ? "none" : "flex",
              justifyContent:"center",
              filter: bump ? "drop-shadow(0 0 40px rgba(94,225,255,.95))" : dipCls ? "drop-shadow(0 0 30px rgba(255,107,139,.8))" : goldCls ? "drop-shadow(0 0 46px rgba(255,209,102,1))" : "drop-shadow(0 0 26px rgba(79,157,255,.55))",
              transform: bump ? "scale(1.12)" : dipCls ? "scale(.94)" : goldCls ? "scale(1.18)" : "scale(1)",
              transition:"transform .5s cubic-bezier(.34,1.56,.64,1),filter .3s",
              animation: glitch ? "lr-glitch .35s steps(2) 1" : "lr-num-breathe 5s ease-in-out infinite",
            }}
          />
          <div style={{ fontSize:"clamp(12px,1.3vw,18px)", fontWeight:700, letterSpacing:".22em", textTransform:"uppercase", marginTop:8, background:"linear-gradient(90deg,rgba(140,190,255,.45) 0%,rgba(140,190,255,.45) 40%,#fff 50%,rgba(140,190,255,.45) 60%,rgba(140,190,255,.45) 100%)", backgroundSize:"250% 100%", WebkitBackgroundClip:"text", backgroundClip:"text", color:"transparent", animation:"lr-shimmer 4.5s linear infinite" }}>
            mentees registered
          </div>
        </div>

        {/* floating chips */}
        {chips.map(c => (
          <div key={c.id} style={{ position:"absolute", left:"50%", top:"50%", fontWeight:800, fontSize: c.kind === "gold" ? "clamp(22px,2.6vw,34px)" : "clamp(18px,2vw,26px)", color: c.kind === "minus" ? "#ff6b8b" : c.kind === "gold" ? "#ffd166" : "#5ee1ff", textShadow:`0 0 ${c.kind === "gold" ? 22 : 18}px ${c.kind === "minus" ? "#ff6b8b" : c.kind === "gold" ? "#ffd166" : "#5ee1ff"}`, pointerEvents:"none", zIndex:6, ["--dx" as string]:`${c.dx}px`, ["--dy" as string]:`${c.dy}px`, animation:"lr-chip 1.3s cubic-bezier(.2,.8,.2,1) forwards" }}>
            {c.text}
          </div>
        ))}
      </div>

      {/* ── Meta stats ── */}
      <div style={{ display:"flex", gap:12, marginTop:"clamp(22px,3.2vh,40px)", zIndex:3, flexWrap:"wrap", justifyContent:"center" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 14px", borderRadius:999, background:"rgba(8,20,50,.6)", border:`1px solid ${nextGold ? "rgba(255,209,102,.5)" : "rgba(140,190,255,.12)"}`, fontSize:12, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", color:"rgba(195,214,245,.75)", backdropFilter:"blur(8px)", transition:"border-color .3s,transform .3s cubic-bezier(.34,1.56,.64,1)" }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background: nextGold ? "#ffd166" : "#5ee1ff", boxShadow:`0 0 8px ${nextGold ? "#ffd166" : "#5ee1ff"}` }} />
          <span><b style={{ color:"#fff" }}>{toGo}</b> to next milestone</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 14px", borderRadius:999, background:"rgba(8,20,50,.6)", border:`1px solid ${lastPopd ? "rgba(94,225,255,.5)" : "rgba(140,190,255,.12)"}`, fontSize:12, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", color:"rgba(195,214,245,.75)", backdropFilter:"blur(8px)", transform: lastPopd ? "scale(1.08)" : "scale(1)", transition:"border-color .3s,transform .3s cubic-bezier(.34,1.56,.64,1)" }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:"#5ee1ff", boxShadow:"0 0 8px #5ee1ff" }} />
          <span>Last joined <b style={{ color:"#fff" }}>{lastAgo}</b></span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 14px", borderRadius:999, background:"rgba(8,20,50,.6)", border:"1px solid rgba(140,190,255,.12)", fontSize:12, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", color:"rgba(195,214,245,.75)", backdropFilter:"blur(8px)" }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:"#5ee1ff", boxShadow:"0 0 8px #5ee1ff" }} />
          <span><b style={{ color:"#fff" }}>{rate}</b> / min</span>
        </div>
      </div>

      {/* ── Sparkline ── */}
      {history.length > 1 && (
        <div style={{ display:"flex", alignItems:"flex-end", gap:5, height:44, marginTop:18, zIndex:3 }}>
          {(() => {
            const maxH = Math.max(...history.map(x => x.v));
            return history.map((h, i) => {
              const px = maxH > 0 ? Math.round((h.v / maxH) * 40) : 4;
              const isLast = i === history.length - 1;
              return (
                <div key={i} style={{ width:7, height:`${Math.max(px,4)}px`, borderRadius:4, transformOrigin:"bottom", flexShrink:0, background: h.down ? "linear-gradient(180deg,#ff6b8b,rgba(255,107,139,.2))" : isLast ? "linear-gradient(180deg,#fff,#5ee1ff)" : "linear-gradient(180deg,rgba(79,157,255,.6),rgba(79,157,255,.18))", boxShadow: isLast ? "0 0 12px #5ee1ff" : h.down ? "0 0 10px rgba(255,107,139,.6)" : undefined, transition:"height .6s cubic-bezier(.34,1.56,.64,1),background .4s", animation:"lr-bar-in .5s cubic-bezier(.34,1.56,.64,1) both" }} />
              );
            });
          })()}
        </div>
      )}

      {/* ── Joiner feed ── */}
      <div style={{ position:"fixed", left:"clamp(18px,3vw,40px)", bottom:"clamp(24px,5vh,48px)", display:"flex", flexDirection:"column", gap:10, zIndex:8, pointerEvents:"none" }}>
        {toasts.map(t => (
          <div key={t.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 16px 10px 10px", borderRadius:16, background:"rgba(8,20,50,.78)", border:"1px solid rgba(140,190,255,.16)", backdropFilter:"blur(12px)", boxShadow:"0 10px 30px rgba(0,0,0,.35),0 0 0 1px rgba(94,225,255,.05) inset", transformOrigin:"left center", animation: t.out ? "lr-toast-out .5s ease-in forwards" : "lr-toast-in .6s cubic-bezier(.34,1.56,.64,1) both" }}>
            {/* avatar with ring pulse */}
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

        /* ── keyframes ── */
        @keyframes lr-spin         { to { transform: rotate(360deg); } }
        @keyframes lr-aurora-a     { to { transform: rotate(360deg); } }
        @keyframes lr-grid         { to { background-position: 72px 72px; } }
        @keyframes lr-float        { 0%,100% { translate: 0 0; } 50% { translate: 0 -6px; } }
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
        @keyframes lr-glitch       {
          0%  {transform:translate(0) skewX(0);filter:drop-shadow(-4px 0 0 rgba(255,0,80,.8)) drop-shadow(4px 0 0 rgba(0,255,255,.8))}
          50% {transform:translate(-3px,1px) skewX(-4deg)}
          100%{transform:translate(0) skewX(0)}
        }
        @keyframes lr-shake {
          10%,90%{transform:translate(-1px,0)} 20%,80%{transform:translate(2px,0)}
          30%,50%,70%{transform:translate(-3px,0)} 40%,60%{transform:translate(3px,0)}
        }
        @keyframes lr-chip {
          0%  {opacity:0;transform:translate(var(--dx),calc(var(--dy) + 20px)) scale(.6)}
          20% {opacity:1;transform:translate(var(--dx),var(--dy)) scale(1.15)}
          100%{opacity:0;transform:translate(calc(var(--dx) * 1.3),calc(var(--dy) - 90px)) scale(.9)}
        }
        @keyframes lr-flash        { 0%{opacity:1} 100%{opacity:0} }
        @keyframes lr-bar-in       { from{transform:scaleY(0);opacity:0} to{transform:scaleY(1);opacity:1} }
        @keyframes lr-toast-in     { from{opacity:0;transform:translateX(-40px) scale(.8)} to{opacity:1;transform:none} }
        @keyframes lr-toast-out    { to{opacity:0;transform:translateX(-20px) scale(.9)} }
        @keyframes lr-avatar-ring  { from{transform:scale(1);opacity:1} to{transform:scale(1.8);opacity:0} }

        /* ── odometer reels ── */
        .lr-reel {
          height: 1em; overflow: hidden; display: inline-block; margin: 0 -.015em;
        }
        .lr-reel-enter { animation: lr-reel-in .6s cubic-bezier(.34,1.56,.64,1) both; }
        @keyframes lr-reel-in { from{opacity:0;transform:translateY(-.4em) scale(.6)} to{opacity:1;transform:none} }
        .lr-reel-track {
          display: flex; flex-direction: column;
          transition: transform .75s cubic-bezier(.22,1.15,.36,1);
          will-change: transform;
        }
        .lr-reel-track span { height: 1em; line-height: 1; display: block; }

        @media (max-width: 760px) { #lr-feed { display: none; } }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration:.01ms !important; transition-duration:.01ms !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Shared robot logo mark + keyframes ──────────────────────────────────────

/**
 * RoboStyles — inject keyframes once. Render it anywhere; the <style> tag is
 * idempotent in the browser (duplicate keyframe names just overwrite each other).
 */
function RoboStyles() {
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
 * RobotLogoMark — the animated blue rounded-square face.
 *
 * size  — CSS length string for both width & height, e.g. "clamp(40px,3.4vh,52px)"
 * glow  — whether to render the pulsing halo ring (used on loading screen, not header)
 */
function RobotLogoMark({ size, glow = false }: { size: string; glow?: boolean }) {
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

// ── Mentor load constellation ─────────────────────────────────────────────────
// Renders a responsive grid of mentor tiles, coloured by load level exactly
// matching new4.html's .tile[data-l] scale.
function MentorLoadGrid({ mentors, hitName }: { mentors: { name: string; allocated: number; capacity: number }[]; hitName: string | null }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cols, setCols] = useState(6);
  const [tileSize, setTileSize] = useState(44);
  // Track which tiles were *previously* hit so we can re-trigger the animation key
  const hitCountRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const fit = () => {
      const W = el.clientWidth, H = el.clientHeight, n = mentors.length;
      if (!W || !H || !n) return;
      let best = { cols: 6, size: 0 };
      for (let c = 4; c <= 12; c++) {
        const rows = Math.ceil(n / c);
        const size = Math.min((W - 5 * (c - 1)) / c, (H - 5 * (rows - 1)) / rows);
        if (size > best.size) best = { cols: c, size };
      }
      setCols(best.cols);
      setTileSize(Math.floor(best.size));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [mentors.length]);

  // Bump hit counter for the matching tile so key changes → animation restarts
  if (hitName) {
    hitCountRef.current.set(hitName, (hitCountRef.current.get(hitName) ?? 0) + 1);
  }

  const tileStyle = (allocated: number, capacity: number): React.CSSProperties => {
    // Use capacity-aware level when capacity is known, else use fixed thresholds
    const level = capacity > 0
      ? (allocated === 0 ? 0 : allocated < capacity * 0.34 ? 1 : allocated < capacity * 0.67 ? 2 : allocated < capacity ? 3 : 4)
      : (allocated === 0 ? 0 : allocated === 1 ? 1 : allocated <= 3 ? 2 : allocated <= 5 ? 3 : 4);

    if (level === 0) return { background:"rgba(140,190,255,.08)", border:"1px solid rgba(140,190,255,.12)", color:"#7d97c2" };
    if (level === 1) return { background:"rgba(79,157,255,.22)",  border:"1px solid rgba(79,157,255,.38)",  color:"#c3d8ff" };
    if (level === 2) return { background:"rgba(79,157,255,.42)",  border:"1px solid rgba(94,225,255,.5)",   color:"#fff" };
    if (level === 3) return { background:"rgba(94,225,255,.55)",  border:"1px solid rgba(94,225,255,.75)",  color:"#fff" };
    return {
      background:"linear-gradient(145deg,rgba(255,199,102,.6),rgba(94,225,255,.35))",
      border:"1px solid #ffc766",
      color:"#fff",
      boxShadow:"0 0 16px rgba(255,199,102,.32)",
    };
  };

  const ini = (name: string) =>
    name.split(/\s+/).filter((w: string) => w.length > 1 || /^[A-Z]$/.test(w))
      .slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();

  return (
    <div
      ref={containerRef}
      style={{
        display:"grid",
        gridTemplateColumns:`repeat(${cols},${tileSize}px)`,
        gridAutoRows:`${tileSize}px`,
        gap:5,
        alignContent:"start",
        width:"100%",
        height:"100%",
        overflow:"hidden",
      }}
    >
      {mentors.map((m) => {
        const isHit = hitName === m.name;
        const hitCount = hitCountRef.current.get(m.name) ?? 0;
        return (
          <div
            key={`${m.name}-${hitCount}`}
            title={`${m.name} · ${m.allocated}${m.capacity ? `/${m.capacity}` : ""}`}
            style={{
              position:"relative",
              borderRadius:10,
              display:"flex",
              flexDirection:"column",
              alignItems:"center",
              justifyContent:"center",
              gap:2,
              fontSize:`${Math.max(9, Math.floor(tileSize * 0.27))}px`,
              fontWeight:800,
              fontFamily:"Manrope,sans-serif",
              cursor:"default",
              overflow:"hidden",
              transition:"background .45s,border-color .45s,box-shadow .45s",
              animation: isHit ? "alloc-tile-hit .7s cubic-bezier(.34,1.56,.64,1)" : undefined,
              ...tileStyle(m.allocated, m.capacity),
            }}
          >
            {/* Sweep flash on hit */}
            {isHit && (
              <div style={{ position:"absolute", inset:0, background:"linear-gradient(100deg,transparent,rgba(255,255,255,.35),transparent)", animation:"alloc-sweep .55s cubic-bezier(.2,.8,.2,1) forwards", pointerEvents:"none" }} />
            )}
            <span>{ini(m.name)}</span>
            {/* Count indicator — dots ≤5, number badge >5 */}
            {m.allocated > 0 && (
              m.allocated <= 5
                ? (
                  <div style={{ display:"flex", gap:2 }}>
                    {Array.from({ length: m.allocated }, (_, j) => (
                      <span
                        key={j}
                        style={{
                          width:3, height:3, borderRadius:"50%",
                          background:"currentColor", opacity:.9, display:"inline-block",
                          animation: isHit && j === m.allocated - 1
                            ? "alloc-dot-in .35s cubic-bezier(.34,1.56,.64,1) both"
                            : undefined,
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <span style={{
                    fontSize:`${Math.max(8, Math.floor(tileSize * 0.22))}px`,
                    fontWeight:800,
                    lineHeight:1,
                    opacity:.9,
                    animation: isHit ? "alloc-dot-in .35s cubic-bezier(.34,1.56,.64,1) both" : undefined,
                  }}>
                    {m.allocated}
                  </span>
                )
            )}
          </div>
        );
      })}
    </div>
  );
}

function AllocationScene({ scene }: { scene: Extract<DisplayScene, { type: "allocation" }> }) {
  // ── Types ──────────────────────────────────────────────────────────────
  type AllocRow = { mentee: string; mentor: string; method: "preference" | "fallback" | "manual"; priority: number | null };
  type AllocData = { allocations: AllocRow[]; fcfsCount: number; fallbackCount: number; total: number; menteeTotal: number };

  // ── Refs & state ───────────────────────────────────────────────────────
  const allDataRef      = useRef<AllocRow[]>([]);
  const revealedRef     = useRef(0);
  const tickerRef       = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollRef         = useRef<ReturnType<typeof setInterval> | null>(null);
  const menteeTotalRef  = useRef(scene.total || 83);

  // DOM refs for flying-chip positioning
  const queueNodeRef    = useRef<HTMLDivElement>(null);
  const fcfsEngineRef   = useRef<HTMLDivElement>(null);
  const fbEngineRef     = useRef<HTMLDivElement>(null);
  const assignedNodeRef = useRef<HTMLDivElement>(null);

  const [displayed,    setDisplayed]   = useState<AllocRow[]>([]);   // "Latest matches" column
  const [feedItems,    setFeedItems]   = useState<(AllocRow & {key:number})[]>([]);  // activity feed
  const [fcfsCount,    setFcfsCount]   = useState(0);
  const [fbCount,      setFbCount]     = useState(0);
  const [revealedCount,setRevealedCount] = useState(0);
  const [masterPct,    setMasterPct]   = useState(0);
  const [fcfsPct,      setFcfsPct]     = useState(0);
  const [fbPct,        setFbPct]       = useState(0);
  const [activeEngine, setActiveEngine]= useState<"fcfs"|"fallback"|null>(null);
  const [isComplete,   setIsComplete]  = useState(false);
  const [hasData,      setHasData]     = useState(false);
  const [minDelayDone, setMinDelayDone]= useState(false);   // 4s minimum loading screen
  const [queueItems,   setQueueItems]  = useState<{id:number;name:string;exiting?:boolean}[]>([]);
  // Mentor load constellation — { name, allocatedCount, capacity }[]
  const [mentorLoad,   setMentorLoad]  = useState<{ name: string; allocated: number; capacity: number }[]>([]);
  const feedKeyRef     = useRef(0);
  const qIdRef         = useRef(0);

  // ── 4-second minimum loading screen ───────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setMinDelayDone(true), 4000);
    return () => clearTimeout(t);
  }, []);

  // ── Flying chip ────────────────────────────────────────────────────────
  const flyChip = React.useCallback((initials: string, method: "fcfs" | "fallback") => {
    const from = queueNodeRef.current?.getBoundingClientRect();
    const via  = (method === "fcfs" ? fcfsEngineRef : fbEngineRef).current?.getBoundingClientRect();
    const to   = assignedNodeRef.current?.getBoundingClientRect();
    if (!from || !via || !to) return;

    const isFb  = method === "fallback";
    const chip  = document.createElement("div");
    chip.textContent = initials;
    Object.assign(chip.style, {
      position: "fixed", zIndex: "999", pointerEvents: "none",
      border: "1px solid rgba(255,255,255,.2)",
      background: isFb ? "#0f4a63" : "#1b3d8a",
      color: isFb ? "#e6fbff" : "#e8f1ff",
      borderRadius: "999px", padding: "8px 13px",
      fontSize: "13px", fontWeight: "800",
      fontFamily: "Manrope,sans-serif",
      boxShadow: `0 8px 25px rgba(0,0,0,.4),0 0 22px ${isFb ? "rgba(94,225,255,.3)" : "rgba(79,157,255,.3)"}`,
      whiteSpace: "nowrap",
      left: `${from.right - 60}px`,
      top:  `${from.top + from.height * 0.4}px`,
    });
    document.body.appendChild(chip);

    const y0  = from.top + from.height * 0.4;
    const viaX = via.left - (from.right - 60) + 70;
    const viaY = via.top  + via.height / 2    - y0;
    const toX  = to.left  - (from.right - 60) + 90;
    const toY  = to.top   + 80                 - y0;

    chip.animate(
      [
        { transform: "translate(0,0) scale(.8)",                      opacity: "0" },
        { transform: `translate(${viaX}px,${viaY}px) scale(1)`,      opacity: "1", offset: 0.46 },
        { transform: `translate(${toX}px,${toY}px)   scale(.7)`,     opacity: "0" },
      ],
      { duration: 1050, easing: "cubic-bezier(.2,.75,.2,1)" }
    ).onfinish = () => chip.remove();
  }, []);

  // ── Confetti burst ─────────────────────────────────────────────────────
  const fireConfetti = React.useCallback(() => {
    const colors = ["#4f9dff","#5ee1ff","#ffc766","#eef5ff","#22c55e"];
    const pick = (a: string[]) => a[Math.floor(Math.random() * a.length)];
    for (let i = 0; i < 50; i++) {
      const c = document.createElement("div");
      const x = `${(Math.random() - 0.5) * 700}px`;
      const y = `${-120 + Math.random() * 460}px`;
      const r = `${Math.random() * 700 - 350}deg`;
      Object.assign(c.style, {
        position: "fixed", zIndex: "9999", pointerEvents: "none",
        width: "6px", height: "13px", borderRadius: "3px",
        left: `${48 + Math.random() * 4}%`, top: "55%",
        background: pick(colors),
        animationDelay: `${Math.random() * 0.18}s`,
        animation: `alloc-confetti 1.4s ease-out forwards`,
      });
      c.style.setProperty("--x", x);
      c.style.setProperty("--y", y);
      c.style.setProperty("--r", r);
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 1800);
    }
  }, []);

  // ── Helper: rebuild queue ──────────────────────────────────────────────
  // Shows the next ~4 unallocated mentees from the real data as the queue stack.
  // Falls back to synthetic names only when real data runs out.
  const rebuildQueue = React.useCallback((revealedCount: number) => {
    const all  = allDataRef.current;
    // Peek the next up-to-4 rows after the current revealed index
    const next4 = all.slice(revealedCount, revealedCount + 4);

    // If real data covers all 4 slots, use it directly
    const realNames = next4.map((r) => r.mentee);

    // Pad with synthetic names if not enough real rows remain
    while (realNames.length < 4) {
      realNames.push(`${rand(FIRST)} ${rand(LAST)}`);
    }

    const next = realNames.map((name) => ({ id: ++qIdRef.current, name, exiting: false }));

    setQueueItems((prev) => {
      if (prev.length > 0) {
        // Flag the top card as exiting, then swap in fresh list after 300ms
        const withExit = [{ ...prev[0], exiting: true }, ...prev.slice(1)];
        setTimeout(() => setQueueItems(next), 300);
        return withExit;
      }
      return next;
    });
  }, []);

  // ── Drip-feed ticker ──────────────────────────────────────────────────
  const TICK_MS = 620;

  const scheduleNext = React.useCallback(() => {
    if (tickerRef.current) clearTimeout(tickerRef.current);
    tickerRef.current = setTimeout(() => {
      const all = allDataRef.current;
      const idx = revealedRef.current;
      if (idx >= all.length) return;

      const row    = all[idx];
      const newIdx = idx + 1;
      revealedRef.current = newIdx;

      const isFcfs = row.method === "preference";
      const eng    = isFcfs ? "fcfs" : "fallback";
      const ini    = row.mentee.split(/\s+/).slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();

      // Flash engine + launch chip
      setActiveEngine(eng);
      setTimeout(() => setActiveEngine(null), 500);
      flyChip(ini, eng);

      // Cards appear when chip lands (~510ms) — also hit the mentor tile
      setTimeout(() => {
        setDisplayed((prev) => [row, ...prev].slice(0, 9));
        setFeedItems((prev) => [{ ...row, key: ++feedKeyRef.current }, ...prev].slice(0, 14));

        // ── Mentor load: increment the matched mentor's tile in sync ──────
        const mentorName = row.mentor;
        const map = mentorLoadRef.current;
        // Always upsert — works even if mentor roster fetch hasn't returned yet
        const existing = map.get(mentorName);
        if (existing) {
          map.set(mentorName, { ...existing, allocated: existing.allocated + 1 });
        } else {
          map.set(mentorName, { name: mentorName, allocated: 1, capacity: 0 });
        }
        setMentorLoad(Array.from(map.values()));
        setHitMentorName(mentorName);
        setTimeout(() => setHitMentorName(null), 800);
      }, 510);

      setRevealedCount(newIdx);

      const total   = menteeTotalRef.current;
      const newFcfs = all.slice(0, newIdx).filter((r) => r.method === "preference").length;
      const newFb   = newIdx - newFcfs;
      const allTot  = Math.max(newFcfs + newFb, 1);
      setFcfsCount(newFcfs);
      setFbCount(newFb);
      setMasterPct((newIdx / total) * 100);
      setFcfsPct(Math.min((newFcfs / allTot) * 100, 100));
      setFbPct(Math.min((newFb   / allTot) * 100, 100));

      rebuildQueue(newIdx);

      if (newIdx >= all.length && all.length >= total) {
        setTimeout(() => { setIsComplete(true); fireConfetti(); }, 600);
      } else {
        scheduleNext();
      }
    }, TICK_MS);
  }, [rebuildQueue, flyChip, fireConfetti]);

  // ── Poll DB every 5s for new committed rows ────────────────────────────
  const fetchData = React.useCallback(async () => {
    try {
      const res = await fetch("/api/display/allocations");
      if (!res.ok) return;
      const d = await res.json() as AllocData;
      menteeTotalRef.current = d.menteeTotal || scene.total || 83;

      const prev = allDataRef.current.length;
      allDataRef.current = d.allocations;
      setHasData(true);

      // ── Seed mentor load from the initial allocation batch ──────────────
      // Seed with ZERO allocated counts — the drip-feed ticker will increment
      // each mentor's tile as it reveals rows, keeping counts exactly in sync
      // with the animation. We only need the mentor roster (names + capacity).
      if (prev === 0 && d.allocations.length > 0) {
        try {
          const mr = await fetch("/api/display/mentors");
          if (mr.ok) {
            const md = await mr.json() as { mentors: { name: string; allocatedCount: number; capacity: number }[] };
            const map = new Map<string, { name: string; allocated: number; capacity: number }>();
            // Start everyone at 0 — the ticker increments as it animates
            md.mentors.forEach(m => map.set(m.name, { name: m.name, allocated: 0, capacity: m.capacity }));
            mentorLoadRef.current = map;
            setMentorLoad(Array.from(map.values()));
          }
        } catch { /* ignore */ }

        rebuildQueue(0);
      }

      if (d.allocations.length > prev && revealedRef.current >= prev) {
        scheduleNext();
      }
    } catch { /* ignore */ }
  }, [scene.total, scheduleNext, rebuildQueue]);

  useEffect(() => {
    fetchData();
    pollRef.current = setInterval(fetchData, 5000);
    return () => {
      if (pollRef.current)  clearInterval(pollRef.current);
      if (tickerRef.current) clearTimeout(tickerRef.current);
    };
  }, [fetchData]);

  // ── Mentor load — seeded from allocations, updated in-ticker ─────────────
  // mentorLoadRef is the live mutable map used inside scheduleNext (sync, no stale closure)
  const mentorLoadRef = useRef<Map<string, { name: string; allocated: number; capacity: number }>>(new Map());
  // hitMentorName drives the tile flash animation — set to mentor name on each reveal
  const [hitMentorName, setHitMentorName] = useState<string | null>(null);

  // ── Idle / loading state — robot face (same as header logo, 4s min display) ─
  if (!hasData || !minDelayDone) {
    return (
      <div style={{
        position:"fixed", inset:0,
        background:"radial-gradient(circle at 50% 40%,#061640 0%,#030a1c 60%,#020810 100%)",
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
        overflow:"hidden", fontFamily:"Manrope,sans-serif",
      }}>
        {/* Background grid */}
        <div style={{ position:"absolute", inset:0, pointerEvents:"none",
          backgroundImage:"linear-gradient(rgba(79,157,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(79,157,255,.04) 1px,transparent 1px)",
          backgroundSize:"60px 60px",
          WebkitMaskImage:"radial-gradient(ellipse 70% 70% at 50% 50%,#000 20%,transparent 80%)",
          maskImage:"radial-gradient(ellipse 70% 70% at 50% 50%,#000 20%,transparent 80%)" }} />

        {/* Ambient orbs */}
        <div style={{ position:"absolute", width:"50vw", height:"50vw", borderRadius:"50%", background:"radial-gradient(circle,rgba(79,157,255,.22) 0%,transparent 70%)", filter:"blur(80px)", top:"-10%", left:"50%", transform:"translateX(-50%)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", width:"30vw", height:"30vw", borderRadius:"50%", background:"radial-gradient(circle,rgba(94,225,255,.15) 0%,transparent 70%)", filter:"blur(60px)", bottom:"-5%", left:"20%", animation:"rf-drift1 10s ease-in-out infinite", pointerEvents:"none" }} />
        <div style={{ position:"absolute", width:"30vw", height:"30vw", borderRadius:"50%", background:"radial-gradient(circle,rgba(45,108,240,.2) 0%,transparent 70%)", filter:"blur(60px)", bottom:"-5%", right:"20%", animation:"rf-drift2 12s ease-in-out infinite", pointerEvents:"none" }} />

        {/* ── Logo robot — same component as header, scaled up with glow ── */}
        <RobotLogoMark size="clamp(160px,22vw,260px)" glow />

        {/* Title */}
        <div style={{ marginTop:"clamp(28px,4vh,48px)", textAlign:"center" }}>
          <div style={{ fontSize:"clamp(26px,3.5vw,42px)", fontWeight:800, color:"#eef5ff", letterSpacing:"-.03em", lineHeight:1 }}>
            MentorFlow
          </div>
          <div style={{ fontSize:"clamp(11px,1.2vw,15px)", fontWeight:700, letterSpacing:".22em", textTransform:"uppercase", color:"rgba(140,190,255,.45)", marginTop:10 }}>
            Mentor session · 2026
          </div>
        </div>

        {/* Loading indicator */}
        <div style={{ marginTop:"clamp(24px,3.5vh,42px)", display:"flex", flexDirection:"column", alignItems:"center", gap:14 }}>
          <div style={{ display:"flex", gap:10 }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ width:10, height:10, borderRadius:"50%", background:"#4f9dff", animation:"rf-dot 1.2s ease-in-out infinite", animationDelay:`${i * 0.22}s`, boxShadow:"0 0 10px #4f9dff" }} />
            ))}
          </div>
          <div style={{ fontSize:"clamp(12px,1.1vw,15px)", fontWeight:600, color:"rgba(140,190,255,.4)", letterSpacing:".1em", textTransform:"uppercase" }}>
            Initialising allocation engine…
          </div>
        </div>

        <RoboStyles />
        <style>{`
          @keyframes rf-dot    { 0%,80%,100%{transform:scale(.7);opacity:.4} 40%{transform:scale(1.3);opacity:1} }
          @keyframes rf-drift1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(4vw,-3vh)} }
          @keyframes rf-drift2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-4vw,3vh)} }
        `}</style>
      </div>
    );
  }

  const total      = menteeTotalRef.current;

  const methodLabel = (m: string, p: number | null) => {
    if (m === "preference") return p === 1 ? "1st choice" : p === 2 ? "2nd choice" : p === 3 ? "3rd choice" : "Preference";
    if (m === "fallback")   return "Fallback";
    return "Manual";
  };
  const methodColor = (m: string, p: number | null) => {
    if (m === "preference") return p === 1 ? "#22c55e" : p === 2 ? "#f59e0b" : "#a78bfa";
    return "#38bdf8";
  };

  // ── icon helpers ──────────────────────────────────────────────────────
  const FcfsIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" style={{ width:"clamp(14px,1.2vh,19px)", height:"clamp(14px,1.2vh,19px)" }}>
      <path d="M5 7h14M5 12h10M5 17h6"/>
    </svg>
  );
  const FallbackIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width:"clamp(14px,1.2vh,19px)", height:"clamp(14px,1.2vh,19px)" }}>
      <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>
    </svg>
  );
  const PeopleIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ width:"clamp(22px,2.2vh,30px)", height:"clamp(22px,2.2vh,30px)" }}>
      <circle cx="9" cy="7" r="3"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
      <circle cx="17" cy="7" r="3" opacity=".5"/><path d="M21 21v-2a4 4 0 0 0-3-3.87" opacity=".5"/>
    </svg>
  );
  const LightningIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width:"clamp(11px,1vh,15px)", height:"clamp(11px,1vh,15px)" }}>
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
    </svg>
  );

  return (
    <div style={{
      position:"fixed", inset:0, overflow:"hidden",
      fontFamily:'"DM Sans","Manrope",system-ui,sans-serif',
      WebkitFontSmoothing:"antialiased",
      color:"#eef5ff",
      background:"radial-gradient(circle at 10% 10%,rgba(45,108,240,.28),transparent 34rem),radial-gradient(circle at 90% 15%,rgba(18,182,221,.16),transparent 30rem),radial-gradient(circle at 50% 110%,rgba(79,157,255,.12),transparent 40rem),linear-gradient(150deg,#03081a 0%,#061131 55%,#04091c 100%)",
    }}>
      {/* Grid overlay */}
      <div style={{ position:"absolute", inset:0, pointerEvents:"none", opacity:.4,
        backgroundImage:"linear-gradient(rgba(140,190,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(140,190,255,.05) 1px,transparent 1px)",
        backgroundSize:"60px 60px",
        WebkitMaskImage:"linear-gradient(to bottom,#000,transparent 92%)",
        maskImage:"linear-gradient(to bottom,#000,transparent 92%)" }} />

      {/* Orbs */}
      <div style={{ position:"fixed", width:520, height:520, borderRadius:"50%", filter:"blur(100px)", opacity:.16, left:-200, top:"35%", background:"#4f9dff", animation:"alloc-orb 14s ease-in-out infinite alternate", pointerEvents:"none" }} />
      <div style={{ position:"fixed", width:520, height:520, borderRadius:"50%", filter:"blur(100px)", opacity:.16, right:-200, bottom:-160, background:"#5ee1ff", animation:"alloc-orb 14s ease-in-out infinite alternate", animationDelay:"-6s", pointerEvents:"none" }} />

      {/* Shell */}
      <div style={{ position:"relative", height:"100vh", width:"min(1720px,100%)", margin:"0 auto", padding:"clamp(10px,1.3vh,20px) clamp(20px,3vw,52px)", display:"flex", flexDirection:"column", gap:"clamp(8px,1vh,16px)" }}>

        {/* ── Header ── */}
        <header style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          {/* Brand */}
          <div style={{ display:"flex", alignItems:"center", gap:16, fontFamily:"Manrope,sans-serif", fontWeight:800, letterSpacing:"-.035em", fontSize:"clamp(20px,2.2vh,30px)" }}>
            <RobotLogoMark size="clamp(40px,3.4vh,52px)" />
            <span>MentorFlow
              <small style={{ display:"block", font:`600 clamp(11px,1vh,14px) "DM Sans",sans-serif`, letterSpacing:".14em", textTransform:"uppercase", color:"#8ea6c9", marginTop:2 }}>Mentor session · 2026</small>
            </span>
          </div>
          {/* Live pill */}
          <div style={{ display:"flex", alignItems:"center", gap:10, border:"1px solid rgba(140,190,255,.13)", background:"rgba(8,20,50,.7)", padding:"clamp(8px,.8vh,13px) clamp(14px,1.3vh,20px)", borderRadius:999, color: isComplete ? "#86efac" : "#c3d6f5", fontSize:"clamp(13px,1.15vh,17px)", fontWeight:700, letterSpacing:".1em", textTransform:"uppercase" }}>
            <span style={{ width:10, height:10, borderRadius:"50%", background: isComplete ? "#22c55e" : "#4f9dff", boxShadow: isComplete ? "0 0 8px rgba(34,197,94,.7)" : "0 0 0 0 rgba(79,157,255,.55)", animation: isComplete ? "none" : "alloc-live 1.8s infinite", flexShrink:0, display:"inline-block" }} />
            {isComplete ? "Allocation Complete" : "Allocation Live"}
          </div>
        </header>

        {/* ── Dashboard grid ── */}
        <div style={{ flex:1, minHeight:0, display:"grid", gridTemplateColumns:"minmax(0,1fr) clamp(320px,24vw,420px)", gap:"clamp(8px,1vh,16px)" }}>

          {/* ── Main card ── */}
          <div style={{ position:"relative", minHeight:0, border:"1px solid rgba(140,190,255,.13)", background:"linear-gradient(145deg,rgba(13,30,70,.82),rgba(6,14,38,.86))", boxShadow:"0 30px 90px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.04)", backdropFilter:"blur(20px)", borderRadius:28, padding:"clamp(14px,1.5vh,24px)", display:"flex", flexDirection:"column" }}>
            <div style={{ position:"absolute", inset:0, pointerEvents:"none", borderRadius:28, background:"linear-gradient(115deg,rgba(255,255,255,.035),transparent 28%)" }} />

            {/* Card head */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:14, paddingBottom:"clamp(10px,1.2vh,18px)", flexShrink:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                <h2 style={{ font:`800 clamp(18px,1.7vh,26px) Manrope,sans-serif`, letterSpacing:"-.02em" }}>Allocation pipeline</h2>
                <span style={{ color:"#6f89b3", fontSize:"clamp(13px,1.1vh,17px)" }}>Two strategies · one live process</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:9, color: isComplete ? "#22c55e" : "#4f9dff", fontSize:"clamp(13px,1.1vh,16px)", fontWeight:700, padding:"clamp(6px,.65vh,10px) clamp(12px,1.2vh,18px)", border:`1px solid ${isComplete ? "rgba(34,197,94,.3)" : "rgba(79,157,255,.25)"}`, borderRadius:999, background: isComplete ? "rgba(34,197,94,.1)" : "rgba(79,157,255,.12)" }}>
                {!isComplete && <div style={{ width:13, height:13, border:"2px solid rgba(79,157,255,.25)", borderTopColor:"#4f9dff", borderRadius:"50%", animation:"alloc-spin .8s linear infinite", flexShrink:0 }} />}
                {isComplete ? "Complete" : "Processing"}
              </div>
            </div>

            {/* Flow */}
            <div style={{ position:"relative", flex:1, minHeight:0, display:"grid", gridTemplateColumns:"minmax(180px,.78fr) 52px minmax(260px,1.4fr) 52px minmax(200px,.9fr)", alignItems:"stretch", gap:10 }}>

              {/* ── Queue node ── */}
              <div ref={queueNodeRef} style={{ position:"relative", border:"1px solid rgba(140,190,255,.1)", background:"rgba(3,10,30,.5)", borderRadius:22, padding:"clamp(14px,1.5vh,22px)", overflow:"hidden", display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
                <div>
                  <div style={{ color:"#7d97c2", font:`800 clamp(11px,1vh,14px) Manrope,sans-serif`, letterSpacing:".14em", textTransform:"uppercase", marginBottom:"clamp(12px,1.2vh,18px)", display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ width:"clamp(22px,2vh,28px)", height:"clamp(22px,2vh,28px)", borderRadius:8, background:"rgba(79,157,255,.12)", display:"grid", placeItems:"center", flexShrink:0 }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="#4f9dff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width:"clamp(12px,1.1vh,16px)", height:"clamp(12px,1.1vh,16px)" }}>
                        <path d="M12 5v14M5 12l7 7 7-7"/>
                      </svg>
                    </span>
                    Incoming queue
                  </div>
                  {/* Queue stack */}
                  <div style={{ position:"relative", height:"clamp(140px,15vh,220px)", margin:"0 4px 4px" }}>
                    {queueItems.slice(0, 4).map((item, qi) => {
                      const scales    = [1, 0.94, 0.88, 0.82];
                      const tops      = ["0%", "25%", "50%", "75%"];
                      const opacities = [1, 0.65, 0.38, 0.18];
                      return (
                        <div key={item.id} style={{ position:"absolute", left:0, right:0, height:"clamp(50px,5.2vh,76px)", border:"1px solid rgba(140,190,255,.14)", background:"linear-gradient(145deg,#12275a,#0b1a40)", borderRadius:16, display:"flex", alignItems:"center", gap:12, padding:"clamp(8px,.9vh,13px)", boxShadow:"0 12px 26px rgba(0,0,0,.25)", top:tops[qi], zIndex:4-qi, transform:`scale(${scales[qi]})`, opacity: item.exiting ? 0 : opacities[qi], transformOrigin:"top center", transition:"all .45s cubic-bezier(.2,.8,.2,1)", animation: item.exiting ? "alloc-queueExit .3s cubic-bezier(.4,0,1,1) forwards" : qi === 0 ? "alloc-queueEnter .35s cubic-bezier(.16,1,.3,1) both" : "none" }}>
                          <div style={{ width:"clamp(32px,3.2vh,46px)", height:"clamp(32px,3.2vh,46px)", borderRadius:12, display:"grid", placeItems:"center", background:"linear-gradient(145deg,#2a4f9a,#1a3570)", color:"#d8e8ff", fontSize:"clamp(12px,1.1vh,16px)", fontWeight:800, flexShrink:0 }}>
                            {item.name.split(/\s+/).slice(0,2).map((w:string)=>w[0]).join("").toUpperCase()}
                          </div>
                          <span style={{ minWidth:0 }}>
                            <b style={{ display:"block", fontSize:"clamp(14px,1.3vh,18px)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.name}</b>
                            <small style={{ display:"block", color:"#7c95bf", fontSize:"clamp(11px,1vh,14px)", marginTop:3 }}>Pending</small>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div style={{ display:"flex", alignItems:"flex-end", gap:10 }}>
                  <strong style={{ font:`800 clamp(34px,3.8vh,58px)/.9 Manrope,sans-serif`, letterSpacing:"-.05em", color:"#fff" }}>{total - revealedCount}</strong>
                  <span style={{ fontSize:"clamp(14px,1.2vh,18px)", color:"#7d97c2", paddingBottom:6 }}>waiting</span>
                </div>
              </div>

              {/* Connector → */}
              <div style={{ position:"relative", display:"flex", alignItems:"center" }}>
                <div style={{ height:2, width:"100%", background:"linear-gradient(90deg,rgba(79,157,255,.12),rgba(79,157,255,.7),rgba(79,157,255,.12))" }} />
                <div style={{ position:"absolute", right:0, width:9, height:9, borderTop:"2px solid #4f9dff", borderRight:"2px solid #4f9dff", transform:"rotate(45deg)" }} />
                <div style={{ position:"absolute", width:10, height:10, borderRadius:"50%", background:"#4f9dff", boxShadow:"0 0 14px #4f9dff", animation:"alloc-travel 1.35s linear infinite" }} />
              </div>

              {/* ── Engines ── */}
              <div style={{ display:"grid", gridTemplateRows:"1fr 1fr", gap:10, minHeight:0 }}>
                {([
                  { key:"fcfs",     label:"FCFS allocation",    sub:"First come, first served · queue order preserved", badge:"Primary", count:fcfsCount, pct:fcfsPct, color:"#4f9dff", rgb:"79,157,255", border:"rgba(79,157,255,.28)", bg:"rgba(79,157,255,.16)", Icon: FcfsIcon     },
                  { key:"fallback", label:"Fallback allocation", sub:"Unmatched mentees · random available mentor",       badge:"Random",  count:fbCount,  pct:fbPct,  color:"#5ee1ff", rgb:"94,225,255", border:"rgba(94,225,255,.25)", bg:"rgba(94,225,255,.13)", Icon: FallbackIcon },
                ] as const).map((eng) => (
                  <div key={eng.key} ref={eng.key === "fcfs" ? fcfsEngineRef : fbEngineRef}
                    style={{ position:"relative", border:`1px solid ${eng.border}`, background:`linear-gradient(115deg,${eng.bg},rgba(6,16,45,.4))`, borderRadius:20, padding:"clamp(12px,1.3vh,20px) clamp(14px,1.4vh,22px)", overflow:"hidden", display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
                    {activeEngine === eng.key && (
                      <div style={{ position:"absolute", inset:0, background:"linear-gradient(100deg,transparent,rgba(255,255,255,.12),transparent)", animation:"alloc-sweep .55s cubic-bezier(.2,.8,.2,1) forwards", pointerEvents:"none" }} />
                    )}
                    <div>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:12, font:`800 clamp(15px,1.4vh,20px) Manrope,sans-serif` }}>
                          <div style={{ width:"clamp(30px,2.8vh,42px)", height:"clamp(30px,2.8vh,42px)", borderRadius:11, display:"grid", placeItems:"center", color:eng.color, background:`rgba(${eng.rgb},.15)`, flexShrink:0 }}>
                            <eng.Icon />
                          </div>
                          {eng.label}
                        </div>
                        <span style={{ fontSize:"clamp(11px,1vh,14px)", fontWeight:800, letterSpacing:".08em", textTransform:"uppercase", borderRadius:99, padding:"6px 12px", color:eng.color, background:`rgba(${eng.rgb},.13)`, flexShrink:0 }}>{eng.badge}</span>
                      </div>
                      <p style={{ fontSize:"clamp(12px,1.1vh,15px)", color:"#8aa3cc", marginTop:"clamp(5px,.6vh,9px)" }}>{eng.sub}</p>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:12, marginTop:"clamp(8px,.9vh,14px)" }}>
                      <div style={{ height:6, flex:1, background:"rgba(255,255,255,.07)", borderRadius:6, overflow:"hidden" }}>
                        <div style={{ display:"block", height:"100%", width:`${eng.pct}%`, borderRadius:6, background:eng.color, boxShadow:`0 0 10px ${eng.color}`, transition:"width .45s cubic-bezier(.2,.8,.2,1)" }} />
                      </div>
                      <strong style={{ font:`800 clamp(15px,1.4vh,20px) Manrope,sans-serif`, minWidth:"clamp(46px,4.2vh,64px)", textAlign:"right", color:"#eef5ff" }}>
                        {eng.count}<span style={{ color:"#6f89b3", fontWeight:600 }}>/{total}</span>
                      </strong>
                    </div>
                  </div>
                ))}
              </div>

              {/* Connector → */}
              <div style={{ position:"relative", display:"flex", alignItems:"center" }}>
                <div style={{ height:2, width:"100%", background:"linear-gradient(90deg,rgba(79,157,255,.12),rgba(79,157,255,.7),rgba(79,157,255,.12))" }} />
                <div style={{ position:"absolute", right:0, width:9, height:9, borderTop:"2px solid #4f9dff", borderRight:"2px solid #4f9dff", transform:"rotate(45deg)" }} />
                <div style={{ position:"absolute", width:10, height:10, borderRadius:"50%", background:"#4f9dff", boxShadow:"0 0 14px #4f9dff", animation:"alloc-travel 1.35s linear infinite", animationDelay:"-.7s" }} />
              </div>

              {/* ── Latest matches node ── */}
              <div ref={assignedNodeRef} style={{ border:"1px solid rgba(140,190,255,.1)", background:"rgba(3,10,30,.5)", borderRadius:22, padding:"clamp(14px,1.5vh,22px)", overflow:"hidden", display:"flex", flexDirection:"column", minHeight:0 }}>
                <div style={{ color:"#7d97c2", font:`800 clamp(10px,.9vh,13px) Manrope,sans-serif`, letterSpacing:".14em", textTransform:"uppercase", marginBottom:"clamp(8px,.9vh,13px)", flexShrink:0, display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ width:"clamp(22px,2vh,28px)", height:"clamp(22px,2vh,28px)", borderRadius:8, background:"rgba(79,157,255,.12)", display:"grid", placeItems:"center", flexShrink:0 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#4f9dff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width:"clamp(12px,1.1vh,15px)", height:"clamp(12px,1.1vh,15px)" }}>
                      <circle cx="17" cy="7" r="3"/><circle cx="7" cy="17" r="3"/>
                      <path d="M14 7H7a5 5 0 0 0 0 10h3"/>
                    </svg>
                  </span>
                  Latest matches
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:6, overflow:"hidden", flex:1, minHeight:0 }}>
                  {displayed.map((row, i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:10, border:"1px solid rgba(140,190,255,.1)", background:"rgba(14,30,72,.7)", padding:"clamp(6px,.65vh,9px) clamp(8px,.85vh,12px)", borderRadius:12, flexShrink:0, animation:"alloc-cardIn .55s cubic-bezier(.2,.8,.2,1) both" }}>
                      <div style={{ width:"clamp(28px,2.6vh,38px)", height:"clamp(28px,2.6vh,38px)", borderRadius:9, flexShrink:0, display:"grid", placeItems:"center", background:"linear-gradient(145deg,#1e3a78,#152b5e)", color:"#c3d8ff", fontSize:"clamp(10px,.9vh,13px)", fontWeight:800, letterSpacing:".04em" }}>
                        {row.mentee.split(/\s+/).slice(0,2).map((w:string)=>w[0]).join("").toUpperCase()}
                      </div>
                      <span style={{ minWidth:0, flex:1 }}>
                        <b style={{ display:"block", fontSize:"clamp(12px,1.15vh,16px)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{row.mentee}</b>
                        <small style={{ display:"block", color:"#7c95bf", fontSize:"clamp(10px,1vh,13px)", marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{row.mentor}</small>
                      </span>
                      <div style={{ width:10, height:10, borderRadius:"50%", background: methodColor(row.method, row.priority), boxShadow:`0 0 8px ${methodColor(row.method, row.priority)}`, flexShrink:0 }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Progress footer ── */}
            <div style={{ flexShrink:0, display:"grid", gridTemplateColumns:"1fr auto", gap:18, alignItems:"center", borderTop:"1px solid rgba(140,190,255,.13)", padding:"clamp(10px,1.1vh,16px) 3px 2px", marginTop:"clamp(10px,1.1vh,16px)" }}>
              <div style={{ height:8, borderRadius:10, background:"rgba(255,255,255,.07)", overflow:"hidden" }}>
                <div style={{ display:"block", height:"100%", width:`${masterPct}%`, background:"linear-gradient(90deg,#2d6cf0,#4f9dff,#5ee1ff)", borderRadius:"inherit", boxShadow:"0 0 18px rgba(79,157,255,.55)", transition:"width .45s cubic-bezier(.2,.8,.2,1)" }} />
              </div>
              <div style={{ font:`700 clamp(15px,1.3vh,20px) Manrope,sans-serif`, color:"#8aa3cc", whiteSpace:"nowrap" }}>
                <strong style={{ color:"#eef5ff", fontSize:"clamp(20px,1.8vh,28px)" }}>{revealedCount}</strong>/{total}
                <span style={{ marginLeft:6, color:"#6f89b3", fontSize:"clamp(12px,1vh,15px)", fontWeight:600, textTransform:"uppercase", letterSpacing:".06em" }}>assigned</span>
              </div>
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div style={{ display:"grid", gridTemplateRows:"auto minmax(0,1fr)", gap:"clamp(8px,1vh,16px)", minHeight:0 }}>

            {/* Stats card */}
            <div style={{ border:"1px solid rgba(140,190,255,.13)", background:"linear-gradient(145deg,rgba(13,30,70,.82),rgba(6,14,38,.86))", boxShadow:"0 30px 90px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.04)", backdropFilter:"blur(20px)", borderRadius:24, padding:"clamp(14px,1.4vh,22px)", display:"flex", flexDirection:"column", gap:12 }}>
              {/* Total allocated — full width */}
              <div style={{ position:"relative", padding:"clamp(14px,1.4vh,20px) clamp(16px,1.5vh,24px)", borderRadius:18, background:"linear-gradient(135deg,rgba(79,157,255,.14),rgba(45,108,240,.1))", border:"1px solid rgba(79,157,255,.18)", overflow:"hidden" }}>
                <div style={{ position:"absolute", width:90, height:90, borderRadius:"50%", right:-22, top:-22, background:"#4f9dff", filter:"blur(32px)", opacity:.2, pointerEvents:"none" }} />
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
                  <div>
                    <div style={{ color:"#7d97c2", fontSize:"clamp(11px,1vh,14px)", fontWeight:800, letterSpacing:".12em", textTransform:"uppercase", marginBottom:"clamp(6px,.6vh,10px)" }}>Total allocated</div>
                    <div style={{ font:`800 clamp(42px,4.2vh,66px)/1 Manrope,sans-serif`, letterSpacing:"-.05em" }}>
                      {revealedCount}<small style={{ fontSize:"clamp(18px,1.6vh,24px)", color:"#6f89b3", fontWeight:600, letterSpacing:0 }}>/{total}</small>
                    </div>
                  </div>
                  <div style={{ color:"#4f9dff", opacity:.7, flexShrink:0, marginTop:4 }}>
                    <PeopleIcon />
                  </div>
                </div>
              </div>

              {/* FCFS + Fallback side by side */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                {/* FCFS stat */}
                <div style={{ position:"relative", padding:"clamp(12px,1.2vh,18px)", borderRadius:16, background:"rgba(255,255,255,.03)", border:"1px solid rgba(79,157,255,.12)", overflow:"hidden" }}>
                  <div style={{ position:"absolute", width:70, height:70, borderRadius:"50%", right:-20, top:-20, background:"#4f9dff", filter:"blur(26px)", opacity:.18, pointerEvents:"none" }} />
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"clamp(6px,.6vh,10px)" }}>
                    <div style={{ color:"#7d97c2", fontSize:"clamp(11px,1vh,14px)", fontWeight:800, letterSpacing:".1em", textTransform:"uppercase" }}>FCFS</div>
                    <div style={{ color:"#4f9dff", opacity:.7 }}><FcfsIcon /></div>
                  </div>
                  <div style={{ font:`800 clamp(32px,3.2vh,50px)/1 Manrope,sans-serif`, letterSpacing:"-.04em", color:"#eef5ff" }}>{fcfsCount}</div>
                </div>
                {/* Fallback stat */}
                <div style={{ position:"relative", padding:"clamp(12px,1.2vh,18px)", borderRadius:16, background:"rgba(255,255,255,.03)", border:"1px solid rgba(94,225,255,.12)", overflow:"hidden" }}>
                  <div style={{ position:"absolute", width:70, height:70, borderRadius:"50%", right:-20, top:-20, background:"#5ee1ff", filter:"blur(26px)", opacity:.18, pointerEvents:"none" }} />
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"clamp(6px,.6vh,10px)" }}>
                    <div style={{ color:"#7d97c2", fontSize:"clamp(11px,1vh,14px)", fontWeight:800, letterSpacing:".1em", textTransform:"uppercase" }}>Fallback</div>
                    <div style={{ color:"#5ee1ff", opacity:.7 }}><FallbackIcon /></div>
                  </div>
                  <div style={{ font:`800 clamp(32px,3.2vh,50px)/1 Manrope,sans-serif`, letterSpacing:"-.04em", color:"#eef5ff" }}>{fbCount}</div>
                </div>
              </div>
            </div>

            {/* Mentor load constellation */}
            <div style={{ border:"1px solid rgba(140,190,255,.13)", background:"linear-gradient(145deg,rgba(13,30,70,.82),rgba(6,14,38,.86))", boxShadow:"0 30px 90px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.04)", backdropFilter:"blur(20px)", borderRadius:24, padding:"clamp(14px,1.4vh,22px)", display:"flex", flexDirection:"column", minHeight:0, overflow:"hidden" }}>

              {/* Header */}
              <div style={{ flexShrink:0, display:"flex", alignItems:"center", justifyContent:"space-between", paddingBottom:"clamp(10px,1vh,15px)", borderBottom:"1px solid rgba(140,190,255,.13)", marginBottom:"clamp(8px,.8vh,12px)" }}>
                <div style={{ font:`800 clamp(14px,1.3vh,18px) Manrope,sans-serif` }}>
                  Mentor load · <span style={{ color:"#6f89b3", fontWeight:600 }}>{mentorLoad.length} mentors</span>
                </div>
                {/* Legend */}
                <div style={{ display:"flex", gap:8 }}>
                  {[
                    { label:"idle",  bg:"rgba(140,190,255,.12)" },
                    { label:"1",     bg:"rgba(79,157,255,.45)"  },
                    { label:"2–3",   bg:"rgba(94,225,255,.7)"   },
                    { label:"4+",    bg:"#ffc766"               },
                  ].map(l => (
                    <div key={l.label} style={{ display:"flex", alignItems:"center", gap:4, fontSize:"clamp(9px,.8vh,11px)", fontWeight:700, color:"#6f89b3" }}>
                      <span style={{ width:9, height:9, borderRadius:3, background:l.bg, display:"inline-block", flexShrink:0 }} />
                      {l.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tile grid */}
              <div style={{ flex:1, minHeight:0, overflow:"hidden" }}>
                {mentorLoad.length === 0 ? (
                  <div style={{ height:"100%", display:"grid", placeItems:"center", color:"#4a6080", fontSize:"clamp(12px,1.1vh,15px)" }}>
                    Loading mentor data…
                  </div>
                ) : (
                  <MentorLoadGrid mentors={mentorLoad} hitName={hitMentorName} />
                )}
              </div>

              {/* Footer stats — recomputed on every mentorLoad update */}
              {mentorLoad.length > 0 && (() => {
                const assigned  = mentorLoad.filter(m => m.allocated > 0);
                const idle      = mentorLoad.length - assigned.length;
                const total_a   = mentorLoad.reduce((s, m) => s + m.allocated, 0);
                const maxLoad   = assigned.length > 0 ? Math.max(...assigned.map(m => m.allocated)) : 0;
                const avg       = mentorLoad.length > 0 ? (total_a / mentorLoad.length).toFixed(1) : "0";
                const busiest   = assigned.length > 0
                  ? assigned.reduce((a, b) => b.allocated > a.allocated ? b : a)
                  : mentorLoad[0];
                const ini = busiest.name
                  .split(/\s+/).filter((w:string) => w.length > 1 || /^[A-Z]$/.test(w))
                  .slice(0, 2).map((w:string) => w[0]).join("").toUpperCase();
                return (
                  <div style={{ flexShrink:0, display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, borderTop:"1px solid rgba(140,190,255,.09)", paddingTop:"clamp(10px,1vh,14px)", marginTop:"clamp(8px,.8vh,12px)" }}>
                    <div style={{ background:"rgba(255,255,255,.03)", border:"1px solid rgba(140,190,255,.09)", borderRadius:12, padding:"clamp(8px,.8vh,12px)" }}>
                      <span style={{ display:"block", color:"#7d97c2", fontSize:"clamp(9px,.8vh,11px)", fontWeight:800, letterSpacing:".12em", textTransform:"uppercase" }}>Idle</span>
                      <strong style={{ display:"block", font:`800 clamp(20px,1.8vh,28px)/1 Manrope,sans-serif`, marginTop:4, letterSpacing:"-.03em" }}>{idle}</strong>
                    </div>
                    <div style={{ background:"rgba(255,255,255,.03)", border:"1px solid rgba(140,190,255,.09)", borderRadius:12, padding:"clamp(8px,.8vh,12px)" }}>
                      <span style={{ display:"block", color:"#7d97c2", fontSize:"clamp(9px,.8vh,11px)", fontWeight:800, letterSpacing:".12em", textTransform:"uppercase" }}>Avg</span>
                      <strong style={{ display:"block", font:`800 clamp(20px,1.8vh,28px)/1 Manrope,sans-serif`, marginTop:4, letterSpacing:"-.03em" }}>{avg}</strong>
                    </div>
                    <div style={{ background:"rgba(255,255,255,.03)", border:"1px solid rgba(140,190,255,.09)", borderRadius:12, padding:"clamp(8px,.8vh,12px)" }}>
                      <span style={{ display:"block", color:"#7d97c2", fontSize:"clamp(9px,.8vh,11px)", fontWeight:800, letterSpacing:".12em", textTransform:"uppercase" }}>Max</span>
                      <strong style={{ display:"block", font:`800 clamp(20px,1.8vh,28px)/1 Manrope,sans-serif`, marginTop:4, letterSpacing:"-.03em" }}>{maxLoad}</strong>
                    </div>
                    {/* Busiest mentor — full width */}
                    {assigned.length > 0 && (
                      <div style={{ gridColumn:"1/-1", background:"rgba(255,255,255,.03)", border:"1px solid rgba(140,190,255,.09)", borderRadius:12, padding:"clamp(8px,.8vh,12px)", display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{ width:"clamp(28px,2.5vh,36px)", height:"clamp(28px,2.5vh,36px)", borderRadius:9, display:"grid", placeItems:"center", fontSize:"clamp(10px,.9vh,13px)", fontWeight:800, color:"#fff", background:"linear-gradient(145deg,rgba(255,199,102,.7),rgba(94,225,255,.4))", flexShrink:0 }}>
                          {ini}
                        </div>
                        <div style={{ minWidth:0 }}>
                          <span style={{ display:"block", color:"#7d97c2", fontSize:"clamp(9px,.8vh,11px)", fontWeight:800, letterSpacing:".12em", textTransform:"uppercase" }}>Busiest</span>
                          <strong style={{ display:"block", fontSize:"clamp(12px,1.1vh,15px)", fontWeight:700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{busiest.name}</strong>
                        </div>
                        <div style={{ marginLeft:"auto", flexShrink:0, fontSize:"clamp(16px,1.5vh,22px)", fontWeight:800, color:"#ffc766", letterSpacing:"-.02em" }}>{busiest.allocated}</div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      <RoboStyles />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap');
        @keyframes alloc-orb      { to { transform: translate3d(46px,-38px,0) scale(1.12); } }
        @keyframes alloc-live     { 70% { box-shadow: 0 0 0 12px rgba(79,157,255,0); } }
        @keyframes alloc-spin     { to { transform: rotate(360deg); } }
        @keyframes alloc-travel   { 0%{left:0;opacity:0}15%,80%{opacity:1}100%{left:calc(100% - 8px);opacity:0} }
        @keyframes alloc-cardIn   { from{opacity:0;transform:translateX(-14px) scale(.96)}to{opacity:1;transform:none} }
        @keyframes alloc-feedIn   { from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none} }
        @keyframes alloc-sweep    { 0%{transform:translateX(-100%)}100%{transform:translateX(200%)} }
        @keyframes alloc-confetti { to{transform:translate(var(--x),var(--y)) rotate(var(--r));opacity:0} }
        @keyframes alloc-queueExit  { 0%{opacity:1;transform:scale(1) translateY(0)} 100%{opacity:0;transform:scale(.88) translateY(-20px)} }
        @keyframes alloc-queueEnter { 0%{opacity:0;transform:scale(.92) translateY(14px)} 100%{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes alloc-tile-hit { 0%{transform:scale(1)} 30%{transform:scale(1.22);box-shadow:0 0 0 3px rgba(255,255,255,.2),0 0 22px rgba(94,225,255,.5)} 100%{transform:scale(1)} }
        @keyframes alloc-dot-in   { from{transform:scale(0)} to{transform:scale(1)} }
      `}</style>
    </div>
  );
}
function ResultsScene({ scene }: { scene: Extract<DisplayScene, { type: "results" }> }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), 120); return () => clearTimeout(t); }, []);

  const stats = [
    { value: String(scene.assigned),          label: "Assigned",     color: "#22c55e", glow: "rgba(34,197,94,.35)",   sub: "mentees matched" },
    { value: String(scene.unmatched),          label: "Unmatched",    color: "#f59e0b", glow: "rgba(245,158,11,.35)",  sub: "need follow-up"  },
    { value: `${scene.satisfaction}%`,         label: "Satisfaction", color: "#6366f1", glow: "rgba(99,102,241,.35)", sub: "1st or 2nd choice" },
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
      <div style={{ position:"absolute", width:"30vw", height:"30vw", bottom:"-8%", left:"15%", borderRadius:"50%", background:"radial-gradient(circle,rgba(34,197,94,.14) 0%,transparent 70%)", filter:"blur(60px)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", width:"30vw", height:"30vw", bottom:"-8%", right:"15%", borderRadius:"50%", background:"radial-gradient(circle,rgba(245,158,11,.12) 0%,transparent 70%)", filter:"blur(60px)", pointerEvents:"none" }} />

      {/* Logo + title */}
      <div style={{
        display:"flex", flexDirection:"column", alignItems:"center", gap:"clamp(10px,1.6vh,20px)",
        marginBottom:"clamp(28px,4.5vh,56px)",
        opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(-18px)",
        transition:"opacity .7s ease, transform .7s ease",
      }}>
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
            {/* Inner glow */}
            <div style={{ position:"absolute", inset:0, borderRadius:"inherit", background:`radial-gradient(ellipse 80% 60% at 50% 0%,${s.glow} 0%,transparent 70%)`, pointerEvents:"none" }} />
            {/* Top accent line */}
            <div style={{ position:"absolute", top:0, left:"15%", right:"15%", height:2, background:`linear-gradient(90deg,transparent,${s.color},transparent)`, borderRadius:2 }} />

            <div style={{
              fontSize:"clamp(52px,7.5vw,100px)", fontWeight:900, lineHeight:1,
              color: s.color,
              textShadow:`0 0 50px ${s.glow},0 0 20px ${s.glow}`,
              fontVariantNumeric:"tabular-nums", letterSpacing:"-.03em",
              position:"relative",
            }}>
              {s.value}
            </div>
            <div style={{
              marginTop:"clamp(8px,1vh,14px)",
              fontSize:"clamp(11px,1vw,15px)", fontWeight:700,
              letterSpacing:".14em", textTransform:"uppercase",
              color:"rgba(199,210,254,.7)",
            }}>
              {s.label}
            </div>
            <div style={{
              marginTop:"clamp(4px,.5vh,7px)",
              fontSize:"clamp(10px,.85vw,13px)",
              color:"rgba(199,210,254,.35)", fontWeight:400,
            }}>
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

function MentorCarouselScene({ scene }: { scene: Extract<DisplayScene, { type: "mentor-carousel" }> }) {
  const canvasRef2 = useRef<HTMLCanvasElement>(null);
  useParticleCanvas(canvasRef2);

  const [mentors,  setMentors]  = useState<CarouselMentor[]>([]);
  const [active,   setActive]   = useState(0);
  const [noAnim,   setNoAnim]   = useState(true);
  const [paused,   setPaused]   = useState(false);
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef  = useRef(0);   // mirror of active for use inside closures
  const pausedRef  = useRef(false);
  const totalRef   = useRef(0);

  const INTERVAL = 3500;

  // Keep activeRef always in sync — updated immediately wherever setActive is called,
  // so the control handler always reads the latest value without stale closure issues.
  // (the useEffect sync below is kept as a fallback)
  useEffect(() => { activeRef.current = active; }, [active]);
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  // Load mentors once
  useEffect(() => {
    fetch("/api/display/mentors")
      .then((r) => r.json())
      .then((d: { mentors?: CarouselMentor[] }) => {
        const list = d.mentors ?? [];
        setMentors(list);
        totalRef.current = list.length;
        requestAnimationFrame(() => requestAnimationFrame(() => setNoAnim(false)));
      })
      .catch(() => {/* ignore */});
  }, []);

  // Stable auto-advance — only ticks when mentors are loaded
  useEffect(() => {
    const schedule = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        const t = totalRef.current;
        if (!pausedRef.current && t > 1) {
          setActive((a) => {
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

  // Handle remote control commands from admin.
  // scene.seq is a fresh Date.now() on every button press, so this effect fires on every click.
  const prevSeq = useRef<number | undefined>(undefined);
  useEffect(() => {
    const ctrl = scene.control;
    const seq  = scene.seq ?? 0;
    if (!ctrl) return;
    if (seq === prevSeq.current) return; // exact SSE re-delivery of same push, skip
    prevSeq.current = seq;
    // Use the ref directly so we always have the latest count without stale closure issues
    const t = totalRef.current;
    if (t < 1) return;
    if (ctrl === "next")  {
      activeRef.current = (activeRef.current + 1) % t;
      setActive(activeRef.current);
    }
    if (ctrl === "prev")  {
      activeRef.current = (activeRef.current - 1 + t) % t;
      setActive(activeRef.current);
    }
    if (ctrl === "pause") { setPaused(true);  pausedRef.current = true; }
    if (ctrl === "play")  { setPaused(false); pausedRef.current = false; }
    if (ctrl === "stop")  {
      activeRef.current = 0;
      setActive(0);
      setPaused(true);
      pausedRef.current = true;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene.seq, scene.control]);

  const total = mentors.length;
  // Sanitize active — can be NaN if timer fired before load (now guarded, but be defensive)
  const safeActive = Number.isFinite(active) ? ((active % total) + total) % total : 0;

  if (total === 0) {
    return (
      <div style={{ position:"fixed", inset:0, background:"#05070f", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ color:"rgba(199,210,254,0.5)", fontSize:18, fontWeight:600 }}>Loading mentors…</div>
      </div>
    );
  }

  // Slot calculation
  const mid = Math.floor(total / 2);
  const slotFor = (offset: number) => {
    if (offset === 0) return "center";
    if (offset === 1 && total > 1) return "right";
    if (offset === total - 1 && total > 2) return "left";
    return offset <= mid ? "hidden-right" : "hidden-left";
  };

  const initials = (name: string) => name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  // Single card width — all cards share same width, scaling done via transform only (no layout jank)
  const CARD_W   = "clamp(280px,38vw,420px)";
  const CENTER_H = "clamp(340px,44vw,500px)";
  const SHIFT    = "clamp(200px,32vw,360px)";
  const SIDE_SCALE = 0.70;

  return (
    <div style={{ position:"fixed", inset:0, background:"#05070f", fontFamily:"'Sora','Inter',system-ui,sans-serif", WebkitFontSmoothing:"antialiased", display:"flex", flexDirection:"column", overflow:"hidden" }}>

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
      <header style={{ position:"relative", zIndex:2, flexShrink:0, display:"flex", justifyContent:"space-between", alignItems:"center", padding:"clamp(18px,3vh,32px) clamp(18px,4vw,40px) 0", fontFamily:"'Space Grotesk',sans-serif", fontSize:"clamp(11px,1.1vw,14px)", letterSpacing:".14em", textTransform:"uppercase", color:"#c7d2fe", opacity:.7 }}>
        <span>Mentor Session</span>
        <div style={{ display:"inline-flex", alignItems:"center", gap:8 }}>
          {paused && <span style={{ fontSize:"clamp(9px,0.9vw,12px)", letterSpacing:".1em", color:"rgba(199,210,254,0.45)" }}>PAUSED</span>}
          {!paused && <span style={{ width:6, height:6, borderRadius:"50%", background:"#22d3ee", boxShadow:"0 0 10px #22d3ee", display:"inline-block", animation:"mc2LivePulse 2s ease-out infinite" }} />}
        </div>
        <span>2026</span>
      </header>

      {/* Stage */}
      <div style={{
        position:"relative", zIndex:2, flex:1,
        perspective:1500, perspectiveOrigin:"50% 40%",
        userSelect:"none", WebkitUserSelect:"none",
        display:"flex", alignItems:"center", justifyContent:"center",
      }}>
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
                transform: `translateX(calc(${CARD_W} / -2)) translateY(-50%) ${transforms[slot] ?? transforms["hidden-right"]}`,
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
                willChange:"box-shadow",
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
                {/* Batch badge — side cards only */}
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

              {/* Info panel — grid-row expand */}
              <div style={{
                display:"grid",
                gridTemplateRows: isCenter ? "1fr" : "0fr",
                transition: noAnim ? "none" : "grid-template-rows 0.72s cubic-bezier(0.25,0.46,0.45,0.94)",
              }}>
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
                      <span>[{String(i + 1).padStart(2,"0")}]</span>
                      <span>{i + 1} / {total}</span>
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
              style={{
                width: i === safeActive ? 32 : 20, height:4,
                background: i === safeActive ? "linear-gradient(90deg,#3b82f6,#22d3ee)" : "rgba(199,210,254,.18)",
                borderRadius:2, cursor:"pointer",
                transition:"width 0.4s cubic-bezier(0.25,0.46,0.45,0.94), background 0.3s",
                boxShadow: i === safeActive ? "0 0 14px rgba(59,130,246,0.75)" : "none",
              }}
            />
          ))}
        </div>
        <span style={{ fontFamily:"'Space Grotesk',ui-monospace,monospace", fontSize:"clamp(11px,1vw,14px)", letterSpacing:".12em", color:"#c7d2fe", opacity:.6, minWidth:"5ch", textAlign:"center" }}>
          {String(safeActive + 1).padStart(2,"0")} / {String(total).padStart(2,"0")}
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

// ─── Scene transition wrapper ─────────────────────────────────────────────────

/**
 * SceneTransition — smooth crossfade + subtle upward slide between any two scenes.
 *
 * Strategy:
 *  - Keep the previous scene mounted underneath while animating it out
 *  - Animate the new scene in on top
 *  - Once the exit animation finishes, drop the previous scene from the DOM
 */
function SceneTransition({ sceneKey, children }: { sceneKey: string; children: React.ReactNode }) {
  // The currently visible layer
  const [current,  setCurrent]  = useState<{ key: string; node: React.ReactNode }>({ key: sceneKey, node: children });
  // The outgoing layer (being faded out)
  const [outgoing, setOutgoing] = useState<{ key: string; node: React.ReactNode } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (sceneKey === current.key) {
      // Same scene type — just update the node in-place (e.g. allocation progress)
      setCurrent({ key: sceneKey, node: children });
      return;
    }

    // New scene — push old one to outgoing, bring new one in
    setOutgoing({ key: current.key, node: current.node });
    setCurrent({ key: sceneKey, node: children });

    // Purge outgoing after the CSS transition finishes (700ms)
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setOutgoing(null), 750);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneKey]);

  // Keep current node up-to-date (children can change without sceneKey changing)
  useEffect(() => {
    setCurrent(prev => ({ ...prev, node: children }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children]);

  return (
    <div style={{ position:"fixed", inset:0, isolation:"isolate" }}>
      <style>{`
        @keyframes st-enter {
          from { opacity: 0; transform: translateY(18px) scale(.985); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes st-exit {
          from { opacity: 1; transform: translateY(0)     scale(1);    }
          to   { opacity: 0; transform: translateY(-14px) scale(.985); }
        }
      `}</style>

      {/* Outgoing layer — animates out underneath */}
      {outgoing && (
        <div
          key={outgoing.key}
          style={{
            position:"absolute", inset:0, zIndex:1,
            animation:"st-exit 0.65s cubic-bezier(0.4,0,0.2,1) forwards",
            pointerEvents:"none",
          }}
        >
          {outgoing.node}
        </div>
      )}

      {/* Current layer — animates in on top */}
      <div
        key={current.key}
        style={{
          position:"absolute", inset:0, zIndex:2,
          animation: outgoing
            ? "st-enter 0.65s cubic-bezier(0.16,1,0.3,1) forwards"
            : undefined,
        }}
      >
        {current.node}
      </div>
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

  // Derive a stable key for the scene type so transitions only fire on type changes
  const sceneKey = scene.type === "mentor-card"
    ? `mentor-card-${(scene as Extract<DisplayScene,{type:"mentor-card"}>).mentor.id}`
    : scene.type;

  const sceneNode = (
    <>
      {scene.type === "idle"               && <IdleScene />}
      {scene.type === "thankyou"           && <ThankYouScene />}
      {scene.type === "live-registrations" && <LiveRegistrationsScene />}
      {scene.type === "mentor-carousel"    && <MentorCarouselScene scene={scene} />}
      {scene.type === "allocation"         && <AllocationScene scene={scene} />}
      {scene.type === "results"            && <ResultsScene   scene={scene} />}
      {scene.type === "custom"             && <CustomScene    scene={scene} />}
      {scene.type === "mentor-card"        && <MentorCardScene scene={scene} />}
    </>
  );

  return (
    <div style={{ position:"fixed", inset:0, background:"#0f0c29", fontFamily:"inherit" }}>
      <SceneTransition sceneKey={sceneKey}>
        {sceneNode}
      </SceneTransition>
    </div>
  );
}
