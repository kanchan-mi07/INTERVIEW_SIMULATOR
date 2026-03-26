import { useState, useEffect } from "react";

const G = `@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');`;
const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#020408;--surface:#080d14;--surface2:#0d1520;
  --border:#0f1e2e;--border2:#162435;
  --cyan:#00C8FF;--lime:#7FFF00;--orange:#FF6030;
  --text:#e2eaf4;--muted:#3a5570;--dim:#1a2d3f;
}
body{background:var(--bg);color:var(--text);font-family:'Outfit',sans-serif}
input:-webkit-autofill{
  -webkit-box-shadow:0 0 0 60px var(--surface) inset!important;
  -webkit-text-fill-color:var(--text)!important;
}
::-webkit-scrollbar{width:3px}
::-webkit-scrollbar-thumb{background:var(--dim);border-radius:2px}
@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes scan{0%{top:-2px}100%{top:100%}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
.fu{animation:fadeUp .5s ease both}

/* ── Responsive ── */
@media(max-width:700px){
  .auth-left{display:none!important}
  .auth-right{padding:28px 18px!important}
  .auth-layout{flex-direction:column!important}
}
`;

const API = "https://interview-simulator-1-6glc.onrender.com/api";

function Spinner({ color = "#020408" }) {
  return (
    <div
      style={{
        width: 18,
        height: 18,
        border: "2px solid rgba(255,255,255,.25)",
        borderTop: `2px solid ${color}`,
        borderRadius: "50%",
        animation: "spin .7s linear infinite",
        display: "inline-block",
      }}
    />
  );
}

function ProgressBar({ value }) {
  return (
    <div
      style={{
        height: 4,
        background: "var(--surface2)",
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${value}%`,
          borderRadius: 2,
          background: "linear-gradient(90deg,var(--cyan),var(--lime))",
          transition: "width .05s linear",
        }}
      />
    </div>
  );
}

