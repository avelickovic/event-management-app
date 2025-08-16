import { Card as MUICard, CardContent, Typography, Box } from "@mui/material";

export default function Card({ title, description, date, category, onClick }) {
    return (
        <MUICard
            onClick={onClick}
            sx={{
                maxWidth: 345,
                borderRadius: 4,
                boxShadow: 4,
                p: 2,
                textAlign: "center",
                background: "linear-gradient(145deg, #ffffff, #f5f5f5)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                cursor: "pointer", // <-- show pointer
                "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: 8,
                },
            }}
        >
            <CardContent>
                <Typography variant="h5" component="div" fontWeight="bold" gutterBottom>
                    {title}
                </Typography>

                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 3 }}
                >
                    {description}
                </Typography>

                <Box sx={{ mt: 2, textAlign: "center" }}>
                    <Typography
                        variant="subtitle2"
                        sx={{
                            display: "inline-block",
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 2,
                            backgroundColor: "#e3f2fd",
                            color: "#1976d2",
                            fontWeight: 500,
                            mb: 1,
                        }}
                    >
                        {category}
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                        {date}
                    </Typography>
                </Box>
            </CardContent>
        </MUICard>
    );
}
