export const metadata = { title: "Mentor Session 2026" };

export default function DisplayLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        /* Clean full-screen display — no scrollbars, no chrome */
        html, body { overflow: hidden !important; margin: 0 !important; padding: 0 !important; border: none !important; background: #05050f !important; }
        /* Hide DevBar (clear cache button) */
        .dev-bar { display: none !important; }
        /* Hide Next.js dev toolbar and toast */
        nextjs-portal, [data-nextjs-dialog-overlay], [data-nextjs-toast],
        #__next-build-watcher, #__nextjs-portal { display: none !important; }
        .toast { display: none !important; }
      `}</style>
      {children}
    </>
  );
}
