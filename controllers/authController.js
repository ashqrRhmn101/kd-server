const User = require("../models/User");
const Otp = require("../models/Otp");
const sendEmail = require("../utils/sendEmail");
const { generateTokenAndSetCookie, generateOtpCode } = require("../utils/generateToken");
const { OAuth2Client } = require("google-auth-library");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @desc  Register with email + password (OTP verification is currently PAUSED
//        per project owner's request — Gmail SMTP app-password wasn't ready yet.
//        Re-enable by switching the frontend signup form back to the
//        send-otp -> verify-otp flow below once email sending is fixed.)
// @route POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "নাম, ইমেইল ও পাসওয়ার্ড দিন" });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: "এই ইমেইলে আগে থেকেই একাউন্ট আছে" });

    const user = await User.create({ name, email, phone, password, isVerified: false });

    generateTokenAndSetCookie(res, user._id);
    res.status(201).json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, avatarUrl: user.avatarUrl, isVerified: user.isVerified },
    });
  } catch (err) {
    next(err);
  }
};

// @desc  Sign in / sign up with Google (frontend sends the Google ID token
//        from Google Identity Services after the user taps "Sign in with Google")
// @route POST /api/auth/google
exports.googleLogin = async (req, res, next) => {
  try {
    const { credential } = req.body; // ID token (JWT) from Google Identity Services
    if (!credential) return res.status(400).json({ success: false, message: "Google টোকেন পাওয়া যায়নি" });
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ success: false, message: "Google লগইন এখনো সেটআপ করা হয়নি (GOOGLE_CLIENT_ID মিসিং)" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    let user = await User.findOne({ $or: [{ googleId: payload.sub }, { email: payload.email }] });

    if (!user) {
      user = await User.create({
        name: payload.name,
        email: payload.email,
        googleId: payload.sub,
        avatarUrl: payload.picture || "",
        isVerified: true,
      });
    } else if (!user.googleId) {
      // existing email/password user is now also linking their Google account
      user.googleId = payload.sub;
      if (!user.avatarUrl) user.avatarUrl = payload.picture || "";
      user.isVerified = true;
      await user.save();
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "আপনার একাউন্ট নিষ্ক্রিয় করা হয়েছে" });
    }

    generateTokenAndSetCookie(res, user._id);
    res.json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, avatarUrl: user.avatarUrl, isVerified: user.isVerified },
    });
  } catch (err) {
    next(err);
  }
};

// ===== Email OTP flow (currently unused by the frontend — kept ready for
// when Gmail App Password / a transactional email provider is configured) =====

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
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, avatarUrl: user.avatarUrl, isVerified: user.isVerified },
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
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, avatarUrl: user.avatarUrl, isVerified: user.isVerified },
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
