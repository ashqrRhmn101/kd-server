const User = require("../models/User");
const Otp = require("../models/Otp");
const sendEmail = require("../utils/sendEmail");
const { generateTokenAndSetCookie, generateOtpCode } = require("../utils/generateToken");

// @desc  Send OTP to email for signup verification
// @route POST /api/auth/send-otp
exports.sendOtp = async (req, res, next) => {
  try {
    const { email, purpose = "signup" } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email দিন" });

    const code = generateOtpCode();
    await Otp.deleteMany({ identifier: email, purpose }); // clear old codes
    await Otp.create({ identifier: email, code, purpose });

    await sendEmail({
      to: email,
      subject: "Khalid's Dreams — আপনার OTP কোড",
      html: `<p>আপনার ভেরিফিকেশন কোড: <b style="font-size:20px">${code}</b></p><p>এই কোডটি ১০ মিনিটের জন্য বৈধ থাকবে।</p>`,
    });

    res.json({ success: true, message: "OTP পাঠানো হয়েছে" });
  } catch (err) {
    next(err);
  }
};

// @desc  Verify OTP + create account
// @route POST /api/auth/verify-otp
exports.verifyOtpAndRegister = async (req, res, next) => {
  try {
    const { name, email, phone, password, otp } = req.body;

    const record = await Otp.findOne({ identifier: email, purpose: "signup" }).sort({ createdAt: -1 });
    if (!record) return res.status(400).json({ success: false, message: "OTP মেয়াদোত্তীর্ণ, আবার পাঠান" });

    if (record.attempts >= 5) {
      return res.status(429).json({ success: false, message: "অনেকবার ভুল চেষ্টা হয়েছে, নতুন OTP নিন" });
    }
    if (record.code !== otp) {
      record.attempts += 1;
      await record.save();
      return res.status(400).json({ success: false, message: "ভুল OTP" });
    }

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ success: false, message: "এই ইমেইলে আগে থেকেই একাউন্ট আছে" });

    user = await User.create({ name, email, phone, password, isVerified: true });
    await Otp.deleteMany({ identifier: email, purpose: "signup" });

    generateTokenAndSetCookie(res, user._id);
    res.status(201).json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

// @desc  Login with email + password
// @route POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "ভুল ইমেইল বা পাসওয়ার্ড" });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "আপনার একাউন্ট নিষ্ক্রিয় করা হয়েছে" });
    }

    generateTokenAndSetCookie(res, user._id);
    res.json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

// @desc  Logout
// @route POST /api/auth/logout
exports.logout = (req, res) => {
  res.clearCookie("token");
  res.json({ success: true, message: "লগ আউট হয়েছে" });
};

// @desc  Get current logged-in user
// @route GET /api/auth/me
exports.getMe = (req, res) => {
  if (!req.user) return res.status(401).json({ success: false, message: "লগইন প্রয়োজন" });
  res.json({ success: true, user: req.user });
};
