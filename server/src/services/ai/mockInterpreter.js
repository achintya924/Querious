/**
 * Mock interpreter for development when Gemini API is unavailable.
 * Parses common query patterns by keyword matching.
 * Enable with MOCK_AI=true in .env
 *
 * When a previousQuery is provided, follow-up patterns are applied as
 * incremental modifications rather than fresh queries.
 */

// ── Follow-up modifier ────────────────────────────────────────────────────────

/**
 * Returns a modified copy of previousQuery based on the follow-up question,
 * or null if the question doesn't look like a follow-up.
 */
function applyFollowUp(question, previousQuery) {
  if (!previousQuery) return null;

  const q = question.toLowerCase().trim();

  // Detect clear fresh-topic starters that aren't follow-ups
  const freshTopicRe = /^(how many|what is|what are|show me the|give me|find all|list all)\b/i;
  const hasFollowUpSignal = /\b(by region|by category|by month|by quarter|by year|for 20\d\d|in 20\d\d|top \d|bottom \d|sort|remove|add|only|just|change|also|now)\b/i.test(q);

  if (freshTopicRe.test(q) && !hasFollowUpSignal) return null;
  if (!hasFollowUpSignal) return null;

  // Deep-clone previous query to mutate safely
  const next = JSON.parse(JSON.stringify(previousQuery));

  // ── "by region" → add region dimension ──────────────────────────────────────
  if (/\bby region\b/i.test(q)) {
    next.dimensions = next.dimensions || [];
    if (!next.dimensions.find((d) => d.field === "region")) {
      next.dimensions.push({ field: "region" });
    }
  }

  // ── "by category" → add category dimension ──────────────────────────────────
  if (/\bby category\b/i.test(q)) {
    next.dimensions = next.dimensions || [];
    if (!next.dimensions.find((d) => d.field === "category")) {
      next.dimensions.push({ field: "category" });
    }
  }

  // ── "by month" / "monthly" → add month dimension ────────────────────────────
  if (/\bby month\b|\bmonthly\b/i.test(q)) {
    next.dimensions = next.dimensions || [];
    if (!next.dimensions.find((d) => d.field === "order_date")) {
      next.dimensions.push({ field: "order_date", granularity: "month" });
    }
  }

  // ── "by quarter" / "quarterly" → add quarter dimension ──────────────────────
  if (/\bby quarter\b|\bquarterly\b/i.test(q)) {
    next.dimensions = next.dimensions || [];
    if (!next.dimensions.find((d) => d.field === "order_date")) {
      next.dimensions.push({ field: "order_date", granularity: "quarter" });
    }
  }

  // ── "for 2025" / "in 2025" → add/replace year filter ───────────────────────
  const yearMatch = q.match(/\b(for|in|during)\s+(20\d\d)\b/i);
  if (yearMatch) {
    const year = yearMatch[2];
    next.filters = (next.filters || []).filter((f) => f.field !== "order_date");
    next.filters.push({
      field: "order_date",
      operator: "between",
      value: `${year}-01-01,${year}-12-31`,
    });
  }

  // ── "top N" / "show top N" → sort desc + limit ──────────────────────────────
  const topMatch = q.match(/\btop\s+(\d+)\b/i);
  if (topMatch) {
    const n = parseInt(topMatch[1], 10);
    next.limit = n;
    // Sort by the first metric alias or field
    const firstMetric = next.metrics?.[0];
    if (firstMetric) {
      next.sort = { field: firstMetric.alias || firstMetric.field, direction: "desc" };
    }
  }

  // ── "bottom N" → sort asc + limit ───────────────────────────────────────────
  const bottomMatch = q.match(/\bbottom\s+(\d+)\b/i);
  if (bottomMatch) {
    const n = parseInt(bottomMatch[1], 10);
    next.limit = n;
    const firstMetric = next.metrics?.[0];
    if (firstMetric) {
      next.sort = { field: firstMetric.alias || firstMetric.field, direction: "asc" };
    }
  }

  // ── "remove the date filter" / "remove filter" ──────────────────────────────
  if (/\bremove\b.*\bdate\b|\bremove\b.*\bfilter\b/i.test(q)) {
    next.filters = (next.filters || []).filter((f) => f.field !== "order_date");
  }

  // ── "only [category]" / "just [category]" ───────────────────────────────────
  const catMatch = q.match(/\b(?:only|just|for)\s+(electronics|clothing|home\s*(?:&|and)\s*kitchen|office)\b/i);
  if (catMatch) {
    const cat = normaliseCat(catMatch[1]);
    next.filters = (next.filters || []).filter((f) => f.field !== "category");
    next.filters.push({ field: "category", operator: "eq", value: cat });
  }

  // ── "only [region]" ──────────────────────────────────────────────────────────
  const regMatch = q.match(/\b(?:only|just|for)\s+(north|south|east|west)\b/i);
  if (regMatch) {
    const region = regMatch[1].charAt(0).toUpperCase() + regMatch[1].slice(1).toLowerCase();
    next.filters = (next.filters || []).filter((f) => f.field !== "region");
    next.filters.push({ field: "region", operator: "eq", value: region });
  }

  next.confidence = 0.9;
  return next;
}

