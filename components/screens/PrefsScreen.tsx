"use client";

import Image from "next/image";
import { useState } from "react";
import { useToast } from "../ToastProvider";

interface Mentor {
  id: number;
  name: string;
  batch: string;
  tags: string[];
  cap: 0 | 1 | 2;
  grad: string;
  photo?: string;
}

const MENTORS: Mentor[] = [
  { id:  1, name: "Tharindu Jayasooriya",  batch: "9th Batch · BICT", tags: ["Web Dev", "Cloud"],       cap: 0, grad: "linear-gradient(135deg,#6366f1,#312e81)", photo: "/profile/1.png" },
  { id:  2, name: "Ishara Gunawardena",    batch: "9th Batch · BICT", tags: ["AI / ML", "Python"],      cap: 0, grad: "linear-gradient(135deg,#0ea5e9,#1d4ed8)", photo: "/profile/2.jpg" },
  { id:  3, name: "Dulani Rathnayake",     batch: "9th Batch · BICT", tags: ["UI/UX", "Research"],      cap: 1, grad: "linear-gradient(135deg,#f472b6,#9d174d)", photo: "/profile/1.png" },
  { id:  4, name: "Kasun Weerasinghe",     batch: "9th Batch · BICT", tags: ["IoT", "Embedded"],        cap: 1, grad: "linear-gradient(135deg,#22c55e,#166534)", photo: "/profile/2.jpg" },
  { id:  5, name: "Sanduni Fernando",      batch: "9th Batch · BICT", tags: ["Cyber Sec", "Linux"],     cap: 1, grad: "linear-gradient(135deg,#f59e0b,#b45309)", photo: "/profile/1.png" },
  { id:  6, name: "Pasindu Amarasinghe",   batch: "9th Batch · BICT", tags: ["Mobile", "Flutter"],      cap: 0, grad: "linear-gradient(135deg,#a855f7,#6b21a8)", photo: "/profile/2.jpg" },
  { id:  7, name: "Nadeesha Silva",        batch: "9th Batch · BICT", tags: ["Data Sci", "Stats"],      cap: 0, grad: "linear-gradient(135deg,#14b8a6,#0f766e)", photo: "/profile/1.png" },
  { id:  8, name: "Ruwan Ekanayake",       batch: "9th Batch · BICT", tags: ["Networking", "CCNA"],     cap: 2, grad: "linear-gradient(135deg,#64748b,#334155)", photo: "/profile/2.jpg" },
  { id:  9, name: "Hansika Perera",        batch: "9th Batch · BICT", tags: ["DevOps", "Career"],       cap: 0, grad: "linear-gradient(135deg,#ef4444,#991b1b)", photo: "/profile/1.png" },
  { id: 10, name: "Dinesh Madushanka",     batch: "9th Batch · BICT", tags: ["React", "TypeScript"],    cap: 0, grad: "linear-gradient(135deg,#06b6d4,#0e7490)", photo: "/profile/2.jpg" },
  { id: 11, name: "Sachini Wickramasinghe",batch: "9th Batch · BICT", tags: ["Database", "SQL"],        cap: 0, grad: "linear-gradient(135deg,#f97316,#c2410c)", photo: "/profile/1.png" },
  { id: 12, name: "Lahiru Dissanayake",    batch: "9th Batch · BICT", tags: ["Game Dev", "Unity"],      cap: 1, grad: "linear-gradient(135deg,#84cc16,#3f6212)", photo: "/profile/2.jpg" },
  { id: 13, name: "Amaya Senanayake",      batch: "9th Batch · BICT", tags: ["Open Source", "Linux"],   cap: 0, grad: "linear-gradient(135deg,#ec4899,#831843)", photo: "/profile/1.png" },
  { id: 14, name: "Nuwan Bandara",         batch: "9th Batch · BICT", tags: ["Cloud", "AWS"],           cap: 0, grad: "linear-gradient(135deg,#f59e0b,#78350f)", photo: "/profile/2.jpg" },
  { id: 15, name: "Thisari Jayawardena",   batch: "9th Batch · BICT", tags: ["UI/UX", "Figma"],         cap: 1, grad: "linear-gradient(135deg,#818cf8,#3730a3)", photo: "/profile/1.png" },
  { id: 16, name: "Gehan Premaratne",      batch: "9th Batch · BICT", tags: ["Cyber Sec", "CTF"],       cap: 0, grad: "linear-gradient(135deg,#34d399,#065f46)", photo: "/profile/2.jpg" },
  { id: 17, name: "Malitha Rajapaksha",    batch: "9th Batch · BICT", tags: ["Mobile", "Android"],      cap: 2, grad: "linear-gradient(135deg,#a78bfa,#4c1d95)", photo: "/profile/1.png" },
  { id: 18, name: "Chamali Herath",        batch: "9th Batch · BICT", tags: ["AI / ML", "Keras"],       cap: 0, grad: "linear-gradient(135deg,#fb7185,#9f1239)", photo: "/profile/2.jpg" },
  { id: 19, name: "Ashen Kumarasinghe",    batch: "9th Batch · BICT", tags: ["Backend", "Node.js"],     cap: 0, grad: "linear-gradient(135deg,#2dd4bf,#134e4a)", photo: "/profile/1.png" },
  { id: 20, name: "Ruvini Samarasinghe",   batch: "9th Batch · BICT", tags: ["Research", "Academic"],   cap: 1, grad: "linear-gradient(135deg,#c084fc,#581c87)", photo: "/profile/2.jpg" },
];

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("");
}

