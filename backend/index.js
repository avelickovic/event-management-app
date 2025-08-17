
const express = require("express");
const cors = require("cors");
const userRoutes = require("./routes/userRoutes");
const categoriesRoutes = require("./routes/categoriesRoutes");
const eventsRoutes = require("./routes/eventsRoutes");
const commentsRoutes = require("./routes/commentsRoutes");
const tagsRoutes = require("./routes/tagsRoutes");
const app = express();
const dotenv = require("dotenv");
const db = require("./config/db");
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

const sessionStore = new MySQLStore({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'event_management',
});
dotenv.config();

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(session({
    secret: process.env.SESSION_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store : sessionStore,
    cookie: {
        httpOnly: true,
        sameSite: 'lax'
    }
}));
app.use(express.json());
app.use("/api/users", userRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/comments",commentsRoutes);
app.use("/api/tags",tagsRoutes);

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

