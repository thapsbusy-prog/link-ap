import { useState } from "react";
import { db, auth } from "./firebase";
import { serverTimestamp, doc, setDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import {
  COLORS, USER_COLORS, Input, TextArea, Select, SkillsInput,
  LOOKING_FOR_OPTIONS, TITLE_OPTIONS, PRONOUN_OPTIONS, LOOKING_FOR_QUESTIONS, OPEN_TO_OPTIONS,
  getBringToTablePrompt, validateLinkedIn, normalizeUrl, linkedinNameMatches,
} from "./shared";

export default function Onboarding({ firebaseUser, onComplete }) {
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
