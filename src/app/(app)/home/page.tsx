import Link from "next/link";
import { Camera, Sparkles } from "lucide-react";

import { CatCard } from "@/components/cat-card";
import { CatButton } from "@/components/ui/cat-button";
import { getCaptures } from "@/lib/captures";

export default async function HomePage() {
  const captures = await getCaptures();
  const recent = captures.slice(0, 4);

  return (
    <div className="flex flex-col gap-6 p-6 pb-28">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Your collection</p>
          <h1 className="text-2xl font-extrabold text-foreground">CatDex</h1>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-bold text-primary">
          <Sparkles className="size-4" />
          {captures.length}
        </div>
      </header>

      <Link href="/catch">
        <div className="relative overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground shadow-lg shadow-primary/30">
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold">Catch a cat</h2>
              <p className="mt-1 text-sm text-primary-foreground/80">
                Snap a stray and add it to your CatDex.
              </p>
            </div>
            <div className="flex size-14 items-center justify-center rounded-full bg-white/20">
              <Camera className="size-7" strokeWidth={2.5} />
            </div>
          </div>
          <div className="pointer-events-none absolute -right-6 -top-10 size-32 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-12 -left-6 size-28 rounded-full bg-white/10" />
        </div>
      </Link>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-foreground">Recent catches</h3>
          {captures.length > 0 && (
            <Link href="/catdex" className="text-sm font-semibold text-primary">
              See all
            </Link>
          )}
        </div>

        {recent.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {recent.map((capture) => (
              <CatCard key={capture.id} capture={capture} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
      <div className="text-5xl">🐾</div>
      <div>
        <p className="font-bold text-foreground">No cats yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Your CatDex is empty. Go catch your first stray!
        </p>
      </div>
      <Link href="/catch">
        <CatButton size="md">Catch your first cat</CatButton>
      </Link>
    </div>
  );
}
