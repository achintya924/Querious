const isDev = process.env.NODE_ENV !== "production";

function errorHandler(err, req, res, next) {
  // Mongoose ValidationError
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, error: messages.join("; ") });
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === "CastError") {
    return res.status(400).json({ success: false, error: "Invalid ID format" });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return res.status(401).json({ success: false, error: "Authentication required. Please log in again." });
  }

  // AI API errors
  if (err.statusCode === 429) {
    return res.status(429).json({ success: false, error: err.message || "AI service is rate-limited." });
  }
  if (err.statusCode === 503 || err.message?.includes("AI service")) {
    return res.status(503).json({ success: false, error: "AI service temporarily unavailable. Please try again." });
  }

  // MongoDB connection errors
  if (err.name === "MongoNetworkError" || err.name === "MongooseServerSelectionError") {
    return res.status(503).json({ success: false, error: "Database temporarily unavailable." });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return res.status(409).json({ success: false, error: `Duplicate value for ${field}.` });
  }

  // Generic
  const status = err.status || err.statusCode || 500;
  const message = status < 500 ? err.message : "Something went wrong. Please try again.";

  if (isDev) {
    console.error("[Error]", err);
    return res.status(status).json({ success: false, error: message, stack: err.stack });
  }

  return res.status(status).json({ success: false, error: message });
}

module.exports = errorHandler;
