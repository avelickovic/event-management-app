
const express = require("express");
const cors = require("cors");
const userRoutes = require("./routes/userRoutes");
const categoriesRoutes = require("./routes/categoriesRoutes");
const eventsRoutes = require("./routes/eventsRoutes");
const commentsRoutes = require("./routes/commentsRoutes");
const app = express();
const dotenv = require("dotenv");
const db = require("./config/db");
const session = require('express-session');

dotenv.config();
app.use(cors());
app.use(session({secret:process.env.SESSION_SESSION_SECRET, resave: false,  saveUninitialized: false}));
app.use(express.json());
app.use("/api/users", userRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/comments",commentsRoutes);

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

/*app.get("/", async (req, res) => {
    try{

        const [rows] = await db.query("SELECT * FROM users");
        res.json(rows);
        console.log(rows);
    } catch (error) {
        console.log(error);
        res.status(500).send("Error connecting to the database");

    }


})
*/