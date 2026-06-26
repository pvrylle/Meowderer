import Link from "next/link";

import { CatCard } from "@/components/cat-card";
import { CatButton } from "@/components/ui/cat-button";
import { getCaptures } from "@/lib/captures";

export default async function CatDexPage() {
  const captures = await getCaptures();

  return (
    <div className="flex flex-col gap-5 p-6 pb-28">
      <header>
        <h1 className="text-2xl font-extrabold text-foreground">CatDex</h1>
        <p className="text-sm text-muted-foreground">
          {captures.length} {captures.length === 1 ? "cat" : "cats"} collected
        </p>
      </header>

      {captures.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
          <div className="text-5xl">🐱</div>
          <p className="font-bold text-foreground">Your CatDex is empty</p>
          <p className="-mt-2 text-sm text-muted-foreground">
            Catch your first stray to start your collection.
          </p>
          <Link href="/catch">
            <CatButton size="md">Catch a cat</CatButton>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {captures.map((capture) => (
            <CatCard key={capture.id} capture={capture} />
          ))}
        </div>
      )}
    </div>
  );
}
