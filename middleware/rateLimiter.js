const rateLimit = require("express-rate-limit");

// Prevents brute-force login/OTP abuse
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, message: "চেষ্টা বেশি হয়ে গেছে, ১৫ মিনিট পর আবার চেষ্টা করুন" },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API limiter
exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
