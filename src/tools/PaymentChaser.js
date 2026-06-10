import { useState } from "react";
import { auth } from "../firebase";
import { COLORS } from "../shared";
import {
  CURRENCY_OPTIONS, inputStyle, labelStyle,
  sectionCardStyle, sectionLabelStyle, pillStyle,
  startOverBtnStyle, shareBtnStyle, primaryBtnStyle,
  generateBtnStyle, errorBoxStyle,
} from "./toolsShared";

const ESCALATION_LEVELS = ["Gentle nudge", "Firm reminder", "Final notice"];
const CHANNELS = ["Email", "WhatsApp"];

// ─── Message Preview ───────────────────────────────────────────────────────────

function ChaserPreview({ result, channel, onCopy, copied, onShare, canShare, onRegenerate, regenerating, onStartOver }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{
        background: COLORS.card, border: `1px solid ${COLORS.border}`,
        borderRadius: 16, overflow: "hidden",
      }}>
        <div style={{ background: COLORS.accent, padding: "14px 20px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#00000088", letterSpacing: 0.5 }}>
            {channel === "Email" ? "EMAIL DRAFT" : "WHATSAPP MESSAGE"}
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#000" }}>Payment Follow-Up</div>
        </div>
        <div style={{ padding: "20px 20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          {channel === "Email" && result.subject && (
            <div>
              <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600, marginBottom: 4 }}>SUBJECT</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>{result.subject}</div>
            </div>
          )}
          <div>
            <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600, marginBottom: 6 }}>MESSAGE</div>
            <p style={{
              fontSize: 13, color: COLORS.text, lineHeight: 1.7, margin: 0,
              whiteSpace: "pre-wrap", wordBreak: "break-word",
            }}>{result.message}</p>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button onClick={onStartOver} style={startOverBtnStyle}>Start Over</button>
        <button onClick={onRegenerate} disabled={regenerating} style={{ ...shareBtnStyle, opacity: regenerating ? 0.6 : 1 }}>
          {regenerating ? "Regenerating…" : "Regenerate"}
        </button>
        {canShare && (
          <button onClick={onShare} style={shareBtnStyle}>Share</button>
        )}
        <button onClick={onCopy} style={primaryBtnStyle}>
          {copied ? "Copied ✓" : "Copy to Clipboard"}
        </button>
      </div>
    </div>
  );
}

// ─── Payment Chaser (form + preview) ───────────────────────────────────────────

export default function PaymentChaser({ user }) {
  const [form, setForm] = useState({
    clientFirstName: "",
    fromName: user?.name || "",
    invoiceNumber: "",
    amount: "",
    currency: "ZAR",
    daysOverdue: "",
    escalationLevel: "Gentle nudge",
    channel: "Email",
  });
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const canSubmit =
    form.clientFirstName.trim() &&
    form.fromName.trim() &&
    parseFloat(form.amount) > 0 &&
    form.daysOverdue !== "";

  const generate = async () => {
    if (!canSubmit || generating) return;
    setGenerating(true);
    setGenError("");
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch("/api/tools/payment-chase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          clientFirstName: form.clientFirstName.trim(),
          fromName: form.fromName.trim(),
          invoiceNumber: form.invoiceNumber.trim(),
          amount: parseFloat(form.amount),
          currency: form.currency,
          daysOverdue: parseInt(form.daysOverdue, 10) || 0,
          escalationLevel: form.escalationLevel,
          channel: form.channel,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setGenError(errData.error || "Something went wrong. Please try again.");
        return;
      }
      const data = await res.json();
      setResult(data);
      setCopied(false);
    } catch {
      setGenError("Something went wrong. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    const text = form.channel === "Email" && result.subject
      ? `Subject: ${result.subject}\n\n${result.message}`
      : result.message;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleShare = async () => {
    if (!result) return;
    try {
      await navigator.share({ text: result.message });
    } catch (e) {
      if (e.name !== "AbortError") {}
    }
  };

  const startOver = () => {
    setResult(null);
    setGenError("");
    setCopied(false);
  };

  const canShare = typeof navigator !== "undefined" && !!navigator.share;

  if (result) {
    return (
      <ChaserPreview
        result={result}
        channel={form.channel}
        onCopy={handleCopy}
        copied={copied}
        onShare={handleShare}
        canShare={canShare}
        onRegenerate={generate}
        regenerating={generating}
        onStartOver={startOver}
      />
    );
  }

  // ── FORM VIEW ─────────────────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <p style={{ fontSize: 13, color: COLORS.textMuted, margin: 0 }}>
        Get a polite-but-firm payment reminder written for you in seconds.
      </p>

      <div style={sectionCardStyle}>
        <div style={sectionLabelStyle}>DETAILS</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={labelStyle}>Client First Name</label>
            <input
              style={inputStyle}
              value={form.clientFirstName}
              onChange={e => upd("clientFirstName", e.target.value)}
              placeholder="e.g. Sarah"
            />
          </div>
          <div>
            <label style={labelStyle}>Your Name / Business Name</label>
            <input
              style={inputStyle}
              value={form.fromName}
              onChange={e => upd("fromName", e.target.value)}
              placeholder="e.g. Thapelo Mokoena"
            />
          </div>
          <div>
            <label style={labelStyle}>Invoice Number (optional)</label>
            <input
              style={inputStyle}
              value={form.invoiceNumber}
              onChange={e => upd("invoiceNumber", e.target.value)}
              placeholder="e.g. INV-2026-014"
            />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 2 }}>
              <label style={labelStyle}>Amount Owed</label>
              <input
                style={inputStyle}
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={e => upd("amount", e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Currency</label>
              <select
                value={form.currency}
                onChange={e => upd("currency", e.target.value)}
                style={{ ...inputStyle, appearance: "none", WebkitAppearance: "none" }}
              >
                {CURRENCY_OPTIONS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Days Overdue</label>
            <input
              style={inputStyle}
              type="number"
              min="0"
              value={form.daysOverdue}
              onChange={e => upd("daysOverdue", e.target.value)}
              placeholder="e.g. 14"
            />
          </div>
        </div>
      </div>

      {/* Escalation level */}
      <div style={sectionCardStyle}>
        <div style={sectionLabelStyle}>ESCALATION LEVEL</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {ESCALATION_LEVELS.map(level => (
            <button
              key={level}
              onClick={() => upd("escalationLevel", level)}
              style={pillStyle(form.escalationLevel === level)}
            >{level}</button>
          ))}
        </div>
      </div>

      {/* Channel */}
      <div style={sectionCardStyle}>
        <div style={sectionLabelStyle}>CHANNEL</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {CHANNELS.map(ch => (
            <button
              key={ch}
              onClick={() => upd("channel", ch)}
              style={pillStyle(form.channel === ch)}
            >{ch}</button>
          ))}
        </div>
      </div>

      {genError && <div style={errorBoxStyle}>{genError}</div>}

      <button
        onClick={generate}
        disabled={!canSubmit || generating}
        style={generateBtnStyle(canSubmit && !generating)}
      >
        {generating ? "Generating…" : "Generate Message"}
      </button>
    </div>
  );
}
