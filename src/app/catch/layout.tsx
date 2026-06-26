import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";

export default async function CatchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");

  return <div className="flex h-full min-h-0 flex-1 flex-col">{children}</div>;
}
