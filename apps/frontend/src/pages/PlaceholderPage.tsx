export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div>
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-gray-600">This page is scaffolded and ready for implementation.</p>
    </div>
  );
}
