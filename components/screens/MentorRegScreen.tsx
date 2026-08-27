"use client";

import { ChangeEvent, FormEvent, useRef, useState } from "react";
import { useToast } from "../ToastProvider";

const COMMUNICATION_OPTIONS = ["WhatsApp", "Email", "Phone Call", "In-Person"] as const;
const FIXED_CAPACITY = 2;    // Set by the organiser — not editable by mentors
const FIXED_BATCH    = "9th"; // Fixed for this session

type Field = "fullName" | "studentId" | "email" | "phone" | "communicationMethod" | "photo";
type FieldErrors = Partial<Record<Field, string>>;

export function MentorRegScreen() {
  const { showToast } = useToast();

  const [fullName,    setFullName]    = useState("");
  const [studentId,   setStudentId]   = useState("");
  const [email,       setEmail]       = useState("");
  const [phone,       setPhone]       = useState("");
  const [commMethod,  setCommMethod]  = useState<string>("WhatsApp");
  const [photoFile,   setPhotoFile]   = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting,  setSubmitting]  = useState(false);
  const [submitted,   setSubmitted]   = useState(false);
  const [registeredName, setRegisteredName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearError = (field: Field) =>
    setFieldErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    clearError("photo");
    if (!file) { setPhotoFile(null); setPhotoPreview(null); return; }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setFieldErrors((prev) => ({ ...prev, photo: "Only JPEG, PNG or WebP images are allowed." }));
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setFieldErrors((prev) => ({ ...prev, photo: "Image must be smaller than 3 MB." }));
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const validate = (): boolean => {
    const errors: FieldErrors = {};
    if (!fullName.trim())  errors.fullName  = "Full name is required.";
    if (!studentId.trim()) errors.studentId = "Student ID is required.";
    if (!email.trim())     errors.email     = "University email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email address.";
    if (!phone.trim())     errors.phone     = "Contact number is required.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      // Step 1 — register
      const res = await fetch("/api/registrations/mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName, studentId, email, phone, batch: FIXED_BATCH,
          communicationMethod: commMethod,
          capacity: FIXED_CAPACITY,
        }),
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        const msg =
          typeof data === "object" && data && "error" in data && typeof data.error === "string"
            ? data.error : "Unable to submit registration.";
        const field =
          typeof data === "object" && data && "field" in data && typeof data.field === "string"
            ? (data.field as Field) : null;
        if (field) setFieldErrors((prev) => ({ ...prev, [field]: msg }));
        else showToast(msg);
        return;
      }
      const result = data as { mentor: { id: string; fullName: string } };
      const mentorId = result.mentor.id;
      setRegisteredName(result.mentor.fullName);

      // Step 2 — upload photo if provided
      if (photoFile && mentorId) {
        const form = new FormData();
        form.append("mentorId", mentorId);
        form.append("file", photoFile);
        const photoRes = await fetch("/api/mentor/avatar", { method: "POST", body: form });
        if (!photoRes.ok) {
          // Non-fatal — registration succeeded, just warn
          showToast("Registration saved, but photo upload failed. You can re-upload later.");
        }
      }

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
        <div style={{ maxWidth: 520, margin: "0 auto", paddingTop: 48 }}>
          <div className="submitted-box">
            <div className="check" aria-hidden="true">✓</div>
            <h2 className="section-title" style={{ color: "var(--green)" }}>Registration Submitted!</h2>
            <p style={{ fontSize: 15, fontWeight: 600, margin: "10px 0 4px" }}>
              Thank you, {registeredName}!
            </p>
            <p className="muted" style={{ fontSize: 13.5, lineHeight: 1.6, marginTop: 6 }}>
              Your mentor registration has been received and is{" "}
              <strong>pending admin approval</strong>. You will be notified once it is reviewed.
              Your profile will appear in the mentor directory after approval.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 48 }}>
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
          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ flex: "none", marginTop: 1 }} aria-hidden="true">
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

            {/* Profile photo */}
            <div className="full">
              <label>Profile Photo <span className="muted" style={{ fontWeight: 400 }}>(optional)</span></label>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 4 }}>
                {/* Preview circle */}
                <div
                  style={{
                    width: 72, height: 72, borderRadius: "50%",
                    background: "var(--gray-100)", border: "2px dashed var(--gray-300)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    overflow: "hidden", flexShrink: 0,
                  }}
                  aria-hidden="true"
                >
                  {photoPreview
                    ? <img src={photoPreview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <svg viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="1.5"
                        style={{ width: 28, height: 28 }} aria-hidden="true">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {photoFile ? "Change photo" : "Upload photo"}
                  </button>
                  {photoFile && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => { setPhotoFile(null); setPhotoPreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                    >
                      Remove
                    </button>
                  )}
                  <p className="hint" style={{ margin: 0 }}>JPEG, PNG or WebP · max 3 MB</p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: "none" }}
                onChange={handlePhotoChange}
                aria-label="Upload profile photo"
              />
              {fieldErrors.photo && <p className="hint" style={{ color: "var(--red)", marginTop: 6 }}>{fieldErrors.photo}</p>}
            </div>

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
                placeholder="e.g.TG/2024/3456"
                aria-describedby={fieldErrors.studentId ? "mreg-sid-err" : undefined}
                style={fieldErrors.studentId ? { borderColor: "var(--red)" } : undefined}
              />
              {fieldErrors.studentId && <p id="mreg-sid-err" className="hint" style={{ color: "var(--red)" }}>{fieldErrors.studentId}</p>}
            </div>

            {/* Batch — fixed for this session */}
            <div>
              <label htmlFor="mreg-batch">Batch</label>
              <input
                id="mreg-batch"
                type="text"
                value={FIXED_BATCH}
                readOnly
                aria-readonly="true"
                style={{ background: "var(--gray-50, #f9fafb)", color: "var(--gray-400)", cursor: "not-allowed" }}
              />
              <p className="hint">Fixed for this session.</p>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="mreg-email">University Email <span className="req">*</span></label>
              <input
                id="mreg-email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearError("email"); }}
                placeholder="username_2024xxxx@fot.ruh.ac.lk"
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

            {/* Capacity — read-only, set by organiser */}
            <div>
              <label htmlFor="mreg-cap">Mentee Capacity</label>
              <input
                id="mreg-cap"
                type="number"
                value={FIXED_CAPACITY}
                readOnly
                aria-readonly="true"
                style={{ background: "var(--gray-50, #f9fafb)", color: "var(--gray-400)", cursor: "not-allowed" }}
              />
              <p className="hint">Fixed by the session organiser.</p>
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
