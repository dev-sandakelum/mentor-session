import type { ReactNode } from "react";

type PillVariant = "green" | "indigo" | "amber" | "gray" | "red";

interface PillProps {
  variant: PillVariant;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}

export function Pill({ variant, dot = false, children, className = "" }: PillProps) {
  return (
    <span className={`pill pill-${variant}${className ? ` ${className}` : ""}`}>
      {dot && <span className="dot" aria-hidden="true" />}
      {children}
    </span>
  );
}
