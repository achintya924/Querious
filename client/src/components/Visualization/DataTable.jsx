import { useState } from "react";

const INITIAL_ROWS = 10;

export default function DataTable({ results }) {
  const [showAll, setShowAll] = useState(false);

  if (!results || results.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">No results to display.</div>
    );
  }

  const columns = Object.keys(results[0]);
  const rows    = showAll ? results : results.slice(0, INITIAL_ROWS);
  const hidden  = results.length - INITIAL_ROWS;

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                >
                  {humanise(col)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className={`border-b border-gray-100 last:border-0 ${i % 2 === 1 ? "bg-gray-50/50" : "bg-white"}`}
              >
                {columns.map((col) => (
                  <td key={col} className="px-4 py-2.5 text-gray-700 whitespace-nowrap">
                    {formatCell(row[col], col)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hidden > 0 && (
        <button
          onClick={() => setShowAll((v) => !v)}
          className="mt-2 text-xs text-violet-600 hover:underline"
        >
          {showAll ? "Show fewer" : `Show all ${results.length} results`}
        </button>
      )}
    </div>
  );
}

function formatCell(value, key) {
  if (value === null || value === undefined) return "—";

  // Dates
  if (typeof value === "string" && /^\d{4}-\d{2}(-\d{2})?$/.test(value)) {
    return value; // already readable YYYY-MM or YYYY-MM-DD
  }
  if (value instanceof Date || (typeof value === "string" && !isNaN(Date.parse(value)) && value.includes("T"))) {
    return new Date(value).toLocaleDateString();
  }

  // Numbers — apply commas and optional decimals
  if (typeof value === "number") {
    // Revenue / amount columns → 2 decimal places
    const isAmount = /amount|price|revenue|cost|total/i.test(key);
    return value.toLocaleString("en-IN", {
      maximumFractionDigits: isAmount ? 2 : 0,
    });
  }

  return String(value);
}

function humanise(str) {
  return str
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
