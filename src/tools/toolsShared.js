import { COLORS } from "../shared";

export const CURRENCY_OPTIONS = ["ZAR", "USD", "GBP", "EUR"];
export const CURRENCY_SYMBOLS = { ZAR: "R", USD: "$", GBP: "£", EUR: "€" };

export const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 10,
  background: COLORS.bg,
  border: `1px solid ${COLORS.border}`,
  color: COLORS.text,
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

export const labelStyle = {
  fontSize: 12,
  color: COLORS.textMuted,
  marginBottom: 5,
  display: "block",
};

export const sectionCardStyle = {
  background: COLORS.card,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 14,
  padding: 18,
};

export const sectionLabelStyle = {
  fontSize: 11,
  color: COLORS.accent,
  fontWeight: 600,
  marginBottom: 14,
};

export const pillStyle = (active) => ({
  padding: "7px 14px", borderRadius: 20, cursor: "pointer",
  fontSize: 13, fontWeight: 500,
  background: active ? COLORS.accent : COLORS.card,
  color: active ? "#000" : COLORS.textMuted,
  border: `1px solid ${active ? COLORS.accent : COLORS.border}`,
});

export const newLineItem = () => ({
  id: `${Date.now()}-${Math.random()}`,
  description: "",
  qty: 1,
  unitPrice: "",
});

// ─── Action button styles (Start Over / Share / Download row) ─────────────────

export const startOverBtnStyle = {
  flex: 1, padding: "10px 14px", borderRadius: 10,
  border: `1px solid ${COLORS.border}`, background: "transparent",
  color: COLORS.textMuted, cursor: "pointer", fontSize: 13,
};

export const shareBtnStyle = {
  flex: 1, padding: "10px 14px", borderRadius: 10,
  border: `1px solid ${COLORS.border}`, background: "transparent",
  color: COLORS.text, cursor: "pointer", fontSize: 13, fontWeight: 500,
};

export const primaryBtnStyle = {
  flex: 2, padding: "10px 18px", borderRadius: 10,
  border: "none", background: COLORS.accent,
  color: "#000", cursor: "pointer", fontSize: 13, fontWeight: 700,
};

export const generateBtnStyle = (enabled) => ({
  padding: "14px", borderRadius: 12, border: "none",
  background: enabled ? COLORS.accent : COLORS.border,
  color: enabled ? "#000" : COLORS.textMuted,
  cursor: enabled ? "pointer" : "not-allowed",
  fontSize: 15, fontWeight: 700,
});

export const errorBoxStyle = {
  padding: "10px 14px", borderRadius: 10,
  background: `${COLORS.red}18`, color: COLORS.red, fontSize: 13,
};

/**
 * Shares a jsPDF document via the Web Share API Level 2 (file share),
 * falling back to text-only share, then to a direct download.
 * Silent on user-cancelled share (AbortError).
 */
export async function sharePdf(doc, fileName, title, text) {
  try {
    const file = new File([doc.output("blob")], fileName, { type: "application/pdf" });
    if (typeof navigator !== "undefined" && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ title, text, files: [file] });
      return;
    }
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({ title, text });
      return;
    }
    doc.save(fileName);
  } catch (e) {
    if (e.name !== "AbortError") {
      try { doc.save(fileName); } catch {}
    }
  }
}
