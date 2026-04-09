const aiClient = require("../../config/aiClient");
const { NARRATIVE_SYSTEM_PROMPT } = require("./promptTemplates");

/**
 * Generate a 2-3 sentence business narrative for the query results.
 * Falls back gracefully — never throws to the caller.
 */
async function generateNarrative(question, results, structuredQuery, chartType) {
  try {
    if (!results || results.length === 0) {
      return "No data matched your query for the selected filters.";
    }

    if (process.env.MOCK_AI === "true") {
      return fallback(results);
    }

    const userPrompt = `User question: "${question}"

Query parameters:
- Collection: ${structuredQuery.collection}
- Metrics: ${JSON.stringify(structuredQuery.metrics)}
- Dimensions: ${JSON.stringify(structuredQuery.dimensions || [])}
- Filters: ${JSON.stringify(structuredQuery.filters || [])}
- Chart type: ${typeof chartType === "object" ? chartType.type : chartType}

Result data (${results.length} rows):
${JSON.stringify(results, null, 2)}

Write the business insight narrative now.`;

    const response = await aiClient.chat.completions.create({
      model: process.env.AI_MODEL,
      temperature: 0.7,
      max_tokens: 300,
      messages: [
        { role: "system", content: NARRATIVE_SYSTEM_PROMPT },
        { role: "user",   content: userPrompt },
      ],
    });

    const text = response.choices?.[0]?.message?.content?.trim();
    return text || fallback(results);
  } catch (err) {
    console.warn("Narrative generation failed:", err.message);
    return fallback(results);
  }
}

function fallback(results) {
  return `Query executed successfully. ${results.length} result${results.length !== 1 ? "s" : ""} returned.`;
}

module.exports = { generateNarrative };
