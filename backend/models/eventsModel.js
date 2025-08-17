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


    const mysqlDatetime = new Date(event_datetime).toISOString().slice(0, 19).replace('T', ' ');

    const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
    const tagIds = [];

    try {

        for (const tagName of tagList) {
            const [rows] = await db.query("SELECT id FROM tags WHERE name = ?", [tagName]);

            let tagId;
            if (rows.length > 0) {
                tagId = rows[0].id;
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


    exports.getEventById = async (req,res) => {
        const { id } = req.params;

        try {
            const [rows] = await db.query("SELECT * FROM events WHERE id = ?", [id]);

            console.log("Rows fetched:", rows.length > 0 ? rows[0] : null);
            return res.status(200).json(rows.length > 0 ? rows[0] : { message: "Event not found." });
        } catch (error) {
            console.error("Error fetching event by ID:", error);
            res.status(500).json({ message: "Internal server error." });
            throw error;
        }
    }
exports.getAllEvents = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM events");
        if (rows.length === 0) {
            return res.status(404).json({ message: "No events found." });
        }
        return res.status(200).json(rows);
    } catch (error) {
        console.error("Error fetching all events:", error);
        return res.status(500).json({ message: "Server error." });
    }

}
exports.getAllEventsSortedByDateCreated = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM events  ORDER BY created_at DESC");
        if (rows.length === 0) {
            return res.status(404).json({ message: "No events found." });
        }
        return res.status(200).json(rows);
    } catch (error) {
        console.error("Error fetching all events:", error);
        return res.status(500).json({ message: "Server error." });
    }

}
exports.getAllEventsSortedByDateCreatedPagination = async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 0;
    const offset = page * limit;


    try {
        const [rows] = await db.query("SELECT * FROM events ORDER BY created_at DESC LIMIT ? OFFSET ?", [limit, offset]);
        const [[{ total }]] = await db.query("SELECT COUNT(*) AS total FROM events");

        if (rows.length === 0) {
            return res.status(404).json({ message: "No events found." });
        }

        return res.status(200).json({
            events: rows,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });

    } catch (error) {
        console.error("Error fetching all events with pagination:", error);
        return res.status(500).json({ message: "Server error." });
    }
}

