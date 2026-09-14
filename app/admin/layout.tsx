import { SiteHeader } from "@/components/nav/SiteHeader";
import { AdminNav } from "@/components/nav/AdminNav";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata = {
  title: "Admin — Mentor Session 2026",
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <>
      <SiteHeader nav={<AdminNav />} />
      <main className="screen-enter">{children}</main>
      {/* <SiteFooter /> */}
    </>
  );
}
