"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../ToastProvider";
import { postJson } from "@/lib/client-api";
import { setMenteeId } from "@/lib/mentee-session";

const STUDENT_ID_PREFIX = "TG/IT/2025/";

export function MenteeRegScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [idSuffix, setIdSuffix] = useState("");
  const [idError, setIdError] = useState("");

  const handleSuffixChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 4); // digits only, max 4
    setIdSuffix(val);
    if (val.length > 0 && val.length < 4) {
      setIdError("Student number must be 4 digits");
    } else {
      setIdError("");
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (idSuffix.length !== 4) {
      setIdError("Student number must be 4 digits");
      return;
    }
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    try {
      const result = await postJson<{ mentee: { id: string } }>("/api/registrations/mentee", {
        fullName: form.get("fullName"),
        studentId: STUDENT_ID_PREFIX + idSuffix,
        phone: form.get("phone"),
      });
      setMenteeId(result.mentee.id);
      showToast("Registration submitted! You can now select your mentor preferences.");
      router.push("/mentee/prefs");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Registration could not be submitted.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mreg-page">
      {/* Page header */}


      {/* Form card */}
      <div className="mreg-card">
        {/* Card header */}
        <div className="mreg-card-header">
          <div className="mreg-card-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div>
            <h2 className="mreg-card-title">Create your mentee account</h2>
            <p className="mreg-card-sub">Register once to access mentor selection and your personal dashboard.</p>
          </div>
        </div>
        <div className="mreg-card-divider" />

        <form onSubmit={handleSubmit}>
          <div className="mreg-grid">

            {/* Full Name */}
            <div className="mreg-field">
              <label htmlFor="mentee-name" className="mreg-label">
                Full Name <span className="mreg-req">*</span>
              </label>
              <input
                id="mentee-name"
                className="mreg-input"
                name="fullName"
                type="text"
                placeholder="e.g., Kavindi Wickramasinghe"
                required
                autoComplete="name"
              />
            </div>

            {/* Student ID */}
            <div className="mreg-field mreg-field-full">
              <label htmlFor="mentee-sid" className="mreg-label">
                Student Number <span className="mreg-req">*</span>
                <span className="mreg-sid-info" title="Format: TG/IT/2025/XXXX" aria-label="Info">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                  </svg>
                </span>
              </label>
              {/* <p className="mreg-sid-hint-top">Format: TG/IT/2025/XXXX (Last 4 digits are your unique number)</p> */}

              <div className={`mreg-sid-box${idError ? " mreg-sid-box-error" : ""}`}>
                {/* Fixed segments */}
                {["TG", "IT", "2025"].map((seg) => (
                  <span key={seg} className="mreg-sid-seg-wrap">
                    <span className="mreg-sid-chip">{seg}</span>
                    <span className="mreg-sid-slash">/</span>
                  </span>
                ))}

                {/* Editable suffix */}
                <input
                  id="mentee-sid"
                  className="mreg-sid-digit-input"
                  type="text"
                  inputMode="numeric"
                  placeholder="XXXX"
                  value={idSuffix}
                  onChange={handleSuffixChange}
                  maxLength={4}
                  required
                  aria-describedby="sid-hint sid-error"
                  aria-label="Last 4 digits of student number"
                />

                {/* Lock icon */}
                <span className="mreg-sid-lock" aria-label="Prefix is fixed">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <span>Fixed</span>
                </span>
              </div>

              {idError ? (
                <span id="sid-error" className="mreg-field-err" role="alert">{idError}</span>
              ) : (
                <p id="sid-hint" className="mreg-sid-hint">
                  Enter only the last 4 digits of your student number.
                </p>
              )}
            </div>

            {/* Phone — full width */}
            <div className="mreg-field mreg-field-full">
              <label htmlFor="mentee-phone" className="mreg-label">
                Phone Number <span className="mreg-req">*</span>
              </label>
              <input
                id="mentee-phone"
                className="mreg-input"
                name="phone"
                type="tel"
                inputMode="tel"
                placeholder="07X XXX XXXX"
                required
              />
            </div>

            {/* Actions */}
            <div className="mreg-actions">
              <button
                className="mreg-btn-cancel"
                type="button"
                onClick={() => router.push("/")}
              >
                Cancel
              </button>
              <button
                className="mreg-btn-submit"
                type="submit"
                disabled={submitting}
              >
                {submitting ? "Submitting…" : "Register & Choose Mentors"}
                {!submitting && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                )}
              </button>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
}
