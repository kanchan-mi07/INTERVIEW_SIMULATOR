import { useState, useEffect, useRef } from "react";

const G = `@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');`;
const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#020408;--surface:#080d14;--surface2:#0d1520;
  --border:#0f1e2e;--border2:#162435;
  --cyan:#00C8FF;--lime:#7FFF00;--orange:#FF6030;--purple:#A855F7;--red:#ff4444;
  --text:#e2eaf4;--muted:#3a5570;--dim:#1a2d3f;
}
body{background:var(--bg);color:var(--text);font-family:'Outfit',sans-serif}
::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:var(--dim)}
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:1;transform:scale(1.06)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
@keyframes ripple{0%{transform:scale(1);opacity:.8}100%{transform:scale(2.5);opacity:0}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
@keyframes aiPulse{0%,100%{box-shadow:0 0 0 0 rgba(0,200,255,.4)}50%{box-shadow:0 0 0 16px rgba(0,200,255,0)}}
@keyframes barWave{0%,100%{transform:scaleY(.25)}50%{transform:scaleY(1)}}
.fu{animation:fadeUp .45s ease both}
`;

// ── Role metadata ─────────────────────────────────────────────────────────────
const ROLE_META = {
  frontend: { label: "Frontend Dev", icon: "⚡", color: "#00C8FF" },
  backend: { label: "Backend Dev", icon: "🔩", color: "#FF6030" },
  fullstack: { label: "Full-Stack", icon: "🚀", color: "#A855F7" },
  hr: { label: "HR & Culture", icon: "🤝", color: "#7FFF00" },
  devops: { label: "DevOps / SRE", icon: "⚙️", color: "#FFD700" },
  data: { label: "Data Engineer", icon: "📊", color: "#FF69B4" },
};

// ── Gemini API — robust version with full error logging ───────────────────────
async function callGemini(prompt) {
  const key = sessionStorage.getItem("GEMINI_KEY") || "";
  if (!key) {
    console.warn(
      "Gemini: no key found in sessionStorage. Using local fallback."
    );
    return "";
  }
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
        }),
      }
    );
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      console.warn(
        "Gemini HTTP error:",
        res.status,
        errJson?.error?.message || "unknown"
      );
      return "";
    }
    const d = await res.json();
    const txt = d.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    return txt;
  } catch (e) {
    console.warn("Gemini fetch failed:", e.message);
    return "";
  }
}

// ── Safe JSON extractor — strips markdown and finds first {...} or [...] ──────
function extractJSON(raw, type = "object") {
  if (!raw) return null;
  const cleaned = raw
    .replace(/```json/gi, "")
    .replace(/```/gi, "")
    .trim();
  const open = type === "array" ? "[" : "{";
  const close = type === "array" ? "]" : "}";
  const start = cleaned.indexOf(open);
  const end = cleaned.lastIndexOf(close);
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch (e) {
    console.warn(
      "JSON extract failed:",
      e.message,
      "| raw:",
      cleaned.slice(0, 200)
    );
    return null;
  }
}

// ── Built-in question bank (fallback when no Gemini key) ─────────────────────
const QUESTION_BANK = {
  "Frontend Dev": {
    Junior: [
      {
        id: 1,
        question: "What is the difference between == and === in JavaScript?",
        category: "JavaScript",
        hint: "Think about type coercion",
      },
      {
        id: 2,
        question: "Explain the CSS box model.",
        category: "CSS",
        hint: "Content, padding, border, margin",
      },
      {
        id: 3,
        question: "What is a closure in JavaScript?",
        category: "JavaScript",
        hint: "Function remembering its outer scope",
      },
      {
        id: 4,
        question: "What is the difference between let, const, and var?",
        category: "JavaScript",
        hint: "Scope and mutability",
      },
      {
        id: 5,
        question: "How does the browser render a webpage?",
        category: "Browser",
        hint: "DOM, CSSOM, render tree",
      },
    ],
    "Mid-Level": [
      {
        id: 1,
        question: "Explain React's virtual DOM and reconciliation.",
        category: "React",
        hint: "Diffing algorithm, Fiber",
      },
      {
        id: 2,
        question: "How would you optimize a slow React application?",
        category: "Performance",
        hint: "Memoization, code splitting, profiling",
      },
      {
        id: 3,
        question: "What is the difference between CSS Grid and Flexbox?",
        category: "CSS",
        hint: "1D vs 2D layout",
      },
      {
        id: 4,
        question: "Explain event delegation in JavaScript.",
        category: "JavaScript",
        hint: "Bubbling, capturing",
      },
      {
        id: 5,
        question: "How do you manage state in a large React app?",
        category: "Architecture",
        hint: "Redux, Zustand, Context",
      },
    ],
    Senior: [
      {
        id: 1,
        question: "How would you architect a micro-frontend system?",
        category: "Architecture",
        hint: "Module federation, independent deployments",
      },
      {
        id: 2,
        question: "Explain the Critical Rendering Path and how to optimize.",
        category: "Performance",
        hint: "Blocking resources, preload, defer",
      },
      {
        id: 3,
        question: "How do you handle accessibility (a11y) in your apps?",
        category: "Accessibility",
        hint: "ARIA, semantic HTML, keyboard nav",
      },
      {
        id: 4,
        question: "Describe your approach to web security (XSS, CSRF).",
        category: "Security",
        hint: "Input sanitization, CSP, tokens",
      },
      {
        id: 5,
        question: "How would you design a design system from scratch?",
        category: "System Design",
        hint: "Tokens, components, documentation",
      },
    ],
  },
  "Backend Dev": {
    Junior: [
      {
        id: 1,
        question: "What is REST and what are its key principles?",
        category: "APIs",
        hint: "Stateless, resources, HTTP methods",
      },
      {
        id: 2,
        question: "Explain the difference between SQL and NoSQL databases.",
        category: "Databases",
        hint: "Schema, scalability, use cases",
      },
      {
        id: 3,
        question: "What is middleware in Express.js?",
        category: "Node.js",
        hint: "Request/response pipeline",
      },
      {
        id: 4,
        question:
          "What is the difference between authentication and authorization?",
        category: "Security",
        hint: "Who you are vs what you can do",
      },
      {
        id: 5,
        question: "Explain what a Promise is in JavaScript.",
        category: "JavaScript",
        hint: "Async operations, then/catch",
      },
    ],
    "Mid-Level": [
      {
        id: 1,
        question:
          "How would you design a RESTful API for a social media platform?",
        category: "System Design",
        hint: "Resources, endpoints, pagination",
      },
      {
        id: 2,
        question: "Explain database indexing and when to use it.",
        category: "Databases",
        hint: "Query performance, B-trees, trade-offs",
      },
      {
        id: 3,
        question: "What is JWT and how does token-based auth work?",
        category: "Security",
        hint: "Header, payload, signature",
      },
      {
        id: 4,
        question: "How do you handle errors in a Node.js application?",
        category: "Node.js",
        hint: "Try/catch, global handlers, logging",
      },
      {
        id: 5,
        question: "Explain SQL transactions and ACID properties.",
        category: "Databases",
        hint: "Atomicity, consistency, isolation, durability",
      },
    ],
    Senior: [
      {
        id: 1,
        question:
          "How would you design a distributed system for millions of users?",
        category: "System Design",
        hint: "Load balancing, caching, sharding",
      },
      {
        id: 2,
        question: "Explain the CAP theorem and its implications.",
        category: "System Design",
        hint: "Consistency, availability, partition tolerance",
      },
      {
        id: 3,
        question: "How would you implement a rate limiter?",
        category: "Architecture",
        hint: "Token bucket, sliding window, Redis",
      },
      {
        id: 4,
        question: "Describe your approach to database optimization.",
        category: "Databases",
        hint: "Query plans, indexes, caching",
      },
      {
        id: 5,
        question: "How do you handle secrets and configuration management?",
        category: "Security",
        hint: "Env vars, vaults, rotation",
      },
    ],
  },
  "Full-Stack": {
    Junior: [
      {
        id: 1,
        question: "Walk me through how data flows in a full-stack application.",
        category: "Architecture",
        hint: "Frontend → API → DB → back",
      },
      {
        id: 2,
        question: "What is CORS and why does it exist?",
        category: "Web",
        hint: "Same-origin policy, headers",
      },
      {
        id: 3,
        question: "Explain the difference between CSR and SSR.",
        category: "Rendering",
        hint: "Client-side vs server-side rendering",
      },
      {
        id: 4,
        question: "What is the purpose of environment variables?",
        category: "Config",
        hint: "Secrets, different environments",
      },
      {
        id: 5,
        question: "How do HTTP cookies and sessions work?",
        category: "Auth",
        hint: "Set-Cookie, session stores",
      },
    ],
    "Mid-Level": [
      {
        id: 1,
        question: "How would you build real-time notifications?",
        category: "Real-time",
        hint: "WebSockets, SSE, polling",
      },
      {
        id: 2,
        question: "Explain the MERN stack and how components interact.",
        category: "Architecture",
        hint: "MongoDB, Express, React, Node",
      },
      {
        id: 3,
        question: "How do you handle file uploads in a full-stack app?",
        category: "Features",
        hint: "Multipart, streams, cloud storage",
      },
      {
        id: 4,
        question: "What is your approach to API versioning?",
        category: "APIs",
        hint: "URL versioning, headers, deprecation",
      },
      {
        id: 5,
        question: "How do you approach testing in a full-stack application?",
        category: "Testing",
        hint: "Unit, integration, e2e",
      },
    ],
    Senior: [
      {
        id: 1,
        question: "How would you architect a scalable SaaS application?",
        category: "Architecture",
        hint: "Multi-tenancy, isolation, billing",
      },
      {
        id: 2,
        question: "Explain your CI/CD pipeline setup.",
        category: "DevOps",
        hint: "Build, test, deploy stages",
      },
      {
        id: 3,
        question: "How would you approach database migrations in production?",
        category: "Databases",
        hint: "Zero downtime, rollback strategy",
      },
      {
        id: 4,
        question: "Describe a complex performance problem you solved.",
        category: "Performance",
        hint: "Profiling, bottlenecks, measurement",
      },
      {
        id: 5,
        question: "How do you ensure security across the full stack?",
        category: "Security",
        hint: "OWASP top 10, layers of defense",
      },
    ],
  },
  "HR & Culture": {
    Junior: [
      {
        id: 1,
        question: "Tell me about yourself and why you want this role.",
        category: "Introduction",
        hint: "Brief background + motivation",
      },
      {
        id: 2,
        question: "What are your greatest strengths and weaknesses?",
        category: "Self-Awareness",
        hint: "Be genuine, show self-improvement",
      },
      {
        id: 3,
        question: "Describe a time you worked in a team.",
        category: "Teamwork",
        hint: "Your role and contribution",
      },
      {
        id: 4,
        question: "How do you handle constructive criticism?",
        category: "Feedback",
        hint: "Show openness to growth",
      },
      {
        id: 5,
        question: "Where do you see yourself in 5 years?",
        category: "Career Goals",
        hint: "Align with company growth",
      },
    ],
    "Mid-Level": [
      {
        id: 1,
        question:
          "Tell me about a conflict with a colleague and how you resolved it.",
        category: "Conflict",
        hint: "STAR method, positive outcome",
      },
      {
        id: 2,
        question: "Describe leading without formal authority.",
        category: "Leadership",
        hint: "Influence, collaboration, results",
      },
      {
        id: 3,
        question: "How do you prioritize multiple urgent tasks?",
        category: "Time Management",
        hint: "Frameworks, communication",
      },
      {
        id: 4,
        question: "Tell me about a failure and what you learned.",
        category: "Growth",
        hint: "Be honest, focus on learning",
      },
      {
        id: 5,
        question: "How do you handle a difficult manager?",
        category: "Relationships",
        hint: "Communication, empathy, professionalism",
      },
    ],
    Senior: [
      {
        id: 1,
        question: "How have you contributed to company culture?",
        category: "Culture",
        hint: "Actions, initiatives, outcomes",
      },
      {
        id: 2,
        question: "Tell me about a time you drove organizational change.",
        category: "Leadership",
        hint: "Vision, stakeholders, results",
      },
      {
        id: 3,
        question: "How do you mentor and develop team members?",
        category: "Mentorship",
        hint: "Specific examples, approaches",
      },
      {
        id: 4,
        question: "Describe how you handle underperformance on your team.",
        category: "Management",
        hint: "Early intervention, clear feedback",
      },
      {
        id: 5,
        question: "How do you stay updated with industry trends?",
        category: "Growth",
        hint: "Learning habits, application",
      },
    ],
  },
  "DevOps / SRE": {
    Junior: [
      {
        id: 1,
        question: "What is Docker and why is it useful?",
        category: "Containers",
        hint: "Isolation, portability, consistency",
      },
      {
        id: 2,
        question: "Explain what CI/CD means.",
        category: "DevOps",
        hint: "Continuous integration, delivery/deployment",
      },
      {
        id: 3,
        question: "What is the difference between a VM and a container?",
        category: "Infrastructure",
        hint: "OS layer, resources, startup time",
      },
      {
        id: 4,
        question: "Why is version control important in DevOps?",
        category: "VCS",
        hint: "Git, branching, collaboration",
      },
      {
        id: 5,
        question: "What is a load balancer?",
        category: "Networking",
        hint: "Traffic distribution, availability",
      },
    ],
    "Mid-Level": [
      {
        id: 1,
        question: "How would you set up a Kubernetes cluster?",
        category: "Kubernetes",
        hint: "Deployments, services, ingress",
      },
      {
        id: 2,
        question: "Explain blue-green deployments.",
        category: "Deployment",
        hint: "Zero downtime, traffic switching, rollback",
      },
      {
        id: 3,
        question: "How do you monitor and alert on a production system?",
        category: "Observability",
        hint: "Metrics, logs, traces, alerting",
      },
      {
        id: 4,
        question: "What is infrastructure as code?",
        category: "IaC",
        hint: "Terraform, Ansible, reproducibility",
      },
      {
        id: 5,
        question: "How would you handle a production incident?",
        category: "SRE",
        hint: "Detection, response, post-mortem",
      },
    ],
    Senior: [
      {
        id: 1,
        question: "Design a highly available multi-region architecture.",
        category: "Architecture",
        hint: "Failover, data replication, latency",
      },
      {
        id: 2,
        question: "How do you manage secrets in a cloud environment?",
        category: "Security",
        hint: "Vault, KMS, rotation, access control",
      },
      {
        id: 3,
        question: "Explain your approach to SLIs, SLOs, and SLAs.",
        category: "SRE",
        hint: "Reliability targets, error budgets",
      },
      {
        id: 4,
        question: "How do you optimize cloud costs at scale?",
        category: "Cost",
        hint: "Right-sizing, reserved instances, tagging",
      },
      {
        id: 5,
        question: "How would you migrate a monolith to microservices?",
        category: "Architecture",
        hint: "Strangler fig, domain boundaries, data",
      },
    ],
  },
  "Data Engineer": {
    Junior: [
      {
        id: 1,
        question:
          "What is the difference between a data warehouse and a data lake?",
        category: "Storage",
        hint: "Structured vs raw, use cases",
      },
      {
        id: 2,
        question: "Explain ETL and its importance.",
        category: "Pipelines",
        hint: "Extract, transform, load",
      },
      {
        id: 3,
        question: "What is SQL and when would you use it?",
        category: "SQL",
        hint: "Querying, joins, aggregations",
      },
      {
        id: 4,
        question: "What is a data pipeline?",
        category: "Pipelines",
        hint: "Source to destination, transformations",
      },
      {
        id: 5,
        question: "What is Python used for in data engineering?",
        category: "Python",
        hint: "Scripting, pandas, automation",
      },
    ],
    "Mid-Level": [
      {
        id: 1,
        question:
          "How would you design a data pipeline for real-time analytics?",
        category: "Streaming",
        hint: "Kafka, Spark Streaming, latency",
      },
      {
        id: 2,
        question: "Explain partitioning and why it matters.",
        category: "Performance",
        hint: "Query speed, data organization",
      },
      {
        id: 3,
        question: "How do you handle data quality issues?",
        category: "Data Quality",
        hint: "Validation, monitoring, lineage",
      },
      {
        id: 4,
        question: "What is Apache Spark and when would you use it?",
        category: "Processing",
        hint: "Distributed computing, large datasets",
      },
      {
        id: 5,
        question: "Explain star schema vs snowflake schema.",
        category: "Modeling",
        hint: "Dimensions, facts, normalization",
      },
    ],
    Senior: [
      {
        id: 1,
        question: "How would you build a real-time fraud detection pipeline?",
        category: "System Design",
        hint: "Streaming, ML integration, latency",
      },
      {
        id: 2,
        question: "Explain your approach to data governance.",
        category: "Governance",
        hint: "Lineage, access control, catalog",
      },
      {
        id: 3,
        question: "How do you optimize slow SQL queries at scale?",
        category: "Performance",
        hint: "Execution plans, indexes, partitioning",
      },
      {
        id: 4,
        question:
          "What is your strategy for data modeling in a cloud warehouse?",
        category: "Modeling",
        hint: "dbt, dimensional modeling, costs",
      },
      {
        id: 5,
        question: "How do you ensure data pipeline reliability?",
        category: "Reliability",
        hint: "Monitoring, retries, SLAs, testing",
      },
    ],
  },
};

// ── TTS ───────────────────────────────────────────────────────────────────────
function speakText(text, onEnd) {
  if (!window.speechSynthesis) {
    onEnd?.();
    return;
  }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.88;
  u.pitch = 1.0;
  u.volume = 1;
  const go = () => {
    const vs = window.speechSynthesis.getVoices();
    const v =
      vs.find(
        (v) =>
          v.lang.startsWith("en") &&
          (v.name.includes("Google") ||
            v.name.includes("Samantha") ||
            v.name.includes("Daniel"))
      ) ||
      vs.find((v) => v.lang.startsWith("en")) ||
      vs[0];
    if (v) u.voice = v;
    u.onend = () => onEnd?.();
    u.onerror = () => onEnd?.();
    window.speechSynthesis.speak(u);
  };
  if (window.speechSynthesis.getVoices().length > 0) {
    go();
  } else {
    window.speechSynthesis.onvoiceschanged = () => {
      go();
      window.speechSynthesis.onvoiceschanged = null;
    };
    setTimeout(go, 1200);
  }
}

// ── Voice Recorder Hook ───────────────────────────────────────────────────────
function useVoiceRecorder() {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [micError, setMicError] = useState("");
  const recRef = useRef(null);
  const finalRef = useRef("");
  const fillerRef = useRef(0);
  const t0 = useRef(0);
  const FILLERS = [
    "um",
    "uh",
    "like",
    "basically",
    "literally",
    "actually",
    "you know",
  ];

  useEffect(() => () => stopRec(), []);

  const stopRec = () => {
    const r = recRef.current;
    recRef.current = null;
    try {
      r?.stop();
    } catch {}
    setRecording(false);
  };

  const startRec = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setMicError("Voice input needs Chrome or Edge. Please use text mode.");
      return;
    }
    setMicError("");
    finalRef.current = "";
    fillerRef.current = 0;
    t0.current = Date.now();
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.onresult = (e) => {
      let int = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const txt = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          finalRef.current += (finalRef.current ? " " : "") + txt.trim();
          FILLERS.forEach((f) => {
            const m = txt.match(new RegExp(`\\b${f}\\b`, "gi"));
            if (m) fillerRef.current += m.length;
          });
        } else {
          int = txt;
        }
      }
      setTranscript(finalRef.current);
      setInterim(int);
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed")
        setMicError("Mic blocked. Allow access or use text mode.");
      else if (e.error !== "aborted")
        setMicError(`Voice error: ${e.error}. Try text mode.`);
      stopRec();
    };
    rec.onend = () => {
      if (recRef.current === rec)
        try {
          rec.start();
        } catch {}
    };
    recRef.current = rec;
    try {
      rec.start();
      setRecording(true);
    } catch {
      setMicError("Mic unavailable. Please use text mode.");
    }
  };

  const clearAll = () => {
    stopRec();
    finalRef.current = "";
    fillerRef.current = 0;
    setTranscript("");
    setInterim("");
    setMicError("");
  };

  const getMetrics = () => {
    const mins = (Date.now() - t0.current) / 60000 || 0.1;
    const words = finalRef.current.split(/\s+/).filter(Boolean).length;
    const pace = Math.round(words / mins);
    return {
      confidence: Math.max(
        30,
        Math.min(
          95,
          85 - fillerRef.current * 8 + (pace > 100 && pace < 170 ? 8 : 0)
        )
      ),
      pace,
      fillerCount: fillerRef.current,
      wordCount: words,
    };
  };

  return {
    recording,
    transcript,
    interim,
    micError,
    startRec,
    stopRec,
    clearAll,
    getMetrics,
  };
}

// ── Animated waveform bars ────────────────────────────────────────────────────
function AnimBars({ active, color, count = 20 }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        height: 44,
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 3,
            borderRadius: 3,
            height: 44,
            background: active ? color : "rgba(255,255,255,.1)",
            transformOrigin: "center",
            animation: active
              ? `barWave ${
                  0.55 + (i % 5) * 0.12
                }s ease-in-out infinite alternate`
              : "none",
            animationDelay: `${(i * 0.048).toFixed(2)}s`,
            transition: "background .3s",
          }}
        />
      ))}
    </div>
  );
}

// ── Score ring ────────────────────────────────────────────────────────────────
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

// ── Local scoring fallback (used when Gemini unavailable) ─────────────────────
// ── Smart local scorer — gives UNIQUE scores per answer ──────────────────────
// Each metric is computed independently so no two answers get same result
function scoreLocal(answer, metrics) {
  const text = answer.trim();
  const words = metrics.wordCount || text.split(/\s+/).filter(Boolean).length;

  // Empty / no answer
  if (text === "" || text === "(no answer given)" || words < 3) {
    const baseConf = Math.max(20, (metrics.confidence || 30) - 10);
    return {
      score: 20,
      grade: "F",
      confidence: baseConf,
      clarity: 18,
      technicalDepth: 15,
      strengths: ["Attempted to participate in the interview"],
      improvements: [
        "Please provide a response to the question",
        "Even a brief answer demonstrates your thought process",
      ],
      verdict:
        "No answer was provided. Always attempt an answer — partial credit is better than silence.",
      keywordsHit: [],
      missedConcepts: [],
    };
  }

  // ── Content analysis ──────────────────────────────────────────────────────
  const hasExample =
    /example|instance|project|built|implemented|when i|i worked|i used|i created|i designed|for example|such as|specifically/i.test(
      text
    );
  const isStructured =
    /first(ly)?|second(ly)?|third(ly)?|also|additionally|however|because|therefore|result|finally|in conclusion|to summarise/i.test(
      text
    );
  const hasTech =
    /api|rest|graphql|database|sql|nosql|mongodb|postgres|component|function|class|server|client|deploy|docker|kubernetes|cache|async|promise|callback|hook|state|props|algorithm|complexity|o\(n\)|big.?o/i.test(
      text
    );
  const hasNumbers =
    /\d+%|\d+ (ms|seconds|minutes|hours|days|years|users|requests|million)/i.test(
      text
    );
  const hasComparison =
    /vs\.?|versus|compared to|difference|trade.?off|pros? and cons?|on the other hand|alternatively/i.test(
      text
    );
  const isDetailed = words > 80;
  const isModerate = words >= 30 && words <= 80;
  const isTooShort = words < 15;

  // ── Base score from word count ────────────────────────────────────────────
  let score = 30;
  if (words >= 15) score += 8;
  if (words >= 30) score += 8;
  if (words >= 60) score += 7;
  if (words >= 100) score += 5;
  if (words >= 150) score += 3;

  // ── Content bonuses ───────────────────────────────────────────────────────
  if (hasExample) score += 12;
  if (isStructured) score += 8;
  if (hasTech) score += 9;
  if (hasNumbers) score += 6;
  if (hasComparison) score += 6;

  // ── Voice metrics ─────────────────────────────────────────────────────────
  const conf = metrics.confidence || 50;
  const pace = metrics.pace || 120;
  const fill = metrics.fillerCount || 0;
  if (conf > 75) score += 5;
  else if (conf < 45) score -= 5;
  if (fill > 5) score -= 6;
  else if (fill === 0 && words > 20) score += 3;

  score = Math.min(95, Math.max(20, score));

  // ── Independent metrics (each computed differently) ───────────────────────
  // Confidence: voice-based OR estimated from delivery quality
  const confidence = Math.round(
    metrics.fillerCount !== undefined
      ? conf // real voice metric
      : Math.min(
          90,
          Math.max(
            25,
            50 +
              words * 0.4 +
              (hasExample ? 8 : 0) +
              (isStructured ? 5 : 0) -
              (isTooShort ? 15 : 0)
          )
        )
  );

  // Clarity: based on structure + word count + no excessive length
  const clarity = Math.round(
    Math.min(
      95,
      Math.max(
        20,
        35 +
          (isStructured ? 20 : 0) +
          (isModerate ? 15 : 0) +
          (isDetailed ? 10 : 0) +
          (isTooShort ? -15 : 0) +
          (words > 200 ? -8 : 0) // too long hurts clarity
      )
    )
  );

  // Technical depth: based on tech terms + examples + comparisons
  const technicalDepth = Math.round(
    Math.min(
      95,
      Math.max(
        15,
        25 +
          (hasTech ? 22 : 0) +
          (hasExample ? 15 : 0) +
          (hasComparison ? 12 : 0) +
          (hasNumbers ? 10 : 0) +
          (isTooShort ? -10 : 0)
      )
    )
  );

  const grade =
    score >= 90
      ? "A+"
      : score >= 80
      ? "A"
      : score >= 70
      ? "B"
      : score >= 60
      ? "C"
      : score >= 50
      ? "D"
      : "F";

  // ── Dynamic strengths & improvements ─────────────────────────────────────
  const strengths = [];
  const improvements = [];

  if (hasExample)
    strengths.push("Backed your answer with a concrete real-world example");
  else
    improvements.push(
      "Add a specific example from your own experience or projects"
    );

  if (isStructured)
    strengths.push("Answer was logically structured and easy to follow");
  else
    improvements.push(
      "Use a clear structure — try STAR (Situation, Task, Action, Result)"
    );

  if (hasTech)
    strengths.push("Demonstrated technical vocabulary and domain knowledge");
  else
    improvements.push("Include relevant technical terms specific to this role");

  if (hasNumbers)
    strengths.push("Quantified results with specific numbers — very effective");
  else if (words > 30)
    improvements.push("Quantify your impact — e.g. 'reduced load time by 40%'");

  if (hasComparison)
    strengths.push("Showed awareness of trade-offs and alternatives");
  if (conf > 75)
    strengths.push("Delivered with good confidence and minimal hesitation");
  else if (conf < 45)
    improvements.push(
      "Speak more confidently — avoid filler words like 'um' and 'uh'"
    );

  if (words < 15)
    improvements.push(
      "Expand your answer significantly — aim for at least 30 words"
    );
  else if (words > 200)
    improvements.push(
      "Be more concise — interviewers prefer clear, focused answers"
    );

  // Always have at least 1 of each
  if (strengths.length === 0)
    strengths.push("Engaged with the question and provided a response");
  if (improvements.length === 0)
    improvements.push(
      "Consider mentioning edge cases or potential limitations"
    );

  // ── Dynamic verdict ───────────────────────────────────────────────────────
  const verdict =
    score >= 88
      ? "Excellent answer — comprehensive, specific, and well-delivered."
      : score >= 78
      ? "Strong answer with good depth. Minor improvements would make it exceptional."
      : score >= 68
      ? "Solid answer. Adding a concrete example would push this to the next level."
      : score >= 55
      ? "Adequate answer but lacks specificity. Be more detailed and structured."
      : score >= 40
      ? "Basic answer — expand significantly with examples and technical detail."
      : "Answer needs substantial improvement — aim for more depth and structure.";

  return {
    score,
    grade,
    confidence,
    clarity,
    technicalDepth,
    strengths: strengths.slice(0, 3),
    improvements: improvements.slice(0, 3),
    verdict,
    keywordsHit: [],
    missedConcepts: [],
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const hasSR = () =>
  !!(window.SpeechRecognition || window.webkitSpeechRecognition);
const hasTTS = () => !!window.speechSynthesis;

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
export default function InterviewPage({ role, onComplete, onExit }) {
  const meta = ROLE_META[role] || ROLE_META.frontend;
  const color = meta.color;
  const cr = color
    .slice(1)
    .match(/../g)
    .map((x) => parseInt(x, 16))
    .join(",");

  const [difficulty, setDifficulty] = useState("Mid-Level");
  const [phase, setPhase] = useState("intro");
  const [questions, setQuestions] = useState([]);
  const [qIdx, setQIdx] = useState(0);
  const [textAnswer, setTextAnswer] = useState("");
  const [results, setResults] = useState([]);
  const [curResult, setCurResult] = useState(null);
  const [timer, setTimer] = useState(120);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [inputMode, setInputMode] = useState("text");
  const [usedVoice, setUsedVoice] = useState(false);

  // ── Refs so async callbacks always read the latest values ─────────────────
  const timerRef = useRef(null);
  const questionsRef = useRef([]); // always up-to-date copy of questions
  const resultsRef = useRef([]); // always up-to-date copy of results
  const textAnswerRef = useRef(""); // always up-to-date copy of textAnswer
  const inputModeRef = useRef("text");
  const difficultyRef = useRef("Mid-Level");
  const usedVoiceRef = useRef(false);

  const voice = useVoiceRecorder();

  // Keep refs in sync with state
  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);
  useEffect(() => {
    resultsRef.current = results;
  }, [results]);
  useEffect(() => {
    textAnswerRef.current = textAnswer;
  }, [textAnswer]);
  useEffect(() => {
    inputModeRef.current = inputMode;
  }, [inputMode]);
  useEffect(() => {
    difficultyRef.current = difficulty;
  }, [difficulty]);
  useEffect(() => {
    usedVoiceRef.current = usedVoice;
  }, [usedVoice]);
  useEffect(() => {
    setInputMode(hasSR() ? "voice" : "text");
  }, []);
  useEffect(
    () => () => {
      clearInterval(timerRef.current);
      window.speechSynthesis?.cancel();
    },
    []
  );

  const q = questions[qIdx];
  const totalQ = questions.length || 5;
  const timerColor =
    timer > 60 ? "var(--lime)" : timer > 30 ? "var(--orange)" : "var(--red)";

  // ── Fetch questions from Gemini or fall back to local bank ────────────────
  const getQuestions = async (diff) => {
    const key = sessionStorage.getItem("GEMINI_KEY") || "";
    if (key) {
      const prompt =
        `You are an expert technical interviewer. Generate exactly 5 ${diff}-level ${meta.label} interview questions.\n` +
        `Return ONLY a raw JSON array — no markdown, no backticks, no explanation, nothing else:\n` +
        `[{"id":1,"question":"Full question text here","category":"Category name","hint":"One short hint"}]`;
      const raw = await callGemini(prompt);
      const parsed = extractJSON(raw, "array");
      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log(`Gemini generated ${parsed.length} questions ✅`);
        return parsed;
      }
      console.warn("Gemini question parse failed — using local bank");
    }
    // Fallback
    const rKey = meta.label;
    const dKey =
      diff === "Junior" ? "Junior" : diff === "Senior" ? "Senior" : "Mid-Level";
    return (
      QUESTION_BANK[rKey]?.[dKey] || QUESTION_BANK["Full-Stack"]["Mid-Level"]
    );
  };

  // ── Analyze answer with Gemini or fall back to local scorer ───────────────
  const analyzeAnswer = async (questionText, answer, metrics) => {
    // Always use local scorer for empty/no answers — no point calling Gemini
    const trimmed = answer.trim();
    if (
      trimmed === "" ||
      trimmed === "(no answer given)" ||
      trimmed.split(/\s+/).filter(Boolean).length < 3
    ) {
      return scoreLocal(answer, metrics);
    }
    const key = sessionStorage.getItem("GEMINI_KEY") || "";
    if (key && trimmed.length > 5) {
      const prompt =
        `You are an expert ${meta.label} interviewer evaluating a ${difficultyRef.current}-level candidate.\n\n` +
        `Question: "${questionText}"\n` +
        `Candidate answer: "${answer}"\n` +
        `Word count: ${metrics.wordCount}, Confidence: ${metrics.confidence}%\n\n` +
        `Evaluate this specific answer carefully. Return ONLY a raw JSON object — no markdown, no backticks:\n` +
        `{"score":75,"grade":"B","confidence":72,"clarity":78,"technicalDepth":70,` +
        `"strengths":["Specific strength about this answer","Another specific strength"],` +
        `"improvements":["Specific improvement for this answer","Another improvement"],` +
        `"verdict":"One specific sentence about this particular answer.",` +
        `"keywordsHit":["keyword1","keyword2"],"missedConcepts":["concept1"]}`;

      const raw = await callGemini(prompt);
      const parsed = extractJSON(raw, "object");
      if (parsed && typeof parsed.score === "number") {
        console.log("Gemini feedback received ✅", parsed);
        return parsed;
      }
      console.warn("Gemini feedback parse failed — using local scorer");
    }
    return scoreLocal(answer, metrics);
  };

  // ── Submit answer — uses refs so timer callback always gets latest data ────
  const submitAns = async (questionObj) => {
    clearInterval(timerRef.current);
    if (voice.recording) voice.stopRec();
    setPhase("analyzing");

    const vm = voice.getMetrics();
    const voiceAns =
      voice.transcript + (voice.interim ? " " + voice.interim : "");
    const finalAns =
      (inputModeRef.current === "text" || !hasSR()
        ? textAnswerRef.current
        : voiceAns
      ).trim() || "(no answer given)";

    const words = finalAns.split(/\s+/).filter(Boolean).length;
    const metrics =
      hasSR() && inputModeRef.current === "voice"
        ? vm
        : {
            wordCount: words,
            pace: Math.min(150, words * 4),
            confidence: Math.min(85, 50 + words * 0.8),
            fillerCount: 0,
          };

    const feedback = await analyzeAnswer(
      questionObj.question,
      finalAns,
      metrics
    );
    const newResult = {
      question: questionObj,
      answer: finalAns,
      metrics,
      feedback,
    };

    setCurResult(newResult);
    const newResults = [...resultsRef.current, newResult];
    setResults(newResults);
    resultsRef.current = newResults;

    const currentIdx = questionsRef.current.indexOf(questionObj);
    const isLast = currentIdx + 1 >= questionsRef.current.length;

    if (isLast) {
      setPhase("done");
      if (onComplete)
        onComplete(newResults, difficultyRef.current, usedVoiceRef.current);
    } else {
      setPhase("feedback");
    }
  };

  // ── askQ — DEFINED BEFORE beginInterview (fixes "askQ is not defined") ─────
  const askQ = (qs, idx) => {
    setPhase("aiSpeaking");
    setAiSpeaking(true);
    setTextAnswer("");
    textAnswerRef.current = "";
    setTimer(120);
    voice.clearAll();

    const intro =
      idx === 0
        ? "Welcome to your interview. "
        : idx === qs.length - 1
        ? "Final question. "
        : "";

    const proceed = () => {
      setAiSpeaking(false);
      setPhase("userAnswering");
      if (inputModeRef.current === "voice" && hasSR()) {
        try {
          voice.startRec();
          setUsedVoice(true);
          usedVoiceRef.current = true;
        } catch {}
      }
      clearInterval(timerRef.current);
      setTimer(120);
      timerRef.current = setInterval(() => {
        setTimer((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            // Use ref to get current question at timeout time
            const currentQ = questionsRef.current[idx];
            if (currentQ) submitAns(currentQ);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    };

    hasTTS()
      ? speakText(`${intro}Question ${idx + 1}. ${qs[idx].question}`, proceed)
      : setTimeout(proceed, 600);
  };

  // ── Begin interview — calls askQ (which is now defined above) ─────────────
  const beginInterview = async (diff) => {
    setDifficulty(diff);
    difficultyRef.current = diff;
    setPhase("loading");
    setResults([]);
    resultsRef.current = [];
    setQIdx(0);
    const qs = await getQuestions(diff);
    setQuestions(qs);
    questionsRef.current = qs;
    askQ(qs, 0);
  };

  // ── Next question ─────────────────────────────────────────────────────────
  const nextQ = () => {
    const n = qIdx + 1;
    setQIdx(n);
    setCurResult(null);
    askQ(questionsRef.current, n);
  };

  // ══════════════════════════════════════════════════════════════════════════
  // INTRO SCREEN
  // ══════════════════════════════════════════════════════════════════════════
  if (phase === "intro")
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg)",
          color: "var(--text)",
          fontFamily: "'Outfit',sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <style>{G + CSS}</style>
        <div style={{ maxWidth: 500, width: "100%", textAlign: "center" }}>
          <div
            className="fu"
            style={{
              fontSize: 60,
              marginBottom: 14,
              animation: "float 3s ease-in-out infinite",
            }}
          >
            {meta.icon}
          </div>
          <h1
            className="fu"
            style={{
              animationDelay: ".06s",
              fontWeight: 800,
              fontSize: "clamp(24px,4vw,34px)",
              marginBottom: 8,
            }}
          >
            {meta.label} Interview
          </h1>
          <p
            className="fu"
            style={{
              animationDelay: ".1s",
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 12,
              color: "var(--muted)",
              marginBottom: 26,
            }}
          >
            AI-powered · Voice Analysis · 5 Questions
          </p>

          {/* Capability badges */}
          <div
            className="fu"
            style={{
              animationDelay: ".13s",
              display: "flex",
              justifyContent: "center",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 24,
            }}
          >
            <span
              style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 10,
                borderRadius: 20,
                padding: "5px 12px",
                background: hasTTS()
                  ? "rgba(127,255,0,.1)"
                  : "rgba(255,96,48,.1)",
                border: `1px solid ${
                  hasTTS() ? "rgba(127,255,0,.3)" : "rgba(255,96,48,.3)"
                }`,
                color: hasTTS() ? "var(--lime)" : "var(--orange)",
              }}
            >
              {hasTTS() ? "🔊 AI Voice On" : "🔊 AI Voice Off"}
            </span>
            <span
              style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 10,
                borderRadius: 20,
                padding: "5px 12px",
                background: hasSR()
                  ? "rgba(0,200,255,.1)"
                  : "rgba(255,150,0,.1)",
                border: `1px solid ${
                  hasSR() ? "rgba(0,200,255,.3)" : "rgba(255,150,0,.3)"
                }`,
                color: hasSR() ? "var(--cyan)" : "var(--orange)",
              }}
            >
              {hasSR() ? "🎙 Voice Input On" : "⌨️ Text Mode (Chrome for voice)"}
            </span>
            <span
              style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 10,
                borderRadius: 20,
                padding: "5px 12px",
                background: sessionStorage.getItem("GEMINI_KEY")
                  ? "rgba(0,200,255,.1)"
                  : "rgba(255,215,0,.1)",
                border: `1px solid ${
                  sessionStorage.getItem("GEMINI_KEY")
                    ? "rgba(0,200,255,.3)"
                    : "rgba(255,215,0,.3)"
                }`,
                color: sessionStorage.getItem("GEMINI_KEY")
                  ? "var(--cyan)"
                  : "var(--gold)",
              }}
            >
              {sessionStorage.getItem("GEMINI_KEY")
                ? "🤖 Gemini AI Active"
                : "📚 Using Question Bank"}
            </span>
          </div>

          {/* How it works */}
          <div
            className="fu"
            style={{
              animationDelay: ".16s",
              background: "var(--surface)",
              border: `1px solid rgba(${cr},.2)`,
              borderRadius: 16,
              padding: 20,
              marginBottom: 22,
              textAlign: "left",
            }}
          >
            {[
              [
                "🤖",
                hasTTS()
                  ? "AI speaks each question aloud"
                  : "Questions shown on screen",
              ],
              [
                "🎙",
                hasSR()
                  ? "Reply verbally — transcribed live"
                  : "Type your answers (text mode)",
              ],
              ["📊", "Confidence, clarity & pace scored per answer"],
              [
                "🧠",
                sessionStorage.getItem("GEMINI_KEY")
                  ? "Gemini AI evaluates your answers"
                  : "Smart local scoring gives real feedback",
              ],
            ].map(([ic, txt]) => (
              <div
                key={txt}
                style={{ display: "flex", gap: 10, marginBottom: 10 }}
              >
                <span style={{ fontSize: 16, minWidth: 22 }}>{ic}</span>
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--muted)",
                    lineHeight: 1.6,
                  }}
                >
                  {txt}
                </p>
              </div>
            ))}
          </div>

          {/* Difficulty selector */}
          <div
            className="fu"
            style={{ animationDelay: ".2s", marginBottom: 18 }}
          >
            <p
              style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 10,
                color: "var(--muted)",
                letterSpacing: 2,
                marginBottom: 10,
              }}
            >
              SELECT DIFFICULTY
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              {["Junior", "Mid-Level", "Senior"].map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  style={{
                    flex: 1,
                    background:
                      difficulty === d ? `rgba(${cr},.12)` : "var(--surface)",
                    border: `1px solid ${
                      difficulty === d ? color : "var(--border2)"
                    }`,
                    borderRadius: 12,
                    padding: "13px",
                    color: difficulty === d ? color : "var(--muted)",
                    fontFamily: "'Outfit',sans-serif",
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: "pointer",
                    transition: "all .2s",
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div
            className="fu"
            style={{ animationDelay: ".24s", display: "flex", gap: 10 }}
          >
            <button
              onClick={onExit}
              style={{
                flex: 1,
                background: "transparent",
                border: "1px solid var(--border2)",
                borderRadius: 12,
                padding: "13px",
                color: "var(--muted)",
                fontFamily: "'Outfit',sans-serif",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              ← Back
            </button>
            <button
              onClick={() => beginInterview(difficulty)}
              style={{
                flex: 2,
                background: `linear-gradient(135deg,${color},${color}aa)`,
                border: "none",
                borderRadius: 12,
                padding: "13px",
                color: "#020408",
                fontFamily: "'Outfit',sans-serif",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                boxShadow: `0 4px 20px rgba(${cr},.3)`,
              }}
            >
              Begin Interview →
            </button>
          </div>
        </div>
      </div>
    );

  // ══════════════════════════════════════════════════════════════════════════
  // INTERVIEW SCREEN
  // ══════════════════════════════════════════════════════════════════════════
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

      {/* Top bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 22px",
          background: "rgba(8,13,20,.96)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid var(--border2)",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => {
              window.speechSynthesis?.cancel();
              voice.stopRec();
              onExit();
            }}
            style={{
              background: "transparent",
              border: "1px solid var(--border2)",
              borderRadius: 8,
              padding: "5px 12px",
              color: "var(--muted)",
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 10,
              cursor: "pointer",
            }}
          >
            ← Exit
          </button>
          <span
            style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 11,
              color,
            }}
          >
            {meta.label.toUpperCase()}
          </span>
          <span
            style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 10,
              color: "var(--muted)",
            }}
          >
            · {difficulty}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span
            style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 11,
              color: "var(--muted)",
            }}
          >
            Q {qIdx + 1} / {totalQ}
          </span>
          {phase === "userAnswering" && (
            <span
              style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontWeight: 700,
                fontSize: 14,
                color: timerColor,
                minWidth: 44,
                textAlign: "right",
              }}
            >
              {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, "0")}
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 2, background: "var(--border)" }}>
        <div
          style={{
            height: "100%",
            width: `${totalQ ? (qIdx / totalQ) * 100 : 0}%`,
            background: color,
            transition: "width .6s ease",
          }}
        />
      </div>

      <div
        style={{ maxWidth: 700, margin: "0 auto", padding: "28px 20px 60px" }}
      >
        {/* ── Loading ── */}
        {phase === "loading" && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div
              style={{
                width: 46,
                height: 46,
                border: `3px solid var(--border2)`,
                borderTop: `3px solid ${color}`,
                borderRadius: "50%",
                animation: "spin .8s linear infinite",
                margin: "0 auto 18px",
              }}
            />
            <p
              style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 12,
                color: "var(--muted)",
              }}
            >
              Generating your questions…
            </p>
            <p
              style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 10,
                color: "var(--dim)",
                marginTop: 6,
              }}
            >
              {sessionStorage.getItem("GEMINI_KEY")
                ? "Asking Gemini AI…"
                : "Loading question bank…"}
            </p>
          </div>
        )}

        {/* ── AI Speaking ── */}
        {phase === "aiSpeaking" && (
          <div
            className="fu"
            style={{ textAlign: "center", padding: "40px 20px" }}
          >
            <div
              style={{
                width: 92,
                height: 92,
                borderRadius: "50%",
                margin: "0 auto 22px",
                background: `rgba(${cr},.1)`,
                border: `2px solid rgba(${cr},.35)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 40,
                animation: "aiPulse 2s ease-in-out infinite",
              }}
            >
              🤖
            </div>
            <p
              style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 11,
                color,
                letterSpacing: 2,
                marginBottom: 12,
              }}
            >
              {hasTTS() ? "AI IS SPEAKING…" : "READ THE QUESTION"}
            </p>
            <AnimBars active={aiSpeaking} color={color} />
            <div
              style={{
                marginTop: 22,
                background: "var(--surface)",
                border: `1px solid rgba(${cr},.2)`,
                borderRadius: 14,
                padding: 20,
                maxWidth: 460,
                margin: "22px auto 0",
                textAlign: "left",
              }}
            >
              <p
                style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.7 }}
              >
                {q?.question}
              </p>
            </div>
          </div>
        )}

        {/* ── User Answering ── */}
        {phase === "userAnswering" && q && (
          <div>
            {/* Category + Question */}
            <div className="fu" style={{ marginBottom: 18 }}>
              <span
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 10,
                  color,
                  background: `rgba(${cr},.1)`,
                  border: `1px solid rgba(${cr},.25)`,
                  borderRadius: 20,
                  padding: "4px 12px",
                  letterSpacing: 1,
                }}
              >
                {q.category}
              </span>
              <h2
                style={{
                  fontWeight: 700,
                  fontSize: "clamp(16px,2.5vw,21px)",
                  lineHeight: 1.5,
                  marginTop: 11,
                }}
              >
                {q.question}
              </h2>
            </div>

            {/* Mode toggle */}
            {hasSR() && (
              <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                {[
                  { id: "voice", icon: "🎙", l: "Voice" },
                  { id: "text", icon: "⌨️", l: "Type" },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      if (m.id === "text") {
                        if (voice.recording) voice.stopRec();
                        setInputMode("text");
                        inputModeRef.current = "text";
                      } else {
                        setInputMode("voice");
                        inputModeRef.current = "voice";
                        if (!voice.recording)
                          try {
                            voice.startRec();
                            setUsedVoice(true);
                            usedVoiceRef.current = true;
                          } catch {}
                      }
                    }}
                    style={{
                      padding: "7px 18px",
                      borderRadius: 20,
                      border: `1.5px solid ${
                        inputMode === m.id ? color : "var(--border2)"
                      }`,
                      background:
                        inputMode === m.id ? `rgba(${cr},.1)` : "transparent",
                      color: inputMode === m.id ? color : "var(--muted)",
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 11,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      transition: "all .2s",
                    }}
                  >
                    <span>{m.icon}</span>
                    <span>{m.l}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Voice panel */}
            {inputMode === "voice" && hasSR() && (
              <div
                style={{
                  background: "var(--surface)",
                  border: `1.5px solid ${
                    voice.recording ? `rgba(${cr},.45)` : "var(--border2)"
                  }`,
                  borderRadius: 18,
                  padding: "20px 16px 16px",
                  marginBottom: 14,
                  transition: "border-color .3s",
                }}
              >
                <div style={{ marginBottom: 14 }}>
                  <AnimBars active={voice.recording} color={color} count={26} />
                </div>

                {/* Mic button */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    position: "relative",
                    marginBottom: 12,
                    height: 86,
                  }}
                >
                  {voice.recording &&
                    [0, 1].map((i) => (
                      <div
                        key={i}
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%,-50%)",
                          width: 70,
                          height: 70,
                          borderRadius: "50%",
                          border: `2px solid rgba(${cr},${0.55 - i * 0.22})`,
                          animation: `ripple ${
                            1.3 + i * 0.55
                          }s ease-out infinite`,
                          animationDelay: `${i * 0.3}s`,
                        }}
                      />
                    ))}
                  <button
                    onClick={() =>
                      voice.recording ? voice.stopRec() : voice.startRec()
                    }
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%,-50%)",
                      width: 70,
                      height: 70,
                      borderRadius: "50%",
                      border: "none",
                      cursor: "pointer",
                      background: voice.recording
                        ? `rgba(${cr},.18)`
                        : "var(--surface2)",
                      fontSize: 26,
                      outline: `3px solid ${
                        voice.recording ? color : "var(--border2)"
                      }`,
                      outlineOffset: 3,
                      transition: "all .2s",
                      animation: voice.recording
                        ? "aiPulse 2s ease-in-out infinite"
                        : "none",
                    }}
                  >
                    {voice.recording ? "⏹" : "🎙"}
                  </button>
                </div>

                <div
                  style={{
                    textAlign: "center",
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 10,
                    color: voice.recording ? color : "var(--muted)",
                    letterSpacing: 2,
                    marginBottom: 10,
                    transition: "color .3s",
                  }}
                >
                  {voice.recording ? (
                    <>
                      <span
                        style={{
                          animation: "blink 1s infinite",
                          display: "inline-block",
                        }}
                      >
                        ●
                      </span>{" "}
                      RECORDING — tap to stop
                    </>
                  ) : (
                    "TAP MIC TO SPEAK"
                  )}
                </div>

                {/* Mic error */}
                {voice.micError && (
                  <div
                    style={{
                      background: "rgba(255,96,48,.1)",
                      border: "1px solid rgba(255,96,48,.25)",
                      borderRadius: 10,
                      padding: "10px 14px",
                      fontSize: 12,
                      color: "var(--orange)",
                      marginBottom: 10,
                      lineHeight: 1.6,
                    }}
                  >
                    ⚠️ {voice.micError}
                    <br />
                    <button
                      onClick={() => {
                        setInputMode("text");
                        inputModeRef.current = "text";
                      }}
                      style={{
                        marginTop: 7,
                        background: `rgba(${cr},.1)`,
                        border: `1px solid rgba(${cr},.3)`,
                        borderRadius: 8,
                        padding: "4px 12px",
                        color,
                        fontFamily: "'JetBrains Mono',monospace",
                        fontSize: 10,
                        cursor: "pointer",
                      }}
                    >
                      Switch to text →
                    </button>
                  </div>
                )}

                {/* Live transcript */}
                <div
                  style={{
                    background: "var(--surface2)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    padding: "11px 14px",
                    minHeight: 70,
                    fontSize: 13,
                    lineHeight: 1.8,
                  }}
                >
                  {!voice.transcript && !voice.interim ? (
                    <span style={{ color: "var(--dim)", fontStyle: "italic" }}>
                      {voice.recording
                        ? "Listening — speak clearly…"
                        : "Your answer will appear here"}
                    </span>
                  ) : (
                    <>
                      <span style={{ color: "var(--text)" }}>
                        {voice.transcript}
                      </span>
                      {voice.interim && (
                        <span
                          style={{ color: "var(--muted)", fontStyle: "italic" }}
                        >
                          {" "}
                          {voice.interim}
                        </span>
                      )}
                      {voice.recording && (
                        <span
                          style={{
                            display: "inline-block",
                            width: 2,
                            height: 14,
                            background: color,
                            marginLeft: 3,
                            verticalAlign: "middle",
                            animation: "blink .8s step-end infinite",
                          }}
                        />
                      )}
                    </>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 7,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 10,
                      color: "var(--dim)",
                    }}
                  >
                    {
                      (voice.transcript + " " + voice.interim)
                        .trim()
                        .split(/\s+/)
                        .filter(Boolean).length
                    }{" "}
                    words
                  </span>
                  {(voice.transcript || voice.interim) && (
                    <button
                      onClick={voice.clearAll}
                      style={{
                        background: "none",
                        border: "none",
                        fontFamily: "'JetBrains Mono',monospace",
                        fontSize: 10,
                        color: "var(--muted)",
                        cursor: "pointer",
                      }}
                    >
                      🗑 Clear
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Text panel */}
            {(inputMode === "text" || !hasSR()) && (
              <div style={{ marginBottom: 14 }}>
                {!hasSR() && (
                  <div
                    style={{
                      background: "rgba(255,150,0,.07)",
                      border: "1px solid rgba(255,150,0,.2)",
                      borderRadius: 10,
                      padding: "10px 14px",
                      fontSize: 12,
                      color: "var(--orange)",
                      marginBottom: 10,
                      lineHeight: 1.6,
                    }}
                  >
                    🌐 Voice input needs <b>Chrome or Edge</b>. Type below — AI
                    analysis still works fully.
                  </div>
                )}
                <textarea
                  value={textAnswer}
                  onChange={(e) => {
                    setTextAnswer(e.target.value);
                    textAnswerRef.current = e.target.value;
                  }}
                  placeholder="Type your answer here… be specific and include real examples."
                  style={{
                    width: "100%",
                    minHeight: 155,
                    background: "var(--surface)",
                    border: "1px solid var(--border2)",
                    borderRadius: 14,
                    padding: 16,
                    color: "var(--text)",
                    fontFamily: "'Outfit',sans-serif",
                    fontSize: 14,
                    lineHeight: 1.7,
                    resize: "vertical",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <div
                  style={{
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 10,
                    color: "var(--muted)",
                    marginTop: 5,
                    textAlign: "right",
                  }}
                >
                  {textAnswer.split(/\s+/).filter(Boolean).length} words
                </div>
              </div>
            )}

            {/* Hint */}
            <div
              style={{
                background: `rgba(${cr},.05)`,
                border: `1px solid rgba(${cr},.15)`,
                borderRadius: 10,
                padding: "9px 14px",
                fontSize: 12,
                color,
                marginBottom: 14,
                lineHeight: 1.6,
              }}
            >
              💡 <b>Hint:</b> {q.hint}
            </div>

            {/* Submit */}
            <button
              onClick={() => submitAns(q)}
              style={{
                width: "100%",
                background: `linear-gradient(135deg,${color},${color}bb)`,
                border: "none",
                borderRadius: 12,
                padding: "15px",
                color: "#020408",
                fontFamily: "'Outfit',sans-serif",
                fontWeight: 700,
                fontSize: 15,
                cursor: "pointer",
                boxShadow: `0 4px 20px rgba(${cr},.3)`,
              }}
            >
              Submit Answer →
            </button>
          </div>
        )}

        {/* ── Analyzing ── */}
        {phase === "analyzing" && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div
              style={{
                fontSize: 48,
                marginBottom: 14,
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            >
              🤖
            </div>
            <p
              style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 12,
                color: "var(--muted)",
                marginBottom: 6,
              }}
            >
              Analyzing your response…
            </p>
            <p
              style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 10,
                color: "var(--dim)",
              }}
            >
              {sessionStorage.getItem("GEMINI_KEY")
                ? "Gemini AI is evaluating…"
                : "Scoring your answer…"}
            </p>
            <div
              style={{
                marginTop: 22,
                display: "flex",
                justifyContent: "center",
                gap: 6,
              }}
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: color,
                    animation: `pulse .8s ${i * 0.15}s ease-in-out infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Per-question feedback ── */}
        {phase === "feedback" && curResult && (
          <div className="fu">
            <div style={{ textAlign: "center", marginBottom: 22 }}>
              <div
                style={{
                  display: "inline-flex",
                  gap: 18,
                  background: "var(--surface)",
                  border: "1px solid var(--border2)",
                  borderRadius: 20,
                  padding: "18px 24px",
                  flexWrap: "wrap",
                  justifyContent: "center",
                }}
              >
                <Ring
                  value={curResult.feedback.score}
                  label="Score"
                  color={color}
                />
                <Ring
                  value={curResult.feedback.confidence}
                  label="Confidence"
                  color="var(--purple)"
                />
                <Ring
                  value={curResult.feedback.clarity}
                  label="Clarity"
                  color="var(--lime)"
                />
                <Ring
                  value={curResult.feedback.technicalDepth}
                  label="Depth"
                  color="var(--orange)"
                />
              </div>
              <p
                style={{
                  marginTop: 10,
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 11,
                  color: "var(--muted)",
                  fontStyle: "italic",
                }}
              >
                "{curResult.feedback.verdict}"
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  background: "rgba(127,255,0,.05)",
                  border: "1px solid rgba(127,255,0,.15)",
                  borderRadius: 12,
                  padding: 14,
                }}
              >
                <div
                  style={{
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 9,
                    color: "var(--lime)",
                    marginBottom: 8,
                    letterSpacing: 1,
                  }}
                >
                  ✅ STRENGTHS
                </div>
                {curResult.feedback.strengths?.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: 12,
                      color: "var(--muted)",
                      marginBottom: 5,
                      lineHeight: 1.6,
                    }}
                  >
                    • {s}
                  </div>
                ))}
              </div>
              <div
                style={{
                  background: "rgba(255,96,48,.05)",
                  border: "1px solid rgba(255,96,48,.15)",
                  borderRadius: 12,
                  padding: 14,
                }}
              >
                <div
                  style={{
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 9,
                    color: "var(--orange)",
                    marginBottom: 8,
                    letterSpacing: 1,
                  }}
                >
                  📈 IMPROVE
                </div>
                {curResult.feedback.improvements?.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: 12,
                      color: "var(--muted)",
                      marginBottom: 5,
                      lineHeight: 1.6,
                    }}
                  >
                    • {s}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={nextQ}
              style={{
                width: "100%",
                background: `linear-gradient(135deg,${color},${color}bb)`,
                border: "none",
                borderRadius: 12,
                padding: "15px",
                color: "#020408",
                fontFamily: "'Outfit',sans-serif",
                fontWeight: 700,
                fontSize: 15,
                cursor: "pointer",
              }}
            >
              Next Question → ({qIdx + 2}/{totalQ})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
