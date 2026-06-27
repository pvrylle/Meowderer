import { cn } from "@/lib/utils";

type UserAvatarProps = {
  name: string;
  avatarUrl?: string | null;
  size?: "sm" | "md";
  className?: string;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function UserAvatar({
  name,
  avatarUrl,
  size = "md",
  className,
}: UserAvatarProps) {
  const dim = size === "sm" ? "size-9" : "size-10";

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt=""
        className={cn("shrink-0 rounded-full object-cover", dim, className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground",
        dim,
        className,
      )}
      aria-hidden
    >
      {initials(name)}
    </div>
  );
}
