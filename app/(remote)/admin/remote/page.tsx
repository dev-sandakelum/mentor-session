import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { hasAdminSession } from "@/lib/admin-auth";
import { RemoteScreen } from "@/components/screens/RemoteScreen";

export const dynamic = "force-dynamic";

export default async function AdminRemotePage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const fakeRequest = new Request("http://localhost", {
    headers: { cookie: cookieHeader },
  });

  if (!hasAdminSession(fakeRequest)) {
    redirect("/admin");
  }

  return <RemoteScreen />;
}