function normaliseCat(raw) {
  const map = {
    electronics: "Electronics",
    clothing: "Clothing",
    office: "Office",
  };
  const key = raw.toLowerCase().replace(/\s*(?:&|and)\s*/g, " & ").trim();
  if (key.includes("home")) return "Home & Kitchen";
  return map[key] || raw;
}

// ── Fresh query matcher ───────────────────────────────────────────────────────

function freshQuery(question) {
  const q = question.toLowerCase();

  if ((q.includes("revenue") || q.includes("sales") || q.includes("total")) &&
      (q.includes("category") || q.includes("categor"))) {
    return {
      collection: "orders",
      metrics: [{ field: "total_amount", operation: "sum", alias: "total_revenue" }],
      dimensions: [{ field: "category" }],
      sort: { field: "total_revenue", direction: "desc" },
      limit: 10,
      confidence: 0.9,
    };
  }

  if (q.includes("average") && q.includes("order") && q.includes("category")) {
    return {
      collection: "orders",
      metrics: [{ field: "total_amount", operation: "average", alias: "avg_order_value" }],
      dimensions: [{ field: "category" }],
      sort: { field: "avg_order_value", direction: "desc" },
      limit: 10,
      confidence: 0.9,
    };
  }

  if ((q.includes("month") || q.includes("trend") || q.includes("over time")) &&
      (q.includes("order") || q.includes("revenue") || q.includes("sales"))) {
    return {
      collection: "orders",
      metrics: [
        { field: "total_amount", operation: "sum", alias: "total_revenue" },
        { field: "_id", operation: "count", alias: "order_count" },
      ],
      dimensions: [{ field: "order_date", granularity: "month" }],
      sort: { field: "order_date", direction: "asc" },
      limit: 24,
      confidence: 0.9,
    };
  }

  if (q.includes("top") && (q.includes("product") || q.includes("item"))) {
    const topN = q.match(/top\s+(\d+)/i);
    return {
      collection: "orders",
      metrics: [
        { field: "total_amount", operation: "sum", alias: "total_revenue" },
        { field: "_id", operation: "count", alias: "order_count" },
      ],
      dimensions: [{ field: "product" }],
      sort: { field: "total_revenue", direction: "desc" },
      limit: topN ? parseInt(topN[1], 10) : 10,
      confidence: 0.9,
    };
  }

  if (q.includes("region")) {
    return {
      collection: "orders",
      metrics: [
        { field: "total_amount", operation: "sum", alias: "total_revenue" },
        { field: "_id", operation: "count", alias: "order_count" },
      ],
      dimensions: [{ field: "region" }],
      sort: { field: "total_revenue", direction: "desc" },
      limit: 10,
      confidence: 0.9,
    };
  }

  if (q.includes("how many") || (q.includes("count") && q.includes("order"))) {
    return {
      collection: "orders",
      metrics: [{ field: "_id", operation: "count", alias: "order_count" }],
      dimensions: [],
      limit: 1,
      confidence: 0.9,
    };
  }

  if (q.includes("customer") && (q.includes("count") || q.includes("how many") || q.includes("total"))) {
    return {
      collection: "customers",
      metrics: [{ field: "_id", operation: "count", alias: "customer_count" }],
      dimensions: [],
      limit: 1,
      confidence: 0.9,
    };
  }

  if (q.includes("status")) {
    return {
      collection: "orders",
      metrics: [
        { field: "total_amount", operation: "sum", alias: "total_revenue" },
        { field: "_id", operation: "count", alias: "order_count" },
      ],
      dimensions: [{ field: "status" }],
      sort: { field: "total_revenue", direction: "desc" },
      limit: 10,
      confidence: 0.9,
    };
  }

  // Default: total revenue summary
  return {
    collection: "orders",
    metrics: [
      { field: "total_amount", operation: "sum", alias: "total_revenue" },
      { field: "_id", operation: "count", alias: "order_count" },
    ],
    dimensions: [],
    limit: 1,
    confidence: 0.85,
  };
}

// ── Public entry point ────────────────────────────────────────────────────────

function mockInterpretQuery(question, previousQuery = null) {
  // Try follow-up path first when there's previous context
  if (previousQuery) {
    const followUp = applyFollowUp(question, previousQuery);
    if (followUp) {
      console.log("[MOCK AI] Applied follow-up modification");
      return followUp;
    }
  }
  // Otherwise treat as a fresh query
  return freshQuery(question);
}

module.exports = { mockInterpretQuery };
