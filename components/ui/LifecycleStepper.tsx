type StepStatus = "done" | "current" | "pending";

export interface LifecycleStep {
  label: string;
  status: StepStatus;
  number?: number;
  sub?: string; // optional secondary detail line
}

interface LifecycleStepperProps {
  steps: LifecycleStep[];
}

export function LifecycleStepper({ steps }: LifecycleStepperProps) {
  return (
    <ol className="lifecycle" aria-label="Session lifecycle">
      {steps.map((step, i) => (
        <li
          key={step.label}
          className={`life-step ${step.status}`}
          aria-current={step.status === "current" ? "step" : undefined}
        >
          <span className="bubble" aria-hidden="true">
            {/* done shows ✓ via CSS ::after; others show the number */}
            {step.status !== "done" ? (step.number ?? i + 1) : null}
          </span>
          <span className="life-step-label">
            <span>{step.label}</span>
            {step.sub && <span className="life-step-sub">{step.sub}</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}
