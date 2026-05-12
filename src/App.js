import { useState, useEffect, useRef } from "react";
import logoImg from "./link-ap-logo.png";
import { db, auth } from "./firebase";
import {
  collection, onSnapshot, query,
  orderBy, serverTimestamp, doc, setDoc, getDoc, deleteDoc,
  getDocs, startAfter, limit, where,
} from "firebase/firestore";
import {
  onAuthStateChanged, signInWithPopup, signOut,
  GoogleAuthProvider, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, sendPasswordResetEmail
} from "firebase/auth";
import PrivacyPolicy from './PrivacyPolicy';
import { COLORS, USER_COLORS, Avatar, Tag, Input, TextArea, Select, SkillsInput, LocationPin, LinkedInIcon, LOOKING_FOR_OPTIONS, TITLE_OPTIONS, PRONOUN_OPTIONS, LOOKING_FOR_QUESTIONS, OPEN_TO_OPTIONS, normalizeUrl, validateLinkedIn, linkedinNameMatches, getBringToTablePrompt } from "./shared";
import { Messages } from "./Messages";
import { Profile } from "./Profile";

function playBeep() {
  try {
    if (localStorage.getItem("linkap_sound") !== "true") return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    // Two-tone descending chime: D6 then A5
    [[1174, 0], [880, 0.18]].forEach(([freq, delay]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + delay + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.35);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.4);
    });
  } catch {}
}

function triggerVibrate() {
  try {
    if (localStorage.getItem("linkap_vibrate") !== "true") return;
    navigator.vibrate([100, 50, 100, 50, 100, 50, 100, 50, 100]);
  } catch {}
}
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


