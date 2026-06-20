import { useState } from "react";
import { auth } from "../firebase";
import { COLORS } from "../shared";
import {
  inputStyle, labelStyle,
  sectionCardStyle, sectionLabelStyle, pillStyle,
  startOverBtnStyle, shareBtnStyle, primaryBtnStyle,
  generateBtnStyle, errorBoxStyle,
} from "./toolsShared";

const VIBES = [
  "Casual & funny",
  "Real & raw (no filter)",
  "Chill & low-key",
  "Hype & energetic",
];

const ANGLE_TYPES = [
  "Surprise me",
  "Behind-the-scenes",
  "Customer story/results",
  "Myth-busting / hot take",
  "Day-in-the-life",
  "Before & after",
  "Price/value breakdown",
  "FAQ they keep asking me",
];

// ─── Angle Preview ─────────────────────────────────────────────────────────────

function AnglePreview({ result, onCopyHook, copiedHook, onCopyCaption, copiedCaption, onRegenerate, regenerating, onStartOver }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 16,
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{ background: COLORS.accent, padding: "14px 20px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#00000088", letterSpacing: 0.5 }}>
            TODAY'S ANGLE
          </div>
          <div style={{ fontSize: 17, fontWeight: 800, color: "#000" }}>{result.angleLabel}</div>
        </div>

        <div style={{ padding: "20px 20px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Why it works */}
          <div>
            <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600, marginBottom: 5 }}>
              WHY THIS WORKS
            </div>
            <p style={{ fontSize: 13, color: COLORS.textMuted, margin: 0, lineHeight: 1.65, fontStyle: "italic" }}>
              {result.whyItWorks}
            </p>
          </div>

          {/* Hook / opening line */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600 }}>YOUR OPENING LINE</div>
              <button
                onClick={onCopyHook}
                style={{ fontSize: 11, color: copiedHook ? "#3a7d44" : COLORS.accent, background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 600 }}
              >
                {copiedHook ? "Copied ✓" : "Copy"}
              </button>
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, margin: 0, lineHeight: 1.6 }}>
              {result.hook}
            </p>
          </div>

          {/* Beats */}
          <div>
            <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600, marginBottom: 8 }}>
              WHAT TO COVER (riff in your own words)
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {(result.beats || []).map((beat, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.accent, minWidth: 16, marginTop: 2 }}>
                    {i + 1}.
                  </span>
                  <span style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.55 }}>{beat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Caption */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600 }}>CAPTION</div>
              <button
                onClick={onCopyCaption}
                style={{ fontSize: 11, color: copiedCaption ? "#3a7d44" : COLORS.accent, background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 600 }}
              >
                {copiedCaption ? "Copied ✓" : "Copy"}
              </button>
            </div>
            <p style={{ fontSize: 13, color: COLORS.text, margin: 0, lineHeight: 1.6 }}>
              {result.caption}
            </p>
          </div>

          {/* CTA */}
          <div>
            <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600, marginBottom: 5 }}>
              YOUR CTA
            </div>
            <p style={{ fontSize: 13, color: COLORS.text, margin: 0, lineHeight: 1.6 }}>
              {result.cta}
            </p>
          </div>
        </div>
      </div>

      {/* Action buttons — two rows on narrow screens */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button onClick={onStartOver} style={startOverBtnStyle}>Start Over</button>
        <button
          onClick={onRegenerate}
          disabled={regenerating}
          style={{ ...shareBtnStyle, opacity: regenerating ? 0.6 : 1 }}
        >
          {regenerating ? "Finding angle…" : "Give me another angle"}
        </button>
        <button onClick={onCopyHook} style={{ ...shareBtnStyle }}>
          {copiedHook ? "Hook Copied ✓" : "Copy Hook"}
        </button>
        <button onClick={onCopyCaption} style={primaryBtnStyle}>
          {copiedCaption ? "Caption Copied ✓" : "Copy Caption"}
        </button>
      </div>
    </div>
  );
}

