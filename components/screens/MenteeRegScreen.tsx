"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../ToastProvider";
import { Pill } from "../ui/Pill";
import { MultiSelect } from "../ui/MultiSelect";
import { postJson } from "@/lib/client-api";

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

export function MenteeRegScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [academicInterests, setAcademicInterests] = useState<string[]>([]);
  const [technicalInterests, setTechnicalInterests] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    try {
      const result = await postJson<{ mentee: { id: string } }>("/api/registrations/mentee", {
        fullName: form.get("fullName"),
        studentId: form.get("studentId"),
        email: form.get("email"),
        phone: form.get("phone"),
        batch: form.get("batch"),
        academicInterests,
        technicalInterests,
        guidanceNeeded: form.get("guidanceNeeded"),
      });
      window.localStorage.setItem("mentor-session-mentee-id", result.mentee.id);
      showToast("Registration submitted! You can now select your mentor preferences.");
      router.push("/mentee/prefs");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Registration could not be submitted.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 820 }}>
      <h2 className="section-title">Mentee Registration</h2>
      <p className="section-sub">
        Mentor Session 2026 · Junior Batch (10th) · Registration is{" "}
        <Pill variant="green" dot>Open</Pill>
      </p>

      <div className="card">
        <div className="form-note">
          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flex: "none", marginTop: 1 }} aria-hidden="true">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
          </svg>
          <span>
            After registering, you&apos;ll choose your <b>top 3 mentors</b>.
            Preferences are processed <b>First Come, First Served</b> and each
            mentor can accept a maximum of <b>two mentees</b>.
          </span>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="mentee-name">Full Name <span className="req">*</span></label>
            <input id="mentee-name" name="fullName" type="text" placeholder="e.g., Kavindi Wickramasinghe" required />
          </div>
          <div>
            <label htmlFor="mentee-id">Student ID <span className="req">*</span></label>
            <input id="mentee-id" name="studentId" type="text" placeholder="e.g., TG/IT/2025/1234" required />
          </div>
          <div>
            <label htmlFor="mentee-email">University Email <span className="req">*</span></label>
            <input id="mentee-email" name="email" type="email" placeholder="tg2025xxxx@fot.ruh.ac.lk" required />
          </div>
          <div>
            <label htmlFor="mentee-phone">Contact Number <span className="req">*</span></label>
            <input id="mentee-phone" name="phone" type="tel" placeholder="07X XXX XXXX" required />
          </div>
          <div>
            <label htmlFor="mentee-batch">Batch <span className="req">*</span></label>
            <select id="mentee-batch" name="batch" defaultValue="10th">
              <option value="10th">10th Batch</option>
            </select>
          </div>
          <div className="full">
            <label htmlFor="mentee-academic">Academic Interests</label>
            <MultiSelect id="mentee-academic" options={ACADEMIC_OPTIONS} value={academicInterests} onChange={setAcademicInterests} placeholder="Select academic interests…" />
          </div>
          <div className="full">
            <label htmlFor="mentee-tech">Technical Interests</label>
            <MultiSelect id="mentee-tech" options={TECHNICAL_OPTIONS} value={technicalInterests} onChange={setTechnicalInterests} placeholder="Select technical interests…" />
          </div>
          <div className="full">
            <label htmlFor="mentee-guidance">
              Areas Where Guidance Is Required
              <span className="muted" style={{ fontWeight: 400 }}> (optional)</span>
            </label>
            <textarea id="mentee-guidance" name="guidanceNeeded" placeholder="e.g., How to balance coursework, choosing a specialization, preparing for the first semester exams…" />
          </div>
          <div className="full" style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "flex-end", marginTop: 4 }}>
            <button className="btn btn-ghost" type="button" onClick={() => router.push("/")}>Cancel</button>
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? "Submitting…" : "Register & Choose Mentors"}
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
