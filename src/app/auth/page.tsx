import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AuthForm } from "@/components/auth/auth-form";
import { getCurrentUser } from "@/lib/auth";

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/home");

  const params = await searchParams;
  const initialMode = params.mode === "signup" ? "signup" : "signin";

  return (
    <Suspense>
      <AuthForm initialMode={initialMode} />
    </Suspense>
  );
}
