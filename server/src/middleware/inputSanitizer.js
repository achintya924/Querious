const { JSDOM } = require("jsdom");
const createDOMPurify = require("dompurify");

// Create a single DOMPurify instance bound to a jsdom window (server-safe)
const { window: domWindow } = new JSDOM("");
const DOMPurify = createDOMPurify(domWindow);
// Strip ALL HTML — we never want markup in API inputs
const PURIFY_OPTS = { ALLOWED_TAGS: [], ALLOWED_ATTR: [] };

const MAX_QUESTION_LENGTH = 500;

function sanitizeValue(value, key) {
  if (typeof value !== "string") return value;
  let v = value.trim();
  // DOMPurify handles XSS payloads more thoroughly than a simple regex
  v = DOMPurify.sanitize(v, PURIFY_OPTS);
  // Belt-and-suspenders: strip any remaining HTML tags
  v = v.replace(/<[^>]*>/g, "");
  // Hard cap on question field
  if (key === "question" && v.length > MAX_QUESTION_LENGTH) {
    v = v.slice(0, MAX_QUESTION_LENGTH);
  }
  return v;
}

function sanitizeObject(obj) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return obj;
  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    clean[key] =
      typeof value === "object" && value !== null && !Array.isArray(value)
        ? sanitizeObject(value)
        : sanitizeValue(value, key);
  }
  return clean;
}

function inputSanitizer(req, res, next) {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body);
  }
  next();
}

module.exports = inputSanitizer;
