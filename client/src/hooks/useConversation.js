import { useState, useCallback } from "react";

let _id = 0;
function nextId() { return ++_id; }

export function useConversation() {
  const [messages, setMessages] = useState([]);

  const addUserMessage = useCallback((text) => {
    const msg = { id: nextId(), type: "user", content: text, timestamp: new Date() };
    setMessages((prev) => [...prev, msg]);
    return msg;
  }, []);

  const addAIResponse = useCallback((response) => {
    const msg = { id: nextId(), type: "ai", content: response, timestamp: new Date() };
    setMessages((prev) => [...prev, msg]);
    return msg;
  }, []);

  const addErrorMessage = useCallback((errorText) => {
    const msg = { id: nextId(), type: "error", content: errorText, timestamp: new Date() };
    setMessages((prev) => [...prev, msg]);
    return msg;
  }, []);

  const clearConversation = useCallback(() => {
    setMessages([]);
  }, []);

  // The most recent AI result (for the visualization panel)
  const currentResult = [...messages].reverse().find(
    (m) => m.type === "ai" && m.content?.type === "result"
  )?.content ?? null;

  return { messages, currentResult, addUserMessage, addAIResponse, addErrorMessage, clearConversation };
}
