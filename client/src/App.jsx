import { useState, useEffect, useCallback } from "react";
import ApiKeyPage from "./pages/ApiKeyPage";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/Dashboard";
import InterviewPage from "./pages/InterviewPage";
import ResultsPage from "./pages/ResultsPage";
import ProgressPage from "./pages/ProgressPage";

const API = "https://interview-simulator-1-6glc.onrender.com/api";

export default function App() {
  // ── Restore user from localStorage on page refresh ───────────────────────
  const savedUser = (() => {
    try {
      const u = localStorage.getItem("auth_user");
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  })();

  const [page, setPage] = useState(() => {
    if (savedUser) return "dashboard";
    return "auth";
  });
  const [user, setUser] = useState(savedUser);
  const [role, setRole] = useState("frontend");
  const [currentResults, setCurrentResults] = useState([]);
  const [currentDifficulty, setCurrentDifficulty] = useState("Mid-Level");
  const [sessionHistory, setSessionHistory] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // ── Fetch sessions from MongoDB ──────────────────────────────────────────
  const fetchSessions = useCallback(async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;
    setLoadingSessions(true);
    try {
      const res = await fetch(`${API}/sessions/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.sessions) {
        setSessionHistory(
          data.sessions.map((s) => ({
            role: s.role,
            difficulty: s.difficulty,
            date: new Date(s.date).getTime(),
            avgScore: s.avgScore,
            avgConfidence: s.avgConfidence || 0,
            questionCount: s.questionCount || 5,
            usedVoice: s.usedVoice || false,
          }))
        );
      }
    } catch (e) {
      console.warn("Could not fetch sessions:", e.message);
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  // Load sessions whenever user logs in
  useEffect(() => {
    if (user) fetchSessions();
  }, [user]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleLogin = (userData) => {
    setUser(userData);
    setPage("dashboard");
  };

  const handleInterviewComplete = async (results, difficulty, usedVoice) => {
    const scores = results.map((r) => r.feedback.score);
    const avgScore = Math.round(
      scores.reduce((a, b) => a + b, 0) / scores.length
    );
    const avgConfidence = Math.round(
      results.reduce((a, r) => a + (r.feedback.confidence || 0), 0) /
        results.length
    );

    // ── 1. Add to local state immediately so UI updates right away ──────────
    const newSession = {
      role,
      difficulty: difficulty || currentDifficulty,
      date: Date.now(),
      avgScore,
      avgConfidence,
      questionCount: results.length,
      usedVoice: !!usedVoice,
    };
    setSessionHistory((prev) => [...prev, newSession]);
    setCurrentResults(results);
    setCurrentDifficulty(difficulty || currentDifficulty);

    // ── 2. Save to MongoDB ──────────────────────────────────────────────────
    try {
      const token = localStorage.getItem("auth_token");
      if (token) {
        await fetch(`${API}/sessions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            role,
            difficulty: difficulty || currentDifficulty,
            avgScore,
            avgConfidence,
            questionCount: results.length,
            usedVoice: !!usedVoice,
            questions: results,
          }),
        });

        // ── 3. Refresh sessions from server so Progress page is in sync ─────
        await fetchSessions();
      }
    } catch (e) {
      console.warn("Could not save session:", e.message);
    }

    // ── 4. Navigate to results ──────────────────────────────────────────────
    setPage("results");
  };

  const handleLogout = () => {
    setUser(null);
    setSessionHistory([]);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setPage("auth");
  };

  // ── Navigate to progress and refresh sessions ────────────────────────────
  const goToProgress = async () => {
    await fetchSessions(); // always fetch fresh data when opening Progress
    setPage("progress");
  };

  return (
    <>
      {page === "auth" && <AuthPage onLogin={handleLogin} />}

      {page === "dashboard" && (
        <DashboardPage
          user={user}
          sessionHistory={sessionHistory}
          onStart={(r) => {
            setRole(r);
            setPage("interview");
          }}
          onProgress={goToProgress}
          onLogout={handleLogout}
        />
      )}

      {page === "interview" && (
        <InterviewPage
          role={role}
          onComplete={handleInterviewComplete}
          onExit={() => setPage("dashboard")}
        />
      )}

      {page === "results" && (
        <ResultsPage
          session={currentResults}
          role={role}
          onHome={() => setPage("dashboard")}
          onRetry={() => setPage("interview")}
          onProgress={goToProgress}
        />
      )}

      {page === "progress" && (
        <ProgressPage
          user={user}
          sessionHistory={sessionHistory}
          loading={loadingSessions}
          onBack={() => setPage("dashboard")}
        />
      )}
    </>
  );
}
