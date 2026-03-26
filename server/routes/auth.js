const express = require("express");
const jwt     = require("jsonwebtoken");
const bcrypt  = require("bcryptjs");
const User    = require("../models/User");
const protect = require("../middleware/auth");

const router = express.Router();

const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });

// ── POST /api/auth/signup ────────────────────────────────────────────────────
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !name.trim())
      return res.status(400).json({ message: "Name is required." });
    if (!email || !email.trim())
      return res.status(400).json({ message: "Email is required." });
    if (!password || password.length < 8)
      return res.status(400).json({ message: "Password must be at least 8 characters." });

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing)
      return res.status(400).json({ message: "Email already registered. Please log in." });

    // ✅ NO manual bcrypt.hash() here — pre-save hook in User.js handles it
    const user = await User.create({
      name:     name.trim(),
      email:    email.toLowerCase().trim(),
      password: password,
      role:     role || "Developer",
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });

  } catch (err) {
    console.error("Signup error:", err.message);
    if (err.code === 11000)
      return res.status(400).json({ message: "Email already registered. Please log in." });
    return res.status(500).json({ message: "Signup failed.", error: err.message });
  }
});

// ── POST /api/auth/login ─────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required." });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user)
      return res.status(400).json({ message: "Invalid email or password." });

    // ✅ Using model's comparePassword method
    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid email or password." });

    const token = generateToken(user._id);

    return res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });

  } catch (err) {
    console.error("Login error:", err.message);
    return res.status(500).json({ message: "Login failed.", error: err.message });
  }
});

// ── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found." });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ message: "Could not fetch user." });
  }
});

module.exports = router;