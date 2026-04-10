const rateLimit = require("express-rate-limit");

const RATE_LIMIT_MESSAGE = { success: false, error: "Too many requests. Please wait a moment and try again." };

// 30 requests/min per user for AI queries
const queryLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req) => req.user?.userId || req.ip,
  message: RATE_LIMIT_MESSAGE,
  standardHeaders: true,
  legacyHeaders: false,
});

// 10 requests/min per IP for auth (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.ip,
  message: RATE_LIMIT_MESSAGE,
  standardHeaders: true,
  legacyHeaders: false,
});

// 100 requests/min per user for general API
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  keyGenerator: (req) => req.user?.userId || req.ip,
  message: RATE_LIMIT_MESSAGE,
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { queryLimiter, authLimiter, generalLimiter };
