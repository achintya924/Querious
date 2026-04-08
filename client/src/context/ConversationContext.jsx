import { createContext, useContext, useState, useCallback } from "react";
import { submitQuery as apiSubmitQuery } from "../services/queryService";
import { useConversation } from "../hooks/useConversation";

const ConversationContext = createContext(null);

export function ConversationProvider({ children }) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const {
    messages,
    currentResult,
    addUserMessage,
    addAIResponse,
    addErrorMessage,
    clearConversation,
  } = useConversation();

  const submitQuery = useCallback(async (question) => {
    setLoading(true);
    setError(null);
    addUserMessage(question);

    try {
      const response = await apiSubmitQuery(question);
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

  return (
    <ConversationContext.Provider
      value={{ messages, currentResult, loading, error, submitQuery, clearConversation }}
    >
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversationContext() {
  return useContext(ConversationContext);
}
