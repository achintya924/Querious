const Bookmark     = require("../models/Bookmark");
const QueryHistory = require("../models/QueryHistory");

async function addBookmark(req, res) {
  try {
    const { queryId, label } = req.body;
    if (!queryId) return res.status(400).json({ success: false, error: "queryId is required" });

    // Verify the query exists and belongs to this user
    const query = await QueryHistory.findOne({ _id: queryId, user_id: req.user.userId }).lean();
    if (!query) return res.status(404).json({ success: false, error: "Query not found" });

    // Prevent duplicates
    const existing = await Bookmark.findOne({ user_id: req.user.userId, query_id: queryId }).lean();
    if (existing) {
      return res.status(409).json({ success: false, error: "Already bookmarked", bookmark: existing });
    }

    const bookmark = await Bookmark.create({
      user_id:  req.user.userId,
      query_id: queryId,
      label:    label?.trim() || query.natural_query,
    });

    return res.status(201).json({ success: true, bookmark });
  } catch (err) {
    console.error("addBookmark error:", err);
    return res.status(500).json({ success: false, error: "Failed to create bookmark" });
  }
}

async function getBookmarks(req, res) {
  try {
    const bookmarks = await Bookmark.find({ user_id: req.user.userId })
      .populate("query_id", "natural_query chart_type narrative created_at latency_ms")
      .sort({ created_at: -1 })
      .lean();

    return res.json({ success: true, bookmarks });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to fetch bookmarks" });
  }
}

async function updateBookmark(req, res) {
  try {
    const { label } = req.body;
    if (!label?.trim()) return res.status(400).json({ success: false, error: "label is required" });

    const bookmark = await Bookmark.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user.userId },
      { label: label.trim() },
      { new: true }
    );
    if (!bookmark) return res.status(404).json({ success: false, error: "Bookmark not found" });

    return res.json({ success: true, bookmark });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to update bookmark" });
  }
}

async function removeBookmark(req, res) {
  try {
    const result = await Bookmark.findOneAndDelete({
      _id: req.params.id,
      user_id: req.user.userId,
    });
    if (!result) return res.status(404).json({ success: false, error: "Bookmark not found" });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to remove bookmark" });
  }
}

async function removeBookmarkByQueryId(req, res) {
  try {
    const result = await Bookmark.findOneAndDelete({
      query_id: req.params.queryId,
      user_id:  req.user.userId,
    });
    if (!result) return res.status(404).json({ success: false, error: "Bookmark not found" });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to remove bookmark" });
  }
}

module.exports = { addBookmark, getBookmarks, updateBookmark, removeBookmark, removeBookmarkByQueryId };
