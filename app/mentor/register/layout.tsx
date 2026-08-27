export const metadata = {
  title: "Mentor Registration — Mentor Session 2026",
};

// Standalone layout — no nav bar or footer.
// This page is shared externally so it should be distraction-free.
export default function MentorRegLayout({ children }: LayoutProps<"/mentor/register">) {
  return (
    <main className="screen-enter">{children}</main>
  );
}
