import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true, // send httpOnly cookies on every request
});

// Classify errors into user-friendly messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      error.userMessage = "Unable to reach the server. Check your connection and try again.";
      return Promise.reject(error);
    }

    const { status, data } = error.response;

    if (status === 401) {
      // Redirect to login for any page except auth pages themselves
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

    error.userMessage = status < 500
      ? data?.error || data?.message || "Request failed."
      : "Something went wrong on our end. Please try again.";

    return Promise.reject(error);
  }
);

export default api;
