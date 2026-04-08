import { useState } from "react";
import { useConversationContext } from "../../context/ConversationContext";
import NarrativeBox   from "./NarrativeBox";
import DataTable      from "./DataTable";
import LoadingSkeleton from "./LoadingSkeleton";
import ChartRenderer  from "./ChartRenderer";

const VIEW_OPTIONS = ["Both", "Chart", "Table"];

export default function VisualizationPanel() {
  const { currentResult, loading, error } = useConversationContext();
  const [view, setView] = useState("Both");

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="h-full overflow-y-auto">
        <LoadingSkeleton />
      </div>
    );
  }

  // ── Error (no result available) ──────────────────────────────────────────
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

  // ── Empty state ──────────────────────────────────────────────────────────
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

  const { data } = currentResult;
  const { results, chartType, narrative, structuredQuery } = data;
  const chartTypeObj = typeof chartType === "string" ? { type: chartType } : chartType;
  const isMetricCard = chartTypeObj?.type === "metric_card";
  const isTable      = chartTypeObj?.type === "table";
  const isEmptyState = chartTypeObj?.type === "empty_state";

  // MetricCard and table don't need the Chart/Table toggle
  const showToggle = !isMetricCard && !isTable && !isEmptyState && results?.length > 0;

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* ── Header row: title + type badge + view toggle ── */}
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

        {showToggle && (
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5 shrink-0">
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
