import Image from "next/image";

import { PhoneFrame } from "@/components/phone-frame";

export default function WelcomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PhoneFrame>
      <div className="relative flex h-full min-h-0 flex-1 flex-col bg-background">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <Image
            src="/assets/Background.svg"
            alt=""
            fill
            priority
            className="object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        </div>
        <div className="relative flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </PhoneFrame>
  );
}
