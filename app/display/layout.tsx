export const metadata = { title: "Mentor Session 2026" };

export default function DisplayLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`.dev-bar { display: none !important; }`}</style>
      {children}
    </>
  );
}
