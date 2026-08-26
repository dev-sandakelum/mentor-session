"use client";

import { FormEvent, useState } from "react";
import { useToast } from "../ToastProvider";
import { Pill } from "../ui/Pill";
import { ResetModal } from "../ui/ResetModal";
import { MentorFormModal, type MentorRecord } from "../admin/MentorFormModal";

type Overview = {
  session: { title: string; status: string; event_starts_at: string | null; venue: string | null };
  stats: Record<"totalMentors" | "totalMentees" | "submittedPreferences" | "totalCapacity" | "assigned" | "unassigned" | "availableCapacity" | "firstChoice" | "secondChoice" | "thirdChoice" | "fallback" | "manual" | "preferenceSatisfaction", number>;
  allocations: { mentee: string; mentor: string; submittedAt: string | null; method: string; matchedPriority: number | null }[];
  unmatched: { mentee: string; preferences: string[] }[];
  mentorLoads: { name: string; assigned: number; capacity: number }[];
  mentors: { id: string; full_name: string; student_id: string; email: string; phone: string; batch: string; communication_method: string; academic_interests: string[]; technical_interests: string[]; profile_photo_url: string | null; capacity: number }[];
  mentees: { id: string; full_name: string; student_id: string; email: string; phone: string; batch: string; academic_interests: string[]; technical_interests: string[]; guidance_needed: string | null; preference_submitted_at: string | null; assignedMentor: string | null; allocationMethod: string | null; matchedPriority: number | null }[];
  logs: { id: number; action: string; detail: string | null; created_at: string }[];
};

type Tab = "overview" | "mentors" | "mentees" | "allocation" | "logs";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview",   label: "Overview"   },
  { id: "mentors",    label: "Mentors"    },
  { id: "mentees",    label: "Mentees"    },
  { id: "allocation", label: "Allocation" },
  { id: "logs",       label: "Logs"       },
];

function StatCard({ value, label, accent = "default" }: { value: string; label: string; accent?: "indigo" | "amber" | "green" | "default" }) {
  return (
    <div className={`stat${accent !== "default" ? ` ${accent}` : ""}`}>
      <div className="v">{value}</div>
      <div className="k">{label}</div>
    </div>
  );
}

function methodPill(method: string, priority: number | null) {
  if (method === "fallback") return <Pill variant="gray">Fallback</Pill>;
  if (method === "manual")   return <Pill variant="green">Manual</Pill>;
  return <Pill variant={priority === 1 ? "amber" : "indigo"}>
    {priority ? `${priority}${priority === 1 ? "st" : priority === 2 ? "nd" : "rd"} Choice` : "Preference"}
  </Pill>;
}

// ─── Tab panels ──────────────────────────────────────────────────────────────

