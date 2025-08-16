import { useEffect, useState } from "react";
import { Box, Typography, Link, Paper, useMediaQuery } from "@mui/material";
import _axios from "../axios.js";
import { useNavigate } from "react-router-dom";

function TopReactions() {
    const [topReactions, setTopReactions] = useState([]);
    const navigate = useNavigate();
    const isSmallScreen = useMediaQuery("(max-width:900px)");

    const getTopReactions = async () => {
        try {
            const resp = await _axios.get("/api/events/topReactions");
            setTopReactions(resp.data);
        } catch (err) {
            console.error("Error fetching top reactions:", err);
        }
    };

    useEffect(() => {
        getTopReactions();
    }, []);

    return (
        <Paper
            elevation={3}
            sx={{
                position: isSmallScreen ? "relative" : "fixed",
                top: isSmallScreen ? "auto" : 80, // adjust for navbar height
                right: isSmallScreen ? "auto" : 20,
                p: 2,
                width: isSmallScreen ? "100%" : 250,
                bgcolor: "#fafafa",
                mb: isSmallScreen ? 3 : 0,
                zIndex: 1000,
            }}
        >
            <Typography variant="h6" gutterBottom>
                Top Rated
            </Typography>
            {topReactions.map((event) => (
                <Box key={event.id} mb={1}>
                    <Link
                        component="button"
                        variant="body1"
                        onClick={() => navigate(`/event/${event.id}`)}
                        sx={{ textAlign: "left" }}
                    >
                        {event.title}
                    </Link>
                    <Typography variant="body2" color="text.secondary">
                        Reakcije: {event.likes + event.dislikes}
                    </Typography>
                </Box>
            ))}
        </Paper>
    );
}

export default TopReactions;
