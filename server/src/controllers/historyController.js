const QueryHistory = require("../models/QueryHistory");
const Bookmark     = require("../models/Bookmark");

async function getHistory(req, res) {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip  = (page - 1) * limit;

    const filter = { user_id: req.user.userId };
    if (req.query.search?.trim()) {
      filter.natural_query = { $regex: req.query.search.trim(), $options: "i" };
    }

    const [queries, total] = await Promise.all([
      QueryHistory.find(filter)
        .select("natural_query chart_type narrative latency_ms created_at")
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      QueryHistory.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      queries,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("getHistory error:", err);
    return res.status(500).json({ success: false, error: "Failed to fetch history" });
  }
}

async function getHistoryById(req, res) {
  try {
    const query = await QueryHistory.findOne({
      _id: req.params.id,
      user_id: req.user.userId,
    }).lean();

    if (!query) return res.status(404).json({ success: false, error: "Query not found" });
    return res.json({ success: true, query });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to fetch query" });
  }
}

async function deleteHistoryItem(req, res) {
  try {
    const result = await QueryHistory.findOneAndDelete({
      _id: req.params.id,
      user_id: req.user.userId,
    });
    if (!result) return res.status(404).json({ success: false, error: "Query not found" });

    // Clean up any bookmarks pointing to this query
    await Bookmark.deleteMany({ query_id: req.params.id, user_id: req.user.userId });

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to delete query" });
  }
}

async function clearHistory(req, res) {
  try {
    if (!req.body?.confirm) {
      return res.status(400).json({ success: false, error: "Send { confirm: true } to clear history" });
    }
    await QueryHistory.deleteMany({ user_id: req.user.userId });
    await Bookmark.deleteMany({ user_id: req.user.userId });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to clear history" });
  }
}

module.exports = { getHistory, getHistoryById, deleteHistoryItem, clearHistory };
