import { SiteHeader } from "@/components/nav/SiteHeader";
import { MenteeNav } from "@/components/nav/MenteeNav";

export const metadata = {
  title: "Mentee — Mentor Session 2026",
};

export default function MenteeLayout({ children }: LayoutProps<"/mentee">) {
  return (
    <>
      <SiteHeader nav={<MenteeNav />} />
      <main className="screen-enter">{children}</main>
      <footer>
        <b>ICT Students&apos; Circle</b> · Fac. of Technology · Uni. of Ruhuna
      </footer>
    </>
  );
}
