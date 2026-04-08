export default function NarrativeBox({ narrative }) {
  if (!narrative) return null;

  return (
    <div className="flex items-start gap-3 bg-violet-50 border border-violet-100 rounded-xl px-4 py-3 mb-4">
      <span className="text-lg shrink-0 mt-0.5">✦</span>
      <p className="text-sm text-gray-700 leading-relaxed">{narrative}</p>
    </div>
  );
}
