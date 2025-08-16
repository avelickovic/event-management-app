import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Box, Card, CardContent, Typography, Chip, Stack,
    IconButton, Button, TextField, Snackbar, Alert,
    CircularProgress, Tooltip, Avatar, Paper, Badge,
} from "@mui/material";
import ThumbUpAltOutlinedIcon from "@mui/icons-material/ThumbUpAltOutlined";
import ThumbDownAltOutlinedIcon from "@mui/icons-material/ThumbDownAltOutlined";
import EventIcon from "@mui/icons-material/Event";
import PlaceIcon from "@mui/icons-material/Place";
import ScheduleIcon from "@mui/icons-material/Schedule";
import PersonIcon from "@mui/icons-material/Person";
import CategoryIcon from "@mui/icons-material/Category";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import _axios from "../axios.js";
import { getUserId } from "../tools/auth.js";
import TopReactions from "../components/TopReactions.jsx";

const formatDateTime = (dateStr) => {
    if (!dateStr) return "";
    try {
        const d = new Date(dateStr);
        return new Intl.DateTimeFormat("en-US", { dateStyle: "full", timeStyle: "short" }).format(d);
    } catch {
        return dateStr;
    }
};

const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
        const d = new Date(dateStr);
        return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(d);
    } catch {
        return dateStr;
    }
};

