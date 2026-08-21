"use client";

import { useState } from "react";
import { useToast } from "../ToastProvider";
import { Pill } from "../ui/Pill";
import { LifecycleStepper } from "../ui/LifecycleStepper";
import { ResetModal } from "../ui/ResetModal";
import type { LifecycleStep } from "../ui/LifecycleStepper";

const LIFECYCLE_STEPS: LifecycleStep[] = [
  { label: "DRAFT",      status: "done" },
  { label: "OPEN",       status: "done" },
  { label: "CLOSED",     status: "done" },
  { label: "ALLOCATING", status: "done" },
  { label: "ALLOCATED",  status: "done" },
  { label: "PUBLISHED",  status: "current", number: 6 },
  { label: "COMPLETED",  status: "pending", number: 7 },
];

function StatCard({ value, label, accent = "default" }: { value: string; label: string; accent?: "indigo" | "amber" | "green" | "default" }) {
  return (
    <div className={`stat${accent !== "default" ? ` ${accent}` : ""}`}>
      <div className="v">{value}</div>
      <div className="k">{label}</div>
    </div>
  );
}

const ALLOCATION_ROWS = [
  { student: "Kavindi Wickramasinghe", time: "10:31:42.183", mentor: "Tharindu Jayasooriya", method: <Pill variant="amber">⭐ 1st Choice</Pill> },
  { student: "Sahan Dissanayake",      time: "10:31:48.902", mentor: "Tharindu Jayasooriya", method: <Pill variant="indigo">2nd Choice</Pill> },
  { student: "Nimesha Herath",         time: "10:32:05.114", mentor: "Ishara Gunawardena",   method: <Pill variant="amber">⭐ 1st Choice</Pill> },
  { student: "Ravindu Peris",          time: "10:32:11.560", mentor: "Dulani Rathnayake",    method: <Pill variant="amber">⭐ 1st Choice</Pill> },
  { student: "Chamodi Senanayake",     time: "10:33:27.031", mentor: "Kasun Weerasinghe",    method: <Pill variant="indigo">3rd Choice</Pill> },
  { student: "Isuru Bandara",          time: "10:34:02.775", mentor: "Sanduni Fernando",     method: <Pill variant="gray">Randomly Assigned</Pill> },
  { student: "Hiruni Madushani",       time: "10:34:40.218", mentor: "Pasindu Amarasinghe",  method: <Pill variant="indigo">2nd Choice</Pill> },
  { student: "Dineth Kulasekara",      time: "10:35:16.644", mentor: "Ishara Gunawardena",   method: <Pill variant="green">Admin Assigned</Pill> },
];

const UNMATCHED_ROWS = [
  { student: "Isuru Bandara",    prefs: "T. Jayasooriya → I. Gunawardena → D. Rathnayake" },
  { student: "Malsha Ekanayake", prefs: "D. Rathnayake → K. Weerasinghe → T. Jayasooriya" },
];

const MENTOR_LOADS = [
  { name: "Tharindu Jayasooriya", pct: 100, label: "2 / 2 · Full", color: undefined },
  { name: "Ishara Gunawardena",   pct: 100, label: "2 / 2 · Full", color: undefined },
  { name: "Dulani Rathnayake",    pct: 100, label: "2 / 2 · Full", color: undefined },
  { name: "Kasun Weerasinghe",    pct: 100, label: "2 / 2 · Full", color: undefined },
  { name: "Sanduni Fernando",     pct: 50,  label: "1 / 2",        color: "var(--amber)" },
  { name: "Pasindu Amarasinghe",  pct: 50,  label: "1 / 2",        color: "var(--amber)" },
  { name: "Nadeesha Silva",       pct: 0,   label: "0 / 2",        color: undefined },
];

const LOG_ENTRIES = [
  { time: "10:40:02", msg: "FCFS allocation completed · 70 assigned" },
  { time: "10:41:15", msg: "Random fallback run · 2 assigned" },
  { time: "10:45:30", msg: "Allocation finalized by admin" },
  { time: "11:00:00", msg: "Results published to participants" },
];

