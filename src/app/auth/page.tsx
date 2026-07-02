import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AuthForm } from "@/components/auth/auth-form";
import { getCurrentUser } from "@/lib/auth";

const AUTH_ERRORS: Record<string, string> = {
  confirm_failed:
    "Email confirmation failed. Try signing in or request a new link.",
};

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; error?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/home");

  const params = await searchParams;
  const initialMode = params.mode === "signup" ? "signup" : "signin";
  const authError = params.error ? AUTH_ERRORS[params.error] : undefined;

  return (
    <Suspense>
      <AuthForm initialMode={initialMode} authError={authError} />
    </Suspense>
  );
}