export default function EventDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const viewIncremented = useRef(false);

    const [event, setEvent] = useState(null);
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [views, setViews] = useState(0);
    const [rsvpCount, setRsvpCount] = useState(0);
    const [rsvped, setRsvped] = useState(false);
    const [rsvpLoading, setRsvpLoading] = useState(false);
    const [comments, setComments] = useState([]);
    const [commentName, setCommentName] = useState("");
    const [commentText, setCommentText] = useState("");
    const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });
    const [currentUser, setCurrentUser] = useState(null);
    const [relatedEvents, setRelatedEvents] = useState([]);

    // Fetch event, tags and comments
    const fetchEvent = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const resp = await _axios.get(`/api/events/getEvent/${id}`);
            setEvent(resp.data);

            // Fetch tags
            const tagsResp = await _axios.get(`/api/tags/${id}`);
            setTags(tagsResp.data.map(t => t.name));

            // Fetch comments
            const cResp = await _axios.get(`/api/comments/${id}`);
            setComments(Array.isArray(cResp.data) ? cResp.data : []);
        } catch (e) {
            console.error(e);
            setError("Error fetching the event.");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchEvent();
    }, [fetchEvent]);

    // Increment views
    useEffect(() => {
        const incrementViews = async () => {
            if (viewIncremented.current) return;

            try {
                viewIncremented.current = true;
                const viewResp = await _axios.patch(`/api/events/views/${id}`);
                setViews(viewResp.data.views ?? 0);
            } catch (err) {
                console.error(err);
            }
        };
        incrementViews();
    }, [id]);
    const fetchRelatedEvents = useCallback(async () => {
        try {
            const resp = await _axios.get(`/api/events/relatedEvents/${id}`);
            setRelatedEvents(resp.data.relatedEvents || []);
        } catch (err) {
            console.error("Failed to fetch related events", err);
        }
    }, [id]);
    useEffect(() => {
        if (event) fetchRelatedEvents();
    }, [event, fetchRelatedEvents]);
    const handleVote = async (type) => {
        try {
            const endpoint = type === "like" ? `/api/events/likes/${id}` : `/api/events/dislikes/${id}`;
            await _axios.patch(endpoint);
            const resp = await _axios.get(`/api/events/getEvent/${id}`);
            setEvent(prev => ({ ...prev, likes: resp.data.likes, dislikes: resp.data.dislikes }));
        } catch (e) {
            console.error(e);
            setSnack({ open: true, message: e.response?.data?.message || "Error", severity: "error" });
        }
    };

    const handleRSVP = async () => {
        if (!event || event.maxCapacity === 0) return;
        setRsvpLoading(true);
        try {
            const resp = await _axios.post(`/api/events/${id}/rsvp`);
            setRsvped(true);
            setRsvpCount(resp.data.attendeesCount ?? 0);
            setSnack({ open: true, message: "Successfully RSVPed!", severity: "success" });
        } catch (e) {
            console.error(e);
            setSnack({ open: true, message: "RSVP failed.", severity: "error" });
        } finally {
            setRsvpLoading(false);
        }
    };

    useEffect(() => {
        const checkLoggedInUser = async () => {
            const userId = getUserId();
            if (userId) {
                try {
                    const userResp = await _axios.get(`/api/users/${userId}`);
                    setCurrentUser(userResp.data);
                    if (userResp.data?.first_name) setCommentName(userResp.data.first_name);
                } catch (err) {
                    console.error(err);
                }
            }
        };
        checkLoggedInUser();
    }, []);

    const submitComment = async (e) => {
        e.preventDefault();
        if (!commentName.trim() || !commentText.trim()) {
            setSnack({ open: true, message: "Please fill in name and comment.", severity: "warning" });
            return;
        }
        try {
            const payload = { eventId: id, userName: commentName.trim(), content: commentText.trim() };
            const resp = await _axios.post(`/api/comments/`, payload);
            setComments(prev => [resp.data, ...prev]);
            setCommentText("");
            setSnack({ open: true, message: "Comment added.", severity: "success" });
        } catch (e) {
            console.error(e);
            setSnack({ open: true, message: "Adding comment failed.", severity: "error" });
        }
    };

    const voteComment = async (commentId, type) => {
        try {
            await _axios.patch(type === "like" ? `/api/comments/like/${commentId}` : `/api/comments/dislike/${commentId}`);
            setComments(prev => prev.map(c => c.id !== commentId ? c : {
                ...c,
                likes: type === "like" ? (c.likes ?? 0) + 1 : c.likes,
                dislikes: type === "dislike" ? (c.dislikes ?? 0) + 1 : c.dislikes
            }));
        } catch (e) {
            console.error(e);
            setSnack({ open: true, message: e.response?.data?.message || "Error", severity: "error" });
        }
    };

    if (loading) return <Box display="flex" alignItems="center" justifyContent="center" minHeight="50vh"><CircularProgress /></Box>;
    if (error || !event) return <Box p={3}><Alert severity="error">{error || "Event not found."}</Alert></Box>;

    const capacityInfo = event.maxCapacity && event.maxCapacity > 0 ? `${rsvpCount} / ${event.maxCapacity}` : null;

    return (

        <Box p={{ xs: 2, md: 4 }} maxWidth={1000} mx="auto">
            <TopReactions />
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                        <Typography variant="h4" fontWeight={700}>{event.title}</Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Tooltip title="Views"><Chip icon={<VisibilityIcon />} label={views} variant="outlined" /></Tooltip>
                            <Tooltip title="Likes"><Chip icon={<ThumbUpAltOutlinedIcon />} label={event.likes ?? 0} /></Tooltip>
                            <Tooltip title="Dislikes"><Chip icon={<ThumbDownAltOutlinedIcon />} label={event.dislikes ?? 0} /></Tooltip>
                        </Stack>
                    </Stack>

                    <Typography variant="body1" sx={{ mt: 2, whiteSpace: "pre-line" }}>{event.description}</Typography>

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 2 }}>
                        <Chip icon={<EventIcon />} label={`Start: ${formatDateTime(event.event_datetime)}`} />
                        {event.location && <Chip icon={<PlaceIcon />} label={event.location} />}
                    </Stack>

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 2 }}>
                        <Chip icon={<ScheduleIcon />} label={`Created: ${formatDate(event.created_at || event.createdAt)}`} />
                        {event.authorName && <Chip icon={<PersonIcon />} label={`Author: ${event.authorName}`} />}
                        {event.category && <Chip icon={<CategoryIcon />} label={`Category: ${event.category}`} />}
                    </Stack>

                    {/* TAGS */}
                    {tags.length > 0 && (
                        <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap" }}>
                            {tags.map((t) => (
                                <Chip
                                    key={t}
                                    label={`#${t}`}
                                    clickable
                                    onClick={() => navigate(`/tags/${t}`)}
                                    sx={{ mr: 1, mb: 1, cursor: "pointer", "&:hover": { backgroundColor: "primary.light", color: "white" } }}
                                    color="primary"
                                    variant="outlined"
                                />
                            ))}
                        </Stack>
                    )}

                    <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                        <Button variant="outlined" startIcon={<ThumbUpAltOutlinedIcon />} onClick={() => handleVote("like")}>Like</Button>
                        <Button variant="outlined" startIcon={<ThumbDownAltOutlinedIcon />} onClick={() => handleVote("dislike")}>Dislike</Button>
                        {event.maxCapacity !== 0 && (
                            <Button variant="contained" startIcon={<EventSeatIcon />} onClick={handleRSVP} disabled={rsvped || rsvpLoading} sx={{ ml: 1 }}>
                                RSVP {capacityInfo ? `(${capacityInfo})` : ""}
                            </Button>
                        )}
                    </Stack>
                </CardContent>
            </Card>

            {/* COMMENTS SECTION */}
            <Card>
                <CardContent>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Comments</Typography>
                    <Box component="form" onSubmit={submitComment} sx={{ mb: 3 }}>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                            <TextField
                                label="Author Name"
                                value={commentName}
                                onChange={(e) => setCommentName(e.target.value)}
                                fullWidth
                                disabled={currentUser?.firstName}
                                helperText={currentUser?.firstName ? "Using your account name" : "Enter your name"}
                            />
                            <TextField
                                label="Text"
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                fullWidth
                                multiline
                                minRows={1}
                            />
                            <Button type="submit" variant="contained">Add Comment</Button>
                        </Stack>
                    </Box>

                    {comments.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">No comments yet.</Typography>
                    ) : (
                        <Stack spacing={1}>
                            {comments.map((c) => (
                                <Paper key={`comment-${c.id || c.created_at || Date.now()}`} variant="outlined" sx={{ p: 1.5 }}>
                                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Avatar sx={{ width: 28, height: 28 }}>{(c.authorName || "?").charAt(0).toUpperCase()}</Avatar>
                                            <Box>
                                                <Typography variant="subtitle2">{c.authorName}</Typography>
                                                <Typography variant="caption" color="text.secondary">{formatDateTime(c.created_at || c.createdAt)}</Typography>
                                            </Box>
                                        </Stack>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Badge badgeContent={c.likes ?? 0} max={999}>
                                                <Tooltip title="Like comment">
                                                    <IconButton onClick={() => voteComment(c.id, "like")} size="small"><ThumbUpAltOutlinedIcon fontSize="small" /></IconButton>
                                                </Tooltip>
                                            </Badge>
                                            <Badge badgeContent={c.dislikes ?? 0} max={999}>
                                                <Tooltip title="Dislike comment">
                                                    <IconButton onClick={() => voteComment(c.id, "dislike")} size="small"><ThumbDownAltOutlinedIcon fontSize="small" /></IconButton>
                                                </Tooltip>
                                            </Badge>
                                        </Stack>
                                    </Stack>
                                    {c.content && <Typography variant="body2" sx={{ mt: 1, whiteSpace: "pre-line" }}>{c.content}</Typography>}
                                </Paper>
                            ))}
                        </Stack>
                    )}
                </CardContent>
            </Card>
            {relatedEvents.length > 0 && (
                <Card sx={{ mt: 4, p: 2 }}>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                        You might also like
                    </Typography>
                    <Stack
                        direction="row"
                        spacing={2}
                        flexWrap="wrap"
                        justifyContent="flex-start"
                    >
                        {relatedEvents.map((e) => (
                            <Card
                                key={e.id}
                                sx={{
                                    width: 250,
                                    cursor: "pointer",
                                    flexShrink: 0,
                                }}
                                onClick={() => navigate(`/event/${e.id}`)}
                            >
                                <CardContent>
                                    <Typography variant="subtitle1" fontWeight={600} noWrap>
                                        {e.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" noWrap sx={{ mt: 0.5 }}>
                                        {e.description}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                                        {formatDate(e.event_datetime || e.created_at)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        ))}
                    </Stack>
                </Card>
            )}


            <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
                <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))}>{snack.message}</Alert>
            </Snackbar>
        </Box>
    );
}
