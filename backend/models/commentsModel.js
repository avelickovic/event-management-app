const db = require("../config/db");

exports.createComment = async (req, res) => {
    const { eventId, userName, content } = req.body;

    if (!eventId || !userName || !content) {
        return res.status(400).json({ message: "Event ID, User ID, and content are required." });
    }

    try {
        const [result] = await db.query(
            "INSERT INTO comments (author_name, content, created_at, event_id) VALUES (?, ?, NOW(), ?)",
            [userName, content, eventId]
        );

        const [rows] = await db.query(
            "SELECT id, author_name AS authorName, content, likes, dislikes, created_at FROM comments WHERE id = ?",
            [result.insertId]
        );

        res.status(201).json(rows[0]);
    } catch (error) {
        console.error("Error creating comment:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

exports.getCommentsByEventIdByDate = async (req,res) => {
    const {eventId}= req.params;

    console.log(eventId);

    try {
        const [rows] = await db.query("SELECT \n" +
            "    id, \n" +
            "    author_name AS authorName, \n" +
            "    content, \n" +
            "    likes, \n" +
            "    dislikes, \n" +
            "    created_at \n" +
            "FROM comments \n" +
            "WHERE event_id = ?\n" +
            "ORDER BY created_at DESC\n", [eventId]);
        return res.status(200).json(rows);
    } catch (error) {
        console.error("Error fetching comments by event ID:", error);
        throw error;
    }
}
exports.getAllComments = async () => {
    try {
        const [rows] = await db.query("SELECT * FROM comments");
        return rows;
    } catch (error) {
        console.error("Error fetching all comments:", error);
        throw error;
    }
}
exports.incrementLikeCount = async (req, res) => {
    const { commentId } = req.params;

    if (!req.session.likedComments) {
        req.session.likedComments = [];
    }

    if (req.session.likedComments.includes(commentId)) {
        return res.status(403).json({ message: "You already reacted to this comment." });
    }

    try {
        const [result] = await db.query(
            "UPDATE comments SET likes = likes + 1 WHERE id = ?",
            [commentId]
        );


        req.session.likedComments.push(commentId);

        return res.status(200).json({ success: result.affectedRows > 0 });
    } catch (error) {
        console.error("Error incrementing like count:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};
exports.incrementDislikeCount = async (req,res) => {
    const {commentId} = req.params;
    if (!req.session.likedComments) {
        req.session.likedComments = [];
    }

    if (req.session.likedComments.includes(commentId)) {
        return res.status(403).json({ message: "You already reacted to this comment." });
    }
    try {
        const [result] = await db.query(
            "UPDATE comments SET dislikes = dislikes + 1 WHERE id = ?",
            [commentId]
        );

        req.session.likedComments.push(commentId);
        return res.status(200).json({ success: result.affectedRows > 0 });
    } catch (error) {
        console.error("Error incrementing dislike count:", error);
        throw error;
    }
}
exports.getCommentById = async (req,res) => {
    const {commentId} = req.params;
    try {
        const [rows] = await db.query("SELECT * FROM comments WHERE id = ?", [commentId]);
        return res.status(200).json(rows);
    } catch (error) {
        console.error("Error fetching comment by ID:", error);
        throw error;
    }
}