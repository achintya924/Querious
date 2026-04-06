const mongoose = require("mongoose");

const bookmarkSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  query_id: { type: mongoose.Schema.Types.ObjectId, ref: "QueryHistory", required: true },
  label: { type: String, trim: true },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Bookmark", bookmarkSchema);