const PRIO_LABELS = ["★1", "2", "3"] as const;
const SLOT_LABELS = ["⭐ 1st Priority", "2nd Priority", "3rd Priority"] as const;

export function PrefsScreen() {
  const { showToast } = useToast();
  const [picks, setPicks] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [lockedNames, setLockedNames] = useState<string[]>([]);

  const mentorById = (id: number) => MENTORS.find((m) => m.id === id)!;

  const toggleMentor = (id: number, isFull: boolean) => {
    const idx = picks.indexOf(id);
    if (idx > -1) {
      setPicks(picks.filter((p) => p !== id));
    } else {
      if (isFull) { showToast("This mentor is full (2/2) and cannot be selected."); return; }
      if (picks.length >= 3) { showToast("You already picked 3 mentors — remove one to change your selection."); return; }
      setPicks([...picks, id]);
    }
  };

  const submitPrefs = () => {
    if (picks.length !== 3) return;
    setLockedNames(picks.map((id) => mentorById(id).name));
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
    showToast("Preferences submitted — FCFS position recorded ✓");
  };

  const resetScreen = () => { setSubmitted(false); setPicks([]); setLockedNames([]); };

  if (submitted) {
    return (
      <div className="container">
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <div className="submitted-box">
            <div className="check">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" aria-hidden="true">
                <path d="M4 12.5l5.5 5.5L20 6.5" />
              </svg>
            </div>
            <h2 className="section-title" style={{ color: "var(--green)" }}>Preferences Submitted ✓</h2>
            <p className="muted" style={{ fontSize: 14, margin: "6px 0" }}>Submitted:</p>
            <div className="ts">20 August 2026, 10:31:42.183</div>
            <p style={{ fontSize: 14, fontWeight: 600, marginTop: 10 }}>🔒 Your preferences are locked.</p>
            <p className="muted" style={{ fontSize: 13.5, marginTop: 6 }}>
              Allocation will be processed according to<br /><b>First Come, First Served.</b>
            </p>
          </div>
          <div className="card" style={{ marginTop: 18 }}>
            <h3 className="card-title">Your locked preferences</h3>
            {lockedNames.map((name, i) => (
              <div key={i} className={`pref-slot filled${i === 0 ? " first" : ""}`}>
                <span className="slot-label">{SLOT_LABELS[i]}</span>
                <div className="slot-name">{name}</div>
              </div>
            ))}
            <button className="btn btn-outline btn-sm" style={{ marginTop: 8 }} onClick={resetScreen}>
              ↺ Demo: reset this screen
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h2 className="section-title">Choose your top 3 mentors</h2>
      <p className="section-sub">
        Your preferences will be processed according to the order in which you submit your application.
        Each mentor can accept a maximum of two mentees. <b>Click a mentor card</b> to assign your next priority slot.
      </p>

      <div className="pref-layout">
        <div className="mentor-grid">
          {MENTORS.map((m) => {
            const isFull = m.cap >= 2;
            const pIdx = picks.indexOf(m.id);
            const isSelected = pIdx > -1;
            const barClass = m.cap === 0 ? "empty" : m.cap === 1 ? "half" : "fullbar";
            const capLabel = `${m.cap}/2${isFull ? " · Full" : ""}`;

            return (
              <div
                key={m.id}
                className={`mentor-card${isFull ? " full" : ""}${isSelected ? ` selected prio-${pIdx + 1}` : ""}`}
                role="button"
                tabIndex={isFull ? -1 : 0}
                aria-pressed={isSelected}
                aria-disabled={isFull}
                aria-label={`${m.name}, ${m.batch}, ${isFull ? "full" : `${m.cap} of 2 mentees`}`}
                onClick={() => toggleMentor(m.id, isFull)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleMentor(m.id, isFull); } }}
              >
                <div className="card-photo">
                  {m.photo ? (
                    <Image src={m.photo} alt={m.name} fill sizes="(max-width:600px) 50vw, 240px" style={{ objectFit: "cover" }} />
                  ) : (
                    <div className="card-photo-fallback" style={{ background: m.grad }} aria-hidden="true">{initials(m.name)}</div>
                  )}
                  {isSelected && (
                    <div className={`prio-badge p${pIdx + 1}`} aria-hidden="true">
                      {pIdx === 0 ? "★ 1" : PRIO_LABELS[pIdx]}
                    </div>
                  )}
                </div>
                <div className="card-info">
                  <h4>{m.name}</h4>
                  <div className="batch">{m.batch}</div>
                  <div className="tags">{m.tags.map((t) => <span key={t} className="tag">{t}</span>)}</div>
                  <div className="cap-row">
                    <div className="cap-bar"><span className={barClass} /></div>
                    <span className="cap-count">{capLabel}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <aside className="pref-summary" aria-label="Your selected preferences">
          <div className="card">
            <h3 className="card-title">
              <svg className="icon" viewBox="0 0 24 24" fill="var(--amber)" stroke="var(--amber)" strokeWidth="1" aria-hidden="true">
                <path d="M12 2l2.9 6.3 6.6.7-4.9 4.5 1.3 6.5L12 16.9 6.1 20l1.3-6.5L2.5 9l6.6-.7z" />
              </svg>
              Your Preferences
            </h3>
            {SLOT_LABELS.map((label, i) => {
              const picked = picks[i];
              return (
                <div key={i} className={`pref-slot${picked ? " filled" : ""}${picked && i === 0 ? " first" : ""}`}>
                  {picked && (
                    <button className="slot-clear" aria-label={`Remove ${mentorById(picked).name} from slot ${i + 1}`}
                      onClick={(e) => { e.stopPropagation(); toggleMentor(picked, false); }}>
                      ✕ remove
                    </button>
                  )}
                  <span className="slot-label">{label}</span>
                  <div className="slot-name">{picked ? mentorById(picked).name : "Not selected yet"}</div>
                </div>
              );
            })}
            <p className="hint" style={{ margin: "4px 0 14px" }}>
              You must select three different mentors. Once submitted, your preferences are locked and your FCFS position is fixed.
            </p>
            <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}
              disabled={picks.length !== 3} onClick={submitPrefs} aria-disabled={picks.length !== 3}>
              Confirm &amp; Submit
            </button>
            <button className="btn btn-ghost btn-sm" style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
              onClick={() => setPicks([])}>
              Clear all
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
