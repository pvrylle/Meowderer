import Link from "next/link";

import { CatButton } from "@/components/ui/cat-button";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="text-6xl">🐈</div>
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Lost cat</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          This page wandered off somewhere.
        </p>
      </div>
      <Link href="/home">
        <CatButton size="md">Back home</CatButton>
      </Link>
    </main>
  );
}
