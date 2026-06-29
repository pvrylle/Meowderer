"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, Compass, Home, MessageCircle, User } from "lucide-react";

import { cn } from "@/lib/utils";

const LEFT_ITEMS = [
  { href: "/home", icon: Home, label: "Home" },
  { href: "/map", icon: Compass, label: "Map" },
] as const;

const RIGHT_ITEMS = [
  { href: "/community", icon: MessageCircle, label: "Community" },
  { href: "/profile", icon: User, label: "Profile" },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/home") {
    return pathname === "/home" || pathname === "/catdex" || pathname.startsWith("/catdex/");
  }
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
      <div className="flex h-16 items-center border-t border-border/30">
        {/* Left items */}
        <div className="flex flex-1 items-center justify-evenly">
          {LEFT_ITEMS.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              active={isActive(pathname, item.href)}
            />
          ))}
        </div>

        {/* Center FAB */}
        <Link
          href="/catch"
          aria-label="Catch a cat"
          className="relative -mt-5 flex size-14 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/25 active:scale-95"
        >
          <Camera className="size-6" strokeWidth={2} />
        </Link>

        {/* Right items */}
        <div className="flex flex-1 items-center justify-evenly">
          {RIGHT_ITEMS.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              active={isActive(pathname, item.href)}
            />
          ))}
        </div>
      </div>
    </nav>
  );
}

function NavItem({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string;
  icon: typeof Home;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 px-4 py-2",
        active ? "text-primary" : "text-muted-foreground",
      )}
    >
      <Icon className="size-5" strokeWidth={active ? 2 : 1.5} />
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );
}
