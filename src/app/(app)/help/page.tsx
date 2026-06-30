import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { HelpAccordionItem } from "@/components/help-accordion-item";
import { HELP_SECTIONS, SUPPORT_EMAIL } from "@/content/help";

export default function HelpPage() {
  return (
    <div className="flex flex-col gap-6 p-6 pb-nav">
      <header className="flex items-center gap-3">
        <Link
          href="/settings"
          className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground"
          aria-label="Back to settings"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <h1 className="text-2xl font-extrabold text-foreground">Help & FAQ</h1>
      </header>

      {HELP_SECTIONS.map((section) => (
        <section key={section.id} id={section.id} className="scroll-mt-4 space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
            {section.title}
          </h2>
          <div className="space-y-2">
            {section.items.map((item) => (
              <HelpAccordionItem
                key={item.question}
                question={item.question}
                answer={item.answer}
              />
            ))}
          </div>
        </section>
      ))}

      <section className="rounded-2xl border border-border bg-card p-4 text-center">
        <p className="text-sm text-muted-foreground">Still need help?</p>
        <a
          href={`mailto:${SUPPORT_EMAIL}?subject=CatDex%20Support`}
          className="mt-2 inline-block text-sm font-semibold text-primary underline"
        >
          Contact support
        </a>
      </section>
    </div>
  );
}
