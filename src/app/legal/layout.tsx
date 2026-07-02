import { LegalBackButton } from "@/components/legal-back-button";
import { PhoneFrame } from "@/components/phone-frame";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PhoneFrame>
      <div className="flex h-full min-h-0 flex-1 flex-col bg-background">
        <div className="sticky top-0 z-10 flex shrink-0 items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
          <LegalBackButton />
          <span className="text-sm font-bold text-foreground">Legal</span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto scrollbar-none">{children}</div>
      </div>
    </PhoneFrame>
  );
}
