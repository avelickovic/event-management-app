const db = require("../config/db");
const joi = require("joi");

exports.createCategory = async (req, res) => {
    const { name, description } = req.body;

    if (!name || !description) {
        return res.status(400).json({ message: "Name and description are required." });
    }

    try {


        const [existingCategory] = await db.query(
            "SELECT * FROM categories WHERE name = ?",
            [name]
        );
        if (existingCategory.length > 0) {
            return res.status(400).json({ message: "Category already exists." });
        }
        const [result] = await db.query(
            "INSERT INTO categories (name, description) VALUES (?, ?)",
            [name, description]
        );

        res.status(201).json({ categoryId: result.insertId });
    } catch (error) {
        console.error("Error creating category:", error);
        res.status(500).json({ message: "Internal server error." });
    }
}

exports.getAllCategories = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 0;
        const limit = parseInt(req.query.limit) || 15;

        const offset = page * limit;


        const [[{ total }]] = await db.query("SELECT COUNT(*) as total FROM categories");


        const [rows] = await db.query("SELECT * FROM categories LIMIT ? OFFSET ?", [limit, offset]);

        res.status(200).json({
            data: rows,
            total: total,
            page: page,
            limit: limit
        });
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

exports.getCategoryById = async (req, res) => {
    const { categoryId } = req.params;

    try {
        const [rows] = await db.query("SELECT * FROM categories WHERE id = ?", [categoryId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: "Category not found." });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error("Error fetching category by ID:", error);
        res.status(500).json({ message: "Internal server error." });
    }
}
exports.updateCategory = async (req, res) => {
    const {id} = req.params;

    const schema = joi.object({
        name: joi.string().required(),
        description: joi.string().required()
    });
    const {error, value} = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    const fields = [];
    const values = [];
    if (value.name) {
        fields.push("name = ?");
        values.push(value.name);
    }
    if (value.description) {
        fields.push("description = ?");
        values.push(value.description);
    }
    if (fields.length === 0) {
        return res.status(400).json({ message: "No fields to update." });
    }
    values.push(id);

    try {
        const [result] = await db.query(
            `UPDATE categories SET ${fields.join(", ")} WHERE id = ?`,
            values
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Category not found." });
        }
        res.status(200).json({ message: "Category updated successfully." });
    } catch (error) {
        console.error("Error updating category:", error);
        res.status(500).json({ message: "Internal server error." });
    }
}
exports.deleteCategory = async (req, res) => {
    const { id } = req.params;

    try {
        const [eventCheck] = await db.query(
            "SELECT * FROM events WHERE category_id = ?",
            [id]
        );
        if (eventCheck.length > 0) {
            return res.status(400).json({ message: "Cannot delete category with associated events." });
        }

        const [result] = await db.query("DELETE FROM categories WHERE id = ?", [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Category not found." });
        }
        res.status(200).json({ message: "Category deleted successfully." });
    } catch (error) {
        console.error("Error deleting category:", error);
        res.status(500).json({ message: "Internal server error." });
    }
}
exports.getIdByName = async (req, res) => {
    const { name } = req.params;

    try {
        const [rows] = await db.query("SELECT id FROM categories WHERE name = ?", [name]);
        if (rows.length === 0) {
            return res.status(404).json({ message: "Category not found." });
        }
        res.status(200).json({ id: rows[0].id });
    } catch (error) {
        console.error("Error fetching category ID by name:", error);
        res.status(500).json({ message: "Internal server error." });
    }
}