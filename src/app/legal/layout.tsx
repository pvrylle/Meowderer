import { LegalBackButton } from "@/components/legal-back-button";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col bg-background">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <LegalBackButton />
        <span className="text-sm font-bold text-foreground">Legal</span>
      </div>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
