const { interpretQuery }    = require("../services/ai/interpreter");
const { generateNarrative } = require("../services/ai/narrator");
const { resolveDates }      = require("../services/query/dateResolver");
const { validateQuery }     = require("../services/query/schemaValidator");
const { buildPipeline }     = require("../services/query/pipelineBuilder");
const { recommendChart }    = require("../services/query/chartRecommender");
const { createSession, getSession, updateSession } = require("../services/session/sessionManager");
const { getCachedResult, setCachedResult } = require("../services/cache/queryCache");
const QueryHistory = require("../models/QueryHistory");
const Order        = require("../models/Order");
const Customer     = require("../models/Customer");
const Product      = require("../models/Product");

const MODEL_MAP = { orders: Order, customers: Customer, products: Product };
const isDev = process.env.NODE_ENV !== "production";

async function processQuery(req, res) {
  const start = Date.now();
  const { question, sessionId: incomingSessionId } = req.body;

  if (!question || typeof question !== "string" || !question.trim()) {
    return res.status(400).json({ success: false, error: "question is required and must be a non-empty string" });
  }

  const trimmedQuestion = question.trim();

  try {
    // ── 1. Resolve session & conversation context ────────────────────────────
    let sessionId = incomingSessionId || null;
    let previousQuery = null;
    let conversationHistory = [];
    const isFollowUp = Boolean(sessionId);

    if (sessionId) {
      const session = await getSession(sessionId);
      if (session && !session.ended_at) {
        conversationHistory = session.conversation_context || [];
        const lastEntry = conversationHistory[conversationHistory.length - 1];
        previousQuery = lastEntry?.structuredQuery || null;
      } else {
        sessionId = null;
      }
    }

    if (!sessionId) {
      sessionId = await createSession(req.user.userId);
    }

    // ── 2. Cache check (skip for follow-ups — context changes the answer) ────
    if (!isFollowUp) {
      const cached = getCachedResult(trimmedQuestion, req.user.userId);
      if (cached) {
        if (isDev) console.log(`[CACHE HIT] "${trimmedQuestion}"`);
        return res.json({
          success: true,
          type: "result",
          cached: true,
          data: { ...cached, sessionId, executionTime: Date.now() - start },
        });
      }
      if (isDev) console.log(`[CACHE MISS] "${trimmedQuestion}"`);
    }

    // ── 3. Interpret ─────────────────────────────────────────────────────────
    const structuredQuery = await interpretQuery(trimmedQuestion, previousQuery, conversationHistory);

    // ── 4. Clarification needed? ─────────────────────────────────────────────
    if ((structuredQuery.confidence ?? 1) < 0.7) {
      return res.json({
        success: true,
        type: "clarification",
        message: structuredQuery.clarification_needed || "Could you clarify what you're looking for?",
        data: { sessionId },
      });
    }

    // ── 5. Resolve relative date expressions ─────────────────────────────────
    if (structuredQuery.filters) {
      structuredQuery.filters = resolveDates(structuredQuery.filters);
    }

    // ── 6. Schema validation ──────────────────────────────────────────────────
    const validation = validateQuery(structuredQuery);
    if (!validation.valid) {
      return res.status(422).json({ success: false, error: validation.error });
    }
    const cleanedQuery = validation.query;

    // ── 7. Build pipeline ────────────────────────────────────────────────────
    const pipeline = buildPipeline(cleanedQuery);

    // ── 8. Execute ───────────────────────────────────────────────────────────
    const Model   = MODEL_MAP[cleanedQuery.collection];
    const results = await Model.aggregate(pipeline);

    // ── 9. Chart + narrative ──────────────────────────────────────────────────
    const chartType = recommendChart(cleanedQuery, results);
    const narrative = await generateNarrative(trimmedQuestion, results, cleanedQuery, chartType);

    // ── 10. Persist to history ───────────────────────────────────────────────
    const latency_ms = Date.now() - start;
    const historyDoc = await QueryHistory.create({
      user_id:              req.user.userId,
      session_id:           sessionId,
      natural_query:        trimmedQuestion,
      structured_params:    cleanedQuery,
      aggregation_pipeline: pipeline,
      result_data:          results,
      chart_type:           chartType.type,
      narrative,
      latency_ms,
    });

    // ── 11. Update session ────────────────────────────────────────────────────
    await updateSession(sessionId, { question: trimmedQuestion, structuredQuery: cleanedQuery });

    // ── 12. Cache the result (non-follow-up only) ────────────────────────────
    if (!isFollowUp) {
      setCachedResult(trimmedQuestion, req.user.userId, {
        results,
        chartType,
        narrative,
        structuredQuery: cleanedQuery,
        pipeline,
        queryHistoryId: historyDoc._id.toString(),
      });
    }

    // ── 13. Respond ───────────────────────────────────────────────────────────
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
        queryHistoryId: historyDoc._id.toString(),
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
