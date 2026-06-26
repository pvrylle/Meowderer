import { Cat, Globe, MapPin } from "lucide-react";

import { signOut } from "@/app/auth/actions";
import { BrandMark } from "@/components/brand-mark";
import { CatButton } from "@/components/ui/cat-button";
import { getCurrentUser } from "@/lib/auth";
import { getCaptures } from "@/lib/captures";

export default async function ProfilePage() {
  const [user, captures] = await Promise.all([getCurrentUser(), getCaptures()]);

  const countries = new Set(
    captures.map((c) => c.country).filter(Boolean),
  ).size;
  const cities = new Set(captures.map((c) => c.city).filter(Boolean)).size;

  const stats = [
    { label: "Cats", value: captures.length, icon: Cat },
    { label: "Cities", value: cities, icon: MapPin },
    { label: "Countries", value: countries, icon: Globe },
  ];

  return (
    <div className="flex flex-col gap-8 p-6 pb-28">
      <header className="flex flex-col items-center gap-3 pt-6 text-center">
        <BrandMark />
        <div>
          <h1 className="text-xl font-extrabold text-foreground">
            {user?.email ?? "Cat catcher"}
          </h1>
          <p className="text-sm text-muted-foreground">CatDex collector</p>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-card p-4"
          >
            <Icon className="size-5 text-primary" />
            <span className="text-xl font-extrabold text-foreground">
              {value}
            </span>
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      <form action={signOut} className="mt-auto">
        <CatButton type="submit" variant="outline" block>
          Sign out
        </CatButton>
      </form>
    </div>
  );
}
