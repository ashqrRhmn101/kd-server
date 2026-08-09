const mongoose = require("mongoose");

// Short-lived OTP codes for email/phone verification.
// Documents auto-delete 10 minutes after creation via TTL index.
const otpSchema = new mongoose.Schema({
  identifier: { type: String, required: true }, // email or phone
  code: { type: String, required: true },
  purpose: {
    type: String,
    enum: ["signup", "login", "reset-password"],
    default: "signup",
  },
  attempts: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now, expires: 600 }, // 10 min TTL
});

module.exports = mongoose.model("Otp", otpSchema);
