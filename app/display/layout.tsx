export const metadata = { title: "Mentor Session 2026" };

export default function DisplayLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        /* Hide DevBar (clear cache button) */
        .dev-bar { display: none !important; }
        /* Hide Next.js dev toolbar and toast on the projector display */
        nextjs-portal, [data-nextjs-dialog-overlay], [data-nextjs-toast],
        #__next-build-watcher, #__nextjs-portal { display: none !important; }
        /* Hide toast container */
        .toast { display: none !important; }
      `}</style>
      {children}
    </>
  );
}
