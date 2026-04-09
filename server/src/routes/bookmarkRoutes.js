const { Router } = require("express");
const auth = require("../middleware/auth");
const {
  addBookmark,
  getBookmarks,
  updateBookmark,
  removeBookmark,
  removeBookmarkByQueryId,
} = require("../controllers/bookmarkController");

const router = Router();

router.get("/",                        auth, getBookmarks);
router.post("/",                       auth, addBookmark);
router.patch("/:id",                   auth, updateBookmark);
router.delete("/by-query/:queryId",    auth, removeBookmarkByQueryId);
router.delete("/:id",                  auth, removeBookmark);

module.exports = router;
