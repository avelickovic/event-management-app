const db = require("../config/db");
const bcrypt = require("bcrypt");
const Joi = require('joi');

async function findUserByEmail(email) {
    try {
        const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error("Error finding user by email:", error);
        throw error;
    }
}
exports.findUserByEmail = findUserByEmail;

exports.createUser = async (req, res) => {
    try {
        const { email, name, lastname, type, password } = req.body;
        if (!email || !name || !lastname || !type || !password) {
            return res.status(400).json({ message: "All fields are required." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.query(
            "INSERT INTO users (email, first_name, last_name, user_type, status, password_hash) VALUES (?, ?, ?, ?, 'active', ?)",
            [email, name, lastname, type, hashedPassword]
        );

        return res.status(201).json({ userId: result.insertId });
    } catch (error) {
        console.error("Error creating user:", error);
        return res.status(500).json({ message: "Server error." });
    }
};
exports.getUserById = async (req,res) => {
    const { userId } = req.params;
    if (!userId) {
        return res.status(400).json({ message: "User ID is required." });
    }

    try {
        const [rows] = await db.query(
            "SELECT id, email, first_name, last_name, user_type, status FROM users WHERE id = ?",
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        return res.status(200).json(rows[0]);
    } catch (error) {
        console.error("Error fetching user by ID:", error);
        return res.status(500).json({ message: "Server error." });
    }
};
exports.getAllUsers= async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM users");
        return res.status(200).json(rows);

    }
    catch (error) {
        console.error("Error fetching all users:", error);
        return res.status(500).json({ message: "Server error." });
    }
}
exports.updateUser = async (req, res) => {
    const { userId } = req.params;


    const schema = Joi.object({
        email: Joi.string().email(),
        first_name: Joi.string().min(2),
        last_name: Joi.string().min(2),
        user_type: Joi.string().valid('event_creator', 'admin')

    });

    const { error, value } = schema.validate(req.body);

    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    const fields = [];
    const values = [];


    if (value.email) {
        fields.push("email = ?");
        values.push(value.email);
    }
    if (value.first_name) {
        fields.push("first_name = ?");
        values.push(value.first_name);
    }
    if (value.last_name) {
        fields.push("last_name = ?");
        values.push(value.last_name);
    }
    if (value.user_type) {
        fields.push("user_type = ?");
        values.push(value.user_type);
    }

    if (fields.length === 0) {
        return res.status(400).json({ message: "No valid fields provided to update." });
    }

    values.push(userId);

    const sql = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;

    try {
        const [result] = await db.query(sql, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        // Return updated user
        const [rows] = await db.query(
            "SELECT id, email, first_name , last_name, user_type FROM users WHERE id = ?",
            [userId]
        );

        return res.status(200).json({
            message: "User updated successfully.",
            user: rows[0]
        });

    } catch (error) {
        console.error("Error updating user:", error);
        return res.status(500).json({ message: "Server error." });
    }
};
exports.changeStatus = async (req, res) => {
    const { userId } = req.params;
    if (!userId) {
        return res.status(400).json({ message: "User ID is required." });
    }

    try {
        const user= await this.getUserById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        if(user.user_type === 'admin') {
            return res.status(403).json({ message: "Cannot change status of an admin user." });
        }
        const newStatus = user.status === 'active' ? 'inactive' : 'active';
        const [result] = await db.query(
            "UPDATE users SET status = ? WHERE id = ?",
            [newStatus, userId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "User not found." });
        }
        return res.status(200).json({ message: `User status changed to ${newStatus}.` });

    }
    catch (error) {
        console.error("Error changing user status:", error);
        return res.status(500).json({ message: "Server error." });
    }

}

