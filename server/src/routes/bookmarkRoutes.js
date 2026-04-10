const { Router } = require("express");
const auth = require("../middleware/auth");
const { validate, schemas } = require("../middleware/validate");
const {
  addBookmark,
  getBookmarks,
  updateBookmark,
  removeBookmark,
  removeBookmarkByQueryId,
} = require("../controllers/bookmarkController");

const router = Router();

router.get("/",                        auth, getBookmarks);
router.post("/",                       auth, validate(schemas.addBookmark),    addBookmark);
router.patch("/:id",                   auth, validate(schemas.updateBookmark), updateBookmark);
router.delete("/by-query/:queryId",    auth, removeBookmarkByQueryId);
router.delete("/:id",                  auth, removeBookmark);

module.exports = router;
