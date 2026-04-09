/**
 * ContextChips — suggests natural follow-up queries based on the current
 * structuredQuery.  Pure derivation, no AI calls.
 *
 * Rules:
 *  - Has dimension "category" but not "region"  → suggest break down by region
 *  - Has dimension "region" but not "category"  → suggest break down by category
 *  - Has NO date dimensions and collection is orders → suggest monthly trend
 *  - Has date dimension  → suggest "Just Q4", "Compare with 2024/2025"
 *  - No limit or limit > 5 → suggest top 5
 *  - Always show at most 4 chips
 */
export default function ContextChips({ structuredQuery, onSelect }) {
  const chips = deriveChips(structuredQuery);
  if (!chips.length) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {chips.map((chip) => (
        <button
          key={chip}
          onClick={() => onSelect(chip)}
          className="text-[11px] px-2.5 py-1 rounded-full border border-violet-200 text-violet-600 bg-violet-50 hover:bg-violet-100 hover:border-violet-400 transition-colors"
        >
          {chip}
        </button>
      ))}
    </div>
  );
}

function deriveChips(q) {
  if (!q) return [];

  const chips = [];
  const dims      = (q.dimensions || []).map((d) => d.field);
  const hasDate   = dims.includes("order_date");
  const hasCat    = dims.includes("category");
  const hasRegion = dims.includes("region");
  const isOrders  = q.collection === "orders";
  const filters   = q.filters || [];
  const hasDateFilter = filters.some((f) => f.field === "order_date");

  // ── Dimension suggestions ─────────────────────────────────────────────────
  if (isOrders && hasCat && !hasRegion) {
    chips.push("Break down by region");
  }
  if (isOrders && hasRegion && !hasCat) {
    chips.push("Break down by category");
  }
  if (isOrders && !hasCat && !hasRegion && !hasDate) {
    chips.push("By category");
  }

  // ── Time suggestions ──────────────────────────────────────────────────────
  if (isOrders && !hasDate && !hasDateFilter) {
    chips.push("Show monthly trend");
  }
  if (isOrders && hasDate) {
    chips.push("Just Q4");
    chips.push("For 2024");
  }
  if (isOrders && hasDateFilter) {
    chips.push("Remove date filter");
  }

  // ── Limit suggestions ─────────────────────────────────────────────────────
  if (!q.limit || q.limit > 5) {
    chips.push("Top 5 only");
  }

  // Cap at 4
  return chips.slice(0, 4);
}
