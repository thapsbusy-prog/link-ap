import { useState } from "react";
import { db, auth } from "./firebase";
import { serverTimestamp, doc, setDoc, runTransaction } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { COLORS, USER_COLORS, Input, Select, TITLE_OPTIONS } from "./shared";

export default function Onboarding({ firebaseUser, onComplete }) {
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [form, setForm] = useState({ title: "", firstName: "", lastName: "", role: "", location: "" });

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const valid = form.firstName.trim() && form.lastName.trim() && form.role.trim() && form.location.trim();

  const saveProfile = async () => {
    if (!valid || saving) return;
    setSaving(true);
    setSaveError("");
    try {
      const color = USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
      const fullName = [form.firstName.trim(), form.lastName.trim()].filter(Boolean).join(" ");
      const profile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || "",
        title: form.title,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        name: fullName,
        pronouns: "",
        role: form.role.trim(),
        location: form.location.trim(),
        bio: "",
        skills: [],
        lookingFor: [],
        achievements: [],
        avatar: fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?",
        color,
        nameLower: fullName.toLowerCase(),
        lastNameLower: form.lastName.trim().toLowerCase(),
        lookingForDetails: {},
        bringToTable: "",
        currentlyExploring: [],
        openTo: [],
        linkedinProfileUrl: "",
        linkedinVerified: false,
        photoURL: firebaseUser.photoURL || "",
        createdAt: serverTimestamp(),
        termsAcceptedAt: serverTimestamp(),
      };
      let signupIndex;
      await runTransaction(db, async (tx) => {
        const statsRef = doc(db, "meta", "stats");
        const statsSnap = await tx.get(statsRef);
        const current = statsSnap.exists() ? (statsSnap.data().totalUsers || 0) : 0;
        signupIndex = current + 1;
        tx.set(statsRef, { totalUsers: signupIndex }, { merge: true });
      });
      profile.signupIndex = signupIndex;
      profile.plan = signupIndex <= 100 ? "founding_member" : "free";
      profile.planAssignedAt = serverTimestamp();
      await setDoc(doc(db, "users", firebaseUser.uid), profile);
      onComplete(profile);
    } catch (e) {
      setSaveError("Failed to save profile. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 24px", background: COLORS.bg }}>
      <div style={{ width: "100%", maxWidth: 480 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: COLORS.text }}>
            Link<span style={{ color: COLORS.accent }}>-Ap</span>
          </div>
          <p style={{ color: COLORS.textMuted, fontSize: 13, marginTop: 4 }}>Just a few details to get you started</p>
          <button onClick={() => signOut(auth)} style={{
            marginTop: 10, background: "none", border: "none",
            color: COLORS.textMuted, cursor: "pointer", fontSize: 12,
            textDecoration: "underline",
          }}>Wrong account? Sign out</button>
        </div>

        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 20, padding: 32 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: COLORS.text, margin: "0 0 8px" }}>Who are you?</h2>
          <p style={{ color: COLORS.textMuted, fontSize: 13, margin: "0 0 28px" }}>
            You can fill in the rest of your profile once you're in the app.
          </p>

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
            <Input label="What do you do?" value={form.role} onChange={v => update("role", v)} placeholder="e.g. Entrepreneur, Developer, Designer" />
            <Input label="Location" value={form.location} onChange={v => update("location", v)} placeholder="e.g. Cape Town, SA" />
          </div>

          {saveError && (
            <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: 10, background: `${COLORS.red}18`, color: COLORS.red, fontSize: 13 }}>
              {saveError}
            </div>
          )}

          <button
            onClick={saveProfile}
            disabled={!valid || saving}
            style={{
              marginTop: 32, width: "100%", padding: "14px 24px", borderRadius: 12, border: "none",
              background: valid && !saving ? COLORS.accent : COLORS.border,
              color: valid && !saving ? "#000" : COLORS.textMuted,
              cursor: valid && !saving ? "pointer" : "not-allowed",
              fontSize: 15, fontWeight: 700,
            }}
          >
            {saving ? "Setting up..." : "Get Started →"}
          </button>
        </div>

        <p style={{ textAlign: "center", color: COLORS.textMuted, fontSize: 11, marginTop: 20 }}>
          By continuing you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