exports.get10EventsSortedByViews = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM events WHERE event_datetime >= DATE_SUB(NOW(), INTERVAL 30 DAY) ORDER BY views DESC LIMIT 10");
        if (rows.length === 0) {
            return res.status(404).json({ message: "No events found." });
        }
        return res.status(200).json(rows);

    } catch (error) {
        console.error("Error fetching top 10 events by views:", error);
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
        tags: Joi.string()
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

    if (fields.length > 0) {
        values.push(eventId);
        try {
            await db.query(`UPDATE events SET ${fields.join(", ")} WHERE id = ?`, values);
        } catch (err) {
            console.error("Error updating event:", err);
            return res.status(500).json({ message: "Internal server error during event update." });
        }
    }

    if (value.tags !== undefined) {
        const newTagList = value.tags
            .split(',')
            .map(t => t.trim())
            .filter(Boolean);

        try {
            const [existingRows] = await db.query(
                "SELECT tag_id FROM event_tags WHERE event_id = ?",
                [eventId]
            );
            const existingTagIds = existingRows.map(r => r.tag_id);

            const newTagIds = [];

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

            const tagsToRemove = existingTagIds.filter(id => !newTagIds.includes(id));
            if (tagsToRemove.length > 0) {
                await db.query(
                    `DELETE FROM event_tags WHERE event_id = ? AND tag_id IN (${tagsToRemove.map(() => '?').join(',')})`,
                    [eventId, ...tagsToRemove]
                );

                for (const tagId of tagsToRemove) {
                    const [countRows] = await db.query(
                        "SELECT COUNT(*) as cnt FROM event_tags WHERE tag_id = ?",
                        [tagId]
                    );
                    if (countRows[0].cnt === 0) {
                        await db.query("DELETE FROM tags WHERE id = ?", [tagId]);
                    }
                }
            }

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
    const { searchTerm, page = 1, limit = 10 } = req.query;

    if (!searchTerm) {
        return res.status(400).json({ message: "Search term is required." });
    }

    const offset = (page - 1) * limit;

    try {

        const [[{ total }]] = await db.query(
            "SELECT COUNT(*) as total FROM events WHERE title LIKE ? OR description LIKE ?",
            [`%${searchTerm}%`, `%${searchTerm}%`]
        );


        const [rows] = await db.query(
            "SELECT * FROM events WHERE title LIKE ? OR description LIKE ? LIMIT ? OFFSET ?",
            [`%${searchTerm}%`, `%${searchTerm}%`, parseInt(limit), parseInt(offset)]
        );

        res.status(200).json({
            events: rows,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error("Error searching events:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.incrementLikeCount = async (req, res) => {
    const { eventId } = req.params;
    console.log(eventId);
    if (!req.session.likedEvents) {
        req.session.likedEvents = [];
    }

    if (req.session.likedEvents.includes(eventId)) {
        return res.status(403).json({ message: "You already reacted to this event." });
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
        return res.status(403).json({ message: "You already reacted to this event" });
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
    const { id } = req.params;
    const eventIdStr = String(id);

    if (!req.session.viewedevents) req.session.viewedevents = [];

    try {
        if (req.session.viewedevents.includes(eventIdStr)) {
            const [rows] = await db.query(
                "SELECT * FROM events WHERE id = ?",
                [id]
            );
            if (!rows.length) return res.status(404).json({ message: "Event not found." });
            return res.status(200).json(rows[0]);
        }

        req.session.viewedevents.push(eventIdStr);

        await db.query("UPDATE events SET views = views + 1 WHERE id = ?", [id]);

        const [rows] = await db.query("SELECT * FROM events WHERE id = ?", [id]);
        if (!rows.length) return res.status(404).json({ message: "Event not found." });

        return res.status(200).json(rows[0]);
    } catch (err) {
        console.error("Error incrementing view count:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};



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
exports.getEventsByTag = async (req, res) => {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    try {
        const [events] = await db.query(
            `SELECT e.*
             FROM events e
             JOIN event_tags et ON e.id = et.event_id
             WHERE et.tag_id = ?
             ORDER BY e.created_at DESC
             LIMIT ? OFFSET ?`,
            [id, limit, offset]
        );

        const [[{ total }]] = await db.query(
            `SELECT COUNT(*) AS total
             FROM events e
             JOIN event_tags et ON e.id = et.event_id
             WHERE et.tag_id = ?`,
            [id]
        );

        res.status(200).json({
            events,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error("Error fetching events by tag:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.getRelatedEvents = async (req, res) => {
    const { eventId } = req.params;
    console.log("Fetching event with id ",eventId);
    if (!eventId) {
        return res.status(400).json({ message: "Event ID is required" });
    }

    try {
        const [tags] = await db.query(
            "SELECT tag_id FROM event_tags WHERE event_id = ?",
            [eventId]
        );

        if (!tags.length) {
            return res.json({ relatedEvents: [] });
        }

        const tagIds = tags.map(t => t.tag_id);

        const [relatedEvents] = await db.query(
            `SELECT DISTINCT e.*
             FROM events e
             JOIN event_tags et ON e.id = et.event_id
             WHERE et.tag_id IN (?)
             AND e.id != ?
             LIMIT 3`,
            [tagIds, eventId]
        );

        res.json({ relatedEvents });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch related events" });
    }
};
exports.getTopReactions = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT e.id, e.title, e.likes, e.dislikes
             FROM events e
             ORDER BY (e.likes - e.dislikes) DESC
             LIMIT 3`
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "No events found." });
        }

        return res.status(200).json(rows);
    } catch (error) {
        console.error("Error fetching top reactions:", error);
        return res.status(500).json({ message: "Server error." });
    }
}
exports.getEventsByCategory = async (req, res) => {
    const { categoryId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    try {
        const [events] = await db.query(
            `SELECT * FROM events WHERE category_id = ? LIMIT ? OFFSET ?`,
            [categoryId, limit, offset]
        );

        const [[{ total }]] = await db.query(
            `SELECT COUNT(*) AS total FROM events WHERE category_id = ?`,
            [categoryId]
        );

        res.status(200).json({
            events,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error("Error fetching events by category:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}



