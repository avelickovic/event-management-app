export const isAuthenticated = () => {
    return localStorage.getItem("jwt");



};
export const isAdmin = () => {
    const jwt = localStorage.getItem("jwt");
    if (!jwt) return false;

    try {
        const payload = JSON.parse(atob(jwt.split('.')[1]));
        return payload.type === 'admin';
    } catch (error) {
        console.error("Error decoding JWT:", error);
        return false;
    }
}
export const getUserId = () => {
    const jwt = localStorage.getItem("jwt");
    if (!jwt) return null;

    try {
        const payload = JSON.parse(atob(jwt.split('.')[1]));
        return payload.userId;
    } catch (error) {
        console.error("Error decoding JWT:", error);
        return null;
    }
}
export const logout = (navigate) => {
    localStorage.removeItem("jwt");
    navigate("/login");
};
