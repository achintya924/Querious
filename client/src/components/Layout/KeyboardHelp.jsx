export default function KeyboardHelp({ onClose }) {
  const shortcuts = [
    { keys: ["Ctrl", "K"], description: "Focus query input" },
    { keys: ["Ctrl", "N"], description: "New conversation" },
    { keys: ["Ctrl", "H"], description: "Open history" },
    { keys: ["Esc"], description: "Close schema / this panel" },
    { keys: ["?"], description: "Toggle this help panel" },
    { keys: ["Enter"], description: "Send query" },
    { keys: ["Shift", "Enter"], description: "New line in input" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">Keyboard shortcuts</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <ul className="px-5 py-3 space-y-3">
          {shortcuts.map(({ keys, description }) => (
            <li key={description} className="flex items-center justify-between gap-4">
              <span className="text-sm text-gray-600">{description}</span>
              <div className="flex items-center gap-1 shrink-0">
                {keys.map((k, i) => (
                  <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded border border-gray-200 bg-gray-50 text-xs font-mono text-gray-700">
                    {k}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
        <div className="px-5 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">Mac users: use ⌘ instead of Ctrl</p>
        </div>
      </div>
    </div>
  );
}
