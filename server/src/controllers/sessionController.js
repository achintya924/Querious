const { createSession, getSession, closeSession } = require("../services/session/sessionManager");

async function createNewSession(req, res) {
  try {
    const sessionId = await createSession(req.user.userId);
    return res.status(201).json({ success: true, sessionId });
  } catch (err) {
    console.error("Create session error:", err);
    return res.status(500).json({ success: false, error: "Failed to create session" });
  }
}

async function fetchSession(req, res) {
  try {
    const session = await getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, error: "Session not found" });
    }
    // Only allow the owner to see the session
    if (session.user_id.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }
    return res.json({ success: true, session });
  } catch (err) {
    console.error("Fetch session error:", err);
    return res.status(500).json({ success: false, error: "Failed to fetch session" });
  }
}

async function deleteSession(req, res) {
  try {
    const session = await getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, error: "Session not found" });
    }
    if (session.user_id.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }
    await closeSession(req.params.id);
    return res.json({ success: true });
  } catch (err) {
    console.error("Delete session error:", err);
    return res.status(500).json({ success: false, error: "Failed to end session" });
  }
}

module.exports = { createNewSession, fetchSession, deleteSession };
