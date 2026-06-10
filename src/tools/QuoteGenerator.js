import { useState } from "react";
import { jsPDF } from "jspdf";
import { auth } from "../firebase";
import { COLORS } from "../shared";
import {
  CURRENCY_OPTIONS, CURRENCY_SYMBOLS, inputStyle, labelStyle,
  sectionCardStyle, sectionLabelStyle, newLineItem,
  startOverBtnStyle, shareBtnStyle, primaryBtnStyle,
  generateBtnStyle, errorBoxStyle, sharePdf,
} from "./toolsShared";

const VALIDITY_OPTIONS = [
  { label: "7 days", value: 7 },
  { label: "14 days", value: 14 },
  { label: "30 days", value: 30 },
];

// ─── Quote Preview ─────────────────────────────────────────────────────────────

function QuotePreview({ quote, onStartOver, onDownload, onConvertToInvoice, buildPdf, pdfFileName }) {
  const sym = quote.currencySymbol || "";

  const handleShare = () => {
    const doc = buildPdf();
    return sharePdf(
      doc,
      pdfFileName,
      `Quote ${quote.quoteNumber}`,
      `Quote from ${quote.fromName} for ${quote.clientName} — ${sym}${quote.total.toFixed(2)}`
    );
  };

  return (
    <div>
      {/* Action buttons */}
      <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
        <button onClick={onStartOver} style={startOverBtnStyle}>Start Over</button>
        <button onClick={handleShare} style={shareBtnStyle}>Share</button>
        <button onClick={onDownload} style={primaryBtnStyle}>Download PDF</button>
      </div>
      <div style={{ marginBottom: 20 }}>
        <button
          onClick={() => onConvertToInvoice(quote)}
          style={{
            width: "100%", padding: "10px 14px", borderRadius: 10,
            border: `1px dashed ${COLORS.accent}`, background: "transparent",
            color: COLORS.accent, cursor: "pointer", fontSize: 13, fontWeight: 600,
          }}
        >Convert to Invoice →</button>
      </div>

      {/* Preview card */}
      <div style={{
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 16,
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          background: COLORS.accent,
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: "#000", letterSpacing: 1 }}>QUOTATION</span>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#000" }}>{quote.quoteNumber}</div>
            <div style={{ fontSize: 11, color: "#00000099" }}>Issued {quote.quoteDate}</div>
          </div>
        </div>

        <div style={{ padding: "20px 20px 24px" }}>
          {/* From / To */}
          <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600, marginBottom: 5 }}>FROM</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.text }}>{quote.fromName}</div>
              {quote.fromEmail && (
                <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>{quote.fromEmail}</div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600, marginBottom: 5 }}>TO</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.text }}>{quote.clientName}</div>
              {quote.clientEmail && (
                <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>{quote.clientEmail}</div>
              )}
            </div>
          </div>

          {/* Valid until */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "5px 12px", borderRadius: 20,
            background: `${COLORS.accent}18`, border: `1px solid ${COLORS.accent}44`,
            marginBottom: 20,
          }}>
            <span style={{ fontSize: 11, color: COLORS.textMuted }}>Valid until</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.accent }}>{quote.validUntil}</span>
          </div>

          {/* Line items table */}
          <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 14, marginBottom: 14 }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 36px 76px 76px",
              gap: 6,
              paddingBottom: 8,
              marginBottom: 6,
              borderBottom: `1px solid ${COLORS.border}`,
            }}>
              {["Description", "Qty", "Unit", "Total"].map(h => (
                <div key={h} style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600 }}>{h}</div>
              ))}
            </div>
            {quote.lineItems.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 36px 76px 76px",
                  gap: 6,
                  padding: "7px 0",
                  borderBottom: i < quote.lineItems.length - 1 ? `1px solid ${COLORS.border}22` : "none",
                }}
              >
                <div style={{ fontSize: 13, color: COLORS.text }}>{item.description}</div>
                <div style={{ fontSize: 13, color: COLORS.textMuted, textAlign: "center" }}>{item.qty}</div>
                <div style={{ fontSize: 13, color: COLORS.textMuted, textAlign: "right" }}>
                  {sym}{(item.unitPrice || 0).toFixed(2)}
                </div>
                <div style={{ fontSize: 13, color: COLORS.text, fontWeight: 600, textAlign: "right" }}>
                  {sym}{(item.total || 0).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", width: 180 }}>
              <span style={{ fontSize: 12, color: COLORS.textMuted }}>Subtotal</span>
              <span style={{ fontSize: 13, color: COLORS.text }}>
                {sym}{(quote.subtotal || 0).toFixed(2)}
              </span>
            </div>
            {quote.tax > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", width: 180 }}>
                <span style={{ fontSize: 12, color: COLORS.textMuted }}>VAT (15%)</span>
                <span style={{ fontSize: 13, color: COLORS.text }}>
                  {sym}{(quote.tax || 0).toFixed(2)}
                </span>
              </div>
            )}
            <div style={{
              display: "flex", justifyContent: "space-between", width: 180,
              paddingTop: 12, marginTop: 8, borderTop: `1px solid ${COLORS.border}`,
            }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>Total</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: COLORS.accent }}>
                {sym}{(quote.total || 0).toFixed(2)}
              </span>
            </div>
            {quote.depositAmount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", width: 180 }}>
                <span style={{ fontSize: 12, color: COLORS.textMuted }}>Deposit ({quote.depositPercent}%)</span>
                <span style={{ fontSize: 13, color: COLORS.accent, fontWeight: 600 }}>
                  {sym}{(quote.depositAmount || 0).toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Notes */}
          {quote.notes && (
            <div style={{
              marginTop: 20,
              padding: "12px 16px",
              background: COLORS.bg,
              borderRadius: 10,
              borderLeft: `3px solid ${COLORS.accent}`,
            }}>
              <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600, marginBottom: 4 }}>NOTES</div>
              <p style={{ fontSize: 13, color: COLORS.textMuted, margin: 0, lineHeight: 1.6 }}>{quote.notes}</p>
            </div>
          )}

          {/* Terms */}
          {quote.termsAndConditions && (
            <div style={{ marginTop: 14, fontSize: 12, color: COLORS.textMuted, wordBreak: "break-word", overflowWrap: "break-word" }}>
              {quote.termsAndConditions}
            </div>
          )}

          {/* Footer */}
          <div style={{ marginTop: 20, paddingTop: 14, borderTop: `1px solid ${COLORS.border}`, textAlign: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: COLORS.accent }}>Link</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: COLORS.textMuted }}>-Ap</span>
            <span style={{ fontSize: 11, color: COLORS.textMuted }}> · link-ap.online</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Quote Generator (form + preview) ──────────────────────────────────────────

