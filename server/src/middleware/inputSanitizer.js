const MAX_QUESTION_LENGTH = 500;

// Strip HTML tags from a string
function stripHtml(str) {
  return str.replace(/<[^>]*>/g, "");
}

function sanitizeValue(value, key) {
  if (typeof value !== "string") return value;
  let v = value.trim();
  v = stripHtml(v);
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
    clean[key] = typeof value === "object" && value !== null && !Array.isArray(value)
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
