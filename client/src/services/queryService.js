import api from "./api";

export async function submitQuery(question, sessionId = null) {
  const body = { question };
  if (sessionId) body.sessionId = sessionId;
  const { data } = await api.post("/query", body);
  return data;
}

export async function getSuggestions() {
  const { data } = await api.get("/query/suggestions");
  return data;
}

export async function getSchema() {
  const { data } = await api.get("/schema");
  return data;
}

export async function deleteSession(sessionId) {
  await api.delete(`/sessions/${sessionId}`);
}
