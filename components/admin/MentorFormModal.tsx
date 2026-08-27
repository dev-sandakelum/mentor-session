"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

const COMMUNICATION_OPTIONS = ["WhatsApp", "Email", "Phone Call", "In-Person"];

export type MentorRecord = {
  id: string;
  full_name: string;
  student_id: string;
  email: string;
  phone: string;
  batch: string;
  communication_method: string;
  profile_photo_url?: string | null;
  capacity: number;
};

type MentorFormModalProps = {
  open: boolean;
  mentor?: MentorRecord | null;
  onClose: () => void;
  onSaved: (mentor: MentorRecord) => void;
};

export function MentorFormModal({ open, mentor, onClose, onSaved }: MentorFormModalProps) {
  const isEdit = !!mentor;
  const fileRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const batch = "9th";
  const [communicationMethod, setCommunicationMethod] = useState("Email");
  const [capacity, setCapacity] = useState(2);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setFullName(mentor?.full_name ?? "");
    setStudentId(mentor?.student_id ?? "");
    setEmail(mentor?.email ?? "");
    setPhone(mentor?.phone ?? "");
    setCommunicationMethod(mentor?.communication_method ?? "Email");
    setCapacity(mentor?.capacity ?? 2);
    setPhotoUrl(mentor?.profile_photo_url ?? null);
    setPhotoFile(null);
    setRemovePhoto(false);
    setError(null);
  }, [open, mentor]);

  if (!open) return null;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const payload = {
        fullName,
        studentId,
        email,
        phone,
        batch,
        communicationMethod,
        capacity,
      };

      const url = isEdit ? `/api/admin/mentors/${mentor!.id}` : "/api/admin/mentors";
      const response = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data: unknown = await response.json();
      if (!response.ok) {
        throw new Error(typeof data === "object" && data && "error" in data && typeof data.error === "string" ? data.error : "Unable to save mentor.");
      }

      const saved = (data as { mentor: MentorRecord }).mentor;
      const mentorId = saved.id;

      if (removePhoto && isEdit) {
        await fetch(`/api/admin/mentors/${mentorId}/avatar`, { method: "DELETE" });
        saved.profile_photo_url = null;
      } else if (photoFile) {
        const form = new FormData();
        form.append("file", photoFile);
        const avatarRes = await fetch(`/api/admin/mentors/${mentorId}/avatar`, { method: "POST", body: form });
        const avatarData: unknown = await avatarRes.json();
        if (!avatarRes.ok) {
          throw new Error(typeof avatarData === "object" && avatarData && "error" in avatarData && typeof avatarData.error === "string" ? avatarData.error : "Mentor saved but photo upload failed.");
        }
        saved.profile_photo_url = (avatarData as { url: string }).url;
      }

      onSaved(saved);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save mentor.");
    } finally {
      setBusy(false);
    }
  };

  const previewUrl = photoFile ? URL.createObjectURL(photoFile) : (!removePhoto ? photoUrl : null);

  return (
    <div
      className={`modal-backdrop${open ? " open" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="mentor-form-title"
      onClick={onClose}
    >
      <div className="modal" style={{ maxWidth: 640, width: "100%" }} onClick={(e) => e.stopPropagation()}>
        <h3 className="card-title" id="mentor-form-title" style={{ marginBottom: 4 }}>{isEdit ? "Edit Mentor" : "Add Mentor"}</h3>
        <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>Mentors are managed by administrators and appear in the public directory.</p>

        <form className="form-grid" onSubmit={(e) => void handleSubmit(e)}>
          <div>
            <label htmlFor="admin-mentor-name">Full Name <span className="req">*</span></label>
            <input id="admin-mentor-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="admin-mentor-id">Student ID <span className="req">*</span></label>
            <input id="admin-mentor-id" value={studentId} onChange={(e) => setStudentId(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="admin-mentor-email">University Email <span className="req">*</span></label>
            <input id="admin-mentor-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="admin-mentor-phone">Contact Number <span className="req">*</span></label>
            <input id="admin-mentor-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>
          <div>
            <label>Batch</label>
            <div style={{ display: "flex", alignItems: "center", height: 42 }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "var(--indigo-soft)", color: "var(--indigo)",
                border: "1.5px solid #c7d2fe", borderRadius: 8,
                padding: "5px 14px", fontSize: 13.5, fontWeight: 700,
              }}>
                9th Batch
              </span>
            </div>
          </div>
          <div>
            <label htmlFor="admin-mentor-comm">Communication <span className="req">*</span></label>
            <select id="admin-mentor-comm" value={communicationMethod} onChange={(e) => setCommunicationMethod(e.target.value)}>
              {COMMUNICATION_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="admin-mentor-capacity">Capacity <span className="req">*</span></label>
            <input id="admin-mentor-capacity" type="number" min={1} max={10} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} required />
          </div>
          <div className="full">
            <label>Profile Photo</label>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="" style={{ width: 56, height: 56, borderRadius: 12, objectFit: "cover" }} />
              ) : (
                <div style={{ width: 56, height: 56, borderRadius: 12, background: "var(--surface-2)", display: "grid", placeItems: "center", fontSize: 12, color: "var(--muted)" }}>No photo</div>
              )}
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={(e) => { setPhotoFile(e.target.files?.[0] ?? null); setRemovePhoto(false); }} />
              <button type="button" className="btn btn-outline btn-sm" onClick={() => fileRef.current?.click()}>Upload photo</button>
              {(previewUrl || photoUrl) && !removePhoto && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setPhotoFile(null); setRemovePhoto(true); }}>Remove</button>
              )}
            </div>
          </div>
          {error && <div className="full"><p className="muted" style={{ color: "var(--red)" }}>{error}</p></div>}
          <div className="full" style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : isEdit ? "Save changes" : "Add mentor"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
