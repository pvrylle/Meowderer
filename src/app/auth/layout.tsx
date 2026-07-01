import { AuthFooter } from "@/components/auth/auth-footer";
import { InteractivePawField } from "@/components/decorative/interactive-paw-field";
import { PhoneFrame } from "@/components/phone-frame";
import { PwaInstallHost } from "@/components/pwa/pwa-install-host";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PhoneFrame>
        <InteractivePawField
          trailMode="auto"
          className="flex h-full min-h-0 flex-1 flex-col"
          contentClassName="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
          <AuthFooter />
        </InteractivePawField>
      </PhoneFrame>
      <PwaInstallHost />
    </>
  );
}
