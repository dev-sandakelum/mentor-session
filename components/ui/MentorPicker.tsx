"use client";

import { useEffect, useRef, useState } from "react";

export type PickerMentor = {
  id: string;
  number: number;
  fullName: string;
  batch: string | null;
  profilePhotoUrl: string | null;
  isFull: boolean;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function Thumb({ mentor, size }: { mentor: PickerMentor; size: number }) {
  return mentor.profilePhotoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="mp-thumb"
      src={mentor.profilePhotoUrl}
      alt=""
      style={{ width: size, height: size }}
      draggable={false}
    />
  ) : (
    <span className="mp-thumb mp-thumb-fallback" style={{ width: size, height: size }} aria-hidden="true">
      {initials(mentor.fullName)}
    </span>
  );
}

export interface MentorPickerProps {
  /** Slot label, e.g. "1st Priority" */
  label: string;
  /** 1 | 2 | 3 — drives the accent colour */
  slot: number;
  mentors: PickerMentor[];
  /** Currently selected mentor id for this slot */
  value: string | null;
  /** Mentor ids already used by the other slots */
  takenIds: string[];
  onChange: (mentorId: string | null) => void;
}

export function MentorPicker({ label, slot, mentors, value, takenIds, onChange }: MentorPickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = mentors.find((mentor) => mentor.id === value) ?? null;

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const listId = `mp-list-${slot}`;

  return (
    <div className={`mp mp-s${slot}${selected ? " mp-filled" : ""}`} ref={rootRef}>
      <div className="mp-head">
        <span className="mp-label">{label}</span>
        {selected && (
          <button className="mp-clear" type="button" onClick={() => onChange(null)}>
            Clear
          </button>
        )}
      </div>

      <button
        className="mp-trigger"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => setOpen((prev) => !prev)}
      >
        {selected ? (
          <>
            <span className="mp-num">{selected.number}</span>
            <Thumb mentor={selected} size={34} />
            <span className="mp-trigger-text">
              <span className="mp-trigger-name">{selected.fullName}</span>
              {selected.batch && <span className="mp-trigger-sub">{selected.batch}</span>}
            </span>
          </>
        ) : (
          <span className="mp-placeholder">Tap to pick a mentor</span>
        )}
        <svg
          className={`mp-caret${open ? " mp-caret-open" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul className="mp-list" id={listId} role="listbox" aria-label={label}>
          {mentors.length === 0 && <li className="mp-empty">No mentors available yet.</li>}

          {mentors.map((mentor) => {
            const isTaken = takenIds.includes(mentor.id);
            const isSelected = mentor.id === value;
            const disabled = mentor.isFull || isTaken;

            return (
              <li key={mentor.id} role="none">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`mp-option${isSelected ? " mp-option-active" : ""}${disabled ? " mp-option-disabled" : ""}`}
                  disabled={disabled}
                  onClick={() => {
                    onChange(mentor.id);
                    setOpen(false);
                  }}
                >
                  <span className="mp-num">{mentor.number}</span>
                  <Thumb mentor={mentor} size={30} />
                  <span className="mp-option-text">
                    <span className="mp-option-name">{mentor.fullName}</span>
                    {mentor.batch && <span className="mp-option-sub">{mentor.batch}</span>}
                  </span>
                  {mentor.isFull && <span className="mp-tag mp-tag-full">Full</span>}
                  {!mentor.isFull && isTaken && <span className="mp-tag">Picked</span>}
                  {isSelected && <span className="mp-tick">✓</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
