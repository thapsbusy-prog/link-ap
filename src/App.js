import { useState, useEffect, useRef } from "react";
import logoImg from "./link-ap-logo.png";
import { db, auth } from "./firebase";
import {
  collection, addDoc, onSnapshot, query,
  orderBy, serverTimestamp, doc, setDoc, getDoc, deleteDoc,
  getDocs, startAfter, limit, where,
} from "firebase/firestore";
import {
  onAuthStateChanged, signInWithPopup, signOut,
  GoogleAuthProvider, createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "firebase/auth";

const COLORS = {
  bg: "#0A0A0F", card: "#13131A", border: "#2A2A3A",
  accent: "#F5A623", text: "#F0EEE8", textMuted: "#8A8A9A",
  green: "#4ADE80", purple: "#A78BFA", red: "#F87171", blue: "#60A5FA",
};

const USER_COLORS = ["#A78BFA", "#4ADE80", "#F5A623", "#60A5FA", "#F87171", "#34D399"];
const LOOKING_FOR_OPTIONS = ["Investor", "Co-founder", "Mentor", "Collaboration", "Freelance Work", "Startup to join", "A Job", "Clients"];
const TITLE_OPTIONS = ["Mr", "Mrs", "Ms", "Miss", "Mx", "Dr", "Prof", "Rev", "Sir", "Dame", "Adv"];
const PRONOUN_OPTIONS = ["He/Him", "She/Her", "They/Them", "He/They", "She/They", "Ze/Zir", "Xe/Xem", "Any pronouns", "Prefer not to say"];
const LOOKING_FOR_QUESTIONS = {
  "A Job": [
    { key: "job_industry", label: "What industry or role type are you targeting?" },
    { key: "job_remote", label: "Are you open to remote, hybrid, or in-person?" },
    { key: "job_notice", label: "What's your notice period or availability?" },
    { key: "job_culture", label: "What kind of company culture fits you best?" },
    { key: "job_win", label: "What's your biggest professional win so far?" },
  ],
  "Freelance Work": [
    { key: "freelance_services", label: "What services do you offer?" },
    { key: "freelance_industries", label: "What industries have you worked in?" },
    { key: "freelance_budget", label: "What's your typical project size or budget range?" },
    { key: "freelance_standout", label: "What makes your freelance work stand out?" },
  ],
  "Clients": [
    { key: "clients_problem", label: "What problem does your product/service solve?" },
    { key: "clients_ideal", label: "Who is your ideal client? (industry, size, role)" },
    { key: "clients_results", label: "What results have you delivered for past clients?" },
    { key: "clients_engagement", label: "What does the engagement or purchase look like?" },
  ],
  "Co-founder": [
    { key: "cofounder_building", label: "What are you building?" },
    { key: "cofounder_stage", label: "What stage is your venture at?" },
    { key: "cofounder_skills", label: "What skills are you looking for in a co-founder?" },
    { key: "cofounder_commitment", label: "Are you full-time or part-time on this?" },
  ],
  "Investor": [
    { key: "investor_project", label: "What is your startup/project?" },
    { key: "investor_problem", label: "What problem does it solve and for whom?" },
    { key: "investor_traction", label: "What traction or proof points do you have?" },
    { key: "investor_raise", label: "How much are you raising and what for?" },
    { key: "investor_type", label: "What kind of investor are you looking for?" },
  ],
  "Mentor": [
    { key: "mentor_area", label: "What area do you most want guidance in?" },
    { key: "mentor_journey", label: "Where are you in your journey?" },
    { key: "mentor_engage", label: "How do you prefer to engage? (async, calls, coffee chats)" },
  ],
  "Collaboration": [
    { key: "collab_project", label: "What project or idea are you working on?" },
    { key: "collab_skills", label: "What skills or roles are you looking to collaborate with?" },
    { key: "collab_type", label: "Is this paid, equity-based, or passion project?" },
  ],
};
const OPEN_TO_OPTIONS = ["Coffee Chats", "Mentorship", "Partnerships", "Beta Testing", "Advisory Roles", "Co-founder Conversations"];
const getBringToTablePrompt = (lookingFor = []) => {
  if (lookingFor.includes("A Job")) return "What makes you different from other candidates?";
  if (lookingFor.includes("Investor")) return "What's your unfair advantage?";
  if (lookingFor.includes("Co-founder")) return "What do you bring to the partnership?";
  return "What value do you offer to the people you want to meet?";
};
const getContextualHeadline = (lookingFor = []) => {
  if (lookingFor.includes("A Job")) return "Open to the right opportunity";
  if (lookingFor.includes("Investor")) return "Actively raising";
  if (lookingFor.includes("Co-founder")) return "Looking for a builder to join the mission";
  if (lookingFor.includes("Mentor")) return "Seeking the right mentor";
  return "Open to connecting";
};
const normalizeUrl = (url) => {
  if (!url) return "";
  return url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
};
const validateLinkedIn = (url) => {
  if (!url) return true;
  const normalized = normalizeUrl(url);
  return /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9\-_%]+\/?$/.test(normalized);
};

function LinkedInIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#0A66C2">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
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


function Avatar({ initials, color, size = 40, online = false, photoURL }) {
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      {photoURL ? (
        <img src={photoURL} alt={initials} style={{
          width: size, height: size, borderRadius: "50%",
          objectFit: "cover", border: `2px solid ${color}55`, display: "block",
        }} />
      ) : (
        <div style={{
          width: size, height: size, borderRadius: "50%",
          background: `${color}22`, border: `2px solid ${color}55`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: size * 0.35, fontWeight: 700, color,
        }}>{initials}</div>
      )}
    </div>
  );
}

function Tag({ label, color = COLORS.accent }) {
  return (
    <span style={{
      background: `${color}18`, color, border: `1px solid ${color}35`,
      borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 500,
    }}>{label}</span>
  );
}

function Input({ label, value, onChange, placeholder, type = "text", autoComplete }) {
  return (
    <div>
      <label style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 6, display: "block" }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} autoComplete={autoComplete || "off"} style={{
        width: "100%", padding: "12px 16px", borderRadius: 12,
        background: COLORS.bg, border: `1px solid ${COLORS.border}`,
        color: COLORS.text, fontSize: 14, outline: "none", boxSizing: "border-box",
      }} />
    </div>
  );
}

function TextArea({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 6, display: "block" }}>{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} style={{
        width: "100%", padding: "12px 16px", borderRadius: 12,
        background: COLORS.bg, border: `1px solid ${COLORS.border}`,
        color: COLORS.text, fontSize: 14, outline: "none", resize: "none", boxSizing: "border-box",
      }} />
    </div>
  );
}

