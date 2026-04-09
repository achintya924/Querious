import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getHistory, clearHistory } from "../../services/historyService";
import { getBookmarks } from "../../services/bookmarkService";
import { useToast } from "../../context/ToastContext";
import QueryCard from "./QueryCard";
import BookmarksPanel from "./BookmarksPanel";

const TABS = ["All Queries", "Bookmarks"];

export default function QueryHistory() {
  const navigate           = useNavigate();
  const { addToast }       = useToast();
  const [tab, setTab]      = useState("All Queries");

  // History state
  const [queries, setQueries]       = useState([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch]         = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Bookmark map: queryId → bookmarkId
  const [bookmarkMap, setBookmarkMap] = useState({});

  const debounceRef = useRef(null);

  // Debounce search
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
      setQueries([]);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  // Load history whenever page or search changes
  useEffect(() => {
    if (tab !== "All Queries") return;
    const isFirstPage = page === 1;
    isFirstPage ? setLoading(true) : setLoadingMore(true);

    getHistory(page, 20, debouncedSearch)
      .then((res) => {
        setQueries((prev) => isFirstPage ? res.queries : [...prev, ...res.queries]);
        setTotal(res.total);
      })
      .catch(() => addToast("Failed to load history", "error"))
      .finally(() => { setLoading(false); setLoadingMore(false); });
  }, [page, debouncedSearch, tab]);

  // Load bookmark map once
  useEffect(() => {
    getBookmarks()
      .then((res) => {
        const map = {};
        (res.bookmarks || []).forEach((b) => {
          if (b.query_id) map[b.query_id._id || b.query_id] = b._id;
        });
        setBookmarkMap(map);
      })
      .catch(() => {});
  }, []);

  function handleBookmarkChange(queryId, bookmarkId) {
    setBookmarkMap((prev) => {
      const next = { ...prev };
      if (bookmarkId) next[queryId] = bookmarkId;
      else delete next[queryId];
      return next;
    });
  }

  function handleDeleted(queryId) {
    setQueries((prev) => prev.filter((q) => q._id !== queryId));
    setTotal((t) => t - 1);
  }

  async function handleClearHistory() {
    if (!window.confirm("Clear all query history? This cannot be undone.")) return;
    try {
      await clearHistory();
      setQueries([]);
      setTotal(0);
      addToast("History cleared", "info");
    } catch {
      addToast("Failed to clear history", "error");
    }
  }

  const hasMore = queries.length < total;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 h-14 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-lg font-bold text-violet-600"
          >
            Querious
          </button>
          <nav className="flex items-center gap-1">
            <button
              onClick={() => navigate("/dashboard")}
              className="px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
            >
              Dashboard
            </button>
            <button
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-violet-600 bg-violet-50"
            >
              History
            </button>
          </nav>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Page title */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-gray-800">Query History</h1>
          {queries.length > 0 && tab === "All Queries" && (
            <button
              onClick={handleClearHistory}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === t
                  ? "bg-white text-gray-800 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* All Queries tab */}
        {tab === "All Queries" && (
          <>
            {/* Search */}
            <div className="relative mb-5">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search queries..."
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 bg-white"
              />
            </div>

            {/* List */}
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-24 bg-white border border-gray-200 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : queries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <svg className="w-12 h-12 text-gray-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {search ? (
                  <p className="text-sm text-gray-500">No queries match "{search}"</p>
                ) : (
                  <>
                    <p className="text-sm font-medium text-gray-500 mb-1">No queries yet</p>
                    <p className="text-xs text-gray-400 mb-4">Start by asking your data a question</p>
                    <button
                      onClick={() => navigate("/dashboard")}
                      className="text-sm text-violet-600 font-medium hover:underline"
                    >
                      Go to Dashboard →
                    </button>
                  </>
                )}
              </div>
            ) : (
              <>
                <p className="text-xs text-gray-400 mb-3">{total} {total === 1 ? "query" : "queries"}</p>
                <div className="space-y-3">
                  {queries.map((q) => (
                    <QueryCard
                      key={q._id}
                      query={q}
                      bookmarkId={bookmarkMap[q._id] || null}
                      onDeleted={handleDeleted}
                      onBookmarkChange={handleBookmarkChange}
                    />
                  ))}
                </div>

                {hasMore && (
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={loadingMore}
                    className="mt-5 w-full py-2.5 text-sm text-violet-600 border border-violet-200 rounded-xl hover:bg-violet-50 transition-colors disabled:opacity-50"
                  >
                    {loadingMore ? "Loading..." : "Load more"}
                  </button>
                )}
              </>
            )}
          </>
        )}

        {/* Bookmarks tab */}
        {tab === "Bookmarks" && <BookmarksPanel />}
      </div>
    </div>
  );
}
