"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Camera,
  Home,
  LayoutGrid,
  Map,
  Target,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

const TABS = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/catdex", label: "CatDex", icon: LayoutGrid },
  { href: "/map", label: "Map", icon: Map },
  { href: "/missions", label: "Quests", icon: Target },
  { href: "/community", label: "Community", icon: Users },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="relative shrink-0 border-t border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-around px-1 py-2">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-1 text-[10px] font-semibold transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="size-5" strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </div>

      <Link
        href="/catch"
        aria-label="Catch a cat"
        className="absolute -top-7 left-1/2 flex size-16 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40 ring-4 ring-background transition-transform active:scale-95"
      >
        <Camera className="size-7" strokeWidth={2.5} />
      </Link>
    </nav>
  );
}
