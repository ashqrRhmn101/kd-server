const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Verifies JWT if present; attaches req.user. Does NOT block guests.
exports.attachUser = async (req, res, next) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];
    if (!token) return next();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (user && user.isActive) req.user = user;
    next();
  } catch (err) {
    next(); // invalid token -> treat as guest, don't crash
  }
};

// Blocks request if not logged in
exports.requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "লগইন প্রয়োজন / Login required" });
  }
  next();
};

// Blocks request if not admin
exports.requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "অ্যাডমিন অ্যাক্সেস প্রয়োজন / Admin access required" });
  }
  next();
};
