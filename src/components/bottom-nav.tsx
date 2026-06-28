"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Camera,
  Home,
  LayoutGrid,
  Map,
  Target,
  User,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

const LEFT_TABS = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/catdex", label: "CatDex", icon: LayoutGrid },
  { href: "/map", label: "Map", icon: Map },
] as const;

const RIGHT_TABS = [
  { href: "/missions", label: "Quests", icon: Target },
  { href: "/community", label: "Community", icon: Users },
  { href: "/profile", label: "Me", icon: User },
] as const;

function isTabActive(pathname: string, href: string): boolean {
  if (href === "/profile") {
    return (
      pathname === "/profile" ||
      pathname.startsWith("/profile/") ||
      pathname === "/settings" ||
      pathname.startsWith("/settings/")
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavTab({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof Home;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1.5 text-[10px] font-semibold leading-tight transition-colors sm:text-xs",
        active ? "text-primary" : "text-muted-foreground",
      )}
    >
      <Icon className="size-5 shrink-0 sm:size-6" strokeWidth={active ? 2.5 : 2} />
      <span className="max-w-full truncate">{label}</span>
    </Link>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      className="relative z-30 shrink-0 border-t border-border bg-card/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur"
    >
      {/* FAB notch */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 size-[4.75rem] -translate-x-1/2 -translate-y-[38%] rounded-full bg-background"
      />

      <div className="relative mx-auto flex max-w-md items-end px-1 pt-1 sm:px-2">
        <div className="flex min-w-0 flex-1 items-end justify-around">
          {LEFT_TABS.map((tab) => (
            <NavTab
              key={tab.href}
              {...tab}
              active={isTabActive(pathname, tab.href)}
            />
          ))}
        </div>

        <div className="w-[4.25rem] shrink-0 sm:w-[4.75rem]" aria-hidden />

        <div className="flex min-w-0 flex-1 items-end justify-around">
          {RIGHT_TABS.map((tab) => (
            <NavTab
              key={tab.href}
              {...tab}
              active={isTabActive(pathname, tab.href)}
            />
          ))}
        </div>
      </div>

      <Link
        href="/catch"
        aria-label="Catch a cat"
        className="absolute -top-6 left-1/2 flex size-[3.75rem] -translate-x-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/35 ring-[3px] ring-background transition-transform active:scale-95 sm:-top-7 sm:size-16 sm:ring-4"
      >
        <Camera className="size-6 sm:size-7" strokeWidth={2.5} />
      </Link>
    </nav>
  );
}
