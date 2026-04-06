const mongoose = require("mongoose");

const queryHistorySchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  session_id: { type: mongoose.Schema.Types.ObjectId, ref: "Session" },
  natural_query: { type: String, required: true },
  structured_params: { type: mongoose.Schema.Types.Mixed },
  aggregation_pipeline: { type: mongoose.Schema.Types.Mixed },
  result_data: { type: mongoose.Schema.Types.Mixed },
  chart_type: { type: String },
  narrative: { type: String },
  latency_ms: { type: Number },
  created_at: { type: Date, default: Date.now },
});

queryHistorySchema.index({ user_id: 1, created_at: -1 });

module.exports = mongoose.model("QueryHistory", queryHistorySchema);
