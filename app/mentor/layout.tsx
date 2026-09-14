import { SiteHeader } from "@/components/nav/SiteHeader";
import { MentorNav } from "@/components/nav/MentorNav";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata = {
  title: "Mentor Directory — Mentor Session 2026",
};

export default function MentorLayout({ children }: LayoutProps<"/mentor">) {
  return (
    <>
      <SiteHeader nav={<MentorNav />} />
      <main className="screen-enter">{children}</main>
      {/* <SiteFooter /> */}
    </>
  );
}
