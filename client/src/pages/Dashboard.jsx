import { useState, useEffect, useRef } from "react";

const G = `@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap');`;
const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#020408;--surface:#080d14;--surface2:#0d1520;--surface3:#111a26;
  --border:#0f1e2e;--border2:#162435;--border3:#1e3248;
  --cyan:#00C8FF;--lime:#7FFF00;--orange:#FF6030;--purple:#A855F7;
  --gold:#FFD700;--pink:#FF69B4;--text:#e2eaf4;--muted:#3a5570;--dim:#1a2d3f;--red:#ff4444;
}
body{background:var(--bg);color:var(--text);font-family:'Outfit',sans-serif;overflow-x:hidden}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:var(--border3);border-radius:4px}
@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:.4;transform:scale(1)}50%{opacity:1;transform:scale(1.05)}}
@keyframes slideIn{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:translateX(0)}}
@keyframes glow{0%,100%{box-shadow:0 0 20px rgba(0,200,255,.15)}50%{box-shadow:0 0 40px rgba(0,200,255,.35)}}
@keyframes orb{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(30px,-20px) scale(1.1)}66%{transform:translate(-20px,15px) scale(.95)}}
.fu{animation:fadeUp .5s ease both}
.fi{animation:fadeIn .4s ease both}

/* ── Mobile nav overlay ── */
.mobile-nav{
  display:none;
  position:fixed;inset:0;
  background:rgba(2,4,8,.97);
  z-index:200;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  gap:14px;
}
.mobile-nav.open{display:flex}

