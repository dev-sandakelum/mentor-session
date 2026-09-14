import { SiteHeader } from "@/components/nav/SiteHeader";
import { HomeScreen } from "@/components/screens/HomeScreen";

export default function HomePage() {
  return (
    <>
      <SiteHeader nav={null} />
      <main className="screen-enter">
        <HomeScreen />
      </main>
    </>
  );
}
