import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteQuery } from "../../services/historyService";
import { addBookmark, removeBookmarkByQueryId } from "../../services/bookmarkService";
import { useToast } from "../../context/ToastContext";

const CHART_ICONS = {
  bar_chart:         "▊",
  line_chart:        "↗",
  pie_chart:         "◔",
  metric_card:       "#",
  grouped_bar_chart: "▊▊",
  stacked_bar_chart: "▊",
  table:             "☰",
};

function relativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)  return "Just now";
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Yesterday";
  if (d < 7)   return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function QueryCard({ query, bookmarkId: initialBookmarkId, onDeleted, onBookmarkChange }) {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [bookmarkId, setBookmarkId]       = useState(initialBookmarkId || null);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting]           = useState(false);

  async function handleBookmarkToggle(e) {
    e.stopPropagation();
    if (bookmarkLoading) return;
    setBookmarkLoading(true);
    try {
      if (bookmarkId) {
        await removeBookmarkByQueryId(query._id);
        setBookmarkId(null);
        addToast("Bookmark removed", "info");
        onBookmarkChange?.(query._id, null);
      } else {
        const res = await addBookmark(query._id);
        setBookmarkId(res.bookmark._id);
        addToast("Query bookmarked", "success");
        onBookmarkChange?.(query._id, res.bookmark._id);
      }
    } catch {
      addToast("Failed to update bookmark", "error");
    } finally {
      setBookmarkLoading(false);
    }
  }

  async function handleDelete(e) {
    e.stopPropagation();
    if (!deleteConfirm) { setDeleteConfirm(true); return; }
    setDeleting(true);
    try {
      await deleteQuery(query._id);
      addToast("Query deleted", "info");
      onDeleted?.(query._id);
    } catch {
      addToast("Failed to delete query", "error");
      setDeleting(false);
      setDeleteConfirm(false);
    }
  }

  function handleRerun(e) {
    e.stopPropagation();
    navigate("/dashboard", { state: { rerunQuestion: query.natural_query } });
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 hover:border-gray-300 hover:shadow-sm transition-all group">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-start gap-2 min-w-0">
          {/* Chart type icon */}
          <span className="mt-0.5 text-xs font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
            {CHART_ICONS[query.chart_type] || "?"}
          </span>
          <p className="text-sm font-medium text-gray-800 leading-snug line-clamp-2">
            {query.natural_query}
          </p>
        </div>

        {/* Bookmark */}
        <button
          onClick={handleBookmarkToggle}
          disabled={bookmarkLoading}
          title={bookmarkId ? "Remove bookmark" : "Bookmark this query"}
          className="shrink-0 text-lg leading-none transition-colors disabled:opacity-50"
        >
          {bookmarkId ? (
            <span className="text-amber-400">★</span>
          ) : (
            <span className="text-gray-300 hover:text-amber-400">☆</span>
          )}
        </button>
      </div>

      {/* Narrative */}
      {query.narrative && (
        <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">
          {query.narrative}
        </p>
      )}

      {/* Footer row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{relativeTime(query.created_at)}</span>
          {query.latency_ms != null && (
            <span className="text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full">
              {(query.latency_ms / 1000).toFixed(1)}s
            </span>
          )}
          <span className="text-xs text-gray-300 capitalize">
            {query.chart_type?.replace(/_/g, " ")}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleRerun}
            className="text-xs text-violet-600 hover:bg-violet-50 px-2 py-1 rounded-lg transition-colors font-medium"
          >
            Re-run
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className={`text-xs px-2 py-1 rounded-lg transition-colors font-medium ${
              deleteConfirm
                ? "text-white bg-red-500 hover:bg-red-600"
                : "text-gray-400 hover:text-red-500 hover:bg-red-50"
            }`}
            onBlur={() => setTimeout(() => setDeleteConfirm(false), 200)}
          >
            {deleteConfirm ? "Confirm" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
