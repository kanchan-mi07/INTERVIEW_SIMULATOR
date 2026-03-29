import { useState } from "react";

const G = `@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap');`;
const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#020408;--surface:#080d14;--surface2:#0d1520;
  --border:#0f1e2e;--border2:#162435;--border3:#1e3248;
  --cyan:#00C8FF;--lime:#7FFF00;--orange:#FF6030;--purple:#A855F7;
  --gold:#FFD700;--text:#e2eaf4;--muted:#8aa8c0;--dim:#2a4560;--red:#ff4444;
}
body{background:var(--bg);color:var(--text);font-family:'Outfit',sans-serif;overflow-x:hidden}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:var(--border3)}
@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
.fu{animation:fadeUp .45s ease both}

@media(max-width:700px){
  .roles-grid{grid-template-columns:1fr 1fr!important}
  .nav-search{display:none!important}
  .modal-diff{flex-direction:column!important}
  .modal-actions{flex-direction:column!important}
}
@media(max-width:440px){
  .roles-grid{grid-template-columns:1fr!important}
  .modal-pad{padding:20px 16px!important}
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

const DIFFICULTY_INFO = {
  Junior: { color: "var(--lime)", desc: "0–2 years" },
  "Mid-Level": { color: "var(--cyan)", desc: "2–5 years" },
  Senior: { color: "var(--orange)", desc: "5+ years" },
};

export default function RolesPage({ sessionHistory = [], onBack, onStart }) {
  const [hov, setHov] = useState(null);
  const [search, setSearch] = useState("");
  const [selRole, setSelRole] = useState(null);
  const [selDiff, setSelDiff] = useState("Mid-Level");
  const [showModal, setShowModal] = useState(false);

  const filtered = Object.entries(ROLE_META).filter(
    ([id, r]) =>
      r.label.toLowerCase().includes(search.toLowerCase()) ||
      r.skills.some((s) => s.toLowerCase().includes(search.toLowerCase()))
  );

  const openModal = (id) => {
    setSelRole(id);
    setShowModal(true);
  };
  const startNow = () => {
    setShowModal(false);
    onStart(selRole);
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

      {/* Navbar */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          height: 66,
          background: "rgba(2,4,8,.93)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--border2)",
          position: "sticky",
          top: 0,
          zIndex: 50,
          gap: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexShrink: 0,
          }}
        >
          <button
            onClick={onBack}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border2)",
              borderRadius: 9,
              padding: "8px 14px",
              cursor: "pointer",
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 12,
              color: "var(--muted)",
              whiteSpace: "nowrap",
            }}
          >
            ← Dashboard
          </button>
          <span
            style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 12,
              color: "var(--muted)",
              display: "none",
            }}
          >
            / Roles
          </span>
        </div>
        <div
          className="nav-search"
          style={{ position: "relative", flex: "0 0 220px" }}
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search roles…"
            style={{
              width: "100%",
              background: "var(--surface)",
              border: "1px solid var(--border2)",
              borderRadius: 10,
              padding: "9px 14px 9px 36px",
              fontFamily: "'Outfit',sans-serif",
              fontSize: 14,
              color: "var(--text)",
              outline: "none",
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
      </nav>

      <div
        style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 16px 80px" }}
      >
        {/* Heading */}
        <div className="fu" style={{ marginBottom: 28 }}>
          <h1
            style={{
              fontWeight: 900,
              fontSize: "clamp(22px,4vw,40px)",
              marginBottom: 10,
            }}
          >
            Choose Your{" "}
            <span
              style={{
                background: "linear-gradient(135deg,#00C8FF,#A855F7)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Interview Role
            </span>
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 15, lineHeight: 1.7 }}>
            Select a role to start a practice session. Each interview has 5
            AI-generated questions.
          </p>
        </div>

        {/* Mobile search */}
        <div
          style={{ display: "none", marginBottom: 18 }}
          className="mobile-search"
        >
          <div style={{ position: "relative" }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search roles or skills…"
              style={{
                width: "100%",
                background: "var(--surface)",
                border: "1px solid var(--border2)",
                borderRadius: 10,
                padding: "10px 14px 10px 36px",
                fontFamily: "'Outfit',sans-serif",
                fontSize: 14,
                color: "var(--text)",
                outline: "none",
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
            gridTemplateColumns: "repeat(auto-fill,minmax(270px,1fr))",
            gap: 14,
          }}
        >
          {filtered.map(([id, r], i) => {
            const isH = hov === id;
            const ss = sessionHistory.filter((s) => s.role === id);
            const roleAvg =
              ss.length > 0
                ? Math.round(ss.reduce((a, s) => a + s.avgScore, 0) / ss.length)
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
                  borderRadius: 20,
                  padding: "22px 20px",
                  cursor: "pointer",
                  transition: "all .25s",
                  transform: isH ? "translateY(-4px)" : "translateY(0)",
                  boxShadow: isH ? `0 14px 44px rgba(${cr},.2)` : "none",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={() => setHov(id)}
                onMouseLeave={() => setHov(null)}
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
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 15,
                      background: `rgba(${cr},.12)`,
                      border: `1px solid rgba(${cr},.25)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 26,
                    }}
                  >
                    {r.icon}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: 5,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono',monospace",
                        fontSize: 9,
                        color: r.color,
                        background: `rgba(${cr},.1)`,
                        border: `1px solid rgba(${cr},.2)`,
                        borderRadius: 4,
                        padding: "2px 8px",
                        letterSpacing: 1,
                      }}
                    >
                      {r.level}
                    </span>
                    {roleAvg !== null && (
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono',monospace",
                          fontSize: 10,
                          color: scoreColor(roleAvg),
                          background: "var(--surface2)",
                          borderRadius: 4,
                          padding: "2px 8px",
                        }}
                      >
                        avg {roleAvg}% — {scoreLabel(roleAvg)}
                      </span>
                    )}
                  </div>
                </div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 18,
                    color: isH ? r.color : "var(--text)",
                    marginBottom: 9,
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
                    marginBottom: 14,
                  }}
                >
                  {r.skills.map((s) => (
                    <span
                      key={s}
                      style={{
                        fontFamily: "'JetBrains Mono',monospace",
                        fontSize: 10,
                        color: isH ? r.color : "var(--muted)",
                        background: isH ? `rgba(${cr},.08)` : "var(--surface2)",
                        border: `1px solid ${
                          isH ? `rgba(${cr},.2)` : "var(--border)"
                        }`,
                        borderRadius: 4,
                        padding: "2px 8px",
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
                      fontSize: 11,
                      color: "var(--muted)",
                    }}
                  >
                    {ss.length > 0
                      ? `${ss.length} session${ss.length !== 1 ? "s" : ""} done`
                      : "Not practiced yet"}
                  </span>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 12,
                      color: isH ? r.color : "var(--dim)",
                      fontWeight: isH ? 700 : 400,
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
      </div>

      {/* Modal */}
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
                background: "rgba(2,4,8,.88)",
                backdropFilter: "blur(12px)",
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
                className="modal-pad"
                style={{
                  background: "var(--surface)",
                  border: `1px solid rgba(${cr},.4)`,
                  borderRadius: 24,
                  padding: 28,
                  maxWidth: 480,
                  width: "100%",
                  position: "relative",
                  animation: "fadeUp .3s ease both",
                  boxShadow: `0 24px 70px rgba(${cr},.18)`,
                  maxHeight: "92vh",
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
                    width: 34,
                    height: 34,
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
                    marginBottom: 20,
                  }}
                >
                  <div
                    style={{
                      width: 54,
                      height: 54,
                      borderRadius: 16,
                      background: `rgba(${cr},.12)`,
                      border: `1px solid rgba(${cr},.3)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 26,
                      flexShrink: 0,
                    }}
                  >
                    {r.icon}
                  </div>
                  <div>
                    <div
                      style={{ fontWeight: 800, fontSize: 20, marginBottom: 5 }}
                    >
                      {r.label}
                    </div>
                    <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono',monospace",
                          fontSize: 10,
                          color: r.color,
                          background: `rgba(${cr},.1)`,
                          border: `1px solid rgba(${cr},.2)`,
                          borderRadius: 5,
                          padding: "2px 8px",
                        }}
                      >
                        {r.level}
                      </span>
                      {roleAvg !== null && (
                        <span
                          style={{
                            fontFamily: "'JetBrains Mono',monospace",
                            fontSize: 10,
                            color: scoreColor(roleAvg),
                            background: "var(--surface2)",
                            borderRadius: 5,
                            padding: "2px 8px",
                          }}
                        >
                          avg: {roleAvg}% — {scoreLabel(roleAvg)}
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
                    marginBottom: 20,
                  }}
                >
                  {r.skills.map((s) => (
                    <span
                      key={s}
                      style={{
                        fontFamily: "'JetBrains Mono',monospace",
                        fontSize: 11,
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
                <div style={{ marginBottom: 20 }}>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 10,
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
                          borderRadius: 11,
                          padding: "11px 6px",
                          cursor: "pointer",
                          transition: "all .2s",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 13,
                            color: selDiff === d ? r.color : "var(--muted)",
                            marginBottom: 2,
                          }}
                        >
                          {d}
                        </div>
                        <div
                          style={{
                            fontFamily: "'JetBrains Mono',monospace",
                            fontSize: 9,
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
                    padding: 16,
                    marginBottom: 20,
                  }}
                >
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
                        marginBottom: 7,
                        alignItems: "flex-start",
                      }}
                    >
                      <span
                        style={{
                          color: "var(--lime)",
                          fontSize: 13,
                          marginTop: 1,
                        }}
                      >
                        ✓
                      </span>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>
                          {t}
                        </span>
                        <span style={{ fontSize: 13, color: "var(--muted)" }}>
                          {" "}
                          — {d}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div
                  className="modal-actions"
                  style={{ display: "flex", gap: 10 }}
                >
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
                      fontWeight: 800,
                      fontSize: 15,
                      cursor: "pointer",
                      boxShadow: `0 6px 24px rgba(${cr},.3)`,
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
