import { Brand } from "./Brand";

interface SiteHeaderProps {
  nav: React.ReactNode;
  /** When true the header stays as a single flex row on all screen sizes (no mobile column-stack) */
  compact?: boolean;
}

export function SiteHeader({ nav, compact }: SiteHeaderProps) {
  return (
    <header className="topbar">
      <div className={`topbar-inner${compact ? " topbar-inner--compact" : ""}`}>
        <Brand />
        {nav}
      </div>
    </header>
  );
}
