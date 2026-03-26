const express  = require("express");
const mongoose = require("mongoose");
const cors     = require("cors");
require("dotenv").config();

const authRoutes    = require("./routes/auth");
const sessionRoutes = require("./routes/sessions");

const app = express();

// ✅ UPDATED CORS — allows all vercel.app subdomains
app.use(cors({
  origin: function(origin, callback) {
    if (
      !origin ||
      origin === "http://localhost:5173" ||
      origin.endsWith(".vercel.app")
    ) {
      return callback(null, true);
    }
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));

app.use(express.json());

app.use("/api/auth",     authRoutes);
app.use("/api/sessions", sessionRoutes);

app.get("/", (req, res) => {
  res.json({ message: "✅ AI Interview Simulator API running", status: "ok" });
});

app.use((err, req, res, next) => {
  console.error("Global error:", err.message);
  res.status(500).json({ message: "Something went wrong.", error: err.message });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(process.env.PORT || 5000, () => {
      console.log(`✅ Server running → http://localhost:${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });