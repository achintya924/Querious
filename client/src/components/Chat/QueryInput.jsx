import { useState, useRef, useEffect } from "react";

export default function QueryInput({ onSubmit, loading, initialValue = "", inputRef: externalRef }) {
  const [value, setValue] = useState(initialValue);
  const internalRef = useRef(null);
  const textareaRef = externalRef || internalRef;

  // When a suggested query is selected, we get a new initialValue
  // We need to update internal state when that prop changes
  // (parent passes the suggestion text, then clears it after submit)
  const prevInitial = useRef(initialValue);
  if (initialValue !== prevInitial.current) {
    prevInitial.current = initialValue;
    setValue(initialValue);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleSubmit() {
    const q = value.trim();
    if (!q || loading) return;
    onSubmit(q);
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  function handleInput(e) {
    setValue(e.target.value);
    // Auto-grow textarea
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 120) + "px";
    }
  }

  return (
    <div className="border-t border-gray-200 bg-white px-4 py-3">
      <div className={`flex items-end gap-2 border rounded-xl px-3 py-2 transition-colors ${
        loading ? "border-gray-200 bg-gray-50" : "border-gray-300 focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100"
      }`}>
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          disabled={loading}
          placeholder="Ask your data anything..."
          className="flex-1 resize-none bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none leading-relaxed disabled:opacity-50"
          style={{ minHeight: "24px", maxHeight: "120px" }}
        />
        <button
          onClick={handleSubmit}
          disabled={loading || !value.trim()}
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Send"
        >
          {loading ? (
            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          )}
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-1.5 text-center">
        Press Enter to send · Shift+Enter for newline
      </p>
    </div>
  );
}
