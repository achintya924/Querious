const { interpretQuery }    = require("../services/ai/interpreter");
const { generateNarrative } = require("../services/ai/narrator");
const { resolveDates }      = require("../services/query/dateResolver");
const { validateQuery }     = require("../services/query/schemaValidator");
const { buildPipeline }     = require("../services/query/pipelineBuilder");
const { recommendChart }    = require("../services/query/chartRecommender");
const QueryHistory          = require("../models/QueryHistory");
const Order                 = require("../models/Order");
const Customer              = require("../models/Customer");
const Product               = require("../models/Product");

const MODEL_MAP = { orders: Order, customers: Customer, products: Product };

async function processQuery(req, res) {
  const start = Date.now();
  const { question, sessionId } = req.body;

  if (!question || typeof question !== "string" || !question.trim()) {
    return res.status(400).json({ success: false, error: "question is required and must be a non-empty string" });
  }

  try {
    // ── 1. Interpret: NL → structured JSON via Gemini ──────────────────────────
    const structuredQuery = await interpretQuery(question.trim());

    // ── 2. Clarification needed? ────────────────────────────────────────────────
    if ((structuredQuery.confidence ?? 1) < 0.7) {
      return res.json({
        success: true,
        type: "clarification",
        message: structuredQuery.clarification_needed || "Could you clarify what you're looking for?",
      });
    }

    // ── 3. Resolve relative date expressions ────────────────────────────────────
    if (structuredQuery.filters) {
      structuredQuery.filters = resolveDates(structuredQuery.filters);
    }

    // ── 4. Schema validation ────────────────────────────────────────────────────
    const validation = validateQuery(structuredQuery);
    if (!validation.valid) {
      return res.status(422).json({ success: false, error: validation.error });
    }
    const cleanedQuery = validation.query;

    // ── 5. Build aggregation pipeline ───────────────────────────────────────────
    const pipeline = buildPipeline(cleanedQuery);

    // ── 6. Execute against MongoDB ──────────────────────────────────────────────
    const Model = MODEL_MAP[cleanedQuery.collection];
    const results = await Model.aggregate(pipeline);

    // ── 7. Chart recommendation (now returns an object) ─────────────────────────
    const chartType = recommendChart(cleanedQuery, results);

    // ── 8. Narrative generation (non-blocking — falls back on error) ────────────
    const narrative = await generateNarrative(question.trim(), results, cleanedQuery, chartType);

    // ── 9. Persist to query history ─────────────────────────────────────────────
    const latency_ms = Date.now() - start;
    await QueryHistory.create({
      user_id:              req.user.userId,
      session_id:           sessionId || undefined,
      natural_query:        question.trim(),
      structured_params:    cleanedQuery,
      aggregation_pipeline: pipeline,
      result_data:          results,
      chart_type:           chartType.type,
      narrative,
      latency_ms,
    });

    // ── 10. Respond ──────────────────────────────────────────────────────────────
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
      },
    });
  } catch (err) {
    console.error("Query pipeline error:", err);
    return res.status(500).json({ success: false, error: err.message || "Query processing failed" });
  }
}

module.exports = { processQuery };
