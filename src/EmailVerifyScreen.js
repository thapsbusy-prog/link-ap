import { useState, useEffect, useRef } from "react";
import { auth } from "./firebase";
import { signOut, sendEmailVerification } from "firebase/auth";
import { COLORS } from "./shared";

const EXPIRY_SECS = 15 * 60;

function formatTime(s) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function MailIcon() {
  return (
    <div style={{
      width: 68, height: 68, borderRadius: 22,
      background: `${COLORS.accent}18`,
      border: `1px solid ${COLORS.accent}35`,
      display: "flex", alignItems: "center", justifyContent: "center",
      margin: "0 auto",
    }}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="4" width="20" height="16" rx="2"
          stroke={COLORS.accent} strokeWidth="1.8" strokeLinejoin="round"/>
        <polyline points="2,6 12,13 22,6"
          stroke={COLORS.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

function ClockIcon() {
  return (
    <div style={{
      width: 68, height: 68, borderRadius: 22,
      background: `${COLORS.red}12`,
      border: `1px solid ${COLORS.red}30`,
      display: "flex", alignItems: "center", justifyContent: "center",
      margin: "0 auto",
    }}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9"
          stroke={COLORS.red} strokeWidth="1.8"/>
        <polyline points="12,7 12,12 15.5,14.5"
          stroke={COLORS.red} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

export default function EmailVerifyScreen({ firebaseUser, onVerified }) {
  const expiresAt = useRef(Date.now() + EXPIRY_SECS * 1000);
  const [secondsLeft, setSecondsLeft] = useState(EXPIRY_SECS);
  const [expired, setExpired] = useState(false);
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((expiresAt.current - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0) {
        clearInterval(interval);
        setExpired(true);
        signOut(auth).catch(() => {});
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCheck = async () => {
    if (checking || expired) return;
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
      await sendEmailVerification(auth.currentUser, {
        url: window.location.origin,
        handleCodeInApp: true,
      });
      // Reset the 15-minute window
      expiresAt.current = Date.now() + EXPIRY_SECS * 1000;
      setSecondsLeft(EXPIRY_SECS);
      setExpired(false);
      setResent(true);
    } catch {
      setError("Couldn't resend — please try again.");
    }
    setResending(false);
  };

  if (expired) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", padding: 24, background: COLORS.bg,
      }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ marginBottom: 20 }}><ClockIcon /></div>
            <div style={{ fontSize: 26, fontWeight: 800, color: COLORS.text, marginBottom: 10 }}>
              Link expired
            </div>
            <p style={{ color: COLORS.textMuted, fontSize: 14, margin: 0, lineHeight: 1.7 }}>
              Your verification link has expired.<br />
              Request a new one to continue.
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
                New verification email sent — check your inbox.
              </div>
            )}
            <button onClick={handleResend} disabled={resending} style={{
              width: "100%", padding: "13px", borderRadius: 12, border: "none",
              background: COLORS.accent, color: "#000",
              cursor: resending ? "not-allowed" : "pointer",
              fontSize: 14, fontWeight: 700,
              opacity: resending ? 0.7 : 1,
            }}>
              {resending ? "Sending..." : "Send a new link"}
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

  const isWarning = secondsLeft <= 60;

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", padding: 24, background: COLORS.bg,
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ marginBottom: 20 }}><MailIcon /></div>
          <div style={{ fontSize: 26, fontWeight: 800, color: COLORS.text, marginBottom: 10 }}>
            Verify your email
          </div>
          <p style={{ color: COLORS.textMuted, fontSize: 14, margin: 0, lineHeight: 1.7 }}>
            We sent a link to{" "}
            <span style={{ color: COLORS.text, fontWeight: 600 }}>{firebaseUser.email}</span>.
            <br />Click it, then tap the button below.
          </p>
          <div style={{
            marginTop: 16, fontSize: 13,
            color: isWarning ? COLORS.red : COLORS.textMuted,
            fontWeight: isWarning ? 600 : 400,
            transition: "color 0.3s",
          }}>
            Link expires in{" "}
            <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatTime(secondsLeft)}</span>
          </div>
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
              New link sent — timer reset to 15:00.
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
