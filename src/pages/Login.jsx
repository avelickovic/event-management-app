import React, { useState } from "react";
import {useNavigate} from "react-router-dom";
import _axios from "../axios.js";
import {getUserId} from "../tools/auth.js";
import {
    Box,
    TextField,
    Button,
    Typography,
    Container,
    Paper,
} from "@mui/material";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const handleSubmit = async (e) => {
        e.preventDefault();
        // Replace with your login logic
        try{
            const response = await _axios.post("/api/users/login", { email, password });

            localStorage.setItem("jwt", response.data.token);
            console.log(getUserId());
            navigate("/events");
        }
        catch(err){
            console.error("Login failed:", err);
            setError("Invalid email or password");
        }
        console.log("Login attempt:", { email, password });
    };

    return (
        <Container maxWidth="xs" sx={{ mt: 8 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h5" align="center" gutterBottom>
                    Login
                </Typography>
                {error && (
                    <Typography color="error" align="center" gutterBottom>
                        {error}
                    </Typography>
                )}
                <Box
                    component="form"
                    onSubmit={handleSubmit}
                    sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                >
                    <TextField
                        label="Email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        fullWidth
                    />
                    <TextField
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        fullWidth
                    />
                    <Button variant="contained" type="submit" fullWidth>
                        Login
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
}
