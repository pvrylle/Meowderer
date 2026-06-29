"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, Compass, Grid2x2, Home, MessageCircle, User } from "lucide-react";

import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/home", icon: Home },
  { href: "/catdex", icon: Grid2x2 },
  null,
  { href: "/map", icon: Compass },
  { href: "/community", icon: MessageCircle },
  { href: "/profile", icon: User },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/profile") {
    return (
      pathname === "/profile" ||
      pathname.startsWith("/profile/") ||
      pathname === "/settings" ||
      pathname.startsWith("/settings/") ||
      pathname === "/missions" ||
      pathname.startsWith("/missions/")
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="relative z-30 bg-card pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex h-16 items-center justify-around border-t border-border/30 px-4">
        {NAV_ITEMS.map((item, idx) =>
          item === null ? (
            <Link
              key="fab"
              href="/catch"
              aria-label="Catch"
              className="relative -mt-6 flex size-14 items-center justify-center rounded-full bg-primary text-white shadow-md active:scale-95"
            >
              <Camera className="size-6" strokeWidth={2} />
            </Link>
          ) : (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex size-11 items-center justify-center rounded-xl transition-colors",
                isActive(pathname, item.href)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <item.icon
                className="size-5"
                strokeWidth={isActive(pathname, item.href) ? 2 : 1.5}
              />
            </Link>
          ),
        )}
      </div>
    </nav>
  );
}
