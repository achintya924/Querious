import api from "./api";

export async function getBookmarks() {
  const { data } = await api.get("/bookmarks");
  return data;
}

export async function addBookmark(queryId, label = "") {
  const body = { queryId };
  if (label) body.label = label;
  const { data } = await api.post("/bookmarks", body);
  return data;
}

export async function updateBookmarkLabel(id, label) {
  const { data } = await api.patch(`/bookmarks/${id}`, { label });
  return data;
}

export async function removeBookmark(id) {
  await api.delete(`/bookmarks/${id}`);
}

export async function removeBookmarkByQueryId(queryId) {
  await api.delete(`/bookmarks/by-query/${queryId}`);
}
