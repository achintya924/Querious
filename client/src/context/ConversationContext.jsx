import { createContext, useContext, useState, useCallback, useRef } from "react";
import { submitQuery as apiSubmitQuery, deleteSession } from "../services/queryService";
import { useConversation } from "../hooks/useConversation";

const ConversationContext = createContext(null);

export function ConversationProvider({ children }) {
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const sessionIdRef                  = useRef(null);
  const lastQuestionRef               = useRef(null); // for retry

  const {
    messages,
    currentResult,
    addUserMessage,
    addAIResponse,
    addErrorMessage,
    clearConversation: clearMessages,
  } = useConversation();

  const _execute = useCallback(async (question) => {
    setLoading(true);
    setError(null);
    lastQuestionRef.current = question;

    try {
      const response = await apiSubmitQuery(question, sessionIdRef.current);

      const returnedSessionId = response?.data?.sessionId;
      if (returnedSessionId) {
        sessionIdRef.current = returnedSessionId;
      }

      addAIResponse(response);
      return response;
    } catch (err) {
      const message = err.userMessage || err.response?.data?.error || err.message || "Something went wrong";
      setError(message);
      addErrorMessage(message, err.isRateLimit || err.isServiceUnavailable);
    } finally {
      setLoading(false);
    }
  }, [addAIResponse, addErrorMessage]);

  const submitQuery = useCallback(async (question) => {
    addUserMessage(question);
    return _execute(question);
  }, [addUserMessage, _execute]);

  const retryLast = useCallback(async () => {
    const question = lastQuestionRef.current;
    if (!question || loading) return;
    return _execute(question);
  }, [loading, _execute]);

  const clearConversation = useCallback(async () => {
    if (sessionIdRef.current) {
      deleteSession(sessionIdRef.current).catch(() => {});
      sessionIdRef.current = null;
    }
    lastQuestionRef.current = null;
    clearMessages();
    setError(null);
  }, [clearMessages]);

  const hasSession = Boolean(sessionIdRef.current);

  return (
    <ConversationContext.Provider
      value={{ messages, currentResult, loading, error, hasSession, submitQuery, retryLast, clearConversation }}
    >
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversationContext() {
  return useContext(ConversationContext);
}
