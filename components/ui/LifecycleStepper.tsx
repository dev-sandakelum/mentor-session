type StepStatus = "done" | "current" | "pending";

export interface LifecycleStep {
  label: string;
  status: StepStatus;
  number?: number;
}

interface LifecycleStepperProps {
  steps: LifecycleStep[];
}

export function LifecycleStepper({ steps }: LifecycleStepperProps) {
  return (
    <div className="lifecycle" role="list" aria-label="Session lifecycle">
      {steps.map((step, i) => (
        <span key={step.label} style={{ display: "contents" }}>
          <span
            className={`life-step ${step.status}`}
            role="listitem"
            aria-current={step.status === "current" ? "step" : undefined}
          >
            <span className="bubble">
              {step.status === "done" ? "✓" : step.number ?? i + 1}
            </span>
            {step.label}
          </span>
          {i < steps.length - 1 && (
            <span className="life-arrow" aria-hidden="true">
              →
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
