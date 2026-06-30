export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh w-full justify-center bg-gradient-to-b from-[#ECE6F5] via-background to-secondary/20 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex w-full max-w-[420px] min-h-0 max-h-[min(860px,calc(100dvh-3rem))] flex-col overflow-hidden rounded-[2rem] border border-border/40 bg-background shadow-[0_20px_60px_rgba(45,42,62,0.12)] sm:rounded-[2.75rem]">
        {children}
      </div>
    </div>
  );
}
