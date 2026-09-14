"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type CarouselControl = "play" | "pause" | "next" | "prev" | "stop";

type LifecycleStep = {
  label: string;
  svgPath: string;
  status: string;
  registrationOpen: boolean;
};

type SessionConfig = {
  id: string;
  status: string;
  registration_open: boolean;
};

type Mentor = {
  id: string;
  full_name: string;
  student_id: string;
  profile_photo_url: string | null;
  capacity: number;
  is_approved: boolean;
  communication_method: string;
  batch: string;
};

type Mentee = {
  id: string;
  full_name: string;
  student_id: string;
  assignedMentor: string | null;
};

// ─── SVG icon paths (stroke-based, 24×24 viewBox) ────────────────────────────

const ICONS = {
  // Scenes
  monitor:      "M2 3h20v14H2zM8 21h8M12 17v4",
  carousel:     "M4 6h16M4 12h16M4 18h16",  // list / carousel
  bars:         "M18 20V10M12 20V4M6 20v-6",
  hands:        "M18 11V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v5M12 12v9M8 17h8",
  checkSquare:  "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
  settings:     "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
  playTriangle: "M5 3l14 9-14 9V3z",
  // Carousel
  skipBack:     "M19 20L9 12l10-8v16zM5 19V5",
  play:         "M5 3l14 9-14 9V3z",
  skipFwd:      "M5 4l10 8-10 8V4zM19 5v14",
  pause:        "M6 4h4v16H6zM14 4h4v16h-4z",
  stop:         "M4 4h16v16H4z",
  // Mentor card
  skipPrev:     "M19 20L9 12l10-8v16zM5 19V5",
  eye:          "M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  skipNext:     "M5 4l10 8-10 8V4zM19 5v14",
  // Lifecycle
  pencil:       "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
  sliders:      "M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6",
  unlock:       "M18 11H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM8 11V7a4 4 0 0 1 7.75-1.35",
  clipboard:    "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 2h6v4H9z",
  bolt:         "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  megaphone:    "M3 11l19-9-9 19-2-8-8-2zM11 13l4.5-4.5",
  flag:         "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3S15 4 12 4 7 2 4 2v13zM4 22v-7",
  // Fullscreen
  expand:       "M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7",
  compress:     "M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7",
  // Misc
  messageSquare:"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  externalLink: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3",
} as const;

type IconKey = keyof typeof ICONS;

// ─── SVG Icon component ───────────────────────────────────────────────────────

function Icon({ name, size = 22, stroke = "currentColor", strokeWidth = 1.75 }: {
  name: IconKey;
  size?: number;
  stroke?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={ICONS[name]} />
    </svg>
  );
}

// ─── Lifecycle steps ──────────────────────────────────────────────────────────

const LIFECYCLE_STEPS: LifecycleStep[] = [
  { label: "Create Session",      svgPath: ICONS.pencil,    status: "draft",        registrationOpen: false },
  { label: "Configure",           svgPath: ICONS.sliders,   status: "draft",        registrationOpen: false },
  { label: "Open Registration",   svgPath: ICONS.unlock,    status: "registration", registrationOpen: true  },
  { label: "Preferences",         svgPath: ICONS.clipboard, status: "registration", registrationOpen: true  },
  { label: "Allocation",          svgPath: ICONS.bolt,      status: "allocation",   registrationOpen: false },
  { label: "Publish Results",     svgPath: ICONS.megaphone, status: "published",    registrationOpen: false },
  { label: "Feedback",            svgPath: ICONS.flag,      status: "closed",       registrationOpen: false },
];

