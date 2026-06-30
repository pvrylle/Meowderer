import { redirect } from "next/navigation";

import { PhoneFrame } from "@/components/phone-frame";
import { getCurrentUser } from "@/lib/auth";

export default async function CatchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");

  return (
    <PhoneFrame>
      <div className="flex h-full min-h-0 flex-1 flex-col">{children}</div>
    </PhoneFrame>
  );
}
