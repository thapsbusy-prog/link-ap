import { useState, useEffect } from "react";
import { db, storage } from "./firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, doc, setDoc, getDocs, writeBatch } from "firebase/firestore";
import { COLORS, Avatar, LocationPin, LinkedInIcon, Input, TextArea, Select, SkillsInput, LOOKING_FOR_OPTIONS, LOOKING_FOR_QUESTIONS, OPEN_TO_OPTIONS, PRONOUN_OPTIONS, TITLE_OPTIONS, getBringToTablePrompt, normalizeUrl, validateLinkedIn, linkedinNameMatches, isProfileComplete } from "./shared";
import { ShareModal } from "./Discover";

const SCORE_COLOR = (s) => s >= 80 ? "#22C55E" : s >= 55 ? COLORS.accent : "#EF4444";

const COMPLETION_SECTIONS = [
  { key: "bio", label: "Your story (bio)", filled: u => !!u.bio },
  { key: "skills", label: "Your skills", filled: u => u.skills?.length > 0 },
  { key: "lookingFor", label: "What you're looking for", filled: u => u.lookingFor?.length > 0 },
  { key: "bringToTable", label: "What you bring to the table", filled: u => !!u.bringToTable },
];

function ProfileCompletePrompt({ user, onEdit }) {
  const sections = COMPLETION_SECTIONS.map(s => ({ ...s, done: s.filled(user) }));
  const missing = sections.filter(s => !s.done);
  if (missing.length === 0) return null;
  const pct = Math.round(((sections.length - missing.length) / sections.length) * 100);

  return (
    <div style={{
      background: COLORS.card, border: `1px solid ${COLORS.accent}55`,
      borderRadius: 16, padding: "16px 20px", marginBottom: 16,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, margin: 0 }}>Finish setting up your profile</p>
          <p style={{ fontSize: 11, color: COLORS.textMuted, margin: "3px 0 0" }}>
            A complete profile gets more matches
          </p>
        </div>
        <div style={{
          width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
          border: `2.5px solid ${COLORS.accent}`,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: COLORS.accent, lineHeight: 1 }}>{pct}%</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 14 }}>
        {sections.map(s => (
          <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ fontSize: 13, color: s.done ? COLORS.green : COLORS.textMuted, lineHeight: 1 }}>
              {s.done ? "✓" : "○"}
            </span>
            <span style={{ fontSize: 13, color: s.done ? COLORS.textMuted : COLORS.text }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <button onClick={onEdit} style={{
        width: "100%", padding: "11px", borderRadius: 10, border: "none",
        background: COLORS.accent, color: "#000", cursor: "pointer",
        fontSize: 13, fontWeight: 700,
      }}>
        Complete profile →
      </button>
    </div>
  );
}

const renderLookingForValue = (q, val) => {
  if (!val) return val;
  if (q.type === "email") return <a href={`mailto:${val}`} style={{ color: COLORS.accent, textDecoration: "none" }}>{val}</a>;
  if (q.type === "url") {
    const href = /^https?:\/\//i.test(val) ? val : `https://${val}`;
    return <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: COLORS.accent, textDecoration: "none" }}>{val}</a>;
  }
  return val;
};

