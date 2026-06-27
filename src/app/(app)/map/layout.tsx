/** Full-bleed map — fills main above bottom nav, no page scroll. */
export default function MapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-0 flex-1 overflow-hidden">{children}</div>
  );
}
