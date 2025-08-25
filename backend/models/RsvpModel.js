const db = require("../config/db");
exports.createRsvp = async (req, res) => {
    const { event_id, user_id, registered_at } = req.body;
    if (!event_id || !user_id || !registered_at) {
        return res.status(400).json({ message: "Event ID, User ID, and status are required." });
    }

    try {

        const [existingRsvp] = await db.query(
            "SELECT * FROM rsvps WHERE user_id = ? AND event_id = ?",
            [user_id, event_id]
        );

        if (existingRsvp.length > 0) {
            return res.status(400).json({ message: "You have already registered for this event." });
        }


        const [[eventInfo]] = await db.query(
            "SELECT max_capacity FROM events WHERE id = ?",
            [event_id]
        );

        if (!eventInfo) {
            return res.status(404).json({ message: "Event not found." });
        }

        const [[rsvpCount]] = await db.query(
            "SELECT COUNT(*) as count FROM rsvps WHERE event_id = ?",
            [event_id]
        );

        if (rsvpCount.count >= eventInfo.max_capacity) {
            return res.status(400).json({ message: "Event has reached maximum capacity." });
        }


        const [result] = await db.query(
            "INSERT INTO rsvps (user_id, event_id, registered_at) VALUES (?, ?, ?)",
            [user_id, event_id, registered_at]
        );

        res.status(201).json({
            rsvpId: result.insertId,
            message: "Successfully registered for the event."
        });
    } catch (error) {
        console.error("Error creating RSVP:", error);
        res.status(500).json({ message: "Internal server error." });
    }
}

exports.getRsvpCount = async (req, res) => {
    const { eventId } = req.params;
    if (!eventId) {
        return res.status(400).json({ message: "Event ID is required." });
    }

    try {
        const [[{ count }]] = await db.query(
            "SELECT COUNT(*) as count FROM rsvps WHERE event_id = ?",
            [eventId]
        );

        res.status(200).json({ eventId, rsvpCount: count });
    } catch (error) {
        console.error("Error fetching RSVP count:", error);
        res.status(500).json({ message: "Internal server error." });
    }
}
exports.checkUserRsvp = async (req, res) => {
    const { event_id, user_id } = req.body;

    if (!event_id || !user_id) {
        return res.status(400).json({ message: "Event ID and User ID are required." });
    }

    try {
        const [[{ count }]] = await db.query(
            "SELECT COUNT(*) as count FROM rsvps WHERE event_id = ? AND user_id = ?",
            [event_id, user_id]
        );
        res.json({ rsvped: count > 0 });
    } catch (err) {
        console.error("Error checking RSVP:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};