function OverviewTab({ overview }: { overview: Overview }) {
  const s = overview.stats;
  return (
    <>
      <div className="stats-grid">
        <StatCard value={String(s.totalMentors)}           label="Total mentors"                accent="indigo" />
        <StatCard value={String(s.totalMentees)}           label={`${s.submittedPreferences} preferences submitted`} accent="indigo" />
        <StatCard value={String(s.totalCapacity)}          label="Total capacity" />
        <StatCard value={String(s.assigned)}               label="Assigned"                     accent="green" />
        <StatCard value={String(s.unassigned)}             label="Unassigned" />
        <StatCard value={String(s.availableCapacity)}      label="Available capacity" />
        <StatCard value={String(s.firstChoice)}            label="1st choice"                   accent="amber" />
        <StatCard value={String(s.secondChoice)}           label="2nd choice" />
        <StatCard value={String(s.thirdChoice)}            label="3rd choice" />
        <StatCard value={String(s.fallback)}               label="Fallback" />
        <StatCard value={String(s.manual)}                 label="Manual assignment" />
        <StatCard value={`${s.preferenceSatisfaction}%`}   label="Preference satisfaction"      accent="green" />
      </div>

      <div className="card" style={{ marginTop: 22 }}>
        <h3 className="card-title">Session Details</h3>
        <div className="info-row"><div><b>Date &amp; Time</b>{overview.session.event_starts_at ? new Date(overview.session.event_starts_at).toLocaleString() : "To be announced"}</div></div>
        <div className="info-row"><div><b>Venue</b>{overview.session.venue ?? "To be announced"}</div></div>
        <div className="info-row"><div><b>Status</b><Pill variant="indigo" dot>{overview.session.status.toUpperCase()}</Pill></div></div>
      </div>

      <div className="card" style={{ marginTop: 22 }}>
        <h3 className="card-title">Mentor Load</h3>
        {overview.mentorLoads.length === 0
          ? <p className="muted">No approved mentors yet.</p>
          : overview.mentorLoads.map((m, i) => (
            <div className="load-row" key={`${m.name}-${i}`}>
              <span className="name">{m.name}</span>
              <div className="bar"><span style={{ width: `${Math.min((m.assigned / m.capacity) * 100, 100)}%` }} /></div>
              <span className="count">{m.assigned} / {m.capacity}</span>
            </div>
          ))}
      </div>
    </>
  );
}

