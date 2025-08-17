import { useState, useEffect } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    TablePagination,
    TextField,
    Button,
    Box,
    IconButton,
    Snackbar,
    Alert,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import _axios from "../axios.js";

function UserCategories() {
    const [categories, setCategories] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(15);
    const [total, setTotal] = useState(0);

    const [formData, setFormData] = useState({
        id: null,
        name: "",
        description: "",
    });

    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success",
    });

    const getCategories = async (page = 0, limit = rowsPerPage) => {
        try {
            const response = await _axios.get(`/api/categories?page=${page}&limit=${limit}`);
            setCategories(response.data.data);
            setTotal(response.data.total);
        } catch (error) {
            console.error("Error fetching categories:", error);
            setSnackbar({
                open: true,
                message: "Error fetching categories.",
                severity: "error",
            });
        }
    };

    useEffect(() => {
        getCategories(page, rowsPerPage);
    }, [page, rowsPerPage]);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleInputChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (formData.id === null) {
                await _axios.post("/api/categories/", {
                    name: formData.name,
                    description: formData.description,
                });
                setSnackbar({
                    open: true,
                    message: "Category created successfully.",
                    severity: "success",
                });
            } else {
                await _axios.patch(`/api/categories/${formData.id}`, {
                    name: formData.name,
                    description: formData.description,
                });
                setSnackbar({
                    open: true,
                    message: "Category updated successfully.",
                    severity: "success",
                });
            }

            getCategories(page, rowsPerPage);
            setFormData({ id: null, name: "", description: "" });
        } catch (error) {
            console.error("Error saving category:", error);
            setSnackbar({
                open: true,
                message:
                    error.response?.data?.message ||
                    "Error saving category. Please try again.",
                severity: "error",
            });
        }
    };

    const handleRowClick = (category) => {
        setFormData({
            id: category.id,
            name: category.name,
            description: category.description,
        });
    };

    const handleDelete = async (id) => {
        try {
            await _axios.delete(`/api/categories/${id}`);
            setSnackbar({
                open: true,
                message: "Category deleted successfully.",
                severity: "success",
            });

            if ((page + 1) * rowsPerPage > total - 1 && page > 0) {
                setPage(page - 1);
            } else {
                getCategories(page, rowsPerPage);
            }
        } catch (error) {
            console.error("Delete error:", error);
            const msg =
                error.response?.data?.message ||
                "Failed to delete category. Please try again.";

            setSnackbar({
                open: true,
                message: msg,
                severity: "error",
            });
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar({
            open: false,
            message: "",
            severity: "info",
        });
    };

    return (
        <Box sx={{ maxWidth: 900, margin: "auto", padding: 2 }}>
            <Typography variant="h4" gutterBottom>
                User Categories
            </Typography>

            <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{
                    marginBottom: 3,
                    display: "flex",
                    gap: 2,
                    flexWrap: "wrap",
                    alignItems: "center",
                }}
            >
                <TextField
                    label="Name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    sx={{ flexGrow: 1, minWidth: 200 }}
                />
                <TextField
                    label="Description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    sx={{ flexGrow: 2, minWidth: 300 }}
                />
                <Button variant="contained" type="submit" sx={{ minWidth: 120 }}>
                    {formData.id === null ? "Add" : "Update"}
                </Button>
                {formData.id !== null && (
                    <Button
                        variant="outlined"
                        color="secondary"
                        onClick={() => setFormData({ id: null, name: "", description: "" })}
                    >
                        Cancel
                    </Button>
                )}
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell><b>Name</b></TableCell>
                            <TableCell><b>Description</b></TableCell>
                            <TableCell><b>Actions</b></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {categories.map((category) => (
                            <TableRow
                                key={category.id}
                                hover
                                sx={{ cursor: "pointer" }}
                                onClick={() => handleRowClick(category)}
                            >
                                <TableCell>{category.name}</TableCell>
                                <TableCell>{category.description}</TableCell>
                                <TableCell>
                                    <IconButton
                                        edge="end"
                                        aria-label="delete"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(category.id);
                                        }}
                                    >
                                        <DeleteIcon color="error" />
                                    </IconButton>
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
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 15, 25]}
            />

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    sx={{ width: "100%" }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default UserCategories;
