import { createContext, useContext, useState, useCallback, useRef } from "react";
import { submitQuery as apiSubmitQuery, deleteSession } from "../services/queryService";
import { useConversation } from "../hooks/useConversation";

const ConversationContext = createContext(null);

export function ConversationProvider({ children }) {
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const sessionIdRef                = useRef(null); // persisted across renders without triggering re-renders

  const {
    messages,
    currentResult,
    addUserMessage,
    addAIResponse,
    addErrorMessage,
    clearConversation: clearMessages,
  } = useConversation();

  const submitQuery = useCallback(async (question) => {
    setLoading(true);
    setError(null);
    addUserMessage(question);

    try {
      const response = await apiSubmitQuery(question, sessionIdRef.current);

      // Persist the sessionId returned by the server for subsequent follow-ups
      const returnedSessionId = response?.data?.sessionId;
      if (returnedSessionId) {
        sessionIdRef.current = returnedSessionId;
      }

      addAIResponse(response);
      return response;
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        (err.message === "Network Error"
          ? "Unable to reach the server. Please try again."
          : err.message) ||
        "Something went wrong";
      setError(message);
      addErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }, [addUserMessage, addAIResponse, addErrorMessage]);

  const clearConversation = useCallback(async () => {
    // End the current session on the server (fire-and-forget)
    if (sessionIdRef.current) {
      deleteSession(sessionIdRef.current).catch(() => {});
      sessionIdRef.current = null;
    }
    clearMessages();
    setError(null);
  }, [clearMessages]);

  // Expose whether we're inside an ongoing session (for follow-up badge logic)
  const hasSession = Boolean(sessionIdRef.current);

  return (
    <ConversationContext.Provider
      value={{ messages, currentResult, loading, error, hasSession, submitQuery, clearConversation }}
    >
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversationContext() {
  return useContext(ConversationContext);
}
