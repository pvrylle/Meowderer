import Image from "next/image";

import { AuthFooter } from "@/components/auth/auth-footer";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-full flex-col bg-background">
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
      >
        <Image
          src="/assets/Background.svg"
          alt=""
          fill
          priority
          className="object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
      </div>
      <div className="relative flex min-h-full flex-1 flex-col">{children}</div>
      <AuthFooter />
    </div>
  );
}
