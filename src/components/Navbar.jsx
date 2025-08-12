import React, { useEffect, useState, useCallback } from "react";
import {
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Button,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Box,
    InputBase,
    useTheme,
    useMediaQuery,
    alpha,
    Divider,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { isAuthenticated as authCheck, getUserId as fetchUserId, isAdmin as adminCheck, logout } from "../tools/auth.js";
import _axios from "../axios.js";

const guestPages = [
    { name: "Home", path: "/" },
    { name: "Trending", path: "/trending" },
    { name: "Categories", path: "/categories" },

];
const userPages = [
    { name: "Events", path: "/events" },
    { name: "Categories", path: "/userCategories" },
];
const adminPages = [
    { name: "Events", path: "/events" },
    { name: "Categories", path: "/userCategories" },
    {name: "Users", path: "/users"},
];



export default function Navbar() {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [username, setUsername] = useState("");
    const navigate = useNavigate();

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    const toggleDrawer = () => {
        setDrawerOpen(!drawerOpen);
    };

    const isAuthenticated = useCallback(authCheck, []);
    const isAdmin = useCallback(adminCheck, []);

    const pagesToShow = !isAuthenticated()
        ? guestPages
        : isAdmin()
            ? adminPages
            : userPages;
    const getUserId = useCallback(fetchUserId, []);

    const handleAuthAction = () => {
        if (isAuthenticated()) {
            setUsername(""); // Clear immediately on logout
            logout(navigate);
        } else {
            navigate("/login");
        }
    };

    useEffect(() => {
        const fetchUsername = async () => {
            try {
                const userId = getUserId();
                if (!userId) {
                    setUsername("Guest");
                    return;
                }
                const response = await _axios.get(`/api/users/${userId}`);
                const user = response.data;
                setUsername(user.first_name);
            } catch (error) {
                console.error("Error fetching username:", error);
                setUsername("Guest");
            }
        };

        if (isAuthenticated()) {
            fetchUsername();
        } else {
            setUsername("Guest");
        }
    }, [isAuthenticated(), getUserId()]); // Depend on actual values

    const handleSearch = (e) => {
        if (e.key === "Enter") {
            console.log("Searching for:", e.target.value);
            setDrawerOpen(false);
        }
    };

    const drawer = (
        <Box sx={{ width: 250 }} role="presentation" onKeyDown={toggleDrawer}>
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    px: 2,
                    py: 1,
                    mt: 1,
                    backgroundColor: (theme) =>
                        alpha(theme.palette.primary.main, 0.08),
                    borderRadius: 1,
                    mx: 1,
                }}
            >
                <SearchIcon sx={{ mr: 1 }} />
                <InputBase
                    placeholder="Search…"
                    onKeyDown={handleSearch}
                    fullWidth
                />
            </Box>

            <Divider sx={{ my: 1 }} />

            <List>
                {pagesToShow.map((page) => (
                    <ListItem key={page.name} disablePadding>
                        <ListItemButton component={RouterLink} to={page.path}>
                            <ListItemText primary={page.name} />
                        </ListItemButton>
                    </ListItem>
                ))}

                <ListItem disablePadding>
                    {isAuthenticated() ? (
                        <Box sx={{ textAlign: "center", width: "100%" }}>
                            <Typography
                                variant="subtitle1"
                                sx={{ mb: 1, fontWeight: "bold" }}
                            >
                                {username}
                            </Typography>
                            <ListItemButton
                                onClick={handleAuthAction}
                                sx={{
                                    backgroundColor: "error.main",
                                    color: "white",
                                    borderRadius: 1,
                                    mx: 1,
                                    "&:hover": { backgroundColor: "error.dark" },
                                }}
                            >
                                <ListItemText
                                    primary="Logout"
                                    primaryTypographyProps={{ fontWeight: "bold" }}
                                />
                            </ListItemButton>
                        </Box>
                    ) : (
                        <ListItemButton onClick={handleAuthAction}>
                            <ListItemText primary="Login" />
                        </ListItemButton>
                    )}
                </ListItem>
            </List>
        </Box>
    );

    return (
        <AppBar position="static">
            <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Typography
                        variant="h6"
                        component={RouterLink}
                        to="/"
                        color="inherit"
                        sx={{ textDecoration: "none" }}
                    >
                        MyApp
                    </Typography>

                    {!isMobile &&
                        pagesToShow.map((page) => (
                            <Button
                                key={page.name}
                                color="inherit"
                                component={RouterLink}
                                to={page.path}
                                sx={{ textTransform: "none" }}
                            >
                                {page.name}
                            </Button>
                        ))}
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    {!isMobile && isAuthenticated() && (
                        <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: "bold", color: "white" }}
                        >
                            {username}
                        </Typography>
                    )}

                    {!isMobile ? (
                        <Button
                            variant="contained"
                            color={isAuthenticated() ? "secondary" : "primary"}
                            onClick={handleAuthAction}
                        >
                            {isAuthenticated() ? "Logout" : "Login"}
                        </Button>
                    ) : (
                        <>
                            <IconButton
                                color="inherit"
                                edge="start"
                                onClick={toggleDrawer}
                                sx={{ ml: 1 }}
                            >
                                <MenuIcon />
                            </IconButton>
                            <Drawer
                                anchor="left"
                                open={drawerOpen}
                                onClose={toggleDrawer}
                            >
                                {drawer}
                            </Drawer>
                        </>
                    )}
                </Box>
            </Toolbar>
        </AppBar>
    );
}
