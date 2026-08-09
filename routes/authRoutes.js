const express = require("express");
const router = express.Router();
const { sendOtp, verifyOtpAndRegister, login, logout, getMe } = require("../controllers/authController");
const { authLimiter } = require("../middleware/rateLimiter");
const { attachUser, requireAuth } = require("../middleware/auth");

router.post("/send-otp", authLimiter, sendOtp);
router.post("/verify-otp", authLimiter, verifyOtpAndRegister);
router.post("/login", authLimiter, login);
router.post("/logout", logout);
router.get("/me", attachUser, requireAuth, getMe);

module.exports = router;