function ProfileScoreCard({ scoreData, scoreLoading, onRescore }) {
  const handleShare = async () => {
    const text = `My Link-Ap profile scored ${scoreData.total}/100 — see how yours compares 👇\nlink-ap.online`;
    if (navigator.share) {
      try { await navigator.share({ text }); } catch {}
    } else {
      try { await navigator.clipboard.writeText(text); } catch {}
    }
  };

  if (scoreLoading) {
    return (
      <div style={{
        background: COLORS.card, border: `1px solid ${COLORS.border}`,
        borderRadius: 16, padding: "18px 20px", marginBottom: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: COLORS.border }} />
          <div>
            <div style={{ width: 80, height: 14, background: COLORS.border, borderRadius: 4, marginBottom: 6 }} />
            <div style={{ width: 50, height: 10, background: COLORS.border, borderRadius: 4 }} />
          </div>
        </div>
        {[0,1,2].map(i => (
          <div key={i} style={{ marginBottom: 10 }}>
            <div style={{ width: `${70 - i * 10}%`, height: 10, background: COLORS.border, borderRadius: 4, marginBottom: 4 }} />
            <div style={{ width: "100%", height: 6, background: COLORS.border, borderRadius: 3 }} />
          </div>
        ))}
      </div>
    );
  }

  if (!scoreData) return null;

  const { total, dimensions } = scoreData;
  const color = SCORE_COLOR(total);
  const tips = dimensions.filter(d => d.tip).sort((a, b) => a.score - b.score).slice(0, 2);

  return (
    <div style={{
      background: COLORS.card, border: `1px solid ${COLORS.border}`,
      borderRadius: 16, padding: "18px 20px", marginBottom: 16,
    }}>
      {/* Score header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%",
            border: `3px solid ${color}`,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 17, fontWeight: 800, color, lineHeight: 1 }}>{total}</span>
            <span style={{ fontSize: 8, color: COLORS.textMuted, lineHeight: 1 }}>/100</span>
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, margin: 0 }}>Profile Score</p>
            <p style={{ fontSize: 11, color: COLORS.textMuted, margin: "2px 0 0" }}>
              {total >= 80 ? "Strong — you stand out" : total >= 55 ? "Good — a few tweaks will help" : "Needs work — let's fix this"}
            </p>
          </div>
        </div>
        <button
          onClick={handleShare}
          style={{
            background: "transparent", border: `1px solid ${COLORS.border}`,
            borderRadius: 8, padding: "6px 10px", color: COLORS.textMuted,
            fontSize: 12, cursor: "pointer",
          }}
        >
          Share ↗
        </button>
      </div>

      {/* Dimension bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: tips.length ? 14 : 0 }}>
        {dimensions.map(d => {
          const pct = Math.round((d.score / 20) * 100);
          const dc = SCORE_COLOR(pct);
          return (
            <div key={d.name}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontSize: 11, color: COLORS.textMuted }}>{d.name}</span>
                <span style={{ fontSize: 11, color: dc, fontWeight: 600 }}>{d.score}/20</span>
              </div>
              <div style={{ height: 5, background: COLORS.border, borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: dc, borderRadius: 3, transition: "width 0.6s ease" }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Tips */}
      {tips.length > 0 && (
        <div style={{
          background: "#0A0A0F", borderRadius: 10, padding: "10px 12px",
          border: `1px solid ${COLORS.border}`,
        }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.7, color: COLORS.accent, margin: "0 0 6px" }}>
            Quick wins
          </p>
          {tips.map((d, i) => (
            <p key={i} style={{ fontSize: 12, color: COLORS.textMuted, margin: i < tips.length - 1 ? "0 0 4px" : 0, lineHeight: 1.5 }}>
              · {d.tip}
            </p>
          ))}
        </div>
      )}

      <button
        onClick={onRescore}
        style={{
          marginTop: 10, background: "transparent", border: "none",
          color: COLORS.textMuted, fontSize: 11, cursor: "pointer", padding: 0,
        }}
      >
        Re-score my profile →
      </button>
    </div>
  );
}

