const express = require("express");
const Session = require("../models/Session");
const protect = require("../middleware/auth");

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/sessions  — save a completed interview session
// ─────────────────────────────────────────────────────────────────────────────
router.post("/", protect, async (req, res) => {
  try {
    const {
      role, difficulty, avgScore, avgConfidence,
      questionCount, usedVoice, questions,
    } = req.body;

    const session = await Session.create({
      userId:        req.userId,
      role,
      difficulty,
      avgScore,
      avgConfidence: avgConfidence || 0,
      questionCount,
      usedVoice:     usedVoice || false,
      questions: (questions || []).map((q) => ({
        question:       q.question?.question || q.question || "",
        category:       q.question?.category || "",
        answer:         q.answer             || "",
        score:          q.feedback?.score          || 0,
        grade:          q.feedback?.grade          || "F",
        confidence:     q.feedback?.confidence     || 0,
        clarity:        q.feedback?.clarity        || 0,
        technicalDepth: q.feedback?.technicalDepth || 0,
        strengths:      q.feedback?.strengths      || [],
        improvements:   q.feedback?.improvements   || [],
        verdict:        q.feedback?.verdict        || "",
        wordCount:      q.metrics?.wordCount       || 0,
        fillerCount:    q.metrics?.fillerCount     || 0,
        pace:           q.metrics?.pace            || 0,
      })),
    });

    res.status(201).json({
      message:   "Session saved successfully",
      sessionId: session._id,
    });
  } catch (err) {
    console.error("Save session error:", err.message);
    res.status(500).json({ message: "Failed to save session." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/sessions  — get all sessions for logged-in user (list, no questions)
// ─────────────────────────────────────────────────────────────────────────────
router.get("/", protect, async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .select("-questions");   // exclude heavy question data for list view

    res.json(sessions);
  } catch (err) {
    console.error("Fetch sessions error:", err.message);
    res.status(500).json({ message: "Failed to fetch sessions." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/sessions/stats  — aggregated stats for Progress page
// ─────────────────────────────────────────────────────────────────────────────
router.get("/stats", protect, async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.userId })
      .sort({ createdAt: 1 })
      .select("role difficulty avgScore avgConfidence usedVoice questionCount createdAt");

    if (sessions.length === 0) {
      return res.json({
        totalSessions: 0,
        avgScore:      0,
        bestScore:     0,
        avgConfidence: 0,
        voiceSessions: 0,
        sessions:      [],
      });
    }

    const totalSessions  = sessions.length;
    const avgScore       = Math.round(sessions.reduce((s, h) => s + h.avgScore,      0) / totalSessions);
    const bestScore      = Math.max(...sessions.map((s) => s.avgScore));
    const avgConfidence  = Math.round(sessions.reduce((s, h) => s + (h.avgConfidence || 0), 0) / totalSessions);
    const voiceSessions  = sessions.filter((s) => s.usedVoice).length;

    res.json({
      totalSessions,
      avgScore,
      bestScore,
      avgConfidence,
      voiceSessions,
      sessions: sessions.map((s) => ({
        id:            s._id,
        role:          s.role,
        difficulty:    s.difficulty,
        avgScore:      s.avgScore,
        avgConfidence: s.avgConfidence || 0,
        usedVoice:     s.usedVoice    || false,
        questionCount: s.questionCount || 5,
        date:          s.createdAt,
      })),
    });
  } catch (err) {
    console.error("Stats error:", err.message);
    res.status(500).json({ message: "Failed to get stats." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/sessions/:id  — get one full session with all questions
// ─────────────────────────────────────────────────────────────────────────────
router.get("/:id", protect, async (req, res) => {
  try {
    const session = await Session.findOne({ _id: req.params.id, userId: req.userId });
    if (!session) return res.status(404).json({ message: "Session not found." });
    res.json(session);
  } catch (err) {
    console.error("Fetch session error:", err.message);
    res.status(500).json({ message: "Failed to fetch session." });
  }
});

module.exports = router;