function Field({
  label,
  type,
  placeholder,
  delay,
  value,
  onChange,
  error,
  onSubmit,
}) {
  const [vis, setVis] = useState(false);
  const [foc, setFoc] = useState(false);
  const isP = type === "password";
  return (
    <div
      style={{ marginBottom: 18, animation: `fadeUp .5s ${delay}s ease both` }}
    >
      <label
        style={{
          display: "block",
          fontFamily: "'JetBrains Mono',monospace",
          fontSize: 10,
          letterSpacing: 2,
          color: error ? "var(--orange)" : "var(--muted)",
          marginBottom: 7,
          textTransform: "uppercase",
        }}
      >
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          type={isP && vis ? "text" : type || "text"}
          value={value}
          onChange={onChange}
          onKeyDown={(e) => e.key === "Enter" && onSubmit?.()}
          placeholder={placeholder}
          onFocus={() => setFoc(true)}
          onBlur={() => setFoc(false)}
          style={{
            width: "100%",
            background: "var(--surface)",
            border: `1px solid ${
              error ? "var(--orange)" : foc ? "var(--cyan)" : "var(--border2)"
            }`,
            borderRadius: 10,
            padding: `13px ${isP ? "46px" : "16px"} 13px 16px`,
            fontFamily: "'Outfit',sans-serif",
            fontSize: 14,
            color: "var(--text)",
            outline: "none",
            transition: "border-color .2s",
            boxShadow: foc ? "0 0 0 3px rgba(0,200,255,.07)" : "none",
            boxSizing: "border-box",
          }}
        />
        {isP && (
          <button
            type="button"
            onClick={() => setVis((v) => !v)}
            style={{
              position: "absolute",
              right: 14,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--muted)",
              fontSize: 16,
            }}
          >
            {vis ? "🙈" : "👁"}
          </button>
        )}
      </div>
      {error && (
        <p
          style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 10,
            color: "var(--orange)",
            marginTop: 5,
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}

export default function AuthPage({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loggedUser, setLoggedUser] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
    role: "",
  });
  const [errors, setErrors] = useState({});

  const ROLES = [
    "Frontend Dev",
    "Backend Dev",
    "Full-Stack",
    "Mobile Dev",
    "DevOps",
    "Data Engineer",
    "Product Manager",
  ];
  const setField = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const validate = () => {
    const e = {};
    if (mode === "login") {
      if (!form.email) e.email = "Email is required";
      if (!form.password) e.password = "Password is required";
    }
    if (mode === "signup" && step === 1) {
      if (!form.name.trim()) e.name = "Full name is required";
      if (!/\S+@\S+\.\S+/.test(form.email))
        e.email = "Enter a valid email address";
    }
    if (mode === "signup" && step === 2) {
      if (form.password.length < 8) e.password = "Minimum 8 characters";
      if (form.password !== form.confirm) e.confirm = "Passwords do not match";
      if (!form.role) e.role = "Please select your role";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    if (mode === "signup" && step === 1) {
      setStep(2);
      return;
    }
    setLoading(true);
    try {
      const endpoint =
        mode === "login" ? `${API}/auth/login` : `${API}/auth/signup`;
      const payload =
        mode === "login"
          ? { email: form.email, password: form.password }
          : {
              name: form.name.trim(),
              email: form.email,
              password: form.password,
              role: form.role || "Developer",
            };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Invalid JSON response");
      }

      if (!res.ok) {
        setErrors({ email: data.message || "Something went wrong" });
        setLoading(false);
        return;
      }

      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("auth_user", JSON.stringify(data.user));
      setLoggedUser(data.user);
      setLoading(false);
      setDone(true);
    } catch (err) {
      setErrors({ email: "Server not reachable or request failed" });
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!done || !loggedUser) return;
    const start = Date.now(),
      dur = 1400;
    const tick = () => {
      const p = Math.min(100, ((Date.now() - start) / dur) * 100);
      setProgress(p);
      if (p < 100) requestAnimationFrame(tick);
      else onLogin(loggedUser);
    };
    requestAnimationFrame(tick);
  }, [done]);

  const switchMode = () => {
    setMode((m) => (m === "login" ? "signup" : "login"));
    setStep(1);
    setErrors({});
  };

  if (done)
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <style>{G + CSS}</style>
        <div
          style={{
            textAlign: "center",
            animation: "fadeUp .5s ease both",
            padding: 24,
            maxWidth: 360,
            width: "100%",
          }}
        >
          <div
            style={{
              fontSize: 68,
              marginBottom: 18,
              animation: "float 2s ease-in-out infinite",
            }}
          >
            ✅
          </div>
          <h2 style={{ fontWeight: 800, fontSize: 28, marginBottom: 8 }}>
            {mode === "login" ? "Welcome back!" : "Account created!"}
          </h2>
          <p
            style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 12,
              color: "var(--muted)",
              marginBottom: 28,
            }}
          >
            Taking you to your dashboard…
          </p>
          <ProgressBar value={progress} />
          <p
            style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 10,
              color: "var(--dim)",
              marginTop: 8,
            }}
          >
            {Math.round(progress)}%
          </p>
        </div>
      </div>
    );

  return (
    <div
      className="auth-layout"
      style={{ minHeight: "100vh", background: "var(--bg)", display: "flex" }}
    >
      <style>{G + CSS}</style>

      {/* Left brand panel */}
      <div
        className="auth-left"
        style={{
          flex: "0 0 44%",
          background: "linear-gradient(155deg,#07111c,#020408)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "52px 44px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 20% 20%,rgba(0,200,255,.06),transparent 60%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            height: 1,
            background:
              "linear-gradient(90deg,transparent,rgba(0,200,255,.25),transparent)",
            animation: "scan 6s linear infinite",
            pointerEvents: "none",
          }}
        />

        <div
          className="fu"
          style={{ display: "flex", alignItems: "center", gap: 12 }}
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
              boxShadow: "0 0 24px rgba(0,200,255,.4)",
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
                letterSpacing: 2,
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
              RESUME PROJECT v2.0
            </div>
          </div>
        </div>

        <div>
          {(mode === "login"
            ? ["Welcome", "back,", "Candidate."]
            : ["Start your", "interview", "journey."]
          ).map((l, i) => (
            <div
              key={l}
              className="fu"
              style={{ animationDelay: `${0.1 + i * 0.08}s` }}
            >
              <h1
                style={{
                  fontFamily: "'Outfit',sans-serif",
                  fontWeight: 800,
                  fontSize: "clamp(28px,3.5vw,50px)",
                  lineHeight: 1.05,
                  color: i === 1 ? "var(--cyan)" : "var(--text)",
                  fontStyle: i === 1 ? "italic" : "normal",
                }}
              >
                {l}
              </h1>
            </div>
          ))}
          <div
            className="fu"
            style={{
              animationDelay: ".4s",
              display: "flex",
              gap: 28,
              marginTop: 32,
            }}
          >
            {[
              ["12k+", "Interviews"],
              ["96%", "Offer Rate"],
              ["60+", "Roles"],
            ].map(([n, l]) => (
              <div key={l}>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: 22,
                    color: "var(--cyan)",
                  }}
                >
                  {n}
                </div>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 9,
                    color: "var(--muted)",
                    letterSpacing: 1.5,
                    marginTop: 2,
                  }}
                >
                  {l}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className="fu"
          style={{
            animationDelay: ".6s",
            borderLeft: "2px solid var(--dim)",
            paddingLeft: 16,
          }}
        >
          <p
            style={{
              fontFamily: "'Outfit',sans-serif",
              fontStyle: "italic",
              fontSize: 13,
              color: "var(--muted)",
              lineHeight: 1.7,
            }}
          >
            "The expert in anything was once a beginner
            <br />
            who refused to give up."
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div
        className="auth-right"
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px",
          overflowY: "auto",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 200,
            height: 200,
            background:
              "radial-gradient(circle at top right,rgba(0,200,255,.05),transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Mobile logo (shown when left panel is hidden) */}
        <div
          style={{
            position: "absolute",
            top: 20,
            left: 20,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              background: "linear-gradient(135deg,#00C8FF,#0066ff)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
            }}
          >
            🧠
          </div>
          <span
            style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 11,
              color: "var(--cyan)",
              letterSpacing: 1.5,
            }}
          >
            INTERVIEWAI
          </span>
        </div>

        <div style={{ width: "100%", maxWidth: 420, marginTop: 40 }}>
          {/* Mode toggle */}
          <div
            style={{
              display: "flex",
              background: "var(--surface)",
              border: "1px solid var(--border2)",
              borderRadius: 12,
              padding: 4,
              marginBottom: 28,
            }}
          >
            {["login", "signup"].map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setStep(1);
                  setErrors({});
                }}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: 9,
                  border: "none",
                  cursor: "pointer",
                  background: mode === m ? "var(--surface2)" : "transparent",
                  color: mode === m ? "var(--cyan)" : "var(--muted)",
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 11,
                  letterSpacing: 1.5,
                  transition: "all .2s",
                  textTransform: "uppercase",
                }}
              >
                {m === "login" ? "Log In" : "Sign Up"}
              </button>
            ))}
          </div>

          {/* Heading */}
          <div style={{ marginBottom: 22 }}>
            <h2 style={{ fontWeight: 700, fontSize: 22, marginBottom: 6 }}>
              {mode === "login"
                ? "Sign in to continue"
                : step === 1
                ? "Create your account"
                : "Set up your profile"}
            </h2>
            <p
              style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 11,
                color: "var(--muted)",
              }}
            >
              {mode === "login"
                ? "Enter your credentials below."
                : step === 1
                ? "Step 1 of 2 — Basic info"
                : "Step 2 of 2 — Password & role"}
            </p>
          </div>

          {/* Step bar */}
          {mode === "signup" && (
            <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
              {[1, 2].map((s) => (
                <div
                  key={s}
                  style={{
                    flex: 1,
                    height: 3,
                    borderRadius: 2,
                    background: s <= step ? "var(--cyan)" : "var(--border2)",
                    transition: "background .3s",
                  }}
                />
              ))}
            </div>
          )}

          {/* Login fields */}
          {mode === "login" && (
            <>
              <Field
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                delay={0}
                value={form.email}
                error={errors.email}
                onChange={(e) => setField("email", e.target.value)}
                onSubmit={submit}
              />
              <Field
                label="Password"
                type="password"
                placeholder="••••••••"
                delay={0}
                value={form.password}
                error={errors.password}
                onChange={(e) => setField("password", e.target.value)}
                onSubmit={submit}
              />
              <div
                style={{ textAlign: "right", marginTop: -8, marginBottom: 22 }}
              >
                <button
                  style={{
                    background: "none",
                    border: "none",
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 11,
                    color: "var(--cyan)",
                    cursor: "pointer",
                  }}
                >
                  Forgot password?
                </button>
              </div>
            </>
          )}

          {/* Signup step 1 */}
          {mode === "signup" && step === 1 && (
            <>
              <Field
                label="Full Name"
                placeholder="Your full name"
                delay={0}
                value={form.name}
                error={errors.name}
                onChange={(e) => setField("name", e.target.value)}
                onSubmit={submit}
              />
              <Field
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                delay={0}
                value={form.email}
                error={errors.email}
                onChange={(e) => setField("email", e.target.value)}
                onSubmit={submit}
              />
            </>
          )}

          {/* Signup step 2 */}
          {mode === "signup" && step === 2 && (
            <>
              <Field
                label="Password"
                type="password"
                placeholder="Min 8 characters"
                delay={0}
                value={form.password}
                error={errors.password}
                onChange={(e) => setField("password", e.target.value)}
                onSubmit={submit}
              />
              <Field
                label="Confirm Password"
                type="password"
                placeholder="Repeat password"
                delay={0}
                value={form.confirm}
                error={errors.confirm}
                onChange={(e) => setField("confirm", e.target.value)}
                onSubmit={submit}
              />
              <div style={{ marginBottom: 20 }}>
                <label
                  style={{
                    display: "block",
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 10,
                    letterSpacing: 2,
                    color: errors.role ? "var(--orange)" : "var(--muted)",
                    marginBottom: 8,
                    textTransform: "uppercase",
                  }}
                >
                  Your Role
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {ROLES.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setField("role", r)}
                      style={{
                        background:
                          form.role === r
                            ? "rgba(0,200,255,.1)"
                            : "var(--surface)",
                        border: `1px solid ${
                          form.role === r ? "var(--cyan)" : "var(--border2)"
                        }`,
                        borderRadius: 8,
                        padding: "7px 13px",
                        fontFamily: "'Outfit',sans-serif",
                        fontSize: 12,
                        color: form.role === r ? "var(--cyan)" : "var(--muted)",
                        cursor: "pointer",
                        transition: "all .15s",
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                {errors.role && (
                  <p
                    style={{
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 10,
                      color: "var(--orange)",
                      marginTop: 6,
                    }}
                  >
                    {errors.role}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Submit */}
          <button
            onClick={submit}
            disabled={loading}
            style={{
              width: "100%",
              padding: "15px",
              border: "none",
              borderRadius: 12,
              cursor: loading ? "not-allowed" : "pointer",
              background: loading
                ? "var(--surface2)"
                : "linear-gradient(135deg,#00C8FF,#0066ff)",
              fontFamily: "'Outfit',sans-serif",
              fontWeight: 700,
              fontSize: 15,
              color: loading ? "var(--muted)" : "#020408",
              boxShadow: loading ? "none" : "0 4px 24px rgba(0,200,255,.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              transition: "all .2s",
            }}
          >
            {loading ? (
              <>
                <Spinner /> Processing…
              </>
            ) : mode === "login" ? (
              "Sign In →"
            ) : step === 1 ? (
              "Continue →"
            ) : (
              "Create Account →"
            )}
          </button>

          {mode === "signup" && step === 2 && (
            <div style={{ textAlign: "center", marginTop: 14 }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  background: "none",
                  border: "none",
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 11,
                  color: "var(--muted)",
                  cursor: "pointer",
                }}
              >
                ← Back to step 1
              </button>
            </div>
          )}

          <div style={{ textAlign: "center", marginTop: 22 }}>
            <span
              style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 11,
                color: "var(--muted)",
              }}
            >
              {mode === "login" ? "No account? " : "Have an account? "}
            </span>
            <button
              onClick={switchMode}
              style={{
                background: "none",
                border: "none",
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 11,
                color: "var(--cyan)",
                cursor: "pointer",
              }}
            >
              {mode === "login" ? "Sign up free" : "Log in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
