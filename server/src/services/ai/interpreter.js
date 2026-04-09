const genAI = require("../../config/gemini");
const { queryDatabaseFunction } = require("./functionSchema");
const { QUERY_SYSTEM_PROMPT } = require("./promptTemplates");
const { mockInterpretQuery } = require("./mockInterpreter");
const { mergeContext } = require("../query/contextMerger");

function extractRetrySeconds(err) {
  const msg = err?.message || "";
  // "Please retry in 37.4s" — grab the integer before optional decimal
  const retryMatch = msg.match(/retry in (\d+)(?:\.\d+)?s/i);
  if (retryMatch) return parseInt(retryMatch[1], 10);
  // JSON field: "retryDelay":"37s"
  const delayMatch = msg.match(/"retryDelay"\s*:\s*"(\d+)s"/);
  if (delayMatch) return parseInt(delayMatch[1], 10);
  return null;
}

function isRateLimitError(err) {
  return (
    err?.status === 429 ||
    err?.message?.includes("429") ||
    err?.message?.includes("Too Many Requests") ||
    err?.message?.includes("Quota exceeded")
  );
}

/**
 * @param {string} question
 * @param {object|null} previousQuery        - Structured query from last turn (or null)
 * @param {Array}       conversationHistory  - Array of { question, structuredQuery }
 */
async function interpretQuery(question, previousQuery = null, conversationHistory = []) {
  // ── Mock mode ────────────────────────────────────────────────────────────────
  if (process.env.MOCK_AI === "true") {
    console.log("[MOCK AI] Interpreting:", question);
    return mockInterpretQuery(question, previousQuery);
  }

  // ── Build prompt (with context if available) ─────────────────────────────────
  const prompt = mergeContext(question, previousQuery, conversationHistory);

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: QUERY_SYSTEM_PROMPT,
    tools: [{ functionDeclarations: [queryDatabaseFunction] }],
    toolConfig: { functionCallingConfig: { mode: "ANY" } },
    generationConfig: { temperature: 0 },
  });

  let result;
  try {
    result = await model.generateContent(prompt);
  } catch (err) {
    if (isRateLimitError(err)) {
      const retry = extractRetrySeconds(err);
      const msg = retry
        ? `AI service is rate-limited. Please try again in ${retry} seconds.`
        : "AI service is rate-limited. Please try again in a moment.";
      const rateLimitErr = new Error(msg);
      rateLimitErr.statusCode = 429;
      throw rateLimitErr;
    }
    throw err;
  }

  const candidates = result.response.candidates;
  if (!candidates || candidates.length === 0) {
    throw new Error("Gemini returned no candidates");
  }

  const parts = candidates[0].content.parts;
  const fcPart = parts.find((p) => p.functionCall);

  if (!fcPart) {
    throw new Error(
      "Gemini did not return a function call. Response text: " +
        (parts.find((p) => p.text)?.text || "(none)")
    );
  }

  if (fcPart.functionCall.name !== "query_database") {
    throw new Error(`Unexpected function call: ${fcPart.functionCall.name}`);
  }

  return fcPart.functionCall.args;
}

module.exports = { interpretQuery };