function Select({ label, value, onChange, options, placeholder }) {
  return (
    <div>
      <label style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 6, display: "block" }}>{label}</label>
      <div style={{ position: "relative" }}>
        <select value={value} onChange={e => onChange(e.target.value)} style={{
          width: "100%", padding: "12px 16px", borderRadius: 12,
          background: COLORS.bg, border: `1px solid ${COLORS.border}`,
          color: value ? COLORS.text : COLORS.textMuted,
          fontSize: 14, outline: "none", boxSizing: "border-box",
          appearance: "none", WebkitAppearance: "none", cursor: "pointer", paddingRight: 36,
        }}>
          <option value="" style={{ background: COLORS.card, color: COLORS.textMuted }}>{placeholder}</option>
          {options.map(opt => (
            <option key={opt} value={opt} style={{ background: COLORS.card, color: COLORS.text }}>{opt}</option>
          ))}
        </select>
        <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: COLORS.textMuted, fontSize: 10 }}>▼</div>
      </div>
    </div>
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
      <p style={{ marginBottom: 12 }}>To exercise any privacy right, contact us at thaps.busy@gmail.com. We will respond within the timeframe required by your local law (typically 30 days).</p>

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
      <p style={{ marginBottom: 4 }}>For any questions about these Terms or to exercise your privacy rights, contact: thaps.busy@gmail.com</p>
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
    bio: "", skills: "", lookingFor: [], achievements: "", linkedin: "",
    lookingForDetails: {}, bringToTable: "",
  });

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleLF = (v) => setForm(f => ({
    ...f, lookingFor: f.lookingFor.includes(v) ? f.lookingFor.filter(x => x !== v) : [...f.lookingFor, v]
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
        skills: form.skills.split(",").map(s => s.trim()).filter(Boolean),
        lookingFor: form.lookingFor,
        achievements: form.achievements.split(",").map(s => s.trim()).filter(Boolean),
        linkedin: form.linkedin ? normalizeUrl(form.linkedin) : "",
        avatar: fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?",
        color,
        nameLower: fullName.toLowerCase(),
        lastNameLower: form.lastName.trim().toLowerCase(),
        lookingForDetails: form.lookingForDetails,
        bringToTable: form.bringToTable,
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
            <Input label="LinkedIn Profile URL (optional)" value={form.linkedin} onChange={v => update("linkedin", v)} placeholder="https://linkedin.com/in/yourname" />
            {form.linkedin && !validateLinkedIn(form.linkedin) && (
              <span style={{ fontSize: 12, color: COLORS.red }}>Must be a valid LinkedIn profile URL — e.g. linkedin.com/in/yourname</span>
            )}
            {form.linkedin && validateLinkedIn(form.linkedin) && (
              <a href={normalizeUrl(form.linkedin)} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: COLORS.accent, textDecoration: "none" }}>
                Open to confirm it's your profile ↗
              </a>
            )}
          </div>
        </div>
      ),
      valid: form.firstName.trim() && form.lastName.trim() && form.role && form.location && validateLinkedIn(form.linkedin),
    },
    {
      title: "Your story",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <TextArea label="Bio — tell people what you're about" value={form.bio} onChange={v => update("bio", v)} placeholder="What are you building or working towards?" />
          <Input label="Your key skills (comma separated)" value={form.skills} onChange={v => update("skills", v)} placeholder="e.g. Marketing, Sales, React" />
          <Input label="Notable achievements (comma separated)" value={form.achievements} onChange={v => update("achievements", v)} placeholder="e.g. Built 2 websites, 5 years in finance" />
        </div>
      ),
      valid: form.bio && form.skills,
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
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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

