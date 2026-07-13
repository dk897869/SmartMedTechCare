const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");

const path = require("path");
dotenv.config(); // CWD .env
dotenv.config({ path: path.join(__dirname, ".env") }); // src/.env
dotenv.config({ path: path.join(__dirname, "..", ".env") }); // backend/.env
dotenv.config({ path: path.join(__dirname, "..", "..", ".env") }); // root/.env

// ======================
// Debug Environment
// ======================
console.log("=================================");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("PORT:", process.env.PORT);
console.log(
  "GOOGLE_API_KEY:",
  process.env.GOOGLE_API_KEY ? "Loaded ✅" : "Missing ❌"
);
console.log(
  "GEMINI_API_KEY:",
  process.env.GEMINI_API_KEY ? "Loaded ✅" : "Missing ❌"
);
console.log(
  "OPENAI_API_KEY:",
  process.env.OPENAI_API_KEY ? "Loaded ✅" : "Missing ❌"
);
console.log("=================================");

const connectDB = require("./config/db");
const { seedDatabase } = require("./database/seeder");

// Connect Database
connectDB()
  .then(async () => {
    await seedDatabase();
  })
  .catch((err) => {
    console.error("MongoDB Connection Error:", err);
  });

const app = express();

// ======================
// Middlewares
// ======================

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  })
);

app.use(compression());

app.use(morgan("dev"));

// ======================
// Health Check
// ======================

app.get("/", (req, res) => {
  res.json({
    success: true,
    project: "SmartMedTechCare",
    version: "1.0.0",
    message: "Backend running successfully",
    ai: {
      google: !!process.env.GOOGLE_API_KEY,
      gemini: !!process.env.GEMINI_API_KEY,
      openai: !!process.env.OPENAI_API_KEY,
    },
  });
});

// ======================
// Routes
// ======================

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/ai", require("./routes/aiRoutes"));
app.use("/api/medicines", require("./routes/medicineRoutes"));
app.use("/api/pharmacies", require("./routes/pharmacyRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/contacts", require("./routes/contactRoutes"));

// ======================
// Error Handler
// ======================

app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ======================
// Start Server
// ======================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});