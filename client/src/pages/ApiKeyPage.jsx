import { useEffect } from "react";

// ── Hardcode your Gemini API key here ────────────────────────────────────────
const GEMINI_API_KEY = "AIzaSyAB7Grq2-KepMOvT8ArTwWKSyTlMVxQsK4";

export default function ApiKeyPage({ onDone }) {
  useEffect(() => {
    if (
      GEMINI_API_KEY &&
      GEMINI_API_KEY !== "AIzaSyAB7Grq2-KepMOvT8ArTwWKSyTlMVxQsK4"
    ) {
      sessionStorage.setItem("GEMINI_KEY", GEMINI_API_KEY);
      console.log("Gemini key set in sessionStorage ✅");
    } else {
      console.warn("No Gemini key set — using local question bank");
    }
    onDone();
  }, []);

  return null;
}