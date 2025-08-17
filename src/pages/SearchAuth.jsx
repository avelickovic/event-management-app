import { useEffect, useState } from "react";
import {
    Box,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    IconButton,
    TextField,
    Paper,
    Snackbar,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Select,
    MenuItem,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import _axios from "../axios.js";
import { useNavigate, useLocation } from "react-router-dom";
import { getUserId } from "../tools/auth.js";

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

export default function SearchEventsPage() {
    const query = useQuery();
    const initialTerm = query.get("term") || "";

    const [events, setEvents] = useState([]);
    const [categories, setCategories] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [total, setTotal] = useState(0);

    const [formData, setFormData] = useState({
        id: null,
        title: "",
        description: "",
        dateTime: "",
        location: "",
        categoryId: "",
        tags: "",
        maxCapacity: "",
    });
    const [openForm, setOpenForm] = useState(false);

    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

    const [searchTerm, setSearchTerm] = useState(initialTerm);
    const [submittedTerm, setSubmittedTerm] = useState(initialTerm);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await _axios.get("/api/categories");
                setCategories(res.data.data || []);
            } catch (err) {
                console.error("Error fetching categories", err);
                setCategories([]);
            }
        };
        fetchCategories();
    }, []);

    const fetchEvents = async (pageNum = page, limit = rowsPerPage) => {
        if (!submittedTerm) return;
        try {
            const res = await _axios.get("/api/events/search", {
                params: { searchTerm: submittedTerm, page: pageNum + 1, limit },
            });

            const enrichedEvents = await Promise.all(
                (res.data.events || []).map(async (event) => {
                    let authorName = event.author_id;
                    try {
                        const userRes = await _axios.get(`/api/users/getUserNameById/${event.author_id}`);
                        authorName = `${userRes.data.firstName} ${userRes.data.lastName}`;
                    } catch (err) {
                        console.error("Error fetching author name", err);
                    }

                    let tagsArray = [];
                    try {
                        const tagsRes = await _axios.get(`/api/tags/${event.id}`);
                        tagsArray = tagsRes.data.map((t) => t.name);
                    } catch (err) {
                        console.error("Error fetching tags", err);
                    }

                    return { ...event, authorName, tags: tagsArray };
                })
            );

            setEvents(enrichedEvents);
            setTotal(res.data.total || 0);
        } catch (err) {
            console.error("Error fetching search results", err);
            setEvents([]);
            setTotal(0);
        }
    };

    useEffect(() => {
        if (submittedTerm) fetchEvents();
    }, [page, rowsPerPage, submittedTerm]);

    const handleSearch = () => {
        setPage(0);
        setSubmittedTerm(searchTerm.trim());
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleEdit = (event) => {
        let tagsValue = Array.isArray(event.tags) ? event.tags.join(", ") : event.tags || "";
        setFormData({
            id: event.id,
            title: event.title || "",
            description: event.description || "",
            dateTime: event.event_datetime ? new Date(event.event_datetime).toISOString().slice(0, 16) : "",
            location: event.location || "",
            categoryId: event.category_id?.toString() || "",
            tags: tagsValue,
            maxCapacity: event.max_capacity?.toString() || "",
        });
        setOpenForm(true);
    };

    const handleDelete = async (eventId) => {
        try {
            await _axios.delete(`/api/events/delete/${eventId}`);
            showSnackbar("Event deleted", "success");
            fetchEvents(page, rowsPerPage);
        } catch (err) {
            console.error("Delete error", err);
            showSnackbar("Error deleting event", "error");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            title: formData.title,
            description: formData.description,
            event_datetime: formData.dateTime,
            location: formData.location,
            author_id: getUserId(),
            category_id: formData.categoryId,
            max_capacity: formData.maxCapacity || null,
            tags: formData.tags,
        };

        try {
            if (formData.id) await _axios.patch(`/api/events/update/${formData.id}`, payload);
            else await _axios.post("/api/events/createEvent", payload);

            showSnackbar(formData.id ? "Event updated" : "Event created", "success");
            fetchEvents(page, rowsPerPage);
            setOpenForm(false);
        } catch (err) {
            console.error("Error submitting form", err);
            showSnackbar("Error submitting form", "error");
        }
    };

    const showSnackbar = (message, severity) => setSnackbar({ open: true, message, severity });

    const handleCloseForm = () => {
        setOpenForm(false);
        setFormData({ id: null, title: "", description: "", dateTime: "", location: "", categoryId: "", tags: "", maxCapacity: "" });
    };

    return (
        <Box sx={{ maxWidth: 1000, margin: "auto", padding: 2 }}>
            <Typography variant="h4" gutterBottom>Search Results</Typography>

            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                <TextField
                    label="Search term"
                    variant="outlined"
                    fullWidth
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button variant="contained" onClick={handleSearch} disabled={!searchTerm.trim()}>Search</Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell><b>Title</b></TableCell>
                            <TableCell><b>Author</b></TableCell>
                            <TableCell><b>Created At</b></TableCell>
                            <TableCell><b>Actions</b></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {events.map((event) => (
                            <TableRow key={event.id} hover>
                                <TableCell>
                                    <a href={`/event/${event.id}`} target="_blank" rel="noopener noreferrer">{event.title}</a>
                                </TableCell>
                                <TableCell>{event.authorName || event.author_id}</TableCell>
                                <TableCell>{new Date(event.created_at || event.event_datetime).toLocaleString()}</TableCell>
                                <TableCell>
                                    <IconButton onClick={() => handleEdit(event)}><EditIcon /></IconButton>
                                    <IconButton color="error" onClick={() => handleDelete(event.id)}><DeleteIcon /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <TablePagination
                    component="div"
                    count={total}
                    page={page}
                    rowsPerPage={rowsPerPage}
                    onPageChange={(e, newPage) => setPage(newPage)}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                    rowsPerPageOptions={[5, 10, 25, 50, 100]}
                />
            </TableContainer>

            <Dialog open={openForm} onClose={handleCloseForm} maxWidth="sm" fullWidth>
                <DialogTitle>{formData.id ? "Edit Event" : "Add Event"}</DialogTitle>
                <DialogContent>
                    <Box component="form" sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }} onSubmit={handleSubmit}>
                        <TextField label="Title" name="title" value={formData.title} onChange={handleChange} required fullWidth />
                        <TextField label="Description" name="description" value={formData.description} onChange={handleChange} multiline minRows={3} fullWidth />
                        <TextField label="Date & Time" name="dateTime" type="datetime-local" value={formData.dateTime} onChange={handleChange} InputLabelProps={{ shrink: true }} />
                        <TextField label="Location" name="location" value={formData.location} onChange={handleChange} fullWidth />
                        <Select name="categoryId" value={formData.categoryId} onChange={handleChange} displayEmpty required>
                            <MenuItem value="" disabled>Select Category</MenuItem>
                            {categories.map((cat) => (
                                <MenuItem key={cat.id} value={cat.id.toString()}>{cat.name}</MenuItem>
                            ))}
                        </Select>
                        <TextField label="Tags (comma separated)" name="tags" value={formData.tags} onChange={handleChange} fullWidth />
                        <TextField label="Max Capacity" name="maxCapacity" type="number" value={formData.maxCapacity} onChange={handleChange} fullWidth />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseForm}>Cancel</Button>
                    <Button variant="contained" onClick={handleSubmit}>{formData.id ? "Update" : "Create"}</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
                <Alert severity={snackbar.severity} sx={{ width: "100%" }}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
}
