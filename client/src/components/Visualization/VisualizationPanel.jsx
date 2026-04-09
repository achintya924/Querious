import { useEffect, useState } from "react";
import { useConversationContext } from "../../context/ConversationContext";
import { addBookmark, removeBookmarkByQueryId } from "../../services/bookmarkService";
import { useToast } from "../../context/ToastContext";
import NarrativeBox    from "./NarrativeBox";
import DataTable       from "./DataTable";
import LoadingSkeleton from "./LoadingSkeleton";
import ChartRenderer   from "./ChartRenderer";

const VIEW_OPTIONS = ["Both", "Chart", "Table"];

function BookmarkButton({ queryHistoryId }) {
  const { addToast }                      = useToast();
  const [bookmarkId, setBookmarkId]       = useState(null);
  const [loading, setLoading]             = useState(false);

  // Reset whenever the displayed query changes
  useEffect(() => { setBookmarkId(null); }, [queryHistoryId]);

  if (!queryHistoryId) return null;

  async function handleToggle() {
    if (loading) return;
    setLoading(true);
    try {
      if (bookmarkId) {
        await removeBookmarkByQueryId(queryHistoryId);
        setBookmarkId(null);
        addToast("Bookmark removed", "info");
      } else {
        const res = await addBookmark(queryHistoryId);
        setBookmarkId(res.bookmark._id);
        addToast("Query bookmarked", "success");
      }
    } catch (err) {
      const msg = err.response?.data?.error;
      // Already bookmarked race condition
      if (err.response?.status === 409 && err.response?.data?.bookmark) {
        setBookmarkId(err.response.data.bookmark._id);
        addToast("Already bookmarked", "info");
      } else {
        addToast(msg || "Failed to update bookmark", "error");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      title={bookmarkId ? "Remove bookmark" : "Bookmark this query"}
      className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors disabled:opacity-50 hover:bg-gray-100"
    >
      <span className={`text-base leading-none transition-colors ${bookmarkId ? "text-amber-400" : "text-gray-300 hover:text-amber-400"}`}>
        {bookmarkId ? "★" : "☆"}
      </span>
      <span className="text-gray-400 hidden sm:inline text-[11px]">
        {bookmarkId ? "Saved" : "Save"}
      </span>
    </button>
  );
}

export default function VisualizationPanel() {
  const { currentResult, loading, error } = useConversationContext();
  const [view, setView] = useState("Both");

  // Reset view when result changes
  useEffect(() => { setView("Both"); }, [currentResult]);

  if (loading) {
    return <div className="h-full overflow-y-auto"><LoadingSkeleton /></div>;
  }

  if (error && !currentResult) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-red-500 text-xl">⚠</span>
          </div>
          <p className="text-sm text-red-600 font-medium mb-1">Query failed</p>
          <p className="text-xs text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!currentResult) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center max-w-xs">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-400">Your insights will appear here</p>
          <p className="text-xs text-gray-300 mt-1">Ask a question to get started</p>
        </div>
      </div>
    );
  }

  const { data }        = currentResult;
  const { results, chartType, narrative, structuredQuery, queryHistoryId } = data;
  const chartTypeObj    = typeof chartType === "string" ? { type: chartType } : chartType;
  const isMetricCard    = chartTypeObj?.type === "metric_card";
  const isTable         = chartTypeObj?.type === "table";
  const isEmptyState    = chartTypeObj?.type === "empty_state";
  const showToggle      = !isMetricCard && !isTable && !isEmptyState && results?.length > 0;

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* ── Header row ── */}
      <div className="flex items-start justify-between mb-4 gap-3">
        <div>
          {chartTypeObj?.title && (
            <h2 className="text-base font-semibold text-gray-800 leading-snug">
              {chartTypeObj.title}
            </h2>
          )}
          {chartTypeObj?.type && (
            <span className="text-xs text-gray-400 capitalize">
              {chartTypeObj.type.replace(/_/g, " ")}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Bookmark */}
          <BookmarkButton queryHistoryId={queryHistoryId} />

          {/* Chart/Table toggle */}
          {showToggle && (
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
              {VIEW_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setView(opt)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    view === opt
                      ? "bg-white text-gray-800 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── AI Narrative ── */}
      <NarrativeBox narrative={narrative} />

      {/* ── Chart ── */}
      {view !== "Table" && (
        <ChartRenderer
          chartType={chartTypeObj}
          results={results}
          structuredQuery={structuredQuery}
        />
      )}

      {/* ── Data Table ── */}
      {view !== "Chart" && results?.length > 0 && !isMetricCard && (
        <div className="mt-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Raw Data
          </p>
          <DataTable results={results} />
        </div>
      )}
    </div>
  );
}
