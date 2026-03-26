const mongoose = require("mongoose");

const questionResultSchema = new mongoose.Schema({
  question:       { type: String, default: "" },
  category:       { type: String, default: "" },
  answer:         { type: String, default: "" },
  score:          { type: Number, default: 0  },
  grade:          { type: String, default: "F" },
  confidence:     { type: Number, default: 0  },
  clarity:        { type: Number, default: 0  },
  technicalDepth: { type: Number, default: 0  },
  strengths:      { type: [String], default: [] },
  improvements:   { type: [String], default: [] },
  verdict:        { type: String, default: "" },
  wordCount:      { type: Number, default: 0  },
  fillerCount:    { type: Number, default: 0  },
  pace:           { type: Number, default: 0  },
});

const sessionSchema = new mongoose.Schema(
  {
    userId:        { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role:          { type: String, required: true },
    difficulty:    { type: String, required: true },
    avgScore:      { type: Number, required: true },
    avgConfidence: { type: Number, default: 0 },
    questionCount: { type: Number, required: true },
    usedVoice:     { type: Boolean, default: false },
    questions:     { type: [questionResultSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Session", sessionSchema);