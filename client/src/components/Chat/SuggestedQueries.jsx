import { useEffect, useState } from "react";
import { getSuggestions } from "../../services/queryService";

const FALLBACK_SUGGESTIONS = [
  { name: "Sales", queries: ["Total revenue this month", "Top 5 products by revenue", "Sales by region"] },
  { name: "Customers", queries: ["New customers this quarter", "Customers by city"] },
];

export default function SuggestedQueries({ onSelect }) {
  const [categories, setCategories] = useState(null); // null = loading

  useEffect(() => {
    getSuggestions()
      .then((data) => setCategories(data.categories?.length ? data.categories : FALLBACK_SUGGESTIONS))
      .catch(() => setCategories(FALLBACK_SUGGESTIONS));
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full px-6 pt-10 pb-4">
      {/* Welcome message */}
      <div className="flex-1 flex flex-col items-center justify-center text-center mb-6 animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="text-base font-semibold text-gray-800 mb-1">Ask your data anything</h2>
        <p className="text-sm text-gray-400 max-w-xs">
          Type a question in plain English — Querious will translate it into analytics instantly.
        </p>
      </div>

      {/* Suggestions */}
      {categories && (
        <div className="space-y-4 animate-slide-up">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Try asking…
          </p>
          {categories.map((cat) => (
            <div key={cat.name}>
              <p className="text-xs text-gray-400 mb-2">{cat.name}</p>
              <div className="flex flex-wrap gap-2">
                {cat.queries.map((q) => (
                  <button
                    key={q}
                    onClick={() => onSelect(q)}
                    className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-violet-400 hover:text-violet-700 hover:bg-violet-50 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
