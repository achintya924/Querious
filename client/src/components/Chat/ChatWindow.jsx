import { useEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble";
import QueryInput from "./QueryInput";
import SuggestedQueries from "./SuggestedQueries";
import { useConversationContext } from "../../context/ConversationContext";

export default function ChatWindow() {
  const { messages, loading, submitQuery } = useConversationContext();
  const bottomRef  = useRef(null);
  const [pendingQuery, setPendingQuery] = useState("");

  // Auto-scroll to newest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSubmit(question) {
    setPendingQuery("");
    await submitQuery(question);
  }

  function handleSuggestionSelect(question) {
    // Set as pending so QueryInput populates, then auto-submit
    setPendingQuery(question);
    // Submit on next tick so input renders first
    setTimeout(() => handleSubmit(question), 0);
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full">
      {/* Message area */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <SuggestedQueries onSelect={handleSuggestionSelect} />
        ) : (
          <div className="px-4 py-4 space-y-4">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {/* Loading indicator */}
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

      {/* Input */}
      <QueryInput
        onSubmit={handleSubmit}
        loading={loading}
        initialValue={pendingQuery}
      />
    </div>
  );
}
