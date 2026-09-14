"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type CarouselControl = "play" | "pause" | "next" | "prev" | "stop";

type LifecycleStep = {
  label: string;
  icon: string;
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

// ─── Lifecycle steps ──────────────────────────────────────────────────────────

const LIFECYCLE_STEPS: LifecycleStep[] = [
  { icon: "✏️",  label: "Create Session",      status: "draft",        registrationOpen: false },
  { icon: "⚙️",  label: "Configure Batches",   status: "draft",        registrationOpen: false },
  { icon: "🔓",  label: "Open Registration",   status: "registration", registrationOpen: true  },
  { icon: "📋",  label: "Collect Preferences", status: "registration", registrationOpen: true  },
  { icon: "⚡",  label: "Allocation",           status: "allocation",   registrationOpen: false },
  { icon: "📢",  label: "Publish Results",      status: "published",    registrationOpen: false },
  { icon: "🏁",  label: "Session & Feedback",  status: "closed",       registrationOpen: false },
];

function getActiveStep(status: string, registrationOpen: boolean): number {
  if (status === "closed")                           return 6;
  if (status === "published")                        return 5;
  if (status === "allocation")                       return 4;
  if (status === "registration" && registrationOpen) return 3;
  if (status === "draft")                            return 1;
  return 0;
}

// ─── Shared press-scale animation handler ─────────────────────────────────────

function pressHandlers(disabled = false) {
  return {
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
      if (!disabled) e.currentTarget.style.transform = "scale(0.93)";
    },
    onPointerUp:    (e: React.PointerEvent<HTMLButtonElement>) => { e.currentTarget.style.transform = ""; },
    onPointerLeave: (e: React.PointerEvent<HTMLButtonElement>) => { e.currentTarget.style.transform = ""; },
  };
}

// ─── Reusable grid button ─────────────────────────────────────────────────────

interface GridBtnProps {
  icon: string;
  label: string;
  sub?: string;
  bg: string;
  fg?: string;
  glow?: string;
  disabled?: boolean;
  active?: boolean;          // ring highlight (e.g. lifecycle current step)
  done?: boolean;            // checkmark badge (lifecycle done step)
  wide?: boolean;            // span 2 cols
  onClick: () => void;
}

