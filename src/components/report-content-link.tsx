import { APP_NAME } from "@/lib/brand";
import { SUPPORT_EMAIL } from "@/content/help";

export function ReportContentLink({
  contentType,
  contentId,
  className,
}: {
  contentType: "post" | "alert";
  contentId: string;
  className?: string;
}) {
  const subject = encodeURIComponent(`${APP_NAME} report: ${contentType} ${contentId}`);
  const body = encodeURIComponent(
    `I would like to report this ${contentType} (ID: ${contentId}).\n\nReason:\n`,
  );

  return (
    <a
      href={`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`}
      className={className}
    >
      Report
    </a>
  );
}
