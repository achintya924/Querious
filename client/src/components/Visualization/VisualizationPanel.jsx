import { useConversationContext } from "../../context/ConversationContext";
import NarrativeBox from "./NarrativeBox";
import DataTable from "./DataTable";
import LoadingSkeleton from "./LoadingSkeleton";

export default function VisualizationPanel() {
  const { currentResult, loading, error } = useConversationContext();

  // Loading state — show skeleton immediately
  if (loading) {
    return (
      <div className="h-full overflow-y-auto">
        <LoadingSkeleton />
      </div>
    );
  }

  // Error state (no result)
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

  // Empty state — no query submitted yet
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
  const { results, chartType, narrative } = data;

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* Chart type badge */}
      {chartType?.type && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">{chartType.title}</h2>
          <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full capitalize">
            {chartType.type.replace(/_/g, " ")}
          </span>
        </div>
      )}

      {/* AI narrative */}
      <NarrativeBox narrative={narrative} />

      {/* Chart placeholder — Recharts integration comes in next phase */}
      {chartType?.type && chartType.type !== "metric_card" && chartType.type !== "table" && chartType.type !== "empty_state" && (
        <div className="h-48 bg-gray-50 border border-dashed border-gray-200 rounded-xl flex items-center justify-center mb-4">
          <p className="text-xs text-gray-300">Chart visualization — Phase 5</p>
        </div>
      )}

      {/* Metric card */}
      {chartType?.type === "metric_card" && results?.length > 0 && (
        <MetricCard result={results[0]} chartType={chartType} />
      )}

      {/* Data table — always shown */}
      {results && results.length > 0 && (
        <div className="mt-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Raw Data
          </p>
          <DataTable results={results} />
        </div>
      )}
    </div>
  );
}

function MetricCard({ result, chartType }) {
  const key   = chartType?.yAxis || Object.keys(result)[0];
  const value = result[key];
  const label = chartType?.title || humanise(key);

  return (
    <div className="bg-violet-50 border border-violet-100 rounded-2xl p-6 mb-4 text-center">
      <p className="text-xs text-violet-500 font-medium uppercase tracking-wider mb-1">{label}</p>
      <p className="text-4xl font-bold text-violet-700">
        {typeof value === "number" ? value.toLocaleString("en-IN") : value}
      </p>
    </div>
  );
}

function humanise(str) {
  return str.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
