"use client";

import { useState } from "react";

const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2l2.9 6.3 6.6.7-4.9 4.5 1.3 6.5L12 16.9 6.1 20l1.3-6.5L2.5 9l6.6-.7z" />
  </svg>
);

interface StarRatingProps {
  label: string;
  value?: number;
  onChange?: (rating: number) => void;
}

export function StarRating({ label, value, onChange }: StarRatingProps) {
  const [internalRating, setInternalRating] = useState(0);
  const rating = value ?? internalRating;

  return (
    <div>
      <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
        <legend className="muted" style={{ fontSize: 13, marginBottom: 4 }}>
          {label}
        </legend>
        <div className="stars" role="group" aria-label={label}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className={n <= rating ? "on" : ""}
              aria-label={`${n} star${n !== 1 ? "s" : ""}`}
              aria-pressed={n <= rating}
              onClick={() => { setInternalRating(n); onChange?.(n); }}
            >
              <StarIcon />
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
