import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getBookmarks, removeBookmark, updateBookmarkLabel } from "../../services/bookmarkService";
import { useToast } from "../../context/ToastContext";

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

function BookmarkCard({ bookmark, onRemoved }) {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelValue, setLabelValue]     = useState(bookmark.label);
  const [saving, setSaving]             = useState(false);
  const query = bookmark.query_id;

  async function handleLabelSave() {
    if (!labelValue.trim() || labelValue === bookmark.label) {
      setEditingLabel(false);
      setLabelValue(bookmark.label);
      return;
    }
    setSaving(true);
    try {
      await updateBookmarkLabel(bookmark._id, labelValue.trim());
      addToast("Label updated", "success");
      setEditingLabel(false);
    } catch {
      addToast("Failed to update label", "error");
      setLabelValue(bookmark.label);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    try {
      await removeBookmark(bookmark._id);
      addToast("Bookmark removed", "info");
      onRemoved(bookmark._id);
    } catch {
      addToast("Failed to remove bookmark", "error");
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 hover:border-gray-300 hover:shadow-sm transition-all group">
      {/* Label row */}
      <div className="flex items-start gap-2 mb-2">
        <span className="text-amber-400 text-lg leading-none shrink-0 mt-0.5">★</span>
        {editingLabel ? (
          <input
            autoFocus
            value={labelValue}
            onChange={(e) => setLabelValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleLabelSave();
              if (e.key === "Escape") { setEditingLabel(false); setLabelValue(bookmark.label); }
            }}
            onBlur={handleLabelSave}
            disabled={saving}
            className="flex-1 text-sm font-medium text-gray-800 border-b border-violet-400 outline-none bg-transparent pb-0.5"
          />
        ) : (
          <p
            className="flex-1 text-sm font-medium text-gray-800 leading-snug cursor-pointer hover:text-violet-600 transition-colors"
            onClick={() => setEditingLabel(true)}
            title="Click to edit label"
          >
            {labelValue}
          </p>
        )}
      </div>

      {/* Original question if different from label */}
      {query?.natural_query && query.natural_query !== labelValue && (
        <p className="text-xs text-gray-400 mb-2 ml-6 italic">"{query.natural_query}"</p>
      )}

      {/* Narrative */}
      {query?.narrative && (
        <p className="text-xs text-gray-500 line-clamp-2 mb-3 ml-6 leading-relaxed">
          {query.narrative}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between ml-6">
        <span className="text-xs text-gray-400">{relativeTime(bookmark.created_at)}</span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => navigate("/dashboard", { state: { rerunQuestion: query?.natural_query } })}
            className="text-xs text-violet-600 hover:bg-violet-50 px-2 py-1 rounded-lg transition-colors font-medium"
          >
            Re-run
          </button>
          <button
            onClick={handleRemove}
            className="text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BookmarksPanel() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading]     = useState(true);
  const { addToast }              = useToast();

  useEffect(() => {
    getBookmarks()
      .then((res) => setBookmarks(res.bookmarks || []))
      .catch(() => addToast("Failed to load bookmarks", "error"))
      .finally(() => setLoading(false));
  }, []);

  function handleRemoved(id) {
    setBookmarks((prev) => prev.filter((b) => b._id !== id));
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="text-5xl mb-4">☆</span>
        <p className="text-sm font-medium text-gray-500 mb-1">No bookmarks yet</p>
        <p className="text-xs text-gray-400">Star a query to save it here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bookmarks.map((b) => (
        <BookmarkCard key={b._id} bookmark={b} onRemoved={handleRemoved} />
      ))}
    </div>
  );
}