// ─── Daily Angle Generator (form + preview) ────────────────────────────────────

export default function DailyAngleGenerator({ user }) {
  const [form, setForm] = useState({
    productOrService: "",
    audience: "",
    currentVibe: "Casual & funny",
    angleType: "Surprise me",
  });
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [result, setResult] = useState(null);
  const [lastAngleLabel, setLastAngleLabel] = useState(null);
  const [copiedHook, setCopiedHook] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const canSubmit = form.productOrService.trim() && form.currentVibe;

  const generate = async () => {
    if (!canSubmit || generating) return;
    setGenerating(true);
    setGenError("");
    try {
      const token = await auth.currentUser.getIdToken();
      const body = {
        productOrService: form.productOrService.trim(),
        audience: form.audience.trim(),
        currentVibe: form.currentVibe,
        angleType: form.angleType,
      };
      if (form.angleType === "Surprise me" && lastAngleLabel) {
        body.lastAngleLabel = lastAngleLabel;
      }
      const res = await fetch("/api/tools/daily-angle-generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setGenError(errData.error || "Something went wrong. Please try again.");
        return;
      }
      const data = await res.json();
      setResult(data);
      setLastAngleLabel(data.angleLabel);
      setCopiedHook(false);
      setCopiedCaption(false);
    } catch {
      setGenError("Something went wrong. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyHook = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.hook);
      setCopiedHook(true);
      setTimeout(() => setCopiedHook(false), 2000);
    } catch {}
  };

  const handleCopyCaption = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.caption);
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2000);
    } catch {}
  };

  const startOver = () => {
    setResult(null);
    setGenError("");
    setCopiedHook(false);
    setCopiedCaption(false);
    setLastAngleLabel(null);
  };

  if (result) {
    return (
      <AnglePreview
        result={result}
        onCopyHook={handleCopyHook}
        copiedHook={copiedHook}
        onCopyCaption={handleCopyCaption}
        copiedCaption={copiedCaption}
        onRegenerate={generate}
        regenerating={generating}
        onStartOver={startOver}
      />
    );
  }

  // ── FORM VIEW ──────────────────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <p style={{ fontSize: 13, color: COLORS.textMuted, margin: 0 }}>
        New angle, every day you show up.
      </p>

      {/* Your offer */}
      <div style={sectionCardStyle}>
        <div style={sectionLabelStyle}>YOUR OFFER</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={labelStyle}>What do you sell or offer? *</label>
            <input
              style={inputStyle}
              value={form.productOrService}
              onChange={e => upd("productOrService", e.target.value)}
              placeholder="e.g. handmade candles, hair braiding, graphic design"
            />
          </div>
          <div>
            <label style={labelStyle}>Who's it for? (optional)</label>
            <input
              style={inputStyle}
              value={form.audience}
              onChange={e => upd("audience", e.target.value)}
              placeholder="e.g. busy moms in Joburg, small businesses"
            />
          </div>
        </div>
      </div>

      {/* Vibe */}
      <div style={sectionCardStyle}>
        <div style={sectionLabelStyle}>YOUR TIKTOK VIBE</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {VIBES.map(v => (
            <button key={v} onClick={() => upd("currentVibe", v)} style={pillStyle(form.currentVibe === v)}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Angle type */}
      <div style={sectionCardStyle}>
        <div style={sectionLabelStyle}>ANGLE TYPE</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {ANGLE_TYPES.map(a => (
            <button key={a} onClick={() => upd("angleType", a)} style={pillStyle(form.angleType === a)}>
              {a}
            </button>
          ))}
        </div>
      </div>

      {genError && <div style={errorBoxStyle}>{genError}</div>}

      <button
        onClick={generate}
        disabled={!canSubmit || generating}
        style={generateBtnStyle(canSubmit && !generating)}
      >
        {generating ? "Generating…" : "Get Today's Angle ✦"}
      </button>
    </div>
  );
}
