import { useState } from "react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const G = `@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');`;
const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#020408;--surface:#080d14;--surface2:#0d1520;
  --border:#0f1e2e;--border2:#162435;
  --cyan:#00C8FF;--lime:#7FFF00;--orange:#FF6030;--purple:#A855F7;
  --text:#e2eaf4;--muted:#3a5570;--dim:#1a2d3f;--red:#ff4444;
}
body{background:var(--bg);color:var(--text);font-family:'Outfit',sans-serif}
::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:var(--dim)}
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:1;transform:scale(1.06)}}
.fu{animation:fadeUp .5s ease both}
`;

// ── Helpers ──────────────────────────────────────────────────────────────────
const scoreColor = (s) =>
  s >= 80
    ? "var(--lime)"
    : s >= 65
    ? "var(--cyan)"
    : s >= 50
    ? "var(--orange)"
    : "var(--red)";

// ── Score ring ───────────────────────────────────────────────────────────────
function Ring({ value, label, color, size = 72 }) {
  const r = size / 2 - 6;
  const c = 2 * Math.PI * r;
  const d = (value / 100) * c;
  return (
    <div style={{ textAlign: "center" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--surface2)"
          strokeWidth={5}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={5}
          strokeDasharray={`${d} ${c}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease" }}
        />
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            transform: `rotate(90deg) translate(0,-${size}px)`,
            fill: color,
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: size * 0.2,
            fontWeight: 700,
          }}
        >
          {value}
        </text>
      </svg>
      <div
        style={{
          fontFamily: "'JetBrains Mono',monospace",
          fontSize: 9,
          color: "var(--muted)",
          letterSpacing: 1.5,
          marginTop: 5,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
    </div>
  );
}

// ── Chart tooltip ─────────────────────────────────────────────────────────────
function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--surface2)",
        border: "1px solid var(--border2)",
        borderRadius: 10,
        padding: "10px 14px",
        fontFamily: "'JetBrains Mono',monospace",
        fontSize: 11,
      }}
    >
      <div style={{ color: "var(--muted)", marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || p.stroke, marginBottom: 2 }}>
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  );
}

// ── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({ children, accent = "var(--cyan)" }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 18,
      }}
    >
      <div
        style={{ width: 3, height: 16, background: accent, borderRadius: 2 }}
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
        {children}
      </span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ResultsPage({
  session = [],
  role = "frontend",
  onHome,
  onRetry,
  onProgress,
}) {
  const [tab, setTab] = useState("overview");
  const [exp, setExp] = useState(null);

  // Empty state
  if (!session || session.length === 0)
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Outfit',sans-serif",
        }}
      >
        <style>{G + CSS}</style>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "var(--muted)", marginBottom: 16 }}>
            No session data found.
          </p>
          <button
            onClick={onHome}
            style={{
              background: "var(--cyan)",
              border: "none",
              borderRadius: 10,
              padding: "12px 24px",
              color: "#020408",
              fontFamily: "'Outfit',sans-serif",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );

  // ── Computed stats from real session data ────────────────────────────────
  const scores = session.map((s) => s.feedback.score);
  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const avgConf = Math.round(
    session.reduce((a, s) => a + s.feedback.confidence, 0) / session.length
  );
  const avgClar = Math.round(
    session.reduce((a, s) => a + s.feedback.clarity, 0) / session.length
  );
  const avgDep = Math.round(
    session.reduce((a, s) => a + s.feedback.technicalDepth, 0) / session.length
  );
  const totalFill = session.reduce(
    (a, s) => a + (s.metrics?.fillerCount || 0),
    0
  );

  const overall =
    avg >= 85
      ? "Outstanding"
      : avg >= 75
      ? "Strong"
      : avg >= 65
      ? "Competent"
      : avg >= 50
      ? "Developing"
      : "Needs Work";
  const overallCol =
    avg >= 85
      ? "var(--lime)"
      : avg >= 75
      ? "var(--cyan)"
      : avg >= 65
      ? "var(--orange)"
      : "var(--red)";

  const radarData = [
    { skill: "Confidence", val: avgConf },
    { skill: "Clarity", val: avgClar },
    { skill: "Tech Depth", val: avgDep },
    { skill: "Score", val: avg },
    { skill: "Fluency", val: Math.max(20, 100 - totalFill * 12) },
  ];

  const TABS = ["overview", "questions", "voice", "tips"];

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

      {/* ── Header ── */}
      <div
        style={{
          background:
            "linear-gradient(180deg,rgba(0,200,255,.06) 0%,transparent 100%)",
          padding: "44px 24px 32px",
          textAlign: "center",
          borderBottom: "1px solid var(--border2)",
        }}
      >
        <div
          style={{
            fontSize: 52,
            marginBottom: 12,
            animation: "pulse 2.5s ease-in-out infinite",
          }}
        >
          🏁
        </div>
        <h1
          className="fu"
          style={{
            fontWeight: 800,
            fontSize: "clamp(22px,4vw,34px)",
            marginBottom: 6,
          }}
        >
          Interview Complete!
        </h1>
        <p
          style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 12,
            color: "var(--muted)",
          }}
        >
          {session.length} Questions Answered
        </p>

        {/* Summary scores */}
        <div
          style={{
            display: "inline-flex",
            gap: 22,
            marginTop: 26,
            background: "var(--surface)",
            border: "1px solid var(--border2)",
            borderRadius: 22,
            padding: "20px 30px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <Ring value={avg} label="Overall" color={overallCol} size={100} />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              justifyContent: "center",
              textAlign: "left",
            }}
          >
            <div>
              <div style={{ fontWeight: 800, fontSize: 22, color: overallCol }}>
                {overall}
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 10,
                  color: "var(--muted)",
                }}
              >
                Performance Rating
              </div>
            </div>
            <div style={{ display: "flex", gap: 14 }}>
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 16,
                    color: "var(--lime)",
                  }}
                >
                  {Math.max(...scores)}
                </div>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 9,
                    color: "var(--dim)",
                  }}
                >
                  Best Q
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 16,
                    color: "var(--orange)",
                  }}
                >
                  {Math.min(...scores)}
                </div>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 9,
                    color: "var(--dim)",
                  }}
                >
                  Lowest
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 16,
                    color: "var(--cyan)",
                  }}
                >
                  {avgConf}%
                </div>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 9,
                    color: "var(--dim)",
                  }}
                >
                  Confidence
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 880, margin: "0 auto", padding: "0 20px 60px" }}>
        {/* ── Tabs ── */}
        <div
          style={{
            display: "flex",
            gap: 4,
            margin: "24px 0",
            background: "var(--surface)",
            border: "1px solid var(--border2)",
            borderRadius: 12,
            padding: 4,
          }}
        >
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: 9,
                border: "none",
                cursor: "pointer",
                background: tab === t ? "var(--surface2)" : "transparent",
                color: tab === t ? "var(--cyan)" : "var(--muted)",
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 10,
                letterSpacing: 1,
                textTransform: "uppercase",
                transition: "all .2s",
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ══ OVERVIEW TAB ══ */}
        {tab === "overview" && (
          <div>
            {/* Charts row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
                gap: 16,
                marginBottom: 20,
              }}
            >
              {/* Radar chart */}
              <div
                className="fu"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border2)",
                  borderRadius: 18,
                  padding: "22px 16px",
                }}
              >
                <SectionLabel>Skill Radar</SectionLabel>
                <ResponsiveContainer width="100%" height={230}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="var(--border2)" />
                    <PolarAngleAxis
                      dataKey="skill"
                      tick={{
                        fontFamily: "'JetBrains Mono',monospace",
                        fontSize: 9,
                        fill: "var(--muted)",
                      }}
                    />
                    <Radar
                      name="You"
                      dataKey="val"
                      stroke="var(--cyan)"
                      fill="var(--cyan)"
                      fillOpacity={0.12}
                      strokeWidth={2}
                    />
                    <Tooltip content={<ChartTip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Bar chart */}
              <div
                className="fu"
                style={{
                  animationDelay: ".07s",
                  background: "var(--surface)",
                  border: "1px solid var(--border2)",
                  borderRadius: 18,
                  padding: "22px 16px",
                }}
              >
                <SectionLabel accent="var(--orange)">
                  Score Per Question
                </SectionLabel>
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart
                    data={session.map((s, i) => ({
                      name: `Q${i + 1}`,
                      score: s.feedback.score,
                      conf: s.feedback.confidence,
                    }))}
                  >
                    <CartesianGrid
                      stroke="var(--border)"
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{
                        fontFamily: "'JetBrains Mono',monospace",
                        fontSize: 9,
                        fill: "var(--muted)",
                      }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{
                        fontFamily: "'JetBrains Mono',monospace",
                        fontSize: 9,
                        fill: "var(--muted)",
                      }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<ChartTip />} />
                    <Bar
                      dataKey="score"
                      name="Score"
                      fill="var(--cyan)"
                      fillOpacity={0.85}
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="conf"
                      name="Confidence"
                      fill="var(--purple)"
                      fillOpacity={0.65}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Metric cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))",
                gap: 10,
              }}
            >
              {[
                { l: "Avg Score", v: avg, c: overallCol, i: "🎯" },
                {
                  l: "Confidence",
                  v: `${avgConf}%`,
                  c: "var(--purple)",
                  i: "💪",
                },
                { l: "Clarity", v: `${avgClar}%`, c: "var(--lime)", i: "💬" },
                { l: "Tech Depth", v: `${avgDep}%`, c: "var(--cyan)", i: "🧠" },
                {
                  l: "Filler Words",
                  v: totalFill,
                  c: totalFill < 5 ? "var(--lime)" : "var(--orange)",
                  i: "🗣",
                },
                {
                  l: "Best Score",
                  v: Math.max(...scores),
                  c: "var(--lime)",
                  i: "🏆",
                },
              ].map((m, i) => (
                <div
                  key={m.l}
                  className="fu"
                  style={{
                    animationDelay: `${i * 0.05}s`,
                    background: "var(--surface)",
                    border: "1px solid var(--border2)",
                    borderRadius: 14,
                    padding: 14,
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 20, marginBottom: 5 }}>{m.i}</div>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: 20,
                      color: m.c,
                      fontFamily: "'JetBrains Mono',monospace",
                    }}
                  >
                    {m.v}
                  </div>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 9,
                      color: "var(--muted)",
                      letterSpacing: 1,
                      marginTop: 3,
                    }}
                  >
                    {m.l}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ QUESTIONS TAB ══ */}
        {tab === "questions" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {session.map((s, i) => (
              <div
                key={i}
                className="fu"
                style={{
                  animationDelay: `${i * 0.05}s`,
                  background: "var(--surface)",
                  border: "1px solid var(--border2)",
                  borderRadius: 16,
                }}
              >
                {/* Accordion header */}
                <button
                  onClick={() => setExp(exp === i ? null : i)}
                  style={{
                    width: "100%",
                    background: "none",
                    border: "none",
                    padding: "15px 18px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    color: "var(--text)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      textAlign: "left",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono',monospace",
                        fontWeight: 700,
                        fontSize: 22,
                        color: scoreColor(s.feedback.score),
                        minWidth: 46,
                      }}
                    >
                      {s.feedback.score}
                    </div>
                    <div>
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono',monospace",
                          fontSize: 9,
                          color: "var(--cyan)",
                          letterSpacing: 1,
                          marginBottom: 3,
                        }}
                      >
                        {s.question?.category || "General"}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          lineHeight: 1.4,
                          maxWidth: 480,
                          textAlign: "left",
                        }}
                      >
                        {s.question?.question}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono',monospace",
                        fontSize: 12,
                        color:
                          s.feedback.grade === "A"
                            ? "var(--lime)"
                            : "var(--cyan)",
                      }}
                    >
                      {s.feedback.grade}
                    </span>
                    <span style={{ color: "var(--muted)", fontSize: 14 }}>
                      {exp === i ? "▲" : "▼"}
                    </span>
                  </div>
                </button>

                {/* Expanded content */}
                {exp === i && (
                  <div style={{ padding: "0 18px 18px" }}>
                    {/* Mini rings */}
                    <div
                      style={{
                        display: "flex",
                        gap: 14,
                        marginBottom: 14,
                        flexWrap: "wrap",
                      }}
                    >
                      <Ring
                        value={s.feedback.confidence}
                        label="Confidence"
                        color="var(--purple)"
                        size={66}
                      />
                      <Ring
                        value={s.feedback.clarity}
                        label="Clarity"
                        color="var(--lime)"
                        size={66}
                      />
                      <Ring
                        value={s.feedback.technicalDepth}
                        label="Depth"
                        color="var(--orange)"
                        size={66}
                      />
                    </div>

                    {/* Answer */}
                    <div
                      style={{
                        background: "var(--surface2)",
                        borderRadius: 10,
                        padding: 13,
                        fontSize: 12,
                        color: "var(--muted)",
                        lineHeight: 1.7,
                        marginBottom: 12,
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono',monospace",
                          fontSize: 9,
                          color: "var(--dim)",
                          marginBottom: 5,
                          letterSpacing: 1,
                        }}
                      >
                        YOUR ANSWER
                      </div>
                      {s.answer}
                    </div>

                    {/* Strengths / Improvements */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 8,
                        marginBottom: 10,
                      }}
                    >
                      <div
                        style={{
                          background: "rgba(127,255,0,.05)",
                          border: "1px solid rgba(127,255,0,.15)",
                          borderRadius: 10,
                          padding: 12,
                        }}
                      >
                        <div
                          style={{
                            fontFamily: "'JetBrains Mono',monospace",
                            fontSize: 9,
                            color: "var(--lime)",
                            marginBottom: 7,
                            letterSpacing: 1,
                          }}
                        >
                          ✅ STRENGTHS
                        </div>
                        {s.feedback.strengths?.map((t, j) => (
                          <div
                            key={j}
                            style={{
                              fontSize: 11,
                              color: "var(--muted)",
                              marginBottom: 4,
                              lineHeight: 1.5,
                            }}
                          >
                            • {t}
                          </div>
                        ))}
                      </div>
                      <div
                        style={{
                          background: "rgba(255,96,48,.05)",
                          border: "1px solid rgba(255,96,48,.15)",
                          borderRadius: 10,
                          padding: 12,
                        }}
                      >
                        <div
                          style={{
                            fontFamily: "'JetBrains Mono',monospace",
                            fontSize: 9,
                            color: "var(--orange)",
                            marginBottom: 7,
                            letterSpacing: 1,
                          }}
                        >
                          📈 IMPROVE
                        </div>
                        {s.feedback.improvements?.map((t, j) => (
                          <div
                            key={j}
                            style={{
                              fontSize: 11,
                              color: "var(--muted)",
                              marginBottom: 4,
                              lineHeight: 1.5,
                            }}
                          >
                            • {t}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Verdict */}
                    <p
                      style={{
                        fontFamily: "'JetBrains Mono',monospace",
                        fontSize: 10,
                        color: "var(--muted)",
                        fontStyle: "italic",
                        borderLeft: "2px solid var(--border2)",
                        paddingLeft: 10,
                      }}
                    >
                      "{s.feedback.verdict}"
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ══ VOICE TAB ══ */}
        {tab === "voice" && (
          <div>
            {/* Confidence line chart */}
            <div
              className="fu"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border2)",
                borderRadius: 18,
                padding: "22px 16px",
                marginBottom: 18,
              }}
            >
              <SectionLabel accent="var(--purple)">
                Confidence Per Question
              </SectionLabel>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart
                  data={session.map((s, i) => ({
                    q: `Q${i + 1}`,
                    conf: s.feedback.confidence,
                    score: s.feedback.score,
                  }))}
                >
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="q"
                    tick={{
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 9,
                      fill: "var(--muted)",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 9,
                      fill: "var(--muted)",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTip />} />
                  <Line
                    type="monotone"
                    dataKey="conf"
                    name="Confidence"
                    stroke="var(--purple)"
                    strokeWidth={2.5}
                    dot={{ fill: "var(--purple)", r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    name="Score"
                    stroke="var(--cyan)"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: "var(--cyan)", r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Per-question voice breakdown */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {session.map((s, i) => (
                <div
                  key={i}
                  className="fu"
                  style={{
                    animationDelay: `${i * 0.05}s`,
                    background: "var(--surface)",
                    border: "1px solid var(--border2)",
                    borderRadius: 14,
                    padding: "13px 18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 11,
                      color: "var(--muted)",
                      minWidth: 28,
                    }}
                  >
                    Q{i + 1}
                  </div>
                  <div
                    style={{
                      flex: 1,
                      fontSize: 12,
                      color: "var(--text)",
                      maxWidth: 260,
                    }}
                  >
                    {s.question?.question?.slice(0, 55)}…
                  </div>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {[
                      {
                        l: "Confidence",
                        v: `${s.feedback.confidence}%`,
                        c: "var(--purple)",
                      },
                      {
                        l: "Words",
                        v: s.metrics?.wordCount || "—",
                        c: "var(--cyan)",
                      },
                      {
                        l: "Fillers",
                        v: s.metrics?.fillerCount ?? 0,
                        c:
                          (s.metrics?.fillerCount || 0) <= 1
                            ? "var(--lime)"
                            : "var(--red)",
                      },
                    ].map((m) => (
                      <div
                        key={m.l}
                        style={{ textAlign: "center", minWidth: 50 }}
                      >
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 14,
                            color: m.c,
                            fontFamily: "'JetBrains Mono',monospace",
                          }}
                        >
                          {m.v}
                        </div>
                        <div
                          style={{
                            fontFamily: "'JetBrains Mono',monospace",
                            fontSize: 8,
                            color: "var(--dim)",
                            letterSpacing: 1,
                          }}
                        >
                          {m.l}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ TIPS TAB ══ */}
        {tab === "tips" && (
          <div>
            {/* AI coach summary */}
            <div
              className="fu"
              style={{
                background:
                  "linear-gradient(135deg,rgba(0,200,255,.08),rgba(168,85,247,.08))",
                border: "1px solid rgba(0,200,255,.2)",
                borderRadius: 18,
                padding: 22,
                marginBottom: 22,
              }}
            >
              <div
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 10,
                  color: "var(--cyan)",
                  letterSpacing: 2,
                  marginBottom: 8,
                }}
              >
                AI COACH SUMMARY
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.8 }}>
                Your communication is a strength — average clarity of {avgClar}
                %. Focus on reducing filler words (total: {totalFill}) and
                adding concrete technical examples. Your {avgConf}% confidence
                score shows solid knowledge; work on delivery and depth.
              </p>
            </div>

            {/* Action cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
                gap: 12,
              }}
            >
              {[
                {
                  i: "🔁",
                  t: "Retry This Role",
                  d: "Target 85+ on all questions",
                  c: "var(--cyan)",
                  a: onRetry,
                },
                {
                  i: "📊",
                  t: "View Progress",
                  d: "Track your improvement over time",
                  c: "var(--purple)",
                  a: onProgress,
                },
                {
                  i: "🏠",
                  t: "Back to Dashboard",
                  d: "Try a different role to practise",
                  c: "var(--orange)",
                  a: onHome,
                },
              ].map((r, i) => (
                <button
                  key={i}
                  onClick={r.a}
                  className="fu"
                  style={{
                    animationDelay: `${i * 0.06}s`,
                    background: "var(--surface)",
                    border: `1px solid ${r.c}20`,
                    borderRadius: 14,
                    padding: 18,
                    cursor: "pointer",
                    textAlign: "left",
                    color: "var(--text)",
                    transition: "all .2s",
                  }}
                >
                  <div style={{ fontSize: 28, marginBottom: 10 }}>{r.i}</div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 13,
                      color: r.c,
                      marginBottom: 5,
                    }}
                  >
                    {r.t}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--muted)",
                      lineHeight: 1.5,
                    }}
                  >
                    {r.d}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Bottom action buttons ── */}
        <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
          <button
            onClick={onHome}
            style={{
              flex: 1,
              background: "transparent",
              border: "1px solid var(--border2)",
              borderRadius: 12,
              padding: "14px",
              color: "var(--muted)",
              fontFamily: "'Outfit',sans-serif",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            ← Dashboard
          </button>
          <button
            onClick={onRetry}
            style={{
              flex: 2,
              background: "linear-gradient(135deg,var(--cyan),#0066ff)",
              border: "none",
              borderRadius: 12,
              padding: "14px",
              color: "#020408",
              fontFamily: "'Outfit',sans-serif",
              fontWeight: 700,
              fontSize: 15,
              cursor: "pointer",
              boxShadow: "0 4px 24px rgba(0,200,255,.3)",
            }}
          >
            Retry Interview 🔄
          </button>
        </div>
      </div>
    </div>
  );
}