function GridBtn({ icon, label, sub, bg, fg = "#f1f5f9", glow, disabled, active, done, wide, onClick }: GridBtnProps) {
  const color = active ? "#a5b4fc" : done ? "#34d399" : fg;
  const border = active
    ? "1.5px solid rgba(99,102,241,0.6)"
    : done
    ? "1.5px solid rgba(52,211,153,0.35)"
    : "1.5px solid rgba(255,255,255,0.06)";
  const shadow = active
    ? "0 0 0 3px rgba(99,102,241,0.2), 0 6px 18px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)"
    : `0 6px 18px rgba(0,0,0,0.5)${glow ? `, 0 0 20px ${glow}` : ""}, inset 0 1px 0 rgba(255,255,255,0.08)`;

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        gridColumn: wide ? "span 2" : undefined,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        padding: "18px 10px 16px",
        minHeight: 96,
        background: bg,
        color,
        border,
        borderRadius: 18,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        boxShadow: shadow,
        transition: "transform 0.1s, opacity 0.12s",
        userSelect: "none",
        position: "relative",
      }}
      {...pressHandlers(disabled)}
    >
      {/* Done checkmark badge */}
      {done && !active && (
        <span style={{
          position: "absolute", top: 7, right: 8,
          width: 16, height: 16, borderRadius: "50%",
          background: "#34d399",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
      )}
      {/* Active pill badge */}
      {active && (
        <span style={{
          position: "absolute", top: 7, right: 8,
          fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "#a5b4fc",
          background: "rgba(99,102,241,0.25)",
          borderRadius: 5, padding: "2px 6px",
        }}>
          Now
        </span>
      )}
      <span style={{ fontSize: 26, lineHeight: 1 }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 700, textAlign: "center", lineHeight: 1.3 }}>{label}</span>
      {sub && (
        <span style={{ fontSize: 10, fontWeight: 500, opacity: 0.6, textAlign: "center", lineHeight: 1.3 }}>
          {sub}
        </span>
      )}
    </button>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      <div style={{
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "rgba(148,163,184,0.45)",
        marginBottom: 10,
        paddingLeft: 2,
      }}>
        {label}
      </div>
      {children}
    </section>
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

  const statsRef = useRef(stats);
  statsRef.current = stats;

  // ── Fullscreen ─────────────────────────────────────────────────────────────

  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      void document.documentElement.requestFullscreen?.();
    } else {
      void document.exitFullscreen?.();
    }
  }, []);

  // Fetch overview + session config on mount
  useEffect(() => {
    void (async () => {
      try {
        const [overviewRes, configRes] = await Promise.all([
          fetch("/api/admin/overview"),
          fetch("/api/admin/session-config"),
        ]);
        if (overviewRes.ok) {
          const data = (await overviewRes.json()) as {
            mentors: Mentor[];
            mentees: Mentee[];
            stats: typeof stats;
          };
          setMentors(data.mentors ?? []);
          setMentees(data.mentees ?? []);
          setStats(data.stats ?? statsRef.current);
        }
        if (configRes.ok) {
          const data = (await configRes.json()) as { session: SessionConfig };
          setSession(data.session ?? null);
        }
      } finally {
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Scene push ─────────────────────────────────────────────────────────────

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

  const pushCarousel = (control: CarouselControl) =>
    void push({ type: "mentor-carousel", control, seq: Date.now() });

  // ── Lifecycle advance ──────────────────────────────────────────────────────

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
      if (!res.ok) {
        throw new Error(
          typeof data === "object" && data && "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Unable to update session.",
        );
      }
      const cfgRes = await fetch("/api/admin/session-config");
      if (cfgRes.ok) {
        const cfg = (await cfgRes.json()) as { session: SessionConfig };
        setSession(cfg.session ?? null);
      }
    } catch (err) {
      setLcError(err instanceof Error ? err.message : "Unable to update session status.");
    } finally {
      setAdvancing(false);
    }
  };

  // ── Mentor card ────────────────────────────────────────────────────────────

  const approvedMentors = mentors.filter((m) => m.is_approved);
  const safeMentorIdx   = Math.min(mentorIdx, Math.max(0, approvedMentors.length - 1));

  const goTo = (idx: number) => {
    setMentorIdx(idx);
    const mentor = approvedMentors[idx];
    if (!mentor) return;
    const realIdx = mentors.findIndex((m) => m.id === mentor.id);
    const m = mentors[realIdx];
    if (!m) return;
    const assignedMentees = mentees
      .filter((me) => me.assignedMentor === m.full_name)
      .map((me) => ({ name: me.full_name, studentId: me.student_id }));
    void push({
      type: "mentor-card",
      mentor: {
        id: m.id, name: m.full_name,
        studentId: m.student_id ?? null,
        batch: m.batch ?? null,
        photoUrl: m.profile_photo_url ?? null,
        communicationMethod: m.communication_method,
      },
      mentees: assignedMentees,
      index: realIdx,
      total: mentors.length,
    });
  };

  const s = stats;
  const activeIdx = session ? getActiveStep(session.status, session.registration_open) : -1;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{
      minHeight: "100dvh",
      background: "linear-gradient(160deg,#0a0f1e 0%,#111827 100%)",
      fontFamily: "'Inter',system-ui,sans-serif",
      display: "flex",
      flexDirection: "column",
    }}>

      {/* ── Sticky header ── */}
      <header style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 18px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        position: "sticky",
        top: 0,
        background: "rgba(10,15,30,0.88)",
        backdropFilter: "blur(14px)",
        zIndex: 20,
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>📡</span>
          <div>
            <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 16, lineHeight: 1 }}>
              Remote
            </div>
            <div style={{ color: "rgba(148,163,184,0.65)", fontSize: 11, marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
              {lastScene
                ? <><span style={{ color: "#38bdf8", fontWeight: 600 }}>{lastScene}</span><span style={{ opacity: 0.5 }}>active</span></>
                : <span>no scene</span>}
              {(sending || advancing) && (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 3,
                  color: "#fbbf24", fontWeight: 600,
                }}>
                  <span style={{
                    width: 5, height: 5, borderRadius: "50%",
                    background: "#fbbf24",
                    animation: "pulse 1s infinite",
                  }} />
                  {advancing ? "updating…" : "sending…"}
                </span>
              )}
              {loading && <span style={{ color: "rgba(148,163,184,0.4)" }}>loading…</span>}
            </div>
          </div>
        </div>
        {/* Right: fullscreen + back */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10,
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#94a3b8",
              flexShrink: 0,
            }}
            {...pressHandlers()}
          >
            {isFullscreen ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" />
                <line x1="10" y1="14" x2="3" y2="21" /><line x1="21" y1="3" x2="14" y2="10" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            )}
          </button>
          <a href="/admin" style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10,
            padding: "7px 14px",
            color: "#94a3b8",
            fontSize: 12,
            fontWeight: 600,
            textDecoration: "none",
          }}>
            ← Admin
          </a>
        </div>
      </header>

      {/* ── Scrollable body ── */}
      <div style={{
        flex: 1,
        padding: "22px 14px 56px",
        display: "flex",
        flexDirection: "column",
        gap: 32,
        maxWidth: 540,
        width: "100%",
        margin: "0 auto",
        boxSizing: "border-box",
      }}>

        {/* ════ 1. SCENES ═══════════════════════════════════════════════════ */}
        <Section label="Scenes">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <GridBtn icon="🌌" label="Cover / Idle"       bg="#0f1929"                onClick={() => void push({ type: "idle" })}                                                                                                  disabled={sending} />
            <GridBtn icon="🎠" label="Mentor Carousel"    bg="#0d1b3e"                onClick={() => void push({ type: "mentor-carousel" })}                                                                                        disabled={sending} />
            <GridBtn icon="📊" label="Live Registrations" bg="#0f1929"                onClick={() => void push({ type: "live-registrations" })}                                                                                     disabled={sending} />
            <GridBtn icon="🙏" label="Thank You"          bg="#0f1929"                onClick={() => void push({ type: "thankyou" })}                                                                                               disabled={sending} />
            <GridBtn icon="✅" label="Show Results"        bg="#052e16" fg="#86efac"   onClick={() => void push({ type: "results", assigned: s.assigned, unmatched: s.unassigned, satisfaction: s.preferenceSatisfaction })}          disabled={sending} glow="rgba(52,211,153,0.15)" />
            <GridBtn icon="⚙️" label="Engine Ready"       bg="#0d0d2b" fg="#a5b4fc"   onClick={() => void push({ type: "allocation-load" })}                                                                                        disabled={sending} sub="load mentors" />
            <GridBtn icon="▶️" label="Allocation Anim."   bg="#0d1b3e" fg="#93c5fd"   onClick={() => void push({ type: "allocation", count: 0, total: s.totalMentees })}                                                            disabled={sending} sub="drip-feed" wide />
          </div>
        </Section>

        {/* ════ 2. CAROUSEL CONTROLS ════════════════════════════════════════ */}
        <Section label="Carousel Controls">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <GridBtn icon="◀"  label="Prev"  bg="#0f1929"            onClick={() => pushCarousel("prev")}  disabled={sending} />
            <GridBtn icon="▶"  label="Play"  bg="#052e16" fg="#86efac" onClick={() => pushCarousel("play")}  disabled={sending} glow="rgba(52,211,153,0.12)" />
            <GridBtn icon="▶|" label="Next"  bg="#0f1929"            onClick={() => pushCarousel("next")}  disabled={sending} />
            <GridBtn icon="⏸"  label="Pause" bg="#2d1a00" fg="#fcd34d" onClick={() => pushCarousel("pause")} disabled={sending} />
            <GridBtn icon="⏹"  label="Stop"  bg="#2d0808" fg="#fca5a5" onClick={() => pushCarousel("stop")}  disabled={sending} wide />
          </div>
        </Section>

        {/* ════ 3. MENTOR CARD ══════════════════════════════════════════════ */}
        {approvedMentors.length > 0 && (
          <Section label={`Mentor Card  ${safeMentorIdx + 1} / ${approvedMentors.length}`}>
            {/* Name readout */}
            <div style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12,
              padding: "11px 14px",
              color: "#e2e8f0",
              fontWeight: 700,
              fontSize: 14,
              marginBottom: 10,
              textAlign: "center",
              letterSpacing: "0.01em",
            }}>
              {approvedMentors[safeMentorIdx]?.full_name ?? "—"}
            </div>

            {/* Prev / Show / Next */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
              <GridBtn icon="◀"  label="Prev" bg="#0f1929" onClick={() => goTo(safeMentorIdx - 1)} disabled={sending || safeMentorIdx === 0} />
              <GridBtn icon="📺" label="Show" bg="#0d1b3e" onClick={() => goTo(safeMentorIdx)}     disabled={sending} glow="rgba(99,102,241,0.15)" />
              <GridBtn icon="▶"  label="Next" bg="#0f1929" onClick={() => goTo(safeMentorIdx + 1)} disabled={sending || safeMentorIdx >= approvedMentors.length - 1} />
            </div>

            {/* Mentor picker */}
            <select
              value={safeMentorIdx}
              onChange={(e) => goTo(Number(e.target.value))}
              style={{
                width: "100%",
                padding: "11px 14px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.09)",
                borderRadius: 11,
                color: "#cbd5e1",
                fontSize: 13,
                outline: "none",
                cursor: "pointer",
              }}
            >
              {approvedMentors.map((m, i) => (
                <option key={m.id} value={i} style={{ background: "#111827" }}>
                  {i + 1}. {m.full_name}
                </option>
              ))}
            </select>
          </Section>
        )}

        {/* ════ 4. SESSION LIFECYCLE ════════════════════════════════════════ */}
        <Section label="Session Lifecycle">
          {loading || !session ? (
            <div style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 14,
              padding: "20px",
              color: "rgba(148,163,184,0.5)",
              fontSize: 13,
              textAlign: "center",
            }}>
              {loading ? "Loading…" : "Session unavailable"}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {LIFECYCLE_STEPS.map((step, i) => {
                  const current = i === activeIdx;
                  const done    = i < activeIdx;

                  // colour palette per step
                  const palette: Record<number, { bg: string; fg: string; glow?: string }> = {
                    0: { bg: "#111827",              fg: "#94a3b8"  },
                    1: { bg: "#111827",              fg: "#94a3b8"  },
                    2: { bg: "#0d1b3e",              fg: "#93c5fd", glow: "rgba(99,102,241,0.12)" },
                    3: { bg: "#0d1b3e",              fg: "#a5b4fc", glow: "rgba(99,102,241,0.12)" },
                    4: { bg: "#2d1a00",              fg: "#fcd34d", glow: "rgba(251,191,36,0.12)"  },
                    5: { bg: "#052e16",              fg: "#86efac", glow: "rgba(52,211,153,0.15)"  },
                    6: { bg: "#1a0530",              fg: "#d8b4fe", glow: "rgba(168,85,247,0.12)"  },
                  };
                  const p = palette[i] ?? palette[0];

                  // active step gets its palette colour boosted; done gets green
                  const bg     = current ? p.bg    : done ? "#071c13" : "#0a0f1e";
                  const fg     = current ? p.fg    : done ? "#34d399" : "rgba(148,163,184,0.45)";
                  const glow   = current ? p.glow  : done ? "rgba(52,211,153,0.08)" : undefined;

                  return (
                    <GridBtn
                      key={i}
                      icon={step.icon}
                      label={step.label}
                      bg={bg}
                      fg={fg}
                      glow={glow}
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
                  padding: "10px 14px",
                  background: "rgba(220,38,38,0.12)",
                  border: "1px solid rgba(220,38,38,0.25)",
                  borderRadius: 10,
                  color: "#fca5a5",
                  fontSize: 12,
                }}>
                  {lcError}
                </div>
              )}
            </div>
          )}
        </Section>

        {/* ════ 5. CUSTOM MESSAGE + DISPLAY LINK ═══════════════════════════ */}
        <Section label="Other">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>

            {/* Custom message inputs */}
            <input
              type="text"
              placeholder="Custom message…"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.09)",
                borderRadius: 11,
                padding: "12px 14px",
                color: "#f1f5f9",
                fontSize: 14,
                outline: "none",
              }}
            />
            <input
              type="text"
              placeholder="Sub-text (optional)"
              value={customSub}
              onChange={(e) => setCustomSub(e.target.value)}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.09)",
                borderRadius: 11,
                padding: "12px 14px",
                color: "#f1f5f9",
                fontSize: 14,
                outline: "none",
              }}
            />
            <button
              disabled={sending || !customText.trim()}
              onClick={() => void push({ type: "custom", text: customText.trim(), sub: customSub.trim() || undefined })}
              style={{
                padding: "14px",
                borderRadius: 12,
                border: "none",
                fontSize: 14,
                fontWeight: 700,
                cursor: customText.trim() ? "pointer" : "not-allowed",
                background: customText.trim() ? "linear-gradient(135deg,#4f46e5,#7c3aed)" : "rgba(255,255,255,0.04)",
                color: customText.trim() ? "#fff" : "#475569",
                opacity: (sending || !customText.trim()) ? 0.5 : 1,
                boxShadow: customText.trim() ? "0 4px 14px rgba(79,70,229,0.35)" : "none",
                transition: "background 0.15s, box-shadow 0.15s",
                userSelect: "none",
              }}
              {...pressHandlers(!customText.trim() || sending)}
            >
              Push Message →
            </button>

            {/* Display screen link */}
            <div style={{
              marginTop: 4,
              padding: "13px 16px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}>
              <span style={{ color: "rgba(148,163,184,0.55)", fontSize: 12 }}>Projector / second screen</span>
              <a
                href="/display"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  background: "rgba(99,102,241,0.12)",
                  color: "#a5b4fc",
                  fontWeight: 700,
                  fontSize: 12,
                  padding: "7px 14px",
                  borderRadius: 9,
                  textDecoration: "none",
                  border: "1px solid rgba(99,102,241,0.2)",
                }}
              >
                /display ↗
              </a>
            </div>

          </div>
        </Section>

      </div>
    </div>
  );
}
