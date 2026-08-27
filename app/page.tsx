import { SiteHeader } from "@/components/nav/SiteHeader";
import { HomeNav } from "@/components/nav/HomeNav";
import { HomeScreen } from "@/components/screens/HomeScreen";

export default function HomePage() {
  return (
    <>
      <SiteHeader nav={<HomeNav />} />
      <main className="screen-enter">
        <HomeScreen />
      </main>
      <footer>
        <b>ICT Students&apos; Circle</b> · Fac. of Technology · Uni. of Ruhuna
      </footer>
    </>
  );
}
