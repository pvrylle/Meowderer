"use client";

import dynamic from "next/dynamic";

import { CatchPageLoading } from "@/components/capture/catch-page-loading";

const CatchPageClient = dynamic(() => import("./catch-page-client"), {
  ssr: false,
  loading: () => <CatchPageLoading />,
});

export function CatchPageLoader({
  prelinkedStrayId,
}: {
  prelinkedStrayId: string | null;
}) {
  return <CatchPageClient prelinkedStrayId={prelinkedStrayId} />;
}