export function AdminScreen() {
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [running, setRunning] = useState(false);

  const runAllocation = async (mode: "preview" | "commit", includeFallback: boolean) => {
    if (!adminKey) return showToast("Enter the admin API key to continue.");
    setRunning(true);
    try {
      const response = await fetch("/api/admin/allocations", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ mode, includeFallback }),
      });
      const data: unknown = await response.json();
      if (!response.ok) throw new Error(typeof data === "object" && data && "error" in data && typeof data.error === "string" ? data.error : "Allocation request failed.");
      const result = data as { allocationCount: number; unmatchedCount: number };
      showToast(`${mode === "preview" ? "Preview" : "Allocation saved"}: ${result.allocationCount} assigned, ${result.unmatchedCount} unmatched.`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Allocation request failed.");
    } finally { setRunning(false); }
  };

  const resetAllocation = async () => {
    if (!adminKey) return showToast("Enter the admin API key to continue.");
    setRunning(true);
    try {
      const response = await fetch("/api/admin/allocations", { method: "DELETE", headers: { "x-admin-key": adminKey } });
      const data: unknown = await response.json();
      if (!response.ok) throw new Error(typeof data === "object" && data && "error" in data && typeof data.error === "string" ? data.error : "Unable to reset allocation.");
      setModalOpen(false);
      showToast("Allocation reset. All saved assignments were removed.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to reset allocation.");
    } finally { setRunning(false); }
  };

  return (
    <div className="container">
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 4 }}>
        <h2 className="section-title" style={{ margin: 0 }}>Mentor Session 2026 — Admin</h2>
        <Pill variant="green" dot>PUBLISHED</Pill>
      </div>
      <p className="section-sub">Senior Batch: 9th · Junior Batch: 10th · Session: 5 Sep 2026, Main Auditorium</p>

      <div className="card" style={{ padding: "16px 22px", marginBottom: 22 }}>
        <LifecycleStepper steps={LIFECYCLE_STEPS} />
      </div>

      <div className="stats-grid">
        <StatCard value="40"    label="Total Mentors"      accent="indigo" />
        <StatCard value="72"    label="Total Mentees"      accent="indigo" />
        <StatCard value="80"    label="Total Capacity" />
        <StatCard value="72"    label="Assigned"           accent="green" />
        <StatCard value="0"     label="Unassigned" />
        <StatCard value="8"     label="Available Capacity" />
        <StatCard value="51"    label="1st Choice ⭐"     accent="amber" />
        <StatCard value="14"    label="2nd Choice" />
        <StatCard value="5"     label="3rd Choice" />
        <StatCard value="2"     label="Random Fallback" />
        <StatCard value="0"     label="Admin Assigned" />
        <StatCard value="97.2%" label="Top-3 Satisfaction" accent="green" />
      </div>

      <div className="card" style={{ marginBottom: 22 }}>
        <h3 className="card-title">
          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="var(--indigo-light)" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
          </svg>
          Allocation Controls
        </h3>
        <label htmlFor="admin-api-key">Admin API key</label>
        <input id="admin-api-key" type="password" value={adminKey} onChange={(event) => setAdminKey(event.target.value)} placeholder="Enter ADMIN_API_KEY" style={{ maxWidth: 360, marginBottom: 14 }} />
        <div className="admin-controls">
          <button className="btn btn-primary btn-sm" disabled={running} onClick={() => runAllocation("commit", false)}>
            <svg className="icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 4l14 8-14 8z" /></svg>
            Run FCFS Allocation
          </button>
          <button className="btn btn-amber btn-sm" disabled={running} onClick={() => runAllocation("commit", true)}>
            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
            </svg>
            Run Random Fallback
          </button>
          <button className="btn btn-outline btn-sm" disabled={running} onClick={() => runAllocation("preview", false)}>Preview Allocation</button>
          <button className="btn btn-outline btn-sm" disabled={running} onClick={() => runAllocation("commit", true)}>
            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            Finalize Allocation
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => showToast("Manual assignment editor opened (mock).")}>Manual Assign</button>
          <button className="btn btn-danger btn-sm" onClick={() => setModalOpen(true)}>
            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            </svg>
            Reset Allocation
          </button>
        </div>
      </div>

      <div className="dash-grid">
        <div>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 8 }}>
              <h3 className="card-title" style={{ margin: 0 }}>
                <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="var(--indigo-light)" strokeWidth="2" aria-hidden="true">
                  <path d="M3 5h18M3 12h18M3 19h18" />
                </svg>
                Allocation Preview
              </h3>
              <Pill variant="gray">Showing 8 of 72</Pill>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead><tr><th>Student</th><th>Submitted</th><th>Mentor</th><th>Method</th></tr></thead>
                <tbody>
                  {ALLOCATION_ROWS.map((row) => (
                    <tr key={row.student}>
                      <td>{row.student}</td>
                      <td className="muted">{row.time}</td>
                      <td>{row.mentor}</td>
                      <td>{row.method}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card" style={{ marginTop: 20 }}>
            <h3 className="card-title">
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2" aria-hidden="true">
                <path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
                <path d="M12 9v4M12 17h.01" />
              </svg>
              Unmatched Pool
            </h3>
            <p className="muted" style={{ fontSize: 13.5, marginBottom: 12 }}>
              Mentees whose 3 preferred mentors were full after FCFS allocation. Resolved via random fallback — <b>0 currently unassigned</b>.
            </p>
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead><tr><th>Student</th><th>Preferences (all full)</th><th>Status</th></tr></thead>
                <tbody>
                  {UNMATCHED_ROWS.map((row) => (
                    <tr key={row.student}>
                      <td>{row.student}</td>
                      <td className="muted">{row.prefs}</td>
                      <td><Pill variant="gray">Randomly Assigned</Pill></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div>
          <div className="card">
            <h3 className="card-title">
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="var(--indigo-light)" strokeWidth="2" aria-hidden="true">
                <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" />
              </svg>
              Mentor Load
            </h3>
            {MENTOR_LOADS.map((m) => (
              <div key={m.name} className="load-row">
                <span className="name">{m.name}</span>
                <div className="bar"><span style={{ width: `${m.pct}%`, background: m.color ?? undefined }} /></div>
                <span className="count">{m.label}</span>
              </div>
            ))}
            <p className="hint" style={{ marginTop: 10 }}>
              Showing 7 of 40 mentors ·{" "}
              <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--indigo-light)", font: "inherit", fontSize: 12, padding: 0 }}
                onClick={() => showToast("Full mentor load report (mock)")}>
                View all
              </button>
            </p>
          </div>

          <div className="card" style={{ marginTop: 20 }}>
            <h3 className="card-title">
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="var(--indigo-light)" strokeWidth="2" aria-hidden="true">
                <path d="M12 3v12M7 10l5 5 5-5M4 21h16" />
              </svg>
              Export Data
            </h3>
            <p className="muted" style={{ fontSize: 13, marginBottom: 14 }}>Export mentor lists, mentee lists, assignments, preference data, unmatched participants and feedback reports.</p>
            <div className="admin-controls">
              <button className="btn btn-ghost btn-sm" onClick={() => showToast("Exporting CSV… (mock)")}>⬇ CSV</button>
              <button className="btn btn-ghost btn-sm" onClick={() => showToast("Exporting Excel… (mock)")}>⬇ Excel</button>
              <button className="btn btn-ghost btn-sm" onClick={() => showToast("Exporting PDF… (mock)")}>⬇ PDF</button>
            </div>
          </div>

          <div className="card" style={{ marginTop: 20 }}>
            <h3 className="card-title">
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="var(--indigo-light)" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
              </svg>
              Allocation Log
            </h3>
            {LOG_ENTRIES.map((e) => (
              <div key={e.time} className="load-row" style={{ fontSize: 12.5 }}>
                <span style={{ flex: 1 }}><b>{e.time}</b> — {e.msg}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ResetModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={resetAllocation}
      />
    </div>
  );
}
