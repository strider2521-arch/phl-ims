import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

export default function LoginPage() {
  const { login } = useAuth();
  const { theme } = useTheme();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    await new Promise(r => setTimeout(r, 400));
    const ok = await login(username, password);
    if (!ok) {
      setError("Invalid username or password.");
      setLoading(false);
      return;
    }
    setLoading(false);
  };

  const border = `1px solid ${theme.border}`;

  return (
    <div style={{
      minHeight: "100vh", background: theme.bg, display: "flex",
      alignItems: "center", justifyContent: "center",
      fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{ width: 380, padding: "0 20px" }}>
        {/* Header */}
        <div style={{ marginBottom: 40, textAlign: "center" }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
            color: theme.accent, letterSpacing: 4, marginBottom: 12,
          }}>PRIME HELIX</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: theme.text, marginBottom: 8 }}>Inventory Management</div>
          <div style={{ fontSize: 13, color: theme.textSecondary }}>Authorised access only</div>
        </div>

        {/* Glass card */}
        <div style={{
          background: theme.glass, border: `1px solid ${theme.glassBorder}`,
          backdropFilter: "blur(16px)", borderRadius: 12, padding: "36px",
        }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 11, color: theme.textSecondary, letterSpacing: 1, marginBottom: 8 }}>USERNAME</label>
              <input
                value={username} onChange={e => setUsername(e.target.value)}
                style={{
                  width: "100%", padding: "10px 12px", background: theme.inputBg,
                  border: border, color: theme.text, fontSize: 13,
                  outline: "none", boxSizing: "border-box", fontFamily: "inherit",
                  borderRadius: 6, transition: "border 0.15s",
                }}
                placeholder="Enter username" autoFocus
              />
            </div>
            <div style={{ marginBottom: 28 }}>
              <label style={{ display: "block", fontSize: 11, color: theme.textSecondary, letterSpacing: 1, marginBottom: 8 }}>PASSWORD</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                style={{
                  width: "100%", padding: "10px 12px", background: theme.inputBg,
                  border: border, color: theme.text, fontSize: 13,
                  outline: "none", boxSizing: "border-box", fontFamily: "inherit",
                  borderRadius: 6,
                }}
                placeholder="••••••••"
              />
            </div>
            {error && (
              <div style={{
                fontSize: 12, color: theme.danger, marginBottom: 16,
                padding: "8px 12px", background: theme.dangerBg,
                border: `1px solid ${theme.dangerBorder}`, borderRadius: 6,
              }}>{error}</div>
            )}
            <button type="submit" disabled={loading} style={{
              width: "100%", padding: "12px", background: theme.accent, border: "none",
              color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
              opacity: loading ? 0.7 : 1, letterSpacing: 1, borderRadius: 6,
              transition: "opacity 0.15s",
            }}>
              {loading ? "VERIFYING..." : "SIGN IN"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
