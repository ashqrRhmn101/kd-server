const jwt = require("jsonwebtoken");

// Signs a JWT and sets it as a secure httpOnly cookie
const generateTokenAndSetCookie = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "30d",
  });

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  return token;
};

// 6-digit numeric OTP
const generateOtpCode = () => String(Math.floor(100000 + Math.random() * 900000));

module.exports = { generateTokenAndSetCookie, generateOtpCode };
