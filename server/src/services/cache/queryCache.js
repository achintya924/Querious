/**
 * In-memory query cache with TTL and LRU-style eviction.
 * - Keys: normalised question + userId
 * - TTL: 1 hour
 * - Max entries: 500 (oldest evicted when full)
 * - Cleanup: every 10 minutes
 */

const TTL_MS      = 60 * 60 * 1000;  // 1 hour
const MAX_ENTRIES = 500;
const CLEANUP_MS  = 10 * 60 * 1000;  // 10 minutes

// Map preserves insertion order — first key = oldest entry
const cache = new Map();

function normalise(question) {
  return question.toLowerCase().trim().replace(/\s+/g, " ");
}

function makeKey(question, userId) {
  return `${userId}::${normalise(question)}`;
}

function getCachedResult(question, userId) {
  const key   = makeKey(question, userId);
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function setCachedResult(question, userId, result) {
  const key = makeKey(question, userId);

  // Evict oldest if at capacity
  if (cache.size >= MAX_ENTRIES && !cache.has(key)) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }

  cache.set(key, { value: result, expiresAt: Date.now() + TTL_MS });
}

function clearCache() {
  cache.clear();
}

function clearUserCache(userId) {
  const prefix = `${userId}::`;
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}

function getCacheSize() {
  return cache.size;
}

// Periodic cleanup of expired entries
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now > entry.expiresAt) cache.delete(key);
  }
}, CLEANUP_MS);

// Don't keep Node process alive just for cleanup
cleanupInterval.unref();

module.exports = { getCachedResult, setCachedResult, clearCache, clearUserCache, getCacheSize };