function PublicProfile({ profileUser, onClose }) {
  return (
    <div style={{
      position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 430, height: "100dvh", zIndex: 40,
      background: COLORS.bg, overflowY: "auto",
    }}>
      <div style={{
        position: "sticky", top: 0, background: COLORS.bg, zIndex: 10,
        padding: "16px 20px", borderBottom: `1px solid ${COLORS.border}`,
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <button onClick={onClose} style={{ background: "none", border: "none", color: COLORS.accent, cursor: "pointer", fontSize: 18 }}>←</button>
        <div style={{ fontWeight: 700, color: COLORS.text, fontSize: 16 }}>Profile</div>
      </div>
      <div style={{ height: 4, background: profileUser.color }} />
      <div style={{ padding: 24 }}>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 20 }}>
          <Avatar initials={profileUser.avatar} color={profileUser.color} size={72} online photoURL={profileUser.photoURL} />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.text }}>{profileUser.name}</div>
              {profileUser.pronouns && <span style={{ fontSize: 12, color: COLORS.textMuted, fontStyle: "italic" }}>{profileUser.pronouns}</span>}
              {profileUser.linkedin && (
                <a href={profileUser.linkedin} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center" }}>
                  <LinkedInIcon />
                </a>
              )}
            </div>
            <div style={{ color: profileUser.color, fontSize: 14, marginBottom: 4 }}>{profileUser.role}</div>
            <div style={{ color: COLORS.textMuted, fontSize: 12 }}>📍 {profileUser.location}</div>
          </div>
        </div>
        {profileUser.bio && (
          <p style={{ fontSize: 14, lineHeight: 1.7, color: COLORS.text, marginBottom: 24 }}>{profileUser.bio}</p>
        )}
        {profileUser.skills?.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 8, fontWeight: 600 }}>SKILLS</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {profileUser.skills.map(s => <Tag key={s} label={s} color={profileUser.color} />)}
            </div>
          </div>
        )}
        {profileUser.lookingFor?.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 6, fontWeight: 600 }}>LOOKING FOR</div>
            <div style={{ fontSize: 13, color: profileUser.color, fontWeight: 600, marginBottom: 8 }}>{getContextualHeadline(profileUser.lookingFor)}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {profileUser.lookingFor.map(s => <Tag key={s} label={s} color={COLORS.accent} />)}
            </div>
            {profileUser.lookingForDetails && Object.values(profileUser.lookingForDetails).some(v => v) && (
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                {profileUser.lookingFor.filter(lf => LOOKING_FOR_QUESTIONS[lf]?.some(q => profileUser.lookingForDetails?.[q.key])).map(lf => (
                  <div key={lf}>
                    <div style={{ fontSize: 11, color: COLORS.accent, fontWeight: 600, marginBottom: 4 }}>{lf.toUpperCase()}</div>
                    {LOOKING_FOR_QUESTIONS[lf].filter(q => profileUser.lookingForDetails?.[q.key]).map(q => (
                      <div key={q.key} style={{ marginBottom: 6 }}>
                        <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 1 }}>{q.label}</div>
                        <div style={{ fontSize: 14, color: COLORS.text, lineHeight: 1.5 }}>{profileUser.lookingForDetails[q.key]}</div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {profileUser.achievements?.length > 0 && (
          <div style={{ background: COLORS.card, borderRadius: 12, padding: 16, border: `1px solid ${COLORS.border}` }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 10, fontWeight: 600 }}>ACHIEVEMENTS</div>
            {profileUser.achievements.map((a, i) => (
              <div key={i} style={{ fontSize: 14, color: COLORS.text, marginBottom: 6, lineHeight: 1.5 }}>✦ {a}</div>
            ))}
          </div>
        )}
        {profileUser.bringToTable && (
          <div style={{ marginTop: 20, paddingLeft: 14, borderLeft: `3px solid ${COLORS.accent}` }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 6, fontWeight: 600 }}>WHAT I BRING TO THE TABLE</div>
            <p style={{ fontSize: 14, color: COLORS.text, lineHeight: 1.7, margin: 0 }}>{profileUser.bringToTable}</p>
          </div>
        )}
        {profileUser.currentlyExploring?.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 8, fontWeight: 600 }}>CURRENTLY EXPLORING</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {profileUser.currentlyExploring.map(s => <Tag key={s} label={s} color={COLORS.purple} />)}
            </div>
          </div>
        )}
        {profileUser.openTo?.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 8, fontWeight: 600 }}>OPEN TO</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {profileUser.openTo.map(s => <Tag key={s} label={s} color={COLORS.blue} />)}
            </div>
          </div>
        )}
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

  ctx.fillStyle = "#0A0A0F";
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, 360);
  glow.addColorStop(0, "rgba(245,166,35,0.22)");
  glow.addColorStop(1, "rgba(245,166,35,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, 360);

  const bottomGrad = ctx.createLinearGradient(0, H - 200, 0, H);
  bottomGrad.addColorStop(0, "transparent");
  bottomGrad.addColorStop(1, "rgba(245,166,35,0.06)");
  ctx.fillStyle = bottomGrad;
  ctx.fillRect(0, H - 200, W, 200);

  ctx.fillStyle = "#F5A623";
  ctx.fillRect(0, 0, W, 4);

  ctx.fillStyle = "rgba(245,166,35,0.12)";
  ctx.beginPath(); ctx.arc(W / 2, 85, 38, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "rgba(245,166,35,0.35)"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(W / 2, 85, 38, 0, Math.PI * 2); ctx.stroke();
  ctx.font = "32px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillStyle = "#F5A623"; ctx.fillText("⚡", W / 2, 86);

  ctx.textBaseline = "alphabetic";
  ctx.font = "bold 52px -apple-system, BlinkMacSystemFont, Arial, sans-serif";
  const lw = ctx.measureText("Link").width;
  const aw = ctx.measureText("-Ap").width;
  const tx = (W - lw - aw) / 2;
  ctx.textAlign = "left";
  ctx.fillStyle = "#F0EEE8"; ctx.fillText("Link", tx, 174);
  ctx.fillStyle = "#F5A623"; ctx.fillText("-Ap", tx + lw, 174);

  ctx.font = "16px -apple-system, BlinkMacSystemFont, Arial, sans-serif";
  ctx.textAlign = "center"; ctx.fillStyle = "#8A8A9A";
  ctx.fillText("Connect with the right people", W / 2, 204);

  ctx.fillStyle = "#2A2A3A"; ctx.fillRect(W * 0.15, 226, W * 0.7, 1);

  ctx.font = "bold 11px -apple-system, BlinkMacSystemFont, Arial, sans-serif";
  ctx.fillStyle = "#F5A623";
  ctx.fillText("WHY YOU SHOULD JOIN", W / 2, 254);

  const bullets = [
    ["⚡", "Discover co-founders, investors & mentors"],
    ["🤝", "Connect with people building real things"],
    ["💬", "Chat once you both connect"],
    ["🎯", "Find exactly who you're looking for"],
  ];
  bullets.forEach(([icon, text], i) => {
    const cy = 274 + i * 70, ch = 54, cx = W * 0.07, cw = W * 0.86;
    ctx.fillStyle = "#13131A";
    roundRect(ctx, cx, cy, cw, ch, 12); ctx.fill();
    ctx.fillStyle = "rgba(245,166,35,0.5)";
    ctx.fillRect(cx, cy + 10, 3, ch - 20);
    ctx.font = "20px Arial"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
    ctx.fillStyle = "#F0EEE8"; ctx.fillText(icon, cx + 16, cy + ch / 2);
    ctx.font = "14px -apple-system, BlinkMacSystemFont, Arial, sans-serif";
    ctx.fillText(text, cx + 52, cy + ch / 2);
    ctx.textBaseline = "alphabetic";
  });

  ctx.fillStyle = "#2A2A3A"; ctx.fillRect(W * 0.15, 566, W * 0.7, 1);

  ctx.font = "italic 17px -apple-system, BlinkMacSystemFont, Arial, sans-serif";
  ctx.textAlign = "center"; ctx.fillStyle = "#F0EEE8";
  ctx.fillText("Where the right people find each other.", W / 2, 618);

  ctx.font = "14px -apple-system, BlinkMacSystemFont, Arial, sans-serif";
  ctx.fillStyle = "#8A8A9A";
  ctx.fillText("Co-founders · Investors · Mentors · Clients", W / 2, 650);

  ctx.fillStyle = "#2A2A3A"; ctx.fillRect(W * 0.15, 678, W * 0.7, 1);

  ctx.font = "13px -apple-system, BlinkMacSystemFont, Arial, sans-serif";
  ctx.fillStyle = "#8A8A9A"; ctx.fillText("Join now at", W / 2, 724);
  ctx.font = "bold 34px -apple-system, BlinkMacSystemFont, Arial, sans-serif";
  ctx.fillStyle = "#F5A623"; ctx.fillText("link-ap.online", W / 2, 772, W * 0.8);

  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i === 2 ? "#F5A623" : "rgba(245,166,35,0.3)";
    ctx.beginPath(); ctx.arc(W / 2 + (i - 2) * 16, 800, i === 2 ? 4 : 3, 0, Math.PI * 2); ctx.fill();
  }

  ctx.fillStyle = "#F5A623"; ctx.fillRect(0, 832, W, H - 832);
  ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, Arial, sans-serif";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillStyle = "#000000"; ctx.fillText("Join Link-Ap  →", W / 2, 896);
}

