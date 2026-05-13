import { useState, useEffect } from "react";
import { db, storage } from "./firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, doc, setDoc, getDocs, writeBatch } from "firebase/firestore";
import { COLORS, Avatar, LocationPin, LinkedInIcon, Input, TextArea, Select, SkillsInput, LOOKING_FOR_OPTIONS, LOOKING_FOR_QUESTIONS, OPEN_TO_OPTIONS, PRONOUN_OPTIONS, TITLE_OPTIONS, getBringToTablePrompt, normalizeUrl, validateLinkedIn, linkedinNameMatches } from "./shared";
import { ShareModal } from "./Discover";

export function Profile({ user, firebaseUser, onProfileUpdate, editTrigger }) {
  const [editing, setEditing] = useState(false);
  useEffect(() => { if (editTrigger) setEditing(true); }, [editTrigger]); // eslint-disable-line
  const [showShare, setShowShare] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [photoPreview, setPhotoPreview] = useState(user.photoURL || null);
  const [photoBlob, setPhotoBlob] = useState(null);
  const [form, setForm] = useState({
    name: user.name || "", role: user.role || "", location: user.location || "",
    bio: user.bio || "", skills: user.skills || [],
    achievements: user.achievements?.join(", ") || "",
    lookingFor: user.lookingFor || [],
    bringToTable: user.bringToTable || "",
    currentlyExploring: user.currentlyExploring?.join(", ") || "",
    openTo: user.openTo || [],
    lookingForDetails: user.lookingForDetails || {},
    linkedin: user.linkedinProfileUrl || "",
    title: user.title || "",
    pronouns: user.pronouns || "",
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
      canvas.toBlob((blob) => {
        setPhotoBlob(blob);
      }, "image/jpeg", 0.7);
    };
    img.src = objectUrl;
  };

  const saveProfile = async () => {
    setSaving(true);
    setSaveError("");
    try {
      let photoURL = photoPreview || "";
      if (photoBlob) {
        const storageRef = ref(storage, `avatars/${firebaseUser.uid}.jpg`);
        const snapshot = await uploadBytes(storageRef, photoBlob, { contentType: "image/jpeg" });
        photoURL = await getDownloadURL(snapshot.ref);
      }
      const updated = {
        ...user,
        title: form.title,
        pronouns: form.pronouns,
        name: form.name,
        role: form.role,
        location: form.location,
        bio: form.bio,
        skills: form.skills,
        achievements: form.achievements.split(",").map(s => s.trim()).filter(Boolean),
        lookingFor: form.lookingFor,
        avatar: form.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?",
        photoURL,
        bringToTable: form.bringToTable,
        currentlyExploring: form.currentlyExploring.split(",").map(s => s.trim()).filter(Boolean),
        openTo: form.openTo,
        lookingForDetails: form.lookingForDetails,
        linkedinProfileUrl: form.linkedin.trim() && validateLinkedIn(form.linkedin) ? normalizeUrl(form.linkedin) : "",
        linkedinVerified: !!(form.linkedin.trim() && validateLinkedIn(form.linkedin) && linkedinNameMatches(form.linkedin, form.name)),
        nameLower: form.name.toLowerCase(),
        lastNameLower: form.name.trim().split(/\s+/).pop()?.toLowerCase() || "",
      };
      await setDoc(doc(db, "users", firebaseUser.uid), updated);
      const matchesSnap = await getDocs(collection(db, "users", firebaseUser.uid, "matches"));
      if (!matchesSnap.empty) {
        const batch = writeBatch(db);
        const propagated = {
          name: updated.name,
          role: updated.role,
          location: updated.location,
          bio: updated.bio,
          skills: updated.skills,
          photoURL: updated.photoURL,
          avatar: updated.avatar,
          color: updated.color,
          lookingFor: updated.lookingFor,
          pronouns: updated.pronouns,
          title: updated.title,
        };
        matchesSnap.forEach((matchDoc) => {
          batch.update(doc(db, "users", matchDoc.id, "matches", firebaseUser.uid), propagated);
        });
        await batch.commit();
      }
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
      bio: user.bio || "", skills: user.skills || [],
      achievements: user.achievements?.join(", ") || "",
      lookingFor: user.lookingFor || [],
      bringToTable: user.bringToTable || "",
      currentlyExploring: user.currentlyExploring?.join(", ") || "",
      openTo: user.openTo || [],
      lookingForDetails: user.lookingForDetails || {},
      linkedin: user.linkedinProfileUrl || "",
      title: user.title || "",
      pronouns: user.pronouns || "",
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

        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: "0 0 130px" }}>
            <Select label="Title (optional)" value={form.title} onChange={v => update("title", v)} options={TITLE_OPTIONS} placeholder="Select title" />
          </div>
          <div style={{ flex: 1 }}>
            <Input label="Full Name" value={form.name} onChange={v => update("name", v)} placeholder="Your name" />
          </div>
        </div>
        <Select label="Pronouns (optional)" value={form.pronouns} onChange={v => update("pronouns", v)} options={PRONOUN_OPTIONS} placeholder="Select pronouns" />
        <Input label="What do you do?" value={form.role} onChange={v => update("role", v)} placeholder="e.g. Entrepreneur, Developer" />
        <Input label="Location" value={form.location} onChange={v => update("location", v)} placeholder="e.g. Cape Town, SA" />
        <div>
          <TextArea label="Bio" value={form.bio} onChange={v => { const words = v.trim().split(/\s+/).filter(Boolean); if (words.length <= 20 || v.length < form.bio.length) update("bio", v); }} placeholder="What are you building or working towards?" />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
            <span style={{ fontSize: 11, color: form.bio.trim().split(/\s+/).filter(Boolean).length >= 20 ? COLORS.accent : COLORS.textMuted }}>
              {form.bio.trim() ? form.bio.trim().split(/\s+/).filter(Boolean).length : 0} / 20 words
            </span>
          </div>
        </div>
        <TextArea label="What I Bring to the Table" value={form.bringToTable} onChange={v => update("bringToTable", v)} placeholder={getBringToTablePrompt(form.lookingFor)} />
        <SkillsInput skills={form.skills} onChange={v => update("skills", v)} label="Skills" />
        <Input label="Achievements (comma separated)" value={form.achievements} onChange={v => update("achievements", v)} placeholder="e.g. Built 2 startups" />
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Input label="LinkedIn Profile URL (optional)" value={form.linkedin} onChange={v => update("linkedin", v)} placeholder="Paste your LinkedIn profile URL (e.g. linkedin.com/in/yourname)" />
          {form.linkedin.trim() && !validateLinkedIn(form.linkedin) && (
            <span style={{ fontSize: 12, color: COLORS.red }}>Please enter a valid LinkedIn profile URL.</span>
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

        <button onClick={saveProfile} disabled={saving || !form.name || !form.role || !!(form.linkedin.trim() && !validateLinkedIn(form.linkedin))} style={{
          padding: "13px", borderRadius: 12, border: "none",
          background: !saving && form.name && form.role && !(form.linkedin.trim() && !validateLinkedIn(form.linkedin)) ? COLORS.accent : COLORS.border,
          color: !saving && form.name && form.role && !(form.linkedin.trim() && !validateLinkedIn(form.linkedin)) ? "#000" : COLORS.textMuted,
          cursor: !saving && form.name && form.role && !(form.linkedin.trim() && !validateLinkedIn(form.linkedin)) ? "pointer" : "not-allowed",
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
        <style>{`@keyframes linkApPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }`}</style>
        <div style={{ height: 4, background: user.color }} />
        <div>
          {/* Header */}
          <div style={{ background: "#16161F", padding: "24px 24px 20px" }}>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 16 }}>
              <Avatar initials={user.avatar} color={user.color} size={64} photoURL={user.photoURL} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <div style={{ fontSize: 19, fontWeight: 800, color: COLORS.text }}>{user.name}</div>
                      {user.linkedinVerified && user.linkedinProfileUrl && (
                        <a href={user.linkedinProfileUrl} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center" }}>
                          <LinkedInIcon />
                        </a>
                      )}
                    </div>
                    <div style={{ color: user.color, fontSize: 13, marginTop: 2 }}>{user.role}</div>
                  </div>
                  {user.lookingFor?.includes("Investor") && (
                    <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#0A2015", border: "1px solid #15532E", borderRadius: 20, padding: "4px 10px", flexShrink: 0 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.green, display: "inline-block", animation: "linkApPulse 2s ease-in-out infinite" }} />
                      <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.green }}>Actively raising</span>
                    </div>
                  )}
                </div>
                <div style={{ color: COLORS.textMuted, fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}>
                  <LocationPin />
                  {user.location}
                </div>
              </div>
            </div>
            {user.bio && (
              <p style={{ fontSize: 14, lineHeight: 1.7, color: COLORS.text, margin: 0 }}>{user.bio}</p>
            )}
          </div>

          {/* Body */}
          <div style={{ padding: "0 24px 28px" }}>

            {/* Skills */}
            {user.skills?.length > 0 && (
              <div style={{ paddingTop: 20, paddingBottom: 20, borderBottom: `1px solid ${COLORS.border}` }}>
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 10, fontWeight: 600 }}>SKILLS</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {user.skills.map(s => (
                    <span key={s} style={{ background: "#1A2E4A", color: COLORS.blue, padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500 }}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Q&A / Looking For block */}
            {user.lookingFor?.length > 0 && user.lookingForDetails && Object.values(user.lookingForDetails).some(v => v) && (
              <div style={{ paddingTop: 20, paddingBottom: 20, borderBottom: `1px solid ${COLORS.border}` }}>
                <div style={{ background: COLORS.bg, borderRadius: 12, padding: 16, border: `1px solid ${COLORS.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, letterSpacing: "0.08em" }}>
                      {user.lookingFor.includes("Investor") ? "INVESTOR DECK" : user.lookingFor.map(lf => lf.toUpperCase()).join(" · ")}
                    </div>
                    <div style={{ background: "#2D1F00", border: "1px solid #6B4A00", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600, color: COLORS.accent }}>
                      Open to conversations
                    </div>
                  </div>
                  {user.lookingFor.filter(lf => LOOKING_FOR_QUESTIONS[lf]?.some(q => user.lookingForDetails?.[q.key])).map((lf, lfIdx, filteredArr) => (
                    <div key={lf}>
                      {filteredArr.length > 1 && (
                        <div style={{ fontSize: 10, color: COLORS.accent, fontWeight: 600, marginBottom: 8 }}>{lf.toUpperCase()}</div>
                      )}
                      {LOOKING_FOR_QUESTIONS[lf].filter(q => user.lookingForDetails?.[q.key]).map((q, qIdx, qArr) => (
                        <div key={q.key}>
                          <div style={{ marginBottom: 10 }}>
                            <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 2 }}>{q.label}</div>
                            <div style={{ fontSize: 13, color: COLORS.text, fontWeight: 600, lineHeight: 1.5 }}>{user.lookingForDetails[q.key]}</div>
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
            {user.achievements?.length > 0 && (
              <div style={{ paddingTop: 20, paddingBottom: 20, borderBottom: `1px solid ${COLORS.border}` }}>
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 10, fontWeight: 600 }}>ACHIEVEMENTS</div>
                {user.achievements.map((a, i) => (
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
            {user.bringToTable && (
              <div style={{ paddingTop: 20, paddingBottom: (user.currentlyExploring?.length > 0 || user.openTo?.length > 0) ? 20 : 0, borderBottom: (user.currentlyExploring?.length > 0 || user.openTo?.length > 0) ? `1px solid ${COLORS.border}` : "none" }}>
                <div style={{ paddingLeft: 14, borderLeft: `3px solid ${COLORS.blue}` }}>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 6, fontWeight: 600 }}>WHAT I BRING TO THE TABLE</div>
                  <p style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.7, margin: 0 }}>{user.bringToTable}</p>
                </div>
              </div>
            )}

            {/* Currently Exploring + Open To */}
            {(user.currentlyExploring?.length > 0 || user.openTo?.length > 0) && (
              <div style={{ paddingTop: 20 }}>
                {user.currentlyExploring?.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 8, fontWeight: 600 }}>CURRENTLY EXPLORING</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {user.currentlyExploring.map(s => (
                        <span key={s} style={{ background: "#2A1A00", color: COLORS.accent, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 500 }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {user.openTo?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 8, fontWeight: 600 }}>OPEN TO</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {user.openTo.map(s => (
                        <span key={s} style={{ background: "#0A2015", color: COLORS.green, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 500 }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
      {showShare && <ShareModal user={user} onClose={() => setShowShare(false)} />}
    </div>
  );
}
