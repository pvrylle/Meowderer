import { AuthFooter } from "@/components/auth/auth-footer";
import { InteractivePawField } from "@/components/decorative/interactive-paw-field";
import { PwaInstallHost } from "@/components/pwa/pwa-install-host";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh w-full justify-center bg-gradient-to-b from-[#ECE6F5] via-background to-secondary/20 px-4 py-6 sm:px-6 sm:py-8">
      <InteractivePawField
        trailMode="auto"
        className="flex w-full max-w-[420px] min-h-0 max-h-[min(860px,calc(100dvh-3rem))] flex-col overflow-hidden rounded-[2rem] border border-border/40 bg-background shadow-[0_20px_60px_rgba(45,42,62,0.12)] sm:rounded-[2.75rem]"
        contentClassName="flex min-h-0 flex-1 flex-col"
      >
        <div className="min-h-0 flex-1 overflow-y-auto scrollbar-none">
          {children}
        </div>
        <AuthFooter />
      </InteractivePawField>
      <PwaInstallHost />
    </div>
  );
}
