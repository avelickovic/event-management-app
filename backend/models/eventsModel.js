const db = require("../config/db");
const Joi = require("joi");
exports.createEvent = async (req, res) => {
    const schema = Joi.object({
        title: Joi.string().required(),
        description: Joi.string().required(),
        event_datetime: Joi.date().required(),
        location: Joi.string().required(),
        author_id: Joi.number().integer().required(),
        category_id: Joi.number().integer().required(),
        max_capacity: Joi.number().integer().min(1),
        tags: Joi.string().required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    const { title, description, event_datetime, location, author_id, category_id, max_capacity, tags } = req.body;

    // Format datetime for MySQL DATETIME column
    const mysqlDatetime = new Date(event_datetime).toISOString().slice(0, 19).replace('T', ' ');

    const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
    const tagIds = [];

    try {
        // For each tag: check if exists, else insert, then get ID
        for (const tagName of tagList) {
            const [rows] = await db.query("SELECT id FROM tags WHERE name = ?", [tagName]);

            let tagId;
            if (rows.length > 0) {
                tagId = rows[0].id; // Tag exists
            } else {
                const [insertResult] = await db.query("INSERT INTO tags (name) VALUES (?)", [tagName]);
                tagId = insertResult.insertId;
            }

            tagIds.push(tagId);
        }
    } catch (err) {
        console.error("Error handling tags:", err);
        return res.status(500).json({ message: "Internal server error while processing tags." });
    }

    let eventResult;
    try {
        const [result] = await db.query(
            "INSERT INTO events (title, description, event_datetime, location, author_id, category_id, max_capacity) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [title, description, mysqlDatetime, location, author_id, category_id, max_capacity]
        );
        eventResult = result;
    } catch (err) {
        console.error("Error creating event:", err);
        return res.status(500).json({ message: "Internal server error while creating event." });
    }

    try {
        // Link event with tags
        for (const tagId of tagIds) {
            await db.query(
                "INSERT INTO event_tags (event_id, tag_id) VALUES (?, ?)",
                [eventResult.insertId, tagId]
            );
        }

        return res.status(201).json({
            message: "Event created successfully.",
            eventId: eventResult.insertId,
            tags: tagList
        });
    } catch (err) {
        console.error("Error linking tags to event:", err);
        return res.status(500).json({ message: "Internal server error while linking tags to event." });
    }
};


exports.getEventById = async (eventId) => {
    try {
        const [rows] = await db.query("SELECT * FROM events WHERE id = ?", [eventId]);
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error("Error fetching event by ID:", error);
        throw error;
    }
}
exports.getAllEvents = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM events");
        return res.status(200).json(rows);
    } catch (error) {
        console.error("Error fetching all events:", error);
        return res.status(500).json({ message: "Server error." });
    }

}
exports.updateEvent = async (req, res) => {
    const { eventId } = req.params;

    const schema = Joi.object({
        title: Joi.string(),
        description: Joi.string(),
        event_datetime: Joi.date(),
        location: Joi.string(),
        author_id: Joi.number().integer(),
        category_id: Joi.number().integer(),
        max_capacity: Joi.number().integer().min(1),
        tags: Joi.string() // Comma-separated tag string (optional)
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    const fields = [];
    const values = [];

    for (const key in value) {
        if (key !== "tags" && value[key] !== undefined) {
            fields.push(`${key} = ?`);
            values.push(value[key]);
        }
    }

    if (fields.length === 0 && !value.tags) {
        return res.status(400).json({ message: "No fields to update." });
    }

    // Update event fields if present
    if (fields.length > 0) {
        values.push(eventId);
        try {
            await db.query(`UPDATE events SET ${fields.join(", ")} WHERE id = ?`, values);
        } catch (err) {
            console.error("Error updating event:", err);
            return res.status(500).json({ message: "Internal server error during event update." });
        }
    }

    // Handle tags if present
    if (value.tags) {
        const newTagList = value.tags.split(',').map(t => t.trim()).filter(Boolean);
        const newTagIds = [];

        try {
            // Get existing tag IDs for this event
            const [existingRows] = await db.query("SELECT tag_id FROM event_tags WHERE event_id = ?", [eventId]);
            const existingTagIds = existingRows.map(row => row.tag_id);

            // Map tag names to IDs (insert if needed)
            for (const tagName of newTagList) {
                const [rows] = await db.query("SELECT id FROM tags WHERE name = ?", [tagName]);
                let tagId;
                if (rows.length > 0) {
                    tagId = rows[0].id;
                } else {
                    const [insertResult] = await db.query("INSERT INTO tags (name) VALUES (?)", [tagName]);
                    tagId = insertResult.insertId;
                }
                newTagIds.push(tagId);
            }

            // Calculate tags to remove
            const tagsToRemove = existingTagIds.filter(id => !newTagIds.includes(id));
            if (tagsToRemove.length > 0) {
                await db.query(
                    `DELETE FROM event_tags WHERE event_id = ? AND tag_id IN (${tagsToRemove.map(() => '?').join(',')})`,
                    [eventId, ...tagsToRemove]
                );
            }

            // Add new tag links if not already present
            for (const tagId of newTagIds) {
                if (!existingTagIds.includes(tagId)) {
                    await db.query("INSERT INTO event_tags (event_id, tag_id) VALUES (?, ?)", [eventId, tagId]);
                }
            }

        } catch (err) {
            console.error("Error updating tags:", err);
            return res.status(500).json({ message: "Internal server error while updating tags." });
        }
    }

    return res.status(200).json({ message: "Event updated successfully." });
};
exports.searchEvents = async (req, res) => {
    const { searchTerm } = req.query;

    if (!searchTerm) {
        return res.status(400).json({ message: "Search term is required." });
    }

    try {
        const [rows] = await db.query(
            "SELECT * FROM events WHERE title LIKE ? OR description LIKE ?",
            [`%${searchTerm}%`, `%${searchTerm}%`]
        );
        res.status(200).json(rows);
    } catch (error) {
        console.error("Error searching events:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}
exports.incrementLikeCount = async (req, res) => {
    const { eventId } = req.params;
    console.log(eventId);
    if (!req.session.likedEvents) {
        req.session.likedEvents = [];
    }

    if (req.session.likedEvents.includes(eventId)) {
        return res.status(403).json({ message: "You already liked this event." });
    }

    try {
        const [result] = await db.query(
            "UPDATE events SET likes = likes + 1 WHERE id = ?",
            [eventId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Event not found." });
        }

        req.session.likedEvents.push(eventId);
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error incrementing like count:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
exports.incrementDislikeCount = async (req, res) => {
    const { eventId } = req.params;

    if (!req.session.likedEvents) {
        req.session.likedEvents = [];
    }

    if (req.session.likedEvents.includes(eventId)) {
        return res.status(403).json({ message: "You already disliked this event." });
    }

    try {
        const [result] = await db.query(
            "UPDATE events SET dislikes = dislikes + 1 WHERE id = ?",
            [eventId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Event not found." });
        }

        req.session.likedEvents.push(eventId);
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error incrementing dislike count:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
exports.incrementViewCount = async (req, res) => {
    const { eventId } = req.params;
    if(!req.session.viewedevents) {
        req.session.viewedevents = [];
    }
    if (req.session.viewedevents.includes(eventId)) {
        return res.status(403).json({ message: "You already viewed this event." });
    }
    try {
        const [result] = await db.query(
            "UPDATE events SET views = views + 1 WHERE id = ?",
            [eventId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Event not found." });
        }
        req.session.viewedevents.push(eventId);
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error incrementing view count:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
exports.deleteEvent = async (req, res) => {
    const { eventId } = req.params;

    try {
        const [result] = await db.query("DELETE FROM events WHERE id = ?", [eventId]);
        await db.query("DELETE FROM comments WHERE event_id = ?", [eventId]);
        await db.query("DELETE FROM event_tags WHERE event_id = ?", [eventId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Event not found." });



        }
        res.status(200).json({ message: "Event deleted successfully." });
    } catch (error) {
        console.error("Error deleting event:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}