function getActiveStep(status: string, registrationOpen: boolean): number {
  if (status === "closed")                           return 6;
  if (status === "published")                        return 5;
  if (status === "allocation")                       return 4;
  if (status === "registration" && registrationOpen) return 3;
  if (status === "draft")                            return 1;
  return 0;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BG_PAGE    = "#0d1117";
const BG_PANEL   = "#161b22";
const BG_BTN     = "#1c2433";
const BG_BTN_HVR = "#21283a";
const BORDER     = "rgba(255,255,255,0.07)";
const TEXT_DIM   = "rgba(148,163,184,0.6)";
const INDIGO     = "#6366f1";
const GREEN      = "#22c55e";
const RED        = "#ef4444";
const AMBER      = "#f59e0b";

// ─── Press animation handlers ─────────────────────────────────────────────────

function ph(scale = "0.93", disabled = false) {
  return {
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
      if (!disabled) e.currentTarget.style.transform = `scale(${scale})`;
    },
    onPointerUp:    (e: React.PointerEvent<HTMLButtonElement>) => { e.currentTarget.style.transform = ""; },
    onPointerLeave: (e: React.PointerEvent<HTMLButtonElement>) => { e.currentTarget.style.transform = ""; },
  };
}

// ─── Base card button ─────────────────────────────────────────────────────────
// Matches the reference: square-ish dark card, icon centred, label below, accent dot

interface CardBtnProps {
  iconName?: IconKey;
  svgPath?: string;
  label: string;
  accent?: string;        // dot colour below label
  iconBg?: string;        // circle behind icon (Play, Show)
  iconColor?: string;
  border?: string;        // override border (Stop — red)
  disabled?: boolean;
  active?: boolean;       // lifecycle current-step ring
  done?: boolean;         // lifecycle done-step
  wide?: boolean;
  tall?: boolean;
  onClick: () => void;
}

