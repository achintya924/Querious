const Session = require("../../models/Session");

const CONTEXT_WINDOW = 5; // keep last N turns

/**
 * Creates a new session for a user.
 * @returns {string} sessionId
 */
async function createSession(userId) {
  const session = await Session.create({
    user_id: userId,
    conversation_context: [],
  });
  return session._id.toString();
}

/**
 * Returns a session document, or null if not found.
 */
async function getSession(sessionId) {
  return Session.findById(sessionId).lean();
}

/**
 * Pushes a new Q&A entry into the session's conversation_context.
 * Trims to the last CONTEXT_WINDOW entries.
 *
 * @param {string} sessionId
 * @param {{ question: string, structuredQuery: object }} entry
 */
async function updateSession(sessionId, entry) {
  const session = await Session.findById(sessionId);
  if (!session) return;

  session.conversation_context.push({
    question: entry.question,
    structuredQuery: entry.structuredQuery,
    timestamp: new Date(),
  });

  // Sliding window — only keep the most recent N turns
  if (session.conversation_context.length > CONTEXT_WINDOW) {
    session.conversation_context = session.conversation_context.slice(-CONTEXT_WINDOW);
  }

  await session.save();
}

/**
 * Marks a session as ended.
 */
async function closeSession(sessionId) {
  await Session.findByIdAndUpdate(sessionId, {
    ended_at: new Date(),
    updated_at: new Date(),
  });
}

module.exports = { createSession, getSession, updateSession, closeSession };
