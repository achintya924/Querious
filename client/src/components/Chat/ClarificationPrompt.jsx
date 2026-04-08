// ClarificationPrompt is rendered inline inside MessageBubble for clarification
// responses. This component provides a standalone version if needed by a parent.
export default function ClarificationPrompt({ message, onRespond }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
      <div className="flex items-start gap-2 mb-3">
        <span className="text-lg">❓</span>
        <p className="text-sm text-amber-800 leading-relaxed">{message}</p>
      </div>
      <p className="text-xs text-amber-600">
        Type a more specific question below to continue.
      </p>
    </div>
  );
}
