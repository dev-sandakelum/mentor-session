import { SiteHeader } from "@/components/nav/SiteHeader";
import { MenteeNav } from "@/components/nav/MenteeNav";

export const metadata = {
  title: "Mentee — ICTSC Mentor Session 2026",
};

export default function MenteeLayout({ children }: LayoutProps<"/mentee">) {
  return (
    <>
      <SiteHeader nav={<MenteeNav />} />
      <main className="screen-enter">{children}</main>
      <footer>
        <b>ICT Students&apos; Circle</b> · Faculty of Technology · University of
        Ruhuna — Mentor Session Management System (UI Prototype)
      </footer>
    </>
  );
}