export default function QuoteGenerator({ user, onConvertToInvoice }) {
  const [view, setView] = useState("form");
  const [form, setForm] = useState({
    fromName: user?.name || "",
    fromEmail: user?.email || "",
    clientName: "",
    clientEmail: "",
    currency: "ZAR",
    validityDays: 14,
    depositPercent: "",
  });
  const [lineItems, setLineItems] = useState([newLineItem()]);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [quote, setQuote] = useState(null);

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const updItem = (id, k, v) =>
    setLineItems(items => items.map(i => i.id === id ? { ...i, [k]: v } : i));

  const sym = CURRENCY_SYMBOLS[form.currency] || "";

  const subtotal = lineItems.reduce(
    (s, i) => s + (parseFloat(i.qty) || 0) * (parseFloat(i.unitPrice) || 0),
    0
  );

  const canSubmit =
    form.fromName.trim() &&
    form.clientName.trim() &&
    lineItems.some(i => i.description.trim() && parseFloat(i.unitPrice) > 0);

  const generate = async () => {
    if (!canSubmit || generating) return;
    setGenerating(true);
    setGenError("");
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch("/api/tools/quote-generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fromName: form.fromName.trim(),
          fromEmail: form.fromEmail.trim(),
          clientName: form.clientName.trim(),
          clientEmail: form.clientEmail.trim(),
          currency: form.currency,
          validityDays: form.validityDays,
          depositPercent: form.depositPercent,
          lineItems: lineItems
            .filter(i => i.description.trim() && parseFloat(i.unitPrice) > 0)
            .map(i => ({
              description: i.description.trim(),
              qty: parseFloat(i.qty) || 1,
              unitPrice: parseFloat(i.unitPrice),
            })),
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setGenError(errData.error || "Something went wrong. Please try again.");
        return;
      }
      const data = await res.json();
      setQuote(data);
      setView("preview");
    } catch {
      setGenError("Something went wrong. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const buildQuotePDF = () => {
    if (!quote) return null;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const W = 210;
    const M = 20;
    const CW = W - 2 * M;
    const s = quote.currencySymbol || "";
    let y = 0;

    // Amber header bar
    doc.setFillColor(245, 166, 35);
    doc.rect(0, 0, W, 16, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("QUOTATION", M, 10);
    doc.setFontSize(10);
    doc.text(quote.quoteNumber, W - M, 10, { align: "right" });
    y = 30;

    // From / To
    doc.setFontSize(8);
    doc.setTextColor(138, 138, 154);
    doc.text("FROM", M, y);
    doc.text("TO", W / 2 + 4, y);
    y += 5;
    doc.setFontSize(10);
    doc.setTextColor(26, 26, 26);
    doc.setFont("helvetica", "bold");
    doc.text(quote.fromName, M, y);
    doc.text(quote.clientName, W / 2 + 4, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(80, 80, 80);
    if (quote.fromEmail) doc.text(quote.fromEmail, M, y);
    if (quote.clientEmail) doc.text(quote.clientEmail, W / 2 + 4, y);
    y += 12;

    // Dates
    doc.setFontSize(8.5);
    doc.setTextColor(100, 100, 100);
    doc.text(`Date: ${quote.quoteDate}`, M, y);
    doc.text(`Valid until: ${quote.validUntil}`, W - M, y, { align: "right" });
    y += 12;

    // Line items header
    doc.setFillColor(245, 166, 35);
    doc.rect(M, y - 4, CW, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(0, 0, 0);
    doc.text("Description", M + 2, y);
    doc.text("Qty", M + CW * 0.65, y, { align: "center" });
    doc.text("Unit Price", M + CW * 0.80, y, { align: "right" });
    doc.text("Total", M + CW, y, { align: "right" });
    y += 7;

    // Line items rows
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    quote.lineItems.forEach((item, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(248, 248, 248);
        doc.rect(M, y - 4, CW, 7, "F");
      }
      doc.setTextColor(26, 26, 26);
      const desc = (item.description || "").slice(0, 55);
      doc.text(desc, M + 2, y);
      doc.text(String(item.qty), M + CW * 0.65, y, { align: "center" });
      doc.text(`${s}${(item.unitPrice || 0).toFixed(2)}`, M + CW * 0.80, y, { align: "right" });
      doc.text(`${s}${(item.total || 0).toFixed(2)}`, M + CW, y, { align: "right" });
      y += 7;
    });

    y += 6;

    // Totals block
    const TX = M + CW * 0.58;
    const addRow = (label, value, bold = false) => {
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setFontSize(9);
      doc.setTextColor(bold ? 26 : 80, bold ? 26 : 80, bold ? 26 : 80);
      doc.text(label, TX, y);
      doc.text(value, M + CW, y, { align: "right" });
      y += 6;
    };
    addRow("Subtotal", `${s}${(quote.subtotal || 0).toFixed(2)}`);
    if (quote.tax > 0) addRow("VAT (15%)", `${s}${(quote.tax || 0).toFixed(2)}`);
    y += 3;
    doc.setDrawColor(200, 200, 200);
    doc.line(TX, y, M + CW, y);
    y += 5;
    addRow("Total", `${s}${(quote.total || 0).toFixed(2)}`, true);
    if (quote.depositAmount > 0) {
      addRow(`Deposit (${quote.depositPercent}%)`, `${s}${(quote.depositAmount || 0).toFixed(2)}`);
    }

    y += 4;

    // Notes
    if (quote.notes) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8.5);
      doc.setTextColor(90, 90, 90);
      const lines = doc.splitTextToSize(quote.notes, CW);
      doc.text(lines, M, y);
      y += lines.length * 5 + 4;
    }

    // Terms
    if (quote.termsAndConditions) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(110, 110, 110);
      const tLines = doc.splitTextToSize(quote.termsAndConditions, CW);
      doc.text(tLines, M, y);
      y += tLines.length * 5 + 4;
    }

    // Footer
    doc.setFillColor(19, 19, 26);
    doc.rect(0, 284, W, 13, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(245, 166, 35);
    doc.text("Link-Ap", W / 2 - 8, 291);
    doc.setTextColor(138, 138, 154);
    doc.setFont("helvetica", "normal");
    doc.text(" · link-ap.online", W / 2 - 1, 291);

    return doc;
  };

  const downloadPDF = () => {
    const doc = buildQuotePDF();
    if (!doc) return;
    doc.save(`Quote-${quote.quoteNumber}.pdf`);
  };

  const startOver = () => {
    setView("form");
    setQuote(null);
    setGenError("");
  };

  if (view === "preview" && quote) {
    return (
      <QuotePreview
        quote={quote}
        onStartOver={startOver}
        onDownload={downloadPDF}
        onConvertToInvoice={onConvertToInvoice}
        buildPdf={buildQuotePDF}
        pdfFileName={`Quote-${quote.quoteNumber}.pdf`}
      />
    );
  }

  // ── FORM VIEW ─────────────────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <p style={{ fontSize: 13, color: COLORS.textMuted, margin: 0 }}>
        Fill in the details below and let AI generate a professional quotation in seconds.
      </p>

      {/* Your details */}
      <div style={sectionCardStyle}>
        <div style={sectionLabelStyle}>YOUR DETAILS</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={labelStyle}>Your Name</label>
            <input
              style={inputStyle}
              value={form.fromName}
              onChange={e => upd("fromName", e.target.value)}
              placeholder="e.g. Thapelo Mokoena"
            />
          </div>
          <div>
            <label style={labelStyle}>Your Email</label>
            <input
              style={inputStyle}
              type="email"
              value={form.fromEmail}
              onChange={e => upd("fromEmail", e.target.value)}
              placeholder="e.g. you@example.com"
            />
          </div>
        </div>
      </div>

      {/* Client details */}
      <div style={sectionCardStyle}>
        <div style={sectionLabelStyle}>CLIENT DETAILS</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={labelStyle}>Client Name</label>
            <input
              style={inputStyle}
              value={form.clientName}
              onChange={e => upd("clientName", e.target.value)}
              placeholder="e.g. Acme Corp"
            />
          </div>
          <div>
            <label style={labelStyle}>Client Email</label>
            <input
              style={inputStyle}
              type="email"
              value={form.clientEmail}
              onChange={e => upd("clientEmail", e.target.value)}
              placeholder="e.g. billing@acme.com"
            />
          </div>
        </div>
      </div>

      {/* Currency + Validity + Deposit */}
      <div style={{ display: "flex", gap: 12 }}>
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
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Quote Validity</label>
          <select
            value={form.validityDays}
            onChange={e => upd("validityDays", parseInt(e.target.value, 10))}
            style={{ ...inputStyle, appearance: "none", WebkitAppearance: "none" }}
          >
            {VALIDITY_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Deposit % (optional)</label>
          <input
            style={inputStyle}
            type="number"
            min="0"
            max="100"
            value={form.depositPercent}
            onChange={e => upd("depositPercent", e.target.value)}
            placeholder="e.g. 50"
          />
        </div>
      </div>

      {/* Line items */}
      <div style={sectionCardStyle}>
        <div style={sectionLabelStyle}>LINE ITEMS</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {lineItems.map(item => (
            <div key={item.id} style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
              <div style={{ flex: "1 1 44%" }}>
                {lineItems.indexOf(item) === 0 && (
                  <label style={{ ...labelStyle, marginBottom: 4 }}>Description</label>
                )}
                <input
                  style={{ ...inputStyle, padding: "9px 12px" }}
                  value={item.description}
                  onChange={e => updItem(item.id, "description", e.target.value)}
                  placeholder="e.g. Website design"
                />
              </div>
              <div style={{ flex: "0 0 50px" }}>
                {lineItems.indexOf(item) === 0 && (
                  <label style={{ ...labelStyle, marginBottom: 4 }}>Qty</label>
                )}
                <input
                  style={{ ...inputStyle, padding: "9px 8px", textAlign: "center" }}
                  type="number"
                  min="0.01"
                  step="1"
                  value={item.qty}
                  onChange={e => updItem(item.id, "qty", e.target.value)}
                />
              </div>
              <div style={{ flex: "0 0 88px" }}>
                {lineItems.indexOf(item) === 0 && (
                  <label style={{ ...labelStyle, marginBottom: 4 }}>Unit Price</label>
                )}
                <input
                  style={{ ...inputStyle, padding: "9px 10px" }}
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unitPrice}
                  onChange={e => updItem(item.id, "unitPrice", e.target.value)}
                  placeholder="0.00"
                />
              </div>
              {lineItems.length > 1 && (
                <button
                  onClick={() => setLineItems(items => items.filter(i => i.id !== item.id))}
                  style={{
                    background: "none", border: "none", color: COLORS.textMuted,
                    cursor: "pointer", fontSize: 20, padding: "0 2px",
                    flexShrink: 0, marginBottom: 1,
                  }}
                >×</button>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={() => setLineItems(items => [...items, newLineItem()])}
          style={{
            marginTop: 14, width: "100%", padding: "9px",
            borderRadius: 10, border: `1px dashed ${COLORS.border}`,
            background: "transparent", color: COLORS.textMuted,
            cursor: "pointer", fontSize: 13, fontWeight: 500,
          }}
        >+ Add Line Item</button>

        {/* Running subtotal */}
        {subtotal > 0 && (
          <div style={{
            marginTop: 14, paddingTop: 14, borderTop: `1px solid ${COLORS.border}`,
            display: "flex", justifyContent: "space-between", alignItems: "baseline",
          }}>
            <span style={{ fontSize: 12, color: COLORS.textMuted }}>Subtotal</span>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: COLORS.text }}>
                {sym}{subtotal.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              {form.currency === "ZAR" && (
                <div style={{ fontSize: 11, color: COLORS.textMuted }}>
                  + VAT = {sym}{(subtotal * 1.15).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {genError && <div style={errorBoxStyle}>{genError}</div>}

      <button
        onClick={generate}
        disabled={!canSubmit || generating}
        style={generateBtnStyle(canSubmit && !generating)}
      >
        {generating ? "Generating…" : "Generate Quote"}
      </button>
    </div>
  );
}
