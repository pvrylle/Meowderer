import type { LegalSection } from "@/content/legal";

export function LegalDocument({
  title,
  updated,
  sections,
}: {
  title: string;
  updated: string;
  sections: LegalSection[];
}) {
  return (
    <article className="flex flex-col gap-6 px-6 py-8 pb-12">
      <header className="space-y-2">
        <h1 className="text-2xl font-extrabold text-foreground">{title}</h1>
        <p className="text-xs text-muted-foreground">Last updated: {updated}</p>
      </header>
      {sections.map((section) => (
        <section key={section.title} className="space-y-2">
          <h2 className="text-lg font-bold text-foreground">{section.title}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 40)} className="text-sm leading-relaxed text-muted-foreground">
              {paragraph}
            </p>
          ))}
        </section>
      ))}
    </article>
  );
}
