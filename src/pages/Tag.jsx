import {
    Container, Grid, Pagination, Typography, Box, CircularProgress, Alert,
    FormControl, InputLabel, Select, MenuItem, Stack, Paper
} from "@mui/material";
import Card from "../components/Card.jsx";
import {useNavigate, useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import _axios from "../axios.js";
import TopReactions from "../components/TopReactions.jsx";

function Tag() {
    const { tagName } = useParams();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [categories, setCategories] = useState({});
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(6);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const navigate = useNavigate();

    const fetchData = async (currentPage, currentLimit) => {
        try {
            setLoading(true);
            const tagRes = await _axios.get(`/api/tags/name/${tagName}`);
            const tagId = tagRes.data.id;

            const eventsRes = await _axios.get(`/api/events/eventsByTag/${tagId}`, {
                params: { page: currentPage, limit: currentLimit }
            });

            setEvents(eventsRes.data.events || []);
            setTotal(eventsRes.data.total || 0);
            setTotalPages(Math.max(1, eventsRes.data.totalPages || 1));

            // Reset to page 1 if current page is beyond total pages
            if (currentPage > eventsRes.data.totalPages && eventsRes.data.totalPages > 0) {
                setPage(1);
            }

            const categoriesRes = await _axios.get("/api/categories/");
            const categoryMap = {};
            categoriesRes.data.data.forEach(cat => {
                categoryMap[cat.id] = cat.name;
            });
            setCategories(categoryMap);

        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to load events for this tag");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(page, limit);
    }, [tagName, page, limit]);

    const handlePageChange = (_, value) => {
        setPage(value);
    };

    const handleLimitChange = (event) => {
        setLimit(event.target.value);
        setPage(1); // Reset to first page when changing limit
    };

    return (
        <Container sx={{ mt: 4 }}>
            <TopReactions />
            <Typography variant="h4" gutterBottom>
                Events tagged with "{tagName}"
            </Typography>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Alert severity="error">{error}</Alert>
            ) : events.length === 0 ? (
                <Alert severity="info">No events found with this tag.</Alert>
            ) : (
                <>
                    <Grid container spacing={3} justifyContent="center" alignItems="flex-start">
                        {events.map(event => (
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

                    <Paper elevation={0} sx={{ mt: 4, p: 2, backgroundColor: 'transparent' }}>
                        <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={2}
                            alignItems="center"
                            justifyContent="space-between"
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Showing {events.length} of {total} events
                                </Typography>
                                <FormControl size="small" sx={{ minWidth: 120 }}>
                                    <InputLabel id="items-per-page-label">Items per page</InputLabel>
                                    <Select
                                        labelId="items-per-page-label"
                                        value={limit}
                                        label="Items per page"
                                        onChange={handleLimitChange}
                                    >
                                        <MenuItem value={3}>3</MenuItem>
                                        <MenuItem value={6}>6</MenuItem>
                                        <MenuItem value={12}>12</MenuItem>
                                        <MenuItem value={24}>24</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>

                            {totalPages > 1 && (
                                <Pagination
                                    count={totalPages}
                                    page={page}
                                    onChange={handlePageChange}
                                    color="primary"
                                    size="medium"
                                    showFirstButton
                                    showLastButton
                                />
                            )}
                        </Stack>
                    </Paper>
                </>
            )}
        </Container>
    );
}

export default Tag;