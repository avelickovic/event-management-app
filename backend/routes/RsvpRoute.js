const express = require("express");
const rsvpModel = require("../models/RsvpModel.js");
const {verifyToken} = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/",verifyToken,rsvpModel.createRsvp);
router.get("/:eventId",rsvpModel.getRsvpCount);
router.post("/check",verifyToken,rsvpModel.checkUserRsvp);
module.exports = router;