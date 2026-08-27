"use client";

import { FormEvent, useState } from "react";
import { useToast } from "../ToastProvider";

const COMMUNICATION_OPTIONS = ["WhatsApp", "Email", "Phone Call", "In-Person"] as const;

type Field = "fullName" | "studentId" | "email" | "phone" | "batch" | "communicationMethod";

type FieldErrors = Partial<Record<Field, string>>;

export function MentorRegScreen() {
  const { showToast } = useToast();

  const [fullName, setFullName]           = useState("");
  const [studentId, setStudentId]         = useState("");
  const [email, setEmail]                 = useState("");
  const [phone, setPhone]                 = useState("");
  const [batch, setBatch]                 = useState("");
  const [commMethod, setCommMethod]       = useState<string>("WhatsApp");
  const [capacity, setCapacity]           = useState(2);
  const [fieldErrors, setFieldErrors]     = useState<FieldErrors>({});
  const [submitting, setSubmitting]       = useState(false);
  const [submitted, setSubmitted]         = useState(false);
  const [registeredName, setRegisteredName] = useState("");

  const clearError = (field: Field) =>
    setFieldErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });

  const validate = (): boolean => {
    const errors: FieldErrors = {};
    if (!fullName.trim())   errors.fullName   = "Full name is required.";
    if (!studentId.trim())  errors.studentId  = "Student ID is required.";
    if (!email.trim())      errors.email      = "University email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email address.";
    if (!phone.trim())      errors.phone      = "Contact number is required.";
    if (!batch.trim())      errors.batch      = "Batch is required.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/registrations/mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, studentId, email, phone, batch, communicationMethod: commMethod, capacity }),
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        const msg =
          typeof data === "object" && data && "error" in data && typeof data.error === "string"
            ? data.error
            : "Unable to submit registration.";
        const field =
          typeof data === "object" && data && "field" in data && typeof data.field === "string"
            ? data.field as Field
            : null;
        if (field) setFieldErrors((prev) => ({ ...prev, [field]: msg }));
        else showToast(msg);
        return;
      }
      const result = data as { mentor: { fullName: string } };
      setRegisteredName(result.mentor.fullName);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      showToast("A network error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="container">
        <div style={{ maxWidth: 520, margin: "0 auto" }}>
          <div className="submitted-box">
            <div className="check" aria-hidden="true">✓</div>
            <h2 className="section-title" style={{ color: "var(--green)" }}>Registration Submitted!</h2>
            <p style={{ fontSize: 15, fontWeight: 600, margin: "10px 0 4px" }}>
              Thank you, {registeredName}!
            </p>
            <p className="muted" style={{ fontSize: 13.5, lineHeight: 1.6, marginTop: 6 }}>
              Your mentor registration has been received and is <strong>pending admin approval</strong>.
              You will be notified once it is reviewed. Your profile will appear in the mentor directory
              after approval.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ maxWidth: 640, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h2 className="section-title">Mentor Registration</h2>
          <p className="section-sub">
            Register as a senior mentor for this session. Your application will be reviewed and approved by the administrator.
          </p>
        </div>

        {/* Info note */}
        <div className="form-note" style={{ marginBottom: 28 }}>
          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flex: "none", marginTop: 1 }} aria-hidden="true">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
          </svg>
          <span>
            After submitting, your registration will be <strong>pending admin approval</strong> before
            you appear in the mentor directory. Fill in all details accurately.
          </span>
        </div>

        <form className="card" onSubmit={(e) => void handleSubmit(e)} noValidate>
          <h3 className="card-title" style={{ marginBottom: 20 }}>Your Details</h3>

          <div className="form-grid">
            {/* Full Name */}
            <div className="full">
              <label htmlFor="mreg-name">Full Name <span className="req">*</span></label>
              <input
                id="mreg-name"
                type="text"
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); clearError("fullName"); }}
                placeholder="e.g. Ishara Gunawardena"
                aria-describedby={fieldErrors.fullName ? "mreg-name-err" : undefined}
                style={fieldErrors.fullName ? { borderColor: "var(--red)" } : undefined}
              />
              {fieldErrors.fullName && <p id="mreg-name-err" className="hint" style={{ color: "var(--red)" }}>{fieldErrors.fullName}</p>}
            </div>

            {/* Student ID */}
            <div>
              <label htmlFor="mreg-sid">Student ID <span className="req">*</span></label>
              <input
                id="mreg-sid"
                type="text"
                value={studentId}
                onChange={(e) => { setStudentId(e.target.value); clearError("studentId"); }}
                placeholder="e.g. EG/2020/3456"
                aria-describedby={fieldErrors.studentId ? "mreg-sid-err" : undefined}
                style={fieldErrors.studentId ? { borderColor: "var(--red)" } : undefined}
              />
              {fieldErrors.studentId && <p id="mreg-sid-err" className="hint" style={{ color: "var(--red)" }}>{fieldErrors.studentId}</p>}
            </div>

            {/* Batch */}
            <div>
              <label htmlFor="mreg-batch">Batch <span className="req">*</span></label>
              <input
                id="mreg-batch"
                type="text"
                value={batch}
                onChange={(e) => { setBatch(e.target.value); clearError("batch"); }}
                placeholder="e.g. 9th"
                aria-describedby={fieldErrors.batch ? "mreg-batch-err" : undefined}
                style={fieldErrors.batch ? { borderColor: "var(--red)" } : undefined}
              />
              {fieldErrors.batch && <p id="mreg-batch-err" className="hint" style={{ color: "var(--red)" }}>{fieldErrors.batch}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="mreg-email">University Email <span className="req">*</span></label>
              <input
                id="mreg-email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearError("email"); }}
                placeholder="eg/2020/xxxx@fot.ruh.ac.lk"
                autoComplete="email"
                aria-describedby={fieldErrors.email ? "mreg-email-err" : undefined}
                style={fieldErrors.email ? { borderColor: "var(--red)" } : undefined}
              />
              {fieldErrors.email && <p id="mreg-email-err" className="hint" style={{ color: "var(--red)" }}>{fieldErrors.email}</p>}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="mreg-phone">Contact Number <span className="req">*</span></label>
              <input
                id="mreg-phone"
                type="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); clearError("phone"); }}
                placeholder="e.g. 071 234 5678"
                aria-describedby={fieldErrors.phone ? "mreg-phone-err" : undefined}
                style={fieldErrors.phone ? { borderColor: "var(--red)" } : undefined}
              />
              {fieldErrors.phone && <p id="mreg-phone-err" className="hint" style={{ color: "var(--red)" }}>{fieldErrors.phone}</p>}
            </div>

            {/* Communication Method */}
            <div>
              <label htmlFor="mreg-comm">Preferred Contact Method <span className="req">*</span></label>
              <select
                id="mreg-comm"
                value={commMethod}
                onChange={(e) => { setCommMethod(e.target.value); clearError("communicationMethod"); }}
              >
                {COMMUNICATION_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* Capacity */}
            <div>
              <label htmlFor="mreg-cap">Mentee Capacity</label>
              <input
                id="mreg-cap"
                type="number"
                min={1}
                max={10}
                value={capacity}
                onChange={(e) => setCapacity(Math.min(10, Math.max(1, Number(e.target.value))))}
              />
              <p className="hint">How many mentees can you mentor at once? (1–10)</p>
            </div>

            {/* Submit */}
            <div className="full" style={{ marginTop: 8 }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
                style={{ width: "100%", justifyContent: "center" }}
              >
                {submitting ? "Submitting…" : "Submit Registration"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
