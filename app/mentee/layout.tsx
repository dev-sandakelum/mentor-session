import { SiteHeader } from "@/components/nav/SiteHeader";
import { MenteeNav } from "@/components/nav/MenteeNav";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata = {
  title: "Mentee — Mentor Session 2026",
};

export default function MenteeLayout({ children }: LayoutProps<"/mentee">) {
  return (
    <>
      <SiteHeader nav={<MenteeNav />} />
      <main className="screen-enter">{children}</main>
      {/* <SiteFooter /> */}
    </>
  );
}
