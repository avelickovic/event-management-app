const jwt= require('jsonwebtoken');

function verifyToken(req,res,next){
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).json({ message: "Access denied. No token provided." });
    }
    try{
        const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET);
        req.user = decoded;
        next();

    }
    catch (error) {
        console.error("Token verification failed:", error);
        return res.status(400).json({ message: "Invalid token." });
    }
}


function verifyAdmin(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "Access denied. Invalid or missing token." });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(decoded);
        if (decoded.type !== 'admin') {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }
        req.user = decoded;
        next();
    } catch (error) {
        console.error("Token verification failed:", error);
        return res.status(400).json({ message: "Invalid token." });
    }
}
module.exports = { verifyToken, verifyAdmin };