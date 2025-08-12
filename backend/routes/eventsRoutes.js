const express = require("express");
const {verifyToken} = require("../middleware/authMiddleware");
const eventsModel = require("../models/eventsModel");
const router = express.Router();

router.post('/createEvent', verifyToken, eventsModel.createEvent);
router.get('/', eventsModel.getAllEvents);
router.get('/:id', verifyToken, eventsModel.getEventById);
router.patch('/update/:eventId', verifyToken, eventsModel.updateEvent);
router.delete('/delete/:eventId', verifyToken, eventsModel.deleteEvent);
router.get('/search', verifyToken, eventsModel.searchEvents);
router.patch('/likes/:eventId', eventsModel.incrementLikeCount);
router.patch('/dislikes/:eventId', eventsModel.incrementDislikeCount);
router.patch('/views/:eventId', eventsModel.incrementViewCount);
module.exports = router;