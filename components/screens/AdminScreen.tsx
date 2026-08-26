"use client";

import { type FormEvent, useMemo, useState } from "react";
import { useToast } from "../ToastProvider";
import { Pill } from "../ui/Pill";
import { ResetModal } from "../ui/ResetModal";
import { MentorFormModal, type MentorRecord } from "../admin/MentorFormModal";
import { MenteeFormModal, type MenteeRecord } from "../admin/MenteeFormModal";

type Overview = {
  session: { title: string; status: string; event_starts_at: string | null; venue: string | null };
  stats: Record<
    | "totalMentors"
    | "totalMentees"
    | "submittedPreferences"
    | "totalCapacity"
    | "assigned"
    | "unassigned"
    | "availableCapacity"
    | "firstChoice"
    | "secondChoice"
    | "thirdChoice"
    | "fallback"
    | "manual"
    | "preferenceSatisfaction",
    number
  >;
  allocations: { mentee: string; mentor: string; submittedAt: string | null; method: string; matchedPriority: number | null }[];
  unmatched: { mentee: string; preferences: string[] }[];
  mentorLoads: { name: string; assigned: number; capacity: number }[];
  mentors: {
    id: string;
    full_name: string;
    student_id: string;
    email: string;
    phone: string;
    batch: string;
    communication_method: string;
    academic_interests: string[];
    technical_interests: string[];
    profile_photo_url: string | null;
    capacity: number;
  }[];
  mentees: {
    id: string;
    full_name: string;
    student_id: string;
    email: string;
    phone: string;
    batch: string;
    academic_interests: string[];
    technical_interests: string[];
    guidance_needed: string | null;
    preference_submitted_at: string | null;
    assignedMentor: string | null;
    allocationMethod: string | null;
    matchedPriority: number | null;
  }[];
  logs: { id: number; action: string; detail: string | null; created_at: string }[];
};

type Mentor = Overview["mentors"][number];
type Mentee = Overview["mentees"][number];
type Tab = "overview" | "mentors" | "mentees" | "allocation" | "logs";

const TABS: { id: Tab; label: string; short: string }[] = [
  { id: "overview", label: "Overview", short: "Stats" },
  { id: "mentors", label: "Mentors", short: "Mentors" },
  { id: "mentees", label: "Mentees", short: "Mentees" },
  { id: "allocation", label: "Allocation", short: "Alloc" },
  { id: "logs", label: "Logs", short: "Logs" },
];

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .map((word) => word[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

function interestList(person: { academic_interests: string[]; technical_interests: string[] }) {
  return [...person.academic_interests, ...person.technical_interests];
}

function errorMessage(payload: unknown, fallback: string) {
  return typeof payload === "object" && payload && "error" in payload && typeof payload.error === "string"
    ? payload.error
    : fallback;
}

function methodPill(method: string, priority: number | null) {
  if (method === "fallback") return <Pill variant="gray">Fallback</Pill>;
  if (method === "manual") return <Pill variant="green">Manual</Pill>;
  return (
    <Pill variant={priority === 1 ? "amber" : "indigo"}>
      {priority ? `${priority}${priority === 1 ? "st" : priority === 2 ? "nd" : "rd"} Choice` : "Preference"}
    </Pill>
  );
}

function Thumb({ name, url, number }: { name: string; url: string | null; number?: number }) {
  return (
    <span className="adm-thumb-wrap">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="adm-thumb" src={url} alt="" />
      ) : (
        <span className="adm-thumb adm-thumb-fallback" aria-hidden="true">
          {initials(name)}
        </span>
      )}
      {number !== undefined && <span className="adm-thumb-num">{number}</span>}
    </span>
  );
}

