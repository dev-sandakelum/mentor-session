import { SiteHeader } from "@/components/nav/SiteHeader";
import { BackButton } from "@/components/nav/BackButton";

export const metadata = {
  title: "Mentee — Mentor Session 2026",
};

export default function MenteeLayout({ children }: LayoutProps<"/mentee">) {
  return (
    <>
      <SiteHeader nav={<BackButton />} compact />
      <main className="screen-enter">{children}</main>
    </>
  );
}