function ShareModal({ user, onClose }) {
  const canvasRef = useRef(null);
  const [posterBlob, setPosterBlob] = useState(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    drawInvitePoster(canvasRef.current);
    canvasRef.current.toBlob(blob => setPosterBlob(blob));
  }, []); // eslint-disable-line

  const shareText = `⚡ *Link-Ap* — Connect with the right people\n\n${user.name} thinks you should join 🔥\n\nHere's what it is:\n✦ Discover co-founders, investors & mentors\n✦ Connect with people building real things\n✦ Chat once you both connect\n✦ Show what you bring to the table\n\nJoin now 👇\n🌐 link-ap.online`;

  const handleWhatsAppClick = async (e) => {
    if (posterBlob && navigator.share && navigator.canShare) {
      const file = new File([posterBlob], "link-ap-invite.png", { type: "image/png" });
      if (navigator.canShare({ files: [file] })) {
        e.preventDefault();
        try { await navigator.share({ files: [file], text: shareText }); }
        catch (err) {
          if (err.name !== "AbortError") window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
        }
      }
    }
  };

  const handleSave = () => {
    if (!canvasRef.current) return;
    const a = document.createElement("a");
    a.download = "link-ap-invite.png";
    a.href = canvasRef.current.toDataURL("image/png");
    a.click();
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
          }}>⬇ Save</button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noreferrer"
            onClick={handleWhatsAppClick}
            style={{
              flex: 2, padding: "12px 8px", borderRadius: 12, border: "none",
              background: "#25D366", color: "#fff", cursor: "pointer",
              fontSize: 13, fontWeight: 700, textDecoration: "none",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >📲 Share to WhatsApp</a>
        </div>
      </div>
    </div>
  );
}

function MainApp({ user, firebaseUser, onProfileUpdate }) {
  const [tab, setTab] = useState("profile");
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
  const [viewingProfile, setViewingProfile] = useState(null);

  const lastDocRef = useRef(null);
  const hasMoreRef = useRef(true);
  const loadingMoreRef = useRef(false);

  const loadMoreUsers = async () => {
    if (loadingMoreRef.current || !hasMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const PAGE = 30;
      const q = lastDocRef.current
        ? query(collection(db, "users"), orderBy("createdAt"), startAfter(lastDocRef.current), limit(PAGE))
        : query(collection(db, "users"), orderBy("createdAt"), limit(PAGE));
      const snap = await getDocs(q);
      const newUsers = snap.docs.map(d => d.data()).filter(u => u.uid !== firebaseUser.uid);
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

  const handleConnect = async (targetUser) => {
    const theirRequest = await getDoc(doc(db, "users", targetUser.uid, "sent", firebaseUser.uid));
    if (theirRequest.exists()) {
      await Promise.all([
        setDoc(doc(db, "users", firebaseUser.uid, "matches", targetUser.uid), targetUser),
        setDoc(doc(db, "users", targetUser.uid, "matches", firebaseUser.uid), user),
        deleteDoc(doc(db, "users", targetUser.uid, "sent", firebaseUser.uid)),
        deleteDoc(doc(db, "users", firebaseUser.uid, "sent", targetUser.uid)),
      ]);
      showNotif(`Connected with ${targetUser.name}! 🎉`);
    } else {
      await setDoc(doc(db, "users", firebaseUser.uid, "sent", targetUser.uid), targetUser);
      showNotif(`Request sent to ${targetUser.name}!`);
    }
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
    ]);
  };

  const handleReplyRequest = async (senderUser, replyText) => {
    const update = { reply: replyText, repliedAt: serverTimestamp() };
    await Promise.all([
      setDoc(doc(db, "users", firebaseUser.uid, "received", senderUser.uid), update, { merge: true }),
      setDoc(doc(db, "users", senderUser.uid, "sent", firebaseUser.uid), update, { merge: true }),
    ]);
  };

  const unmatched = allUsers === null ? null : allUsers.filter(u =>
    !matches.find(m => m.uid === u.uid) && !sent.find(s => s.uid === u.uid) && !passed.has(u.uid)
  );

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
          <Avatar initials={user.avatar} color={user.color} size={36} online photoURL={user.photoURL} />
          <button onClick={async () => { await signOut(auth); }} style={{
            background: "none", border: `1px solid ${COLORS.border}`, color: COLORS.textMuted,
            borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 12,
          }}>Sign out</button>
        </div>
      </div>

      <div style={{ paddingBottom: 90 }}>
        {tab === "discover" && <Discover users={unmatched} onConnect={handleConnect} onPass={handlePass} onViewProfile={setViewingProfile} onLoadMore={loadMoreUsers} loadingMore={loadingMore} hasMore={hasMore} />}
        {tab === "matches" && <Matches matches={matches} sent={sent} received={received} onChat={(uid) => { setActiveChat(uid); setTab("messages"); }} onViewProfile={setViewingProfile} onAcceptRequest={handleAcceptRequest} onDeclineRequest={handleDeclineRequest} onReplyRequest={handleReplyRequest} />}
        {tab === "messages" && !activeChat && <Messages matches={matches} sent={sent} firebaseUser={firebaseUser} activeChat={null} setActiveChat={setActiveChat} onViewProfile={setViewingProfile} />}
        {tab === "profile" && <Profile user={user} firebaseUser={firebaseUser} onProfileUpdate={onProfileUpdate} />}
      </div>

      {tab === "messages" && activeChat && (
        <div style={{
          position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)",
          width: "100%", maxWidth: 430, height: "100dvh", zIndex: 20,
          background: COLORS.bg, display: "flex", flexDirection: "column",
        }}>
          <Messages matches={matches} sent={sent} firebaseUser={firebaseUser} activeChat={activeChat} setActiveChat={setActiveChat} onViewProfile={setViewingProfile} />
        </div>
      )}

      {viewingProfile && <PublicProfile profileUser={viewingProfile} onClose={() => setViewingProfile(null)} />}
      {showSearch && <SearchModal currentUser={user} sent={sent} matches={matches} onClose={() => setShowSearch(false)} onSendRequest={handleSendRequestWithNote} />}

      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 430,
        background: COLORS.card, borderTop: `1px solid ${COLORS.border}`,
        display: "flex", padding: "10px 0 20px",
      }}>
        {[
          { id: "discover", icon: "⚡", label: "Discover" },
          { id: "matches", icon: "🤝", label: "Connections", badge: matches.length + received.length },
          { id: "messages", icon: "💬", label: "Messages" },
          { id: "profile", icon: "👤", label: "Profile" },
        ].map(item => (
          <button key={item.id} onClick={() => setTab(item.id)} style={{
            flex: 1, background: "none", border: "none", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4, position: "relative",
          }}>
            <div style={{ fontSize: 20 }}>{item.icon}</div>
            <span style={{ fontSize: 10, color: tab === item.id ? COLORS.accent : COLORS.textMuted, fontWeight: 500 }}>
              {item.label}
            </span>
            {item.badge > 0 && (
              <div style={{
                position: "absolute", top: 0, right: "calc(50% - 18px)",
                background: COLORS.accent, color: "#000", borderRadius: 10,
                width: 16, height: 16, fontSize: 9, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{item.badge}</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function Discover({ users, onConnect, onPass, onViewProfile, onLoadMore, loadingMore, hasMore }) {
  const [seenUids, setSeenUids] = useState(new Set());

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

  const act = (action) => {
    if (action === "connect") onConnect(current);
    if (action === "pass") onPass(current);
    const next = new Set([...seenUids, current.uid]);
    setSeenUids(next);
    if (users.filter(u => !next.has(u.uid)).length < 5 && hasMore && !loadingMore) onLoadMore();
  };

  if (!current) return (
    <div style={{ padding: 24, textAlign: "center", paddingTop: 80, color: COLORS.textMuted }}>
      {loadingMore ? (
        <>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
          <p>Finding more people...</p>
        </>
      ) : (
        <>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
          <h3 style={{ fontSize: 20, marginBottom: 8, color: COLORS.text }}>You've seen everyone!</h3>
          <p>Check your connections and start conversations</p>
        </>
      )}
    </div>
  );

  return (
    <div style={{ padding: "16px 20px" }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: COLORS.text }}>Discover People</h2>
        <p style={{ color: COLORS.textMuted, fontSize: 13 }}>{remaining.length} people to explore</p>
      </div>

      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 24, overflow: "hidden" }}>
        <div style={{ height: 4, background: current.color }} />
        <div style={{ padding: 24 }}>
          <div
            onClick={() => onViewProfile && onViewProfile(current)}
            style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 20, cursor: "pointer" }}
          >
            <Avatar initials={current.avatar} color={current.color} size={60} online photoURL={current.photoURL} />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.text }}>{current.name}</div>
                {current.pronouns && <span style={{ fontSize: 11, color: COLORS.textMuted, fontStyle: "italic" }}>{current.pronouns}</span>}
                {current.linkedin && (
                  <a href={current.linkedin} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ display: "flex", alignItems: "center" }}>
                    <LinkedInIcon />
                  </a>
                )}
              </div>
              <div style={{ color: current.color, fontSize: 13, marginBottom: 4 }}>{current.role}</div>
              <div style={{ color: COLORS.textMuted, fontSize: 12 }}>📍 {current.location}</div>
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
          <button onClick={() => act("connect")} style={{
            flex: 2, padding: 14, borderRadius: 14, border: "none",
            background: COLORS.accent, color: "#000", cursor: "pointer", fontSize: 14, fontWeight: 700,
          }}>Connect ⚡</button>
        </div>
      </div>
    </div>
  );
}

