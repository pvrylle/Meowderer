import Link from "next/link";
import { HelpCircle } from "lucide-react";

export function AuthFooter() {
  return (
    <footer className="shrink-0 flex flex-col items-center gap-2 border-t border-border/40 px-5 pb-6 pt-4 text-center sm:px-7 sm:pb-8">
      <Link
        href="/help#account"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        <HelpCircle className="size-3.5" />
        Help & FAQ
      </Link>
      <p className="text-xs text-muted-foreground">
        <Link href="/legal/terms" className="underline underline-offset-2 hover:text-foreground">
          Terms of Service
        </Link>
        {" · "}
        <Link href="/legal/privacy" className="underline underline-offset-2 hover:text-foreground">
          Privacy Policy
        </Link>
      </p>
    </footer>
  );
}
