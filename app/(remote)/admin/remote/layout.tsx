export const metadata = {
  title: "Remote — Mentor Session",
};

// Intentionally no SiteHeader / nav — remote is a full-screen controller.
// Auth is enforced in page.tsx via the admin session cookie.
export default function RemoteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