function MentorsTab({ overview, onAdd, onEdit, onDelete }: {
  overview: Overview;
  onAdd: () => void;
  onEdit: (mentor: Overview["mentors"][number]) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
        <h3 className="card-title" style={{ margin: 0 }}>All Mentors</h3>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Pill variant="indigo">{overview.mentors.length} mentors</Pill>
          <button className="btn btn-primary btn-sm" onClick={onAdd}>+ Add mentor</button>
        </div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr><th>Mentor</th><th>Contact</th><th>Batch</th><th>Interests</th><th>Capacity</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {overview.mentors.length ? overview.mentors.map((m) => (
              <tr key={m.id}>
                <td><b>{m.full_name}</b><br /><span className="muted">{m.student_id}</span></td>
                <td>{m.email}<br /><span className="muted">{m.phone} · {m.communication_method}</span></td>
                <td>{m.batch}</td>
                <td className="muted">{[...m.academic_interests, ...m.technical_interests].join(", ") || "-"}</td>
                <td>{m.capacity}</td>
                <td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => onEdit(m)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => onDelete(m.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            )) : <tr><td colSpan={6} className="muted">No mentors added yet. Use &quot;Add mentor&quot; to create one.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MenteesTab({ overview }: { overview: Overview }) {
  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
        <h3 className="card-title" style={{ margin: 0 }}>All Mentees</h3>
        <Pill variant="indigo">{overview.mentees.length} mentees</Pill>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr><th>Mentee</th><th>Contact</th><th>Batch</th><th>Interests &amp; guidance</th><th>Preferences</th><th>Assigned mentor</th></tr>
          </thead>
          <tbody>
            {overview.mentees.length ? overview.mentees.map((m) => (
              <tr key={m.id}>
                <td><b>{m.full_name}</b><br /><span className="muted">{m.student_id}</span></td>
                <td>{m.email}<br /><span className="muted">{m.phone}</span></td>
                <td>{m.batch}</td>
                <td className="muted">
                  {[...m.academic_interests, ...m.technical_interests].join(", ") || "-"}
                  {m.guidance_needed ? <><br />Needs: {m.guidance_needed}</> : null}
                </td>
                <td>{m.preference_submitted_at ? <Pill variant="green">Submitted</Pill> : <Pill variant="amber">Pending</Pill>}</td>
                <td>
                  {m.assignedMentor
                    ? <>{m.assignedMentor}<br />{methodPill(m.allocationMethod ?? "preference", m.matchedPriority)}</>
                    : <span className="muted">Unassigned</span>}
                </td>
              </tr>
            )) : <tr><td colSpan={6} className="muted">No mentees registered yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AllocationTab({ overview, running, onRun, onReset }: {
  overview: Overview;
  running: boolean;
  onRun: (mode: "preview" | "commit", fallback: boolean) => void;
  onReset: () => void;
}) {
  return (
    <>
      <div className="card">
        <h3 className="card-title">Allocation Controls</h3>
        <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
          Preview a first-come, first-served result before committing it. A fallback fills remaining mentor capacity for unmatched mentees.
        </p>
        <div className="admin-controls">
          <button className="btn btn-outline btn-sm" disabled={running} onClick={() => onRun("preview", false)}>Preview FCFS</button>
          <button className="btn btn-primary btn-sm" disabled={running} onClick={() => onRun("commit", false)}>Commit FCFS</button>
          <button className="btn btn-amber btn-sm" disabled={running} onClick={() => onRun("commit", true)}>Commit with Fallback</button>
          <button className="btn btn-danger btn-sm" disabled={running} onClick={onReset}>Reset Allocation</button>
        </div>
      </div>

      <div className="card" style={{ marginTop: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 12, alignItems: "center" }}>
          <h3 className="card-title" style={{ margin: 0 }}>Allocation Results</h3>
          <Pill variant="gray">{overview.allocations.length} assignments</Pill>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead><tr><th>Student</th><th>Submitted</th><th>Mentor</th><th>Method</th></tr></thead>
            <tbody>
              {overview.allocations.length
                ? overview.allocations.map((row) => (
                  <tr key={row.mentee}>
                    <td>{row.mentee}</td>
                    <td className="muted">{row.submittedAt ? new Date(row.submittedAt).toLocaleTimeString() : "-"}</td>
                    <td>{row.mentor}</td>
                    <td>{methodPill(row.method, row.matchedPriority)}</td>
                  </tr>
                ))
                : <tr><td colSpan={4} className="muted">No allocation has been saved yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginTop: 22 }}>
        <h3 className="card-title">Unmatched Pool</h3>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead><tr><th>Student</th><th>Preferences</th></tr></thead>
            <tbody>
              {overview.unmatched.length
                ? overview.unmatched.map((row) => (
                  <tr key={row.mentee}><td>{row.mentee}</td><td className="muted">{row.preferences.join(" → ")}</td></tr>
                ))
                : <tr><td colSpan={2} className="muted">No unmatched mentees.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function LogsTab({ overview }: { overview: Overview }) {
  return (
    <div className="card">
      <h3 className="card-title">Allocation Log</h3>
      {overview.logs.length ? (
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead><tr><th>Time</th><th>Action</th><th>Detail</th></tr></thead>
            <tbody>
              {overview.logs.map((entry) => (
                <tr key={entry.id}>
                  <td className="muted" style={{ whiteSpace: "nowrap" }}>{new Date(entry.created_at).toLocaleString()}</td>
                  <td><b>{entry.action}</b></td>
                  <td className="muted">{entry.detail ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="muted">No allocation activity yet.</p>}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AdminScreen() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [modalOpen, setModalOpen] = useState(false);
  const [mentorModalOpen, setMentorModalOpen] = useState(false);
  const [editingMentor, setEditingMentor] = useState<MentorRecord | null>(null);
  const [deleteMentorId, setDeleteMentorId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [running, setRunning] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [overview, setOverview] = useState<Overview>();

  const loadOverview = async () => {
    setRunning(true);
    try {
      const res = await fetch("/api/admin/overview");
      const data: unknown = await res.json();
      if (!res.ok) {
        if (res.status === 401) { setAuthenticated(false); setOverview(undefined); }
        throw new Error(typeof data === "object" && data && "error" in data && typeof data.error === "string" ? data.error : "Unable to load admin data.");
      }
      setOverview(data as Overview);
      setAuthenticated(true);
    } finally { setRunning(false); }
  };

  const signIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRunning(true);
    try {
      const res = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const data: unknown = await res.json();
      if (!res.ok) throw new Error(typeof data === "object" && data && "error" in data && typeof data.error === "string" ? data.error : "Unable to sign in.");
      setPassword("");
      setAuthenticated(true);
      await loadOverview();
      showToast("Signed in as administrator.");
    } catch (error) { showToast(error instanceof Error ? error.message : "Unable to sign in."); }
    finally { setRunning(false); }
  };

  const signOut = async () => {
    setRunning(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      setAuthenticated(false);
      setOverview(undefined);
      showToast("Signed out.");
    } finally { setRunning(false); }
  };

  const runAllocation = async (mode: "preview" | "commit", includeFallback: boolean) => {
    setRunning(true);
    try {
      const res = await fetch("/api/admin/allocations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode, includeFallback }) });
      const data: unknown = await res.json();
      if (!res.ok) throw new Error(typeof data === "object" && data && "error" in data && typeof data.error === "string" ? data.error : "Allocation request failed.");
      const result = data as { allocationCount: number; unmatchedCount: number };
      showToast(`${mode === "preview" ? "Preview" : "Allocation saved"}: ${result.allocationCount} assigned, ${result.unmatchedCount} unmatched.`);
      if (mode === "commit") await loadOverview();
    } catch (error) { showToast(error instanceof Error ? error.message : "Allocation request failed."); }
    finally { setRunning(false); }
  };

  const resetAllocation = async () => {
    setRunning(true);
    try {
      const res = await fetch("/api/admin/allocations", { method: "DELETE" });
      const data: unknown = await res.json();
      if (!res.ok) throw new Error(typeof data === "object" && data && "error" in data && typeof data.error === "string" ? data.error : "Unable to reset allocation.");
      setModalOpen(false);
      showToast("Allocation reset.");
      await loadOverview();
    } catch (error) { showToast(error instanceof Error ? error.message : "Unable to reset allocation."); }
    finally { setRunning(false); }
  };

  const handleMentorSaved = (mentor: MentorRecord) => {
    setOverview((cur) => {
      if (!cur) return cur;
      const exists = cur.mentors.some((m) => m.id === mentor.id);
      const mentors = exists
        ? cur.mentors.map((m) => m.id === mentor.id ? { ...m, ...mentor, profile_photo_url: mentor.profile_photo_url ?? null } : m)
        : [...cur.mentors, { ...mentor, profile_photo_url: mentor.profile_photo_url ?? null }].sort((a, b) => a.full_name.localeCompare(b.full_name));
      return { ...cur, mentors, stats: { ...cur.stats, totalMentors: mentors.length } };
    });
    showToast(editingMentor ? "Mentor updated." : "Mentor added.");
    setEditingMentor(null);
  };

  const deleteMentor = async () => {
    if (!deleteMentorId) return;
    setRunning(true);
    try {
      const res = await fetch(`/api/admin/mentors/${deleteMentorId}`, { method: "DELETE" });
      const data: unknown = await res.json();
      if (!res.ok) throw new Error(typeof data === "object" && data && "error" in data && typeof data.error === "string" ? data.error : "Unable to delete mentor.");
      setOverview((cur) => {
        if (!cur) return cur;
        const mentors = cur.mentors.filter((m) => m.id !== deleteMentorId);
        return { ...cur, mentors, stats: { ...cur.stats, totalMentors: mentors.length } };
      });
      setDeleteMentorId(null);
      showToast("Mentor deleted.");
    } catch (error) { showToast(error instanceof Error ? error.message : "Unable to delete mentor."); }
    finally { setRunning(false); }
  };

  return (
    <div className="container">
      {/* ── Page header ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 4 }}>
        <h2 className="section-title" style={{ margin: 0 }}>{overview?.session.title ?? "Mentor Session"} - Admin</h2>
        <Pill variant="green" dot>{overview?.session.status ?? "Secure"}</Pill>
      </div>
      <p className="section-sub">
        {overview?.session.event_starts_at ? new Date(overview.session.event_starts_at).toLocaleString() : "Load live data to view session details"}
        {overview?.session.venue ? ` · ${overview.session.venue}` : ""}
      </p>

      {/* ── Auth card ── */}
      <div className="card" style={{ marginBottom: 22 }}>
        <h3 className="card-title">Administrator access</h3>
        {authenticated ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <p className="hint" style={{ margin: 0 }}>You are signed in with a secure browser session.</p>
            <button className="btn btn-outline btn-sm" disabled={running}
              onClick={() => void loadOverview().catch((e: unknown) => showToast(e instanceof Error ? e.message : "Unable to load admin data."))}>
              {running ? "Loading…" : "Refresh data"}
            </button>
            <button className="btn btn-ghost btn-sm" disabled={running} onClick={() => void signOut()}>Sign out</button>
          </div>
        ) : (
          <form onSubmit={(e) => void signIn(e)} style={{ display: "grid", gap: 10, maxWidth: 360 }}>
            <label htmlFor="admin-email">Email</label>
            <input id="admin-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" required />
            <label htmlFor="admin-password">Password</label>
            <input id="admin-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required />
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn btn-primary btn-sm" disabled={running} type="submit">{running ? "Signing in…" : "Sign in"}</button>
              <button className="btn btn-outline btn-sm" disabled={running} type="button"
                onClick={() => void loadOverview().catch((e: unknown) => showToast(e instanceof Error ? e.message : "Unable to load admin data."))}>
                Use existing session
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ── Not loaded yet ── */}
      {!overview && <div className="form-note">Sign in to view current registrations and allocations.</div>}

      {/* ── Tabs ── */}
      {overview && (
        <>
          <nav className="nav admin-tabs" aria-label="Admin sections" style={{ marginBottom: 20 }}>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                className={`admin-tab${activeTab === tab.id ? " active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
                aria-current={activeTab === tab.id ? "page" : undefined}
              >
                {tab.label}
                {tab.id === "mentors"    && <span className="tab-count">{overview.mentors.length}</span>}
                {tab.id === "mentees"    && <span className="tab-count">{overview.mentees.length}</span>}
                {tab.id === "allocation" && <span className="tab-count">{overview.allocations.length}</span>}
                {tab.id === "logs"       && <span className="tab-count">{overview.logs.length}</span>}
              </button>
            ))}
          </nav>

          {activeTab === "overview"   && <OverviewTab overview={overview} />}
          {activeTab === "mentors"    && (
            <MentorsTab
              overview={overview}
              onAdd={() => { setEditingMentor(null); setMentorModalOpen(true); }}
              onEdit={(m) => { setEditingMentor(m as MentorRecord); setMentorModalOpen(true); }}
              onDelete={(id) => setDeleteMentorId(id)}
            />
          )}
          {activeTab === "mentees"    && <MenteesTab overview={overview} />}
          {activeTab === "allocation" && (
            <AllocationTab
              overview={overview}
              running={running}
              onRun={runAllocation}
              onReset={() => setModalOpen(true)}
            />
          )}
          {activeTab === "logs"       && <LogsTab overview={overview} />}
        </>
      )}

      {/* ── Modals ── */}
      <ResetModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onConfirm={resetAllocation} />
      <ResetModal
        isOpen={!!deleteMentorId}
        onClose={() => setDeleteMentorId(null)}
        onConfirm={deleteMentor}
        title="Delete mentor?"
        message="This permanently removes the mentor profile. Mentors with assigned mentees cannot be deleted."
        confirmLabel="Delete mentor"
      />
      <MentorFormModal
        open={mentorModalOpen}
        mentor={editingMentor}
        onClose={() => { setMentorModalOpen(false); setEditingMentor(null); }}
        onSaved={handleMentorSaved}
      />
    </div>
  );
}
