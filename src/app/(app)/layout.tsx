import { redirect } from "next/navigation";

import { BottomNav } from "@/components/bottom-nav";
import { getCurrentUser } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <main className="flex-1 overflow-y-auto">{children}</main>
      <BottomNav />
    </div>
  );
}
