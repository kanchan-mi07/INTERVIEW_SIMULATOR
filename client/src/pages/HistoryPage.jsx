import { useState } from "react";

const G = `@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');`;
const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#020408;--surface:#080d14;--surface2:#0d1520;
  --border:#0f1e2e;--border2:#162435;--border3:#1e3248;
  --cyan:#00C8FF;--lime:#7FFF00;--orange:#FF6030;--purple:#A855F7;
  --gold:#FFD700;--text:#e2eaf4;--muted:#8aa8c0;--dim:#2a4560;--red:#ff4444;
}
body{background:var(--bg);color:var(--text);font-family:'Outfit',sans-serif}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:var(--border3)}
@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
.fu{animation:fadeUp .45s ease both}
@media(max-width:600px){
  .hist-row{flex-wrap:wrap!important}
  .hist-actions{width:100%!important;justify-content:flex-end!important}
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
const scoreLabel = (s) =>
  s >= 85
    ? "Excellent"
    : s >= 70
    ? "Strong"
    : s >= 55
    ? "Good"
    : s >= 40
    ? "Fair"
    : "Needs Work";
const fmtDate = (ts) =>
  new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const fmtTime = (ts) =>
  new Date(ts).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

const ROLE_META = {
  frontend: { label: "Frontend Dev", icon: "⚡", color: "#00C8FF" },
  backend: { label: "Backend Dev", icon: "🔩", color: "#FF6030" },
  fullstack: { label: "Full-Stack", icon: "🚀", color: "#A855F7" },
  hr: { label: "HR & Culture", icon: "🤝", color: "#7FFF00" },
  devops: { label: "DevOps / SRE", icon: "⚙️", color: "#FFD700" },
  data: { label: "Data Engineer", icon: "📊", color: "#FF69B4" },
};

export default function HistoryPage({ sessionHistory = [], onBack, onStart }) {
  const [filter, setFilter] = useState("all");
  const total = sessionHistory.length;

  const filtered = [...sessionHistory]
    .reverse()
    .filter((s) => filter === "all" || s.role === filter);
  const avgScore =
    total > 0
      ? Math.round(sessionHistory.reduce((a, s) => a + s.avgScore, 0) / total)
      : 0;
  const best =
    total > 0 ? Math.max(...sessionHistory.map((s) => s.avgScore)) : 0;

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

      {/* Navbar */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 28px",
          height: 66,
          background: "rgba(2,4,8,.93)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--border2)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button
            onClick={onBack}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border2)",
              borderRadius: 9,
              padding: "8px 16px",
              cursor: "pointer",
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 12,
              color: "var(--muted)",
            }}
          >
            ← Dashboard
          </button>
          <span
            style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 12,
              color: "var(--muted)",
            }}
          >
            / Session History
          </span>
        </div>
        <span
          style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 11,
            color: "var(--dim)",
            background: "var(--surface2)",
            border: "1px solid var(--border2)",
            borderRadius: 5,
            padding: "4px 10px",
          }}
        >
          {total} total
        </span>
      </nav>

      <div
        style={{ maxWidth: 900, margin: "0 auto", padding: "36px 24px 80px" }}
      >
        {/* Heading */}
        <div className="fu" style={{ marginBottom: 28 }}>
          <h1
            style={{
              fontWeight: 900,
              fontSize: "clamp(24px,4vw,38px)",
              marginBottom: 10,
            }}
          >
            Session <span style={{ color: "var(--orange)" }}>History</span>
          </h1>
          {total > 0 && (
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              {[
                { l: "Total Sessions", v: total, c: "var(--cyan)" },
                { l: "Average Score", v: `${avgScore}%`, c: "var(--lime)" },
                { l: "Best Score", v: best, c: "var(--gold)" },
              ].map((s) => (
                <div key={s.l}>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono',monospace",
                      fontWeight: 800,
                      fontSize: 22,
                      color: s.c,
                    }}
                  >
                    {s.v}
                  </span>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 11,
                      color: "var(--muted)",
                      marginLeft: 8,
                    }}
                  >
                    {s.l}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Role filter */}
        {total > 0 && (
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 24,
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() => setFilter("all")}
              style={{
                padding: "7px 16px",
                borderRadius: 20,
                border: `1.5px solid ${
                  filter === "all" ? "var(--cyan)" : "var(--border2)"
                }`,
                background:
                  filter === "all" ? "rgba(0,200,255,.1)" : "transparent",
                color: filter === "all" ? "var(--cyan)" : "var(--muted)",
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 11,
                cursor: "pointer",
                transition: "all .2s",
              }}
            >
              All
            </button>
            {[...new Set(sessionHistory.map((s) => s.role))].map((r) => {
              const m = ROLE_META[r];
              if (!m) return null;
              return (
                <button
                  key={r}
                  onClick={() => setFilter(r)}
                  style={{
                    padding: "7px 16px",
                    borderRadius: 20,
                    border: `1.5px solid ${
                      filter === r ? m.color : "var(--border2)"
                    }`,
                    background:
                      filter === r
                        ? `rgba(${toRgb(m.color)},.1)`
                        : "transparent",
                    color: filter === r ? m.color : "var(--muted)",
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 11,
                    cursor: "pointer",
                    transition: "all .2s",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span style={{ fontSize: 13 }}>{m.icon}</span>
                  {m.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Sessions */}
        {total === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "70px 20px",
              background: "var(--surface)",
              border: "1px solid var(--border2)",
              borderRadius: 20,
            }}
          >
            <div
              style={{
                fontSize: 52,
                marginBottom: 18,
                animation: "float 3s ease-in-out infinite",
              }}
            >
              📋
            </div>
            <h3 style={{ fontWeight: 700, fontSize: 22, marginBottom: 12 }}>
              No sessions yet
            </h3>
            <p
              style={{
                color: "var(--muted)",
                fontSize: 15,
                lineHeight: 1.75,
                marginBottom: 26,
              }}
            >
              Complete your first interview to see your history here.
            </p>
            <button
              onClick={onBack}
              style={{
                background: "linear-gradient(135deg,var(--cyan),#0066ff)",
                border: "none",
                borderRadius: 12,
                padding: "13px 26px",
                color: "#020408",
                fontFamily: "'Outfit',sans-serif",
                fontWeight: 700,
                fontSize: 15,
                cursor: "pointer",
              }}
            >
              ← Pick a Role
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map((s, i) => {
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
                    borderRadius: 18,
                    padding: "18px 22px",
                    transition: "border-color .2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor = meta.color)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor = "var(--border2)")
                  }
                >
                  <div
                    className="hist-row"
                    style={{ display: "flex", alignItems: "center", gap: 16 }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 14,
                        background: `rgba(${cr},.1)`,
                        border: `1px solid rgba(${cr},.2)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 24,
                        flexShrink: 0,
                      }}
                    >
                      {meta.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 120 }}>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          marginBottom: 5,
                          flexWrap: "wrap",
                          alignItems: "center",
                        }}
                      >
                        <span style={{ fontWeight: 700, fontSize: 16 }}>
                          {meta.label}
                        </span>
                        <span
                          style={{
                            fontFamily: "'JetBrains Mono',monospace",
                            fontSize: 10,
                            color: "var(--muted)",
                            background: "var(--surface2)",
                            border: "1px solid var(--border2)",
                            borderRadius: 10,
                            padding: "2px 9px",
                          }}
                        >
                          {s.difficulty}
                        </span>
                        {s.usedVoice && (
                          <span
                            style={{
                              fontFamily: "'JetBrains Mono',monospace",
                              fontSize: 10,
                              color: "var(--cyan)",
                              background: "rgba(0,200,255,.08)",
                              border: "1px solid rgba(0,200,255,.2)",
                              borderRadius: 10,
                              padding: "2px 9px",
                            }}
                          >
                            🎙 Voice
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono',monospace",
                          fontSize: 11,
                          color: "var(--muted)",
                        }}
                      >
                        {fmtDate(s.date)} at {fmtTime(s.date)} ·{" "}
                        {s.questionCount} questions
                      </div>
                    </div>
                    <div
                      style={{
                        textAlign: "center",
                        minWidth: 85,
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono',monospace",
                          fontWeight: 900,
                          fontSize: 30,
                          color: scoreColor(s.avgScore),
                          lineHeight: 1,
                        }}
                      >
                        {s.avgScore}
                      </div>
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono',monospace",
                          fontSize: 11,
                          color: scoreColor(s.avgScore),
                          marginTop: 3,
                          opacity: 0.85,
                        }}
                      >
                        {scoreLabel(s.avgScore)}
                      </div>
                    </div>
                    <div
                      className="hist-actions"
                      style={{ display: "flex", flexShrink: 0 }}
                    >
                      <button
                        onClick={() => onStart(s.role)}
                        style={{
                          background: `rgba(${cr},.08)`,
                          border: `1px solid rgba(${cr},.2)`,
                          borderRadius: 10,
                          padding: "10px 18px",
                          color: meta.color,
                          fontFamily: "'Outfit',sans-serif",
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: "pointer",
                        }}
                      >
                        Retry →
                      </button>
                    </div>
                  </div>
                  <div
                    style={{
                      marginTop: 12,
                      height: 5,
                      background: "var(--surface2)",
                      borderRadius: 3,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${s.avgScore}%`,
                        background: scoreColor(s.avgScore),
                        borderRadius: 3,
                        opacity: 0.65,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
