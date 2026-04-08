import api from "./api";

export async function submitQuery(question) {
  const { data } = await api.post("/query", { question });
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
