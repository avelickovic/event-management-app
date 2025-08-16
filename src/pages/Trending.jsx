import { useEffect, useState } from "react";
import { Grid, Container, Typography, CircularProgress, Alert } from "@mui/material";
import Card from "../components/Card";
import _axios from "../axios.js";
import { useNavigate } from "react-router-dom";
import TopReactions from "../components/TopReactions";

function Trending() {
    const [events, setEvents] = useState([]);
    const [categories, setCategories] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const getEvents = async () => {
        try {
            const response = await _axios.get("/api/events/eventsbyviews");
            setEvents(response.data);
        } catch (error) {
            console.error("Error fetching events:", error);
            setError(error.response?.data?.message || "Failed to load top viewed events");
        } finally {
            setLoading(false);
        }
    };

    const getCategories = async () => {
        try {
            const response = await _axios.get("/api/categories/");
            const categoryMap = {};
            response.data.data.forEach((cat) => {
                categoryMap[cat.id] = cat.name;
            });
            setCategories(categoryMap);
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    useEffect(() => {
        getEvents();
        getCategories();
    }, []);

    return (
        <Container sx={{ mt: 4, position: "relative" }}>
            <Typography variant="h4" gutterBottom>
                Top 10 Most Viewed Events (Last 30 Days)
            </Typography>

            <TopReactions />

            {loading ? (
                <CircularProgress sx={{ display: "block", margin: "20px auto" }} />
            ) : error ? (
                <Alert severity="error">{error}</Alert>
            ) : events.length === 0 ? (
                <Alert severity="info">No events found.</Alert>
            ) : (
                <Grid container spacing={3} justifyContent="center" alignItems="flex-start" wrap="wrap">
                    {events.map((event) => (
                        <Grid item key={event.id} sx={{ width: 300 }}>
                            <Card
                                title={event.title}
                                description={event.description}
                                date={new Date(event.event_datetime || event.created_at).toLocaleDateString()}
                                category={categories[event.category_id] || "Unknown"}
                                onClick={() => navigate(`/event/${event.id}`)}
                            />
                        </Grid>
                    ))}
                </Grid>
            )}
        </Container>
    );
}

export default Trending;
