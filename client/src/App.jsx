import { useState, useEffect, useCallback } from "react";
import ApiKeyPage from "./pages/ApiKeyPage";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/Dashboard";
import InterviewPage from "./pages/InterviewPage";
import ResultsPage from "./pages/ResultsPage";
import ProgressPage from "./pages/ProgressPage";
import RolesPage from "./pages/RolesPage";
import HistoryPage from "./pages/HistoryPage";
import TipsPage from "./pages/TipsPage";

const API = "https://interview-simulator-1-6glc.onrender.com/api";

export default function App() {
  const savedUser = (() => {
    try {
      const u = localStorage.getItem("auth_user");
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  })();

  const [page, setPage] = useState(() => (savedUser ? "dashboard" : "auth"));
  const [user, setUser] = useState(savedUser);
  const [role, setRole] = useState("frontend");
  const [currentResults, setCurrentResults] = useState([]);
  const [currentDifficulty, setCurrentDifficulty] = useState("Mid-Level");
  const [sessionHistory, setSessionHistory] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

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

  useEffect(() => {
    if (user) fetchSessions();
  }, [user]);

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
        await fetchSessions();
      }
    } catch (e) {
      console.warn("Could not save session:", e.message);
    }
    setPage("results");
  };

  const handleLogout = () => {
    setUser(null);
    setSessionHistory([]);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setPage("auth");
  };

  const goToProgress = () => {
    setPage("progress");
    fetchSessions();
  };

  const handleStartRole = (r) => {
    setRole(r);
    setPage("interview");
  };

  return (
    <>
      {page === "auth" && <AuthPage onLogin={handleLogin} />}

      {page === "dashboard" && (
        <DashboardPage
          user={user}
          sessionHistory={sessionHistory}
          onStart={handleStartRole}
          onProgress={goToProgress}
          onLogout={handleLogout}
          onGoRoles={() => setPage("roles")}
          onGoHistory={() => setPage("history")}
          onGoTips={() => setPage("tips")}
        />
      )}

      {page === "roles" && (
        <RolesPage
          sessionHistory={sessionHistory}
          onBack={() => setPage("dashboard")}
          onStart={handleStartRole}
        />
      )}

      {page === "history" && (
        <HistoryPage
          sessionHistory={sessionHistory}
          onBack={() => setPage("dashboard")}
          onStart={handleStartRole}
        />
      )}

      {page === "tips" && <TipsPage onBack={() => setPage("dashboard")} />}

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
