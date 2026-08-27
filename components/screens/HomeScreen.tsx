import Link from "next/link";
import { LifecycleStepper } from "../ui/LifecycleStepper";
import type { LifecycleStep } from "../ui/LifecycleStepper";

const HOW_CARDS = [
  { num: "1", title: "Pick 3 Ranked Mentors",      body: "Every mentee chooses a 1st, 2nd and 3rd priority mentor from the approved senior mentor pool.", amber: false },
  { num: "2", title: "First Come, First Served",   body: "Preferences are processed strictly by server-side submission time — the earlier you submit, the earlier you're matched.", amber: false },
  { num: "3", title: "Max 2 Mentees / Mentor",     body: "Small groups keep mentoring personal. Once a mentor has two mentees, they're marked full.", amber: true },
  { num: "4", title: "Random Fallback",            body: "If all three of your choices fill up, the system fairly assigns you to a mentor with remaining capacity.", amber: false },
];

const LIFECYCLE_STEPS: LifecycleStep[] = [
  { label: "Create Session",       status: "done" },
  { label: "Configure Batches",    status: "done" },
  { label: "Open Registration",    status: "done" },
  { label: "Collect Preferences",  status: "current", number: 4 },
  { label: "FCFS Allocation",      status: "pending", number: 5 },
  { label: "Random Fallback",      status: "pending", number: 6 },
  { label: "Publish Results",      status: "pending", number: 7 },
  { label: "Session & Feedback",   status: "pending", number: 8 },
];

export function HomeScreen() {
  return (
    <div className="container">
      {/* Hero */}
      <div className="hero">
        <span className="kicker">
          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="8" r="4" /><path d="M4 21v-1a7 7 0 0 1 14 0v1" />
          </svg>
          ICT Students&apos; Circle · Mentor Session 2026
        </span>
        <h1>Find your senior mentor. <em>Grow together.</em></h1>
        <p>
          The Mentor Session connects junior students with experienced
          seniors for academic guidance, study advice, technical direction and
          real university experience — matched fairly, transparently and
          automatically.
        </p>
        <div className="cta">
          <Link href="/mentor" className="btn btn-white">
            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="8" r="4" /><path d="M4 21v-1a7 7 0 0 1 14 0v1" />
            </svg>
            Browse Mentors
          </Link>
          <Link href="/mentee" className="btn btn-glass">
            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Register as Mentee
          </Link>
        </div>
      </div>

      {/* How it works */}
      <div className="how-grid">
        {HOW_CARDS.map((card) => (
          <div key={card.num} className={`how-card${card.amber ? " amber" : ""}`}>
            <div className="num">{card.num}</div>
            <h4>{card.title}</h4>
            <p>{card.body}</p>
          </div>
        ))}
      </div>

      {/* Lifecycle */}
      <div className="card" style={{ marginTop: 28 }}>
        <h3 className="card-title">
          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="var(--indigo-light)" strokeWidth="2" aria-hidden="true">
            <path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" />
          </svg>
          Mentor Session Lifecycle
        </h3>
        <LifecycleStepper steps={LIFECYCLE_STEPS} />
      </div>
    </div>
  );
}