export function Profile({ user, firebaseUser, onProfileUpdate, editTrigger, onSettings }) {
  const [editing, setEditing] = useState(false);
  useEffect(() => { if (editTrigger) setEditing(true); }, [editTrigger]); // eslint-disable-line
  const [showShare, setShowShare] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [scoreData, setScoreData] = useState(null);
  const [scoreLoading, setScoreLoading] = useState(true);
  const [generatingPDF, setGeneratingPDF] = useState(false);
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

  const fetchScore = async (forceRefresh = false) => {
    setScoreLoading(true);
    try {
      const token = await firebaseUser.getIdToken();
      const url = forceRefresh ? "/api/profile-score?refresh=true" : "/api/profile-score";
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      setScoreData(data);
    } catch (err) {
      console.error("Profile score fetch error:", err);
      setScoreData(null);
    } finally {
      setScoreLoading(false);
    }
  };

  useEffect(() => { fetchScore(); }, []); // eslint-disable-line

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
      await setDoc(doc(db, "users", firebaseUser.uid), updated, { merge: true });
      onProfileUpdate(updated);
      setEditing(false);
      fetchScore(true);
      try {
        const matchesSnap = await getDocs(collection(db, "users", firebaseUser.uid, "matches"));
        if (!matchesSnap.empty) {
          const batch = writeBatch(db);
          const propagated = {
            uid: firebaseUser.uid,
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
            batch.set(doc(db, "users", matchDoc.id, "matches", firebaseUser.uid), propagated, { merge: true });
          });
          await batch.commit();
        }
      } catch (propErr) {
        console.warn("Profile saved but match propagation failed:", propErr);
      }
    } catch (e) {
      setSaveError("Failed to save. Please try again.");
    }
    setSaving(false);
  };

  const generateProfilePDF = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const PW = 210;
    const M = 18;
    const CW = PW - M * 2;

    const hexToRgb = hex => [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)];
    const [ur, ug, ub] = hexToRgb(user.color || '#A78BFA');

    // Top accent strip
    doc.setFillColor(ur, ug, ub);
    doc.rect(0, 0, PW, 3, 'F');

    // Header bg
    doc.setFillColor(248, 248, 252);
    doc.rect(0, 3, PW, 42, 'F');

    // Name (starts at left margin — no avatar circle)
    const displayName = [user.title, user.name].filter(Boolean).join(' ');
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 26, 46);
    doc.text(displayName, M, 17);

    // Role
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(ur, ug, ub);
    doc.text(user.role, M, 25);

    // Location (single draw — no emoji to avoid rendering artefacts)
    doc.setFontSize(9.5);
    doc.setTextColor(120, 120, 140);
    doc.text(user.location, M, 32);

    // LinkedIn
    if (user.linkedinProfileUrl) {
      doc.setFontSize(8.5);
      doc.setTextColor(10, 102, 194);
      doc.text(user.linkedinProfileUrl.replace(/^https?:\/\//i, ''), M, 39);
    }

    // Pronouns on its own line (muted, right-aligned to avoid clashing with name)
    if (user.pronouns) {
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(138, 138, 154);
      doc.text(user.pronouns, PW - M, 17, { align: 'right' });
    }

    // Branding (top-right, below pronouns)
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(ur, ug, ub);
    doc.text('Link-Ap', PW - M, 32, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(138, 138, 154);
    doc.text('link-ap.online', PW - M, 38, { align: 'right' });

    let y = 56;

    const checkPageBreak = (needed = 20) => {
      if (y + needed > 270) {
        doc.addPage();
        y = 20;
      }
    };

    const sectionLabel = (label, indent = M) => {
      checkPageBreak(10);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(138, 138, 154);
      doc.text(label, indent, y);
      y += 5.5;
    };

    const divider = () => {
      checkPageBreak(15);
      doc.setDrawColor(220, 220, 230);
      doc.line(M, y, PW - M, y);
      y += 8;
    };

    if (user.bio) {
      sectionLabel('ABOUT');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(45, 45, 58);
      const lines = doc.splitTextToSize(user.bio, CW);
      checkPageBreak(lines.length * 5.5);
      doc.text(lines, M, y);
      y += lines.length * 5.5 + 10;
    }

    if (user.skills?.length > 0) {
      divider();
      sectionLabel('SKILLS');
      let x = M;
      doc.setFontSize(8.5);
      for (const skill of user.skills) {
        const sw = doc.getTextWidth(skill) + 7;
        if (x + sw > PW - M) { x = M; y += 8; }
        doc.setFillColor(235, 235, 248);
        doc.roundedRect(x, y - 4.5, sw, 6.5, 1.5, 1.5, 'F');
        doc.setTextColor(45, 45, 58);
        doc.text(skill, x + 3.5, y);
        x += sw + 4;
      }
      y += 14;
    }

    // Looking For — categories summary + all Q&A details
    if (user.lookingFor?.length > 0) {
      divider();
      sectionLabel('LOOKING FOR');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(45, 45, 58);
      const lfSummary = doc.splitTextToSize(user.lookingFor.join('  ·  '), CW);
      doc.text(lfSummary, M, y);
      y += lfSummary.length * 5.5 + 6;

      if (user.lookingForDetails && Object.values(user.lookingForDetails).some(v => v)) {
        for (const lf of user.lookingFor) {
          const questions = LOOKING_FOR_QUESTIONS[lf] || [];
          const filledQs = questions.filter(q => user.lookingForDetails?.[q.key]);
          if (filledQs.length === 0) continue;

          checkPageBreak(14);
          y += 4;
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(ur, ug, ub);
          doc.text(lf.toUpperCase(), M, y);
          y += 5.5;

          for (const q of filledQs) {
            checkPageBreak(14);
            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(138, 138, 154);
            doc.text(q.label, M, y);
            y += 4.5;
            doc.setFontSize(9.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(45, 45, 58);
            const valLines = doc.splitTextToSize(String(user.lookingForDetails[q.key]), CW);
            checkPageBreak(valLines.length * 5 + 4);
            doc.text(valLines, M, y);
            y += valLines.length * 5 + 5;
          }
          y += 2;
        }
      }
      y += 4;
    }

    if (user.bringToTable) {
      divider();
      const bringLines = doc.splitTextToSize(user.bringToTable, CW - 8);
      const barH = bringLines.length * 5.5 + 14;
      checkPageBreak(barH + 10);
      // Left accent bar
      doc.setFillColor(ur, ug, ub);
      doc.rect(M, y - 2, 2.5, barH, 'F');
      // Label and content indented past the bar
      sectionLabel('WHAT I BRING TO THE TABLE', M + 7);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(45, 45, 58);
      doc.text(bringLines, M + 7, y);
      y += bringLines.length * 5.5 + 10;
    }

    if (user.achievements?.length > 0) {
      divider();
      sectionLabel('ACHIEVEMENTS');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(45, 45, 58);
      for (const a of user.achievements) {
        const lines = doc.splitTextToSize(`•  ${a}`, CW);
        checkPageBreak(lines.length * 5.5 + 3);
        doc.text(lines, M, y);
        y += lines.length * 5.5 + 3;
      }
      y += 5;
    }

    if (user.openTo?.length > 0 || user.currentlyExploring?.length > 0) {
      divider();
      if (user.openTo?.length > 0) {
        sectionLabel('OPEN TO');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(45, 45, 58);
        const openLines = doc.splitTextToSize(user.openTo.join('  ·  '), CW);
        doc.text(openLines, M, y);
        y += openLines.length * 5.5 + 8;
      }
      if (user.currentlyExploring?.length > 0) {
        sectionLabel('CURRENTLY EXPLORING');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(45, 45, 58);
        const expLines = doc.splitTextToSize(user.currentlyExploring.join('  ·  '), CW);
        checkPageBreak(expLines.length * 5.5);
        doc.text(expLines, M, y);
        y += expLines.length * 5.5 + 10;
      }
    }

    // Footer on every page
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFillColor(248, 248, 252);
      doc.rect(0, 281, PW, 16, 'F');
      doc.setDrawColor(220, 220, 230);
      doc.line(0, 281, PW, 281);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(138, 138, 154);
      doc.text(`link-ap.online/user/${user.uid}`, PW / 2, 288, { align: 'center' });
      doc.setFontSize(7);
      doc.text(
        `Generated with Link-Ap  ·  link-ap.online${totalPages > 1 ? `  ·  Page ${p} of ${totalPages}` : ''}`,
        PW / 2, 293, { align: 'center' }
      );
    }

    // arraybuffer → Blob is more reliable than doc.output('blob') across environments
    return new Blob([doc.output('arraybuffer')], { type: 'application/pdf' });
  };

  const handleSharePDF = async () => {
    if (generatingPDF) return;
    setGeneratingPDF(true);
    try {
      const blob = await generateProfilePDF();
      const fileName = `${(user.name || 'profile').replace(/\s+/g, '-')}-Link-Ap.pdf`;
      const file = new File([blob], fileName, { type: 'application/pdf' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: `${user.name}'s Link-Ap Profile`, text: 'Check out my professional profile on Link-Ap' });
        } catch (e) {
          if (e.name !== 'AbortError') { downloadBlob(blob, fileName); }
        }
      } else {
        downloadBlob(blob, fileName);
      }
    } catch (e) {
      console.error('PDF generation error:', e);
    } finally {
      setGeneratingPDF(false);
    }
  };

  const downloadBlob = (blob, fileName) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = fileName;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
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
                      type={q.type || "text"}
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
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => setShowShare(true)} style={{
            padding: "8px 16px", borderRadius: 10, border: `1px solid ${COLORS.border}`,
            background: "transparent", color: COLORS.accent, cursor: "pointer", fontSize: 13, fontWeight: 600,
          }}>Share</button>
          <button onClick={() => setEditing(true)} style={{
            padding: "8px 16px", borderRadius: 10, border: `1px solid ${COLORS.border}`,
            background: "transparent", color: COLORS.text, cursor: "pointer", fontSize: 13, fontWeight: 500,
          }}>Edit</button>
          {onSettings && (
            <button onClick={onSettings} style={{
              background: "transparent", border: `1px solid ${COLORS.border}`,
              borderRadius: 10, width: 36, height: 36, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg viewBox="0 0 24 24" fill={COLORS.textMuted} width="16" height="16">
                <path d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.56-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.07.63-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.11-.21.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
              </svg>
            </button>
          )}
        </div>
      </div>
      {isProfileComplete(user) ? (
        <ProfileScoreCard scoreData={scoreData} scoreLoading={scoreLoading} onRescore={() => fetchScore(true)} />
      ) : (
        <div style={{
          background: COLORS.card,
          border: "1px solid rgba(245,166,35,0.2)",
          borderRadius: 16, padding: "20px",
          marginBottom: 16,
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: "rgba(245,166,35,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke={COLORS.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, marginBottom: 3 }}>AI Profile Score — locked</div>
            <div style={{ fontSize: 11, color: COLORS.textMuted, lineHeight: 1.5 }}>
              Complete your bio, skills, what you're looking for, and what you bring to the table to unlock your AI score.
            </div>
          </div>
        </div>
      )}
      <ProfileCompletePrompt user={user} onEdit={() => setEditing(true)} />

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
                      {user.pronouns && <span style={{ fontSize: 11, color: COLORS.textMuted, fontStyle: "italic" }}>{user.pronouns}</span>}
                      {user.linkedinVerified && user.linkedinProfileUrl && (
                        <a href={user.linkedinProfileUrl} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center" }}>
                          <LinkedInIcon />
                        </a>
                      )}
                    </div>
                    <div style={{ color: user.color, fontSize: 13, marginTop: 2 }}>{user.role}</div>
                    {user?.plan === "founding_member" && (
                      <div style={{ fontSize: 11, color: "#F5A623", fontWeight: 600, marginTop: 3 }}>
                        ⭐ Founding Member #{user.signupIndex}
                      </div>
                    )}
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
                            <div style={{ fontSize: 13, color: COLORS.text, fontWeight: 600, lineHeight: 1.5 }}>{renderLookingForValue(q, user.lookingForDetails[q.key])}</div>
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

          {/* Share as PDF — green when profile is 100% complete */}
          {(() => {
            const isComplete = COMPLETION_SECTIONS.every(s => s.filled(user));
            return (
              <div style={{ padding: "0 24px 24px" }}>
                <button
                  onClick={isComplete ? handleSharePDF : undefined}
                  disabled={generatingPDF}
                  style={{
                    width: "100%", padding: "13px", borderRadius: 12, border: "none",
                    background: isComplete ? COLORS.green : COLORS.border,
                    color: isComplete ? "#000" : COLORS.textMuted,
                    cursor: isComplete && !generatingPDF ? "pointer" : "not-allowed",
                    fontSize: 14, fontWeight: 700, transition: "background 0.3s",
                  }}
                >
                  {generatingPDF ? "Generating PDF..." : isComplete ? "Share Profile as PDF ↗" : "Complete your profile to share as PDF"}
                </button>
                {!isComplete && (
                  <p style={{ fontSize: 11, color: COLORS.textMuted, textAlign: "center", margin: "8px 0 0" }}>
                    Fill in bio, skills, looking for, and what you bring to unlock
                  </p>
                )}
              </div>
            );
          })()}

        </div>
      </div>
      {showShare && <ShareModal user={user} onClose={() => setShowShare(false)} />}
    </div>
  );
}
