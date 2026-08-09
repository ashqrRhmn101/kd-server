const User = require("../models/User");

// Runs once at server startup. If no admin exists yet, creates one
// from ADMIN_EMAIL / ADMIN_PASSWORD in .env so you can log into /admin immediately.
const seedAdmin = async () => {
  try {
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) return;

    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      console.log("⚠️  ADMIN_EMAIL/ADMIN_PASSWORD not set in .env — skipping admin seed");
      return;
    }

    await User.create({
      name: "Admin",
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      role: "admin",
      isVerified: true,
    });

    console.log(`✅ Admin account created: ${process.env.ADMIN_EMAIL}`);
  } catch (err) {
    console.error("Admin seed error:", err.message);
  }
};

module.exports = seedAdmin;
