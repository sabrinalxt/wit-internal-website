import { useState } from "react";
import { Link } from "react-router-dom";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO(login-signup-wiring): hook up to the real auth endpoint
    // For now, just log the values
    console.log({ email, password });
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-2 py-10">
      <div className="bg-white rounded-xl shadow-soft border border-slate-100 w-full max-w-md px-8 py-10">
        <div style={styles.header}>
          <h2 className="accent-purple text-2xl font-bold mb-1">Welcome back!</h2>
          <p style={styles.subtitle}>Sign in to continue</p>
        </div>

        <form onSubmit={onSubmit} style={styles.form}>
          <label style={styles.label} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="name@nus.edu.sg"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            required
            autoComplete="email"
          />

          <label style={styles.label} htmlFor="password">
            Password
          </label>
          <div style={styles.passwordRow}>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ ...styles.input, paddingRight: 44 }}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              style={styles.eyeButton}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <div style={styles.rowBetween}>
            <a href="#" style={styles.link}>
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-purple-accent text-white font-semibold py-3 mt-2 hover:brightness-105 transition"
          >
            Login
          </button>
        </form>

        <div style={styles.footer}>
          <span>Don’t have an account?</span>
          <Link to="/signup" style={{ ...styles.link, marginLeft: 6 }}>
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    minHeight: "100vh",
    width: "100vw",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    background:
      "radial-gradient(1200px 600px at -10% -10%, rgba(186, 160, 255, 0.35), transparent),\
       radial-gradient(800px 500px at 110% 10%, rgba(153, 233, 255, 0.35), transparent),\
       linear-gradient(180deg, #efe6ff 0%, #e6dbff 100%)",
    color: "#171325",
    boxSizing: "border-box",
  },
  card: {
    width: "100%",
    maxWidth: 560,
    background: "rgba(255, 255, 255, 0.65)",
    border: "1px solid rgba(10, 0, 40, 0.06)",
    boxShadow: "0 20px 50px rgba(59, 35, 120, 0.15)",
    backdropFilter: "blur(10px)",
    borderRadius: 16,
    padding: 32,
    marginTop: -40,
  },
  header: {
    textAlign: "center" as const,
    marginBottom: 18,
  },
  logo: {
    width: 72,
    height: 72,
    objectFit: "contain" as const,
    display: "block",
    margin: "0 auto 10px auto",
  },
  title: {
    margin: "0 0 6px 0",
    fontSize: 28,
    letterSpacing: 0.2,
  },
  subtitle: {
    margin: 0,
    color: "#5c5b73",
  },
  form: {
    marginTop: 16,
    display: "flex",
    flexDirection: "column" as const,
    gap: 10,
  },
  label: {
    fontSize: 13,
    color: "#4b4763",
  },
  input: {
    width: "100%",
    background: "#faf8ff",
    color: "#171325",
    border: "1px solid #d7cff7",
    borderRadius: 12,
    padding: "14px 16px",
    outline: "none",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)",
    boxSizing: "border-box",
  },
  passwordRow: {
    position: "relative" as const,
    width: "100%",
  },
  eyeButton: {
    position: "absolute" as const,
    right: 10,
    top: "50%",
    transform: "translateY(-50%)",
    height: 28,
    padding: "0 8px",
    background: "transparent",
    color: "#6f6b8a",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },
  rowBetween: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  link: {
    color: "#5a34ea",
    textDecoration: "none",
  },
  primaryButton: {
    marginTop: 10,
    width: "100%",
    background: "linear-gradient(90deg, #9b6dff 0%, #5ee2ff 100%)",
    color: "#1a1340",
    fontWeight: 700,
    border: "none",
    borderRadius: 12,
    padding: "12px 14px",
    cursor: "pointer",
  },
  footer: {
    marginTop: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    color: "#5c5b73",
  },
};
