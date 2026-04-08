import { useState } from "react";
import { submitQuery as submitQueryService } from "../services/queryService";

export function useQuery() {
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);
  const [currentResult, setCurrentResult] = useState(null);

  async function submitQuery(question) {
    setLoading(true);
    setError(null);
    try {
      const response = await submitQueryService(question);
      setCurrentResult(response);
      return response;
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        (err.message === "Network Error" ? "Unable to reach the server. Please try again." : err.message) ||
        "Something went wrong";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }

  return { loading, error, currentResult, submitQuery };
}
