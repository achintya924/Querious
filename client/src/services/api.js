import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// Attach JWT token to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Classify errors into user-friendly messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      // Network / server unreachable
      error.userMessage = "Unable to reach the server. Check your connection and try again.";
      return Promise.reject(error);
    }

    const { status, data } = error.response;

    if (status === 401) {
      localStorage.removeItem("token");
      if (!window.location.pathname.startsWith("/login") &&
          !window.location.pathname.startsWith("/register")) {
        window.location.href = "/login";
      }
      error.userMessage = "Session expired. Please log in again.";
      return Promise.reject(error);
    }

    if (status === 429) {
      error.userMessage = data?.error || "Too many requests. Please wait a moment and try again.";
      error.isRateLimit = true;
      return Promise.reject(error);
    }

    if (status === 503) {
      error.userMessage = data?.error || "The AI service is temporarily unavailable. Please try again in a moment.";
      error.isServiceUnavailable = true;
      return Promise.reject(error);
    }

    if (status === 422) {
      error.userMessage = data?.error || "Your query couldn't be understood. Try rephrasing.";
      return Promise.reject(error);
    }

    // Prefer server-provided message for 4xx, generic message for 5xx
    error.userMessage = status < 500
      ? data?.error || "Request failed."
      : "Something went wrong on our end. Please try again.";

    return Promise.reject(error);
  }
);

export default api;
