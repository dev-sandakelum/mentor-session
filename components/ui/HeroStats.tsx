"use client";

import { useEffect, useRef, useState } from "react";

interface Stat {
  target: number | null; // null = text value (no count-up)
  text?: string;         // used when target is null
  label: string;
}

const STATS: Stat[] = [
  { target: 2,    label: "Mentees / Mentor"  },
  { target: 3,    label: "Preference Picks"  },
  { target: null, text: "FCFS", label: "Fair Matching" },
];

function useCountUp(target: number, duration = 900, active: boolean) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [active, target, duration]);
  return value;
}

function CountStat({ target, label, active, delay }: { target: number; label: string; active: boolean; delay: number }) {
  const val = useCountUp(target, 800, active);
  return (
    <div className="hero-stat" style={{ animationDelay: `${delay}ms` }}>
      <span className={`hero-stat-num${active ? " hero-stat-in" : ""}`}>{val}</span>
      <span className="hero-stat-label">{label}</span>
    </div>
  );
}

function TextStat({ text, label, active, delay }: { text: string; label: string; active: boolean; delay: number }) {
  return (
    <div className="hero-stat" style={{ animationDelay: `${delay}ms` }}>
      <span className={`hero-stat-num${active ? " hero-stat-in" : ""}`}>{text}</span>
      <span className="hero-stat-label">{label}</span>
    </div>
  );
}

export function HeroStats() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setActive(true); obs.disconnect(); } },
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="hero-stats" ref={ref} aria-hidden="true">
      {STATS.map((s, i) => (
        <span key={s.label} style={{ display: "contents" }}>
          {i > 0 && <div className="hero-stat-divider" />}
          {s.target !== null
            ? <CountStat target={s.target} label={s.label} active={active} delay={i * 120} />
            : <TextStat  text={s.text!}   label={s.label} active={active} delay={i * 120} />}
        </span>
      ))}
    </div>
  );
}
