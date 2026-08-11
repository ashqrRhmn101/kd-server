const express = require("express");
const router = express.Router();
const { register, googleLogin, sendOtp, verifyOtpAndRegister, login, logout, getMe } = require("../controllers/authController");
const { authLimiter } = require("../middleware/rateLimiter");
const { attachUser, requireAuth } = require("../middleware/auth");

router.post("/register", authLimiter, register); // direct email+password signup (OTP paused)
router.post("/google", authLimiter, googleLogin); // Google Sign-In
router.post("/send-otp", authLimiter, sendOtp); // kept for when email OTP is re-enabled
router.post("/verify-otp", authLimiter, verifyOtpAndRegister);
router.post("/login", authLimiter, login);
router.post("/logout", logout);
router.get("/me", attachUser, requireAuth, getMe);

module.exports = router;
