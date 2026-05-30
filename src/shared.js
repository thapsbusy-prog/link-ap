import { useState } from "react";

export const COLORS = {
  bg: "#0A0A0F", card: "#13131A", border: "#2A2A3A",
  accent: "#F5A623", text: "#F0EEE8", textMuted: "#8A8A9A",
  green: "#4ADE80", purple: "#A78BFA", red: "#F87171", blue: "#60A5FA",
  chatBlue: "#1D4ED8",
};

export const USER_COLORS = ["#A78BFA", "#4ADE80", "#F5A623", "#60A5FA", "#F87171", "#34D399"];

export const LOOKING_FOR_OPTIONS = ["Investor", "Co-founder", "Mentor", "Collaboration", "Freelance Work", "Startup to join", "A Job", "Clients"];
export const TITLE_OPTIONS = ["Mr", "Mrs", "Ms", "Miss", "Mx", "Dr", "Prof", "Rev", "Sir", "Dame", "Adv"];
export const PRONOUN_OPTIONS = ["He/Him", "She/Her", "They/Them", "He/They", "She/They", "Ze/Zir", "Xe/Xem", "Any pronouns", "Prefer not to say"];
export const LOOKING_FOR_QUESTIONS = {
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
    { key: "clients_offerings", label: "What products or services do you offer?" },
    { key: "clients_rates", label: "What are your rates or pricing?" },
    { key: "clients_phone", label: "Business phone number" },
    { key: "clients_email", label: "Business email address", type: "email" },
    { key: "clients_website", label: "Website", type: "url" },
    { key: "clients_youtube", label: "YouTube channel", type: "url" },
    { key: "clients_twitter", label: "X (Twitter)", type: "url" },
    { key: "clients_facebook", label: "Facebook page", type: "url" },
    { key: "clients_instagram", label: "Instagram", type: "url" },
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
export const OPEN_TO_OPTIONS = ["Coffee Chats", "Mentorship", "Partnerships", "Beta Testing", "Advisory Roles", "Co-founder Conversations"];

export const getBringToTablePrompt = (lookingFor = []) => {
  if (lookingFor.includes("A Job")) return "What makes you different from other candidates?";
  if (lookingFor.includes("Investor")) return "What's your unfair advantage?";
  if (lookingFor.includes("Co-founder")) return "What do you bring to the partnership?";
  return "What value do you offer to the people you want to meet?";
};

export const normalizeUrl = (url) => {
  if (!url) return "";
  return url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
};
export const validateLinkedIn = (url) => url.includes("linkedin.com/in/");
export const linkedinNameMatches = (url, fullName) => {
  if (!url || !fullName) return false;
  const m = url.match(/linkedin\.com\/in\/([^/?#]+)/i);
  if (!m) return false;
  const slug = m[1].toLowerCase().replace(/[-_.\s]/g, "");
  const parts = fullName.trim().toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/).filter(Boolean);
  if (parts.length < 2) return false;
  return slug.includes(parts[0]) && slug.includes(parts[parts.length - 1]);
};

export function formatRelativeTime(ts) {
  if (!ts) return "";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  const diffMin = Math.floor((now - date) / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  if (diffHours < 168) return date.toLocaleDateString("en-US", { weekday: "short" });
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function LinkedInIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#0A66C2">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

export function LocationPin() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill={COLORS.textMuted} style={{ flexShrink: 0 }}>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  );
}

export function Avatar({ initials, color, size = 40, photoURL }) {
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

export function Tag({ label, color = COLORS.accent }) {
  return (
    <span style={{
      background: `${color}18`, color, border: `1px solid ${color}35`,
      borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 500,
    }}>{label}</span>
  );
}

export function SkillsInput({ skills, onChange, label = "Your key skills" }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const atMax = skills.length >= 5;
  const hasLegacy = skills.some(s => s.trim().split(/\s+/).length > 3);

  const addSkill = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (trimmed.split(/\s+/).length > 3) { setError("Keep it to 3 words max"); return; }
    if (!skills.includes(trimmed)) onChange([...skills, trimmed]);
    setInput("");
    setError("");
  };

  return (
    <div>
      <label style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 6, display: "block" }}>{label}</label>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={e => { setInput(e.target.value); setError(""); }}
          onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSkill())}
          placeholder={atMax ? "" : "e.g. Product Strategy"}
          disabled={atMax}
          style={{
            flex: 1, padding: "12px 16px", borderRadius: 12,
            background: COLORS.bg, border: `1px solid ${error ? COLORS.red : COLORS.border}`,
            color: COLORS.text, fontSize: 14, outline: "none", boxSizing: "border-box",
            opacity: atMax ? 0.4 : 1,
          }}
        />
        <button
          onClick={addSkill}
          disabled={atMax}
          style={{
            padding: "0 18px", borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: atMax ? "not-allowed" : "pointer",
            background: atMax ? COLORS.border : COLORS.accent, color: atMax ? COLORS.textMuted : "#000",
            border: "none", opacity: atMax ? 0.5 : 1, flexShrink: 0,
          }}
        >Add</button>
      </div>
      {error && <span style={{ fontSize: 12, color: COLORS.red, marginTop: 4, display: "block" }}>{error}</span>}
      {atMax && !error && <span style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 4, display: "block" }}>5 skills maximum</span>}
      {skills.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
          {skills.map(s => {
            const isLegacy = s.trim().split(/\s+/).length > 3;
            return (
              <button
                key={s}
                onClick={() => onChange(skills.filter(x => x !== s))}
                style={{
                  background: "#1A2E4A", color: COLORS.blue, padding: "5px 12px 5px 14px",
                  borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: "pointer",
                  border: `1px solid ${isLegacy ? "rgba(245,166,35,0.5)" : "transparent"}`,
                  display: "inline-flex", alignItems: "center", gap: 6,
                }}
              >
                {s}
                <span style={{ fontSize: 14, lineHeight: 1, color: COLORS.textMuted }}>×</span>
              </button>
            );
          })}
        </div>
      )}
      {hasLegacy && (
        <p style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 6, margin: "6px 0 0" }}>
          Some skills were updated before the 3-word limit — tap any to remove and re-add
        </p>
      )}
    </div>
  );
}

export function Input({ label, value, onChange, placeholder, type = "text", autoComplete }) {
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

export function TextArea({ label, value, onChange, placeholder }) {
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

export function Select({ label, value, onChange, options, placeholder }) {
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

export function isProfileComplete(user) {
  if (!user) return false;
  return (
    !!user.bio &&
    user.skills?.length > 0 &&
    user.lookingFor?.length > 0 &&
    !!user.bringToTable
  );
}

export function TermsContent() {
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
