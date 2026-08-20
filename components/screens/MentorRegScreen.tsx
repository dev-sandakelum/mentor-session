"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../ToastProvider";
import { Pill } from "../ui/Pill";
import { MultiSelect } from "../ui/MultiSelect";

const ACADEMIC_OPTIONS = [
  "Programming & Algorithms", "Databases", "Networking",
  "Software Engineering", "Data Science", "Mathematics",
  "Computer Architecture", "Operating Systems", "Research Methods",
];

const TECHNICAL_OPTIONS = [
  "Web Development", "Mobile Development", "AI / Machine Learning",
  "Cyber Security", "Cloud Computing", "DevOps",
  "UI / UX Design", "Embedded Systems / IoT", "Game Development", "Open Source",
];

export function MentorRegScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [academicInterests, setAcademicInterests] = useState<string[]>([]);
  const [technicalInterests, setTechnicalInterests] = useState<string[]>([]);

  return (
    <div className="container" style={{ maxWidth: 820 }}>
      <h2 className="section-title">Mentor Registration</h2>
      <p className="section-sub">
        Mentor Session 2026 · Senior Batch (9th) · Registration is{" "}
        <Pill variant="green" dot>Open</Pill>
      </p>

      <div className="card">
        <div className="form-note">
          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flex: "none", marginTop: 1 }} aria-hidden="true">
            <path d="M12 2l2.9 6.3 6.6.7-4.9 4.5 1.3 6.5L12 16.9 6.1 20l1.3-6.5L2.5 9l6.6-.7z" />
          </svg>
          <span>
            As a mentor you&apos;ll guide <b>1–2 junior students</b> through
            their first year — academics, campus life and technical direction.
            Registrations are reviewed and approved by ICTSC organizers.
          </span>
        </div>

        <div className="form-grid">
          <div>
            <label htmlFor="mentor-name">Full Name <span className="req">*</span></label>
            <input id="mentor-name" type="text" placeholder="e.g., Tharindu Jayasooriya" />
          </div>
          <div>
            <label htmlFor="mentor-id">Student ID <span className="req">*</span></label>
            <input id="mentor-id" type="text" placeholder="e.g., TG/2022/0456" />
          </div>
          <div>
            <label htmlFor="mentor-email">University Email <span className="req">*</span></label>
            <input id="mentor-email" type="email" placeholder="tg2022xxxx@fot.ruh.ac.lk" />
          </div>
          <div>
            <label htmlFor="mentor-phone">Contact Number <span className="req">*</span></label>
            <input id="mentor-phone" type="tel" placeholder="07X XXX XXXX" />
          </div>
          <div>
            <label htmlFor="mentor-batch">Batch <span className="req">*</span></label>
            <select id="mentor-batch" defaultValue="9th">
              <option value="9th">9th Batch</option>
            </select>
          </div>
          <div>
            <label htmlFor="mentor-comms">Preferred Communication Method <span className="req">*</span></label>
            <select id="mentor-comms">
              <option>WhatsApp</option>
              <option>Email</option>
              <option>Phone Call</option>
              <option>In-Person</option>
            </select>
          </div>
          <div className="full">
            <label htmlFor="mentor-academic">Academic Interests</label>
            <MultiSelect id="mentor-academic" options={ACADEMIC_OPTIONS} value={academicInterests} onChange={setAcademicInterests} placeholder="Select academic interests…" />
          </div>
          <div className="full">
            <label htmlFor="mentor-tech">Technical Interests</label>
            <MultiSelect id="mentor-tech" options={TECHNICAL_OPTIONS} value={technicalInterests} onChange={setTechnicalInterests} placeholder="Select technical interests…" />
          </div>
          <div className="full">
            <label htmlFor="mentor-photo">
              Profile Photo <span className="muted" style={{ fontWeight: 400 }}>(optional)</span>
            </label>
            <input id="mentor-photo" type="text" placeholder="Upload photo…" readOnly style={{ cursor: "pointer", background: "var(--gray-50)" }} />
          </div>
          <div className="full" style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "flex-end", marginTop: 4 }}>
            <button className="btn btn-ghost" onClick={() => router.push("/")}>Cancel</button>
            <button className="btn btn-primary" onClick={() => showToast("Mentor registration submitted for ICTSC approval ✓")}>
              Submit for Approval
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
