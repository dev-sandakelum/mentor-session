import { Brand } from "./Brand";

interface SiteHeaderProps {
  nav: React.ReactNode;
}

export function SiteHeader({ nav }: SiteHeaderProps) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Brand />
        {nav}
      </div>
    </header>
  );
}
