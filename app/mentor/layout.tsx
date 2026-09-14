import { SiteHeader } from "@/components/nav/SiteHeader";
import { BackButton } from "@/components/nav/BackButton";

export const metadata = {
  title: "Mentor Directory — Mentor Session 2026",
};

export default function MentorLayout({ children }: LayoutProps<"/mentor">) {
  return (
    <>
      <SiteHeader nav={<BackButton />} compact />
      <main className="screen-enter">{children}</main>
    </>
  );
}
