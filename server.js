require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");

const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");
const { apiLimiter } = require("./middleware/rateLimiter");
const seedAdmin = require("./utils/seedAdmin");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const orderRoutes = require("./routes/orderRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

// ==== Security middleware ====
app.use(helmet());
app.use(mongoSanitize()); // strips $ and . from req.body/query -> stops NoSQL injection
app.use(xss()); // strips malicious HTML/JS from input -> stops stored XSS
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
app.use(morgan("dev"));
app.use("/api", apiLimiter);

// ==== Routes ====
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) =>
  res.json({ success: true, message: "Khalid's Dreams API চালু আছে — /api/health দেখুন বিস্তারিত জানতে" })
);
app.get("/api/health", (req, res) => res.json({ success: true, message: "API চালু আছে" }));

// 404 handler
app.use((req, res) => res.status(404).json({ success: false, message: "রুট পাওয়া যায়নি" }));

// Global error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  await seedAdmin(); // creates the first admin account if none exists
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
});
