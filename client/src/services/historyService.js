import api from "./api";

export async function getHistory(page = 1, limit = 20, search = "") {
  const params = { page, limit };
  if (search) params.search = search;
  const { data } = await api.get("/history", { params });
  return data;
}

export async function getQueryDetails(id) {
  const { data } = await api.get(`/history/${id}`);
  return data;
}

export async function deleteQuery(id) {
  await api.delete(`/history/${id}`);
}

export async function clearHistory() {
  await api.delete("/history", { data: { confirm: true } });
}