/* ── Responsive breakpoints ── */
@media(max-width:768px){
  .nav-tabs{display:none!important}
  .nav-right-full{display:none!important}
  .hamburger{display:flex!important}
  .hero-grid{flex-direction:column!important}
  .stats-grid{grid-template-columns:1fr 1fr!important}
  .bottom-grid{grid-template-columns:1fr!important}
  .roles-grid{grid-template-columns:1fr!important}
  .tips-grid{grid-template-columns:1fr!important}
  .tips-quick{grid-template-columns:1fr!important}
  .modal-box{padding:20px!important}
  .modal-diff{flex-direction:column!important}
}
@media(max-width:480px){
  .stats-grid{grid-template-columns:1fr 1fr!important}
  .stat-card{padding:12px!important}
  .hero-pad{padding:20px 16px 60px!important}
}
`;

const toRgb = (c) =>
  c
    .slice(1)
    .match(/../g)
    .map((x) => parseInt(x, 16))
    .join(",");
const scoreColor = (s) =>
  s >= 80
    ? "var(--lime)"
    : s >= 65
    ? "var(--cyan)"
    : s >= 50
    ? "var(--orange)"
    : "var(--red)";
const fmtDate = (ts) =>
  new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const fmtTime = (ts) =>
  new Date(ts).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

const ROLE_META = {
  frontend: {
    label: "Frontend Dev",
    icon: "⚡",
    color: "#00C8FF",
    bg: "rgba(0,200,255,.06)",
    skills: ["React", "TypeScript", "CSS", "Performance"],
    level: "High Demand",
  },
  backend: {
    label: "Backend Dev",
    icon: "🔩",
    color: "#FF6030",
    bg: "rgba(255,96,48,.06)",
    skills: ["Node.js", "APIs", "Databases", "Security"],
    level: "High Demand",
  },
  fullstack: {
    label: "Full-Stack",
    icon: "🚀",
    color: "#A855F7",
    bg: "rgba(168,85,247,.06)",
    skills: ["MERN", "Architecture", "DevOps", "Cloud"],
    level: "Top Paying",
  },
  hr: {
    label: "HR & Culture",
    icon: "🤝",
    color: "#7FFF00",
    bg: "rgba(127,255,0,.06)",
    skills: ["Leadership", "Culture Fit", "Communication"],
    level: "People Skills",
  },
  devops: {
    label: "DevOps / SRE",
    icon: "⚙️",
    color: "#FFD700",
    bg: "rgba(255,215,0,.06)",
    skills: ["AWS", "Docker", "CI/CD", "Kubernetes"],
    level: "Cloud Native",
  },
  data: {
    label: "Data Engineer",
    icon: "📊",
    color: "#FF69B4",
    bg: "rgba(255,105,180,.06)",
    skills: ["Python", "SQL", "Spark", "ML Pipelines"],
    level: "AI Powered",
  },
};

const TIPS = [
  {
    icon: "🎯",
    title: "STAR Method",
    body: "Structure answers as Situation → Task → Action → Result for behavioral questions.",
  },
  {
    icon: "🧠",
    title: "Research First",
    body: "Look up the company's tech stack before each session for more relevant answers.",
  },
  {
    icon: "⏱",
    title: "Stay Concise",
    body: "Aim for 90-second answers. Clarity beats length every time.",
  },
  {
    icon: "🎙",
    title: "Voice Analysis",
    body: "Voice mode tracks confidence, pace, and filler words live as you speak.",
  },
  {
    icon: "💡",
    title: "Use Examples",
    body: "Real project examples score 40% higher than theoretical answers.",
  },
  {
    icon: "📈",
    title: "Track Growth",
    body: "Review your progress page after each session to find your weak spots.",
  },
];

const QUICK_TIPS = [
  "Say 'I' not 'we' — own your contributions",
  "Pause before answering — it shows thoughtfulness",
  "Ask clarifying questions when unsure",
  "End answers by connecting back to the role",
  "Quantify results: 'reduced load time by 40%'",
  "Show enthusiasm — energy matters a lot",
];

const DIFFICULTY_INFO = {
  Junior: {
    color: "var(--lime)",
    desc: "0–2 years",
    questions: "Fundamentals & basics",
  },
  "Mid-Level": {
    color: "var(--cyan)",
    desc: "2–5 years",
    questions: "Architecture & trade-offs",
  },
  Senior: {
    color: "var(--orange)",
    desc: "5+ years",
    questions: "System design & leadership",
  },
};

export default function DashboardPage({
  user,
  sessionHistory = [],
  onStart,
  onProgress,
  onLogout,
}) {
  const [tip, setTip] = useState(0);
  const [quickTip, setQuickTip] = useState(0);
  const [hovRole, setHovRole] = useState(null);
  const [selRole, setSelRole] = useState(null);
  const [selDiff, setSelDiff] = useState("Mid-Level");
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("roles");
  const [searchQ, setSearchQ] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const tipTimer = useRef(null);
  const quickTimer = useRef(null);

  useEffect(() => {
    tipTimer.current = setInterval(
      () => setTip((i) => (i + 1) % TIPS.length),
      5000
    );
    quickTimer.current = setInterval(
      () => setQuickTip((i) => (i + 1) % QUICK_TIPS.length),
      3000
    );
    return () => {
      clearInterval(tipTimer.current);
      clearInterval(quickTimer.current);
    };
  }, []);

  const total = sessionHistory.length;
  const avgScore =
    total > 0
      ? Math.round(sessionHistory.reduce((s, h) => s + h.avgScore, 0) / total)
      : 0;
  const best =
    total > 0 ? Math.max(...sessionHistory.map((s) => s.avgScore)) : 0;
  const improvement =
    total >= 2
      ? sessionHistory[total - 1].avgScore - sessionHistory[0].avgScore
      : 0;
  const rolesUsed = [...new Set(sessionHistory.map((s) => s.role))];
  const recent = [...sessionHistory].reverse().slice(0, showAll ? 999 : 4);

  const firstName = (user?.name || "there").split(" ")[0];
  const initial = (user?.name || "?")[0].toUpperCase();
  const hour = new Date().getHours();
  const greeting =
    hour < 5
      ? "Good night"
      : hour < 12
      ? "Good morning"
      : hour < 17
      ? "Good afternoon"
      : "Good evening";
  const greetEmoji =
    hour < 5 ? "🌙" : hour < 12 ? "☀️" : hour < 17 ? "🌤" : "🌙";

  const filteredRoles = Object.entries(ROLE_META).filter(
    ([id, r]) =>
      r.label.toLowerCase().includes(searchQ.toLowerCase()) ||
      r.skills.some((s) => s.toLowerCase().includes(searchQ.toLowerCase()))
  );

  const openModal = (id) => {
    setSelRole(id);
    setShowModal(true);
  };
  const startNow = () => {
    setShowModal(false);
    onStart(selRole);
  };

  const navTo = (tab) => {
    setActiveTab(tab);
    setMobileNavOpen(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--text)",
        fontFamily: "'Outfit',sans-serif",
      }}
    >
      <style>{G + CSS}</style>

      {/* Background orbs */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          overflow: "hidden",
          zIndex: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background:
              "radial-gradient(circle,rgba(0,200,255,.04),transparent 70%)",
            top: -150,
            left: -150,
            animation: "orb 22s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background:
              "radial-gradient(circle,rgba(168,85,247,.04),transparent 70%)",
            bottom: -100,
            right: -100,
            animation: "orb 28s ease-in-out infinite reverse",
          }}
        />
      </div>

      {/* ── Mobile Nav Overlay ── */}
      <div className={`mobile-nav${mobileNavOpen ? " open" : ""}`}>
        <button
          onClick={() => setMobileNavOpen(false)}
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            background: "var(--surface2)",
            border: "1px solid var(--border2)",
            borderRadius: 8,
            width: 38,
            height: 38,
            cursor: "pointer",
            color: "var(--muted)",
            fontSize: 18,
          }}
        >
          ✕
        </button>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: "linear-gradient(135deg,#00C8FF,#0066ff)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
            }}
          >
            🧠
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 13,
              color: "var(--cyan)",
              letterSpacing: 2,
            }}
          >
            INTERVIEWAI
          </div>
        </div>
        {[
          ["roles", "🎯", "Roles"],
          ["recent", "📋", "History"],
          ["tips", "💡", "Tips"],
        ].map(([id, ic, lbl]) => (
          <button
            key={id}
            onClick={() => navTo(id)}
            style={{
              width: 220,
              padding: "14px 20px",
              background: activeTab === id ? "var(--surface2)" : "transparent",
              border: `1px solid ${
                activeTab === id ? "var(--border3)" : "var(--border2)"
              }`,
              borderRadius: 12,
              cursor: "pointer",
              fontFamily: "'Outfit',sans-serif",
              fontSize: 15,
              color: activeTab === id ? "var(--cyan)" : "var(--muted)",
              display: "flex",
              alignItems: "center",
              gap: 12,
              transition: "all .2s",
            }}
          >
            <span style={{ fontSize: 20 }}>{ic}</span>
            {lbl}
          </button>
        ))}
        <div
          style={{
            marginTop: 16,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            width: 220,
          }}
        >
          <button
            onClick={() => {
              onProgress();
              setMobileNavOpen(false);
            }}
            style={{
              background: "rgba(0,200,255,.08)",
              border: "1px solid rgba(0,200,255,.2)",
              borderRadius: 12,
              padding: "12px 20px",
              cursor: "pointer",
              fontFamily: "'Outfit',sans-serif",
              fontSize: 14,
              color: "var(--cyan)",
              textAlign: "left",
            }}
          >
            📊 Progress
          </button>
          <button
            onClick={() => {
              onLogout();
              setMobileNavOpen(false);
            }}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border2)",
              borderRadius: 12,
              padding: "12px 20px",
              cursor: "pointer",
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 12,
              color: "var(--muted)",
              textAlign: "left",
            }}
          >
            Log out
          </button>
        </div>
      </div>

      {/* ── Navbar ── */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          height: 64,
          background: "rgba(2,4,8,.92)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--border2)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg,#00C8FF,#0066ff)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              boxShadow: "0 0 20px rgba(0,200,255,.3)",
            }}
          >
            🧠
          </div>
          <div>
            <div
              style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 12,
                color: "var(--cyan)",
                letterSpacing: 1.5,
              }}
            >
              INTERVIEWAI
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 8,
                color: "var(--muted)",
                letterSpacing: 1,
              }}
            >
              AI-POWERED PRACTICE
            </div>
          </div>
        </div>

        {/* Desktop tabs */}
        <div className="nav-tabs" style={{ display: "flex", gap: 4 }}>
          {[
            ["roles", "🎯", "Roles"],
            ["recent", "📋", "History"],
            ["tips", "💡", "Tips"],
          ].map(([id, ic, lbl]) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                background:
                  activeTab === id ? "var(--surface2)" : "transparent",
                border: `1px solid ${
                  activeTab === id ? "var(--border3)" : "transparent"
                }`,
                borderRadius: 8,
                padding: "7px 16px",
                cursor: "pointer",
                fontFamily: "'Outfit',sans-serif",
                fontSize: 13,
                color: activeTab === id ? "var(--text)" : "var(--muted)",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "all .2s",
              }}
            >
              <span>{ic}</span>
              {lbl}
            </button>
          ))}
        </div>

        {/* Desktop right */}
        <div
          className="nav-right-full"
          style={{ display: "flex", gap: 10, alignItems: "center" }}
        >
          <button
            onClick={onProgress}
            style={{
              background: "rgba(0,200,255,.08)",
              border: "1px solid rgba(0,200,255,.2)",
              borderRadius: 8,
              padding: "7px 16px",
              cursor: "pointer",
              fontFamily: "'Outfit',sans-serif",
              fontSize: 13,
              color: "var(--cyan)",
            }}
          >
            📊 Progress
          </button>
          <button
            onClick={onLogout}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border2)",
              borderRadius: 8,
              padding: "7px 14px",
              cursor: "pointer",
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 11,
              color: "var(--muted)",
            }}
          >
            Log out
          </button>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              paddingLeft: 12,
              borderLeft: "1px solid var(--border2)",
            }}
          >
            <div style={{ position: "relative" }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg,var(--cyan),#0066ff)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: 15,
                  color: "#020408",
                }}
              >
                {initial}
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: 1,
                  right: 1,
                  width: 9,
                  height: 9,
                  borderRadius: "50%",
                  background: "var(--lime)",
                  border: "2px solid var(--bg)",
                }}
              />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>
                {user?.name || ""}
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 9,
                  color: "var(--muted)",
                }}
              >
                ● Online
              </div>
            </div>
          </div>
        </div>

        {/* Hamburger (mobile only) */}
        <button
          className="hamburger"
          onClick={() => setMobileNavOpen(true)}
          style={{
            display: "none",
            background: "var(--surface)",
            border: "1px solid var(--border2)",
            borderRadius: 8,
            width: 38,
            height: 38,
            cursor: "pointer",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 5,
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 18,
                height: 2,
                background: "var(--muted)",
                borderRadius: 1,
              }}
            />
          ))}
        </button>
      </nav>

      {/* ── Content ── */}
      <div
        className="hero-pad"
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "28px 20px 80px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* ── Hero ── */}
        <div className="fu" style={{ marginBottom: 28 }}>
          <div
            className="hero-grid"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 24,
            }}
          >
            {/* Left */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 10,
                }}
              >
                <span style={{ fontSize: 22 }}>{greetEmoji}</span>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 11,
                    color: "var(--muted)",
                    letterSpacing: 2,
                  }}
                >
                  {greeting.toUpperCase()}, {firstName.toUpperCase()}
                </span>
              </div>
              <h1
                style={{
                  fontWeight: 900,
                  fontSize: "clamp(22px,4vw,44px)",
                  lineHeight: 1.05,
                  marginBottom: 12,
                }}
              >
                Land your{" "}
                <span
                  style={{
                    background: "linear-gradient(135deg,#00C8FF,#A855F7)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  dream job
                </span>
                <br />
                with AI practice.
              </h1>
              <p
                style={{
                  color: "var(--muted)",
                  fontSize: 14,
                  maxWidth: 460,
                  lineHeight: 1.8,
                  marginBottom: 16,
                }}
              >
                AI-generated questions tailored to your role. Real-time voice
                analysis, detailed feedback, and progress tracking.
              </p>
              {/* Quick tip ticker */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "var(--surface)",
                  border: "1px solid var(--border2)",
                  borderRadius: 10,
                  padding: "9px 14px",
                  maxWidth: 420,
                }}
              >
                <span style={{ fontSize: 13 }}>💡</span>
                <span
                  key={quickTip}
                  style={{
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 11,
                    color: "var(--cyan)",
                    animation: "slideIn .4s ease both",
                    flex: 1,
                  }}
                >
                  {QUICK_TIPS[quickTip]}
                </span>
              </div>
            </div>

            {/* Stats grid */}
            <div
              className="stats-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
                minWidth: 240,
                flexShrink: 0,
              }}
            >
              {[
                { n: total, l: "Sessions", c: "var(--cyan)", i: "📋" },
                {
                  n: total > 0 ? `${avgScore}%` : "—",
                  l: "Avg Score",
                  c: "var(--lime)",
                  i: "🎯",
                },
                {
                  n: total > 0 ? best : "—",
                  l: "Best Score",
                  c: "var(--gold)",
                  i: "🏆",
                },
                {
                  n: rolesUsed.length + "/6",
                  l: "Roles Done",
                  c: "var(--purple)",
                  i: "🎭",
                },
              ].map((s, i) => (
                <div
                  key={s.l}
                  className="stat-card fu"
                  style={{
                    animationDelay: `${i * 0.06}s`,
                    background: "var(--surface)",
                    border: "1px solid var(--border2)",
                    borderRadius: 14,
                    padding: "14px 14px",
                  }}
                >
                  <div style={{ fontSize: 18, marginBottom: 5 }}>{s.i}</div>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: 22,
                      color: s.c,
                      fontFamily: "'JetBrains Mono',monospace",
                      lineHeight: 1,
                      marginBottom: 3,
                    }}
                  >
                    {s.n}
                  </div>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 9,
                      color: "var(--muted)",
                      letterSpacing: 1.5,
                      textTransform: "uppercase",
                    }}
                  >
                    {s.l}
                  </div>
                  {s.l === "Avg Score" && improvement !== 0 && total >= 2 && (
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono',monospace",
                        fontSize: 9,
                        color: improvement > 0 ? "var(--lime)" : "var(--red)",
                        marginTop: 3,
                      }}
                    >
                      {improvement > 0 ? "↑" : "↓"} {Math.abs(improvement)} from
                      first
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Roles practiced badges */}
        {rolesUsed.length > 0 && (
          <div
            className="fu"
            style={{
              animationDelay: ".1s",
              background: "var(--surface)",
              border: "1px solid var(--border2)",
              borderRadius: 12,
              padding: "12px 16px",
              marginBottom: 22,
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 9,
                color: "var(--muted)",
                letterSpacing: 2,
              }}
            >
              PRACTICED:
            </span>
            {rolesUsed.map((r) => {
              const m = ROLE_META[r];
              return m ? (
                <div
                  key={r}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    background: `rgba(${toRgb(m.color)},.08)`,
                    border: `1px solid rgba(${toRgb(m.color)},.2)`,
                    borderRadius: 20,
                    padding: "3px 10px",
                  }}
                >
                  <span style={{ fontSize: 12 }}>{m.icon}</span>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 10,
                      color: m.color,
                    }}
                  >
                    {m.label}
                  </span>
                </div>
              ) : null;
            })}
            {rolesUsed.length < 6 && (
              <span
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 9,
                  color: "var(--dim)",
                  marginLeft: "auto",
                }}
              >
                {6 - rolesUsed.length} more to explore
              </span>
            )}
          </div>
        )}

        {/* ── ROLES TAB ── */}
        {activeTab === "roles" && (
          <div>
            {/* Header + search */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 3,
                    height: 18,
                    background:
                      "linear-gradient(180deg,var(--cyan),var(--purple))",
                    borderRadius: 2,
                  }}
                />
                <span
                  style={{
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 10,
                    color: "var(--muted)",
                    letterSpacing: 3,
                    textTransform: "uppercase",
                  }}
                >
                  Choose Interview Role
                </span>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="Search roles or skills…"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border2)",
                    borderRadius: 9,
                    padding: "8px 14px 8px 34px",
                    fontFamily: "'Outfit',sans-serif",
                    fontSize: 13,
                    color: "var(--text)",
                    outline: "none",
                    width: 200,
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    left: 11,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: 13,
                    pointerEvents: "none",
                  }}
                >
                  🔍
                </span>
              </div>
            </div>

            {/* Role cards */}
            <div
              className="roles-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
                gap: 14,
                marginBottom: 28,
              }}
            >
              {filteredRoles.map(([id, r], i) => {
                const isH = hovRole === id;
                const ss = sessionHistory.filter((s) => s.role === id);
                const roleAvg =
                  ss.length > 0
                    ? Math.round(
                        ss.reduce((a, s) => a + s.avgScore, 0) / ss.length
                      )
                    : null;
                const cr = toRgb(r.color);
                return (
                  <div
                    key={id}
                    className="fu"
                    style={{
                      animationDelay: `${i * 0.06}s`,
                      background: isH ? r.bg : "var(--surface)",
                      border: `1px solid ${isH ? r.color : "var(--border2)"}`,
                      borderRadius: 18,
                      padding: "20px 18px",
                      cursor: "pointer",
                      transition: "all .25s",
                      transform: isH ? "translateY(-4px)" : "translateY(0)",
                      boxShadow: isH ? `0 12px 40px rgba(${cr},.18)` : "none",
                      position: "relative",
                      overflow: "hidden",
                    }}
                    onMouseEnter={() => setHovRole(id)}
                    onMouseLeave={() => setHovRole(null)}
                    onClick={() => openModal(id)}
                  >
                    {isH && (
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          height: 2,
                          background: `linear-gradient(90deg,transparent,${r.color},transparent)`,
                        }}
                      />
                    )}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 46,
                          height: 46,
                          borderRadius: 14,
                          background: `rgba(${cr},.12)`,
                          border: `1px solid rgba(${cr},.25)`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 22,
                        }}
                      >
                        {r.icon}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-end",
                          gap: 4,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "'JetBrains Mono',monospace",
                            fontSize: 8,
                            color: r.color,
                            background: `rgba(${cr},.1)`,
                            border: `1px solid rgba(${cr},.2)`,
                            borderRadius: 4,
                            padding: "2px 7px",
                            letterSpacing: 1,
                          }}
                        >
                          {r.level}
                        </span>
                        {roleAvg !== null && (
                          <span
                            style={{
                              fontFamily: "'JetBrains Mono',monospace",
                              fontSize: 9,
                              color: scoreColor(roleAvg),
                              background: "var(--surface2)",
                              borderRadius: 4,
                              padding: "2px 7px",
                            }}
                          >
                            avg {roleAvg}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 16,
                        color: isH ? r.color : "var(--text)",
                        marginBottom: 8,
                        transition: "color .2s",
                      }}
                    >
                      {r.label}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 5,
                        marginBottom: 12,
                      }}
                    >
                      {r.skills.map((s) => (
                        <span
                          key={s}
                          style={{
                            fontFamily: "'JetBrains Mono',monospace",
                            fontSize: 9,
                            color: isH ? r.color : "var(--muted)",
                            background: isH
                              ? `rgba(${cr},.08)`
                              : "var(--surface2)",
                            border: `1px solid ${
                              isH ? `rgba(${cr},.2)` : "var(--border)"
                            }`,
                            borderRadius: 4,
                            padding: "2px 7px",
                            transition: "all .2s",
                          }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono',monospace",
                          fontSize: 10,
                          color: "var(--muted)",
                        }}
                      >
                        {ss.length > 0
                          ? `${ss.length} session${
                              ss.length !== 1 ? "s" : ""
                            } done`
                          : "Not practiced yet"}
                      </span>
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono',monospace",
                          fontSize: 11,
                          color: isH ? r.color : "var(--dim)",
                          transition: "color .2s",
                        }}
                      >
                        {isH ? "Start →" : "Practice"}
                      </span>
                    </div>
                    {roleAvg !== null && (
                      <div
                        style={{
                          marginTop: 10,
                          height: 3,
                          background: "var(--surface2)",
                          borderRadius: 2,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${roleAvg}%`,
                            background: r.color,
                            borderRadius: 2,
                            opacity: 0.7,
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom grid */}
            <div
              className="bottom-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 300px",
                gap: 16,
                alignItems: "start",
              }}
            >
              {/* Recent sessions */}
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div
                      style={{
                        width: 3,
                        height: 16,
                        background: "var(--orange)",
                        borderRadius: 2,
                      }}
                    />
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono',monospace",
                        fontSize: 10,
                        color: "var(--muted)",
                        letterSpacing: 2,
                        textTransform: "uppercase",
                      }}
                    >
                      Recent
                    </span>
                  </div>
                  {total > 4 && (
                    <button
                      onClick={() => setShowAll((s) => !s)}
                      style={{
                        background: "none",
                        border: "none",
                        fontFamily: "'JetBrains Mono',monospace",
                        fontSize: 10,
                        color: "var(--cyan)",
                        cursor: "pointer",
                      }}
                    >
                      {showAll ? "Less" : "All →"}
                    </button>
                  )}
                </div>
                {recent.length === 0 ? (
                  <div
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border2)",
                      borderRadius: 14,
                      padding: "28px 18px",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 32,
                        marginBottom: 10,
                        animation: "float 3s ease-in-out infinite",
                      }}
                    >
                      🎯
                    </div>
                    <p
                      style={{
                        fontFamily: "'JetBrains Mono',monospace",
                        fontSize: 11,
                        color: "var(--muted)",
                        lineHeight: 1.8,
                      }}
                    >
                      No sessions yet.
                      <br />
                      Pick a role above!
                    </p>
                  </div>
                ) : (
                  recent.map((s, i) => {
                    const meta = ROLE_META[s.role] || ROLE_META.frontend;
                    const cr = toRgb(meta.color);
                    return (
                      <div
                        key={i}
                        className="fu"
                        style={{
                          animationDelay: `${i * 0.05}s`,
                          background: "var(--surface)",
                          border: "1px solid var(--border2)",
                          borderRadius: 14,
                          padding: "13px 15px",
                          marginBottom: 8,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 10,
                              background: `rgba(${cr},.1)`,
                              border: `1px solid rgba(${cr},.2)`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 16,
                              flexShrink: 0,
                            }}
                          >
                            {meta.icon}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                display: "flex",
                                gap: 5,
                                marginBottom: 2,
                                alignItems: "center",
                                flexWrap: "wrap",
                              }}
                            >
                              <span style={{ fontWeight: 600, fontSize: 13 }}>
                                {meta.label}
                              </span>
                              <span
                                style={{
                                  fontFamily: "'JetBrains Mono',monospace",
                                  fontSize: 8,
                                  color: "var(--muted)",
                                  background: "var(--surface2)",
                                  border: "1px solid var(--border2)",
                                  borderRadius: 10,
                                  padding: "1px 5px",
                                }}
                              >
                                {s.difficulty}
                              </span>
                            </div>
                            <div
                              style={{
                                fontFamily: "'JetBrains Mono',monospace",
                                fontSize: 9,
                                color: "var(--muted)",
                              }}
                            >
                              {fmtDate(s.date)} · {s.questionCount}Q
                            </div>
                          </div>
                          <div
                            style={{
                              fontFamily: "'JetBrains Mono',monospace",
                              fontWeight: 700,
                              fontSize: 20,
                              color: scoreColor(s.avgScore),
                            }}
                          >
                            {s.avgScore}
                          </div>
                        </div>
                        <div
                          style={{
                            marginTop: 8,
                            height: 3,
                            background: "var(--surface2)",
                            borderRadius: 2,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${s.avgScore}%`,
                              background: scoreColor(s.avgScore),
                              borderRadius: 2,
                              opacity: 0.6,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* By role */}
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      width: 3,
                      height: 16,
                      background: "var(--purple)",
                      borderRadius: 2,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 10,
                      color: "var(--muted)",
                      letterSpacing: 2,
                      textTransform: "uppercase",
                    }}
                  >
                    By Role
                  </span>
                </div>
                <div
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border2)",
                    borderRadius: 14,
                    padding: "18px 16px",
                  }}
                >
                  {rolesUsed.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "20px 0" }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
                      <p
                        style={{
                          fontFamily: "'JetBrains Mono',monospace",
                          fontSize: 11,
                          color: "var(--muted)",
                          lineHeight: 1.8,
                        }}
                      >
                        Complete sessions to see performance by role.
                      </p>
                    </div>
                  ) : (
                    Object.entries(ROLE_META)
                      .map(([id, r]) => {
                        const ss = sessionHistory.filter((s) => s.role === id);
                        if (ss.length === 0) return null;
                        const avg = Math.round(
                          ss.reduce((a, s) => a + s.avgScore, 0) / ss.length
                        );
                        return (
                          <div
                            key={id}
                            style={{ marginBottom: 14, cursor: "pointer" }}
                            onClick={() => openModal(id)}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: 5,
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 7,
                                }}
                              >
                                <span style={{ fontSize: 14 }}>{r.icon}</span>
                                <span
                                  style={{
                                    fontFamily: "'JetBrains Mono',monospace",
                                    fontSize: 10,
                                    color: "var(--text)",
                                  }}
                                >
                                  {r.label}
                                </span>
                                <span
                                  style={{
                                    fontFamily: "'JetBrains Mono',monospace",
                                    fontSize: 8,
                                    color: "var(--dim)",
                                  }}
                                >
                                  {ss.length}x
                                </span>
                              </div>
                              <span
                                style={{
                                  fontFamily: "'JetBrains Mono',monospace",
                                  fontSize: 11,
                                  color: scoreColor(avg),
                                  fontWeight: 700,
                                }}
                              >
                                {avg}%
                              </span>
                            </div>
                            <div
                              style={{
                                height: 5,
                                background: "var(--surface2)",
                                borderRadius: 3,
                                overflow: "hidden",
                              }}
                            >
                              <div
                                style={{
                                  height: "100%",
                                  width: `${avg}%`,
                                  background: r.color,
                                  borderRadius: 3,
                                  opacity: 0.8,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })
                      .filter(Boolean)
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {/* Tip */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 2,
                  }}
                >
                  <div
                    style={{
                      width: 3,
                      height: 16,
                      background: "var(--lime)",
                      borderRadius: 2,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 10,
                      color: "var(--muted)",
                      letterSpacing: 2,
                      textTransform: "uppercase",
                    }}
                  >
                    Tip of the day
                  </span>
                </div>
                <div
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border2)",
                    borderRadius: 16,
                    padding: 18,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 2,
                      background:
                        "linear-gradient(90deg,var(--cyan),var(--purple))",
                      opacity: 0.5,
                    }}
                  />
                  <div key={tip} style={{ animation: "slideIn .4s ease both" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 8,
                      }}
                    >
                      <span style={{ fontSize: 20 }}>{TIPS[tip].icon}</span>
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono',monospace",
                          fontSize: 9,
                          color: "var(--cyan)",
                          letterSpacing: 2,
                          textTransform: "uppercase",
                        }}
                      >
                        {TIPS[tip].title}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: 13,
                        lineHeight: 1.7,
                        color: "var(--muted)",
                      }}
                    >
                      {TIPS[tip].body}
                    </p>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 5,
                      marginTop: 12,
                      alignItems: "center",
                    }}
                  >
                    {TIPS.map((_, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          setTip(i);
                          clearInterval(tipTimer.current);
                        }}
                        style={{
                          width: i === tip ? 18 : 5,
                          height: 4,
                          borderRadius: 2,
                          cursor: "pointer",
                          background: i === tip ? "var(--cyan)" : "var(--dim)",
                          transition: "all .3s",
                        }}
                      />
                    ))}
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono',monospace",
                        fontSize: 9,
                        color: "var(--dim)",
                        marginLeft: "auto",
                      }}
                    >
                      {tip + 1}/{TIPS.length}
                    </span>
                  </div>
                </div>

                {/* Voice AI */}
                <div
                  style={{
                    background:
                      "linear-gradient(135deg,rgba(0,200,255,.06),rgba(168,85,247,.06))",
                    border: "1px solid rgba(0,200,255,.15)",
                    borderRadius: 16,
                    padding: 16,
                    animation: "glow 4s ease-in-out infinite",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 9,
                        background: "rgba(0,200,255,.12)",
                        border: "1px solid rgba(0,200,255,.25)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 15,
                      }}
                    >
                      🎙
                    </div>
                    <div>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 13,
                          color: "var(--cyan)",
                        }}
                      >
                        Voice AI Active
                      </div>
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono',monospace",
                          fontSize: 9,
                          color: "var(--muted)",
                        }}
                      >
                        Chrome / Edge only
                      </div>
                    </div>
                  </div>
                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--muted)",
                      lineHeight: 1.7,
                    }}
                  >
                    AI speaks questions. Answer verbally for live{" "}
                    <b style={{ color: "var(--text)" }}>confidence</b> and{" "}
                    <b style={{ color: "var(--text)" }}>pace</b> scoring.
                  </p>
                </div>

                {/* Progress CTA */}
                <button
                  onClick={onProgress}
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border2)",
                    borderRadius: 16,
                    padding: 16,
                    cursor: "pointer",
                    textAlign: "left",
                    width: "100%",
                    transition: "all .2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--purple)";
                    e.currentTarget.style.background = "rgba(168,85,247,.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border2)";
                    e.currentTarget.style.background = "var(--surface)";
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 6,
                    }}
                  >
                    <span style={{ fontSize: 20 }}>📈</span>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>
                      Your Progress
                    </span>
                    <span
                      style={{
                        marginLeft: "auto",
                        color: "var(--purple)",
                        fontSize: 14,
                      }}
                    >
                      →
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--muted)",
                      lineHeight: 1.6,
                    }}
                  >
                    {total > 0
                      ? `${total} sessions · avg ${avgScore}% · ${rolesUsed.length} roles`
                      : "Charts, achievements, and improvement tracking."}
                  </p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── HISTORY TAB ── */}
        {activeTab === "recent" && (
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  width: 3,
                  height: 18,
                  background: "var(--orange)",
                  borderRadius: 2,
                }}
              />
              <span
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 10,
                  color: "var(--muted)",
                  letterSpacing: 3,
                  textTransform: "uppercase",
                }}
              >
                Session History
              </span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 9,
                  color: "var(--dim)",
                  background: "var(--surface2)",
                  border: "1px solid var(--border2)",
                  borderRadius: 4,
                  padding: "2px 7px",
                }}
              >
                {total} total
              </span>
            </div>
            {total === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "60px 20px",
                  background: "var(--surface)",
                  border: "1px solid var(--border2)",
                  borderRadius: 18,
                }}
              >
                <div
                  style={{
                    fontSize: 48,
                    marginBottom: 16,
                    animation: "float 3s ease-in-out infinite",
                  }}
                >
                  📋
                </div>
                <h3 style={{ fontWeight: 700, fontSize: 20, marginBottom: 10 }}>
                  No sessions yet
                </h3>
                <p
                  style={{
                    color: "var(--muted)",
                    fontSize: 14,
                    lineHeight: 1.7,
                    marginBottom: 20,
                  }}
                >
                  Go to the Roles tab and start your first interview.
                </p>
                <button
                  onClick={() => setActiveTab("roles")}
                  style={{
                    background: "linear-gradient(135deg,var(--cyan),#0066ff)",
                    border: "none",
                    borderRadius: 12,
                    padding: "12px 24px",
                    color: "#020408",
                    fontFamily: "'Outfit',sans-serif",
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  Start First Interview →
                </button>
              </div>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {[...sessionHistory].reverse().map((s, i) => {
                  const meta = ROLE_META[s.role] || ROLE_META.frontend;
                  const cr = toRgb(meta.color);
                  return (
                    <div
                      key={i}
                      className="fu"
                      style={{
                        animationDelay: `${i * 0.04}s`,
                        background: "var(--surface)",
                        border: "1px solid var(--border2)",
                        borderRadius: 16,
                        padding: "16px 18px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          flexWrap: "wrap",
                        }}
                      >
                        <div
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: 12,
                            background: `rgba(${cr},.1)`,
                            border: `1px solid rgba(${cr},.2)`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 20,
                            flexShrink: 0,
                          }}
                        >
                          {meta.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 120 }}>
                          <div
                            style={{
                              display: "flex",
                              gap: 6,
                              marginBottom: 4,
                              flexWrap: "wrap",
                              alignItems: "center",
                            }}
                          >
                            <span style={{ fontWeight: 600, fontSize: 14 }}>
                              {meta.label}
                            </span>
                            <span
                              style={{
                                fontFamily: "'JetBrains Mono',monospace",
                                fontSize: 9,
                                color: "var(--muted)",
                                background: "var(--surface2)",
                                border: "1px solid var(--border2)",
                                borderRadius: 10,
                                padding: "2px 8px",
                              }}
                            >
                              {s.difficulty}
                            </span>
                            {s.usedVoice && (
                              <span
                                style={{
                                  fontFamily: "'JetBrains Mono',monospace",
                                  fontSize: 9,
                                  color: "var(--cyan)",
                                  background: "rgba(0,200,255,.08)",
                                  border: "1px solid rgba(0,200,255,.2)",
                                  borderRadius: 10,
                                  padding: "2px 8px",
                                }}
                              >
                                🎙 Voice
                              </span>
                            )}
                          </div>
                          <div
                            style={{
                              fontFamily: "'JetBrains Mono',monospace",
                              fontSize: 10,
                              color: "var(--muted)",
                            }}
                          >
                            {fmtDate(s.date)} at {fmtTime(s.date)} ·{" "}
                            {s.questionCount} questions
                          </div>
                        </div>
                        <div style={{ textAlign: "center", minWidth: 70 }}>
                          <div
                            style={{
                              fontFamily: "'JetBrains Mono',monospace",
                              fontWeight: 700,
                              fontSize: 26,
                              color: scoreColor(s.avgScore),
                              lineHeight: 1,
                            }}
                          >
                            {s.avgScore}
                          </div>
                          <div
                            style={{
                              fontFamily: "'JetBrains Mono',monospace",
                              fontSize: 9,
                              color: "var(--dim)",
                            }}
                          >
                            / 100
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelRole(s.role);
                            setSelDiff(s.difficulty);
                            setShowModal(true);
                          }}
                          style={{
                            background: `rgba(${cr},.08)`,
                            border: `1px solid rgba(${cr},.2)`,
                            borderRadius: 10,
                            padding: "8px 14px",
                            color: meta.color,
                            fontFamily: "'Outfit',sans-serif",
                            fontWeight: 600,
                            fontSize: 12,
                            cursor: "pointer",
                          }}
                        >
                          Retry →
                        </button>
                      </div>
                      <div
                        style={{
                          marginTop: 10,
                          height: 4,
                          background: "var(--surface2)",
                          borderRadius: 2,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${s.avgScore}%`,
                            background: scoreColor(s.avgScore),
                            borderRadius: 2,
                            opacity: 0.6,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TIPS TAB ── */}
        {activeTab === "tips" && (
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  width: 3,
                  height: 18,
                  background: "var(--lime)",
                  borderRadius: 2,
                }}
              />
              <span
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 10,
                  color: "var(--muted)",
                  letterSpacing: 3,
                  textTransform: "uppercase",
                }}
              >
                Interview Tips & Strategy
              </span>
            </div>
            <div
              className="tips-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))",
                gap: 14,
                marginBottom: 24,
              }}
            >
              {TIPS.map((t, i) => (
                <div
                  key={i}
                  className="fu"
                  style={{
                    animationDelay: `${i * 0.06}s`,
                    background: "var(--surface)",
                    border: "1px solid var(--border2)",
                    borderRadius: 16,
                    padding: 22,
                    transition: "all .25s",
                    cursor: "default",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--cyan)";
                    e.currentTarget.style.background = "rgba(0,200,255,.03)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border2)";
                    e.currentTarget.style.background = "var(--surface)";
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 11,
                        background: "rgba(0,200,255,.08)",
                        border: "1px solid rgba(0,200,255,.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 18,
                      }}
                    >
                      {t.icon}
                    </div>
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono',monospace",
                        fontSize: 10,
                        color: "var(--cyan)",
                        letterSpacing: 2,
                        textTransform: "uppercase",
                      }}
                    >
                      {t.title}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: 14,
                      color: "var(--muted)",
                      lineHeight: 1.8,
                    }}
                  >
                    {t.body}
                  </p>
                </div>
              ))}
            </div>
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border2)",
                borderRadius: 18,
                padding: 22,
              }}
            >
              <div
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 10,
                  color: "var(--muted)",
                  letterSpacing: 2,
                  marginBottom: 16,
                  textTransform: "uppercase",
                }}
              >
                Quick Reminders
              </div>
              <div
                className="tips-quick"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))",
                  gap: 10,
                }}
              >
                {QUICK_TIPS.map((t, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      background: "var(--surface2)",
                      borderRadius: 10,
                      padding: "10px 14px",
                    }}
                  >
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        background: "rgba(127,255,0,.1)",
                        border: "1px solid rgba(127,255,0,.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "'JetBrains Mono',monospace",
                        fontSize: 9,
                        color: "var(--lime)",
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    >
                      {i + 1}
                    </div>
                    <p
                      style={{
                        fontSize: 13,
                        color: "var(--muted)",
                        lineHeight: 1.6,
                      }}
                    >
                      {t}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      {showModal &&
        selRole &&
        (() => {
          const r = ROLE_META[selRole];
          const cr = toRgb(r.color);
          const ss = sessionHistory.filter((s) => s.role === selRole);
          const roleAvg =
            ss.length > 0
              ? Math.round(ss.reduce((a, s) => a + s.avgScore, 0) / ss.length)
              : null;
          return (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(2,4,8,.85)",
                backdropFilter: "blur(10px)",
                zIndex: 100,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 16,
                animation: "fadeIn .2s ease both",
              }}
              onClick={(e) => {
                if (e.target === e.currentTarget) setShowModal(false);
              }}
            >
              <div
                className="modal-box"
                style={{
                  background: "var(--surface)",
                  border: `1px solid rgba(${cr},.35)`,
                  borderRadius: 24,
                  padding: 28,
                  maxWidth: 480,
                  width: "100%",
                  position: "relative",
                  animation: "fadeUp .3s ease both",
                  boxShadow: `0 24px 80px rgba(${cr},.15)`,
                  maxHeight: "90vh",
                  overflowY: "auto",
                }}
              >
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    position: "absolute",
                    top: 14,
                    right: 14,
                    background: "var(--surface2)",
                    border: "1px solid var(--border2)",
                    borderRadius: 8,
                    width: 32,
                    height: 32,
                    cursor: "pointer",
                    color: "var(--muted)",
                    fontSize: 15,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ✕
                </button>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    marginBottom: 18,
                  }}
                >
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 16,
                      background: `rgba(${cr},.12)`,
                      border: `1px solid rgba(${cr},.3)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 24,
                    }}
                  >
                    {r.icon}
                  </div>
                  <div>
                    <div
                      style={{ fontWeight: 800, fontSize: 20, marginBottom: 4 }}
                    >
                      {r.label}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono',monospace",
                          fontSize: 9,
                          color: r.color,
                          background: `rgba(${cr},.1)`,
                          border: `1px solid rgba(${cr},.2)`,
                          borderRadius: 4,
                          padding: "2px 7px",
                        }}
                      >
                        {r.level}
                      </span>
                      {roleAvg !== null && (
                        <span
                          style={{
                            fontFamily: "'JetBrains Mono',monospace",
                            fontSize: 9,
                            color: scoreColor(roleAvg),
                            background: "var(--surface2)",
                            borderRadius: 4,
                            padding: "2px 7px",
                          }}
                        >
                          Your avg: {roleAvg}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    marginBottom: 18,
                  }}
                >
                  {r.skills.map((s) => (
                    <span
                      key={s}
                      style={{
                        fontFamily: "'JetBrains Mono',monospace",
                        fontSize: 10,
                        color: r.color,
                        background: `rgba(${cr},.08)`,
                        border: `1px solid rgba(${cr},.2)`,
                        borderRadius: 6,
                        padding: "4px 10px",
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>

                <div style={{ marginBottom: 18 }}>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 9,
                      color: "var(--muted)",
                      letterSpacing: 2,
                      marginBottom: 10,
                      textTransform: "uppercase",
                    }}
                  >
                    Select Difficulty
                  </div>
                  <div
                    className="modal-diff"
                    style={{ display: "flex", gap: 8 }}
                  >
                    {["Junior", "Mid-Level", "Senior"].map((d) => (
                      <button
                        key={d}
                        onClick={() => setSelDiff(d)}
                        style={{
                          flex: 1,
                          background:
                            selDiff === d
                              ? `rgba(${cr},.1)`
                              : "var(--surface2)",
                          border: `1.5px solid ${
                            selDiff === d ? r.color : "var(--border2)"
                          }`,
                          borderRadius: 10,
                          padding: "10px 6px",
                          cursor: "pointer",
                          transition: "all .2s",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 12,
                            color: selDiff === d ? r.color : "var(--muted)",
                            marginBottom: 2,
                          }}
                        >
                          {d}
                        </div>
                        <div
                          style={{
                            fontFamily: "'JetBrains Mono',monospace",
                            fontSize: 8,
                            color: "var(--dim)",
                          }}
                        >
                          {DIFFICULTY_INFO[d].desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    background: "var(--surface2)",
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 18,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 9,
                      color: "var(--muted)",
                      letterSpacing: 2,
                      marginBottom: 8,
                      textTransform: "uppercase",
                    }}
                  >
                    What to expect
                  </div>
                  {[
                    ["5 questions", "AI-generated for your role & difficulty"],
                    ["2 min each", "Timer with hint per question"],
                    ["AI scoring", "Detailed feedback on every answer"],
                    ["Voice option", "Speak or type your answers"],
                  ].map(([t, d]) => (
                    <div
                      key={t}
                      style={{
                        display: "flex",
                        gap: 10,
                        marginBottom: 6,
                        alignItems: "flex-start",
                      }}
                    >
                      <span
                        style={{
                          color: "var(--lime)",
                          fontSize: 11,
                          marginTop: 1,
                        }}
                      >
                        ✓
                      </span>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: 12 }}>
                          {t}
                        </span>
                        <span style={{ fontSize: 12, color: "var(--muted)" }}>
                          {" "}
                          — {d}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={() => setShowModal(false)}
                    style={{
                      flex: 1,
                      background: "transparent",
                      border: "1px solid var(--border2)",
                      borderRadius: 12,
                      padding: "13px",
                      color: "var(--muted)",
                      fontFamily: "'Outfit',sans-serif",
                      fontSize: 14,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={startNow}
                    style={{
                      flex: 2,
                      background: `linear-gradient(135deg,${r.color},${r.color}99)`,
                      border: "none",
                      borderRadius: 12,
                      padding: "13px",
                      color: "#020408",
                      fontFamily: "'Outfit',sans-serif",
                      fontWeight: 700,
                      fontSize: 15,
                      cursor: "pointer",
                      boxShadow: `0 4px 24px rgba(${cr},.3)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{r.icon}</span> Start
                    Interview →
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
}
