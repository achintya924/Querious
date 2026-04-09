import { useEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble";
import QueryInput from "./QueryInput";
import SuggestedQueries from "./SuggestedQueries";
import { useConversationContext } from "../../context/ConversationContext";

export default function ChatWindow({ schemaOpen, onToggleSchema }) {
  const { messages, loading, submitQuery, clearConversation } = useConversationContext();
  const bottomRef  = useRef(null);
  const [pendingQuery, setPendingQuery] = useState("");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSubmit(question) {
    setPendingQuery("");
    await submitQuery(question);
  }

  function handleSuggestionSelect(question) {
    setPendingQuery(question);
    setTimeout(() => handleSubmit(question), 0);
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 shrink-0">
        {/* Schema toggle */}
        <button
          onClick={onToggleSchema}
          title={schemaOpen ? "Hide schema" : "Show schema explorer"}
          className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-colors ${
            schemaOpen
              ? "text-violet-600 bg-violet-50"
              : "text-gray-400 hover:text-violet-600 hover:bg-violet-50"
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7M4 7c0-2 1-3 3-3h10c2 0 3 1 3 3M4 7h16" />
          </svg>
          <span className="hidden sm:inline">Schema</span>
        </button>

        {!isEmpty && (
          <button
            onClick={clearConversation}
            title="New conversation"
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-violet-600 hover:bg-violet-50 px-2.5 py-1 rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New
          </button>
        )}
      </div>

      {/* Message area */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <SuggestedQueries onSelect={handleSuggestionSelect} />
        ) : (
          <div className="px-4 py-4 space-y-4">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} onChipClick={handleSubmit} />
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <QueryInput
        onSubmit={handleSubmit}
        loading={loading}
        initialValue={pendingQuery}
      />
    </div>
  );
}
