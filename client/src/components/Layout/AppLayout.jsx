import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ConversationProvider, useConversationContext } from "../../context/ConversationContext";
import ChatWindow from "../Chat/ChatWindow";
import VisualizationPanel from "../Visualization/VisualizationPanel";
import SchemaExplorer from "../Schema/SchemaExplorer";

// Inner component so it can access ConversationContext
function DashboardContent() {
  const { submitQuery, clearConversation } = useConversationContext();
  const location = useLocation();
  const [schemaOpen, setSchemaOpen] = useState(false);
  const [mobileTab, setMobileTab]   = useState("chat");

  // Handle re-run navigation from History page
  useEffect(() => {
    const question = location.state?.rerunQuestion;
    if (!question) return;
    // Clear navigation state so a back-navigation doesn't re-trigger
    window.history.replaceState({}, "");
    clearConversation().then(() => {
      // Small delay so the conversation clears before submitting
      setTimeout(() => submitQuery(question), 50);
    });
  }, [location.state?.rerunQuestion]); // eslint-disable-line

  function handleSchemaFieldClick(suggestion) {
    submitQuery(suggestion);
    if (window.innerWidth < 768) setMobileTab("chat");
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Schema Explorer — fixed width panel, hidden when closed */}
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
        <ChatWindow schemaOpen={schemaOpen} onToggleSchema={() => setSchemaOpen((v) => !v)} />
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

      {/* Mobile tab bar — rendered inside the flex row so it doesn't affect layout */}
    </div>
  );
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const [mobileTab, setMobileTab] = useState("chat");

  return (
    <ConversationProvider>
      <div className="h-screen flex flex-col overflow-hidden">
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <header className="bg-white border-b border-gray-200 px-4 md:px-6 h-14 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-4 md:gap-6">
            <span className="text-lg font-bold text-violet-600">Querious</span>
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
            <span className="text-sm text-gray-600 hidden sm:inline">{user?.name}</span>
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              Sign out
            </button>
          </div>
        </header>

        {/* ── Mobile tab bar ──────────────────────────────────────────────────── */}
        <div className="md:hidden flex border-b border-gray-200 bg-white shrink-0">
          {["chat", "results"].map((tab) => (
            <button
              key={tab}
              onClick={() => setMobileTab(tab)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                mobileTab === tab
                  ? "text-violet-600 border-b-2 border-violet-600"
                  : "text-gray-500"
              }`}
            >
              {tab === "chat" ? "Chat" : "Results"}
            </button>
          ))}
        </div>

        {/* ── Main area ───────────────────────────────────────────────────────── */}
        <DashboardContent />
      </div>
    </ConversationProvider>
  );
}
