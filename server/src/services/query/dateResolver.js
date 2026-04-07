const DATE_FIELDS = new Set(["order_date", "signup_date"]);

function toYMD(d) {
  // Use local date parts — toISOString() is UTC and rolls back a day on UTC+ systems
  const y  = d.getFullYear();
  const m  = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function quarterStart(year, q) {
  return new Date(year, (q - 1) * 3, 1);
}
function quarterEnd(year, q) {
  return new Date(year, q * 3, 0); // day 0 of next quarter's first month = last day of this quarter
}

/**
 * Attempt to resolve a relative date expression into { operator, value }.
 * Returns null if the expression is not recognised (already an absolute date).
 */
function resolveExpression(raw) {
  const v = raw.trim().toLowerCase();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  const currentQ = Math.ceil((month + 1) / 3);

  // "Q1 2025", "q4 2024"
  const qMatch = v.match(/^q([1-4])\s+(\d{4})$/);
  if (qMatch) {
    const q = parseInt(qMatch[1]);
    const y = parseInt(qMatch[2]);
    return { operator: "between", value: `${toYMD(quarterStart(y, q))},${toYMD(quarterEnd(y, q))}` };
  }

  // "2024", "2025" — full calendar year
  const yearMatch = v.match(/^(\d{4})$/);
  if (yearMatch) {
    const y = parseInt(yearMatch[1]);
    return { operator: "between", value: `${y}-01-01,${y}-12-31` };
  }

  // "last quarter"
  if (v === "last quarter") {
    let lq = currentQ - 1, ly = year;
    if (lq < 1) { lq = 4; ly--; }
    return { operator: "between", value: `${toYMD(quarterStart(ly, lq))},${toYMD(quarterEnd(ly, lq))}` };
  }

  // "this quarter" / "current quarter"
  if (v === "this quarter" || v === "current quarter") {
    return { operator: "between", value: `${toYMD(quarterStart(year, currentQ))},${toYMD(quarterEnd(year, currentQ))}` };
  }

  // "last month"
  if (v === "last month") {
    const start = new Date(year, month - 1, 1);
    const end   = new Date(year, month, 0);
    return { operator: "between", value: `${toYMD(start)},${toYMD(end)}` };
  }

  // "this month" / "current month"
  if (v === "this month" || v === "current month") {
    const start = new Date(year, month, 1);
    const end   = new Date(year, month + 1, 0);
    return { operator: "between", value: `${toYMD(start)},${toYMD(end)}` };
  }

  // "this year" / "ytd" / "year to date"
  if (v === "this year" || v === "ytd" || v === "year to date") {
    return { operator: "between", value: `${year}-01-01,${toYMD(now)}` };
  }

  // "last year"
  if (v === "last year") {
    return { operator: "between", value: `${year - 1}-01-01,${year - 1}-12-31` };
  }

  // "last N days" / "past N days"
  const daysMatch = v.match(/^(?:last|past)\s+(\d+)\s+days?$/);
  if (daysMatch) {
    const n = parseInt(daysMatch[1]);
    const start = new Date(now);
    start.setDate(start.getDate() - n);
    return { operator: "between", value: `${toYMD(start)},${toYMD(now)}` };
  }

  // "last N months" / "past N months"
  const monthsMatch = v.match(/^(?:last|past)\s+(\d+)\s+months?$/);
  if (monthsMatch) {
    const n = parseInt(monthsMatch[1]);
    const start = new Date(year, month - n, now.getDate());
    return { operator: "between", value: `${toYMD(start)},${toYMD(now)}` };
  }

  // Looks like an ISO date already — leave it alone
  return null;
}

/**
 * Walk the filters array and resolve any relative date expressions.
 * Mutates-and-returns a new filters array (original is not modified).
 */
function resolveDates(filters) {
  if (!filters || filters.length === 0) return filters;

  return filters.map((filter) => {
    if (!DATE_FIELDS.has(filter.field)) return filter;

    const resolved = resolveExpression(filter.value);
    if (!resolved) return filter;

    return { ...filter, operator: resolved.operator, value: resolved.value };
  });
}

module.exports = { resolveDates };
