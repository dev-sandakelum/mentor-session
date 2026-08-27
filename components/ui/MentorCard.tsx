"use client";

const GRADIENTS = [
  "linear-gradient(135deg,#6366f1,#312e81)",
  "linear-gradient(135deg,#0ea5e9,#1d4ed8)",
  "linear-gradient(135deg,#f472b6,#9d174d)",
  "linear-gradient(135deg,#22c55e,#166534)",
  "linear-gradient(135deg,#f59e0b,#b45309)",
  "linear-gradient(135deg,#a855f7,#6b21a8)",
];

// Gradient tints for the bottom blur overlay — matched to each card gradient
const OVERLAY_TINTS = [
  "rgba(99,102,241,0.55)",
  "rgba(14,165,233,0.55)",
  "rgba(244,114,182,0.55)",
  "rgba(34,197,94,0.55)",
  "rgba(245,158,11,0.55)",
  "rgba(168,85,247,0.55)",
];

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

export interface MentorCardProps {
  id: string;
  fullName: string;
  batch: string | null;
  academicInterests: string[];
  technicalInterests: string[];
  profilePhotoUrl: string | null;
  index: number;
  /** Selection priority (1-3), undefined = not selected */
  priority?: number;
  /** Whether this mentor is at full capacity */
  isFull?: boolean;
  /** Click handler — omit for read-only cards */
  onClick?: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

const PRIO_LABELS = ["★ 1st", "2nd", "3rd"] as const;
const PRIO_COLORS = ["var(--amber)", "var(--indigo-light)", "var(--gray-500)"] as const;

export function MentorCard({
  fullName,
  batch,
  profilePhotoUrl,
  index,
  priority,
  isFull,
  onClick,
  onKeyDown,
}: MentorCardProps) {
  const isSelected = priority !== undefined;
  const prioIdx = isSelected ? priority - 1 : -1;
  const gradient = GRADIENTS[index % GRADIENTS.length];
  const tint = OVERLAY_TINTS[index % OVERLAY_TINTS.length];
  const interactive = !!onClick;

  return (
    <div
      className={[
        "mc",
        isSelected ? `mc-selected mc-p${priority}` : "",
        isFull ? "mc-full" : "",
        interactive ? "mc-interactive" : "",
      ].filter(Boolean).join(" ")}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? (isFull ? -1 : 0) : undefined}
      aria-pressed={interactive ? isSelected : undefined}
      aria-disabled={interactive ? isFull : undefined}
      onClick={!isFull ? onClick : undefined}
      onKeyDown={onKeyDown}
    >
      {/* ── Photo area ── */}
      <div className="mc-photo">
        {profilePhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profilePhotoUrl} alt={fullName} draggable={false} />
        ) : (
          <div className="mc-avatar" style={{ background: gradient }} aria-hidden="true">
            {initials(fullName)}
          </div>
        )}

        {/* Blurred gradient overlay at bottom of photo — tinted to match the gradient */}
        <div
          className="mc-photo-fade"
          style={{ "--mc-tint": tint } as React.CSSProperties}
          aria-hidden="true"
        />

        {/* Full overlay */}
        {isFull && <div className="mc-full-badge">Full</div>}

        {/* Priority badge */}
        {isSelected && prioIdx >= 0 && (
          <div
            className="mc-prio-badge"
            style={{ background: PRIO_COLORS[prioIdx] }}
            aria-label={`Priority ${priority}`}
          >
            {PRIO_LABELS[prioIdx]}
          </div>
        )}
      </div>

      {/* ── Info area ── */}
      <div className="mc-info">
        <h4 className="mc-name">{fullName}</h4>
        {batch && <p className="mc-batch">{batch}</p>}

        {/* Accent bar */}
        <div
          className="mc-accent"
          style={isSelected ? { background: PRIO_COLORS[prioIdx >= 0 ? prioIdx : 0] } : undefined}
        />
      </div>
    </div>
  );
}
