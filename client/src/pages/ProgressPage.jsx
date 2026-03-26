import { useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const G = `@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');`;
const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#020408;--surface:#080d14;--surface2:#0d1520;
  --border:#0f1e2e;--border2:#162435;
  --cyan:#00C8FF;--lime:#7FFF00;--orange:#FF6030;--purple:#A855F7;--gold:#FFD700;
  --text:#e2eaf4;--muted:#3a5570;--dim:#1a2d3f;--red:#ff4444;
}
body{background:var(--bg);color:var(--text);font-family:'Outfit',sans-serif}
::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:var(--dim)}
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
.fu{animation:fadeUp .5s ease both}
`;

// ── Helpers ──────────────────────────────────────────────────────────────────
const ROLE_META = {
  frontend: { label: "Frontend Dev", color: "#00C8FF" },
  backend: { label: "Backend Dev", color: "#FF6030" },
  fullstack: { label: "Full-Stack", color: "#A855F7" },
  hr: { label: "HR & Culture", color: "#7FFF00" },
  devops: { label: "DevOps / SRE", color: "#FFD700" },
  data: { label: "Data Engineer", color: "#FF69B4" },
};

const fmtDate = (ts) =>
  new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const scoreCol = (s) =>
  s >= 80
    ? "var(--lime)"
    : s >= 65
    ? "var(--cyan)"
    : s >= 50
    ? "var(--orange)"
    : "var(--red)";

// ── Achievement definitions (unlock based on real data) ───────────────────────
const ACHIEVEMENT_DEFS = [
  {
    icon: "🔥",
    label: "First Session",
    desc: "Complete your first interview",
    check: (h) => h.length >= 1,
    prog: (h) => Math.min(100, h.length * 100),
  },
  {
    icon: "🏆",
    label: "Score 80+",
    desc: "Achieve 80+ in any session",
    check: (h) => h.some((s) => s.avgScore >= 80),
    prog: (h) =>
      h.length
        ? Math.min(
            100,
            Math.round((Math.max(...h.map((s) => s.avgScore), 0) / 80) * 100)
          )
        : 0,
  },
  {
    icon: "📚",
    label: "5 Sessions",
    desc: "Complete 5 interviews",
    check: (h) => h.length >= 5,
    prog: (h) => Math.min(100, Math.round((h.length / 5) * 100)),
  },
  {
    icon: "🎙",
    label: "Voice Mode",
    desc: "Use voice mode in a session",
    check: (h) => h.some((s) => s.usedVoice),
    prog: (h) => (h.some((s) => s.usedVoice) ? 100 : 0),
  },
  {
    icon: "⚡",
    label: "3 Roles",
    desc: "Try 3 different roles",
    check: (h) => new Set(h.map((s) => s.role)).size >= 3,
    prog: (h) =>
      Math.min(100, Math.round((new Set(h.map((s) => s.role)).size / 3) * 100)),
  },
  {
    icon: "📈",
    label: "Improver",
    desc: "Score higher than your first session",
    check: (h) => h.length > 1 && h[h.length - 1].avgScore > h[0].avgScore,
    prog: (h) =>
      h.length > 1 && h[h.length - 1].avgScore > h[0].avgScore ? 100 : 0,
  },
  {
    icon: "💯",
    label: "Score 90+",
    desc: "Achieve 90+ in any session",
    check: (h) => h.some((s) => s.avgScore >= 90),
    prog: (h) =>
      h.length
        ? Math.min(
            100,
            Math.round((Math.max(...h.map((s) => s.avgScore), 0) / 90) * 100)
          )
        : 0,
  },
  {
    icon: "🌟",
    label: "10 Sessions",
    desc: "Complete 10 interviews",
    check: (h) => h.length >= 10,
    prog: (h) => Math.min(100, Math.round((h.length / 10) * 100)),
  },
];

// ── Shared sub-components ─────────────────────────────────────────────────────
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

function StatCard({ icon, value, label, color, delay = 0 }) {
  return (
    <div
      className="fu"
      style={{
        animationDelay: `${delay}s`,
        background: "var(--surface)",
        border: "1px solid var(--border2)",
        borderRadius: 14,
        padding: "16px 14px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 60,
          height: 60,
          background: `radial-gradient(circle at top right,${color}15,transparent 70%)`,
          pointerEvents: "none",
        }}
      />
      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
      <div
        style={{
          fontWeight: 800,
          fontSize: 24,
          color,
          fontFamily: "'JetBrains Mono',monospace",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: "'JetBrains Mono',monospace",
          fontSize: 9,
          color: "var(--muted)",
          letterSpacing: 2,
          marginTop: 5,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
    </div>
  );
}

function EmptyState({ onBack }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "60px 20px",
        background: "var(--surface)",
        border: "1px solid var(--border2)",
        borderRadius: 18,
      }}
    >
      <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
      <h3 style={{ fontWeight: 700, fontSize: 20, marginBottom: 10 }}>
        No data yet
      </h3>
      <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.7 }}>
        Complete your first interview to see charts and progress here.
      </p>
      <button
        onClick={onBack}
        style={{
          marginTop: 20,
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
        Start an Interview →
      </button>
    </div>
  );
}

// ── Tab: Overview ─────────────────────────────────────────────────────────────
function TabOverview({ sessionHistory, onBack }) {
  const total = sessionHistory.length;
  const avgScore = Math.round(
    sessionHistory.reduce((s, h) => s + h.avgScore, 0) / total
  );
  const avgConf = Math.round(
    sessionHistory.reduce((s, h) => s + (h.avgConfidence || 0), 0) / total
  );
  const bestScore = Math.max(...sessionHistory.map((s) => s.avgScore));
  const firstScore = sessionHistory[0].avgScore;
  const lastScore = sessionHistory[total - 1].avgScore;
  const improvement = lastScore - firstScore;

  const chartData = sessionHistory.map((s, i) => ({
    date: fmtDate(s.date),
    score: s.avgScore,
    confidence: s.avgConfidence || Math.round(s.avgScore * 0.9),
  }));

  const roleSummary = Object.entries(
    sessionHistory.reduce((acc, s) => {
      if (!acc[s.role]) acc[s.role] = { total: 0, count: 0 };
      acc[s.role].total += s.avgScore;
      acc[s.role].count++;
      return acc;
    }, {})
  ).map(([role, d]) => ({
    role: ROLE_META[role]?.label || role,
    avg: Math.round(d.total / d.count),
    count: d.count,
    color: ROLE_META[role]?.color || "var(--cyan)",
  }));

  const radarData = [
    { skill: "Score", val: avgScore },
    { skill: "Confidence", val: avgConf },
    { skill: "Sessions", val: Math.min(100, total * 10) },
    {
      skill: "Consistency",
      val: Math.max(
        0,
        100 -
          Math.round(
            Math.sqrt(
              sessionHistory.reduce(
                (s, h) => s + Math.pow(h.avgScore - avgScore, 2),
                0
              ) / total
            )
          ) *
            2
      ),
    },
    { skill: "Growth", val: Math.min(100, Math.max(0, 50 + improvement * 2)) },
  ];

  return (
    <div>
      {/* Stat cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))",
          gap: 10,
          marginBottom: 24,
        }}
      >
        <StatCard
          icon="📋"
          value={total}
          label="Sessions"
          color="var(--cyan)"
          delay={0}
        />
        <StatCard
          icon="🎯"
          value={`${avgScore}%`}
          label="Avg Score"
          color="var(--lime)"
          delay={0.05}
        />
        <StatCard
          icon="📈"
          value={improvement >= 0 ? `+${improvement}` : String(improvement)}
          label="Score Change"
          color={improvement >= 0 ? "var(--lime)" : "var(--red)"}
          delay={0.1}
        />
        <StatCard
          icon="🏆"
          value={bestScore}
          label="Best Score"
          color="var(--gold)"
          delay={0.15}
        />
        <StatCard
          icon="💪"
          value={`${avgConf}%`}
          label="Avg Confidence"
          color="var(--purple)"
          delay={0.2}
        />
        <StatCard
          icon="🎙"
          value={sessionHistory.filter((s) => s.usedVoice).length}
          label="Voice Sessions"
          color="var(--cyan)"
          delay={0.25}
        />
      </div>

      {/* Area chart — score over time */}
      <div
        className="fu"
        style={{
          animationDelay: ".2s",
          background: "var(--surface)",
          border: "1px solid var(--border2)",
          borderRadius: 18,
          padding: "22px 16px",
          marginBottom: 18,
        }}
      >
        <SectionLabel>Score Over Time</SectionLabel>
        {chartData.length < 2 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 0",
              color: "var(--muted)",
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 12,
            }}
          >
            Complete more sessions to see your trend line
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00C8FF" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#00C8FF" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A855F7" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#A855F7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
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
              <Legend
                wrapperStyle={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 10,
                  color: "var(--muted)",
                }}
              />
              <Area
                type="monotone"
                dataKey="score"
                name="Score"
                stroke="#00C8FF"
                strokeWidth={2.5}
                fill="url(#sg)"
                dot={{ fill: "#00C8FF", r: 4 }}
              />
              <Area
                type="monotone"
                dataKey="confidence"
                name="Confidence"
                stroke="#A855F7"
                strokeWidth={2}
                fill="url(#cg)"
                dot={{ fill: "#A855F7", r: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Radar + role breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div
          className="fu"
          style={{
            animationDelay: ".25s",
            background: "var(--surface)",
            border: "1px solid var(--border2)",
            borderRadius: 18,
            padding: "22px 16px",
          }}
        >
          <SectionLabel accent="var(--purple)">Skill Radar</SectionLabel>
          <ResponsiveContainer width="100%" height={220}>
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
                fillOpacity={0.13}
                strokeWidth={2}
              />
              <Tooltip content={<ChartTip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div
          className="fu"
          style={{
            animationDelay: ".3s",
            background: "var(--surface)",
            border: "1px solid var(--border2)",
            borderRadius: 18,
            padding: "22px 16px",
          }}
        >
          <SectionLabel accent="var(--orange)">Score By Role</SectionLabel>
          {roleSummary.map((r, i) => (
            <div
              key={r.role}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 10,
                  color: "var(--muted)",
                  minWidth: 100,
                }}
              >
                {r.role}
              </div>
              <div
                style={{
                  flex: 1,
                  height: 6,
                  background: "var(--surface2)",
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${r.avg}%`,
                    borderRadius: 3,
                    background: r.color,
                    transition: "width 1.2s ease",
                    transitionDelay: `${i * 0.07}s`,
                  }}
                />
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 10,
                  color: r.color,
                  minWidth: 32,
                  textAlign: "right",
                }}
              >
                {r.avg}%
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 9,
                  color: "var(--muted)",
                  minWidth: 24,
                }}
              >
                {r.count}x
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Tab: History ──────────────────────────────────────────────────────────────
function TabHistory({ sessionHistory }) {
  const chartData = sessionHistory.map((s, i) => ({
    date: fmtDate(s.date),
    score: s.avgScore,
    confidence: s.avgConfidence || Math.round(s.avgScore * 0.9),
  }));

  return (
    <div>
      {/* Bar chart */}
      {chartData.length >= 2 && (
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
          <SectionLabel accent="var(--orange)">Score History</SectionLabel>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid
                stroke="var(--border)"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                dataKey="date"
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
                dataKey="confidence"
                name="Confidence"
                fill="var(--purple)"
                fillOpacity={0.65}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Session list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[...sessionHistory].reverse().map((s, i) => {
          const m = ROLE_META[s.role] || {
            label: s.role,
            color: "var(--cyan)",
          };
          return (
            <div
              key={i}
              className="fu"
              style={{
                animationDelay: `${i * 0.04}s`,
                background: "var(--surface)",
                border: "1px solid var(--border2)",
                borderRadius: 14,
                padding: "14px 18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono',monospace",
                    fontWeight: 700,
                    fontSize: 24,
                    color: scoreCol(s.avgScore),
                    minWidth: 48,
                    textAlign: "center",
                  }}
                >
                  {s.avgScore}
                </div>
                <div>
                  <div
                    style={{
                      display: "flex",
                      gap: 7,
                      marginBottom: 4,
                      flexWrap: "wrap",
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: 14 }}>
                      {m.label}
                    </span>
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono',monospace",
                        fontSize: 9,
                        color: "var(--muted)",
                        background: "var(--surface2)",
                        border: "1px solid var(--border2)",
                        borderRadius: 20,
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
                          borderRadius: 20,
                          padding: "2px 8px",
                        }}
                      >
                        🎙
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
                    {fmtDate(s.date)} · {s.questionCount} questions
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Tab: Achievements ─────────────────────────────────────────────────────────
function TabAchievements({ sessionHistory }) {
  const achievements = ACHIEVEMENT_DEFS.map((a) => ({
    ...a,
    unlocked: a.check(sessionHistory),
    progress: a.prog(sessionHistory),
  }));
  const unlocked = achievements.filter((a) => a.unlocked).length;

  return (
    <div>
      {/* Summary banner */}
      <div
        className="fu"
        style={{
          background:
            "linear-gradient(135deg,rgba(0,200,255,.07),rgba(168,85,247,.07))",
          border: "1px solid rgba(0,200,255,.2)",
          borderRadius: 18,
          padding: "22px 28px",
          marginBottom: 22,
          display: "flex",
          alignItems: "center",
          gap: 22,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontWeight: 700,
              fontSize: 40,
              color: "var(--gold)",
              lineHeight: 1,
            }}
          >
            {unlocked}
            <span style={{ fontSize: 18, color: "var(--muted)" }}>
              /{achievements.length}
            </span>
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 9,
              color: "var(--muted)",
              letterSpacing: 2,
              marginTop: 4,
            }}
          >
            ACHIEVEMENTS UNLOCKED
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            <span
              style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 10,
                color: "var(--muted)",
              }}
            >
              COLLECTION PROGRESS
            </span>
            <span
              style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 10,
                color: "var(--gold)",
              }}
            >
              {Math.round((unlocked / achievements.length) * 100)}%
            </span>
          </div>
          <div
            style={{
              height: 7,
              background: "var(--surface2)",
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                background: "linear-gradient(90deg,var(--gold),var(--orange))",
                width: `${(unlocked / achievements.length) * 100}%`,
                borderRadius: 4,
                transition: "width 1.2s ease",
              }}
            />
          </div>
        </div>
      </div>

      {/* Achievement grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))",
          gap: 12,
        }}
      >
        {achievements.map((a, i) => (
          <div
            key={i}
            className="fu"
            style={{
              animationDelay: `${i * 0.04}s`,
              background: a.unlocked ? "rgba(255,215,0,.04)" : "var(--surface)",
              border: `1px solid ${
                a.unlocked ? "rgba(255,215,0,.25)" : "var(--border2)"
              }`,
              borderRadius: 14,
              padding: 18,
              position: "relative",
              overflow: "hidden",
              opacity: a.unlocked ? 1 : 0.78,
            }}
          >
            {a.unlocked && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: 60,
                  height: 60,
                  background:
                    "radial-gradient(circle at top right,rgba(255,215,0,.12),transparent 70%)",
                }}
              />
            )}
            <div
              style={{
                fontSize: 30,
                marginBottom: 10,
                filter: a.unlocked ? "none" : "grayscale(1) opacity(.4)",
              }}
            >
              {a.icon}
            </div>
            <div
              style={{
                fontWeight: 700,
                fontSize: 13,
                color: a.unlocked ? "var(--gold)" : "var(--muted)",
                marginBottom: 5,
              }}
            >
              {a.label}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--dim)",
                lineHeight: 1.5,
                marginBottom: a.unlocked ? 0 : 10,
              }}
            >
              {a.desc}
            </div>

            {/* Progress bar (locked only) */}
            {!a.unlocked && (
              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 4,
                    marginTop: 8,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 9,
                      color: "var(--dim)",
                    }}
                  >
                    PROGRESS
                  </span>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 9,
                      color: "var(--muted)",
                    }}
                  >
                    {a.progress}%
                  </span>
                </div>
                <div
                  style={{
                    height: 3,
                    background: "var(--surface2)",
                    borderRadius: 2,
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${a.progress}%`,
                      background: "var(--muted)",
                      borderRadius: 2,
                    }}
                  />
                </div>
              </>
            )}

            {a.unlocked && (
              <div
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 9,
                  color: "var(--gold)",
                  marginTop: 8,
                  letterSpacing: 1,
                }}
              >
                ✓ UNLOCKED
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ProgressPage({
  user,
  sessionHistory = [],
  loading = false,
  onBack,
}) {
  const [tab, setTab] = useState("overview");

  const hasData = sessionHistory.length > 0;

  const TABS = [
    { id: "overview", accent: "var(--cyan)" },
    { id: "history", accent: "var(--orange)" },
    { id: "achievements", accent: "var(--gold)" },
  ];

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

      {/* ── Navbar ── */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 28px",
          height: 60,
          background: "rgba(8,13,20,.95)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--border2)",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              background: "linear-gradient(135deg,#00C8FF,#0066ff)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 17,
            }}
          >
            🧠
          </div>
          <span
            style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 12,
              color: "var(--cyan)",
              letterSpacing: 1.5,
            }}
          >
            INTERVIEWAI
          </span>
        </div>
        <button
          onClick={onBack}
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border2)",
            borderRadius: 8,
            padding: "6px 16px",
            cursor: "pointer",
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 11,
            color: "var(--muted)",
          }}
        >
          ← Dashboard
        </button>
      </nav>

      <div
        style={{ maxWidth: 1060, margin: "0 auto", padding: "32px 24px 60px" }}
      >
        {/* ── Page heading ── */}
        {/* ── Page heading ── */}
        <div className="fu" style={{ marginBottom: 28 }}>
          <h1
            style={{
              fontWeight: 800,
              fontSize: "clamp(22px,3.5vw,34px)",
              marginBottom: 6,
            }}
          >
            Your <span style={{ color: "var(--cyan)" }}>Progress</span>
          </h1>
          <p
            style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 11,
              color: "var(--muted)",
            }}
          >
            {loading
              ? "Loading your sessions…"
              : hasData
              ? `${sessionHistory.length} session${
                  sessionHistory.length !== 1 ? "s" : ""
                } completed · ${Math.round(
                  sessionHistory.reduce((s, h) => s + h.avgScore, 0) /
                    sessionHistory.length
                )}% average score`
              : "No sessions yet — complete your first interview to see charts here!"}
          </p>
        </div>
        {/* ── Tab nav ── */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 26,
            flexWrap: "wrap",
          }}
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: "8px 20px",
                borderRadius: 22,
                border: `1.5px solid ${
                  tab === t.id ? t.accent : "var(--border2)"
                }`,
                background: tab === t.id ? `${t.accent}12` : "transparent",
                color: tab === t.id ? t.accent : "var(--muted)",
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 10,
                cursor: "pointer",
                transition: "all .2s",
                letterSpacing: 1,
                textTransform: "capitalize",
              }}
            >
              {t.id}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        {tab === "overview" &&
          (hasData ? (
            <TabOverview sessionHistory={sessionHistory} onBack={onBack} />
          ) : (
            <EmptyState onBack={onBack} />
          ))}

        {tab === "history" &&
          (hasData ? (
            <TabHistory sessionHistory={sessionHistory} />
          ) : (
            <EmptyState onBack={onBack} />
          ))}

        {tab === "achievements" && (
          <TabAchievements sessionHistory={sessionHistory} />
        )}
      </div>
    </div>
  );
}
