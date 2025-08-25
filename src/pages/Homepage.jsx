import { useEffect, useState } from "react";
import { Grid, Container } from "@mui/material";
import Card from "../components/Card";
import _axios from "../axios.js";
import { useNavigate } from "react-router-dom";
import TopReactions from "../components/TopReactions";

function Homepage() {
    const [events, setEvents] = useState([]);
    const [categories, setCategories] = useState({});
    const navigate = useNavigate();

    const getEvents = async () => {
        try {
            const response = await _axios.get("/api/events/eventsbydate");
            setEvents(response.data);
        } catch (error) {
            console.error("Error fetching events:", error);
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

        const interval = setInterval(() => {
            getEvents();
            getCategories();
        }, 10000);

        return () => clearInterval(interval);
    }, []);


    return (
        <Container sx={{ mt: 4, position: "relative" }}>
            <h1>Welcome to the Homepage</h1>


            <TopReactions />

            <Grid container spacing={3} justifyContent="center" alignItems="flex-start" wrap="wrap">
                {events.map((event) => (
                    <Grid item key={event.id} sx={{ width: 300 }}>
                        <Card
                            title={event.title}
                            description={event.description}
                            date={new Date(event.created_at).toLocaleDateString()}
                            category={categories[event.category_id] || "Unknown"}
                            onClick={() => navigate(`/event/${event.id}`)}
                        />
                    </Grid>
                ))}
            </Grid>
        </Container>
    );
}

export default Homepage;