function CardBtn({
  iconName, svgPath, label, accent, iconBg, iconColor,
  border: borderOverride, disabled, active, done, wide, tall, onClick,
}: CardBtnProps) {
  const iconStroke = iconColor ?? (active ? INDIGO : done ? GREEN : "#c9d5e8");
  const cardBorder = active
    ? `1.5px solid ${INDIGO}`
    : done
    ? `1px solid rgba(34,197,94,0.3)`
    : borderOverride ?? `1px solid ${BORDER}`;
  const cardShadow = active
    ? `0 0 0 2px rgba(99,102,241,0.25), 0 4px 12px rgba(0,0,0,0.6)`
    : `0 4px 12px rgba(0,0,0,0.5)`;

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        gridColumn: wide ? "span 2" : undefined,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        padding: tall ? "24px 10px 20px" : "18px 10px 14px",
        background: active ? "rgba(99,102,241,0.1)" : done ? "rgba(34,197,94,0.06)" : BG_BTN,
        border: cardBorder,
        borderRadius: 14,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled && !active ? 0.42 : 1,
        boxShadow: cardShadow,
        transition: "transform 0.08s ease, opacity 0.12s",
        userSelect: "none",
        minHeight: tall ? 110 : 88,
        WebkitTapHighlightColor: "transparent",
      }}
      {...ph("0.94", disabled)}
    >
      {/* Done checkmark badge */}
      {done && !active && (
        <span style={{
          position: "absolute", top: 6, right: 7,
          width: 15, height: 15, borderRadius: "50%",
          background: GREEN,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
      )}

      {/* Icon — optionally inside a circle (Play / Show style) */}
      {iconBg ? (
        <span style={{
          width: 44, height: 44, borderRadius: "50%",
          background: iconBg,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
          boxShadow: `0 0 16px ${iconBg}55`,
        }}>
          {iconName
            ? <Icon name={iconName} size={20} stroke="#fff" strokeWidth={2} />
            : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d={svgPath} /></svg>
          }
        </span>
      ) : (
        iconName
          ? <Icon name={iconName} size={22} stroke={iconStroke} />
          : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={iconStroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d={svgPath} /></svg>
      )}

      {/* Label */}
      <span style={{
        fontSize: 11,
        fontWeight: 600,
        color: active ? "#a5b4fc" : done ? "#4ade80" : "#94a3b8",
        textAlign: "center",
        lineHeight: 1.3,
        letterSpacing: "0.01em",
      }}>
        {label}
      </span>

      {/* Accent dot */}
      {accent && (
        <span style={{
          position: "absolute",
          bottom: 7,
          left: "50%",
          transform: "translateX(-50%)",
          width: 18, height: 2,
          borderRadius: 2,
          background: accent,
          opacity: 0.7,
        }} />
      )}
    </button>
  );
}

// ─── Panel wrapper ────────────────────────────────────────────────────────────

function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: BG_PANEL,
      border: `1px solid ${BORDER}`,
      borderRadius: 18,
      padding: "14px 12px",
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── Section label inside a panel ────────────────────────────────────────────

function PanelLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      color: TEXT_DIM,
      marginBottom: 10,
      paddingLeft: 2,
    }}>
      {children}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function RemoteScreen() {
  const [sending,    setSending]    = useState(false);
  const [lastScene,  setLastScene]  = useState("");
  const [mentors,    setMentors]    = useState<Mentor[]>([]);
  const [mentees,    setMentees]    = useState<Mentee[]>([]);
  const [stats,      setStats]      = useState({ assigned: 0, unassigned: 0, preferenceSatisfaction: 0, totalMentees: 0 });
  const [mentorIdx,  setMentorIdx]  = useState(0);
  const [customText, setCustomText] = useState("");
  const [customSub,  setCustomSub]  = useState("");
  const [loading,    setLoading]    = useState(true);
  const [session,    setSession]    = useState<SessionConfig | null>(null);
  const [advancing,  setAdvancing]  = useState(false);
  const [lcError,    setLcError]    = useState("");
  const [isFs,       setIsFs]       = useState(false);

  const statsRef = useRef(stats);
  statsRef.current = stats;

  // Fullscreen
  useEffect(() => {
    const h = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  const toggleFs = useCallback(() => {
    if (!document.fullscreenElement) void document.documentElement.requestFullscreen?.();
    else void document.exitFullscreen?.();
  }, []);

  // Data fetch
  useEffect(() => {
    void (async () => {
      try {
        const [ovRes, cfgRes] = await Promise.all([
          fetch("/api/admin/overview"),
          fetch("/api/admin/session-config"),
        ]);
        if (ovRes.ok) {
          const d = (await ovRes.json()) as { mentors: Mentor[]; mentees: Mentee[]; stats: typeof stats };
          setMentors(d.mentors ?? []);
          setMentees(d.mentees ?? []);
          setStats(d.stats ?? statsRef.current);
        }
        if (cfgRes.ok) {
          const d = (await cfgRes.json()) as { session: SessionConfig };
          setSession(d.session ?? null);
        }
      } finally {
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scene push
  const push = async (scene: object) => {
    setSending(true);
    try {
      const res = await fetch("/api/display/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scene }),
      });
      if (res.ok) setLastScene((scene as { type: string }).type);
    } finally {
      setSending(false);
    }
  };

  const pushCarousel = (ctrl: CarouselControl) =>
    void push({ type: "mentor-carousel", control: ctrl, seq: Date.now() });

  // Lifecycle
  const advanceLifecycle = async (step: LifecycleStep) => {
    setAdvancing(true);
    setLcError("");
    try {
      const res = await fetch("/api/admin/session-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: step.status, registrationOpen: step.registrationOpen }),
      });
      const data: unknown = await res.json();
      if (!res.ok) throw new Error(
        typeof data === "object" && data && "error" in data &&
        typeof (data as { error: unknown }).error === "string"
          ? (data as { error: string }).error
          : "Unable to update session.",
      );
      const cfgRes = await fetch("/api/admin/session-config");
      if (cfgRes.ok) {
        const cfg = (await cfgRes.json()) as { session: SessionConfig };
        setSession(cfg.session ?? null);
      }
    } catch (err) {
      setLcError(err instanceof Error ? err.message : "Unable to update session.");
    } finally {
      setAdvancing(false);
    }
  };

  // Mentor card
  const approved     = mentors.filter((m) => m.is_approved);
  const safeIdx      = Math.min(mentorIdx, Math.max(0, approved.length - 1));

  const goTo = (idx: number) => {
    setMentorIdx(idx);
    const mentor = approved[idx];
    if (!mentor) return;
    const ri = mentors.findIndex((m) => m.id === mentor.id);
    const m  = mentors[ri];
    if (!m) return;
    void push({
      type: "mentor-card",
      mentor: { id: m.id, name: m.full_name, studentId: m.student_id ?? null, batch: m.batch ?? null, photoUrl: m.profile_photo_url ?? null, communicationMethod: m.communication_method },
      mentees: mentees.filter((me) => me.assignedMentor === m.full_name).map((me) => ({ name: me.full_name, studentId: me.student_id })),
      index: ri,
      total: mentors.length,
    });
  };

  const s        = stats;
  const activeLC = session ? getActiveStep(session.status, session.registration_open) : -1;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{
      minHeight: "100dvh",
      background: BG_PAGE,
      fontFamily: "-apple-system,BlinkMacSystemFont,'Inter',system-ui,sans-serif",
      display: "flex",
      flexDirection: "column",
      color: "#e2e8f0",
    }}>

      {/* ── Header ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 30,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px",
        background: "rgba(13,17,23,0.92)",
        backdropFilter: "blur(16px)",
        borderBottom: `1px solid ${BORDER}`,
        flexShrink: 0,
      }}>
        {/* Left: status */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: (sending || advancing) ? AMBER : lastScene ? GREEN : "#475569",
            boxShadow: (sending || advancing) ? `0 0 6px ${AMBER}` : lastScene ? `0 0 6px ${GREEN}` : "none",
            flexShrink: 0,
            transition: "background 0.3s",
          }} />
          <div>
            <span style={{ fontWeight: 700, fontSize: 15, color: "#f1f5f9" }}>Remote</span>
            <span style={{ fontSize: 11, color: TEXT_DIM, marginLeft: 8 }}>
              {loading ? "loading…" : advancing ? "updating…" : sending ? "sending…" : lastScene ? lastScene : "ready"}
            </span>
          </div>
        </div>

        {/* Right: fullscreen + back */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={toggleFs}
            title={isFs ? "Exit fullscreen" : "Fullscreen"}
            style={{
              width: 34, height: 34,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: BG_BTN, border: `1px solid ${BORDER}`,
              borderRadius: 9, cursor: "pointer", color: TEXT_DIM,
            }}
            {...ph("0.9")}
          >
            {isFs
              ? <Icon name="compress" size={14} stroke={TEXT_DIM} strokeWidth={2} />
              : <Icon name="expand"   size={14} stroke={TEXT_DIM} strokeWidth={2} />}
          </button>
          <a href="/admin" style={{
            height: 34, display: "inline-flex", alignItems: "center",
            padding: "0 14px",
            background: BG_BTN, border: `1px solid ${BORDER}`,
            borderRadius: 9, color: TEXT_DIM,
            fontSize: 12, fontWeight: 600, textDecoration: "none",
          }}>
            ← Admin
          </a>
        </div>
      </header>

      {/* ── Body ── */}
      <div style={{
        flex: 1,
        padding: "16px 12px 60px",
        display: "flex", flexDirection: "column", gap: 12,
        maxWidth: 520, width: "100%", margin: "0 auto",
        boxSizing: "border-box",
      }}>

        {/* ════ SCENES ══════════════════════════════════════════════════════ */}
        <Panel>
          <PanelLabel>Scenes</PanelLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
            <CardBtn iconName="monitor"      label="Cover / Idle"       accent="#475569" onClick={() => void push({ type: "idle" })}             disabled={sending} />
            <CardBtn iconName="carousel"     label="Mentor Carousel"    accent={INDIGO}  onClick={() => void push({ type: "mentor-carousel" })}  disabled={sending} />
            <CardBtn iconName="bars"         label="Live Regs."         accent="#475569" onClick={() => void push({ type: "live-registrations" })} disabled={sending} />
            <CardBtn iconName="hands"        label="Thank You"          accent="#475569" onClick={() => void push({ type: "thankyou" })}          disabled={sending} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
            <CardBtn iconName="bars"         label="Show Results"       accent={GREEN}   onClick={() => void push({ type: "results", assigned: s.assigned, unmatched: s.unassigned, satisfaction: s.preferenceSatisfaction })} disabled={sending} iconColor="#4ade80" />
            <CardBtn iconName="settings"     label="Engine Ready"       accent={INDIGO}  onClick={() => void push({ type: "allocation-load" })}  disabled={sending} iconColor="#a5b4fc" />
          </div>
          {/* Start Animation — full-width accent row */}
          <button
            disabled={sending}
            onClick={() => void push({ type: "allocation", count: 0, total: s.totalMentees })}
            style={{
              marginTop: 8,
              width: "100%", padding: "14px",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              background: "linear-gradient(90deg, rgba(99,102,241,0.25) 0%, rgba(124,58,237,0.25) 100%)",
              border: "1px solid rgba(99,102,241,0.35)",
              borderRadius: 12,
              color: "#a5b4fc", fontSize: 14, fontWeight: 700,
              cursor: sending ? "default" : "pointer",
              opacity: sending ? 0.5 : 1,
              transition: "transform 0.08s",
              userSelect: "none",
              WebkitTapHighlightColor: "transparent",
            }}
            {...ph("0.98", sending)}
          >
            <span style={{
              width: 28, height: 28, borderRadius: "50%",
              background: INDIGO,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <Icon name="playTriangle" size={13} stroke="#fff" strokeWidth={2} />
            </span>
            Start Animation
          </button>
        </Panel>

        {/* ════ CAROUSEL CONTROLS ═══════════════════════════════════════════ */}
        <Panel>
          <PanelLabel>Carousel Controls</PanelLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr 1fr", gap: 8 }}>
            <CardBtn iconName="skipBack" label="Prev" accent="#475569"           onClick={() => pushCarousel("prev")}  disabled={sending} />
            {/* Play — dominant centre button */}
            <CardBtn iconName="play"    label="Play" iconBg={INDIGO} tall        onClick={() => pushCarousel("play")}  disabled={sending} />
            <CardBtn iconName="skipFwd" label="Next" accent="#475569"            onClick={() => pushCarousel("next")}  disabled={sending} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
            <CardBtn iconName="pause"   label="Pause" accent={AMBER} iconColor="#fbbf24" onClick={() => pushCarousel("pause")} disabled={sending} />
            {/* Stop — red border accent */}
            <CardBtn iconName="stop"    label="Stop"  iconColor={RED}
              border={`1px solid rgba(239,68,68,0.4)`}
              onClick={() => pushCarousel("stop")} disabled={sending} />
          </div>
        </Panel>

        {/* ════ MENTOR CARD ═════════════════════════════════════════════════ */}
        {approved.length > 0 && (
          <Panel>
            <PanelLabel>Mentor Card — {safeIdx + 1} / {approved.length}</PanelLabel>

            {/* Name chip */}
            <div style={{
              background: BG_BTN, border: `1px solid ${BORDER}`,
              borderRadius: 10, padding: "10px 14px",
              color: "#e2e8f0", fontWeight: 600, fontSize: 13,
              textAlign: "center", marginBottom: 8,
            }}>
              {approved[safeIdx]?.full_name ?? "—"}
            </div>

            {/* Prev / Show / Next */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr 1fr", gap: 8 }}>
              <CardBtn iconName="skipPrev" label="Prev" accent="#475569" onClick={() => goTo(safeIdx - 1)} disabled={sending || safeIdx === 0} />
              {/* Show — eye with indigo circle */}
              <CardBtn iconName="eye" label="Show" iconBg={INDIGO} tall onClick={() => goTo(safeIdx)} disabled={sending} />
              <CardBtn iconName="skipNext" label="Next" accent="#475569" onClick={() => goTo(safeIdx + 1)} disabled={sending || safeIdx >= approved.length - 1} />
            </div>

            {/* Picker */}
            <select
              value={safeIdx}
              onChange={(e) => goTo(Number(e.target.value))}
              style={{
                marginTop: 8,
                width: "100%", padding: "10px 12px",
                background: BG_BTN, border: `1px solid ${BORDER}`,
                borderRadius: 10, color: "#94a3b8",
                fontSize: 13, outline: "none", cursor: "pointer",
              }}
            >
              {approved.map((m, i) => (
                <option key={m.id} value={i} style={{ background: BG_PANEL }}>
                  {i + 1}. {m.full_name}
                </option>
              ))}
            </select>
          </Panel>
        )}

        {/* ════ SESSION LIFECYCLE ═══════════════════════════════════════════ */}
        <Panel>
          <PanelLabel>Session Lifecycle</PanelLabel>
          {loading || !session ? (
            <div style={{ textAlign: "center", color: TEXT_DIM, fontSize: 13, padding: "16px 0" }}>
              {loading ? "Loading…" : "Unavailable"}
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                {LIFECYCLE_STEPS.map((step, i) => {
                  const current = i === activeLC;
                  const done    = i < activeLC;
                  return (
                    <CardBtn
                      key={i}
                      svgPath={step.svgPath}
                      label={step.label}
                      active={current}
                      done={done}
                      disabled={advancing || current}
                      onClick={() => void advanceLifecycle(step)}
                    />
                  );
                })}
              </div>
              {lcError && (
                <div style={{
                  marginTop: 8, padding: "9px 12px",
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.25)",
                  borderRadius: 9, color: "#fca5a5", fontSize: 12,
                }}>
                  {lcError}
                </div>
              )}
            </>
          )}
        </Panel>

        {/* ════ OTHER ═══════════════════════════════════════════════════════ */}
        <Panel>
          <PanelLabel>Custom Message</PanelLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input
              type="text"
              placeholder="Message text…"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              style={{
                background: BG_BTN, border: `1px solid ${BORDER}`,
                borderRadius: 9, padding: "11px 13px",
                color: "#f1f5f9", fontSize: 13, outline: "none",
              }}
            />
            <input
              type="text"
              placeholder="Sub-text (optional)"
              value={customSub}
              onChange={(e) => setCustomSub(e.target.value)}
              style={{
                background: BG_BTN, border: `1px solid ${BORDER}`,
                borderRadius: 9, padding: "11px 13px",
                color: "#f1f5f9", fontSize: 13, outline: "none",
              }}
            />
            <button
              disabled={sending || !customText.trim()}
              onClick={() => void push({ type: "custom", text: customText.trim(), sub: customSub.trim() || undefined })}
              style={{
                padding: "12px 16px",
                background: customText.trim() ? INDIGO : BG_BTN,
                border: `1px solid ${customText.trim() ? INDIGO : BORDER}`,
                borderRadius: 9, color: customText.trim() ? "#fff" : TEXT_DIM,
                fontSize: 13, fontWeight: 700,
                cursor: customText.trim() ? "pointer" : "default",
                opacity: sending ? 0.5 : 1,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                transition: "background 0.15s",
                userSelect: "none",
              }}
              {...ph("0.97", !customText.trim() || sending)}
            >
              <Icon name="messageSquare" size={15} stroke="currentColor" strokeWidth={2} />
              Push Message
            </button>

            {/* Display link */}
            <div style={{
              marginTop: 2, padding: "10px 14px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: BG_BTN, border: `1px solid ${BORDER}`, borderRadius: 9,
            }}>
              <span style={{ color: TEXT_DIM, fontSize: 12 }}>Projector screen</span>
              <a
                href="/display" target="_blank" rel="noopener noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  background: "rgba(99,102,241,0.12)",
                  border: "1px solid rgba(99,102,241,0.25)",
                  borderRadius: 7, padding: "6px 12px",
                  color: "#a5b4fc", fontSize: 12, fontWeight: 600, textDecoration: "none",
                }}
              >
                /display
                <Icon name="externalLink" size={11} stroke="#a5b4fc" strokeWidth={2} />
              </a>
            </div>
          </div>
        </Panel>

      </div>
    </div>
  );
}
