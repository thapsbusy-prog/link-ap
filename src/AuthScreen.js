import { useState, useEffect } from "react";
import logoImg from "./link-ap-logo.png";
import { auth } from "./firebase";
import {
  signInWithRedirect, getRedirectResult, GoogleAuthProvider,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
} from "firebase/auth";
import { COLORS, Input, TermsContent } from "./shared";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.7 2.5 30.2 0 24 0 14.7 0 6.7 5.4 2.7 13.3l7.8 6C12.4 13 17.8 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 6.9-10 6.9-17z"/>
      <path fill="#FBBC05" d="M10.5 28.6A14.8 14.8 0 0 1 9.5 24c0-1.6.3-3.2.8-4.6l-7.8-6A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.7 10.7l7.8-6.1z"/>
      <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.5-5.8c-2 1.4-4.6 2.2-7.7 2.2-6.2 0-11.5-4.2-13.4-9.9l-7.8 6C6.7 42.6 14.7 48 24 48z"/>
    </svg>
  );
}

export default function AuthScreen() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  useEffect(() => {
    setLoading(true);
    getRedirectResult(auth)
      .then(result => {
        if (!result) setLoading(false);
        // onAuthStateChanged drives state transitions on successful result
      })
      .catch(e => {
        setError(e.message.replace("Firebase: ", ""));
        setLoading(false);
      });
  }, []);

  const handleGoogle = async () => {
    setLoading(true);
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithRedirect(auth, provider);
    } catch (e) {
      setError(e.message.replace("Firebase: ", ""));
      setLoading(false);
    }
  };

  const handleEmail = async () => {
    setLoading(true);
    setError("");
    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (e) {
      setError(e.message.replace("Firebase: ", ""));
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", padding: 24, background: COLORS.bg,
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <img src={logoImg} alt="Link-Ap" style={{ width: 90, height: 90, objectFit: "contain", marginBottom: 8 }} />
          <div style={{ fontSize: 28, fontWeight: 800, color: COLORS.text, marginBottom: 4 }}>
            Link<span style={{ color: COLORS.accent }}>-Ap</span>
          </div>
          <p style={{ color: COLORS.textMuted, fontSize: 13, margin: 0 }}>Connect with the right people</p>
        </div>

        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 20, padding: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, color: COLORS.text }}>
            {mode === "login" ? "Welcome back" : "Create account"}
          </h2>

          <div style={{ marginBottom: 24 }}>
            <button onClick={handleGoogle} disabled={loading || (mode === "signup" && !termsChecked)} style={{
              width: "100%", padding: "13px", borderRadius: 12, border: `1px solid ${COLORS.border}`,
              background: "transparent", color: COLORS.text,
              cursor: loading || (mode === "signup" && !termsChecked) ? "not-allowed" : "pointer",
              fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              opacity: mode === "signup" && !termsChecked ? 0.45 : 1,
            }}>
              <GoogleIcon /> Continue with Google
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <div style={{ flex: 1, height: 1, background: COLORS.border }} />
            <span style={{ color: COLORS.textMuted, fontSize: 12 }}>or</span>
            <div style={{ flex: 1, height: 1, background: COLORS.border }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Input label="Email" value={email} onChange={setEmail} placeholder="you@example.com" type="email" autoComplete="new-password" />
            <Input label="Password" value={password} onChange={setPassword} placeholder="••••••••" type="password" autoComplete="new-password" />
          </div>

          {mode === "signup" && (
            <label style={{ display: "flex", gap: 10, alignItems: "flex-start", marginTop: 18, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={termsChecked}
                onChange={e => setTermsChecked(e.target.checked)}
                style={{ marginTop: 3, accentColor: COLORS.accent, width: 16, height: 16, flexShrink: 0, cursor: "pointer" }}
              />
              <span style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.6 }}>
                I have read and agree to the{" "}
                <span onClick={e => { e.preventDefault(); setShowTerms(true); }} style={{ color: COLORS.accent, cursor: "pointer", textDecoration: "underline" }}>Terms of Service</span>
                {" "}and{" "}
                <span onClick={e => { e.preventDefault(); setShowTerms(true); }} style={{ color: COLORS.accent, cursor: "pointer", textDecoration: "underline" }}>Privacy Policy</span>
              </span>
            </label>
          )}

          {error && (
            <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, background: `${COLORS.red}18`, color: COLORS.red, fontSize: 13 }}>
              {error}
            </div>
          )}

          {(() => {
            const canSubmit = email && password && (mode === "login" || termsChecked);
            return (
              <button onClick={handleEmail} disabled={loading || !canSubmit} style={{
                width: "100%", marginTop: 20, padding: "13px", borderRadius: 12, border: "none",
                background: canSubmit && !loading ? COLORS.accent : COLORS.border,
                color: canSubmit && !loading ? "#000" : COLORS.textMuted,
                cursor: canSubmit && !loading ? "pointer" : "not-allowed",
                fontSize: 14, fontWeight: 700,
              }}>
                {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
              </button>
            );
          })()}

          <p style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: COLORS.textMuted }}>
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <span onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setEmail(""); setPassword(""); setTermsChecked(false); }} style={{ color: COLORS.accent, cursor: "pointer" }}>
              {mode === "login" ? "Sign up" : "Sign in"}
            </span>
          </p>

          {mode === "login" && (
            <p style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: COLORS.textMuted, lineHeight: 1.7, borderTop: `1px solid ${COLORS.border}`, paddingTop: 16 }}>
              By signing in you are accepting our{" "}
              <span onClick={() => setShowTerms(true)} style={{ color: COLORS.accent, cursor: "pointer" }}>Terms of Service</span>
              {" "}and{" "}
              <span onClick={() => setShowTerms(true)} style={{ color: COLORS.accent, cursor: "pointer" }}>Privacy Policy</span>
            </p>
          )}
        </div>
      </div>

      {showTerms && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(0,0,0,0.88)", display: "flex", alignItems: "center",
          justifyContent: "center", zIndex: 100, padding: 20, boxSizing: "border-box",
        }}>
          <div style={{
            background: COLORS.card, border: `1px solid ${COLORS.border}`,
            borderRadius: 20, width: "100%", maxWidth: 460,
            maxHeight: "85dvh", display: "flex", flexDirection: "column",
          }}>
            <div style={{
              padding: "16px 20px", borderBottom: `1px solid ${COLORS.border}`,
              display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0,
            }}>
              <div style={{ fontWeight: 700, color: COLORS.text, fontSize: 16 }}>Terms of Service &amp; Privacy Policy</div>
              <button onClick={() => setShowTerms(false)} style={{ background: "none", border: "none", color: COLORS.textMuted, cursor: "pointer", fontSize: 24, lineHeight: 1 }}>×</button>
            </div>
            <div style={{ overflowY: "auto", padding: "16px 20px" }}>
              <TermsContent />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
