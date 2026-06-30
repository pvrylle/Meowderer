import { LegalDocument } from "@/components/legal-document";
import { TERMS_SECTIONS } from "@/content/legal";

export default function TermsPage() {
  return (
    <LegalDocument
      title="Terms of Service"
      updated="June 2026"
      sections={TERMS_SECTIONS}
    />
  );
}
