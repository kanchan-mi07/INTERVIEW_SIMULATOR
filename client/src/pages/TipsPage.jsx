const G = `@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');`;
const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#020408;--surface:#080d14;--surface2:#0d1520;
  --border:#0f1e2e;--border2:#162435;
  --cyan:#00C8FF;--lime:#7FFF00;--orange:#FF6030;--purple:#A855F7;
  --text:#e2eaf4;--muted:#8aa8c0;--dim:#2a4560;
}
body{background:var(--bg);color:var(--text);font-family:'Outfit',sans-serif;overflow-x:hidden}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:var(--dim)}
@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
.fu{animation:fadeUp .45s ease both}

@media(max-width:700px){
  .tips-grid{grid-template-columns:1fr!important}
  .tips-quick{grid-template-columns:1fr!important}
}
@media(max-width:500px){
  .tips-grid{grid-template-columns:1fr!important}
}
`;

const TIPS = [
  {
    icon: "🎯",
    title: "STAR Method",
    body: "Structure answers as Situation → Task → Action → Result for behavioral questions. This gives your answer a clear narrative arc that interviewers love.",
  },
  {
    icon: "🧠",
    title: "Research First",
    body: "Look up the company's tech stack, recent news, and team structure before each session. More relevant answers show genuine interest and preparation.",
  },
  {
    icon: "⏱",
    title: "Stay Concise",
    body: "Aim for 90-second answers. Clarity beats length every time — a crisp 80-word answer outscores a rambling 300-word one.",
  },
  {
    icon: "🎙",
    title: "Voice Analysis",
    body: "Voice mode tracks confidence, pace, and filler words live as you speak. Use it to identify habits like 'um', 'uh', and 'basically'.",
  },
  {
    icon: "💡",
    title: "Use Examples",
    body: "Real project examples score 40% higher than theoretical answers. Always anchor your answer in something you've actually built or done.",
  },
  {
    icon: "📈",
    title: "Track Growth",
    body: "Review your progress page after each session to spot patterns in your weak areas. Consistent practice beats cramming every time.",
  },
];

const QUICK_TIPS = [
  "Say 'I' not 'we' — own your contributions",
  "Pause before answering — it shows thoughtfulness",
  "Ask clarifying questions when unsure",
  "End answers by connecting back to the role",
  "Quantify results: 'reduced load time by 40%'",
  "Show enthusiasm — energy matters a lot",
  "Mirror the interviewer's communication style",
  "Prepare 2-3 questions to ask at the end",
  "Silence is okay — it means you're thinking",
  "Admit when you don't know, then reason through it",
  "Use the job description as a cheat sheet",
  "Practice answers out loud, not just in your head",
];

export default function TipsPage({ onBack }) {
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
          gap: 14,
          padding: "0 20px",
          height: 66,
          background: "rgba(2,4,8,.93)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--border2)",
          position: "sticky",
          top: 0,
          zIndex: 50,
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
          }}
        >
          / Tips
        </span>
      </nav>

      <div
        style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 16px 80px" }}
      >
        {/* Heading */}
        <div className="fu" style={{ marginBottom: 28 }}>
          <h1
            style={{
              fontWeight: 900,
              fontSize: "clamp(22px,4vw,38px)",
              marginBottom: 10,
            }}
          >
            Interview{" "}
            <span style={{ color: "var(--lime)" }}>Tips & Strategy</span>
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 15, lineHeight: 1.7 }}>
            Proven strategies to help you perform at your best in every
            interview.
          </p>
        </div>

        {/* Tip cards */}
        <div
          className="tips-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))",
            gap: 14,
            marginBottom: 28,
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
                borderRadius: 18,
                padding: "24px 22px",
                transition: "all .25s",
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
                  gap: 12,
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: "rgba(0,200,255,.08)",
                    border: "1px solid rgba(0,200,255,.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    flexShrink: 0,
                  }}
                >
                  {t.icon}
                </div>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 11,
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
                  fontSize: 15,
                  color: "var(--muted)",
                  lineHeight: 1.85,
                }}
              >
                {t.body}
              </p>
            </div>
          ))}
        </div>

        {/* Quick reminders */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border2)",
            borderRadius: 20,
            padding: "24px 20px",
          }}
        >
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
                width: 4,
                height: 20,
                background: "var(--lime)",
                borderRadius: 2,
              }}
            />
            <span
              style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 12,
                color: "var(--muted)",
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              Quick Reminders
            </span>
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
                  gap: 12,
                  background: "var(--surface2)",
                  borderRadius: 12,
                  padding: "13px 15px",
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: "rgba(127,255,0,.1)",
                    border: "1px solid rgba(127,255,0,.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 11,
                    color: "var(--lime)",
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  {i + 1}
                </div>
                <p
                  style={{
                    fontSize: 14,
                    color: "var(--muted)",
                    lineHeight: 1.75,
                  }}
                >
                  {t}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
