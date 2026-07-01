import { PhoneFrame } from "@/components/phone-frame";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PhoneFrame>{children}</PhoneFrame>;
}
