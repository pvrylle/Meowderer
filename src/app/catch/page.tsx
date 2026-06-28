"use client";

import dynamic from "next/dynamic";

import { CatchPageLoading } from "@/components/capture/catch-page-loading";

const CatchPageClient = dynamic(() => import("./catch-page-client"), {
  ssr: false,
  loading: () => <CatchPageLoading />,
});

export default function CatchPage() {
  return <CatchPageClient />;
}
