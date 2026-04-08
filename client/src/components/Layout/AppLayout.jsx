import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { ConversationProvider } from "../../context/ConversationContext";
import ChatWindow from "../Chat/ChatWindow";
import VisualizationPanel from "../Visualization/VisualizationPanel";

export default function AppLayout() {
  const { user, logout } = useAuth();
  // Mobile tab state: "chat" | "results"
  const [mobileTab, setMobileTab] = useState("chat");

  return (
    <ConversationProvider>
      <div className="h-screen flex flex-col overflow-hidden">
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <header className="bg-white border-b border-gray-200 px-6 h-14 flex items-center justify-between shrink-0 z-10">
          <span className="text-lg font-bold text-violet-600">Querious</span>
          <div className="flex items-center gap-4">
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

        {/* ── Main two-panel area ─────────────────────────────────────────────── */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chat panel — 40% on desktop, full width on mobile */}
          <div
            className={`
              flex flex-col border-r border-gray-200 bg-white overflow-hidden
              w-full md:w-2/5 lg:w-[40%]
              ${mobileTab !== "chat" ? "hidden md:flex" : "flex"}
            `}
          >
            <ChatWindow />
          </div>

          {/* Visualization panel — 60% on desktop, full width on mobile */}
          <div
            className={`
              flex flex-col bg-gray-50 overflow-hidden
              w-full md:w-3/5 lg:w-[60%]
              ${mobileTab !== "results" ? "hidden md:flex" : "flex"}
            `}
          >
            <VisualizationPanel />
          </div>
        </div>
      </div>
    </ConversationProvider>
  );
}
