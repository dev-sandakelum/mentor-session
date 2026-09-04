"use client";

import { FormEvent, useEffect, useState } from "react";

// ─── types ────────────────────────────────────────────────────────────────────

type Assignment = {
  id: string;
  mentee_student_id: string;
  mentor_id: string;
  created_at: string;
  mentors: { full_name: string; student_id: string } | null;
};

type Mentor = {
  id: string;
  full_name: string;
  student_id: string | null;
};

// ─── helpers ─────────────────────────────────────────────────────────────────

function authHeaders(token: string) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

// ─── component ───────────────────────────────────────────────────────────────

export function SuperAdminScreen() {
  const [token,       setToken]       = useState("");
  const [input,       setInput]       = useState("");
  const [authed,      setAuthed]      = useState(false);
  const [authErr,     setAuthErr]     = useState("");
  const [loading,     setLoading]     = useState(false);

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [mentors,     setMentors]     = useState<Mentor[]>([]);
  const [fetchErr,    setFetchErr]    = useState("");
  const [setupRequired, setSetupRequired] = useState(false);

  // Form state
  const [studentId,   setStudentId]   = useState("");
  const [mentorId,    setMentorId]    = useState("");
  const [saving,      setSaving]      = useState(false);
  const [saveErr,     setSaveErr]     = useState("");
  const [saveOk,      setSaveOk]      = useState("");

  // Seed state
  const [seeding,     setSeeding]     = useState<"mentees" | "mentors" | "preferences" | null>(null);
  const [seedMsg,     setSeedMsg]     = useState("");

  // ── auth ──────────────────────────────────────────────────────────────────
  const handleAuth = async (e: FormEvent) => {
    e.preventDefault();
    setAuthErr("");
    setLoading(true);
    try {
      // Probe the API — a 404 means wrong token or route doesn't exist
      const res = await fetch("/api/super/zero-priority", {
        headers: { Authorization: `Bearer ${input.trim()}` },
      });
      if (res.status === 404 || res.status === 401) {
        setAuthErr("Access denied.");
        return;
      }
      const data = await res.json() as { assignments?: Assignment[]; mentorList?: { id: string; full_name: string; student_id: string | null }[]; setupRequired?: boolean };
      setToken(input.trim());
      setAuthed(true);
      setAssignments(data.assignments ?? []);
      if (data.mentorList) setMentors(data.mentorList);
      if (data.setupRequired) setSetupRequired(true);
    } catch {
      setAuthErr("Network error.");
    } finally {
      setLoading(false);
    }
  };

  // ── load mentors for dropdown ─────────────────────────────────────────────
  const loadMentors = async (tok = token) => {
    try {
      // First try the zero-priority endpoint which returns full mentor data
      const res = await fetch("/api/super/zero-priority", {
        headers: { Authorization: `Bearer ${tok}` },
      });
      if (!res.ok) return;
      const data = await res.json() as {
        assignments?: Assignment[];
        mentorList?: { id: string; full_name: string; student_id: string | null }[];
      };
      if (data.mentorList) {
        setMentors(data.mentorList);
        return;
      }
      // Fallback: public mentors endpoint (no student_id but still useful)
      const pub = await fetch("/api/mentors");
      if (!pub.ok) return;
      const pd = await pub.json() as { mentors?: { id: string; fullName: string }[] };
      setMentors((pd.mentors ?? []).map((m) => ({ id: m.id, full_name: m.fullName, student_id: null })));
    } catch { /* non-fatal */ }
  };

  useEffect(() => { if (authed) void loadMentors(); }, [authed]);

  // ── reload assignments ─────────────────────────────────────────────────────
  const reload = async (tok = token) => {
    setFetchErr("");
    try {
      const res = await fetch("/api/super/zero-priority", {
        headers: { Authorization: `Bearer ${tok}` },
      });
      const data = await res.json() as {
        assignments?: Assignment[];
        mentorList?: { id: string; full_name: string; student_id: string | null }[];
        error?: string;
        setupRequired?: boolean;
      };
      if (!res.ok) { setFetchErr(data.error ?? "Unable to load."); return; }
      setAssignments(data.assignments ?? []);
      if (data.mentorList) setMentors(data.mentorList);
      if (data.setupRequired) setSetupRequired(true); else setSetupRequired(false);
    } catch {
      setFetchErr("Network error.");
    }
  };

  // ── add assignment ─────────────────────────────────────────────────────────
  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    setSaveErr("");
    setSaveOk("");
    if (studentId.length !== 4) { setSaveErr("Enter exactly 4 digits for the student number."); return; }
    if (!mentorId) { setSaveErr("Select or enter a mentor."); return; }
    const fullStudentId = `TG/IT/2025/${studentId}`;
    // If no dropdown loaded, mentorId is 4 digits → build full TG number for server to resolve
    const mentorIdOrTg = mentors.length === 0 && mentorId.length === 4
      ? `TG/2024/${mentorId}`
      : mentorId;
    setSaving(true);
    try {
      const res = await fetch("/api/super/zero-priority", {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ menteeStudentId: fullStudentId, mentorId: mentorIdOrTg }),
      });
      const data = await res.json() as { ok?: boolean; mentorName?: string; error?: string };
      if (!res.ok) { setSaveErr(data.error ?? "Unable to save."); return; }
      setSaveOk(`Saved: ${fullStudentId} → ${data.mentorName ?? mentorId}`);
      setStudentId("");
      setMentorId("");
      await reload();
    } catch {
      setSaveErr("Network error.");
    } finally {
      setSaving(false);
    }
  };

  // ── remove assignment ──────────────────────────────────────────────────────
  const handleRemove = async (id: string) => {
    try {
      await fetch(`/api/super/zero-priority?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      await reload();
    } catch { /* non-fatal */ }
  };

  // ── seed inject ────────────────────────────────────────────────────────────
  const handleSeed = async (target: "mentees" | "mentors" | "preferences") => {
    setSeedMsg("");
    setSeeding(target);
    try {
      const res = await fetch("/api/super/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ target }),
      });
      const data = await res.json() as { ok?: boolean; inserted?: number; total?: number; error?: string };
      if (!res.ok) { setSeedMsg(`Error: ${data.error ?? "Failed."}`); return; }
      setSeedMsg(`✓ ${target === "mentees" ? "Mentees" : target === "mentors" ? "Mentors" : "Preferences"} injected: ${data.inserted ?? 0} new of ${data.total ?? 0} total.`);
      await reload(); // always refresh — mentors dropdown needs updating after mentor inject
    } catch {
      setSeedMsg("Network error.");
    } finally {
      setSeeding(null);
    }
  };

  // ── render: auth screen ───────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="sp-wrap">
        <div className="sp-card">
          <div className="sp-lock" aria-hidden="true">🔐</div>
          <form onSubmit={(e) => void handleAuth(e)} className="sp-form">
            <input
              className="sp-input"
              type="password"
              autoComplete="off"
              placeholder="Access key"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              required
            />
            <button className="sp-btn-primary" type="submit" disabled={loading}>
              {loading ? "…" : "Enter"}
            </button>
          </form>
          {authErr && <p className="sp-err">{authErr}</p>}
        </div>
      </div>
    );
  }

  // ── render: main interface ────────────────────────────────────────────────
  return (
    <div className="sp-wrap">
      <div className="sp-panel">

        {/* Header */}
        <div className="sp-header">
          <span className="sp-badge">⬡ RESTRICTED</span>
          <button className="sp-signout" onClick={() => { setAuthed(false); setToken(""); setInput(""); }}>
            Sign out
          </button>
        </div>

        {/* Setup required banner */}
        {setupRequired && (
          <div style={{
            background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)",
            borderRadius: 12, padding: "14px 18px", marginBottom: 16,
            display: "flex", gap: 12, alignItems: "flex-start",
          }}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>⚠</span>
            <div>
              <p style={{ color: "#fcd34d", fontWeight: 700, fontSize: 13, margin: "0 0 4px" }}>
                Database migration required
              </p>
              <p style={{ color: "#94a3b8", fontSize: 12.5, margin: 0, lineHeight: 1.5 }}>
                Run <code style={{ color: "#a5b4fc" }}>database/migrations/add_zero_priority.sql</code> in
                Supabase Dashboard → SQL Editor, then refresh.
              </p>
            </div>
          </div>
        )}

        {/* Add form */}
        <div className="sp-section">
          <h2 className="sp-title">Add pre-assignment</h2>
          <form onSubmit={(e) => void handleAdd(e)} className="sp-add-form">
            <div className="sp-field">
              <label className="sp-label" htmlFor="sp-sid">Mentee Student ID</label>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: "#64748b", fontSize: 13, fontFamily: "ui-monospace,monospace", whiteSpace: "nowrap" }}>
                  TG/IT/2025/
                </span>
                <input
                  id="sp-sid"
                  className="sp-input"
                  type="text"
                  inputMode="numeric"
                  placeholder="0042"
                  maxLength={4}
                  value={studentId}
                  style={{ width: 80, flexShrink: 0 }}
                  onChange={(e) => { setStudentId(e.target.value.replace(/\D/g, "").slice(0, 4)); setSaveErr(""); setSaveOk(""); }}
                />
              </div>
            </div>
            <div className="sp-field">
              <label className="sp-label" htmlFor="sp-mentor">Mentor</label>
              {mentors.length > 0 ? (
                <select
                  id="sp-mentor"
                  className="sp-input sp-select"
                  value={mentorId}
                  onChange={(e) => { setMentorId(e.target.value); setSaveErr(""); setSaveOk(""); }}
                >
                  <option value="">— select mentor —</option>
                  {mentors.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name}{m.student_id ? ` (${m.student_id})` : ""}
                    </option>
                  ))}
                </select>
              ) : (
                /* No mentors loaded yet — accept TG number directly */
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: "#64748b", fontSize: 13, fontFamily: "ui-monospace,monospace", whiteSpace: "nowrap" }}>
                    TG/2024/
                  </span>
                  <input
                    id="sp-mentor"
                    className="sp-input"
                    type="text"
                    inputMode="numeric"
                    placeholder="0045"
                    maxLength={4}
                    value={mentorId}
                    style={{ width: 80, flexShrink: 0 }}
                    onChange={(e) => { setMentorId(e.target.value.replace(/\D/g, "").slice(0, 4)); setSaveErr(""); setSaveOk(""); }}
                  />
                </div>
              )}
            </div>
            <button className="sp-btn-primary" type="submit" disabled={saving} style={{ alignSelf: "flex-end" }}>
              {saving ? "Saving…" : "Add"}
            </button>
          </form>
          {saveErr && <p className="sp-err">{saveErr}</p>}
          {saveOk  && <p className="sp-ok">{saveOk}</p>}
        </div>

        {/* List */}
        <div className="sp-section">
          <div className="sp-row-head">
            <h2 className="sp-title" style={{ margin: 0 }}>
              Pre-assignments
              <span className="sp-count">{assignments.length}</span>
            </h2>
            <button className="sp-btn-ghost" onClick={() => void reload()}>↻ Refresh</button>
          </div>
          {fetchErr && <p className="sp-err">{fetchErr}</p>}
          {assignments.length === 0
            ? <p className="sp-muted">No pre-assignments yet.</p>
            : (
              <table className="sp-table">
                <thead>
                  <tr>
                    <th>Mentee Student ID</th>
                    <th>Mentor</th>
                    <th>Added</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((a) => (
                    <tr key={a.id}>
                      <td className="sp-mono">{a.mentee_student_id}</td>
                      <td>
                        {a.mentors?.full_name ?? "—"}
                        {a.mentors?.student_id
                          ? <span className="sp-muted"> · {a.mentors.student_id}</span>
                          : null}
                      </td>
                      <td className="sp-muted">
                        {new Date(a.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <button
                          className="sp-btn-del"
                          onClick={() => void handleRemove(a.id)}
                          aria-label="Remove"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>

        {/* Seed inject */}
        <div className="sp-section">
          <h2 className="sp-title">Inject seed data</h2>
          <p className="sp-muted" style={{ marginBottom: 16 }}>
            Push records from <code style={{ color: "#a5b4fc", fontSize: 12 }}>data/seed-mentors.ts</code> and{" "}
            <code style={{ color: "#a5b4fc", fontSize: 12 }}>data/seed-mentees.ts</code> directly into the database.
            Safe to re-run — duplicates are skipped. <strong style={{ color: "#94a3b8" }}>Inject in order: Mentors → Mentees → Preferences.</strong>
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              className="sp-btn-primary"
              disabled={!!seeding}
              onClick={() => void handleSeed("mentors")}
              style={{ background: "#0f766e" }}
            >
              {seeding === "mentors" ? "Injecting…" : "⬆ Inject Mentors"}
            </button>
            <button
              className="sp-btn-primary"
              disabled={!!seeding}
              onClick={() => void handleSeed("mentees")}
              style={{ background: "#1d4ed8" }}
            >
              {seeding === "mentees" ? "Injecting…" : "⬆ Inject Mentees"}
            </button>
            <button
              className="sp-btn-primary"
              disabled={!!seeding}
              onClick={() => void handleSeed("preferences")}
              style={{ background: "#7c3aed" }}
            >
              {seeding === "preferences" ? "Injecting…" : "⬆ Inject Preferences"}
            </button>
          </div>
          {seedMsg && (
            <p className={seedMsg.startsWith("✓") ? "sp-ok" : "sp-err"} style={{ marginTop: 12 }}>
              {seedMsg}
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
