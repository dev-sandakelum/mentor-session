"use client";

interface ResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ResetModal({ isOpen, onClose, onConfirm }: ResetModalProps) {
  return (
    <div
      className={`modal-backdrop${isOpen ? " open" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal">
        <h3 id="reset-modal-title">
          <svg
            className="icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--red)"
            strokeWidth="2"
            style={{ width: 22, height: 22 }}
            aria-hidden="true"
          >
            <path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
            <path d="M12 9v4M12 17h.01" />
          </svg>
          Reset Allocation?
        </h3>
        <p>
          This will{" "}
          <b>permanently delete all 72 current assignments</b> for Mentor
          Session 2026, including FCFS, random fallback and manual assignments.
          Registration data and FCFS submission timestamps will be preserved.
          This action is logged and cannot be undone.
        </p>
        <div className="actions">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-sm"
            style={{ background: "var(--red)", color: "#fff" }}
            onClick={onConfirm}
          >
            Yes, Reset Allocation
          </button>
        </div>
      </div>
    </div>
  );
}
