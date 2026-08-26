"use client";

interface ResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: React.ReactNode;
  confirmLabel?: string;
}

export function ResetModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Reset Allocation?",
  message = (
    <>
      This will <b>permanently delete all current assignments</b> for this mentor session,
      including FCFS, random fallback and manual assignments. Registration data and FCFS
      submission timestamps will be preserved. This action is logged and cannot be undone.
    </>
  ),
  confirmLabel = "Yes, Reset Allocation",
}: ResetModalProps) {
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
          {title}
        </h3>
        <p>{message}</p>
        <div className="actions">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-sm"
            style={{ background: "var(--red)", color: "#fff" }}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
