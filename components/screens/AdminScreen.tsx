"use client";

import { FormEvent, useState } from "react";
import { useToast } from "../ToastProvider";
import { Pill } from "../ui/Pill";
import { ResetModal } from "../ui/ResetModal";
import { MentorFormModal, type MentorRecord } from "../admin/MentorFormModal";
import { AllocationCinematic } from "../ui/AllocationCinematic";

type Overview = {
  session: {
    id: string; title: string; status: string; registration_open: boolean;
    mentor_reg_open: boolean; mentee_reg_open: boolean; prefs_open: boolean;
    event_starts_at: string | null; venue: string | null;
  };
  stats: Record<"totalMentors" | "pendingApprovals" | "totalMentees" | "submittedPreferences" | "totalCapacity" | "assigned" | "unassigned" | "availableCapacity" | "firstChoice" | "secondChoice" | "thirdChoice" | "fallback" | "manual" | "preferenceSatisfaction", number>;
  allocations: { mentee: string; mentor: string; submittedAt: string | null; method: string; matchedPriority: number | null }[];
  unmatched: { mentee: string; preferences: string[] }[];
  mentorLoads: { name: string; assigned: number; capacity: number }[];
  mentors: { id: string; full_name: string; student_id: string; email: string; phone: string; batch: string; communication_method: string; profile_photo_url: string | null; capacity: number; is_approved: boolean }[];
  mentees: { id: string; full_name: string; student_id: string; email: string; phone: string; batch: string; preference_submitted_at: string | null; assignedMentor: string | null; allocationMethod: string | null; matchedPriority: number | null }[];
  logs: { id: number; action: string; detail: string | null; created_at: string }[];
};

type Tab = "overview" | "controls" | "lifecycle" | "mentors" | "approvals" | "mentees" | "allocation" | "logs" | "data" | "display";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview",   label: "Overview"   },
  { id: "controls",   label: "Controls"   },
  { id: "lifecycle",  label: "Lifecycle"  },
  { id: "mentors",    label: "Mentors"    },
  { id: "approvals",  label: "Approvals"  },
  { id: "mentees",    label: "Mentees"    },
  { id: "allocation", label: "Allocation" },
  { id: "logs",       label: "Logs"       },
  { id: "data",       label: "Data"       },
  { id: "display",    label: "📺 Display"  },
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

// ─── Lifecycle stepper ───────────────────────────────────────────────────────

type Step = {
  label: string;
  status: string;
  registrationOpen: boolean;
  description: string;
};

const LIFECYCLE_STEPS: Step[] = [
  { label: "Create Session",      status: "draft",        registrationOpen: false, description: "Session created, not yet visible to participants." },
  { label: "Configure Batches",   status: "draft",        registrationOpen: false, description: "Add mentors and set capacities before opening registration." },
  { label: "Open Registration",   status: "registration", registrationOpen: true,  description: "Mentees can register. Mentor list is visible." },
  { label: "Collect Preferences", status: "registration", registrationOpen: true,  description: "Mentees select their top 3 mentor preferences." },
  { label: "Allocation",          status: "allocation",   registrationOpen: false, description: "Run FCFS allocation and random fallback. Registration is now closed." },
  { label: "Publish Results",     status: "published",    registrationOpen: false, description: "Mentees can now see their assigned mentor on the dashboard." },
  { label: "Session & Feedback",  status: "closed",       registrationOpen: false, description: "Session complete. Collect feedback from mentors and mentees." },
];

function getActiveStep(status: string, registrationOpen: boolean): number {
  if (status === "closed")      return 6;
  if (status === "published")   return 5;
  if (status === "allocation")  return 4;
  if (status === "registration" && registrationOpen) return 3;
  if (status === "draft")       return 1;
  return 0;
}

