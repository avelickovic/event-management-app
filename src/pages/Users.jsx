import { useState, useEffect } from "react";
import {
    Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, TablePagination, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    Select, MenuItem, Snackbar, Alert
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import ToggleOffIcon from "@mui/icons-material/ToggleOff";
import _axios from "../axios";

export default function Users() {
    const [users, setUsers] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [total, setTotal] = useState(0);
    const [openForm, setOpenForm] = useState(false);
    const [formData, setFormData] = useState({
        id: null, first_name: "", last_name: "", email: "", user_type: "", password: "", confirmPassword: ""
    });
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

    const showSnackbar = (msg, severity = "success") => setSnackbar({ open: true, message: msg, severity });


    const fetchUsers = async () => {
        try {
            const res = await _axios.get(`/api/users?page=${page}&limit=${rowsPerPage}`);
            const mapped = (res.data.users || []).map(u => ({
                ...u,

                active: typeof u.active === "boolean" ? u.active : (u.status === "active")
            }));
            setUsers(mapped);
            setTotal(res.data.total ?? 0);
        } catch (err) {
            console.error(err);
            showSnackbar("Error fetching users", "error");
        }
    };

    useEffect(() => {
        let isMounted = true;

        const fetchWithPolling = async () => {
            if (!isMounted) return;
            await fetchUsers();
        };

        fetchWithPolling();
        const interval = setInterval(fetchWithPolling, 15000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [page, rowsPerPage]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleOpenForm = (user = null) => {
        if (user) {
            setFormData({ ...user, password: "", confirmPassword: "" });
        } else {
            setFormData({ id: null, first_name: "", last_name: "", email: "", user_type: "", password: "", confirmPassword: "" });
        }
        setOpenForm(true);
    };

    const handleCloseForm = () => setOpenForm(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (formData.id) {
                const updatePayload = {
                    email: formData.email,
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    user_type: formData.user_type
                };

                await _axios.patch(`/api/users/update/${formData.id}`, updatePayload);
                showSnackbar("User updated successfully", "success");
            } else {
                if (formData.password !== formData.confirmPassword) {
                    showSnackbar("Passwords do not match", "error");
                    return;
                }

                const createPayload = {
                    email: formData.email,
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    user_type: formData.user_type,
                    password: formData.password
                };

                await _axios.post(`/api/users/createUser`, createPayload);
                showSnackbar("User created successfully", "success");
            }

            await fetchUsers();
            handleCloseForm();
        } catch (err) {
            console.error(err);
            showSnackbar(err.response?.data?.message || "Error saving user", "error");
        }
    };

    const toggleStatus = async (user) => {
        try {

            const res = await _axios.post(`/api/users/changeStatus/${user.id}`);

            showSnackbar(res.data?.message || "Status changed", "success");


            if (res.data && typeof res.data.status === "string") {
                const newStatus = res.data.status;
                setUsers(prev =>
                    prev.map(u => u.id === user.id ? { ...u, status: newStatus, active: newStatus === "active" } : u)
                );
            } else {

                await fetchUsers();
            }
        } catch (err) {
            console.error(err);
            showSnackbar(err.response?.data?.message || "Error changing status", "error");
        }
    };

    return (
        <Box sx={{ maxWidth: 1000, margin: "auto", p: 2 }}>
            <Typography variant="h4" gutterBottom>Users</Typography>
            <Button variant="contained" sx={{ mb: 2 }} onClick={() => handleOpenForm()}>Add New User</Button>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell><b>First Name</b></TableCell>
                            <TableCell><b>Last Name</b></TableCell>
                            <TableCell><b>Email</b></TableCell>
                            <TableCell><b>Type</b></TableCell>
                            <TableCell><b>Status</b></TableCell>
                            <TableCell><b>Actions</b></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map(user => (
                            <TableRow key={user.id} hover>
                                <TableCell>{user.first_name}</TableCell>
                                <TableCell>{user.last_name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{user.user_type}</TableCell>
                                <TableCell>{user.active ? "Active" : "Inactive"}</TableCell>
                                <TableCell>
                                    <IconButton onClick={() => handleOpenForm(user)}><EditIcon /></IconButton>
                                    {user.user_type === "event_creator" && (
                                        <IconButton
                                            color={user.active ? "success" : "error"}
                                            onClick={() => toggleStatus(user)}
                                        >
                                            {user.active ? <ToggleOnIcon /> : <ToggleOffIcon />}
                                        </IconButton>
                                    )}
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
                    onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                />
            </TableContainer>

            <Dialog open={openForm} onClose={handleCloseForm} maxWidth="sm" fullWidth>
                <DialogTitle>{formData.id ? "Edit User" : "Add User"}</DialogTitle>
                <DialogContent>
                    <Box component="form" sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }} onSubmit={handleSubmit}>
                        <TextField label="First Name" name="first_name" value={formData.first_name} onChange={handleChange} required />
                        <TextField label="Last Name" name="last_name" value={formData.last_name} onChange={handleChange} required />
                        <TextField label="Email" name="email" value={formData.email} onChange={handleChange} type="email" required />
                        <Select name="user_type" value={formData.user_type} onChange={handleChange} required>
                            <MenuItem value=""><em>Select Type</em></MenuItem>
                            <MenuItem value="admin">Admin</MenuItem>
                            <MenuItem value="event_creator">Event Creator</MenuItem>
                            <MenuItem value="user">User</MenuItem>
                        </Select>
                        {!formData.id && <>
                            <TextField label="Password" name="password" type="password" value={formData.password} onChange={handleChange} required />
                            <TextField label="Confirm Password" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required />
                        </>}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseForm}>Cancel</Button>
                    <Button variant="contained" onClick={handleSubmit}>{formData.id ? "Update" : "Create"}</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
                <Alert severity={snackbar.severity} sx={{ width: "100%" }}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
}
