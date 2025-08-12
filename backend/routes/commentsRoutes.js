const express = require("express");
const router = express.Router();
const commentsModel = require("../models/commentsModel");
router.post("/", commentsModel.createComment);
router.get("/", commentsModel.getAllComments);
router.get("/:eventId", commentsModel.getCommentsByEventId);
router.patch("/like/:commentId", commentsModel.incrementLikeCount);
router.patch("/dislike/:commentId", commentsModel.incrementDislikeCount);
module.exports = router;

