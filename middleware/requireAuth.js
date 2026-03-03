const jwt = require("jsonwebtoken");

const admins = process.env.ADMINS || [];

module.exports = function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer") ? authHeader.slice(7) : null;

    if (!token) return res.status(401).json({ message: "Missing token" });

    const decoded = jwt.verify(token, process.env.SECRET);
    req.user = decoded;
    admins.includes(req.user._id) ? req.user['isAdmin'] = true : req.user['isAdmin'] = false;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
