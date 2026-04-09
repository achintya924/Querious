/**
 * contextMerger.js
 *
 * Builds an enhanced prompt for Gemini when the user is asking a follow-up
 * question within the same session.  The prompt embeds the previous structured
 * query so Gemini can apply incremental modifications instead of starting
 * from scratch.
 */

/**
 * Returns an enhanced prompt string for Gemini that includes conversation
 * context, or null if this looks like a brand-new topic.
 *
 * @param {string} newQuestion          - The user's latest raw question.
 * @param {object|null} previousQuery   - Structured query from the last turn.
 * @param {Array}  conversationHistory  - Array of { question, structuredQuery } entries.
 * @returns {string}                    - The prompt to send to Gemini.
 */
function mergeContext(newQuestion, previousQuery, conversationHistory = []) {
  // If there is no previous query, return the question as-is — no context to merge.
  if (!previousQuery) return newQuestion;

  // Detect fresh-topic signals: these phrases strongly imply a new question,
  // not a refinement of the previous one.
  const freshTopicPatterns = [
    /^(show me|what is|what are|how many|list|give me|find|get)\s+(?!more|that|those|it|them)/i,
    /^(which|who|where|when)\s+(?!else)/i,
  ];

  // Detect follow-up signals: these phrases reference the previous result.
  const followUpPatterns = [
    /\b(break(?: it)? down by|split by|group by)\b/i,
    /\b(now|also|instead|but|just|only|add|remove|filter|change|update)\b/i,
    /\b(by (region|category|month|quarter|year|status|product|segment))\b/i,
    /\b(top\s+\d+|bottom\s+\d+|first\s+\d+|last\s+\d+)\b/i,
    /\b(for|in|during|within)\s+(20\d\d|q[1-4]|last|this|past)\b/i,
    /\b(sort|order|limit|ascending|descending|asc|desc)\b/i,
    /\b(more|that|those|it|them|same|previous|again)\b/i,
  ];

  const looksLikeFreshTopic =
    freshTopicPatterns.some((p) => p.test(newQuestion.trim())) &&
    !followUpPatterns.some((p) => p.test(newQuestion));

  if (looksLikeFreshTopic) return newQuestion;

  // Build the context block
  const prevSummary = summarisePreviousQuery(previousQuery);
  const recentHistory = buildHistoryBlock(conversationHistory);

  return `${recentHistory}PREVIOUS QUERY CONTEXT:
The user previously asked: "${conversationHistory.at(-1)?.question || "a data question"}"
That produced this structured query:
${JSON.stringify(previousQuery, null, 2)}
${prevSummary}

FOLLOW-UP QUESTION: "${newQuestion}"

INSTRUCTIONS:
- Treat the follow-up as a MODIFICATION of the previous query, not a brand new one.
- Start with the previous structured query as a baseline and apply only what changed.
- Examples of modifications to apply:
  * "by region" / "break down by region" → add { field: "region" } to dimensions
  * "by category" → add { field: "category" } to dimensions
  * "for 2025" / "in 2025" → add/replace date filter on order_date between 2025-01-01,2025-12-31
  * "top 5" / "show top 3" → set sort direction desc and limit to that number
  * "just for Electronics" / "only clothing" → add/replace category filter
  * "remove the date filter" → drop any order_date filters
  * "change to [region]" → replace the relevant filter value
  * "sort ascending" / "sort by asc" → change sort direction to asc
- If the follow-up is asking to change the chart type (e.g. "as a line chart"), still call query_database with the same query params — chart type selection is handled separately.
- If the follow-up is CLEARLY a completely new topic unrelated to ${previousQuery.collection}, treat it as a fresh query.
- Set confidence >= 0.85 for clear follow-ups.`;
}

/**
 * Returns a short human-readable summary of the previous query for the prompt.
 */
function summarisePreviousQuery(q) {
  const parts = [];
  parts.push(`Collection: ${q.collection}`);
  if (q.metrics?.length) {
    parts.push(`Metrics: ${q.metrics.map((m) => `${m.operation}(${m.field})`).join(", ")}`);
  }
  if (q.dimensions?.length) {
    parts.push(`Grouped by: ${q.dimensions.map((d) => d.field).join(", ")}`);
  }
  if (q.filters?.length) {
    parts.push(`Filters: ${q.filters.map((f) => `${f.field} ${f.operator} ${f.value}`).join(", ")}`);
  }
  if (q.sort) {
    parts.push(`Sorted by: ${q.sort.field} ${q.sort.direction}`);
  }
  if (q.limit) {
    parts.push(`Limit: ${q.limit}`);
  }
  return parts.length ? `Summary: ${parts.join(" | ")}` : "";
}

/**
 * Builds a compact conversation history block (last 3 turns max).
 */
function buildHistoryBlock(history) {
  if (!history?.length) return "";
  const recent = history.slice(-3);
  const lines = recent.map((h, i) => `Turn ${i + 1}: "${h.question}"`).join("\n");
  return `CONVERSATION HISTORY (most recent last):\n${lines}\n\n`;
}

module.exports = { mergeContext };
