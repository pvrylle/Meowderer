export default function CatDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="cat-detail-scroll absolute inset-0 flex min-h-0 flex-col overflow-y-auto overscroll-contain scroll-smooth">
      {children}
    </div>
  );
}
