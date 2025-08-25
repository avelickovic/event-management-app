import {
    Container, Grid, Pagination, Typography, Box, CircularProgress, Alert,
    FormControl, InputLabel, Select, MenuItem, Stack, Paper
} from "@mui/material";
import Card from "../components/Card.jsx";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import _axios from "../axios.js";
import TopReactions from "../components/TopReactions.jsx";

function Categories() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(6);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const navigate = useNavigate();

    const fetchCategories = async () => {
        try {
            const res = await _axios.get("/api/categories/");
            setCategories(res.data.data || []);
            if (res.data.data.length > 0) {
                setSelectedCategory(res.data.data[0].id);
            }
        } catch (err) {
            console.error(err);
            setError("Failed to load categories");
        }
    };

    const fetchEvents = async (categoryId, currentPage, currentLimit) => {
        if (!categoryId) return;
        try {
            setLoading(true);

            const eventsRes = await _axios.get(`/api/events/eventsByCategory/${categoryId}`, {
                params: { page: currentPage, limit: currentLimit }
            });

            setEvents(eventsRes.data.events || []);
            setTotal(eventsRes.data.total || 0);
            setTotalPages(Math.max(1, eventsRes.data.totalPages || 1));

            if (currentPage > eventsRes.data.totalPages && eventsRes.data.totalPages > 0) {
                setPage(1);
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to load events");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let isMounted = true;

        const fetchAll = async () => {
            if (!isMounted) return;

            await fetchCategories();
            if (selectedCategory) {
                await fetchEvents(selectedCategory, page, limit);
            }
        };

        fetchAll();
        const interval = setInterval(fetchAll, 10000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [selectedCategory, page, limit]);


    const handlePageChange = (_, value) => {
        setPage(value);
    };

    const handleLimitChange = (event) => {
        setLimit(event.target.value);
        setPage(1);
    };

    const handleCategoryChange = (event) => {
        setSelectedCategory(event.target.value);
        setPage(1);
    };

    return (
        <Container sx={{ mt: 4 }}>
            <TopReactions />
            <Typography variant="h4" gutterBottom>
                Browse Events by Category
            </Typography>

            <Box sx={{ mb: 3, display: "flex", gap: 2 }}>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel id="category-select-label">Category</InputLabel>
                    <Select
                        labelId="category-select-label"
                        value={selectedCategory}
                        label="Category"
                        onChange={handleCategoryChange}
                    >
                        {categories.map(cat => (
                            <MenuItem key={cat.id} value={cat.id}>
                                {cat.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Alert severity="error">{error}</Alert>
            ) : events.length === 0 ? (
                <Alert severity="info">No events found for this category.</Alert>
            ) : (
                <>
                    <Grid container spacing={3} justifyContent="center" alignItems="flex-start">
                        {events.map(event => (
                            <Grid item key={event.id} sx={{ width: 300 }}>
                                <Card
                                    title={event.title}
                                    description={event.description}
                                    date={new Date(event.event_datetime || event.created_at).toLocaleDateString()}
                                    category={categories.find(c => c.id === event.category_id)?.name || "Unknown"}
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

export default Categories;