function AuthScreen() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const handleGoogle = async () => {
    setLoading(true);
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
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

function TermsContent() {
  return (
    <div style={{ fontSize: 12, color: COLORS.textMuted, lineHeight: 1.7 }}>
      <p style={{ color: COLORS.text, fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Link-Ap Terms of Use</p>
      <p style={{ marginBottom: 12 }}>Effective: 2 May 2026 &nbsp;|&nbsp; Applies worldwide</p>

      <p style={{ color: COLORS.text, fontWeight: 600, marginBottom: 4 }}>1. Acceptance</p>
      <p style={{ marginBottom: 12 }}>By creating an account you enter into a binding agreement with Link-Ap ("we", "us"). If you do not agree, do not use the platform.</p>

      <p style={{ color: COLORS.text, fontWeight: 600, marginBottom: 4 }}>2. Eligibility</p>
      <p style={{ marginBottom: 12 }}>You must be at least 18 years old and legally capable of forming a contract in your jurisdiction. By accepting, you confirm you meet these requirements. Use of Link-Ap is void where prohibited by local law.</p>

      <p style={{ color: COLORS.text, fontWeight: 600, marginBottom: 4 }}>3. Your Account</p>
      <p style={{ marginBottom: 12 }}>You are responsible for all activity under your account. Provide accurate, current information. Keep your credentials secure and do not share access. Notify us immediately of any unauthorised use.</p>

      <p style={{ color: COLORS.text, fontWeight: 600, marginBottom: 4 }}>4. Acceptable Use</p>
      <p style={{ marginBottom: 4 }}>You agree not to:</p>
      <p style={{ marginBottom: 12, paddingLeft: 8 }}>
        • Post false, misleading, or impersonating content<br />
        • Harass, threaten, or discriminate against any person<br />
        • Send unsolicited commercial messages (spam)<br />
        • Scrape, copy, or reverse-engineer the platform<br />
        • Use Link-Ap for unlawful purposes or to facilitate illegal activity<br />
        • Upload malware, viruses, or harmful code<br />
        • Circumvent security or access controls
      </p>

      <p style={{ color: COLORS.text, fontWeight: 600, marginBottom: 4 }}>5. Your Content</p>
      <p style={{ marginBottom: 12 }}>You retain ownership of content you post. By posting, you grant Link-Ap a worldwide, non-exclusive, royalty-free licence to display and distribute your content solely to operate the platform. You warrant that your content does not infringe any third-party rights and complies with all applicable laws.</p>

      <p style={{ color: COLORS.text, fontWeight: 600, marginBottom: 4 }}>6. Privacy and Data</p>
      <p style={{ marginBottom: 4 }}>We collect and process personal data to operate Link-Ap. Depending on your location, you have rights that may include:</p>
      <p style={{ marginBottom: 12, paddingLeft: 8 }}>
        • <span style={{ color: COLORS.text }}>EU / EEA / UK (GDPR/UK GDPR):</span> access, rectification, erasure, restriction, portability, and the right to object to processing.<br />
        • <span style={{ color: COLORS.text }}>California (CCPA/CPRA):</span> right to know, delete, correct, and opt out of sale of personal information.<br />
        • <span style={{ color: COLORS.text }}>South Africa (POPIA):</span> right to access, correction, and objection to processing of personal information.<br />
        • <span style={{ color: COLORS.text }}>Other jurisdictions:</span> applicable local data-protection rights.
      </p>
      <p style={{ marginBottom: 12 }}>To exercise any privacy right, contact us at info@link-ap.online. We will respond within the timeframe required by your local law (typically 30 days).</p>

      <p style={{ color: COLORS.text, fontWeight: 600, marginBottom: 4 }}>7. Intellectual Property</p>
      <p style={{ marginBottom: 12 }}>All platform content, trademarks, and technology (excluding user content) belong to Link-Ap or its licensors. You may not copy, modify, distribute, or create derivative works without our written permission.</p>

      <p style={{ color: COLORS.text, fontWeight: 600, marginBottom: 4 }}>8. Disclaimers</p>
      <p style={{ marginBottom: 12 }}>Link-Ap is provided "as is" and "as available" without warranties of any kind, express or implied. We do not verify the accuracy of user profiles or guarantee any outcome from connections made on the platform. Some jurisdictions do not allow exclusion of implied warranties; in such cases this section applies to the maximum extent permitted.</p>

      <p style={{ color: COLORS.text, fontWeight: 600, marginBottom: 4 }}>9. Limitation of Liability</p>
      <p style={{ marginBottom: 12 }}>To the fullest extent permitted by applicable law, Link-Ap's total liability for any claim arising from these Terms or your use of the platform is limited to the greater of USD $100 or the amount you paid us in the 12 months before the claim. We are not liable for indirect, incidental, consequential, or punitive damages. Nothing in these Terms limits liability for fraud, gross negligence, or death/personal injury caused by our negligence.</p>

      <p style={{ color: COLORS.text, fontWeight: 600, marginBottom: 4 }}>10. Termination</p>
      <p style={{ marginBottom: 12 }}>We may suspend or permanently terminate your account for material violations of these Terms, with or without notice. You may delete your account at any time. Upon termination, your right to use Link-Ap ceases immediately. Sections 5, 7, 8, 9, and 11 survive termination.</p>

      <p style={{ color: COLORS.text, fontWeight: 600, marginBottom: 4 }}>11. Governing Law and Disputes</p>
      <p style={{ marginBottom: 12 }}>These Terms are governed by the laws of the Republic of South Africa, without regard to conflict-of-law principles. Disputes shall first be referred to good-faith negotiation. If unresolved after 30 days, disputes shall be submitted to binding arbitration under the Arbitration Foundation of South Africa (AFSA) rules, conducted in English. Nothing prevents either party from seeking urgent interim relief from a competent court. Where mandatory local law requires a different forum or governing law, that law applies to the extent required.</p>

      <p style={{ color: COLORS.text, fontWeight: 600, marginBottom: 4 }}>12. Changes to These Terms</p>
      <p style={{ marginBottom: 12 }}>We may update these Terms at any time. We will notify you of material changes via the app or email. Continued use after the effective date of updated Terms constitutes acceptance. If you do not agree with changes, you must stop using Link-Ap and may delete your account.</p>

      <p style={{ color: COLORS.text, fontWeight: 600, marginBottom: 4 }}>13. Contact</p>
      <p style={{ marginBottom: 4 }}>For any questions about these Terms or to exercise your privacy rights, contact: info@link-ap.online</p>
    </div>
  );
}

function Onboarding({ firebaseUser, onComplete }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [form, setForm] = useState({
    title: "", firstName: "", lastName: "",
    pronouns: "", role: "", location: "",
    bio: "", skills: [], lookingFor: [], achievements: "", linkedin: "",
    lookingForDetails: {}, bringToTable: "",
    currentlyExploring: "", openTo: [],
  });

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleLF = (v) => setForm(f => ({
    ...f, lookingFor: f.lookingFor.includes(v) ? f.lookingFor.filter(x => x !== v) : [...f.lookingFor, v]
  }));
  const toggleOpenTo = (v) => setForm(f => ({
    ...f, openTo: f.openTo.includes(v) ? f.openTo.filter(x => x !== v) : [...f.openTo, v]
  }));

  const saveProfile = async () => {
    setSaving(true);
    setSaveError("");
    try {
      const color = USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
      const fullName = [form.firstName.trim(), form.lastName.trim()].filter(Boolean).join(" ");
      const profile = {
        uid: firebaseUser.uid,
        title: form.title,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        name: fullName,
        pronouns: form.pronouns,
        role: form.role,
        location: form.location,
        bio: form.bio,
        skills: form.skills,
        lookingFor: form.lookingFor,
        achievements: form.achievements.split(",").map(s => s.trim()).filter(Boolean),
        avatar: fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?",
        color,
        nameLower: fullName.toLowerCase(),
        lastNameLower: form.lastName.trim().toLowerCase(),
        lookingForDetails: form.lookingForDetails,
        bringToTable: form.bringToTable,
        currentlyExploring: form.currentlyExploring.split(",").map(s => s.trim()).filter(Boolean),
        openTo: form.openTo,
        linkedinProfileUrl: form.linkedin.trim() && validateLinkedIn(form.linkedin) ? normalizeUrl(form.linkedin) : "",
        linkedinVerified: !!(form.linkedin.trim() && validateLinkedIn(form.linkedin) && linkedinNameMatches(form.linkedin, fullName)),
        photoURL: firebaseUser.photoURL || "",
        createdAt: serverTimestamp(),
        termsAcceptedAt: serverTimestamp(),
      };
      await setDoc(doc(db, "users", firebaseUser.uid), profile);
      onComplete(profile);
    } catch (e) {
      setSaveError("Failed to save profile. Please try again.");
      setSaving(false);
    }
  };

  const steps = [
    {
      title: "Who are you?",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
            <div style={{ flex: "0 0 130px" }}>
              <Select label="Title (optional)" value={form.title} onChange={v => update("title", v)} options={TITLE_OPTIONS} placeholder="Select title" />
            </div>
            <div style={{ flex: 1 }}>
              <Input label="First Name(s)" value={form.firstName} onChange={v => update("firstName", v)} placeholder="e.g. Thapelo" />
            </div>
          </div>
          <Input label="Last Name" value={form.lastName} onChange={v => update("lastName", v)} placeholder="e.g. Mokoena" />
          <Select label="Pronouns / gender identity (optional)" value={form.pronouns} onChange={v => update("pronouns", v)} options={PRONOUN_OPTIONS} placeholder="Select pronouns" />
          <Input label="What do you do?" value={form.role} onChange={v => update("role", v)} placeholder="e.g. Entrepreneur, Developer, Designer" />
          <Input label="Location" value={form.location} onChange={v => update("location", v)} placeholder="e.g. Cape Town, SA" />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Input label="LinkedIn Profile URL" value={form.linkedin} onChange={v => update("linkedin", v)} placeholder="Paste your LinkedIn profile URL (e.g. linkedin.com/in/yourname)" />
            {form.linkedin.trim() && !validateLinkedIn(form.linkedin) && (
              <span style={{ fontSize: 12, color: COLORS.red }}>Please enter a valid LinkedIn profile URL.</span>
            )}
          </div>
        </div>
      ),
      valid: form.firstName.trim() && form.lastName.trim() && form.role && form.location && (!form.linkedin.trim() || validateLinkedIn(form.linkedin)),
    },
    {
      title: "Your story",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <TextArea label="Bio — tell people what you're about" value={form.bio} onChange={v => { const words = v.trim().split(/\s+/).filter(Boolean); if (words.length <= 20 || v.length < form.bio.length) update("bio", v); }} placeholder="What are you building or working towards?" />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
              <span style={{ fontSize: 11, color: form.bio.trim().split(/\s+/).filter(Boolean).length >= 20 ? COLORS.accent : COLORS.textMuted }}>
                {form.bio.trim() ? form.bio.trim().split(/\s+/).filter(Boolean).length : 0} / 20 words
              </span>
            </div>
          </div>
          <SkillsInput skills={form.skills} onChange={v => update("skills", v)} />
          <Input label="Notable achievements (comma separated)" value={form.achievements} onChange={v => update("achievements", v)} placeholder="e.g. Built 2 websites, 5 years in finance" />
        </div>
      ),
      valid: form.bio && form.skills.length > 0,
    },
    {
      title: "What are you looking for?",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ color: COLORS.textMuted, fontSize: 14 }}>Select all that apply</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {LOOKING_FOR_OPTIONS.map(opt => (
              <button key={opt} onClick={() => toggleLF(opt)} style={{
                padding: "8px 16px", borderRadius: 20, fontSize: 13, cursor: "pointer",
                border: `1px solid ${form.lookingFor.includes(opt) ? COLORS.accent : COLORS.border}`,
                background: form.lookingFor.includes(opt) ? `${COLORS.accent}22` : "transparent",
                color: form.lookingFor.includes(opt) ? COLORS.accent : COLORS.textMuted,
              }}>{opt}</button>
            ))}
          </div>
        </div>
      ),
      valid: form.lookingFor.length > 0,
    },
    {
      title: "Tell us more",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {form.lookingFor.filter(lf => LOOKING_FOR_QUESTIONS[lf]?.length > 0).length === 0 ? (
            <p style={{ color: COLORS.textMuted, fontSize: 14, margin: 0 }}>No extra details needed — tap Continue.</p>
          ) : (
            form.lookingFor.filter(lf => LOOKING_FOR_QUESTIONS[lf]?.length > 0).map(lf => (
              <div key={lf} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ fontSize: 11, color: COLORS.accent, fontWeight: 600, letterSpacing: 0.5 }}>{lf.toUpperCase()}</div>
                {LOOKING_FOR_QUESTIONS[lf].map(q => (
                  <div key={q.key}>
                    <label style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 6, display: "block" }}>{q.label}</label>
                    <input
                      type="text"
                      value={form.lookingForDetails[q.key] || ""}
                      onChange={e => update("lookingForDetails", { ...form.lookingForDetails, [q.key]: e.target.value })}
                      placeholder="Optional"
                      style={{
                        width: "100%", padding: "12px 16px", borderRadius: 12,
                        background: COLORS.bg, border: `1px solid ${COLORS.border}`,
                        color: COLORS.text, fontSize: 14, outline: "none", boxSizing: "border-box",
                      }}
                    />
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      ),
      valid: true,
    },
    {
      title: "What I bring to the table",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ color: COLORS.textMuted, fontSize: 13, fontStyle: "italic", margin: 0 }}>
            {getBringToTablePrompt(form.lookingFor)}
          </p>
          <textarea
            value={form.bringToTable}
            onChange={e => update("bringToTable", e.target.value)}
            placeholder="Tell people what you uniquely offer..."
            rows={4}
            style={{
              width: "100%", padding: "12px 16px", borderRadius: 12,
              background: COLORS.bg, border: `1px solid ${COLORS.border}`,
              color: COLORS.text, fontSize: 14, outline: "none", resize: "none", boxSizing: "border-box",
            }}
          />
          <div>
            <label style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 6, display: "block" }}>Currently Exploring (comma separated, optional)</label>
            <input
              type="text"
              value={form.currentlyExploring}
              onChange={e => update("currentlyExploring", e.target.value)}
              placeholder="e.g. AI tools, Bootstrapping, No-code"
              style={{
                width: "100%", padding: "12px 16px", borderRadius: 12,
                background: COLORS.bg, border: `1px solid ${COLORS.border}`,
                color: COLORS.text, fontSize: 14, outline: "none", boxSizing: "border-box",
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 8, display: "block" }}>Open To (optional)</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {OPEN_TO_OPTIONS.map(opt => (
                <button key={opt} onClick={() => toggleOpenTo(opt)} style={{
                  padding: "7px 14px", borderRadius: 20, fontSize: 12, cursor: "pointer",
                  border: `1px solid ${form.openTo.includes(opt) ? COLORS.accent : COLORS.border}`,
                  background: form.openTo.includes(opt) ? `${COLORS.accent}22` : "transparent",
                  color: form.openTo.includes(opt) ? COLORS.accent : COLORS.textMuted,
                }}>{opt}</button>
              ))}
            </div>
          </div>
        </div>
      ),
      valid: true,
    },
  ];

  const current = steps[step];

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 24px", background: COLORS.bg }}>
      <div style={{ width: "100%", maxWidth: 480 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: COLORS.text }}>
            Link<span style={{ color: COLORS.accent }}>-Ap</span>
          </div>
          <p style={{ color: COLORS.textMuted, fontSize: 13, marginTop: 4 }}>Let's set up your profile</p>
          <button onClick={() => signOut(auth)} style={{
            marginTop: 10, background: "none", border: "none",
            color: COLORS.textMuted, cursor: "pointer", fontSize: 12,
            textDecoration: "underline",
          }}>Wrong account? Sign out</button>
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
          {steps.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? COLORS.accent : COLORS.border }} />
          ))}
        </div>

        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 20, padding: 32 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24, color: COLORS.text }}>{current.title}</h2>
          {current.content}
          {saveError && (
            <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: 10, background: `${COLORS.red}18`, color: COLORS.red, fontSize: 13 }}>
              {saveError}
            </div>
          )}
          <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
            {step > 0 && (
              <button onClick={() => { setStep(s => s - 1); setSaveError(""); }} disabled={saving} style={{
                padding: "12px 24px", borderRadius: 12, border: `1px solid ${COLORS.border}`,
                background: "transparent", color: COLORS.textMuted, cursor: "pointer", fontSize: 14,
              }}>Back</button>
            )}
            <button
              onClick={() => step < steps.length - 1 ? setStep(s => s + 1) : saveProfile()}
              disabled={!current.valid || saving}
              style={{
                flex: 1, padding: "12px 24px", borderRadius: 12, border: "none",
                background: current.valid && !saving ? COLORS.accent : COLORS.border,
                color: current.valid && !saving ? "#000" : COLORS.textMuted,
                cursor: current.valid && !saving ? "pointer" : "not-allowed",
                fontSize: 14, fontWeight: 700,
              }}
            >
              {saving ? "Saving..." : step < steps.length - 1 ? "Continue →" : "Create Profile"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PublicProfile({ profileUser, onClose, currentUserUid, blocked, onBlock, onUnblock }) {
  return (
    <div style={{
      position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 430, height: "100dvh", zIndex: 40,
      background: COLORS.bg, overflowY: "auto",
    }}>
      <style>{`@keyframes linkApPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }`}</style>
      <div style={{
        position: "sticky", top: 0, background: COLORS.bg, zIndex: 10,
        padding: "16px 20px", borderBottom: `1px solid ${COLORS.border}`,
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <button onClick={onClose} style={{ background: "none", border: "none", color: COLORS.accent, cursor: "pointer", fontSize: 18 }}>←</button>
        <div style={{ fontWeight: 700, color: COLORS.text, fontSize: 16 }}>Profile</div>
      </div>
      <div style={{ height: 4, background: profileUser.color }} />
      <div>
        {/* Header */}
        <div style={{ background: "#16161F", padding: "24px 24px 20px" }}>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 16 }}>
            <Avatar initials={profileUser.avatar} color={profileUser.color} size={72} photoURL={profileUser.photoURL} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <div style={{ fontSize: 19, fontWeight: 800, color: COLORS.text }}>{profileUser.name}</div>
                    {profileUser.pronouns && <span style={{ fontSize: 11, color: COLORS.textMuted, fontStyle: "italic" }}>{profileUser.pronouns}</span>}
                    {profileUser.linkedinVerified && profileUser.linkedinProfileUrl && (
                      <a href={profileUser.linkedinProfileUrl} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center" }}>
                        <LinkedInIcon />
                      </a>
                    )}
                  </div>
                  <div style={{ color: profileUser.color, fontSize: 13, marginTop: 2 }}>{profileUser.role}</div>
                </div>
                {profileUser.lookingFor?.includes("Investor") && (
                  <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#0A2015", border: "1px solid #15532E", borderRadius: 20, padding: "4px 10px", flexShrink: 0 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.green, display: "inline-block", animation: "linkApPulse 2s ease-in-out infinite" }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.green }}>Actively raising</span>
                  </div>
                )}
              </div>
              <div style={{ color: COLORS.textMuted, fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}>
                <LocationPin />
                {profileUser.location}
              </div>
            </div>
          </div>
          {profileUser.bio && (
            <p style={{ fontSize: 14, lineHeight: 1.7, color: COLORS.text, margin: 0 }}>{profileUser.bio}</p>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: "0 24px 28px" }}>

          {/* Skills */}
          {profileUser.skills?.length > 0 && (
            <div style={{ paddingTop: 20, paddingBottom: 20, borderBottom: `1px solid ${COLORS.border}` }}>
              <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 10, fontWeight: 600 }}>SKILLS</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {profileUser.skills.map(s => (
                  <span key={s} style={{ background: "#1A2E4A", color: COLORS.blue, padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500 }}>{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Q&A / Looking For block */}
          {profileUser.lookingFor?.length > 0 && profileUser.lookingForDetails && Object.values(profileUser.lookingForDetails).some(v => v) && (
            <div style={{ paddingTop: 20, paddingBottom: 20, borderBottom: `1px solid ${COLORS.border}` }}>
              <div style={{ background: COLORS.card, borderRadius: 12, padding: 16, border: `1px solid ${COLORS.border}` }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, letterSpacing: "0.08em" }}>
                    {profileUser.lookingFor.includes("Investor") ? "INVESTOR DECK" : profileUser.lookingFor.map(lf => lf.toUpperCase()).join(" · ")}
                  </div>
                  <div style={{ background: "#2D1F00", border: "1px solid #6B4A00", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600, color: COLORS.accent }}>
                    Open to conversations
                  </div>
                </div>
                {profileUser.lookingFor.filter(lf => LOOKING_FOR_QUESTIONS[lf]?.some(q => profileUser.lookingForDetails?.[q.key])).map((lf, lfIdx, filteredArr) => (
                  <div key={lf}>
                    {filteredArr.length > 1 && (
                      <div style={{ fontSize: 10, color: COLORS.accent, fontWeight: 600, marginBottom: 8 }}>{lf.toUpperCase()}</div>
                    )}
                    {LOOKING_FOR_QUESTIONS[lf].filter(q => profileUser.lookingForDetails?.[q.key]).map((q, qIdx, qArr) => (
                      <div key={q.key}>
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 2 }}>{q.label}</div>
                          <div style={{ fontSize: 14, color: COLORS.text, fontWeight: 600, lineHeight: 1.5 }}>{profileUser.lookingForDetails[q.key]}</div>
                        </div>
                        {(qIdx < qArr.length - 1 || lfIdx < filteredArr.length - 1) && (
                          <div style={{ height: 1, background: COLORS.border, marginBottom: 10 }} />
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Achievements (full width) */}
          {profileUser.achievements?.length > 0 && (
            <div style={{ paddingTop: 20, paddingBottom: 20, borderBottom: `1px solid ${COLORS.border}` }}>
              <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 10, fontWeight: 600 }}>ACHIEVEMENTS</div>
              {profileUser.achievements.map((a, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ width: 18, height: 18, minWidth: 18, background: "#1A2A4A", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
                    <svg width="10" height="10" viewBox="0 0 16 16" fill={COLORS.blue}><path d="M8 1l1.85 3.75L14 5.5l-3 2.93.71 4.12L8 10.5l-3.71 2.05L5 8.43 2 5.5l4.15-.75z"/></svg>
                  </div>
                  <div style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.5 }}>{a}</div>
                </div>
              ))}
            </div>
          )}

          {/* What I bring to the table */}
          {profileUser.bringToTable && (
            <div style={{ paddingTop: 20, paddingBottom: (profileUser.currentlyExploring?.length > 0 || profileUser.openTo?.length > 0) ? 20 : 0, borderBottom: (profileUser.currentlyExploring?.length > 0 || profileUser.openTo?.length > 0) ? `1px solid ${COLORS.border}` : "none" }}>
              <div style={{ paddingLeft: 14, borderLeft: `3px solid ${COLORS.blue}` }}>
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 6, fontWeight: 600 }}>WHAT I BRING TO THE TABLE</div>
                <p style={{ fontSize: 14, color: COLORS.text, lineHeight: 1.7, margin: 0 }}>{profileUser.bringToTable}</p>
              </div>
            </div>
          )}

          {/* Currently Exploring + Open To */}
          {(profileUser.currentlyExploring?.length > 0 || profileUser.openTo?.length > 0) && (
            <div style={{ paddingTop: 20 }}>
              {profileUser.currentlyExploring?.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 8, fontWeight: 600 }}>CURRENTLY EXPLORING</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {profileUser.currentlyExploring.map(s => (
                      <span key={s} style={{ background: "#2A1A00", color: COLORS.accent, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 500 }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {profileUser.openTo?.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 8, fontWeight: 600 }}>OPEN TO</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {profileUser.openTo.map(s => (
                      <span key={s} style={{ background: "#0A2015", color: COLORS.green, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 500 }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {currentUserUid && currentUserUid !== profileUser.uid && (() => {
            const isBlocked = blocked && blocked.some(b => b.uid === profileUser.uid);
            return (
              <div style={{ paddingTop: 24, textAlign: "center" }}>
                <button
                  onClick={() => isBlocked ? onUnblock(profileUser.uid) : onBlock(profileUser)}
                  style={{ background: "none", border: "none", color: COLORS.red, cursor: "pointer", fontSize: 12, opacity: 0.6, textDecoration: "underline" }}
                >
                  {isBlocked ? "Unblock user" : "Block user"}
                </button>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawInvitePoster(canvas) {
  const W = 540, H = 960;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#0A0A0F";
  ctx.fillRect(0, 0, W, H);

  // Subtle top radial glow
  const glow = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, 400);
  glow.addColorStop(0, "rgba(245,166,35,0.15)");
  glow.addColorStop(1, "rgba(245,166,35,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, 400);

  // Gold top bar
  ctx.fillStyle = "#F5A623";
  ctx.fillRect(0, 0, W, 3);

  // "Link-Ap" wordmark at y=160
  ctx.textBaseline = "alphabetic";
  ctx.font = "bold 64px -apple-system, BlinkMacSystemFont, Arial, sans-serif";
  const lw = ctx.measureText("Link").width;
  const aw = ctx.measureText("-Ap").width;
  const tx = (W - lw - aw) / 2;
  ctx.textAlign = "left";
  ctx.fillStyle = "#F0EEE8"; ctx.fillText("Link", tx, 160);
  ctx.fillStyle = "#F5A623"; ctx.fillText("-Ap", tx + lw, 160);

  // Tagline at y=210
  ctx.font = "18px -apple-system, BlinkMacSystemFont, Arial, sans-serif";
  ctx.textAlign = "center"; ctx.fillStyle = "#8A8A9A";
  ctx.fillText("Connect with the right people", W / 2, 210);

  // Divider at y=260
  ctx.fillStyle = "#2A2A3A";
  ctx.fillRect(W * 0.2, 260, W * 0.6, 1);

  // Section label at y=290
  ctx.font = "bold 14px -apple-system, BlinkMacSystemFont, Arial, sans-serif";
  ctx.textAlign = "center"; ctx.fillStyle = "#F5A623";
  ctx.fillText("WHY YOU SHOULD JOIN", W / 2, 290);

  // Bullet cards: cy=316, ch=56, gap=10 (period=66)
  const bullets = [
    "Discover co-founders, investors & freelance work",
    "Connect with people building real things",
    "Find exactly who you're looking for",
    "Show what you bring to the table",
  ];
  bullets.forEach((text, i) => {
    const cy = 316 + i * 66, ch = 56, cx = W * 0.07, cw = W * 0.86;
    ctx.fillStyle = "#13131A";
    roundRect(ctx, cx, cy, cw, ch, 12); ctx.fill();
    ctx.fillStyle = "rgba(245,166,35,0.5)";
    ctx.fillRect(cx, cy + 10, 3, ch - 20);
    ctx.font = "16px -apple-system, BlinkMacSystemFont, Arial, sans-serif";
    ctx.textAlign = "left"; ctx.textBaseline = "middle";
    ctx.fillStyle = "#F0EEE8"; ctx.fillText(text, cx + 20, cy + ch / 2);
    ctx.textBaseline = "alphabetic";
  });

  // Italic statement at y=624
  ctx.font = "italic 20px -apple-system, BlinkMacSystemFont, Arial, sans-serif";
  ctx.textAlign = "center"; ctx.fillStyle = "#F0EEE8";
  ctx.fillText("Where the right people find each other.", W / 2, 624);

  // Value lines centred between italic and divider
  ctx.font = "15px -apple-system, BlinkMacSystemFont, Arial, sans-serif";
  ctx.fillStyle = "#8A8A9A";
  ctx.fillText("Co-founders · Investors · Collaborators · Advisory Roles", W / 2, 686);
  ctx.fillText("Coffee Chats · Jobs · Clients", W / 2, 718);

  // Divider at y=780
  ctx.fillStyle = "#2A2A3A";
  ctx.fillRect(W * 0.2, 780, W * 0.6, 1);

  // CTA text
  ctx.font = "13px -apple-system, BlinkMacSystemFont, Arial, sans-serif";
  ctx.fillStyle = "#8A8A9A";
  ctx.fillText("Join now at", W / 2, 820);

  ctx.font = "bold 38px -apple-system, BlinkMacSystemFont, Arial, sans-serif";
  ctx.fillStyle = "#F5A623";
  ctx.fillText("link-ap.online", W / 2, 872);

  // Gold footer bar
  ctx.fillStyle = "#F5A623";
  ctx.fillRect(0, 910, W, 50);

  ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, Arial, sans-serif";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillStyle = "#000000";
  ctx.fillText("Join Link-Ap  →", W / 2, 935);
}

export function ShareModal({ user, onClose }) {
  const canvasRef = useRef(null);
  const [posterBlob, setPosterBlob] = useState(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    drawInvitePoster(canvasRef.current);
    canvasRef.current.toBlob(blob => setPosterBlob(blob));
  }, []); // eslint-disable-line

  const linkMessage = `Hey! Join me on Link-Ap - a networking app that connects you with the right people - https://link-ap.online`;

  const handleSave = () => {
    if (!canvasRef.current) return;
    const a = document.createElement("a");
    a.download = "link-ap-invite.png";
    a.href = canvasRef.current.toDataURL("image/png");
    a.click();
  };

  const handleWhatsApp = async () => {
    if (posterBlob && navigator.share && navigator.canShare) {
      const file = new File([posterBlob], "link-ap-invite.png", { type: "image/png" });
      if (navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], text: linkMessage }); return; } catch (err) { if (err.name === "AbortError") return; }
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(linkMessage)}`, "_blank");
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 50,
      background: "rgba(0,0,0,0.88)", display: "flex",
      alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{
        background: COLORS.card, border: `1px solid ${COLORS.border}`,
        borderRadius: 24, padding: 24, width: "100%", maxWidth: 380,
        display: "flex", flexDirection: "column", gap: 18,
        maxHeight: "92dvh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.text }}>Invite someone</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: COLORS.textMuted, cursor: "pointer", fontSize: 24, lineHeight: 1 }}>×</button>
        </div>
        <p style={{ fontSize: 13, color: COLORS.textMuted, margin: 0, lineHeight: 1.6 }}>
          Share this with someone you think belongs on Link-Ap. On mobile, tap Share to send the image directly via WhatsApp.
        </p>
        <div style={{ display: "flex", justifyContent: "center", background: COLORS.bg, borderRadius: 14, padding: 10 }}>
          <canvas ref={canvasRef} style={{ width: 240, height: 427, borderRadius: 8, display: "block" }} />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={handleSave} style={{
            flex: 1, padding: "12px 8px", borderRadius: 12,
            border: `1px solid ${COLORS.border}`, background: "transparent",
            color: COLORS.text, cursor: "pointer", fontSize: 13, fontWeight: 500,
          }}>Save Poster</button>
          <button onClick={handleWhatsApp} style={{
            flex: 2, padding: "12px 8px", borderRadius: 12, border: "none",
            background: "#25D366", color: "#fff", cursor: "pointer",
            fontSize: 13, fontWeight: 700,
          }}>Share on WhatsApp</button>
        </div>
      </div>
    </div>
  );
}

function MainApp({ user, firebaseUser, onProfileUpdate }) {
  const [tab, setTab] = useState(() => {
    const urlTab = new URLSearchParams(window.location.search).get("tab");
    return ["discover", "matches", "messages", "profile", "settings"].includes(urlTab) ? urlTab : "profile";
  });
  const [allUsers, setAllUsers] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [matches, setMatches] = useState([]);
  const [sent, setSent] = useState([]);
  const [passed, setPassed] = useState(new Set());
  const [received, setReceived] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  const [notification, setNotification] = useState(null);
  const [unreadChats, setUnreadChats] = useState(new Set());
  const [lastMessages, setLastMessages] = useState({});
  const [viewingProfile, setViewingProfile] = useState(null);
  const [profileEditTrigger, setProfileEditTrigger] = useState(0);
  const [seenUids, setSeenUids] = useState(new Set());

  const lastDocRef = useRef(null);
  const hasMoreRef = useRef(true);
  const loadingMoreRef = useRef(false);
  const tabRef = useRef(tab);
  const activeChatRef = useRef(activeChat);

  const loadMoreUsers = async () => {
    if (loadingMoreRef.current || !hasMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const PAGE = 30;
      const q = lastDocRef.current
        ? query(collection(db, "users"), where("deactivated", "!=", true), orderBy("deactivated"), orderBy("createdAt"), startAfter(lastDocRef.current), limit(PAGE))
        : query(collection(db, "users"), where("deactivated", "!=", true), orderBy("deactivated"), orderBy("createdAt"), limit(PAGE));
      const snap = await getDocs(q);
      const newUsers = snap.docs.map(d => d.data()).filter(u => u.uid !== firebaseUser.uid && !u.deactivated);
      lastDocRef.current = snap.docs[snap.docs.length - 1] ?? null;
      hasMoreRef.current = snap.docs.length === PAGE;
      setHasMore(hasMoreRef.current);
      setAllUsers(prev => [...(prev ?? []), ...newUsers]);
    } catch (e) {
      console.error("Failed to load users:", e);
    }
    loadingMoreRef.current = false;
    setLoadingMore(false);
  };

  useEffect(() => { loadMoreUsers(); }, []); // eslint-disable-line

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users", firebaseUser.uid, "matches"), snap => {
      setMatches(snap.docs.map(d => d.data()));
    });
    return unsub;
  }, [firebaseUser.uid]);

  useEffect(() => { tabRef.current = tab; }, [tab]);
  useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);

  useEffect(() => {
    if (!matches.length) return;
    const unsubs = matches.map(match => {
      const chatId = [firebaseUser.uid, match.uid].sort().join("_");
      const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt"));
      let initialized = false;
      return onSnapshot(q, snap => {
        if (snap.docs.length > 0) {
          const lastData = snap.docs[snap.docs.length - 1].data();
          setLastMessages(prev => ({ ...prev, [match.uid]: lastData }));
        }
        if (!initialized) { initialized = true; return; }
        snap.docChanges().forEach(change => {
          if (change.type !== "added") return;
          if (change.doc.data().from === firebaseUser.uid) return;
          const isViewingThisChat = tabRef.current === "messages" && activeChatRef.current === match.uid;
          if (!isViewingThisChat) {
            playBeep();
            triggerVibrate();
            setUnreadChats(prev => new Set([...prev, match.uid]));
          }
        });
      });
    });
    return () => unsubs.forEach(u => u());
  }, [matches, firebaseUser.uid]); // eslint-disable-line

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users", firebaseUser.uid, "sent"), snap => {
      setSent(snap.docs.map(d => d.data()));
    });
    return unsub;
  }, [firebaseUser.uid]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users", firebaseUser.uid, "passed"), snap => {
      setPassed(new Set(snap.docs.map(d => d.id)));
    });
    return unsub;
  }, [firebaseUser.uid]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users", firebaseUser.uid, "received"), snap => {
      setReceived(snap.docs.map(d => d.data()));
    });
    return unsub;
  }, [firebaseUser.uid]);

  const [blocked, setBlocked] = useState([]);
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users", firebaseUser.uid, "blocked"), snap => {
      setBlocked(snap.docs.map(d => d.data()));
    });
    return unsub;
  }, [firebaseUser.uid]);

  const [blockedByUids, setBlockedByUids] = useState([]);
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users", firebaseUser.uid, "blockedBy"), snap => {
      setBlockedByUids(snap.docs.map(d => d.id));
    });
    return unsub;
  }, [firebaseUser.uid]);

  const handleBlock = async (targetUser) => {
    await Promise.all([
      setDoc(doc(db, "users", firebaseUser.uid, "blocked", targetUser.uid), targetUser),
      setDoc(doc(db, "users", targetUser.uid, "blockedBy", firebaseUser.uid), { blockedAt: serverTimestamp() }),
    ]);
  };
  const handleUnblock = async (targetUid) => {
    await Promise.all([
      deleteDoc(doc(db, "users", firebaseUser.uid, "blocked", targetUid)),
      deleteDoc(doc(db, "users", targetUid, "blockedBy", firebaseUser.uid)),
    ]);
  };

  const handlePass = async (targetUser) => {
    await setDoc(doc(db, "users", firebaseUser.uid, "passed", targetUser.uid), { passedAt: serverTimestamp() });
  };

  const showNotif = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSendRequestWithNote = async (targetUser, note) => {
    await Promise.all([
      setDoc(doc(db, "users", firebaseUser.uid, "sent", targetUser.uid), { ...targetUser, note, sentAt: serverTimestamp() }),
      setDoc(doc(db, "users", targetUser.uid, "received", firebaseUser.uid), { ...user, note, sentAt: serverTimestamp() }),
    ]);
  };

  const handleConnectWithNote = async (targetUser, note) => {
    await handleSendRequestWithNote(targetUser, note);
    showNotif(`Request sent to ${targetUser.name}!`);
  };

  const handleAcceptRequest = async (senderUser) => {
    await Promise.all([
      setDoc(doc(db, "users", firebaseUser.uid, "matches", senderUser.uid), senderUser),
      setDoc(doc(db, "users", senderUser.uid, "matches", firebaseUser.uid), user),
      deleteDoc(doc(db, "users", senderUser.uid, "sent", firebaseUser.uid)),
      deleteDoc(doc(db, "users", firebaseUser.uid, "received", senderUser.uid)),
      deleteDoc(doc(db, "users", firebaseUser.uid, "sent", senderUser.uid)),
      deleteDoc(doc(db, "users", senderUser.uid, "received", firebaseUser.uid)),
    ]);
    showNotif(`Connected with ${senderUser.name}! 🎉`);
  };

  const handleDeclineRequest = async (senderUser) => {
    await Promise.all([
      deleteDoc(doc(db, "users", firebaseUser.uid, "received", senderUser.uid)),
      deleteDoc(doc(db, "users", senderUser.uid, "sent", firebaseUser.uid)),
      setDoc(doc(db, "users", firebaseUser.uid, "passed", senderUser.uid), { uid: senderUser.uid }),
    ]);
  };


  const handleOpenChat = (uid) => {
    setActiveChat(uid);
    if (uid) setUnreadChats(prev => { const s = new Set(prev); s.delete(uid); return s; });
  };

  const blockedUids = new Set(blocked.map(b => b.uid));
  const unmatched = allUsers === null ? null : allUsers.filter(u =>
    !matches.find(m => m.uid === u.uid) && !sent.find(s => s.uid === u.uid) && !passed.has(u.uid) && !u.deactivated && !received.find(r => r.uid === u.uid) && !blockedUids.has(u.uid)
  );

  const intentFiltered = unmatched === null ? null : (() => {
    const myIntents = user?.lookingFor || [];
    if (myIntents.length === 0) return unmatched;

    const complementMap = {
      "Investor":        ["Co-founder", "Startup to join", "Collaboration"],
      "Co-founder":      ["Co-founder", "Investor", "Startup to join"],
      "Mentor":          ["Mentor", "Collaboration"],
      "Collaboration":   ["Collaboration", "Mentor", "Freelance Work", "Clients"],
      "Freelance Work":  ["Clients", "Collaboration"],
      "Startup to join": ["Investor", "Co-founder"],
      "A Job":           ["Clients", "Collaboration"],
      "Clients":         ["A Job", "Freelance Work", "Collaboration"],
    };

    const relevantIntents = new Set(
      myIntents.flatMap(intent => complementMap[intent] || [])
    );

    const matched = unmatched.filter(u =>
      (u.lookingFor || []).some(i => relevantIntents.has(i))
    );

    return matched.length > 0 ? matched : unmatched;
  })();

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, maxWidth: 430, margin: "0 auto", position: "relative" }}>
      {notification && (
        <div style={{
          position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
          background: COLORS.accent, color: "#000", padding: "10px 20px", borderRadius: 12,
          fontSize: 13, fontWeight: 600, zIndex: 999, whiteSpace: "nowrap",
        }}>{notification}</div>
      )}

      <div style={{
        padding: "20px 20px 12px", display: "flex", justifyContent: "space-between",
        alignItems: "center", borderBottom: `1px solid ${COLORS.border}`,
        position: "sticky", top: 0, background: COLORS.bg, zIndex: 10,
      }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.text }}>
          Link<span style={{ color: COLORS.accent }}>-Ap</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setShowSearch(true)} style={{
            background: "none", border: `1px solid ${COLORS.border}`, color: COLORS.text,
            borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13,
          }}>🔍 Search</button>
          <Avatar initials={user.avatar} color={user.color} size={36} photoURL={user.photoURL} />
        </div>
      </div>

      <div style={{ paddingBottom: 90 }}>
        {tab === "discover" && <Discover users={intentFiltered} onConnect={handleConnectWithNote} onPass={handlePass} onViewProfile={setViewingProfile} onLoadMore={loadMoreUsers} loadingMore={loadingMore} hasMore={hasMore} user={user} seenUids={seenUids} setSeenUids={setSeenUids} />}
        {tab === "matches" && <Matches matches={matches} sent={sent} received={received} firebaseUser={firebaseUser} onChat={(uid) => { handleOpenChat(uid); setTab("messages"); }} onViewProfile={setViewingProfile} onAcceptRequest={handleAcceptRequest} onDeclineRequest={handleDeclineRequest} onDiscover={() => setTab("discover")} blockedUids={blockedUids} blockedByUids={blockedByUids} />}
        {tab === "messages" && !activeChat && <Messages matches={matches} sent={sent} firebaseUser={firebaseUser} activeChat={null} setActiveChat={handleOpenChat} unreadChats={unreadChats} onViewProfile={setViewingProfile} blockedUids={blockedUids} blockedByUids={blockedByUids} lastMessages={lastMessages} />}
        {tab === "profile" && <Profile user={user} firebaseUser={firebaseUser} onProfileUpdate={onProfileUpdate} editTrigger={profileEditTrigger} />}
        {tab === "settings" && <Settings user={user} firebaseUser={firebaseUser} onEditProfile={() => { setProfileEditTrigger(t => t + 1); setTab("profile"); }} blocked={blocked} onUnblock={handleUnblock} />}
      </div>

      {tab === "messages" && activeChat && (
        <div style={{
          position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)",
          width: "100%", maxWidth: 430, height: "100dvh", zIndex: 20,
          background: COLORS.bg, display: "flex", flexDirection: "column",
        }}>
          <Messages matches={matches} sent={sent} firebaseUser={firebaseUser} activeChat={activeChat} setActiveChat={handleOpenChat} unreadChats={unreadChats} onViewProfile={setViewingProfile} blockedUids={blockedUids} blockedByUids={blockedByUids} lastMessages={lastMessages} />
        </div>
      )}

      {viewingProfile && <PublicProfile profileUser={viewingProfile} onClose={() => setViewingProfile(null)} currentUserUid={firebaseUser.uid} blocked={blocked} onBlock={handleBlock} onUnblock={handleUnblock} />}
      {showSearch && <SearchModal currentUser={user} sent={sent} matches={matches} onClose={() => setShowSearch(false)} onSendRequest={handleSendRequestWithNote} blocked={blocked} blockedByUids={blockedByUids} />}

      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 430,
        background: COLORS.card, borderTop: `1px solid ${COLORS.border}`,
        display: "flex", padding: "10px 0 20px",
      }}>
        {[
          { id: "discover", label: "Discover",
            icon: c => <svg viewBox="0 0 24 24" fill={c} width="22" height="22"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> },
          { id: "matches", label: "Connections", badge: received.length,
            icon: c => <svg viewBox="0 0 24 24" fill={c} width="22" height="22"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg> },
          { id: "messages", label: "Messages", badge: unreadChats.size,
            icon: c => <svg viewBox="0 0 24 24" fill={c} width="22" height="22"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg> },
          { id: "profile", label: "Profile",
            icon: c => <svg viewBox="0 0 24 24" fill={c} width="22" height="22"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg> },
          { id: "settings", label: "Settings",
            icon: c => <svg viewBox="0 0 24 24" fill={c} width="22" height="22"><path d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.56-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.07.63-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.11-.21.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg> },
        ].map(item => {
          const color = tab === item.id ? COLORS.accent : COLORS.textMuted;
          return (
            <button key={item.id} onClick={() => setTab(item.id)} style={{
              flex: 1, background: "none", border: "none", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4, position: "relative",
            }}>
              {item.icon(color)}
              <span style={{ fontSize: 10, color, fontWeight: 500 }}>{item.label}</span>
              {item.badge > 0 && (
                <div style={{
                  position: "absolute", top: 0, right: "calc(50% - 18px)",
                  background: COLORS.accent, color: "#000", borderRadius: 10,
                  width: 16, height: 16, fontSize: 9, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>{item.badge}</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ConnectNoteModal({ target, onSend, onCancel }) {
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [sentOk, setSentOk] = useState(false);
  const MAX = 300;
  const MIN = 10;

  const handleSend = async () => {
    if (note.trim().length < MIN || sending) return;
    setSending(true);
    await onSend(note.trim());
    setSending(false);
    setSentOk(true);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      background: "rgba(0,0,0,0.72)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }}>
      <div style={{
        width: "100%", maxWidth: 430,
        background: COLORS.card, border: `1px solid ${COLORS.border}`,
        borderRadius: "20px 20px 0 0",
        padding: "20px 20px 36px",
        display: "flex", flexDirection: "column", gap: 16,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 700, color: COLORS.text, fontSize: 16 }}>Send Connection Request</div>
          <button onClick={onCancel} style={{ background: "none", border: "none", color: COLORS.textMuted, cursor: "pointer", fontSize: 22, lineHeight: 1 }}>×</button>
        </div>

        <div style={{
          background: COLORS.bg, border: `1px solid ${COLORS.border}`,
          borderRadius: 16, padding: 16, display: "flex", gap: 12, alignItems: "center",
        }}>
          <Avatar initials={target.avatar} color={target.color} size={52} photoURL={target.photoURL} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: COLORS.text }}>{target.name}</div>
            <div style={{ color: target.color, fontSize: 13 }}>{target.role}</div>
            <div style={{ color: COLORS.textMuted, fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}><LocationPin /> {target.location}</div>
          </div>
        </div>

        <div>
          <label style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 6, display: "block" }}>
            Why do you want to connect with {target.name.split(" ")[0]}? <span style={{ color: COLORS.red }}>*</span>
          </label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value.slice(0, MAX))}
            placeholder={`Tell ${target.name.split(" ")[0]} why you'd like to connect — be specific and genuine.`}
            rows={5}
            autoFocus
            style={{
              width: "100%", padding: "12px 16px", borderRadius: 12,
              background: COLORS.bg, border: `1px solid ${COLORS.border}`,
              color: COLORS.text, fontSize: 14, outline: "none", resize: "none", boxSizing: "border-box",
            }}
          />
          <p style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4, textAlign: "right" }}>
            {note.length} / {MAX}
          </p>
        </div>

        <button
          onClick={handleSend}
          disabled={note.trim().length < MIN || sending || sentOk}
          style={{
            padding: "14px", borderRadius: 12, border: "none",
            background: sentOk ? COLORS.green : note.trim().length >= MIN && !sending ? COLORS.accent : COLORS.border,
            color: sentOk || (note.trim().length >= MIN && !sending) ? "#000" : COLORS.textMuted,
            cursor: note.trim().length >= MIN && !sending && !sentOk ? "pointer" : "not-allowed",
            fontSize: 14, fontWeight: 700,
          }}
        >
          {sentOk ? "Request Sent ✓" : sending ? "Sending..." : `Send Request to ${target.name.split(" ")[0]}`}
        </button>

        <button
          onClick={onCancel}
          style={{
            padding: "12px", borderRadius: 12,
            border: `1px solid ${COLORS.border}`,
            background: "transparent", color: COLORS.textMuted,
            cursor: "pointer", fontSize: 14,
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function Discover({ users, onConnect, onPass, onViewProfile, onLoadMore, loadingMore, hasMore, user, seenUids, setSeenUids }) {
  const [showShare, setShowShare] = useState(false);
  const [connectTarget, setConnectTarget] = useState(null);

  useEffect(() => {
    if (!users || loadingMore || !hasMore) return;
    if (users.filter(u => !seenUids.has(u.uid)).length < 5) onLoadMore();
  }, [users?.length, loadingMore, hasMore]); // eslint-disable-line

  if (users === null) return (
    <div style={{ padding: 24, textAlign: "center", paddingTop: 80, color: COLORS.textMuted }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
      <p>Finding people...</p>
    </div>
  );

  const remaining = users.filter(u => !seenUids.has(u.uid));
  const current = remaining[0];

  const advance = (targetUser) => {
    const next = new Set([...seenUids, targetUser.uid]);
    setSeenUids(next);
    if (users.filter(u => !next.has(u.uid)).length < 5 && hasMore && !loadingMore) onLoadMore();
  };

  const act = (action) => {
    if (action === "pass") onPass(current);
    advance(current);
  };

  if (!current) return (
    <div style={{ padding: 24, textAlign: "center", paddingTop: 80, color: COLORS.textMuted }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🐦</div>
      <h3 style={{ fontSize: 20, marginBottom: 8, color: COLORS.text }}>You're one of the first.</h3>
      <p style={{ fontSize: 14, marginBottom: 6 }}>You're among the first 100 people on Link-Ap — which means you get access to everything, free forever.</p>
      <p style={{ fontSize: 14, marginBottom: 16 }}>We'll notify you the moment someone worth connecting with joins. Sit tight.</p>
      <p style={{ fontSize: 14, marginBottom: 16 }}>Share Link-Ap with someone and they'll also qualify for free access — forever.</p>
      <button onClick={() => setShowShare(true)} style={{
        display: "block", margin: "0 auto 20px", padding: "10px 24px",
        borderRadius: 12, border: `1px solid ${COLORS.border}`,
        background: "transparent", color: COLORS.text, cursor: "pointer",
        fontSize: 14, fontWeight: 500,
      }}>Share with someone</button>
      <div style={{ display: "inline-block", padding: "6px 14px", borderRadius: 20, border: `1px solid ${COLORS.border}`, fontSize: 13, color: COLORS.textMuted, backgroundColor: COLORS.card }}>🎟 Founding Member</div>
      {showShare && user && <ShareModal user={user} onClose={() => setShowShare(false)} />}
    </div>
  );

  return (
    <div style={{ padding: "16px 20px" }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: COLORS.text }}>Discover People</h2>
        <p style={{ color: COLORS.textMuted, fontSize: 13 }}>{remaining.length} people to explore</p>
      </div>

      <button
        onClick={() => setShowShare(true)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 10,
          background: COLORS.card, border: `1px solid ${COLORS.border}`,
          borderRadius: 12, padding: "10px 14px", cursor: "pointer",
          marginBottom: 16, color: COLORS.textMuted, fontSize: 13, fontWeight: 500,
        }}
      >
        <span style={{ fontSize: 16 }}>📲</span>
        <span style={{ color: COLORS.text }}>Invite someone to Link-Ap</span>
      </button>
      {showShare && user && <ShareModal user={user} onClose={() => setShowShare(false)} />}

      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 24, overflow: "hidden" }}>
        <div style={{ height: 4, background: current.color }} />
        <div style={{ padding: 24 }}>
          <div
            onClick={() => onViewProfile && onViewProfile(current)}
            style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 20, cursor: "pointer" }}
          >
            <Avatar initials={current.avatar} color={current.color} size={60} photoURL={current.photoURL} />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.text }}>{current.name}</div>
                {current.pronouns && <span style={{ fontSize: 11, color: COLORS.textMuted, fontStyle: "italic" }}>{current.pronouns}</span>}
              </div>
              <div style={{ color: current.color, fontSize: 13, marginBottom: 4 }}>{current.role}</div>
              <div style={{ color: COLORS.textMuted, fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}><LocationPin /> {current.location}</div>
            </div>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: COLORS.text, marginBottom: 20 }}>{current.bio}</p>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 8, fontWeight: 600 }}>SKILLS</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {current.skills?.map(s => <Tag key={s} label={s} color={current.color} />)}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 8, fontWeight: 600 }}>LOOKING FOR</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {current.lookingFor?.map(s => <Tag key={s} label={s} color={COLORS.accent} />)}
            </div>
          </div>
          {current.achievements?.length > 0 && (
            <div style={{ background: COLORS.bg, borderRadius: 12, padding: 14, border: `1px solid ${COLORS.border}` }}>
              <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 8, fontWeight: 600 }}>ACHIEVEMENTS</div>
              {current.achievements.map((a, i) => (
                <div key={i} style={{ fontSize: 13, color: COLORS.text, marginBottom: 4 }}>✦ {a}</div>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 12, padding: "0 24px 24px" }}>
          <button onClick={() => act("pass")} style={{
            flex: 1, padding: 14, borderRadius: 14, border: `1px solid ${COLORS.border}`,
            background: "transparent", color: COLORS.textMuted, cursor: "pointer", fontSize: 14,
          }}>Pass</button>
          <button onClick={() => setConnectTarget(current)} style={{
            flex: 2, padding: 14, borderRadius: 14, border: "none",
            background: COLORS.accent, color: "#000", cursor: "pointer", fontSize: 14, fontWeight: 700,
          }}>Connect ⚡</button>
        </div>
      </div>
      {connectTarget && (
        <ConnectNoteModal
          target={connectTarget}
          onSend={async (note) => {
            await onConnect(connectTarget, note);
            advance(connectTarget);
            setConnectTarget(null);
          }}
          onCancel={() => setConnectTarget(null)}
        />
      )}
    </div>
  );
}

function SearchModal({ currentUser, sent, matches, onClose, onSendRequest, blocked, blockedByUids = [] }) {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [target, setTarget] = useState(null);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [sentOk, setSentOk] = useState(false);

  useEffect(() => {
    if (term.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const t_ = term.trim().toLowerCase();
        const tCap = t_.charAt(0).toUpperCase() + t_.slice(1);
        const end_ = t_ + "";
        const endCap_ = tCap + "";
        const [s1, s2, s3] = await Promise.all([
          getDocs(query(collection(db, 'users'), where('nameLower', '>=', t_), where('nameLower', '<=', end_), limit(15))),
          getDocs(query(collection(db, 'users'), where('lastNameLower', '>=', t_), where('lastNameLower', '<=', end_), limit(15))),
          getDocs(query(collection(db, 'users'), where('name', '>=', tCap), where('name', '<=', endCap_), limit(15))),
        ]);
        const seen = new Set();
        const blockedSet = new Set([
          ...(blocked || []).map(b => b.uid),
          ...(blockedByUids || []),
        ]);
        const merged = [...s1.docs, ...s2.docs, ...s3.docs]
          .map(d => d.data())
          .filter(u => {
            if (u.uid === currentUser.uid || seen.has(u.uid) || u.deactivated || blockedSet.has(u.uid)) return false;
            seen.add(u.uid);
            return true;
          });
        setResults(merged);
      } catch (e) { console.error("[Search] query error:", e); setResults([]); }
      setSearching(false);
    }, 400);
    return () => clearTimeout(t);
  }, [term]); // eslint-disable-line

  const isMatched = (uid) => matches.some(m => m.uid === uid);
  const isSent = (uid) => sent.some(s => s.uid === uid);

  const handleSend = async () => {
    if (!note.trim() || !target || sending) return;
    setSending(true);
    await onSendRequest(target, note.trim());
    setSending(false);
    setSentOk(true);
    setTimeout(() => { setTarget(null); setNote(""); setSentOk(false); }, 1800);
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 430, height: "100dvh", zIndex: 40,
      background: COLORS.bg, display: "flex", flexDirection: "column",
    }}>
      <div style={{
        padding: "16px 20px", borderBottom: `1px solid ${COLORS.border}`,
        display: "flex", alignItems: "center", gap: 12, flexShrink: 0, background: COLORS.bg,
      }}>
        <button
          onClick={target ? () => { setTarget(null); setNote(""); } : onClose}
          style={{ background: "none", border: "none", color: COLORS.accent, cursor: "pointer", fontSize: 18 }}
        >←</button>
        <div style={{ fontWeight: 700, color: COLORS.text, fontSize: 16 }}>
          {target ? "Send Connection Request" : "Find Someone"}
        </div>
      </div>

      {!target && (
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            autoFocus
            type="text"
            value={term}
            onChange={e => setTerm(e.target.value)}
            placeholder="Search by name or surname..."
            style={{
              width: "100%", padding: "12px 16px", borderRadius: 12,
              background: COLORS.card, border: `1px solid ${COLORS.border}`,
              color: COLORS.text, fontSize: 15, outline: "none", boxSizing: "border-box",
            }}
          />
          {term.trim().length < 2 && (
            <p style={{ color: COLORS.textMuted, fontSize: 13, textAlign: "center", marginTop: 40 }}>
              Type a name to find people on Link-Ap.
            </p>
          )}
          {searching && <p style={{ color: COLORS.textMuted, fontSize: 13, textAlign: "center" }}>Searching...</p>}
          {!searching && term.trim().length >= 2 && results.length === 0 && (
            <p style={{ color: COLORS.textMuted, fontSize: 13, textAlign: "center" }}>No results for "{term}".</p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {results.map(u => (
              <div key={u.uid} style={{
                background: COLORS.card, border: `1px solid ${COLORS.border}`,
                borderRadius: 16, padding: 16, display: "flex", gap: 12, alignItems: "center",
              }}>
                <Avatar initials={u.avatar} color={u.color} size={48} photoURL={u.photoURL} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.text }}>{u.name}</div>
                  <div style={{ color: u.color, fontSize: 12 }}>{u.role}</div>
                  <div style={{ color: COLORS.textMuted, fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}><LocationPin /> {u.location}</div>
                </div>
                {isMatched(u.uid) ? (
                  <span style={{ fontSize: 11, color: COLORS.green, fontWeight: 600, flexShrink: 0 }}>Connected ✓</span>
                ) : isSent(u.uid) ? (
                  <span style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: 500, flexShrink: 0 }}>Requested</span>
                ) : (
                  <button onClick={() => setTarget(u)} style={{
                    padding: "8px 14px", borderRadius: 10, border: "none",
                    background: COLORS.accent, color: "#000", cursor: "pointer",
                    fontSize: 12, fontWeight: 700, flexShrink: 0,
                  }}>Connect</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {target && (
        <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{
            background: COLORS.card, border: `1px solid ${COLORS.border}`,
            borderRadius: 16, padding: 16, display: "flex", gap: 12, alignItems: "center",
          }}>
            <Avatar initials={target.avatar} color={target.color} size={52} photoURL={target.photoURL} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: COLORS.text }}>{target.name}</div>
              <div style={{ color: target.color, fontSize: 13 }}>{target.role}</div>
              <div style={{ color: COLORS.textMuted, fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}><LocationPin /> {target.location}</div>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 6, display: "block" }}>
              Why do you want to connect? <span style={{ color: COLORS.red }}>*</span>
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder={`Tell ${target.name.split(" ")[0]} why you'd like to connect — be specific and genuine.`}
              rows={5}
              autoFocus
              style={{
                width: "100%", padding: "12px 16px", borderRadius: 12,
                background: COLORS.bg, border: `1px solid ${COLORS.border}`,
                color: COLORS.text, fontSize: 14, outline: "none", resize: "none", boxSizing: "border-box",
              }}
            />
            <p style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>
              A personal note greatly increases your chances of a response.
            </p>
          </div>
          <button
            onClick={handleSend}
            disabled={!note.trim() || sending || sentOk}
            style={{
              padding: "14px", borderRadius: 12, border: "none",
              background: sentOk ? COLORS.green : note.trim() && !sending ? COLORS.accent : COLORS.border,
              color: sentOk || (note.trim() && !sending) ? "#000" : COLORS.textMuted,
              cursor: note.trim() && !sending && !sentOk ? "pointer" : "not-allowed",
              fontSize: 14, fontWeight: 700,
            }}
          >
            {sentOk ? "Request Sent ✓" : sending ? "Sending..." : `Send Request to ${target.name.split(" ")[0]}`}
          </button>
        </div>
      )}
    </div>
  );
}


function Matches({ matches, sent, received, firebaseUser, onChat, onViewProfile, onAcceptRequest, onDeclineRequest, onDiscover, blockedUids = new Set(), blockedByUids = [] }) {
  const hasActivity = matches.length > 0 || sent.length > 0 || received.length > 0;

  return (
    <div style={{ padding: "16px 20px" }}>
      {hasActivity && (
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: COLORS.text }}>Your Connections</h2>
          <p style={{ color: COLORS.textMuted, fontSize: 13 }}>{matches.length} mutual connections</p>
        </div>
      )}

      {!hasActivity && (
        <div style={{ textAlign: "center", paddingTop: 52, paddingBottom: 32, paddingLeft: 24, paddingRight: 24 }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%", margin: "0 auto 20px",
            background: COLORS.card, border: `1px solid ${COLORS.border}`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28,
          }}>🤝</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, margin: "0 0 10px" }}>
            No connections yet
          </h3>
          <p style={{ fontSize: 14, color: COLORS.textMuted, lineHeight: 1.7, margin: "0 0 6px" }}>
            You're one of the first 100 people on Link-Ap — which means free access, forever.
          </p>
          <p style={{ fontSize: 14, color: COLORS.textMuted, lineHeight: 1.7, margin: "0 0 28px" }}>
            Your next connection is one Discover away.
          </p>
          <button onClick={onDiscover} style={{
            padding: "12px 28px", borderRadius: 12, border: "none",
            background: COLORS.accent, color: "#000", cursor: "pointer",
            fontSize: 14, fontWeight: 700,
          }}>Go to Discover</button>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

        {/* ── Incoming connection requests ── */}
        {received.length > 0 && (
          <>
            <div style={{ fontSize: 11, color: COLORS.accent, fontWeight: 600 }}>
              CONNECTION REQUESTS — {received.length}
            </div>
            {received.map(req => (
              <div key={req.uid} style={{
                background: COLORS.card, border: `1px solid ${COLORS.accent}44`,
                borderRadius: 16, padding: 16, display: "flex", flexDirection: "column", gap: 12,
              }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div onClick={() => onViewProfile && onViewProfile(req)} style={{ cursor: "pointer", flexShrink: 0 }}>
                    <Avatar initials={req.avatar} color={req.color} size={48} photoURL={req.photoURL} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.text }}>{req.name}</div>
                    <div style={{ color: req.color, fontSize: 12 }}>{req.role}</div>
                    <div style={{ color: COLORS.textMuted, fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}><LocationPin /> {req.location}</div>
                  </div>
                </div>

                {req.note && (
                  <div style={{
                    background: COLORS.bg, borderRadius: 10, padding: "10px 14px",
                    borderLeft: `3px solid ${COLORS.accent}`,
                  }}>
                    <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 4, fontWeight: 600 }}>REASON FOR CONNECTING</div>
                    <p style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.6, margin: 0 }}>{req.note}</p>
                  </div>
                )}

                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => onAcceptRequest(req)} style={{
                    flex: 2, padding: "9px 0", borderRadius: 10, border: "none",
                    background: COLORS.accent, color: "#000", cursor: "pointer", fontSize: 12, fontWeight: 700,
                  }}>Accept ✓</button>
                  <button onClick={() => onDeclineRequest(req)} style={{
                    flex: 1, padding: "9px 0", borderRadius: 10,
                    border: `1px solid ${COLORS.red}44`, background: "transparent",
                    color: COLORS.red, cursor: "pointer", fontSize: 12,
                  }}>Decline</button>
                </div>
              </div>
            ))}
            {matches.length > 0 && <div style={{ height: 1, background: COLORS.border, margin: "4px 0" }} />}
          </>
        )}

        {/* ── Mutual matches ── */}
        {matches.filter(u => !sent.find(s => s.uid === u.uid) && !blockedUids.has(u.uid) && !blockedByUids.includes(u.uid)).map(u => (
          <div key={u.uid} onClick={() => onChat(u.uid)} style={{
            background: COLORS.card, border: `1px solid ${COLORS.border}`,
            borderRadius: 16, padding: 16, display: "flex", gap: 14, alignItems: "center", cursor: "pointer",
          }}>
            <div onClick={(e) => { e.stopPropagation(); onViewProfile && onViewProfile(u); }} style={{ flexShrink: 0 }}>
              <Avatar initials={u.avatar} color={u.color} size={48} photoURL={u.photoURL} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.text }}>{u.name}</div>
              <div style={{ color: u.color, fontSize: 12, marginBottom: 6 }}>{u.role}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {u.lookingFor?.slice(0, 2).map(l => <Tag key={l} label={l} color={COLORS.accent} />)}
              </div>
            </div>
            <div style={{ color: COLORS.textMuted, fontSize: 20 }}>→</div>
          </div>
        ))}

        {/* ── Pending sent requests ── */}
        {sent.length > 0 && (
          <>
            <div style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: 600, marginTop: 8 }}>PENDING REQUESTS</div>
            {sent.map(u => (
              <div key={u.uid} style={{
                background: COLORS.card, border: `1px dashed ${COLORS.border}`,
                borderRadius: 16, padding: 16, display: "flex", flexDirection: "column", gap: 10,
                opacity: 0.7,
              }}>
                <div style={{ display: "flex", gap: 14, alignItems: "center", cursor: "pointer" }}
                  onClick={() => onViewProfile && onViewProfile(u)}>
                  <Avatar initials={u.avatar} color={u.color} size={48} photoURL={u.photoURL} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.text }}>{u.name}</div>
                    <div style={{ color: u.color, fontSize: 12, marginBottom: 2 }}>{u.role}</div>
                    <div style={{ fontSize: 12, color: COLORS.textMuted }}>Waiting for them to respond...</div>
                  </div>
                </div>
                {u.note && (
                  <div style={{ background: COLORS.bg, borderRadius: 10, padding: "8px 12px", borderLeft: `3px solid ${COLORS.border}` }}>
                    <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 2, fontWeight: 600 }}>YOUR NOTE</div>
                    <p style={{ fontSize: 12, color: COLORS.textMuted, lineHeight: 1.5, margin: 0 }}>{u.note}</p>
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function Settings({ user, firebaseUser, onEditProfile, blocked, onUnblock }) {
  const [showTerms, setShowTerms] = useState(false);
  const [showBlockList, setShowBlockList] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [accountLoading, setAccountLoading] = useState(null);
  const [accountError, setAccountError] = useState("");
  const [pwResetMsg, setPwResetMsg] = useState("");
  const [pwResetLoading, setPwResetLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const v = localStorage.getItem("linkap_sound");
    if (v === null) { localStorage.setItem("linkap_sound", "true"); return true; }
    return v === "true";
  });
  const [vibrateEnabled, setVibrateEnabled] = useState(() => {
    const v = localStorage.getItem("linkap_vibrate");
    if (v === null) { localStorage.setItem("linkap_vibrate", "true"); return true; }
    return v === "true";
  });

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem("linkap_sound", String(next));
  };
  const toggleVibrate = () => {
    const next = !vibrateEnabled;
    setVibrateEnabled(next);
    localStorage.setItem("linkap_vibrate", String(next));
  };

  const toggle = (on) => (
    <div style={{ width: 44, height: 26, borderRadius: 13, background: on ? COLORS.accent : COLORS.border, position: "relative", cursor: "pointer" }}>
      <div style={{ position: "absolute", top: 4, left: on ? 22 : 4, width: 18, height: 18, borderRadius: "50%", background: COLORS.text, transition: "left 0.15s" }} />
    </div>
  );

  const isEmailUser = firebaseUser.providerData.some(p => p.providerId === "password");

  const sectionLabel = (text) => (
    <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>{text}</div>
  );

  const settingsRow = (label, right, onClick, extraStyle = {}) => (
    <button onClick={onClick} style={{
      width: "100%", background: "none", border: "none", cursor: "pointer",
      padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center",
      ...extraStyle,
    }}>
      <span style={{ fontSize: 14, color: COLORS.text }}>{label}</span>
      {right}
    </button>
  );

  async function handleSendPasswordReset() {
    setPwResetLoading(true);
    setPwResetMsg("");
    try {
      await sendPasswordResetEmail(auth, firebaseUser.email);
      setPwResetMsg("Reset email sent — check your inbox.");
    } catch {
      setPwResetMsg("Failed to send reset email. Please try again.");
    }
    setPwResetLoading(false);
  }

  async function handleDeactivate() {
    setAccountLoading("deactivate");
    setAccountError("");
    try {
      await setDoc(doc(db, "users", firebaseUser.uid), { deactivated: true }, { merge: true });
      await signOut(auth);
    } catch (e) {
      setAccountError("Something went wrong. Please try again.");
      setAccountLoading(null);
    }
  }

  async function handleDelete() {
    setAccountLoading("delete");
    setAccountError("");
    try {
      const uid = firebaseUser.uid;
      // Read affected UIDs BEFORE deleting anything so we can clean up other users
      const [matchesSnap, receivedSnap, sentSnap] = await Promise.all([
        getDocs(collection(db, "users", uid, "matches")),
        getDocs(collection(db, "users", uid, "received")),
        getDocs(collection(db, "users", uid, "sent")),
      ]);
      const matchUids = matchesSnap.docs.map(d => d.id);
      const receivedUids = receivedSnap.docs.map(d => d.id);
      const sentUids = sentSnap.docs.map(d => d.id);
      // Delete this user's own subcollection docs
      await Promise.all([
        ...matchesSnap.docs.map(d => deleteDoc(d.ref)),
        ...receivedSnap.docs.map(d => deleteDoc(d.ref)),
        ...sentSnap.docs.map(d => deleteDoc(d.ref)),
      ]);
      // Clean up stale references in other users' subcollections
      await Promise.all([
        ...matchUids.map(otherUid => deleteDoc(doc(db, "users", otherUid, "matches", uid))),
        ...receivedUids.map(senderUid => deleteDoc(doc(db, "users", senderUid, "sent", uid))),
        ...sentUids.map(recipientUid => deleteDoc(doc(db, "users", recipientUid, "received", uid))),
      ]);
      await deleteDoc(doc(db, "users", uid));
      await firebaseUser.delete();
    } catch (e) {
      if (e.code === "auth/requires-recent-login") {
        setAccountError("For security, please sign out and sign back in before deleting your account.");
      } else {
        setAccountError("Something went wrong. Please try again.");
      }
      setAccountLoading(null);
    }
  }

  if (showBlockList) {
    return (
      <div style={{ padding: "24px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <button onClick={() => setShowBlockList(false)} style={{ background: "none", border: "none", color: COLORS.text, cursor: "pointer", padding: 0, fontSize: 22, lineHeight: 1 }}>‹</button>
          <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.text }}>Block List</div>
        </div>
        {(!blocked || blocked.length === 0) ? (
          <div style={{ color: COLORS.textMuted, fontSize: 14, textAlign: "center", marginTop: 60 }}>No blocked users.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {blocked.map(u => (
              <div key={u.uid} style={{
                background: COLORS.card, border: `1px solid ${COLORS.border}`,
                borderRadius: 16, padding: 16, display: "flex", gap: 12, alignItems: "center",
              }}>
                <Avatar initials={u.avatar} color={u.color} size={44} photoURL={u.photoURL} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.text }}>{u.name}</div>
                  <div style={{ color: u.color, fontSize: 12 }}>{u.role}</div>
                </div>
                <button onClick={() => onUnblock(u.uid)} style={{
                  padding: "7px 14px", borderRadius: 10, border: `1px solid ${COLORS.border}`,
                  background: "transparent", color: COLORS.text, cursor: "pointer", fontSize: 12,
                }}>Unblock</button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const chevron = <span style={{ color: COLORS.textMuted, fontSize: 16 }}>›</span>;
  const rowDivider = { borderBottom: `1px solid ${COLORS.border}` };

  return (
    <div style={{ padding: "24px 16px" }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.text, marginBottom: 24 }}>Settings</div>

      {/* Notifications */}
      <div style={{ marginBottom: 24 }}>
        {sectionLabel("Notifications")}
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: "hidden" }}>
          <div onClick={toggleSound} style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${COLORS.border}`, cursor: "pointer" }}>
            <span style={{ fontSize: 14, color: COLORS.text }}>Message Sound</span>
            {toggle(soundEnabled)}
          </div>
          <div onClick={toggleVibrate} style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
            <span style={{ fontSize: 14, color: COLORS.text }}>Vibrate</span>
            {toggle(vibrateEnabled)}
          </div>
        </div>
      </div>

      {/* Account */}
      <div style={{ marginBottom: 24 }}>
        {sectionLabel("Account")}
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "14px 16px", borderBottom: `1px solid ${COLORS.border}` }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 2 }}>Name</div>
            <div style={{ fontSize: 14, color: COLORS.text }}>{user.name}</div>
          </div>
          <div style={{ padding: "14px 16px", borderBottom: `1px solid ${COLORS.border}` }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 2 }}>Email</div>
            <div style={{ fontSize: 14, color: COLORS.text }}>{firebaseUser.email}</div>
          </div>
          {settingsRow("Edit Profile", chevron, onEditProfile, isEmailUser ? rowDivider : {})}
          {isEmailUser && (
            <div style={{ padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, color: COLORS.text }}>Change Password</span>
                <button onClick={handleSendPasswordReset} disabled={pwResetLoading} style={{
                  background: "none", border: `1px solid ${COLORS.border}`, color: COLORS.accent,
                  borderRadius: 8, padding: "5px 12px", cursor: pwResetLoading ? "default" : "pointer", fontSize: 12,
                }}>{pwResetLoading ? "Sending…" : "Send Reset Email"}</button>
              </div>
              {pwResetMsg && <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 6 }}>{pwResetMsg}</div>}
            </div>
          )}
        </div>
      </div>

      {/* Privacy */}
      <div style={{ marginBottom: 24 }}>
        {sectionLabel("Privacy")}
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: "hidden" }}>
          {settingsRow("Block List", chevron, () => setShowBlockList(true))}
        </div>
      </div>

      {/* About */}
      <div style={{ marginBottom: 24 }}>
        {sectionLabel("About")}
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: "hidden" }}>
          {settingsRow("Terms of Service", chevron, () => setShowTerms(true), rowDivider)}
          <div style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14, color: COLORS.text }}>App Version</span>
            <span style={{ fontSize: 13, color: COLORS.textMuted }}>1.0.0 Beta</span>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div style={{ marginBottom: 24 }}>
        {sectionLabel("Account Actions")}
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: "hidden" }}>
          <button onClick={async () => {
            try {
              const permission = await Notification.requestPermission();
              if (permission !== "granted") {
                alert("Notifications blocked. Please allow them in your browser settings.");
                return;
              }
              const { getFCMToken } = await import("./firebase");
              const token = await getFCMToken();
              if (token) {
                await setDoc(doc(db, "users", firebaseUser.uid), { fcmToken: token }, { merge: true });
                alert("Notifications enabled! ✓");
              }
            } catch (err) {
              console.warn("FCM error:", err);
              alert("Could not enable notifications. Try again.");
            }
          }} style={{
            width: "100%", background: "none", border: "none", cursor: "pointer",
            padding: "14px 16px", display: "flex", alignItems: "center", gap: 12,
            borderBottom: `1px solid ${COLORS.border}`,
          }}>
            <svg viewBox="0 0 24 24" fill={COLORS.accent} width="20" height="20">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
            </svg>
            <span style={{ flex: 1, fontSize: 14, color: COLORS.accent, textAlign: "left" }}>Enable Notifications</span>
            <span style={{ color: COLORS.textMuted, fontSize: 18, lineHeight: 1 }}>›</span>
          </button>
          <button onClick={() => signOut(auth)} style={{
            width: "100%", background: "none", border: "none", cursor: "pointer",
            padding: "14px 16px", display: "flex", alignItems: "center", gap: 12,
            borderBottom: `1px solid ${COLORS.border}`,
          }}>
            <svg viewBox="0 0 24 24" fill={COLORS.red} width="20" height="20">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4C2.9 3 2 3.9 2 5v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
            </svg>
            <span style={{ flex: 1, fontSize: 14, color: COLORS.red, textAlign: "left" }}>Sign Out</span>
            <span style={{ color: COLORS.textMuted, fontSize: 18, lineHeight: 1 }}>›</span>
          </button>
          <button onClick={() => { setAccountError(""); setShowDeactivateConfirm(true); }} style={{
            width: "100%", background: "none", border: "none", cursor: "pointer",
            padding: "14px 16px", display: "flex", alignItems: "center", gap: 12,
            borderBottom: `1px solid ${COLORS.border}`,
          }}>
            <svg viewBox="0 0 24 24" fill={COLORS.accent} width="20" height="20">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <span style={{ flex: 1, fontSize: 14, color: COLORS.accent, textAlign: "left" }}>Deactivate Account</span>
            <span style={{ color: COLORS.textMuted, fontSize: 18, lineHeight: 1 }}>›</span>
          </button>
          <button onClick={() => { setAccountError(""); setShowDeleteConfirm(true); }} style={{
            width: "100%", background: "none", border: "none", cursor: "pointer",
            padding: "14px 16px", display: "flex", alignItems: "center", gap: 12,
          }}>
            <svg viewBox="0 0 24 24" fill={COLORS.red} width="20" height="20">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
            <span style={{ flex: 1, fontSize: 14, color: COLORS.red, textAlign: "left" }}>Delete Account</span>
            <span style={{ color: COLORS.textMuted, fontSize: 18, lineHeight: 1 }}>›</span>
          </button>
        </div>
      </div>

      {/* Terms modal */}
      {showTerms && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 50,
          display: "flex", alignItems: "flex-end", justifyContent: "center",
        }} onClick={() => setShowTerms(false)}>
          <div style={{
            background: COLORS.card, borderRadius: "16px 16px 0 0", width: "100%", maxWidth: 430,
            maxHeight: "80dvh", overflowY: "auto", padding: 24,
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontWeight: 700, color: COLORS.text }}>Terms of Service</div>
              <button onClick={() => setShowTerms(false)} style={{ background: "none", border: "none", color: COLORS.textMuted, fontSize: 20, cursor: "pointer" }}>×</button>
            </div>
            <TermsContent />
          </div>
        </div>
      )}

      {/* Deactivate confirmation */}
      {showDeactivateConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, width: "100%", maxWidth: 380, padding: 24 }}>
            <div style={{ fontWeight: 800, color: COLORS.text, fontSize: 17, marginBottom: 10 }}>Deactivate Account?</div>
            <p style={{ color: COLORS.textMuted, fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
              Your profile will be hidden from Discover and Search. Your data stays in our system. You can reactivate by contacting support.
            </p>
            {accountError && <div style={{ color: COLORS.red, fontSize: 13, marginBottom: 12 }}>{accountError}</div>}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowDeactivateConfirm(false)} style={{ flex: 1, padding: "12px", borderRadius: 10, border: `1px solid ${COLORS.border}`, background: "none", color: COLORS.text, cursor: "pointer", fontSize: 14 }}>Cancel</button>
              <button onClick={handleDeactivate} disabled={accountLoading === "deactivate"} style={{ flex: 1, padding: "12px", borderRadius: 10, border: "none", background: COLORS.accent, color: "#000", cursor: accountLoading === "deactivate" ? "default" : "pointer", fontSize: 14, fontWeight: 700 }}>
                {accountLoading === "deactivate" ? "Deactivating…" : "Deactivate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, width: "100%", maxWidth: 380, padding: 24 }}>
            <div style={{ fontWeight: 800, color: COLORS.red, fontSize: 17, marginBottom: 10 }}>Permanently Delete Account?</div>
            <p style={{ color: COLORS.textMuted, fontSize: 14, lineHeight: 1.6, marginBottom: 8 }}>
              This action is <strong style={{ color: COLORS.text }}>irreversible</strong>. Your profile, matches, messages, and all associated data will be permanently erased and cannot be recovered.
            </p>
            <p style={{ color: COLORS.textMuted, fontSize: 13, marginBottom: 20 }}>
              Deleting account for: <strong style={{ color: COLORS.text }}>{firebaseUser?.email}</strong>
            </p>
            {accountError && <div style={{ color: COLORS.red, fontSize: 13, marginBottom: 12 }}>{accountError}</div>}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowDeleteConfirm(false)} style={{ flex: 1, padding: "12px", borderRadius: 10, border: `1px solid ${COLORS.border}`, background: "none", color: COLORS.text, cursor: "pointer", fontSize: 14 }}>Cancel</button>
              <button onClick={handleDelete} disabled={accountLoading === "delete"} style={{ flex: 1, padding: "12px", borderRadius: 10, border: "none", background: COLORS.red, color: "#fff", cursor: accountLoading === "delete" ? "default" : "pointer", fontSize: 14, fontWeight: 700 }}>
                {accountLoading === "delete" ? "Deleting…" : "Delete Forever"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SplashScreen({ onDone }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), 3600);
    const t2 = setTimeout(() => onDone(), 4100);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []); // eslint-disable-line

  return (
    <>
      <style>{`
        @keyframes splashLogoIn {
          from { opacity: 0; transform: scale(0.82); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes splashPulse {
          0%   { filter: drop-shadow(0 0 0px rgba(245,166,35,0)); }
          50%  { filter: drop-shadow(0 0 28px rgba(245,166,35,0.55)); }
          100% { filter: drop-shadow(0 0 0px rgba(245,166,35,0)); }
        }
        .splash-logo {
          animation:
            splashLogoIn 0.6s cubic-bezier(0.22,1,0.36,1) forwards,
            splashPulse   0.85s ease-in-out 0.6s 4;
        }
      `}</style>
      <div style={{
        position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
        zIndex: 9999, background: "#0A0A0F",
        display: "flex", alignItems: "center", justifyContent: "center",
        opacity: fading ? 0 : 1, transition: "opacity 0.5s ease",
        pointerEvents: fading ? "none" : "all",
      }}>
        <img
          src={logoImg}
          alt="Link-Ap"
          className="splash-logo"
          style={{ width: 160, height: 160, objectFit: "contain" }}
        />
      </div>
    </>
  );
}
export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState(undefined);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      setProfile(null);
      setFirebaseUser(user ?? null);
      if (user) {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          if ((!data.nameLower || !data.lastNameLower) && data.name) {
            const nameLower = data.name.toLowerCase();
            const lastNameLower = data.name.trim().split(/\s+/).pop()?.toLowerCase() || "";
            await setDoc(doc(db, "users", user.uid), { nameLower, lastNameLower }, { merge: true });
            setProfile({ ...data, nameLower, lastNameLower });
          } else {
            setProfile(data);
          }
        }
      }
      setLoading(false);
    });
    return unsub;
  }, []);

if (window.location.pathname === "/privacy") return <PrivacyPolicy />;
  if (!splashDone) return <SplashScreen onDone={() => setSplashDone(true)} />;

  if (loading) return <div style={{ minHeight: "100vh", background: COLORS.bg }} />;
  if (!firebaseUser) return <AuthScreen />;
  if (!profile || profile.uid !== firebaseUser.uid) return <Onboarding firebaseUser={firebaseUser} onComplete={setProfile} />;
  return <MainApp user={profile} firebaseUser={firebaseUser} onProfileUpdate={setProfile} />;
}