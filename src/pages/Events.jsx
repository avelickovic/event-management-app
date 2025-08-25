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
    Select,
    MenuItem,
    Paper,
    Snackbar,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import _axios from "../axios.js";
import { useNavigate } from "react-router-dom";
import { getUserId } from "../tools/auth.js";

export default function Events() {
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
    const navigate = useNavigate();

    useEffect(() => {
        fetchEvents(page, rowsPerPage);
    }, [page, rowsPerPage]);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await _axios.get("/api/categories");
            setCategories(res.data.data || []);
        } catch (err) {
            console.error("Error fetching categories", err);
            setCategories([]);
        }
    };

    const fetchEvents = async (page = 0, limit = rowsPerPage) => {
        try {
            const res = await _axios.get(`/api/events/eventsbydatepagination?page=${page}&limit=${limit}`);
            let eventsData = res.data.events || [];

            eventsData = await Promise.all(
                eventsData.map(async (event) => {
                    const tagsRes = await _axios.get(`/api/tags/${event.id}`);
                    const tagsArray = tagsRes.data.map(t => t.name);

                    let authorName = event.author_id;
                    try {
                        const userRes = await _axios.get(`/api/users/getUserNameById/${event.author_id}`);
                        authorName = `${userRes.data.firstName} ${userRes.data.lastName}`;
                    } catch (err) {
                        console.error("Error fetching author name", err);
                    }

                    return {
                        ...event,
                        tags: tagsArray,
                        authorName
                    };
                })
            );

            setEvents(eventsData);
            setTotal(res.data.total || 0);

        } catch (error) {
            console.error("Error fetching events", error);
            setEvents([]);
            setTotal(0);
        }
    };
    useEffect(() => {
        if (openForm) return;

        const interval = setInterval(() => {
            fetchEvents(page, rowsPerPage);
        }, 10000);

        return () => clearInterval(interval);
    }, [page, rowsPerPage, openForm]);




    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
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
            if (formData.id) {
                await _axios.patch(`/api/events/update/${formData.id}`, payload);
                showSnackbar("Event updated successfully", "success");
            } else {
                console.log(payload)
                await _axios.post("/api/events/createEvent", payload);
                showSnackbar("Event created successfully", "success");
            }
            fetchEvents(page, rowsPerPage);

            handleCloseForm();
        } catch (err) {
            console.error("Error submitting form Message: ", err.response.data.message);
            showSnackbar("Error submitting form", "error");
        }
    };

    const handleEdit = (event) => {
        let tagsValue = "";
        if (Array.isArray(event.tags)) {
            tagsValue = event.tags.join(", ");
        } else if (typeof event.tags === "string") {
            tagsValue = event.tags;
        }

        setFormData({
            id: event.id,
            title: event.title || "",
            description: event.description || "",
            dateTime: event.event_datetime
                ? new Date(event.event_datetime).toISOString().slice(0, 16)
                : "",
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
            if ((page + 1) * rowsPerPage > total - 1 && page > 0) {
                setPage(page - 1);
            } else {
                fetchEvents(page, rowsPerPage);
            }
        } catch (err) {
            console.error("Delete error", err);
            showSnackbar("Error deleting event", "error");
        }
    };

    const handleOpenForm = () => setOpenForm(true);
    const handleCloseForm = () => {
        setOpenForm(false);
        setFormData({ id: null, title: "", description: "", dateTime: "", location: "", categoryId: "", tags: "", maxCapacity: "" });
    };

    const showSnackbar = (message, severity) => {
        setSnackbar({ open: true, message, severity });
    };

    return (
        <Box sx={{ maxWidth: 1000, margin: "auto", padding: 2 }}>
            <Typography variant="h4" gutterBottom>Events Management</Typography>
            <Button variant="contained" sx={{ mb: 2 }} onClick={handleOpenForm}>
                Add New Event
            </Button>

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
                                    <Box
                                        component="span"
                                        onClick={() => navigate(`/event/${event.id}`)}
                                        sx={{
                                            cursor: 'pointer',
                                            color: 'primary.main',
                                            '&:hover': { textDecoration: 'underline' }
                                        }}
                                    >
                                        {event.title}
                                    </Box>
                                </TableCell>
                                <TableCell>{event.authorName || event.authorId}</TableCell>
                                <TableCell>{new Date(event.created_at).toLocaleString()}</TableCell>

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
                    rowsPerPageOptions={[5, 10, 15, 25]}
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
