const aiClient = require("../../config/aiClient");
const { queryDatabaseFunction } = require("./functionSchema");
const { QUERY_SYSTEM_PROMPT } = require("./promptTemplates");
const { mockInterpretQuery } = require("./mockInterpreter");
const { mergeContext } = require("../query/contextMerger");

function isRateLimitError(err) {
  return (
    err?.status === 429 ||
    err?.message?.includes("429") ||
    err?.message?.includes("Too Many Requests") ||
    err?.message?.includes("rate limit") ||
    err?.message?.includes("Rate limit")
  );
}

/**
 * @param {string}      question
 * @param {object|null} previousQuery       - Structured query from last turn (or null)
 * @param {Array}       conversationHistory - Array of { question, structuredQuery }
 */
async function interpretQuery(question, previousQuery = null, conversationHistory = []) {
  // ── Mock mode ────────────────────────────────────────────────────────────────
  if (process.env.MOCK_AI === "true") {
    console.log("[MOCK AI] Interpreting:", question);
    return mockInterpretQuery(question, previousQuery);
  }

  // ── Build prompt (with follow-up context if available) ───────────────────────
  const userPrompt = mergeContext(question, previousQuery, conversationHistory);

  let response;
  try {
    response = await aiClient.chat.completions.create({
      model: process.env.AI_MODEL,
      temperature: 0,
      messages: [
        { role: "system", content: QUERY_SYSTEM_PROMPT },
        { role: "user",   content: userPrompt },
      ],
      tools: [queryDatabaseFunction],
      tool_choice: { type: "function", function: { name: "query_database" } },
    });
  } catch (err) {
    if (isRateLimitError(err)) {
      const rateLimitErr = new Error("AI service is rate-limited. Please try again in a moment.");
      rateLimitErr.statusCode = 429;
      throw rateLimitErr;
    }
    throw err;
  }

  const choice = response.choices?.[0];
  if (!choice) throw new Error("Grok returned no choices");

  const toolCalls = choice.message?.tool_calls;
  if (!toolCalls?.length) {
    throw new Error(
      "Grok did not return a function call. Response: " +
        (choice.message?.content || "(none)")
    );
  }

  const fn = toolCalls[0].function;
  if (fn.name !== "query_database") {
    throw new Error(`Unexpected function call: ${fn.name}`);
  }

  let args;
  try {
    args = JSON.parse(fn.arguments);
  } catch {
    throw new Error(`Failed to parse function arguments: ${fn.arguments}`);
  }

  return args;
}

module.exports = { interpretQuery };
