const { interpretQuery }    = require("../services/ai/interpreter");
const { generateNarrative } = require("../services/ai/narrator");
const { resolveDates }      = require("../services/query/dateResolver");
const { validateQuery }     = require("../services/query/schemaValidator");
const { buildPipeline }     = require("../services/query/pipelineBuilder");
const { recommendChart }    = require("../services/query/chartRecommender");
const { createSession, getSession, updateSession } = require("../services/session/sessionManager");
const QueryHistory          = require("../models/QueryHistory");
const Order                 = require("../models/Order");
const Customer              = require("../models/Customer");
const Product               = require("../models/Product");

const MODEL_MAP = { orders: Order, customers: Customer, products: Product };

async function processQuery(req, res) {
  const start = Date.now();
  const { question, sessionId: incomingSessionId } = req.body;

  if (!question || typeof question !== "string" || !question.trim()) {
    return res.status(400).json({ success: false, error: "question is required and must be a non-empty string" });
  }

  try {
    // ── 1. Resolve session & conversation context ────────────────────────────
    let sessionId = incomingSessionId || null;
    let previousQuery = null;
    let conversationHistory = [];

    if (sessionId) {
      const session = await getSession(sessionId);
      if (session && !session.ended_at) {
        conversationHistory = session.conversation_context || [];
        const lastEntry = conversationHistory[conversationHistory.length - 1];
        previousQuery = lastEntry?.structuredQuery || null;
      } else {
        // Session not found or ended — start fresh
        sessionId = null;
      }
    }

    // Auto-create session if none provided or session was invalid
    if (!sessionId) {
      sessionId = await createSession(req.user.userId);
    }

    // ── 2. Interpret: NL → structured JSON via Gemini ────────────────────────
    const structuredQuery = await interpretQuery(question.trim(), previousQuery, conversationHistory);

    // ── 3. Clarification needed? ─────────────────────────────────────────────
    if ((structuredQuery.confidence ?? 1) < 0.7) {
      return res.json({
        success: true,
        type: "clarification",
        message: structuredQuery.clarification_needed || "Could you clarify what you're looking for?",
        data: { sessionId },
      });
    }

    // ── 4. Resolve relative date expressions ─────────────────────────────────
    if (structuredQuery.filters) {
      structuredQuery.filters = resolveDates(structuredQuery.filters);
    }

    // ── 5. Schema validation ──────────────────────────────────────────────────
    const validation = validateQuery(structuredQuery);
    if (!validation.valid) {
      return res.status(422).json({ success: false, error: validation.error });
    }
    const cleanedQuery = validation.query;

    // ── 6. Build aggregation pipeline ────────────────────────────────────────
    const pipeline = buildPipeline(cleanedQuery);

    // ── 7. Execute against MongoDB ────────────────────────────────────────────
    const Model = MODEL_MAP[cleanedQuery.collection];
    const results = await Model.aggregate(pipeline);

    // ── 8. Chart recommendation ───────────────────────────────────────────────
    const chartType = recommendChart(cleanedQuery, results);

    // ── 9. Narrative generation ───────────────────────────────────────────────
    const narrative = await generateNarrative(question.trim(), results, cleanedQuery, chartType);

    // ── 10. Persist to query history ──────────────────────────────────────────
    const latency_ms = Date.now() - start;
    await QueryHistory.create({
      user_id:              req.user.userId,
      session_id:           sessionId,
      natural_query:        question.trim(),
      structured_params:    cleanedQuery,
      aggregation_pipeline: pipeline,
      result_data:          results,
      chart_type:           chartType.type,
      narrative,
      latency_ms,
    });

    // ── 11. Update session context ────────────────────────────────────────────
    await updateSession(sessionId, { question: question.trim(), structuredQuery: cleanedQuery });

    // ── 12. Respond ───────────────────────────────────────────────────────────
    return res.json({
      success: true,
      type: "result",
      data: {
        results,
        chartType,
        narrative,
        structuredQuery: cleanedQuery,
        pipeline,
        executionTime: latency_ms,
        sessionId,
      },
    });
  } catch (err) {
    const status = err.statusCode || 500;
    if (status !== 500) {
      return res.status(status).json({ success: false, error: err.message });
    }
    console.error("Query pipeline error:", err);
    return res.status(500).json({ success: false, error: "Query processing failed. Please try again." });
  }
}

module.exports = { processQuery };
