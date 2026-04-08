import { useEffect, useState } from "react";
import { getSuggestions } from "../../services/queryService";

export default function SuggestedQueries({ onSelect }) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    getSuggestions()
      .then((data) => setCategories(data.categories || []))
      .catch(() => {}); // fail silently — suggestions are non-critical
  }, []);

  if (categories.length === 0) return null;

  return (
    <div className="px-4 py-6 flex-1 flex flex-col justify-end">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
        Try asking…
      </p>
      <div className="space-y-4">
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
    </div>
  );
}
