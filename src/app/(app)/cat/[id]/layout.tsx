export default function CatDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="absolute inset-0 flex min-h-0 flex-col overflow-hidden overscroll-none">
      {children}
    </div>
  );
}