function LifecycleTab({
  session,
  onAdvance,
  advancing,
}: {
  session: Overview["session"];
  onAdvance: (step: Step) => void;
  advancing: boolean;
}) {
  const [showManual, setShowManual] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | "">("");

  const activeIdx = getActiveStep(session.status, session.registration_open);
  const nextStep  = LIFECYCLE_STEPS[activeIdx + 1] ?? null;

  const handleManualSet = () => {
    if (selectedIdx === "") return;
    onAdvance(LIFECYCLE_STEPS[selectedIdx as number]);
    setShowManual(false);
    setSelectedIdx("");
  };

  // Status colour helpers
  const statusVariants: Record<string, { bg: string; color: string; border: string }> = {
    draft:        { bg: "var(--gray-100)",   color: "var(--gray-700)",  border: "var(--gray-200)"  },
    registration: { bg: "var(--indigo-soft)", color: "var(--indigo)",   border: "#c7d2fe"           },
    allocation:   { bg: "var(--amber-soft)",  color: "#92400e",         border: "#fde68a"           },
    published:    { bg: "var(--green-soft)",  color: "var(--green)",    border: "#a7f3d0"           },
    closed:       { bg: "var(--gray-100)",    color: "var(--gray-500)", border: "var(--gray-200)"   },
  };
  const sv = statusVariants[session.status] ?? statusVariants.draft;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── Current status banner ── */}
      <div className="card" style={{ borderLeft: `4px solid ${sv.border}`, padding: "20px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.7px", color: "var(--gray-400)", marginBottom: 4 }}>
              Current status
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: sv.bg, color: sv.color,
                border: `1.5px solid ${sv.border}`,
                borderRadius: 8, padding: "5px 13px",
                fontSize: 13, fontWeight: 700,
              }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: sv.color, display: "inline-block" }} />
                {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
              </span>
              {session.registration_open && (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  background: "var(--green-soft)", color: "var(--green)",
                  border: "1.5px solid #a7f3d0",
                  borderRadius: 8, padding: "5px 12px",
                  fontSize: 12, fontWeight: 700,
                }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--green)" }} />
                  Registration open
                </span>
              )}
            </div>
            <p style={{ fontSize: 13, color: "var(--gray-500)", marginTop: 8 }}>
              {LIFECYCLE_STEPS[activeIdx]?.description}
            </p>
          </div>

          {/* Advance / manual controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {showManual ? (
              <>
                <select
                  className="input"
                  value={selectedIdx}
                  onChange={e => setSelectedIdx(e.target.value === "" ? "" : Number(e.target.value))}
                  style={{ fontSize: 13, padding: "7px 11px", borderRadius: 9, minWidth: 200 }}
                  aria-label="Select lifecycle step"
                >
                  <option value="">— pick a step —</option>
                  {LIFECYCLE_STEPS.map((step, i) => (
                    <option key={i} value={i} disabled={i === activeIdx}>
                      {i + 1}. {step.label}{i === activeIdx ? " ← current" : ""}
                    </option>
                  ))}
                </select>
                <button className="btn btn-primary btn-sm" disabled={advancing || selectedIdx === ""} onClick={handleManualSet}>
                  {advancing ? "Updating…" : "Apply"}
                </button>
                <button className="btn btn-ghost btn-sm" disabled={advancing} onClick={() => { setShowManual(false); setSelectedIdx(""); }}>
                  Cancel
                </button>
              </>
            ) : (
              <>
                {nextStep && (
                  <button className="btn btn-primary btn-sm" disabled={advancing} onClick={() => onAdvance(nextStep)}>
                    {advancing ? "Updating…" : `Advance → ${nextStep.label}`}
                  </button>
                )}
                <button className="btn btn-ghost btn-sm" disabled={advancing} onClick={() => setShowManual(true)}>
                  Set Manually
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Step cards ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {LIFECYCLE_STEPS.map((step, i) => {
          const done    = i < activeIdx;
          const current = i === activeIdx;
          const pending = i > activeIdx;

          let nodeColor   = "var(--gray-200)";
          let nodeBg      = "var(--gray-100)";
          let nodeText    = "var(--gray-400)";
          let cardBorder  = "var(--gray-200)";
          let cardBg      = "#fff";
          let labelColor  = "var(--gray-500)";

          if (done) {
            nodeColor = "var(--green)"; nodeBg = "var(--green)"; nodeText = "#fff";
            cardBorder = "#a7f3d0";    cardBg  = "var(--green-soft)";
            labelColor = "var(--gray-700)";
          } else if (current) {
            nodeColor = "var(--indigo-light)"; nodeBg = "var(--indigo-light)"; nodeText = "#fff";
            cardBorder = "var(--indigo-light)"; cardBg = "var(--indigo-soft)";
            labelColor = "var(--indigo)";
          }

          return (
            <div
              key={i}
              style={{
                display: "flex", alignItems: "center", gap: 16,
                background: cardBg,
                border: `1.5px solid ${cardBorder}`,
                borderRadius: 12,
                padding: "14px 18px",
                opacity: pending ? 0.55 : 1,
                transition: "opacity 0.15s",
              }}
            >
              {/* Node */}
              <div style={{
                width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                background: nodeBg, border: `2px solid ${nodeColor}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: current ? `0 0 0 4px var(--indigo-soft)` : undefined,
              }}>
                {done ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={nodeText} strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <span style={{ fontSize: 12, fontWeight: 800, color: current ? "#fff" : nodeText }}>{i + 1}</span>
                )}
              </div>

              {/* Label + description */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: 14, color: labelColor, margin: 0 }}>{step.label}</p>
                <p style={{ fontSize: 12.5, color: "var(--gray-500)", margin: "2px 0 0", lineHeight: 1.4 }}>{step.description}</p>
              </div>

              {/* DB status badge */}
              <span style={{
                flexShrink: 0,
                fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px",
                color: current ? "var(--indigo)" : done ? "var(--green)" : "var(--gray-400)",
                background: current ? "rgba(79,70,229,0.1)" : done ? "rgba(5,150,105,0.1)" : "var(--gray-100)",
                padding: "3px 10px", borderRadius: 6,
                display: "none",
              }}>
                {step.status}
              </span>

              {/* Right label */}
              <span style={{
                flexShrink: 0, fontSize: 11.5, fontWeight: 700,
                color: current ? "var(--indigo)" : done ? "var(--green)" : "var(--gray-300)",
              }}>
                {done ? "Done" : current ? "Current" : ""}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tab panels ──────────────────────────────────────────────────────────────

function OverviewTab({ overview }: {
  overview: Overview;
}) {
  const s = overview.stats;
  return (
    <>
      <div className="stats-grid">
        <StatCard value={String(s.totalMentors)}           label="Approved mentors"              accent="indigo" />
        <StatCard value={String(s.pendingApprovals)}       label="Pending approvals"             accent={s.pendingApprovals > 0 ? "amber" : "default"} />
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

function MentorsTab({ overview, onAdd, onEdit, onDelete, onApprove, onReject }: {
  overview: Overview;
  onAdd: () => void;
  onEdit: (mentor: Overview["mentors"][number]) => void;
  onDelete: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const statusBadge = (approved: boolean) =>
    approved ? <Pill variant="green">Approved</Pill> : <Pill variant="amber">Pending</Pill>;

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
        <h3 className="card-title" style={{ margin: 0 }}>All Mentors</h3>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Pill variant="indigo">{overview.mentors.length} total</Pill>
          <Pill variant="green">{overview.mentors.filter(m => m.is_approved).length} approved</Pill>
          {overview.mentors.filter(m => !m.is_approved).length > 0 &&
            <Pill variant="amber">{overview.mentors.filter(m => !m.is_approved).length} pending</Pill>}
          <button className="btn btn-primary btn-sm" onClick={onAdd}>+ Add mentor</button>
        </div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr><th>Mentor</th><th>Contact</th><th>Batch</th><th>Cap.</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {overview.mentors.length ? overview.mentors.map((m) => (
              <tr key={m.id}>
                <td><b>{m.full_name}</b><br /><span className="muted">{m.student_id}</span></td>
                <td style={{ fontSize: 13 }}>{m.email}<br /><span className="muted">{m.phone} · {m.communication_method}</span></td>
                <td>{m.batch}</td>
                <td>{m.capacity}</td>
                <td>{statusBadge(m.is_approved ?? true)}</td>
                <td>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {!m.is_approved &&
                      <button className="btn btn-sm" style={{ background: "var(--green)", color: "#fff" }} onClick={() => onApprove(m.id)}>✓ Approve</button>}
                    {m.is_approved &&
                      <button className="btn btn-outline btn-sm" onClick={() => onReject(m.id)}>↩ Set pending</button>}
                    <button className="btn btn-outline btn-sm" onClick={() => onEdit(m)}>Edit</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => onDelete(m.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            )) : <tr><td colSpan={6} className="muted">No mentors added yet.</td></tr>}
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
            <tr><th>Mentee</th><th>Contact</th><th>Batch</th><th>Preferences</th><th>Assigned mentor</th></tr>
          </thead>
          <tbody>
            {overview.mentees.length ? overview.mentees.map((m) => (
              <tr key={m.id}>
                <td><b>{m.full_name}</b><br /><span className="muted">{m.student_id}</span></td>
                <td>{m.email}<br /><span className="muted">{m.phone}</span></td>
                <td>{m.batch}</td>
                <td>{m.preference_submitted_at ? <Pill variant="green">Submitted</Pill> : <Pill variant="amber">Pending</Pill>}</td>
                <td>
                  {m.assignedMentor
                    ? <>{m.assignedMentor}<br />{methodPill(m.allocationMethod ?? "preference", m.matchedPriority)}</>
                    : <span className="muted">Unassigned</span>}
                </td>
              </tr>
            )) : <tr><td colSpan={5} className="muted">No mentees registered yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AllocationTab({ overview, running, onRun, onReset, onManualAssign, onRemoveAllocation }: {
  overview: Overview;
  running: boolean;
  onRun: (mode: "preview" | "commit", fallback: boolean) => void;
  onReset: () => void;
  onManualAssign: (menteeId: string, mentorId: string) => void;
  onRemoveAllocation: (menteeId: string) => void;
}) {
  const [manualMenteeId, setManualMenteeId] = useState("");
  const [manualMentorId, setManualMentorId] = useState("");

  const approvedMentors = overview.mentors.filter(m => m.is_approved);
  const allocatedMenteeIds = new Set(overview.allocations.map(a => {
    // match by name — find mentee id
    return overview.mentees.find(m => m.full_name === a.mentee)?.id;
  }).filter(Boolean));

  const handleManualAssign = () => {
    if (!manualMenteeId || !manualMentorId) return;
    onManualAssign(manualMenteeId, manualMentorId);
    setManualMenteeId("");
    setManualMentorId("");
  };

  return (
    <>
      {/* FCFS Controls */}
      <div className="card">
        <h3 className="card-title">Automatic Allocation (FCFS)</h3>
        <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
          Preview a first-come, first-served result before committing. Fallback fills remaining capacity for unmatched mentees.
        </p>
        <div className="admin-controls">
          <button className="btn btn-outline btn-sm" disabled={running} onClick={() => onRun("preview", false)}>Preview FCFS</button>
          <button className="btn btn-primary btn-sm" disabled={running} onClick={() => onRun("commit", false)}>Commit FCFS</button>
          <button className="btn btn-amber btn-sm" disabled={running} onClick={() => onRun("commit", true)}>Commit with Fallback</button>
          <button className="btn btn-danger btn-sm" disabled={running} onClick={onReset}>Reset All</button>
        </div>
      </div>

      {/* Manual assignment */}
      <div className="card" style={{ marginTop: 16 }}>
        <h3 className="card-title">Manual Assignment</h3>
        <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
          Directly assign any mentee to any approved mentor. Overwrites an existing allocation for that mentee.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, alignItems: "end" }}>
          <div>
            <label htmlFor="manual-mentee" style={{ fontSize: 12, fontWeight: 700, color: "var(--gray-500)", marginBottom: 5, display: "block" }}>Mentee</label>
            <select id="manual-mentee" value={manualMenteeId} onChange={e => setManualMenteeId(e.target.value)}>
              <option value="">— select mentee —</option>
              {overview.mentees.map(m => (
                <option key={m.id} value={m.id}>
                  {m.full_name}{m.assignedMentor ? ` (→ ${m.assignedMentor})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="manual-mentor" style={{ fontSize: 12, fontWeight: 700, color: "var(--gray-500)", marginBottom: 5, display: "block" }}>Mentor</label>
            <select id="manual-mentor" value={manualMentorId} onChange={e => setManualMentorId(e.target.value)}>
              <option value="">— select mentor —</option>
              {approvedMentors.map(m => {
                const load = overview.mentorLoads.find(l => l.name === m.full_name);
                const full = load ? load.assigned >= load.capacity : false;
                return (
                  <option key={m.id} value={m.id} disabled={full}>
                    {m.full_name} ({load ? `${load.assigned}/${load.capacity}` : `cap: ${m.capacity}`}){full ? " — Full" : ""}
                  </option>
                );
              })}
            </select>
          </div>
          <button
            className="btn btn-primary btn-sm"
            disabled={running || !manualMenteeId || !manualMentorId}
            onClick={handleManualAssign}
            style={{ alignSelf: "flex-end" }}
          >
            Assign
          </button>
        </div>

        {/* Quick unassign from results table */}
        {overview.allocations.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "var(--gray-500)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Current assignments — click × to remove
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {overview.allocations.map((row, i) => {
                const menteeId = overview.mentees.find(m => m.full_name === row.mentee)?.id;
                return (
                  <span
                    key={`${row.mentee}-${i}`}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      background: row.method === "manual" ? "var(--green-soft)" : "var(--gray-100)",
                      border: `1px solid ${row.method === "manual" ? "#a7f3d0" : "var(--gray-200)"}`,
                      borderRadius: 8, padding: "4px 8px 4px 10px", fontSize: 12.5, fontWeight: 600,
                    }}
                  >
                    {row.mentee} → {row.mentor}
                    {menteeId && (
                      <button
                        style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--gray-400)", fontSize: 13, lineHeight: 1, padding: 2 }}
                        aria-label={`Remove assignment for ${row.mentee}`}
                        disabled={running}
                        onClick={() => onRemoveAllocation(menteeId)}
                      >×</button>
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Allocation Results table */}
      <div className="card" style={{ marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 12, alignItems: "center" }}>
          <h3 className="card-title" style={{ margin: 0 }}>Allocation Results</h3>
          <Pill variant="gray">{overview.allocations.length} assignments</Pill>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead><tr><th>Student</th><th>Submitted</th><th>Mentor</th><th>Method</th><th></th></tr></thead>
            <tbody>
              {overview.allocations.length
                ? overview.allocations.map((row, i) => {
                    const menteeId = overview.mentees.find(m => m.full_name === row.mentee)?.id;
                    return (
                      <tr key={`${row.mentee}-${i}`}>
                        <td>{row.mentee}</td>
                        <td className="muted">{row.submittedAt ? new Date(row.submittedAt).toLocaleTimeString() : "-"}</td>
                        <td>{row.mentor}</td>
                        <td>{methodPill(row.method, row.matchedPriority)}</td>
                        <td>
                          {menteeId && (
                            <button className="btn btn-ghost btn-sm" disabled={running} onClick={() => onRemoveAllocation(menteeId)}>Remove</button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                : <tr><td colSpan={5} className="muted">No allocation has been saved yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unmatched Pool */}
      <div className="card" style={{ marginTop: 16 }}>
        <h3 className="card-title">Unmatched Pool <span style={{ fontWeight: 400, fontSize: 13, color: "var(--gray-500)" }}>— use manual assignment above to resolve</span></h3>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead><tr><th>Student</th><th>Preferences</th><th></th></tr></thead>
            <tbody>
              {overview.unmatched.length
                ? overview.unmatched.map((row, i) => {
                    const menteeId = overview.mentees.find(m => m.full_name === row.mentee)?.id;
                    return (
                      <tr key={`${row.mentee}-${i}`}>
                        <td>{row.mentee}</td>
                        <td className="muted">{row.preferences.join(" → ") || "No preferences"}</td>
                        <td>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => { if (menteeId) setManualMenteeId(menteeId); }}
                          >
                            Assign →
                          </button>
                        </td>
                      </tr>
                    );
                  })
                : <tr><td colSpan={3} className="muted">No unmatched mentees.</td></tr>}
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

// ─── Data tab ────────────────────────────────────────────────────────────────

function DataTab({
  overview,
  onBulkDelete,
}: {
  overview: Overview;
  onBulkDelete: (target: "mentors" | "mentees" | "preferences") => void;
}) {
  // CSV download helper — runs entirely in the browser from data already loaded
  const downloadCSV = (filename: string, rows: Record<string, unknown>[]) => {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const escape  = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv     = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
    const blob    = new Blob([csv], { type: "text/csv" });
    const url     = URL.createObjectURL(blob);
    const a       = document.createElement("a");
    a.href        = url;
    a.download    = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadMentors = () =>
    downloadCSV(`mentors-${overview.session.title}.csv`,
      overview.mentors.map((m) => ({
        full_name:            m.full_name,
        student_id:           m.student_id,
        email:                m.email,
        phone:                m.phone,
        batch:                m.batch,
        communication_method: m.communication_method,
        capacity:             m.capacity,
        is_approved:          m.is_approved,
      })),
    );

  const downloadMentees = () =>
    downloadCSV(`mentees-${overview.session.title}.csv`,
      overview.mentees.map((m) => ({
        full_name:                m.full_name,
        student_id:               m.student_id,
        email:                    m.email,
        phone:                    m.phone,
        batch:                    m.batch,
        preference_submitted_at:  m.preference_submitted_at ?? "",
      })),
    );

  const downloadAllocations = () =>
    downloadCSV(`allocations-${overview.session.title}.csv`,
      overview.allocations.map((a) => ({
        mentee:           a.mentee,
        mentor:           a.mentor,
        method:           a.method,
        matched_priority: a.matchedPriority ?? "",
        submitted_at:     a.submittedAt ?? "",
      })),
    );

  const [confirmTarget, setConfirmTarget] = useState<"mentors" | "mentees" | "preferences" | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Downloads */}
      <div className="card">
        <h3 className="card-title">Export Data</h3>
        <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
          Download a CSV snapshot of the current session data.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={downloadMentors}
            disabled={!overview.mentors.length}
          >
            ↓ Mentors ({overview.mentors.length})
          </button>
          <button
            className="btn btn-outline btn-sm"
            onClick={downloadMentees}
            disabled={!overview.mentees.length}
          >
            ↓ Mentees ({overview.mentees.length})
          </button>
          <button
            className="btn btn-outline btn-sm"
            onClick={downloadAllocations}
            disabled={!overview.allocations.length}
          >
            ↓ Allocations ({overview.allocations.length})
          </button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="card" style={{ border: "1px solid #fca5a5" }}>
        <h3 className="card-title" style={{ color: "var(--red, #dc2626)" }}>Danger Zone</h3>
        <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
          These actions are permanent and cannot be undone. Export your data first.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => setConfirmTarget("mentees")}
          >
            Remove all mentees
          </button>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => setConfirmTarget("mentors")}
          >
            Remove all mentors
          </button>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => setConfirmTarget("preferences")}
          >
            Clear all preferences
          </button>
        </div>
      </div>

      {/* Confirm modal */}
      <div
        className={`modal-backdrop${confirmTarget ? " open" : ""}`}
        role="dialog"
        aria-modal="true"
        onClick={() => setConfirmTarget(null)}
      >
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <h3 style={{ marginBottom: 8 }}>
            Remove all {confirmTarget}?
          </h3>
          <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
            {confirmTarget === "mentees"
              ? "This will permanently delete every mentee, their preferences, and their allocations for this session."
              : confirmTarget === "preferences"
              ? "This will permanently clear all submitted mentor preferences and reset preference_submitted_at for every mentee. Allocations are not affected."
              : "This will permanently delete every mentor for this session. All existing allocations must be reset first."}
          </p>
          <div className="actions">
            <button className="btn btn-ghost" onClick={() => setConfirmTarget(null)}>Cancel</button>
            <button
              className="btn btn-danger"
              onClick={() => {
                if (confirmTarget) { onBulkDelete(confirmTarget); setConfirmTarget(null); }
              }}
            >
              Yes, remove all {confirmTarget}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Display control tab ─────────────────────────────────────────────────────

function DisplayControlTab({ overview }: { overview: Overview }) {
  const [sending,    setSending]    = useState(false);
  const [customText, setCustomText] = useState("");
  const [customSub,  setCustomSub]  = useState("");
  const [lastScene,  setLastScene]  = useState("");
  const [mentorIdx,  setMentorIdx]  = useState(0);

  const push = async (scene: object) => {
    setSending(true);
    try {
      const res = await fetch("/api/display/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scene }),
      });
      if (res.ok) setLastScene((scene as { type: string }).type);
    } finally { setSending(false); }
  };

  // Build mentor-card scene from overview data
  const pushMentorCard = (idx: number) => {
    const mentor = overview.mentors[idx];
    if (!mentor) return;
    // Find mentees assigned to this mentor
    const mentees = overview.mentees
      .filter((m) => m.assignedMentor === mentor.full_name)
      .map((m) => ({ name: m.full_name, studentId: m.student_id }));

    void push({
      type: "mentor-card",
      mentor: {
        id:                  mentor.id,
        name:                mentor.full_name,
        studentId:           mentor.student_id ?? null,
        batch:               mentor.batch ?? null,
        photoUrl:            mentor.profile_photo_url ?? null,
        communicationMethod: mentor.communication_method,
      },
      mentees,
      index: idx,
      total: overview.mentors.length,
    });
  };

  const approvedMentors = overview.mentors.filter((m) => m.is_approved);
  const safeMentorIdx   = Math.min(mentorIdx, Math.max(0, approvedMentors.length - 1));

  const goTo = (idx: number) => {
    setMentorIdx(idx);
    const mentor = approvedMentors[idx];
    if (!mentor) return;
    const realIdx = overview.mentors.findIndex((m) => m.id === mentor.id);
    pushMentorCard(realIdx);
  };

  const s = overview.stats;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

      {/* Link to display */}
      <div className="card" style={{ borderLeft:"4px solid #6366f1" }}>
        <h3 className="card-title" style={{ margin:"0 0 8px" }}>📺 Presentation Display</h3>
        <p className="muted" style={{ fontSize:13, marginBottom:12 }}>
          Open this URL on the projector / second screen. Updates in real-time.
        </p>
        <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
          <a href="/display" target="_blank" rel="noopener noreferrer"
            style={{ display:"inline-flex", alignItems:"center", gap:6, background:"var(--indigo-soft)", color:"var(--indigo)", fontWeight:700, fontSize:13, padding:"8px 16px", borderRadius:9, textDecoration:"none" }}>
            /display ↗
          </a>
          {lastScene && <span className="muted" style={{ fontSize:12 }}>Active scene: <b>{lastScene}</b></span>}
        </div>
      </div>

      {/* Scene buttons */}
      <div className="card">
        <h3 className="card-title" style={{ marginBottom:16 }}>Scenes</h3>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          <button className="btn btn-outline btn-sm" disabled={sending}
            onClick={() => void push({ type: "idle" })}>
            🌌 Cover / Idle
          </button>
          <button className="btn btn-outline btn-sm" disabled={sending}
            onClick={() => void push({ type: "mentor-carousel" })}>
            🎠 Mentor Carousel
          </button>
          <button className="btn btn-outline btn-sm" disabled={sending}
            onClick={() => void push({ type: "live-registrations" })}>
            📊 Live Registrations
          </button>
          <button className="btn btn-outline btn-sm" disabled={sending}
            onClick={() => void push({ type: "thankyou" })}>
            🙏 Thank You
          </button>
          <button className="btn btn-primary btn-sm" disabled={sending}
            onClick={() => void push({ type: "allocation", count: s.assigned, total: s.totalMentees })}>
            ⚡ Allocation Running
          </button>
          <button className="btn btn-sm" disabled={sending}
            style={{ background:"var(--green)", color:"#fff" }}
            onClick={() => void push({ type: "results", assigned: s.assigned, unmatched: s.unassigned, satisfaction: s.preferenceSatisfaction })}>
            ✓ Show Results
          </button>
        </div>
      </div>

      {/* Carousel remote controls */}
      <div className="card" style={{ borderLeft:"4px solid #38bdf8" }}>
        <h3 className="card-title" style={{ marginBottom:4 }}>🎠 Carousel Controls</h3>
        <p className="muted" style={{ fontSize:13, marginBottom:14 }}>
          Live-control the Mentor Carousel on the display screen.
        </p>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
          {/* Prev */}
          <button className="btn btn-outline btn-sm" disabled={sending}
            title="Previous card"
            onClick={() => void push({ type: "mentor-carousel", control: "prev", seq: Date.now() })}>
            ← Prev
          </button>
          {/* Next */}
          <button className="btn btn-outline btn-sm" disabled={sending}
            title="Next card"
            onClick={() => void push({ type: "mentor-carousel", control: "next", seq: Date.now() })}>
            Next →
          </button>
          {/* Divider */}
          <div style={{ width:1, height:28, background:"var(--gray-200)", margin:"0 2px" }} />
          {/* Play */}
          <button className="btn btn-sm" disabled={sending}
            title="Resume autoplay"
            style={{ background:"var(--green)", color:"#fff" }}
            onClick={() => void push({ type: "mentor-carousel", control: "play", seq: Date.now() })}>
            ▶ Play
          </button>
          {/* Pause */}
          <button className="btn btn-outline btn-sm" disabled={sending}
            title="Pause autoplay"
            onClick={() => void push({ type: "mentor-carousel", control: "pause", seq: Date.now() })}>
            ⏸ Pause
          </button>
          {/* Stop */}
          <button className="btn btn-outline btn-sm" disabled={sending}
            title="Stop and reset to first card"
            style={{ color:"var(--red, #ef4444)", borderColor:"var(--red, #ef4444)" }}
            onClick={() => void push({ type: "mentor-carousel", control: "stop", seq: Date.now() })}>
            ⏹ Stop
          </button>
        </div>
      </div>

      {/* Mentor card navigator */}
      <div className="card">
        <h3 className="card-title" style={{ marginBottom:4 }}>Mentor Cards</h3>
        <p className="muted" style={{ fontSize:13, marginBottom:16 }}>
          Show one mentor and their assigned mentees on the display.
        </p>
        {approvedMentors.length === 0 ? (
          <p className="muted">No approved mentors yet.</p>
        ) : (
          <>
            {/* Current mentor preview */}
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16, padding:"12px 16px", background:"var(--gray-50)", borderRadius:12, border:"1px solid var(--gray-200)" }}>
              {approvedMentors[safeMentorIdx]?.profile_photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={approvedMentors[safeMentorIdx].profile_photo_url!} alt=""
                  style={{ width:44, height:44, borderRadius:"50%", objectFit:"cover", objectPosition:"center 20%", flexShrink:0 }} />
              ) : (
                <div style={{ width:44, height:44, borderRadius:"50%", background:"var(--indigo-soft)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, color:"var(--indigo)", flexShrink:0, fontSize:14 }}>
                  {approvedMentors[safeMentorIdx]?.full_name.split(" ").map(w => w[0]).slice(0,2).join("")}
                </div>
              )}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:14, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {approvedMentors[safeMentorIdx]?.full_name}
                </div>
                <div className="muted" style={{ fontSize:12 }}>
                  {safeMentorIdx + 1} of {approvedMentors.length} · {
                    overview.mentees.filter(m => m.assignedMentor === approvedMentors[safeMentorIdx]?.full_name).length
                  } mentees
                </div>
              </div>
            </div>

            {/* Controls */}
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
              <button className="btn btn-outline btn-sm" disabled={sending || safeMentorIdx === 0}
                onClick={() => goTo(safeMentorIdx - 1)}>
                ← Prev
              </button>
              <button className="btn btn-primary btn-sm" disabled={sending}
                onClick={() => goTo(safeMentorIdx)}>
                📺 Show on Display
              </button>
              <button className="btn btn-outline btn-sm" disabled={sending || safeMentorIdx >= approvedMentors.length - 1}
                onClick={() => goTo(safeMentorIdx + 1)}>
                Next →
              </button>
              {/* Jump dropdown */}
              <select
                style={{ fontSize:12, padding:"5px 10px", borderRadius:8, border:"1px solid var(--gray-200)", marginLeft:"auto" }}
                value={safeMentorIdx}
                onChange={(e) => goTo(Number(e.target.value))}
              >
                {approvedMentors.map((m, i) => (
                  <option key={m.id} value={i}>{i + 1}. {m.full_name}</option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

      {/* Custom message */}
      <div className="card">
        <h3 className="card-title" style={{ marginBottom:12 }}>Custom Message</h3>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <input type="text" placeholder="Main text (e.g. Welcome!)" value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            style={{ background:"var(--gray-50)", border:"1.5px solid var(--gray-200)", borderRadius:10, height:42, padding:"0 14px", fontSize:14 }} />
          <input type="text" placeholder="Sub-text (optional)" value={customSub}
            onChange={(e) => setCustomSub(e.target.value)}
            style={{ background:"var(--gray-50)", border:"1.5px solid var(--gray-200)", borderRadius:10, height:42, padding:"0 14px", fontSize:14 }} />
          <button className="btn btn-outline btn-sm" disabled={sending || !customText.trim()}
            onClick={() => void push({ type: "custom", text: customText.trim(), sub: customSub.trim() || undefined })}>
            Push message →
          </button>
        </div>
      </div>

    </div>
  );
}

// ─── Controls tab ────────────────────────────────────────────────────────────

type ControlFlag = "mentorRegOpen" | "menteeRegOpen" | "prefsOpen";

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  saving: boolean;
  onChange: (val: boolean) => void;
  accent?: "indigo" | "green" | "amber";
}

function ToggleRow({ label, description, checked, saving, onChange, accent = "indigo" }: ToggleRowProps) {
  const accentColor =
    accent === "green" ? "var(--green)" :
    accent === "amber" ? "var(--amber)" :
    "var(--indigo-light)";

  return (
    <div className="ctrl-row">
      <div className="ctrl-row-text">
        <p className="ctrl-row-label">{label}</p>
        <p className="ctrl-row-desc">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={`${checked ? "Disable" : "Enable"} ${label}`}
        disabled={saving}
        className={`ctrl-toggle${checked ? " ctrl-toggle-on" : ""}`}
        style={{ "--toggle-color": accentColor } as React.CSSProperties}
        onClick={() => onChange(!checked)}
      >
        <span className="ctrl-toggle-thumb" />
      </button>
    </div>
  );
}

function ControlsTab({
  session,
  onToggle,
  saving,
}: {
  session: Overview["session"];
  onToggle: (flag: ControlFlag, value: boolean) => void;
  saving: boolean;
}) {
  // Graceful fallback if columns don't exist yet
  const mentorRegOpen = session.mentor_reg_open ?? session.registration_open;
  const menteeRegOpen = session.mentee_reg_open ?? session.registration_open;
  const prefsOpen     = session.prefs_open      ?? session.registration_open;

  const allOn  = mentorRegOpen && menteeRegOpen && prefsOpen;
  const allOff = !mentorRegOpen && !menteeRegOpen && !prefsOpen;

  const toggleAll = (val: boolean) => {
    onToggle("mentorRegOpen", val);
    onToggle("menteeRegOpen", val);
    onToggle("prefsOpen", val);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Quick actions */}
      <div className="card ctrl-quick-card">
        <div className="ctrl-quick-header">
          <div>
            <h3 className="card-title" style={{ margin: 0 }}>Quick Actions</h3>
            <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>Toggle all registration windows at once.</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn btn-sm"
              style={{ background: "var(--green)", color: "#fff" }}
              disabled={saving || allOn}
              onClick={() => toggleAll(true)}
            >
              Open All
            </button>
            <button
              className="btn btn-danger btn-sm"
              disabled={saving || allOff}
              onClick={() => toggleAll(false)}
            >
              Close All
            </button>
          </div>
        </div>

        {/* Status summary pills */}
        <div className="ctrl-status-bar">
          <span className={`ctrl-status-pill ${mentorRegOpen ? "ctrl-pill-on" : "ctrl-pill-off"}`}>
            <span className="ctrl-status-dot" />
            Mentor Reg
          </span>
          <span className={`ctrl-status-pill ${menteeRegOpen ? "ctrl-pill-on" : "ctrl-pill-off"}`}>
            <span className="ctrl-status-dot" />
            Mentee Reg
          </span>
          <span className={`ctrl-status-pill ${prefsOpen ? "ctrl-pill-on" : "ctrl-pill-off"}`}>
            <span className="ctrl-status-dot" />
            Preferences
          </span>
        </div>
      </div>

      {/* Individual toggles */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "18px 24px 14px", borderBottom: "1px solid var(--gray-100)" }}>
          <h3 className="card-title" style={{ margin: 0 }}>Registration Windows</h3>
          <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
            Control which registration flows are currently open. Changes take effect immediately.
          </p>
        </div>

        <ToggleRow
          label="Mentor Registration"
          description="Allow senior students to submit a mentor registration form. New applications will require admin approval."
          checked={mentorRegOpen}
          saving={saving}
          accent="indigo"
          onChange={(v) => onToggle("mentorRegOpen", v)}
        />

        <ToggleRow
          label="Mentee Registration"
          description="Allow junior students to register as mentees for this session."
          checked={menteeRegOpen}
          saving={saving}
          accent="green"
          onChange={(v) => onToggle("menteeRegOpen", v)}
        />

        <ToggleRow
          label="Preference Selection"
          description="Allow registered mentees to browse mentors and submit their top 3 preferences."
          checked={prefsOpen}
          saving={saving}
          accent="amber"
          onChange={(v) => onToggle("prefsOpen", v)}
        />
      </div>

      {/* Info note */}
      <div className="form-note" style={{ alignItems: "flex-start" }}>
        <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flex: "none", marginTop: 2 }} aria-hidden="true">
          <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
        </svg>
        <span style={{ fontSize: 13 }}>
          These switches are independent of the session lifecycle status.
          You can open or close any window at any time regardless of the current phase.
          The <b>Lifecycle</b> tab controls the overall session status (draft → registration → allocation → published → closed).
        </span>
      </div>
    </div>
  );
}

// ─── Approvals tab ───────────────────────────────────────────────────────────

function ApprovalsTab({
  overview,
  onApprove,
  onReject,
}: {
  overview: Overview;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const pending = overview.mentors.filter((m) => !m.is_approved);

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <h3 className="card-title" style={{ margin: 0 }}>Pending Approvals</h3>
        <Pill variant={pending.length > 0 ? "amber" : "gray"}>{pending.length} pending</Pill>
      </div>

      {pending.length === 0 ? (
        <p className="muted" style={{ fontSize: 13 }}>No pending mentor registrations. All caught up!</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Mentor</th>
                <th>Contact</th>
                <th>Batch</th>
                <th>Capacity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((m) => (
                <tr key={m.id}>
                  <td>
                    <b>{m.full_name}</b>
                    <br />
                    <span className="muted">{m.student_id}</span>
                  </td>
                  <td>
                    {m.email}
                    <br />
                    <span className="muted">{m.phone} · {m.communication_method}</span>
                  </td>
                  <td>{m.batch}</td>
                  <td>{m.capacity}</td>
                  <td>
                    <button
                      className="btn btn-sm"
                      style={{ background: "var(--green)", color: "#fff" }}
                      onClick={() => onApprove(m.id)}
                    >
                      ✓ Approve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
  const [advancing, setAdvancing] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [overview, setOverview] = useState<Overview>();
  const [cinematic, setCinematic] = useState<{ total: number } | null>(null);

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

  const advanceLifecycle = async (step: Step) => {
    setAdvancing(true);
    try {
      const res = await fetch("/api/admin/session-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: step.status, registrationOpen: step.registrationOpen }),
      });
      const data: unknown = await res.json();
      if (!res.ok) throw new Error(typeof data === "object" && data && "error" in data && typeof data.error === "string" ? data.error : "Unable to update session.");
      showToast(`Session advanced to: ${step.label}`);
      await loadOverview();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to update session status.");
    } finally {
      setAdvancing(false);
    }
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
      if (mode === "commit") {
        // Show cinematic while overview reloads in the background
        setCinematic({ total: result.allocationCount });
        void loadOverview();
      } else {
        showToast(`Preview: ${result.allocationCount} assigned, ${result.unmatchedCount} unmatched.`);
      }
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
        : [...cur.mentors, { ...mentor, profile_photo_url: mentor.profile_photo_url ?? null, is_approved: true }].sort((a, b) => a.full_name.localeCompare(b.full_name));
      return { ...cur, mentors, stats: { ...cur.stats, totalMentors: mentors.length } };
    });
    showToast(editingMentor ? "Mentor updated." : "Mentor added.");
    setEditingMentor(null);
  };

  const toggleFlag = async (flag: ControlFlag, value: boolean) => {
    // Optimistic update
    setOverview((cur) => cur ? { ...cur, session: { ...cur.session, [flag === "mentorRegOpen" ? "mentor_reg_open" : flag === "menteeRegOpen" ? "mentee_reg_open" : "prefs_open"]: value } } : cur);
    try {
      const res = await fetch("/api/admin/session-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [flag]: value }),
      });
      const data: unknown = await res.json();
      if (!res.ok) throw new Error(typeof data === "object" && data && "error" in data && typeof data.error === "string" ? data.error : "Unable to update setting.");
      showToast(`${flag === "mentorRegOpen" ? "Mentor registration" : flag === "menteeRegOpen" ? "Mentee registration" : "Preference selection"} ${value ? "opened" : "closed"}.`);
    } catch (error) {
      // Revert optimistic update on failure
      setOverview((cur) => cur ? { ...cur, session: { ...cur.session, [flag === "mentorRegOpen" ? "mentor_reg_open" : flag === "menteeRegOpen" ? "mentee_reg_open" : "prefs_open"]: !value } } : cur);
      showToast(error instanceof Error ? error.message : "Unable to update setting.");
    }
  };

  const setApprovalStatus = async (id: string, approved: boolean) => {
    try {
      const res = await fetch(`/api/admin/mentors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved: approved }),
      });
      const data: unknown = await res.json();
      if (!res.ok) throw new Error(typeof data === "object" && data && "error" in data && typeof data.error === "string" ? data.error : "Unable to update approval.");
      const updated = (data as { mentor: { id: string; is_approved: boolean } }).mentor;
      setOverview((cur) => {
        if (!cur) return cur;
        const mentors = cur.mentors.map((m) =>
          m.id === id ? { ...m, is_approved: updated.is_approved } : m
        );
        const approvedCount = mentors.filter((m) => m.is_approved).length;
        const pendingCount  = mentors.filter((m) => !m.is_approved).length;
        return { ...cur, mentors, stats: { ...cur.stats, totalMentors: approvedCount, pendingApprovals: pendingCount } };
      });
      showToast(approved ? "Mentor approved." : "Mentor set back to pending.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to update approval.");
    }
  };

  const manualAssign = async (menteeId: string, mentorId: string) => {
    setRunning(true);
    try {
      const res = await fetch("/api/admin/allocations/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menteeId, mentorId }),
      });
      const data: unknown = await res.json();
      if (!res.ok) throw new Error(typeof data === "object" && data && "error" in data && typeof data.error === "string" ? data.error : "Unable to assign.");
      const result = data as { mentee: string; mentor: string };
      showToast(`${result.mentee} assigned to ${result.mentor}.`);
      await loadOverview();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to assign.");
    } finally { setRunning(false); }
  };

  const removeAllocation = async (menteeId: string) => {
    setRunning(true);
    try {
      const res = await fetch(`/api/admin/allocations/manual?menteeId=${encodeURIComponent(menteeId)}`, { method: "DELETE" });
      const data: unknown = await res.json();
      if (!res.ok) throw new Error(typeof data === "object" && data && "error" in data && typeof data.error === "string" ? data.error : "Unable to remove allocation.");
      showToast("Allocation removed.");
      await loadOverview();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to remove allocation.");
    } finally { setRunning(false); }
  };

  const bulkDelete = async (target: "mentors" | "mentees" | "preferences") => {
    setRunning(true);
    try {
      const res = await fetch(`/api/admin/data?target=${target}`, { method: "DELETE" });
      const data: unknown = await res.json();
      if (!res.ok) throw new Error(typeof data === "object" && data && "error" in data && typeof data.error === "string" ? data.error : `Unable to remove ${target}.`);
      showToast(target === "preferences" ? "All preferences cleared." : `All ${target} removed.`);
      await loadOverview();
    } catch (error) {
      showToast(error instanceof Error ? error.message : `Unable to remove ${target}.`);
    } finally { setRunning(false); }
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
                {tab.id === "mentors"    && <span className="tab-count">{overview.mentors.filter(m => m.is_approved).length}</span>}
                {tab.id === "approvals"  && overview.stats.pendingApprovals > 0 && <span className="tab-count tab-count-amber">{overview.stats.pendingApprovals}</span>}
                {tab.id === "mentees"    && <span className="tab-count">{overview.mentees.length}</span>}
                {tab.id === "allocation" && <span className="tab-count">{overview.allocations.length}</span>}
                {tab.id === "logs"       && <span className="tab-count">{overview.logs.length}</span>}
              </button>
            ))}
          </nav>

          {activeTab === "overview"   && <OverviewTab overview={overview} />}
          {activeTab === "controls"   && (
            <ControlsTab
              session={overview.session}
              onToggle={(flag, value) => void toggleFlag(flag, value)}
              saving={running}
            />
          )}
          {activeTab === "lifecycle"  && <LifecycleTab session={overview.session} onAdvance={advanceLifecycle} advancing={advancing} />}
          {activeTab === "mentors"    && (
            <MentorsTab
              overview={overview}
              onAdd={() => { setEditingMentor(null); setMentorModalOpen(true); }}
              onEdit={(m) => { setEditingMentor(m as MentorRecord); setMentorModalOpen(true); }}
              onDelete={(id) => setDeleteMentorId(id)}
              onApprove={(id) => void setApprovalStatus(id, true)}
              onReject={(id) => void setApprovalStatus(id, false)}
            />
          )}
          {activeTab === "approvals"  && (
            <ApprovalsTab
              overview={overview}
              onApprove={(id) => void setApprovalStatus(id, true)}
              onReject={(id) => void setApprovalStatus(id, false)}
            />
          )}
          {activeTab === "mentees"    && <MenteesTab overview={overview} />}
          {activeTab === "allocation" && (
            <AllocationTab
              overview={overview}
              running={running}
              onRun={runAllocation}
              onReset={() => setModalOpen(true)}
              onManualAssign={(menteeId, mentorId) => void manualAssign(menteeId, mentorId)}
              onRemoveAllocation={(menteeId) => void removeAllocation(menteeId)}
            />
          )}
          {activeTab === "logs"       && <LogsTab overview={overview} />}
          {activeTab === "data"       && (
            <DataTab
              overview={overview}
              onBulkDelete={(target) => void bulkDelete(target)}
            />
          )}
          {activeTab === "display"    && <DisplayControlTab overview={overview} />}
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

      {/* ── Allocation cinematic overlay ── */}
      {cinematic && (
        <AllocationCinematic
          total={cinematic.total}
          onDone={() => {
            setCinematic(null);
            showToast(`Allocation saved: ${cinematic.total} assigned.`);
          }}
        />
      )}
    </div>
  );
}
