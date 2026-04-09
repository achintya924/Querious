const genAI = require("../../config/gemini");
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

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: NARRATIVE_SYSTEM_PROMPT,
      generationConfig: { temperature: 0.7, maxOutputTokens: 300 },
    });

    const prompt = `User question: "${question}"

Query parameters:
- Collection: ${structuredQuery.collection}
- Metrics: ${JSON.stringify(structuredQuery.metrics)}
- Dimensions: ${JSON.stringify(structuredQuery.dimensions || [])}
- Filters: ${JSON.stringify(structuredQuery.filters || [])}
- Chart type: ${typeof chartType === "object" ? chartType.type : chartType}

Result data (${results.length} rows):
${JSON.stringify(results, null, 2)}

Write the business insight narrative now.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
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
