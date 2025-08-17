import { useEffect, useState } from "react";
import {
    Container,
    Typography,
    CircularProgress,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Link,
} from "@mui/material";
import _axios from "../axios.js";
import { useNavigate } from "react-router-dom";
import TopReactions from "../components/TopReactions";

function Trending() {
    const [events, setEvents] = useState([]);
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

    useEffect(() => {
        getEvents();
    }, []);

    return (
        <Container sx={{ mt: 4 }}>
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
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>Title</strong></TableCell>
                                <TableCell><strong>Description</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {events.map((event) => (
                                <TableRow key={event.id} hover>
                                    <TableCell>
                                        <Link
                                            component="button"
                                            variant="body1"
                                            onClick={() => navigate(`/event/${event.id}`)}
                                            underline="hover"
                                        >
                                            {event.title}
                                        </Link>
                                    </TableCell>
                                    <TableCell>{event.description}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Container>
    );
}

export default Trending;
