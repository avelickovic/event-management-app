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
    TablePagination,
    Box,
    TextField,
    Button,
} from "@mui/material";
import {useLocation, useNavigate} from "react-router-dom";
import _axios from "../axios.js";

function useQuery() {
    return new URLSearchParams(useLocation().search);
}
function SearchEventsPage() {
    const query = useQuery();
    const initialTerm = query.get("term") || "";

    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [total, setTotal] = useState(0);

    const [searchTerm, setSearchTerm] = useState(initialTerm);
    const [submittedTerm, setSubmittedTerm] = useState(initialTerm);

    const navigate = useNavigate();

    const fetchEvents = async (pageNum = page, limit = rowsPerPage) => {
        if (!submittedTerm) return;
        setLoading(true);
        setError(null);

        try {
            const response = await _axios.get("/api/events/search", {
                params: {
                    searchTerm: submittedTerm,
                    page: pageNum + 1,
                    limit,
                },
            });

            setEvents(response.data.events);
            setTotal(response.data.total);
        } catch (err) {
            console.error("Error fetching search results:", err);
            setError(err.response?.data?.message || "Failed to load search results");
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        if (initialTerm) {
            setSearchTerm(initialTerm);
            setSubmittedTerm(initialTerm);
        }
    }, [initialTerm]);

    useEffect(() => {
        if (submittedTerm) fetchEvents();
    }, [page, rowsPerPage, submittedTerm]);

    const handleSearch = () => {
        setPage(0);
        setSubmittedTerm(searchTerm.trim());
    };

    return (
        <Container sx={{ mt: 4 }}>
            <Typography variant="h4" gutterBottom>
                Search Events
            </Typography>


            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                <TextField
                    label="Search term"
                    variant="outlined"
                    fullWidth
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button
                    variant="contained"
                    onClick={handleSearch}
                    disabled={!searchTerm.trim()}
                >
                    Search
                </Button>
            </Box>

            {loading ? (
                <CircularProgress sx={{ display: "block", margin: "20px auto" }} />
            ) : error ? (
                <Alert severity="error">{error}</Alert>
            ) : events.length === 0 && submittedTerm ? (
                <Alert severity="info">No events found.</Alert>
            ) : (
                <>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell><strong>Title</strong></TableCell>
                                    <TableCell><strong>Description</strong></TableCell>
                                    <TableCell><strong>Date</strong></TableCell>
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
                                        <TableCell>
                                            {new Date(event.event_datetime).toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <TablePagination
                        component="div"
                        count={total}
                        page={page}
                        onPageChange={(e, newPage) => setPage(newPage)}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={(e) => {
                            setRowsPerPage(parseInt(e.target.value, 10));
                            setPage(0);
                        }}
                        rowsPerPageOptions={[5, 10, 25, 50, 100]}
                    />

                </>
            )}
        </Container>
    );
}

export default SearchEventsPage;