function SearchModal({ currentUser, sent, matches, onClose, onSendRequest }) {
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
        const merged = [...s1.docs, ...s2.docs, ...s3.docs]
          .map(d => d.data())
          .filter(u => {
            if (u.uid === currentUser.uid || seen.has(u.uid)) return false;
            seen.add(u.uid);
            return true;
          });
        setResults(merged);
      } catch (e) { setResults([]); }
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
                  <div style={{ color: COLORS.textMuted, fontSize: 11 }}>📍 {u.location}</div>
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
              <div style={{ color: COLORS.textMuted, fontSize: 12 }}>📍 {target.location}</div>
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

function Matches({ matches, sent, received, onChat, onViewProfile, onAcceptRequest, onDeclineRequest, onReplyRequest }) {
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  const submitReply = async (req) => {
    if (!replyText.trim()) return;
    setReplying(true);
    await onReplyRequest(req, replyText.trim());
    setReplying(false);
    setReplyingTo(null);
    setReplyText("");
  };

  const hasActivity = matches.length > 0 || sent.length > 0 || received.length > 0;

  return (
    <div style={{ padding: "16px 20px" }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: COLORS.text }}>Your Connections</h2>
        <p style={{ color: COLORS.textMuted, fontSize: 13 }}>{matches.length} mutual connections</p>
      </div>

      {!hasActivity && (
        <div style={{ textAlign: "center", paddingTop: 60, color: COLORS.textMuted }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <p>Discover people or search by name to connect!</p>
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
                    <div style={{ color: COLORS.textMuted, fontSize: 11 }}>📍 {req.location}</div>
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

                {req.reply && (
                  <div style={{ background: `${COLORS.green}12`, borderRadius: 10, padding: "10px 14px", border: `1px solid ${COLORS.green}30` }}>
                    <div style={{ fontSize: 10, color: COLORS.green, marginBottom: 4, fontWeight: 600 }}>YOUR REPLY</div>
                    <p style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.6, margin: 0 }}>{req.reply}</p>
                  </div>
                )}

                {replyingTo === req.uid && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <textarea
                      autoFocus
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder="Write a reply..."
                      rows={3}
                      style={{
                        width: "100%", padding: "10px 14px", borderRadius: 10,
                        background: COLORS.bg, border: `1px solid ${COLORS.border}`,
                        color: COLORS.text, fontSize: 13, outline: "none", resize: "none", boxSizing: "border-box",
                      }}
                    />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => { setReplyingTo(null); setReplyText(""); }} style={{
                        flex: 1, padding: "9px", borderRadius: 10, border: `1px solid ${COLORS.border}`,
                        background: "transparent", color: COLORS.textMuted, cursor: "pointer", fontSize: 12,
                      }}>Cancel</button>
                      <button onClick={() => submitReply(req)} disabled={!replyText.trim() || replying} style={{
                        flex: 2, padding: "9px", borderRadius: 10, border: "none",
                        background: replyText.trim() && !replying ? COLORS.accent : COLORS.border,
                        color: replyText.trim() && !replying ? "#000" : COLORS.textMuted,
                        cursor: replyText.trim() && !replying ? "pointer" : "not-allowed",
                        fontSize: 12, fontWeight: 700,
                      }}>{replying ? "Sending..." : "Send Reply"}</button>
                    </div>
                  </div>
                )}

                {replyingTo !== req.uid && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => { setReplyingTo(req.uid); setReplyText(""); }} style={{
                      flex: 1, padding: "9px 0", borderRadius: 10,
                      border: `1px solid ${COLORS.border}`, background: "transparent",
                      color: COLORS.text, cursor: "pointer", fontSize: 12, fontWeight: 500,
                    }}>{req.reply ? "Edit Reply" : "Reply"}</button>
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
                )}
              </div>
            ))}
            {matches.length > 0 && <div style={{ height: 1, background: COLORS.border, margin: "4px 0" }} />}
          </>
        )}

        {/* ── Mutual matches ── */}
        {matches.filter(u => !sent.find(s => s.uid === u.uid)).map(u => (
          <div key={u.uid} onClick={() => onChat(u.uid)} style={{
            background: COLORS.card, border: `1px solid ${COLORS.border}`,
            borderRadius: 16, padding: 16, display: "flex", gap: 14, alignItems: "center", cursor: "pointer",
          }}>
            <div onClick={(e) => { e.stopPropagation(); onViewProfile && onViewProfile(u); }} style={{ flexShrink: 0 }}>
              <Avatar initials={u.avatar} color={u.color} size={48} online photoURL={u.photoURL} />
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
                background: COLORS.card, border: `1px dashed ${u.reply ? COLORS.accent : COLORS.border}`,
                borderRadius: 16, padding: 16, display: "flex", flexDirection: "column", gap: 10,
                opacity: u.reply ? 1 : 0.7,
              }}>
                <div style={{ display: "flex", gap: 14, alignItems: "center", cursor: "pointer" }}
                  onClick={() => onViewProfile && onViewProfile(u)}>
                  <Avatar initials={u.avatar} color={u.color} size={48} photoURL={u.photoURL} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.text }}>{u.name}</div>
                    <div style={{ color: u.color, fontSize: 12, marginBottom: 2 }}>{u.role}</div>
                    {!u.reply && <div style={{ fontSize: 12, color: COLORS.textMuted }}>Waiting for them to respond...</div>}
                  </div>
                </div>
                {u.note && (
                  <div style={{ background: COLORS.bg, borderRadius: 10, padding: "8px 12px", borderLeft: `3px solid ${COLORS.border}` }}>
                    <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 2, fontWeight: 600 }}>YOUR NOTE</div>
                    <p style={{ fontSize: 12, color: COLORS.textMuted, lineHeight: 1.5, margin: 0 }}>{u.note}</p>
                  </div>
                )}
                {u.reply && (
                  <div style={{ background: `${COLORS.accent}10`, borderRadius: 10, padding: "10px 14px", border: `1px solid ${COLORS.accent}30` }}>
                    <div style={{ fontSize: 10, color: COLORS.accent, marginBottom: 4, fontWeight: 600 }}>THEY REPLIED</div>
                    <p style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.6, margin: 0 }}>{u.reply}</p>
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

