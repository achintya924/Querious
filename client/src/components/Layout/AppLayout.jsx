import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ConversationProvider, useConversationContext } from "../../context/ConversationContext";
import ChatWindow from "../Chat/ChatWindow";
import VisualizationPanel from "../Visualization/VisualizationPanel";
import SchemaExplorer from "../Schema/SchemaExplorer";
import ProgressBar from "./ProgressBar";
import KeyboardHelp from "./KeyboardHelp";

// Inner component so it can access ConversationContext
function DashboardContent({ onFocusInput, showHelp, onHideHelp }) {
  const { submitQuery, clearConversation, loading } = useConversationContext();
  const location  = useLocation();
  const navigate  = useNavigate();
  const [schemaOpen, setSchemaOpen] = useState(false);
  const [mobileTab, setMobileTab]   = useState("chat");
  const chatInputRef = useRef(null);

  // Expose the focus-input function to the parent (for Ctrl+K)
  useEffect(() => {
    if (onFocusInput) onFocusInput(() => chatInputRef.current?.focus());
  }, [onFocusInput]);

  // Handle re-run navigation from History page
  useEffect(() => {
    const question = location.state?.rerunQuestion;
    if (!question) return;
    window.history.replaceState({}, "");
    clearConversation().then(() => {
      setTimeout(() => submitQuery(question), 50);
    });
  }, [location.state?.rerunQuestion]); // eslint-disable-line

  // Keyboard shortcuts
  useEffect(() => {
    function handler(e) {
      // Ignore when typing in an input/textarea/select
      const tag = document.activeElement?.tagName;
      const isEditing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";

      if (e.key === "Escape") {
        if (schemaOpen) setSchemaOpen(false);
        return;
      }

      if (isEditing) return; // don't intercept typing keys below

      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        chatInputRef.current?.focus();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        clearConversation();
        chatInputRef.current?.focus();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "h") {
        e.preventDefault();
        navigate("/history");
      } else if (e.key === "?") {
        // toggle help is handled by the parent via state
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [schemaOpen, clearConversation, navigate]); // eslint-disable-line

  function handleSchemaFieldClick(suggestion) {
    submitQuery(suggestion);
    if (window.innerWidth < 768) setMobileTab("chat");
  }

  return (
    <>
      <ProgressBar active={loading} />
      {showHelp && <KeyboardHelp onClose={onHideHelp} />}

      <div className="flex-1 flex overflow-hidden">
        {/* Schema Explorer — fixed width panel */}
        {schemaOpen && (
          <div className="hidden md:flex flex-col w-64 xl:w-72 shrink-0">
            <SchemaExplorer
              onFieldClick={handleSchemaFieldClick}
              onClose={() => setSchemaOpen(false)}
            />
          </div>
        )}

        {/* Chat panel */}
        <div
          className={`
            flex flex-col border-r border-gray-200 bg-white overflow-hidden
            w-full md:flex-1 md:min-w-0
            ${mobileTab !== "chat" ? "hidden md:flex" : "flex"}
          `}
        >
          <ChatWindow
            schemaOpen={schemaOpen}
            onToggleSchema={() => setSchemaOpen((v) => !v)}
            inputRef={chatInputRef}
          />
        </div>

        {/* Visualization panel */}
        <div
          className={`
            flex flex-col bg-gray-50 overflow-hidden
            w-full md:w-[55%] lg:w-[58%] shrink-0
            ${mobileTab !== "results" ? "hidden md:flex" : "flex"}
          `}
        >
          <VisualizationPanel />
        </div>
      </div>

      {/* Mobile tab bar */}
      <div className="md:hidden flex border-t border-gray-200 bg-white shrink-0">
        {["chat", "results"].map((tab) => (
          <button
            key={tab}
            onClick={() => setMobileTab(tab)}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              mobileTab === tab
                ? "text-violet-600 border-t-2 border-violet-600 -mt-px"
                : "text-gray-500"
            }`}
          >
            {tab === "chat" ? "Chat" : "Results"}
          </button>
        ))}
      </div>
    </>
  );
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const [showHelp, setShowHelp] = useState(false);
  const focusInputRef = useRef(null); // will be set by DashboardContent

  // "?" key toggles help overlay (at AppLayout level so it works globally)
  useEffect(() => {
    function handler(e) {
      const tag = document.activeElement?.tagName;
      const isEditing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      if (!isEditing && e.key === "?") {
        setShowHelp((v) => !v);
      }
      if (e.key === "Escape") setShowHelp(false);
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <ConversationProvider>
      <div className="h-screen flex flex-col overflow-hidden">
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <header className="bg-white border-b border-gray-200 px-4 md:px-6 h-14 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-4 md:gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                </svg>
              </div>
              <span className="text-base font-bold text-gray-900 tracking-tight">
                Querio<span className="text-violet-600">us</span>
              </span>
            </div>

            <nav className="flex items-center gap-1">
              <button
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-violet-600 bg-violet-50"
              >
                Dashboard
              </button>
              <button
                onClick={() => navigate("/history")}
                className="px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
              >
                History
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHelp((v) => !v)}
              title="Keyboard shortcuts (?)"
              className="hidden sm:flex items-center justify-center w-6 h-6 rounded border border-gray-300 text-gray-400 hover:text-gray-600 hover:border-gray-400 text-xs font-mono transition-colors"
            >
              ?
            </button>
            <span className="text-sm text-gray-600 hidden sm:inline">{user?.name}</span>
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              Sign out
            </button>
          </div>
        </header>

        {/* ── Main area (DashboardContent owns mobile tab bar now) ─────────── */}
        <DashboardContent
          onFocusInput={(fn) => { focusInputRef.current = fn; }}
          showHelp={showHelp}
          onHideHelp={() => setShowHelp(false)}
        />
      </div>
    </ConversationProvider>
  );
}
