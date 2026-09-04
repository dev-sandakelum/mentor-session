// Standalone layout — no nav, no footer, completely isolated.
export default function SuperLayout({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ minHeight: "100vh", background: "#0f0f1a" }}>
      {children}
    </main>
  );
}