function Messages({ matches, sent = [], firebaseUser, activeChat, setActiveChat, onViewProfile }) {
  const [input, setInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const bottomRef = useRef(null);

  const chatUser = matches.find(u => u.uid === activeChat);
  const isPending = sent.some(u => u.uid === activeChat);
  const chatId = activeChat ? [firebaseUser.uid, activeChat].sort().join("_") : null;

  useEffect(() => {
    setChatMessages([]);
    if (!chatId) return;
    const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt"));
    const unsub = onSnapshot(q, snap => {
      setChatMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages.length]);

  const send = async () => {
    if (!input.trim() || isPending || !chatUser) return;
    await addDoc(collection(db, "chats", chatId, "messages"), {
      text: input.trim(),
      from: firebaseUser.uid,
      createdAt: serverTimestamp(),
    });
    setInput("");
  };

  if (activeChat && !chatUser) return null;

  if (!activeChat) return (
    <div style={{ padding: "16px 20px" }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: COLORS.text }}>Messages</h2>
        <p style={{ color: COLORS.textMuted, fontSize: 13 }}>Your conversations</p>
      </div>
      {matches.length === 0 && (
        <div style={{ textAlign: "center", paddingTop: 60, color: COLORS.textMuted }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
          <p>Connect with people to start chatting</p>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {matches.map(u => (
          <div key={u.uid} onClick={() => setActiveChat(u.uid)} style={{
            background: COLORS.card, border: `1px solid ${COLORS.border}`,
            borderRadius: 16, padding: 16, display: "flex", gap: 14, alignItems: "center", cursor: "pointer",
          }}>
            <div onClick={(e) => { e.stopPropagation(); onViewProfile && onViewProfile(u); }} style={{ flexShrink: 0 }}>
              <Avatar initials={u.avatar} color={u.color} size={48} online photoURL={u.photoURL} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.text }}>{u.name}</div>
              <div style={{ color: COLORS.textMuted, fontSize: 13 }}>Tap to chat 💬</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh" }}>
      <div style={{
        padding: "12px 20px", borderBottom: `1px solid ${COLORS.border}`,
        display: "flex", gap: 12, alignItems: "center", background: COLORS.card,
        position: "sticky", top: 0, zIndex: 9, flexShrink: 0,
      }}>
        <button onClick={() => setActiveChat(null)} style={{ background: "none", border: "none", color: COLORS.accent, cursor: "pointer", fontSize: 18 }}>←</button>
        <div
          onClick={() => onViewProfile && onViewProfile(chatUser)}
          style={{ display: "flex", gap: 12, alignItems: "center", cursor: "pointer", flex: 1 }}
        >
          <Avatar initials={chatUser?.avatar} color={chatUser?.color} size={40} online photoURL={chatUser?.photoURL} />
          <div>
            <div style={{ fontWeight: 700, color: COLORS.text }}>{chatUser?.name}</div>
            <div style={{ color: COLORS.textMuted, fontSize: 12 }}>{chatUser?.role}</div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {chatMessages.length === 0 && (
          <div style={{ textAlign: "center", color: COLORS.textMuted, marginTop: 40 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>👋</div>
            <p style={{ fontSize: 13 }}>Say hello to {chatUser?.name}!</p>
          </div>
        )}
        {chatMessages.map(msg => (
          <div key={msg.id} style={{ display: "flex", justifyContent: msg.from === firebaseUser.uid ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "75%",
              background: msg.from === firebaseUser.uid ? COLORS.accent : COLORS.card,
              color: msg.from === firebaseUser.uid ? "#000" : COLORS.text,
              border: msg.from === firebaseUser.uid ? "none" : `1px solid ${COLORS.border}`,
              borderRadius: msg.from === firebaseUser.uid ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              padding: "10px 14px", fontSize: 14, lineHeight: 1.5,
            }}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {isPending ? (
        <div style={{ padding: "14px 16px", borderTop: `1px solid ${COLORS.border}`, background: COLORS.card, textAlign: "center" }}>
          <p style={{ color: COLORS.textMuted, fontSize: 13, margin: 0 }}>
            Messaging unlocks once {chatUser?.name} connects back with you.
          </p>
        </div>
      ) : (
        <div style={{ padding: "12px 16px", borderTop: `1px solid ${COLORS.border}`, display: "flex", gap: 10, background: COLORS.card }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Type a message..."
            style={{
              flex: 1, padding: "12px 16px", borderRadius: 24,
              background: COLORS.bg, border: `1px solid ${COLORS.border}`,
              color: COLORS.text, fontSize: 14, outline: "none",
            }}
          />
          <button onClick={send} style={{
            width: 44, height: 44, borderRadius: "50%", border: "none",
            background: input.trim() ? COLORS.accent : COLORS.border,
            color: input.trim() ? "#000" : COLORS.textMuted,
            cursor: input.trim() ? "pointer" : "default",
            fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>→</button>
        </div>
      )}
    </div>
  );
}

function Profile({ user, firebaseUser, onProfileUpdate }) {
  const [editing, setEditing] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [photoPreview, setPhotoPreview] = useState(user.photoURL || null);
  const [form, setForm] = useState({
    name: user.name || "", role: user.role || "", location: user.location || "",
    bio: user.bio || "", skills: user.skills?.join(", ") || "",
    achievements: user.achievements?.join(", ") || "",
    linkedin: user.linkedin || "", lookingFor: user.lookingFor || [],
    bringToTable: user.bringToTable || "",
    currentlyExploring: user.currentlyExploring?.join(", ") || "",
    openTo: user.openTo || [],
    lookingForDetails: user.lookingForDetails || {},
  });

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleLF = (v) => setForm(f => ({
    ...f, lookingFor: f.lookingFor.includes(v) ? f.lookingFor.filter(x => x !== v) : [...f.lookingFor, v],
  }));
  const toggleOpenTo = (v) => setForm(f => ({
    ...f, openTo: f.openTo.includes(v) ? f.openTo.filter(x => x !== v) : [...f.openTo, v],
  }));

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const MAX = 200;
      const scale = Math.min(MAX / img.width, MAX / img.height, 1);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      setPhotoPreview(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.src = objectUrl;
  };

  const saveProfile = async () => {
    setSaving(true);
    setSaveError("");
    try {
      const photoURL = photoPreview || "";
      const updated = {
        ...user,
        name: form.name,
        role: form.role,
        location: form.location,
        bio: form.bio,
        skills: form.skills.split(",").map(s => s.trim()).filter(Boolean),
        achievements: form.achievements.split(",").map(s => s.trim()).filter(Boolean),
        linkedin: form.linkedin ? normalizeUrl(form.linkedin) : "",
        lookingFor: form.lookingFor,
        avatar: form.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?",
        photoURL,
        bringToTable: form.bringToTable,
        currentlyExploring: form.currentlyExploring.split(",").map(s => s.trim()).filter(Boolean),
        openTo: form.openTo,
        lookingForDetails: form.lookingForDetails,
        nameLower: form.name.toLowerCase(),
        lastNameLower: form.name.trim().split(/\s+/).pop()?.toLowerCase() || "",
      };
      await setDoc(doc(db, "users", firebaseUser.uid), updated);
      onProfileUpdate(updated);
      setEditing(false);
    } catch (e) {
      setSaveError("Failed to save. Please try again.");
    }
    setSaving(false);
  };

  const cancelEdit = () => {
    setEditing(false);
    setPhotoPreview(user.photoURL || null);
    setForm({
      name: user.name || "", role: user.role || "", location: user.location || "",
      bio: user.bio || "", skills: user.skills?.join(", ") || "",
      achievements: user.achievements?.join(", ") || "",
      linkedin: user.linkedin || "", lookingFor: user.lookingFor || [],
      bringToTable: user.bringToTable || "",
      currentlyExploring: user.currentlyExploring?.join(", ") || "",
      openTo: user.openTo || [],
      lookingForDetails: user.lookingForDetails || {},
    });
    setSaveError("");
  };

  if (editing) return (
    <div style={{ padding: "16px 20px", paddingBottom: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: COLORS.text }}>Edit Profile</h2>
        <button onClick={cancelEdit} style={{ background: "none", border: "none", color: COLORS.textMuted, cursor: "pointer", fontSize: 13 }}>Cancel</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{ position: "relative" }}>
            <Avatar initials={form.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?"} color={user.color} size={80} photoURL={photoPreview} />
            <label style={{
              position: "absolute", bottom: 0, right: 0,
              width: 26, height: 26, borderRadius: "50%",
              background: COLORS.accent, display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", fontSize: 13,
            }}>
              📷
              <input type="file" accept="image/*" onChange={handlePhotoSelect} style={{ display: "none" }} />
            </label>
          </div>
          <span style={{ fontSize: 12, color: COLORS.textMuted }}>Tap camera to change photo</span>
        </div>

        <Input label="Full Name" value={form.name} onChange={v => update("name", v)} placeholder="Your name" />
        <Input label="What do you do?" value={form.role} onChange={v => update("role", v)} placeholder="e.g. Entrepreneur, Developer" />
        <Input label="Location" value={form.location} onChange={v => update("location", v)} placeholder="e.g. Cape Town, SA" />
        <TextArea label="Bio" value={form.bio} onChange={v => update("bio", v)} placeholder="What are you building or working towards?" />
        <TextArea label="What I Bring to the Table" value={form.bringToTable} onChange={v => update("bringToTable", v)} placeholder={getBringToTablePrompt(form.lookingFor)} />
        <Input label="Skills (comma separated)" value={form.skills} onChange={v => update("skills", v)} placeholder="e.g. Marketing, React, Sales" />
        <Input label="Achievements (comma separated)" value={form.achievements} onChange={v => update("achievements", v)} placeholder="e.g. Built 2 startups" />
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Input label="LinkedIn URL (optional)" value={form.linkedin} onChange={v => update("linkedin", v)} placeholder="https://linkedin.com/in/yourname" />
          {form.linkedin && !validateLinkedIn(form.linkedin) && (
            <span style={{ fontSize: 12, color: COLORS.red }}>Must be a valid LinkedIn profile URL — e.g. linkedin.com/in/yourname</span>
          )}
          {form.linkedin && validateLinkedIn(form.linkedin) && (
            <a href={normalizeUrl(form.linkedin)} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: COLORS.accent, textDecoration: "none" }}>
              Open to confirm it's your profile ↗
            </a>
          )}
        </div>

        <div>
          <label style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 8, display: "block" }}>Looking For</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {LOOKING_FOR_OPTIONS.map(opt => (
              <button key={opt} onClick={() => toggleLF(opt)} style={{
                padding: "7px 14px", borderRadius: 20, fontSize: 12, cursor: "pointer",
                border: `1px solid ${form.lookingFor.includes(opt) ? COLORS.accent : COLORS.border}`,
                background: form.lookingFor.includes(opt) ? `${COLORS.accent}22` : "transparent",
                color: form.lookingFor.includes(opt) ? COLORS.accent : COLORS.textMuted,
              }}>{opt}</button>
            ))}
          </div>
        </div>

        {form.lookingFor.filter(lf => LOOKING_FOR_QUESTIONS[lf]?.length > 0).length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ fontSize: 12, color: COLORS.textMuted }}>More about what you're looking for (optional)</div>
            {form.lookingFor.filter(lf => LOOKING_FOR_QUESTIONS[lf]?.length > 0).map(lf => (
              <div key={lf} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
            ))}
          </div>
        )}

        <Input label="Currently Exploring (comma separated)" value={form.currentlyExploring} onChange={v => update("currentlyExploring", v)} placeholder="e.g. AI tools, Bootstrapping, No-code" />

        <div>
          <label style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 8, display: "block" }}>Open To</label>
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

        {saveError && (
          <div style={{ padding: "10px 14px", borderRadius: 10, background: `${COLORS.red}18`, color: COLORS.red, fontSize: 13 }}>
            {saveError}
          </div>
        )}

        <button onClick={saveProfile} disabled={saving || !form.name || !form.role || (!!form.linkedin && !validateLinkedIn(form.linkedin))} style={{
          padding: "13px", borderRadius: 12, border: "none",
          background: !saving && form.name && form.role && (!form.linkedin || validateLinkedIn(form.linkedin)) ? COLORS.accent : COLORS.border,
          color: !saving && form.name && form.role && (!form.linkedin || validateLinkedIn(form.linkedin)) ? "#000" : COLORS.textMuted,
          cursor: !saving && form.name && form.role && (!form.linkedin || validateLinkedIn(form.linkedin)) ? "pointer" : "not-allowed",
          fontSize: 14, fontWeight: 700,
        }}>
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ padding: "16px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: COLORS.text }}>My Profile</h2>
          <p style={{ color: COLORS.textMuted, fontSize: 13 }}>How others see you</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowShare(true)} style={{
            padding: "8px 16px", borderRadius: 10, border: `1px solid ${COLORS.border}`,
            background: "transparent", color: COLORS.accent, cursor: "pointer", fontSize: 13, fontWeight: 600,
          }}>Share</button>
          <button onClick={() => setEditing(true)} style={{
            padding: "8px 16px", borderRadius: 10, border: `1px solid ${COLORS.border}`,
            background: "transparent", color: COLORS.text, cursor: "pointer", fontSize: 13, fontWeight: 500,
          }}>Edit</button>
        </div>
      </div>
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 24, overflow: "hidden" }}>
        <div style={{ height: 4, background: user.color }} />
        <div style={{ padding: 24 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 20 }}>
            <Avatar initials={user.avatar} color={user.color} size={64} online photoURL={user.photoURL} />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.text }}>{user.name}</div>
                {user.linkedin && (
                  <a href={user.linkedin} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center" }}>
                    <LinkedInIcon />
                  </a>
                )}
              </div>
              <div style={{ color: user.color, fontSize: 14, marginBottom: 4 }}>{user.role}</div>
              <div style={{ color: COLORS.textMuted, fontSize: 12 }}>📍 {user.location}</div>
            </div>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 20, color: COLORS.text }}>{user.bio}</p>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 8, fontWeight: 600 }}>SKILLS</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {user.skills?.map(s => <Tag key={s} label={s} color={user.color} />)}
            </div>
          </div>
          {user.lookingFor?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 6, fontWeight: 600 }}>LOOKING FOR</div>
              <div style={{ fontSize: 13, color: user.color, fontWeight: 600, marginBottom: 8 }}>{getContextualHeadline(user.lookingFor)}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {user.lookingFor.map(s => <Tag key={s} label={s} color={COLORS.accent} />)}
              </div>
              {user.lookingForDetails && Object.values(user.lookingForDetails).some(v => v) && (
                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                  {user.lookingFor.filter(lf => LOOKING_FOR_QUESTIONS[lf]?.some(q => user.lookingForDetails?.[q.key])).map(lf => (
                    <div key={lf}>
                      <div style={{ fontSize: 11, color: COLORS.accent, fontWeight: 600, marginBottom: 4 }}>{lf.toUpperCase()}</div>
                      {LOOKING_FOR_QUESTIONS[lf].filter(q => user.lookingForDetails?.[q.key]).map(q => (
                        <div key={q.key} style={{ marginBottom: 6 }}>
                          <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 1 }}>{q.label}</div>
                          <div style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.5 }}>{user.lookingForDetails[q.key]}</div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {user.achievements?.length > 0 && (
            <div style={{ background: COLORS.bg, borderRadius: 12, padding: 14, border: `1px solid ${COLORS.border}` }}>
              <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 8, fontWeight: 600 }}>ACHIEVEMENTS</div>
              {user.achievements.map((a, i) => (
                <div key={i} style={{ fontSize: 13, color: COLORS.text, marginBottom: 4 }}>✦ {a}</div>
              ))}
            </div>
          )}
          {user.bringToTable && (
            <div style={{ marginTop: 16, paddingLeft: 14, borderLeft: `3px solid ${COLORS.accent}` }}>
              <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 6, fontWeight: 600 }}>WHAT I BRING TO THE TABLE</div>
              <p style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.7, margin: 0 }}>{user.bringToTable}</p>
            </div>
          )}
          {user.currentlyExploring?.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 8, fontWeight: 600 }}>CURRENTLY EXPLORING</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {user.currentlyExploring.map(s => <Tag key={s} label={s} color={COLORS.purple} />)}
              </div>
            </div>
          )}
          {user.openTo?.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 8, fontWeight: 600 }}>OPEN TO</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {user.openTo.map(s => <Tag key={s} label={s} color={COLORS.blue} />)}
              </div>
            </div>
          )}
        </div>
      </div>
      {showShare && <ShareModal user={user} onClose={() => setShowShare(false)} />}
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

  if (!splashDone) return <SplashScreen onDone={() => setSplashDone(true)} />;

  if (loading) return <div style={{ minHeight: "100vh", background: COLORS.bg }} />;
  if (!firebaseUser) return <AuthScreen />;
  if (!profile || profile.uid !== firebaseUser.uid) return <Onboarding firebaseUser={firebaseUser} onComplete={setProfile} />;
  return <MainApp user={profile} firebaseUser={firebaseUser} onProfileUpdate={setProfile} />;
}