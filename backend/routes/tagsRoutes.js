const express = require("express");
const tagsModel = require("../models/tagsModel");
const router = express.Router();

router.get("/:eventId", tagsModel.getAllTagsByEvent);
router.get("/name/:tagName", tagsModel.getIdbyTag);
module.exports = router;