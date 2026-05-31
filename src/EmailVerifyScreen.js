import { useState } from "react";
import { auth } from "./firebase";
import { signOut, sendEmailVerification } from "firebase/auth";
import { COLORS } from "./shared";

export default function EmailVerifyScreen({ firebaseUser, onVerified }) {
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState("");

  const handleCheck = async () => {
    if (checking) return;
    setChecking(true);
    setError("");
    try {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        onVerified();
      } else {
        setError("Email not yet verified — please check your inbox and click the link.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setChecking(false);
  };

  const handleResend = async () => {
    if (resending) return;
    setResending(true);
    setResent(false);
    setError("");
    try {
      await sendEmailVerification(auth.currentUser);
      setResent(true);
    } catch {
      setError("Couldn't resend — please try again.");
    }
    setResending(false);
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", padding: 24, background: COLORS.bg,
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>📬</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: COLORS.text, marginBottom: 10 }}>
            Verify your email
          </div>
          <p style={{ color: COLORS.textMuted, fontSize: 14, margin: 0, lineHeight: 1.7 }}>
            We sent a link to{" "}
            <span style={{ color: COLORS.text, fontWeight: 600 }}>{firebaseUser.email}</span>.
            <br />Click it, then tap the button below.
          </p>
        </div>

        <div style={{
          background: COLORS.card, border: `1px solid ${COLORS.border}`,
          borderRadius: 20, padding: 32, display: "flex", flexDirection: "column", gap: 12,
        }}>
          {error && (
            <div style={{
              padding: "10px 14px", borderRadius: 10,
              background: `${COLORS.red}28`, border: `1px solid ${COLORS.red}55`,
              color: COLORS.red, fontSize: 13,
            }}>
              {error}
            </div>
          )}

          {resent && !error && (
            <div style={{
              padding: "10px 14px", borderRadius: 10,
              background: `${COLORS.green}18`, border: `1px solid ${COLORS.green}55`,
              color: COLORS.green, fontSize: 13,
            }}>
              Verification email resent — check your inbox.
            </div>
          )}

          <button onClick={handleCheck} disabled={checking} style={{
            width: "100%", padding: "13px", borderRadius: 12, border: "none",
            background: COLORS.accent, color: "#000",
            cursor: checking ? "not-allowed" : "pointer",
            fontSize: 14, fontWeight: 700,
            opacity: checking ? 0.7 : 1,
          }}>
            {checking ? "Checking..." : "I've verified my email →"}
          </button>

          <button onClick={handleResend} disabled={resending} style={{
            width: "100%", padding: "13px", borderRadius: 12,
            border: `1px solid ${COLORS.border}`, background: "transparent",
            color: COLORS.text, cursor: resending ? "not-allowed" : "pointer",
            fontSize: 14, fontWeight: 500,
            opacity: resending ? 0.6 : 1,
          }}>
            {resending ? "Resending..." : "Resend verification email"}
          </button>

          <button onClick={() => signOut(auth)} style={{
            background: "none", border: "none", color: COLORS.textMuted,
            cursor: "pointer", fontSize: 12, textDecoration: "underline", marginTop: 4,
          }}>
            Wrong account? Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
