const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  conversation_context: [{ type: mongoose.Schema.Types.Mixed }],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  ended_at:  { type: Date, default: null },
});

sessionSchema.pre("save", function (next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model("Session", sessionSchema);
