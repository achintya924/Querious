export default function LoadingSkeleton() {
  return (
    <div className="p-6 animate-pulse space-y-4">
      {/* Narrative skeleton */}
      <div className="bg-violet-50 border border-violet-100 rounded-xl px-4 py-3 flex items-start gap-3">
        <div className="w-5 h-5 bg-violet-200 rounded-full shrink-0 mt-0.5" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-violet-200 rounded w-full" />
          <div className="h-3 bg-violet-200 rounded w-4/5" />
          <div className="h-3 bg-violet-200 rounded w-3/5" />
        </div>
      </div>

      {/* Chart area skeleton */}
      <div className="h-48 bg-gray-100 rounded-xl" />

      {/* Table skeleton */}
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-4 py-2.5 flex gap-6">
          {[40, 25, 25].map((w, i) => (
            <div key={i} className={`h-3 bg-gray-200 rounded`} style={{ width: `${w}%` }} />
          ))}
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`px-4 py-2.5 flex gap-6 ${i % 2 === 0 ? "bg-gray-50/50" : "bg-white"}`}>
            {[40, 25, 25].map((w, j) => (
              <div key={j} className="h-3 bg-gray-100 rounded" style={{ width: `${w}%` }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
