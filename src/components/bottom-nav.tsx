"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, Home, LayoutGrid, Map, User } from "lucide-react";

import { cn } from "@/lib/utils";

const LEFT_TABS = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/catdex", label: "CatDex", icon: LayoutGrid },
] as const;

const RIGHT_TABS = [
  { href: "/map", label: "Map", icon: Map },
  { href: "/profile", label: "Profile", icon: User },
] as const;

/** Profile tab also covers settings, missions, and community sub-routes. */
const PROFILE_PREFIXES = ["/profile", "/settings", "/missions", "/community"];

function isTabActive(pathname: string, href: string): boolean {
  if (href === "/profile") {
    return PROFILE_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
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
        "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl py-1.5 text-xs font-semibold transition-colors",
        active ? "text-primary" : "text-muted-foreground",
      )}
    >
      <Icon className="size-6 shrink-0" strokeWidth={active ? 2.5 : 2} />
      <span className="truncate">{label}</span>
    </Link>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="relative shrink-0 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur">
      <div className="mx-auto flex max-w-md items-end px-3 pt-2">
        <div className="flex min-w-0 flex-1 items-end justify-around gap-1">
          {LEFT_TABS.map((tab) => (
            <NavTab
              key={tab.href}
              {...tab}
              active={isTabActive(pathname, tab.href)}
            />
          ))}
        </div>

        {/* Center gap for the floating Catch button */}
        <div className="w-[4.5rem] shrink-0" aria-hidden />

        <div className="flex min-w-0 flex-1 items-end justify-around gap-1">
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
        className="absolute -top-7 left-1/2 flex size-16 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40 ring-4 ring-background transition-transform active:scale-95"
      >
        <Camera className="size-7" strokeWidth={2.5} />
      </Link>
    </nav>
  );
}
