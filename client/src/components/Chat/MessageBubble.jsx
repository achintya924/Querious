import ContextChips from "./ContextChips";

export default function MessageBubble({ message, onChipClick, onRetry }) {
  const { type, content, timestamp, isFollowUp, retryable } = message;

  if (type === "user") {
    return (
      <div className="flex justify-end animate-fade-in">
        <div className="max-w-[80%]">
          {isFollowUp && (
            <div className="flex justify-end mb-1">
              <span className="text-[10px] text-violet-500 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-full font-medium">
                Follow-up
              </span>
            </div>
          )}
          <div className="bg-violet-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed">
            {content}
          </div>
          <p className="text-xs text-gray-400 mt-1 text-right">{formatTime(timestamp)}</p>
        </div>
      </div>
    );
  }

  if (type === "error") {
    return (
      <div className="flex justify-start animate-fade-in">
        <div className="max-w-[85%]">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed">
            <div className="flex items-start gap-2">
              <span className="shrink-0 mt-0.5">⚠</span>
              <span>{content}</span>
            </div>
            {retryable !== false && onRetry && (
              <button
                onClick={onRetry}
                className="mt-2 text-xs text-red-600 hover:text-red-800 underline underline-offset-2 font-medium transition-colors"
              >
                Retry
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">{formatTime(timestamp)}</p>
        </div>
      </div>
    );
  }

  // AI message
  const { type: responseType, message: clarMessage, data } = content || {};

  if (responseType === "clarification") {
    return (
      <div className="flex justify-start animate-fade-in">
        <div className="max-w-[85%]">
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed">
            <div className="flex items-start gap-2">
              <span className="text-base shrink-0 mt-0.5">❓</span>
              <span>{clarMessage}</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1">{formatTime(timestamp)}</p>
        </div>
      </div>
    );
  }

  // Result type
  const narrative = data?.narrative;
  const execTime  = data?.executionTime;
  const structuredQuery = data?.structuredQuery;
  const cached = data?.cached;

  return (
    <div className="flex justify-start animate-fade-in">
      <div className="max-w-[85%]">
        <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed shadow-sm">
          {narrative ? (
            <p className="text-gray-700">{narrative}</p>
          ) : (
            <p className="text-gray-500 italic">
              {data?.results?.length
                ? `${data.results.length} result${data.results.length !== 1 ? "s" : ""} returned.`
                : "No results found."}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs text-gray-400">{formatTime(timestamp)}</p>
          {execTime != null && (
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
              {(execTime / 1000).toFixed(1)}s
            </span>
          )}
          {cached && (
            <span className="text-xs bg-violet-50 text-violet-500 px-2 py-0.5 rounded-full border border-violet-100">
              cached
            </span>
          )}
        </div>

        {/* Context chips — follow-up suggestions */}
        {structuredQuery && onChipClick && (
          <ContextChips structuredQuery={structuredQuery} onSelect={onChipClick} />
        )}
      </div>
    </div>
  );
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
