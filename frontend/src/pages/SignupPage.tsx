import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError, signUp } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { signIn } = useAuth();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    
    // Client side check (server also checks this)
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const result = await signUp(email, password);

      signIn(result);

      navigate("/");
    } catch (err) {
      if (err instanceof TypeError) {
        // throws a TypeError when the server can't be reached
        setError("Can't reach the server. Please try again later.");
      } else if (err instanceof ApiError && err.status === 403) {
        setError(`${err.message}. Please contact an admin.`);
      } else {
        setError(err instanceof Error ? err.message : "Sign up failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-[#d7cff7] bg-[#faf8ff] px-4 py-3 outline-none focus:border-[#5a34ea]";

  return (
    <div className="min-h-screen flex items-center justify-center px-2 py-10">
      <div className="bg-white rounded-xl shadow-soft border border-slate-100 w-full max-w-md px-8 py-10">
        <div className="text-center mb-4">
          <h2 className="accent-purple text-2xl font-bold mb-1">Create your account</h2>
          <p className="text-[#5c5b73]">Use admin approved email to sign in</p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-2.5">
          <label className="text-[13px] text-[#4b4763]" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="name@nus.edu.sg"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            required
            autoComplete="email"
          />

          <label className="text-[13px] text-[#4b4763]" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            required
            autoComplete="new-password"
          />

          <label className="text-[13px] text-[#4b4763]" htmlFor="confirm">
            Confirm password
          </label>
          <input
            id="confirm"
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={inputClass}
            required
            autoComplete="new-password"
          />

          <label className="flex items-center gap-2 text-sm text-[#4b4763]">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
            />
            Show passwords
          </label>

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-purple-accent text-white font-semibold py-3 mt-2 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <div className="mt-4 text-center text-[#5c5b73]">
          Already have an account?{" "}
          <Link to="/login" className="text-[#5a34ea]">
            Log in
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
    background: "rgba(255, 255, 255, 0.7)",
    border: "1px solid rgba(10, 0, 40, 0.06)",
    boxShadow: "0 20px 50px rgba(59, 35, 120, 0.15)",
    backdropFilter: "blur(10px)",
    borderRadius: 16,
    padding: 32,
    marginTop: -40,
  },
  header: { textAlign: "center" as const, marginBottom: 18 },
  title: { margin: "0 0 6px 0", fontSize: 28, letterSpacing: 0.2 },
  subtitle: { margin: 0, color: "#5c5b73" },
  form: { marginTop: 16, display: "flex", flexDirection: "column" as const, gap: 10 },
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  fieldCol: { display: "flex", flexDirection: "column" as const, gap: 6 },
  label: { fontSize: 13, color: "#4b4763" },
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
  passwordRow: { position: "relative" as const, width: "100%" },
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
};
