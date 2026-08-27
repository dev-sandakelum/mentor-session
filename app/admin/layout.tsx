import { SiteHeader } from "@/components/nav/SiteHeader";
import { AdminNav } from "@/components/nav/AdminNav";

export const metadata = {
  title: "Admin — Mentor Session 2026",
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <>
      <SiteHeader nav={<AdminNav />} />
      <main className="screen-enter">{children}</main>
      <footer>
        <b>ICT Students&apos; Circle</b> · Fac. of Technology · Uni. of Ruhuna
      </footer>
    </>
  );
}
