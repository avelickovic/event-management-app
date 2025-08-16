const db = require("../config/db");

exports.getAllTagsByEvent = async (req, res) => {
    const { eventId } = req.params;
    console.log(eventId);
    if (!eventId) {
        return res.status(400).json({ message: "Event ID is required." });
    }
    try{
        const [result] = await db.query(
            "SELECT t.id, t.name FROM tags t JOIN event_tags et ON t.id = et.tag_id WHERE et.event_id = ?",
            [eventId]
        );
        res.status(200).json(result);


    }
    catch (error) {
        console.error("Error fetching tags by event ID:", error);
        res.status(500).json({ message: "Internal server error." });
    }

}
exports.getIdbyTag = async (req, res) => {
    const {tagName}=req.params;


    if (!tagName) {
        return res.status(400).json({ message: "Tag name is required." });
    }
    try {

        const [rows] = await db.query(
            "SELECT id FROM tags WHERE name = ?",
            [tagName]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: "Tag not found." });
        }

        return res.status(200).json(rows[0]);
    } catch (error) {
        console.error("Error fetching tag by name:", error);
        res.status(500).json({ message: "Internal server error." });
    }
}
