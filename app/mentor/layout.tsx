import { SiteHeader } from "@/components/nav/SiteHeader";
import { MentorNav } from "@/components/nav/MentorNav";

export const metadata = {
  title: "Mentor — ICTSC Mentor Session 2026",
};

export default function MentorLayout({ children }: LayoutProps<"/mentor">) {
  return (
    <>
      <SiteHeader nav={<MentorNav />} />
      <main className="screen-enter">{children}</main>
      <footer>
        <b>ICT Students&apos; Circle</b> · Faculty of Technology · University of
        Ruhuna — Mentor Session Management System (UI Prototype)
      </footer>
    </>
  );
}