function SearchBar({
  value,
  onChange,
  placeholder,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  id: string;
}) {
  return (
    <div className="dir-search adm-search">
      <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.5-3.5" />
      </svg>
      <input
        id={id}
        type="search"
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

// ─── Overview ────────────────────────────────────────────────────────────────

function StatCard({
  value,
  label,
  accent = "default",
}: {
  value: string;
  label: string;
  accent?: "indigo" | "amber" | "green" | "default";
}) {
  return (
    <div className={`stat${accent !== "default" ? ` ${accent}` : ""}`}>
      <div className="v">{value}</div>
      <div className="k">{label}</div>
    </div>
  );
}

function OverviewTab({ overview, onGoTo }: { overview: Overview; onGoTo: (tab: Tab) => void }) {
  const s = overview.stats;
  return (
    <>
      <div className="stats-grid">
        <StatCard value={String(s.totalMentors)} label="Total mentors" accent="indigo" />
        <StatCard value={String(s.totalMentees)} label="Total mentees" accent="indigo" />
        <StatCard value={String(s.submittedPreferences)} label="Preferences submitted" />
        <StatCard value={String(s.assigned)} label="Assigned" accent="green" />
        <StatCard value={String(s.unassigned)} label="Unassigned" accent="amber" />
        <StatCard value={`${s.availableCapacity} / ${s.totalCapacity}`} label="Capacity available" />
        <StatCard value={String(s.firstChoice)} label="1st choice" accent="amber" />
        <StatCard value={String(s.secondChoice)} label="2nd choice" />
        <StatCard value={String(s.thirdChoice)} label="3rd choice" />
        <StatCard value={`${s.preferenceSatisfaction}%`} label="Preference satisfaction" accent="green" />
      </div>

      <div className="adm-two">
        <div className="card">
          <h3 className="card-title">Quick actions</h3>
          <p className="muted" style={{ fontSize: 13, marginBottom: 14 }}>
            All mentor and mentee records are entered manually from these tabs.
          </p>
          <div className="admin-controls">
            <button className="btn btn-primary btn-sm" type="button" onClick={() => onGoTo("mentors")}>
              Manage mentors
            </button>
            <button className="btn btn-outline btn-sm" type="button" onClick={() => onGoTo("mentees")}>
              Manage mentees
            </button>
            <button className="btn btn-ghost btn-sm" type="button" onClick={() => onGoTo("allocation")}>
              Run allocation
            </button>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Session Details</h3>
          <div className="info-row">
            <div>
              <b>Date &amp; Time</b>
              {overview.session.event_starts_at
                ? new Date(overview.session.event_starts_at).toLocaleString()
                : "To be announced"}
            </div>
          </div>
          <div className="info-row">
            <div>
              <b>Venue</b>
              {overview.session.venue ?? "To be announced"}
            </div>
          </div>
          <div className="info-row">
            <div>
              <b>Status</b>
              <Pill variant="indigo" dot>
                {overview.session.status.toUpperCase()}
              </Pill>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3 className="card-title">Mentor Load</h3>
        {overview.mentorLoads.length === 0 ? (
          <p className="muted">No mentors added yet.</p>
        ) : (
          overview.mentorLoads.map((load, index) => (
            <div className="load-row" key={`${load.name}-${index}`}>
              <span className="load-num">{index + 1}</span>
              <span className="name">{load.name}</span>
              <div className="bar">
                <span style={{ width: `${Math.min((load.assigned / load.capacity) * 100, 100)}%` }} />
              </div>
              <span className="count">
                {load.assigned} / {load.capacity}
              </span>
            </div>
          ))
        )}
      </div>
    </>
  );
}

// ─── Mentors ─────────────────────────────────────────────────────────────────

function MentorsTab({
  overview,
  onAdd,
  onEdit,
  onDelete,
}: {
  overview: Overview;
  onAdd: () => void;
  onEdit: (mentor: Mentor) => void;
  onDelete: (id: string) => void;
}) {
  const [query, setQuery] = useState("");

  const numbered = useMemo(
    () => overview.mentors.map((mentor, index) => ({ ...mentor, number: index + 1 })),
    [overview.mentors],
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return numbered;
    return numbered.filter((mentor) =>
      [String(mentor.number), mentor.full_name, mentor.student_id, mentor.email, mentor.phone, mentor.batch, ...interestList(mentor)]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [numbered, query]);

  return (
    <div className="card">
      <div className="adm-head">
        <h3 className="card-title" style={{ margin: 0 }}>
          Mentors
        </h3>
        <div className="adm-head-actions">
          <Pill variant="indigo">{overview.mentors.length} total</Pill>
          <button className="btn btn-primary btn-sm" type="button" onClick={onAdd}>
            + Add mentor
          </button>
        </div>
      </div>

      <SearchBar id="mentor-search" value={query} onChange={setQuery} placeholder="Search mentors by number, name, ID…" />

      {numbered.length === 0 && (
        <div className="adm-empty">
          <p>No mentors yet.</p>
          <button className="btn btn-primary btn-sm" type="button" onClick={onAdd}>
            + Add your first mentor
          </button>
        </div>
      )}
      {numbered.length > 0 && filtered.length === 0 && (
        <p className="muted" style={{ marginTop: 14 }}>
          No mentors match &ldquo;{query}&rdquo;.
        </p>
      )}

      {/* Desktop table */}
      {filtered.length > 0 && (
        <div className="adm-table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 46 }}>#</th>
                <th>Mentor</th>
                <th>Contact</th>
                <th>Batch</th>
                <th>Interests</th>
                <th>Capacity</th>
                <th style={{ width: 150 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((mentor) => (
                <tr key={mentor.id}>
                  <td>
                    <span className="adm-num">{mentor.number}</span>
                  </td>
                  <td>
                    <div className="adm-cell-person">
                      <Thumb name={mentor.full_name} url={mentor.profile_photo_url} />
                      <div style={{ minWidth: 0 }}>
                        <b>{mentor.full_name}</b>
                        <br />
                        <span className="muted">{mentor.student_id}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    {mentor.email}
                    <br />
                    <span className="muted">
                      {mentor.phone} · {mentor.communication_method}
                    </span>
                  </td>
                  <td>{mentor.batch}</td>
                  <td className="muted">{interestList(mentor).join(", ") || "—"}</td>
                  <td>{mentor.capacity}</td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn btn-outline btn-sm" type="button" onClick={() => onEdit(mentor)}>
                        Edit
                      </button>
                      <button className="btn btn-danger btn-sm" type="button" onClick={() => onDelete(mentor.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile cards */}
      <div className="adm-cards">
        {filtered.map((mentor) => (
          <article className="adm-card" key={mentor.id}>
            <div className="adm-card-top">
              <Thumb name={mentor.full_name} url={mentor.profile_photo_url} number={mentor.number} />
              <div className="adm-card-id">
                <h4>{mentor.full_name}</h4>
                <p className="muted">
                  {mentor.student_id} · {mentor.batch}
                </p>
              </div>
            </div>
            <dl className="adm-card-rows">
              <div>
                <dt>Email</dt>
                <dd>{mentor.email}</dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>
                  {mentor.phone} · {mentor.communication_method}
                </dd>
              </div>
              <div>
                <dt>Capacity</dt>
                <dd>{mentor.capacity} mentees</dd>
              </div>
              <div>
                <dt>Interests</dt>
                <dd>{interestList(mentor).join(", ") || "—"}</dd>
              </div>
            </dl>
            <div className="adm-card-actions">
              <button className="btn btn-outline btn-sm" type="button" onClick={() => onEdit(mentor)}>
                Edit
              </button>
              <button className="btn btn-danger btn-sm" type="button" onClick={() => onDelete(mentor.id)}>
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

// ─── Mentees ─────────────────────────────────────────────────────────────────

function MenteesTab({
  overview,
  onAdd,
  onEdit,
  onDelete,
}: {
  overview: Overview;
  onAdd: () => void;
  onEdit: (mentee: Mentee) => void;
  onDelete: (id: string) => void;
}) {
  const [query, setQuery] = useState("");

  const numbered = useMemo(
    () => overview.mentees.map((mentee, index) => ({ ...mentee, number: index + 1 })),
    [overview.mentees],
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return numbered;
    return numbered.filter((mentee) =>
      [String(mentee.number), mentee.full_name, mentee.student_id, mentee.email, mentee.phone, mentee.batch]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [numbered, query]);

  return (
    <div className="card">
      <div className="adm-head">
        <h3 className="card-title" style={{ margin: 0 }}>
          Mentees
        </h3>
        <div className="adm-head-actions">
          <Pill variant="indigo">{overview.mentees.length} total</Pill>
          <button className="btn btn-primary btn-sm" type="button" onClick={onAdd}>
            + Add mentee
          </button>
        </div>
      </div>

      <SearchBar id="mentee-search" value={query} onChange={setQuery} placeholder="Search mentees by name, TG number…" />

      {numbered.length === 0 && (
        <div className="adm-empty">
          <p>No mentees yet.</p>
          <button className="btn btn-primary btn-sm" type="button" onClick={onAdd}>
            + Add your first mentee
          </button>
        </div>
      )}
      {numbered.length > 0 && filtered.length === 0 && (
        <p className="muted" style={{ marginTop: 14 }}>
          No mentees match &ldquo;{query}&rdquo;.
        </p>
      )}

      {/* Desktop table */}
      {filtered.length > 0 && (
        <div className="adm-table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 46 }}>#</th>
                <th>Mentee</th>
                <th>Contact</th>
                <th>Batch</th>
                <th>Preferences</th>
                <th>Assigned mentor</th>
                <th style={{ width: 150 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((mentee) => (
                <tr key={mentee.id}>
                  <td>
                    <span className="adm-num">{mentee.number}</span>
                  </td>
                  <td>
                    <div className="adm-cell-person">
                      <Thumb name={mentee.full_name} url={null} />
                      <div style={{ minWidth: 0 }}>
                        <b>{mentee.full_name}</b>
                        <br />
                        <span className="muted">{mentee.student_id}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    {mentee.phone}
                    {mentee.email ? (
                      <>
                        <br />
                        <span className="muted">{mentee.email}</span>
                      </>
                    ) : null}
                  </td>
                  <td>{mentee.batch}</td>
                  <td>
                    {mentee.preference_submitted_at ? (
                      <Pill variant="green">Submitted</Pill>
                    ) : (
                      <Pill variant="amber">Pending</Pill>
                    )}
                  </td>
                  <td>
                    {mentee.assignedMentor ? (
                      <>
                        {mentee.assignedMentor}
                        <br />
                        {methodPill(mentee.allocationMethod ?? "preference", mentee.matchedPriority)}
                      </>
                    ) : (
                      <span className="muted">Unassigned</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn btn-outline btn-sm" type="button" onClick={() => onEdit(mentee)}>
                        Edit
                      </button>
                      <button className="btn btn-danger btn-sm" type="button" onClick={() => onDelete(mentee.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile cards */}
      <div className="adm-cards">
        {filtered.map((mentee) => (
          <article className="adm-card" key={mentee.id}>
            <div className="adm-card-top">
              <Thumb name={mentee.full_name} url={null} number={mentee.number} />
              <div className="adm-card-id">
                <h4>{mentee.full_name}</h4>
                <p className="muted">
                  {mentee.student_id} · {mentee.batch}
                </p>
              </div>
            </div>
            <dl className="adm-card-rows">
              <div>
                <dt>Phone</dt>
                <dd>{mentee.phone}</dd>
              </div>
              <div>
                <dt>Preferences</dt>
                <dd>
                  {mentee.preference_submitted_at ? (
                    <Pill variant="green">Submitted</Pill>
                  ) : (
                    <Pill variant="amber">Pending</Pill>
                  )}
                </dd>
              </div>
              <div>
                <dt>Mentor</dt>
                <dd>{mentee.assignedMentor ?? "Unassigned"}</dd>
              </div>
            </dl>
            <div className="adm-card-actions">
              <button className="btn btn-outline btn-sm" type="button" onClick={() => onEdit(mentee)}>
                Edit
              </button>
              <button className="btn btn-danger btn-sm" type="button" onClick={() => onDelete(mentee.id)}>
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

// ─── Allocation ──────────────────────────────────────────────────────────────

function AllocationTab({
  overview,
  running,
  onRun,
  onReset,
}: {
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
          Preview a first-come, first-served result before committing it. A fallback fills remaining mentor capacity for
          unmatched mentees.
        </p>
        <div className="admin-controls">
          <button className="btn btn-outline btn-sm" type="button" disabled={running} onClick={() => onRun("preview", false)}>
            Preview FCFS
          </button>
          <button className="btn btn-primary btn-sm" type="button" disabled={running} onClick={() => onRun("commit", false)}>
            Commit FCFS
          </button>
          <button className="btn btn-amber btn-sm" type="button" disabled={running} onClick={() => onRun("commit", true)}>
            Commit with Fallback
          </button>
          <button className="btn btn-danger btn-sm" type="button" disabled={running} onClick={onReset}>
            Reset Allocation
          </button>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="adm-head">
          <h3 className="card-title" style={{ margin: 0 }}>
            Allocation Results
          </h3>
          <Pill variant="gray">{overview.allocations.length} assignments</Pill>
        </div>

        {overview.allocations.length === 0 ? (
          <p className="muted">No allocation has been saved yet.</p>
        ) : (
          <>
            <div className="adm-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Submitted</th>
                    <th>Mentor</th>
                    <th>Method</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.allocations.map((row) => (
                    <tr key={row.mentee}>
                      <td>{row.mentee}</td>
                      <td className="muted">
                        {row.submittedAt ? new Date(row.submittedAt).toLocaleTimeString() : "—"}
                      </td>
                      <td>{row.mentor}</td>
                      <td>{methodPill(row.method, row.matchedPriority)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="adm-cards">
              {overview.allocations.map((row) => (
                <article className="adm-card" key={row.mentee}>
                  <div className="adm-card-id" style={{ marginBottom: 10 }}>
                    <h4>{row.mentee}</h4>
                    <p className="muted">
                      {row.submittedAt ? new Date(row.submittedAt).toLocaleString() : "No timestamp"}
                    </p>
                  </div>
                  <dl className="adm-card-rows">
                    <div>
                      <dt>Mentor</dt>
                      <dd>{row.mentor}</dd>
                    </div>
                    <div>
                      <dt>Method</dt>
                      <dd>{methodPill(row.method, row.matchedPriority)}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3 className="card-title">Unmatched Pool</h3>
        {overview.unmatched.length === 0 ? (
          <p className="muted">No unmatched mentees.</p>
        ) : (
          <div className="adm-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Preferences</th>
                </tr>
              </thead>
              <tbody>
                {overview.unmatched.map((row) => (
                  <tr key={row.mentee}>
                    <td>{row.mentee}</td>
                    <td className="muted">{row.preferences.join(" → ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="adm-cards">
          {overview.unmatched.map((row) => (
            <article className="adm-card" key={row.mentee}>
              <div className="adm-card-id">
                <h4>{row.mentee}</h4>
                <p className="muted">{row.preferences.join(" → ") || "No preferences"}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Logs ────────────────────────────────────────────────────────────────────

function LogsTab({ overview }: { overview: Overview }) {
  return (
    <div className="card">
      <h3 className="card-title">Activity Log</h3>
      {overview.logs.length === 0 ? (
        <p className="muted">No activity yet.</p>
      ) : (
        <ol className="adm-log">
          {overview.logs.map((entry) => (
            <li key={entry.id}>
              <span className="adm-log-time">{new Date(entry.created_at).toLocaleString()}</span>
              <span className="adm-log-action">{entry.action}</span>
              {entry.detail && <span className="adm-log-detail">{entry.detail}</span>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function AdminScreen() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [resetOpen, setResetOpen] = useState(false);
  const [mentorModalOpen, setMentorModalOpen] = useState(false);
  const [menteeModalOpen, setMenteeModalOpen] = useState(false);
  const [editingMentor, setEditingMentor] = useState<MentorRecord | null>(null);
  const [editingMentee, setEditingMentee] = useState<MenteeRecord | null>(null);
  const [deleteMentorId, setDeleteMentorId] = useState<string | null>(null);
  const [deleteMenteeId, setDeleteMenteeId] = useState<string | null>(null);
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
        if (res.status === 401) {
          setAuthenticated(false);
          setOverview(undefined);
        }
        throw new Error(errorMessage(data, "Unable to load admin data."));
      }
      setOverview(data as Overview);
      setAuthenticated(true);
    } finally {
      setRunning(false);
    }
  };

  const refresh = () =>
    void loadOverview().catch((error: unknown) =>
      showToast(error instanceof Error ? error.message : "Unable to load admin data."),
    );

  const signIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRunning(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data: unknown = await res.json();
      if (!res.ok) throw new Error(errorMessage(data, "Unable to sign in."));
      setPassword("");
      setAuthenticated(true);
      await loadOverview();
      showToast("Signed in as administrator.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setRunning(false);
    }
  };

  const signOut = async () => {
    setRunning(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      setAuthenticated(false);
      setOverview(undefined);
      showToast("Signed out.");
    } finally {
      setRunning(false);
    }
  };

  const runAllocation = async (mode: "preview" | "commit", includeFallback: boolean) => {
    setRunning(true);
    try {
      const res = await fetch("/api/admin/allocations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, includeFallback }),
      });
      const data: unknown = await res.json();
      if (!res.ok) throw new Error(errorMessage(data, "Allocation request failed."));
      const result = data as { allocationCount: number; unmatchedCount: number };
      showToast(
        `${mode === "preview" ? "Preview" : "Allocation saved"}: ${result.allocationCount} assigned, ${result.unmatchedCount} unmatched.`,
      );
      if (mode === "commit") await loadOverview();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Allocation request failed.");
    } finally {
      setRunning(false);
    }
  };

  const resetAllocation = async () => {
    setRunning(true);
    try {
      const res = await fetch("/api/admin/allocations", { method: "DELETE" });
      const data: unknown = await res.json();
      if (!res.ok) throw new Error(errorMessage(data, "Unable to reset allocation."));
      setResetOpen(false);
      showToast("Allocation reset.");
      await loadOverview();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to reset allocation.");
    } finally {
      setRunning(false);
    }
  };

  const handleMentorSaved = (mentor: MentorRecord) => {
    setOverview((current) => {
      if (!current) return current;
      const exists = current.mentors.some((item) => item.id === mentor.id);
      const mentors = exists
        ? current.mentors.map((item) =>
            item.id === mentor.id ? { ...item, ...mentor, profile_photo_url: mentor.profile_photo_url ?? null } : item,
          )
        : [...current.mentors, { ...mentor, profile_photo_url: mentor.profile_photo_url ?? null }].sort((a, b) =>
            a.full_name.localeCompare(b.full_name),
          );
      return { ...current, mentors, stats: { ...current.stats, totalMentors: mentors.length } };
    });
    showToast(editingMentor ? "Mentor updated." : "Mentor added.");
    setEditingMentor(null);
  };

  const handleMenteeSaved = (mentee: MenteeRecord) => {
    setOverview((current) => {
      if (!current) return current;
      const exists = current.mentees.some((item) => item.id === mentee.id);
      const mentees = exists
        ? current.mentees.map((item) => (item.id === mentee.id ? { ...item, ...mentee } : item))
        : [
            ...current.mentees,
            {
              ...mentee,
              guidance_needed: mentee.guidance_needed ?? null,
              preference_submitted_at: null,
              assignedMentor: null,
              allocationMethod: null,
              matchedPriority: null,
            },
          ].sort((a, b) => a.full_name.localeCompare(b.full_name));
      return { ...current, mentees, stats: { ...current.stats, totalMentees: mentees.length } };
    });
    showToast(editingMentee ? "Mentee updated." : "Mentee added.");
    setEditingMentee(null);
  };

  const deleteMentor = async () => {
    if (!deleteMentorId) return;
    setRunning(true);
    try {
      const res = await fetch(`/api/admin/mentors/${deleteMentorId}`, { method: "DELETE" });
      const data: unknown = await res.json();
      if (!res.ok) throw new Error(errorMessage(data, "Unable to delete mentor."));
      setOverview((current) => {
        if (!current) return current;
        const mentors = current.mentors.filter((item) => item.id !== deleteMentorId);
        return { ...current, mentors, stats: { ...current.stats, totalMentors: mentors.length } };
      });
      setDeleteMentorId(null);
      showToast("Mentor deleted.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to delete mentor.");
    } finally {
      setRunning(false);
    }
  };

  const deleteMentee = async () => {
    if (!deleteMenteeId) return;
    setRunning(true);
    try {
      const res = await fetch(`/api/admin/mentees/${deleteMenteeId}`, { method: "DELETE" });
      const data: unknown = await res.json();
      if (!res.ok) throw new Error(errorMessage(data, "Unable to delete mentee."));
      setOverview((current) => {
        if (!current) return current;
        const mentees = current.mentees.filter((item) => item.id !== deleteMenteeId);
        return { ...current, mentees, stats: { ...current.stats, totalMentees: mentees.length } };
      });
      setDeleteMenteeId(null);
      showToast("Mentee deleted.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to delete mentee.");
    } finally {
      setRunning(false);
    }
  };

  const tabCount = (tab: Tab) => {
    if (!overview) return undefined;
    if (tab === "mentors") return overview.mentors.length;
    if (tab === "mentees") return overview.mentees.length;
    if (tab === "allocation") return overview.allocations.length;
    if (tab === "logs") return overview.logs.length;
    return undefined;
  };

  // ── Sign-in gate ──────────────────────────────────────────────────────────
  if (!authenticated) {
    return (
      <div className="container narrow">
        <h2 className="section-title">Administrator Access</h2>
        <p className="section-sub">Sign in to manage mentors, mentees and allocation.</p>

        <div className="card">
          <form onSubmit={(event) => void signIn(event)} className="adm-login">
            <div>
              <label htmlFor="admin-email">Email</label>
              <input
                id="admin-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@example.com"
                required
              />
            </div>
            <div>
              <label htmlFor="admin-password">Password</label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
            <div className="form-actions" style={{ paddingTop: 4 }}>
              <button className="btn btn-outline" type="button" disabled={running} onClick={refresh}>
                Use existing session
              </button>
              <button className="btn btn-primary" type="submit" disabled={running}>
                {running ? "Signing in…" : "Sign in"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ── Authenticated console ─────────────────────────────────────────────────
  return (
    <div className="container">
      <div className="adm-topline">
        <div style={{ minWidth: 0 }}>
          <h2 className="section-title" style={{ marginBottom: 2 }}>
            {overview?.session.title ?? "Mentor Session"} · Admin
          </h2>
          <p className="section-sub" style={{ marginBottom: 0 }}>
            {overview?.session.event_starts_at
              ? new Date(overview.session.event_starts_at).toLocaleString()
              : "Session date to be announced"}
            {overview?.session.venue ? ` · ${overview.session.venue}` : ""}
          </p>
        </div>
        <div className="adm-topline-actions">
          <button className="btn btn-outline btn-sm" type="button" disabled={running} onClick={refresh}>
            {running ? "Loading…" : "Refresh"}
          </button>
          <button className="btn btn-ghost btn-sm" type="button" disabled={running} onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      </div>

      {!overview && (
        <div className="form-note" style={{ marginTop: 18 }}>
          <span>Loading admin data — press Refresh if nothing appears.</span>
        </div>
      )}

      {overview && (
        <>
          <div className="adm-tabs-scroll">
            <nav className="nav admin-tabs" aria-label="Admin sections">
              {TABS.map((tab) => {
                const count = tabCount(tab.id);
                return (
                  <button
                    key={tab.id}
                    type="button"
                    className={`admin-tab${activeTab === tab.id ? " active" : ""}`}
                    onClick={() => setActiveTab(tab.id)}
                    aria-current={activeTab === tab.id ? "page" : undefined}
                  >
                    <span className="adm-tab-full">{tab.label}</span>
                    <span className="adm-tab-short">{tab.short}</span>
                    {count !== undefined && <span className="tab-count">{count}</span>}
                  </button>
                );
              })}
            </nav>
          </div>

          {activeTab === "overview" && <OverviewTab overview={overview} onGoTo={setActiveTab} />}
          {activeTab === "mentors" && (
            <MentorsTab
              overview={overview}
              onAdd={() => {
                setEditingMentor(null);
                setMentorModalOpen(true);
              }}
              onEdit={(mentor) => {
                setEditingMentor(mentor as MentorRecord);
                setMentorModalOpen(true);
              }}
              onDelete={setDeleteMentorId}
            />
          )}
          {activeTab === "mentees" && (
            <MenteesTab
              overview={overview}
              onAdd={() => {
                setEditingMentee(null);
                setMenteeModalOpen(true);
              }}
              onEdit={(mentee) => {
                setEditingMentee(mentee as MenteeRecord);
                setMenteeModalOpen(true);
              }}
              onDelete={setDeleteMenteeId}
            />
          )}
          {activeTab === "allocation" && (
            <AllocationTab overview={overview} running={running} onRun={runAllocation} onReset={() => setResetOpen(true)} />
          )}
          {activeTab === "logs" && <LogsTab overview={overview} />}
        </>
      )}

      {/* ── Modals ── */}
      <ResetModal isOpen={resetOpen} onClose={() => setResetOpen(false)} onConfirm={resetAllocation} />
      <ResetModal
        isOpen={!!deleteMentorId}
        onClose={() => setDeleteMentorId(null)}
        onConfirm={deleteMentor}
        title="Delete mentor?"
        message="This permanently removes the mentor profile. Mentors with assigned mentees cannot be deleted."
        confirmLabel="Delete mentor"
      />
      <ResetModal
        isOpen={!!deleteMenteeId}
        onClose={() => setDeleteMenteeId(null)}
        onConfirm={deleteMentee}
        title="Delete mentee?"
        message="This permanently removes the mentee record along with their preferences."
        confirmLabel="Delete mentee"
      />
      <MentorFormModal
        open={mentorModalOpen}
        mentor={editingMentor}
        onClose={() => {
          setMentorModalOpen(false);
          setEditingMentor(null);
        }}
        onSaved={handleMentorSaved}
      />
      <MenteeFormModal
        open={menteeModalOpen}
        mentee={editingMentee}
        onClose={() => {
          setMenteeModalOpen(false);
          setEditingMentee(null);
        }}
        onSaved={handleMenteeSaved}
      />
    </div>
  );
}
