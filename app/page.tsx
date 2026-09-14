import { SiteHeader } from "@/components/nav/SiteHeader";
import { HomeNav } from "@/components/nav/HomeNav";
import { HomeScreen } from "@/components/screens/HomeScreen";
import { SiteFooter } from "@/components/SiteFooter";

export default function HomePage() {
  return (
    <>
      <SiteHeader nav={<HomeNav />} />
      <main className="screen-enter">
        <HomeScreen />
      </main>
      <SiteFooter />
    </>
  );
}
