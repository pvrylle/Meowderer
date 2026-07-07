import { CatchPageLoader } from "./catch-page-loader";

export default async function CatchPage({
  searchParams,
}: {
  searchParams: Promise<{ stray?: string }>;
}) {
  const params = await searchParams;
  return <CatchPageLoader prelinkedStrayId={params.stray ?? null} />;
}
