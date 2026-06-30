import { Suspense } from "react";

import { CheckEmailClient } from "@/components/auth/auth-form";

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; mode?: string }>;
}) {
  const params = await searchParams;
  const mode = params.mode === "reset" ? "reset" : "signup";

  return (
    <Suspense>
      <CheckEmailClient email={params.email} mode={mode} />
    </Suspense>
  );
}
