import { useState } from "react";
import { jsPDF } from "jspdf";
import { auth } from "./firebase";
import { COLORS } from "./shared";

const SUBTABS = [
  { id: "founders", label: "Founders Hub" },
  { id: "freelancer", label: "Freelancer Kit" },
  { id: "growth", label: "Growth Lab" },
];

const CURRENCY_OPTIONS = ["ZAR", "USD", "GBP", "EUR"];
const CURRENCY_SYMBOLS = { ZAR: "R", USD: "$", GBP: "£", EUR: "€" };

const PLATFORM_OPTIONS = ["LinkedIn", "Instagram", "X", "Facebook"];
const TONE_OPTIONS = ["Professional", "Casual", "Inspirational", "Educational"];

const newItem = () => ({
  id: `${Date.now()}-${Math.random()}`,
  description: "",
  qty: 1,
  unitPrice: "",
});

// ─── Shared input style ───────────────────────────────────────────────────────

const inputStyle = {
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

const labelStyle = {
  fontSize: 12,
  color: COLORS.textMuted,
  marginBottom: 5,
  display: "block",
};

// ─── Invoice Preview ──────────────────────────────────────────────────────────

function InvoicePreview({ invoice, onStartOver, onDownload }) {
  const sym = invoice.currencySymbol || "";
  const canShare = typeof navigator !== "undefined" && !!navigator.share;

  const handleShare = async () => {
    try {
      await navigator.share({
        title: `Invoice ${invoice.invoiceNumber}`,
        text: `Invoice from ${invoice.fromName} for ${invoice.clientName} — ${sym}${invoice.total.toFixed(2)}`,
      });
    } catch {}
  };

  return (
    <div>
      {/* Action buttons */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <button
          onClick={onStartOver}
          style={{
            flex: 1, padding: "10px 14px", borderRadius: 10,
            border: `1px solid ${COLORS.border}`, background: "transparent",
            color: COLORS.textMuted, cursor: "pointer", fontSize: 13,
          }}
        >Start Over</button>
        {canShare && (
          <button
            onClick={handleShare}
            style={{
              flex: 1, padding: "10px 14px", borderRadius: 10,
              border: `1px solid ${COLORS.border}`, background: "transparent",
              color: COLORS.text, cursor: "pointer", fontSize: 13, fontWeight: 500,
            }}
          >Share</button>
        )}
        <button
          onClick={onDownload}
          style={{
            flex: 2, padding: "10px 18px", borderRadius: 10,
            border: "none", background: COLORS.accent,
            color: "#000", cursor: "pointer", fontSize: 13, fontWeight: 700,
          }}
        >Download PDF</button>
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
          <span style={{ fontSize: 18, fontWeight: 800, color: "#000", letterSpacing: 1 }}>INVOICE</span>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#000" }}>{invoice.invoiceNumber}</div>
            <div style={{ fontSize: 11, color: "#00000099" }}>Issued {invoice.invoiceDate}</div>
          </div>
        </div>

        <div style={{ padding: "20px 20px 24px" }}>
          {/* From / To */}
          <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600, marginBottom: 5 }}>FROM</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.text }}>{invoice.fromName}</div>
              {invoice.fromEmail && (
                <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>{invoice.fromEmail}</div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600, marginBottom: 5 }}>TO</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.text }}>{invoice.clientName}</div>
              {invoice.clientEmail && (
                <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>{invoice.clientEmail}</div>
              )}
            </div>
          </div>

          {/* Due date */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "5px 12px", borderRadius: 20,
            background: `${COLORS.accent}18`, border: `1px solid ${COLORS.accent}44`,
            marginBottom: 20,
          }}>
            <span style={{ fontSize: 11, color: COLORS.textMuted }}>Due</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.accent }}>{invoice.dueDate}</span>
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
            {invoice.lineItems.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 36px 76px 76px",
                  gap: 6,
                  padding: "7px 0",
                  borderBottom: i < invoice.lineItems.length - 1 ? `1px solid ${COLORS.border}22` : "none",
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
                {sym}{(invoice.subtotal || 0).toFixed(2)}
              </span>
            </div>
            {invoice.tax > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", width: 180 }}>
                <span style={{ fontSize: 12, color: COLORS.textMuted }}>VAT (15%)</span>
                <span style={{ fontSize: 13, color: COLORS.text }}>
                  {sym}{(invoice.tax || 0).toFixed(2)}
                </span>
              </div>
            )}
            <div style={{
              display: "flex", justifyContent: "space-between", width: 180,
              paddingTop: 10, marginTop: 2, borderTop: `1px solid ${COLORS.border}`,
            }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>Total</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: COLORS.accent }}>
                {sym}{(invoice.total || 0).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div style={{
              marginTop: 20,
              padding: "12px 16px",
              background: COLORS.bg,
              borderRadius: 10,
              borderLeft: `3px solid ${COLORS.accent}`,
            }}>
              <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600, marginBottom: 4 }}>NOTES</div>
              <p style={{ fontSize: 13, color: COLORS.textMuted, margin: 0, lineHeight: 1.6 }}>{invoice.notes}</p>
            </div>
          )}

          {/* Payment terms */}
          {invoice.paymentTerms && (
            <div style={{ marginTop: 14, fontSize: 12, color: COLORS.textMuted, textAlign: "center" }}>
              {invoice.paymentTerms}
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

// ─── Invoice Form ─────────────────────────────────────────────────────────────

function InvoiceForm({ user }) {
  const [view, setView] = useState("form");
  const [form, setForm] = useState({
    fromName: user?.name || "",
    fromEmail: user?.email || "",
    clientName: "",
    clientEmail: "",
    currency: "ZAR",
    dueDate: "",
  });
  const [lineItems, setLineItems] = useState([newItem()]);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [invoice, setInvoice] = useState(null);

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
      const res = await fetch("/api/tools/invoice-generate", {
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
          dueDate: form.dueDate,
          lineItems: lineItems
            .filter(i => i.description.trim() && parseFloat(i.unitPrice) > 0)
            .map(i => ({
              description: i.description.trim(),
              qty: parseFloat(i.qty) || 1,
              unitPrice: parseFloat(i.unitPrice),
            })),
        }),
      });
      if (res.status === 403) {
        setGenError("Pro feature — upgrade to access AI tools.");
        return;
      }
      if (!res.ok) throw new Error("Generation failed");
      const data = await res.json();
      setInvoice(data);
      setView("preview");
    } catch {
      setGenError("Something went wrong. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const downloadPDF = () => {
    if (!invoice) return;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const W = 210;
    const M = 20;
    const CW = W - 2 * M;
    const s = invoice.currencySymbol || "";
    let y = 0;

    // Amber header bar
    doc.setFillColor(245, 166, 35);
    doc.rect(0, 0, W, 16, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("INVOICE", M, 10);
    doc.setFontSize(10);
    doc.text(invoice.invoiceNumber, W - M, 10, { align: "right" });
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
    doc.text(invoice.fromName, M, y);
    doc.text(invoice.clientName, W / 2 + 4, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(80, 80, 80);
    if (invoice.fromEmail) doc.text(invoice.fromEmail, M, y);
    if (invoice.clientEmail) doc.text(invoice.clientEmail, W / 2 + 4, y);
    y += 12;

    // Dates
    doc.setFontSize(8.5);
    doc.setTextColor(100, 100, 100);
    doc.text(`Date: ${invoice.invoiceDate}`, M, y);
    doc.text(`Due: ${invoice.dueDate}`, W - M, y, { align: "right" });
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
    invoice.lineItems.forEach((item, idx) => {
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
    addRow("Subtotal", `${s}${(invoice.subtotal || 0).toFixed(2)}`);
    if (invoice.tax > 0) addRow("VAT (15%)", `${s}${(invoice.tax || 0).toFixed(2)}`);
    doc.setDrawColor(200, 200, 200);
    doc.line(TX, y - 2, M + CW, y - 2);
    addRow("Total", `${s}${(invoice.total || 0).toFixed(2)}`, true);

    y += 4;

    // Notes
    if (invoice.notes) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8.5);
      doc.setTextColor(90, 90, 90);
      const lines = doc.splitTextToSize(invoice.notes, CW);
      doc.text(lines, M, y);
      y += lines.length * 5 + 4;
    }

    // Payment terms
    if (invoice.paymentTerms) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(110, 110, 110);
      doc.text(invoice.paymentTerms, M, y);
      y += 8;
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

    doc.save(`Invoice-${invoice.invoiceNumber}.pdf`);
  };

  const startOver = () => {
    setView("form");
    setInvoice(null);
    setGenError("");
  };

  if (view === "preview" && invoice) {
    return (
      <InvoicePreview
        invoice={invoice}
        onStartOver={startOver}
        onDownload={downloadPDF}
      />
    );
  }

  // ── FORM VIEW ─────────────────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <p style={{ fontSize: 13, color: COLORS.textMuted, margin: 0 }}>
        Fill in the details below and let AI generate a professional invoice in seconds.
      </p>

      {/* Your details */}
      <div style={{
        background: COLORS.card, border: `1px solid ${COLORS.border}`,
        borderRadius: 14, padding: 18,
      }}>
        <div style={{ fontSize: 11, color: COLORS.accent, fontWeight: 600, marginBottom: 14 }}>
          YOUR DETAILS
        </div>
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
      <div style={{
        background: COLORS.card, border: `1px solid ${COLORS.border}`,
        borderRadius: 14, padding: 18,
      }}>
        <div style={{ fontSize: 11, color: COLORS.accent, fontWeight: 600, marginBottom: 14 }}>
          CLIENT DETAILS
        </div>
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

      {/* Currency + Due Date */}
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
          <label style={labelStyle}>Due Date</label>
          <input
            style={{ ...inputStyle, colorScheme: "dark" }}
            type="date"
            value={form.dueDate}
            onChange={e => upd("dueDate", e.target.value)}
          />
        </div>
      </div>

      {/* Line items */}
      <div style={{
        background: COLORS.card, border: `1px solid ${COLORS.border}`,
        borderRadius: 14, padding: 18,
      }}>
        <div style={{ fontSize: 11, color: COLORS.accent, fontWeight: 600, marginBottom: 14 }}>
          LINE ITEMS
        </div>

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
          onClick={() => setLineItems(items => [...items, newItem()])}
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

      {genError && (
        <div style={{
          padding: "10px 14px", borderRadius: 10,
          background: `${COLORS.red}18`, color: COLORS.red, fontSize: 13,
        }}>
          {genError}
        </div>
      )}

      <button
        onClick={generate}
        disabled={!canSubmit || generating}
        style={{
          padding: "14px", borderRadius: 12, border: "none",
          background: canSubmit && !generating ? COLORS.accent : COLORS.border,
          color: canSubmit && !generating ? "#000" : COLORS.textMuted,
          cursor: canSubmit && !generating ? "pointer" : "not-allowed",
          fontSize: 15, fontWeight: 700,
        }}
      >
        {generating ? "Generating…" : "✦ Generate Invoice"}
      </button>
    </div>
  );
}

// ─── Proposal Preview ─────────────────────────────────────────────────────────

function ProposalPreview({ proposal, onStartOver, onDownload }) {
  const canShare = typeof navigator !== "undefined" && !!navigator.share;
  const secs = proposal.sections || {};

  const handleShare = async () => {
    try {
      await navigator.share({
        title: `Proposal ${proposal.proposalNumber}`,
        text: `Proposal from ${proposal.fromName} for ${proposal.clientName}`,
      });
    } catch {}
  };

  return (
    <div>
      {/* Action buttons */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <button
          onClick={onStartOver}
          style={{
            flex: 1, padding: "10px 14px", borderRadius: 10,
            border: `1px solid ${COLORS.border}`, background: "transparent",
            color: COLORS.textMuted, cursor: "pointer", fontSize: 13,
          }}
        >Start Over</button>
        {canShare && (
          <button
            onClick={handleShare}
            style={{
              flex: 1, padding: "10px 14px", borderRadius: 10,
              border: `1px solid ${COLORS.border}`, background: "transparent",
              color: COLORS.text, cursor: "pointer", fontSize: 13, fontWeight: 500,
            }}
          >Share</button>
        )}
        <button
          onClick={onDownload}
          style={{
            flex: 2, padding: "10px 18px", borderRadius: 10,
            border: "none", background: COLORS.accent,
            color: "#000", cursor: "pointer", fontSize: 13, fontWeight: 700,
          }}
        >Download PDF</button>
      </div>

      {/* Preview card */}
      <div style={{
        background: COLORS.card, border: `1px solid ${COLORS.border}`,
        borderRadius: 16, overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          background: COLORS.accent, padding: "16px 20px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#00000088", letterSpacing: 1 }}>PROPOSAL</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#000" }}>
              Link<span style={{ color: "#00000066" }}>-Ap</span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#000" }}>{proposal.proposalNumber}</div>
            <div style={{ fontSize: 11, color: "#00000099" }}>Valid until {proposal.validUntil}</div>
          </div>
        </div>

        <div style={{ padding: "20px 20px 24px" }}>
          {/* From / To */}
          <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600, marginBottom: 5 }}>FROM</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.text }}>{proposal.fromName}</div>
              {proposal.fromEmail && (
                <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>{proposal.fromEmail}</div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600, marginBottom: 5 }}>TO</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.text }}>{proposal.clientName}</div>
              {proposal.clientEmail && (
                <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>{proposal.clientEmail}</div>
              )}
            </div>
          </div>

          {/* Project type badge */}
          <div style={{
            display: "inline-flex", alignItems: "center",
            padding: "5px 12px", borderRadius: 20,
            background: `${COLORS.accent}18`, border: `1px solid ${COLORS.accent}44`,
            marginBottom: 20,
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.accent }}>{proposal.projectType}</span>
          </div>

          {/* Sections */}
          {[
            { key: "introduction", label: "Introduction" },
            { key: "scopeOfWork", label: "Scope of Work" },
            { key: "deliverables", label: "Deliverables" },
            { key: "timeline", label: "Timeline" },
            { key: "investment", label: "Investment" },
            { key: "terms", label: "Terms & Conditions" },
            { key: "closing", label: "Closing" },
          ].map(({ key, label }) => (
            <div key={key} style={{ marginBottom: 18, paddingBottom: 18, borderBottom: `1px solid ${COLORS.border}` }}>
              <div style={{ fontSize: 10, color: COLORS.accent, fontWeight: 700, marginBottom: 6, letterSpacing: 0.5 }}>
                {label.toUpperCase()}
              </div>
              {key === "deliverables" && Array.isArray(secs.deliverables) ? (
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {secs.deliverables.map((d, i) => (
                    <li key={i} style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.7 }}>{d}</li>
                  ))}
                </ul>
              ) : (
                <p style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.7, margin: 0 }}>
                  {secs[key] || ""}
                </p>
              )}
            </div>
          ))}

          {/* Budget + Timeline summary */}
          {(proposal.budget || proposal.timeline) && (
            <div style={{ display: "flex", gap: 12 }}>
              {proposal.budget && (
                <div style={{
                  flex: 1, padding: "10px 14px", borderRadius: 10,
                  background: COLORS.bg, border: `1px solid ${COLORS.border}`,
                }}>
                  <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600, marginBottom: 3 }}>BUDGET</div>
                  <div style={{ fontSize: 13, color: COLORS.text, fontWeight: 600 }}>{proposal.budget}</div>
                </div>
              )}
              {proposal.timeline && (
                <div style={{
                  flex: 1, padding: "10px 14px", borderRadius: 10,
                  background: COLORS.bg, border: `1px solid ${COLORS.border}`,
                }}>
                  <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600, marginBottom: 3 }}>TIMELINE</div>
                  <div style={{ fontSize: 13, color: COLORS.text, fontWeight: 600 }}>{proposal.timeline}</div>
                </div>
              )}
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

// ─── Proposal Form ────────────────────────────────────────────────────────────

function ProposalForm({ user }) {
  const [view, setView] = useState("form");
  const [form, setForm] = useState({
    fromName: user?.name || "",
    fromEmail: user?.email || "",
    clientName: "",
    clientEmail: "",
    projectType: "",
    scopeSummary: "",
    budget: "",
    currency: "ZAR",
    timeline: "",
    startDate: "",
  });
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [proposal, setProposal] = useState(null);

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const canSubmit =
    form.fromName.trim() &&
    form.clientName.trim() &&
    form.projectType.trim() &&
    form.scopeSummary.trim();

  const generate = async () => {
    if (!canSubmit || generating) return;
    setGenerating(true);
    setGenError("");
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch("/api/tools/proposal-generate", {
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
          projectType: form.projectType.trim(),
          scopeSummary: form.scopeSummary.trim(),
          budget: form.budget.trim(),
          currency: form.currency,
          timeline: form.timeline.trim(),
          startDate: form.startDate,
        }),
      });
      if (res.status === 403) {
        setGenError("Pro feature — upgrade to access AI tools.");
        return;
      }
      if (!res.ok) throw new Error("Generation failed");
      const data = await res.json();
      setProposal(data);
      setView("preview");
    } catch {
      setGenError("Something went wrong. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const downloadPDF = () => {
    if (!proposal) return;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const W = 210;
    const M = 20;
    const CW = W - 2 * M;
    let y = 0;

    const checkPage = (needed = 10) => {
      if (y + needed > 272) { doc.addPage(); y = 20; }
    };

    // Amber header bar
    doc.setFillColor(245, 166, 35);
    doc.rect(0, 0, W, 20, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text("PROPOSAL", M, 8);
    doc.setFontSize(13);
    doc.text("Link-Ap", M, 15);
    doc.setFontSize(9);
    doc.text(proposal.proposalNumber, W - M, 8, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Valid until ${proposal.validUntil}`, W - M, 15, { align: "right" });
    y = 32;

    // From / To
    doc.setFontSize(8);
    doc.setTextColor(138, 138, 154);
    doc.text("FROM", M, y);
    doc.text("TO", W / 2 + 4, y);
    y += 5;
    doc.setFontSize(10);
    doc.setTextColor(26, 26, 26);
    doc.setFont("helvetica", "bold");
    doc.text(proposal.fromName, M, y);
    doc.text(proposal.clientName, W / 2 + 4, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(80, 80, 80);
    if (proposal.fromEmail) doc.text(proposal.fromEmail, M, y);
    if (proposal.clientEmail) doc.text(proposal.clientEmail, W / 2 + 4, y);
    y += 10;

    // Project type + date
    doc.setFontSize(8.5);
    doc.setTextColor(100, 100, 100);
    doc.text(`Project: ${proposal.projectType}`, M, y);
    doc.text(`Date: ${proposal.proposalDate}`, W - M, y, { align: "right" });
    y += 14;

    const secs = proposal.sections || {};
    const SECTION_LABELS = [
      { key: "introduction", label: "Introduction" },
      { key: "scopeOfWork", label: "Scope of Work" },
      { key: "deliverables", label: "Deliverables" },
      { key: "timeline", label: "Timeline" },
      { key: "investment", label: "Investment" },
      { key: "terms", label: "Terms & Conditions" },
      { key: "closing", label: "Closing" },
    ];

    for (const { key, label } of SECTION_LABELS) {
      checkPage(18);
      doc.setFillColor(245, 166, 35);
      doc.rect(M, y - 4, CW, 7, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(0, 0, 0);
      doc.text(label.toUpperCase(), M + 2, y);
      y += 8;

      if (key === "deliverables" && Array.isArray(secs.deliverables)) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(40, 40, 40);
        for (const item of secs.deliverables) {
          const lines = doc.splitTextToSize(`• ${item}`, CW - 4);
          checkPage(lines.length * 5 + 3);
          doc.text(lines, M + 2, y);
          y += lines.length * 5 + 2;
        }
      } else {
        const content = secs[key] || "";
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(40, 40, 40);
        const lines = doc.splitTextToSize(content, CW);
        for (const line of lines) {
          checkPage(6);
          doc.text(line, M, y);
          y += 5;
        }
      }
      y += 6;
    }

    // Budget + Timeline summary
    if (proposal.budget || proposal.timeline) {
      checkPage(16);
      doc.setDrawColor(200, 200, 200);
      doc.line(M, y, M + CW, y);
      y += 8;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(26, 26, 26);
      if (proposal.budget) {
        doc.text("Budget:", M, y);
        doc.setFont("helvetica", "normal");
        doc.text(proposal.budget, M + 20, y);
      }
      if (proposal.timeline) {
        doc.setFont("helvetica", "bold");
        doc.text("Timeline:", W / 2 + 4, y);
        doc.setFont("helvetica", "normal");
        doc.text(proposal.timeline, W / 2 + 26, y);
      }
      y += 8;
    }

    // Footer on last page
    doc.setFillColor(19, 19, 26);
    doc.rect(0, 284, W, 13, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(245, 166, 35);
    doc.text("Link-Ap", W / 2 - 8, 291);
    doc.setTextColor(138, 138, 154);
    doc.setFont("helvetica", "normal");
    doc.text(" · link-ap.online", W / 2 - 1, 291);

    doc.save(`Proposal-${proposal.proposalNumber}.pdf`);
  };

  const startOver = () => {
    setView("form");
    setProposal(null);
    setGenError("");
  };

  if (view === "preview" && proposal) {
    return (
      <ProposalPreview
        proposal={proposal}
        onStartOver={startOver}
        onDownload={downloadPDF}
      />
    );
  }

  // ── FORM VIEW ─────────────────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <p style={{ fontSize: 13, color: COLORS.textMuted, margin: 0 }}>
        Fill in the details below and let AI write a professional proposal for your client.
      </p>

      {/* Your details */}
      <div style={{
        background: COLORS.card, border: `1px solid ${COLORS.border}`,
        borderRadius: 14, padding: 18,
      }}>
        <div style={{ fontSize: 11, color: COLORS.accent, fontWeight: 600, marginBottom: 14 }}>
          YOUR DETAILS
        </div>
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
      <div style={{
        background: COLORS.card, border: `1px solid ${COLORS.border}`,
        borderRadius: 14, padding: 18,
      }}>
        <div style={{ fontSize: 11, color: COLORS.accent, fontWeight: 600, marginBottom: 14 }}>
          CLIENT DETAILS
        </div>
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
              placeholder="e.g. hello@acme.com"
            />
          </div>
        </div>
      </div>

      {/* Project details */}
      <div style={{
        background: COLORS.card, border: `1px solid ${COLORS.border}`,
        borderRadius: 14, padding: 18,
      }}>
        <div style={{ fontSize: 11, color: COLORS.accent, fontWeight: 600, marginBottom: 14 }}>
          PROJECT DETAILS
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={labelStyle}>Project Type</label>
            <input
              style={inputStyle}
              value={form.projectType}
              onChange={e => upd("projectType", e.target.value)}
              placeholder="e.g. Website redesign, Brand identity, Marketing campaign"
            />
          </div>
          <div>
            <label style={labelStyle}>Scope Summary</label>
            <textarea
              style={{ ...inputStyle, resize: "none", lineHeight: 1.5 }}
              rows={4}
              value={form.scopeSummary}
              onChange={e => upd("scopeSummary", e.target.value)}
              placeholder="Describe what the project involves, goals, and any key requirements"
            />
          </div>
        </div>
      </div>

      {/* Budget + Timeline */}
      <div style={{
        background: COLORS.card, border: `1px solid ${COLORS.border}`,
        borderRadius: 14, padding: 18,
      }}>
        <div style={{ fontSize: 11, color: COLORS.accent, fontWeight: 600, marginBottom: 14 }}>
          BUDGET & TIMELINE
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 2 }}>
              <label style={labelStyle}>Budget Range</label>
              <input
                style={inputStyle}
                value={form.budget}
                onChange={e => upd("budget", e.target.value)}
                placeholder="e.g. R15,000 - R25,000"
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
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Timeline</label>
              <input
                style={inputStyle}
                value={form.timeline}
                onChange={e => upd("timeline", e.target.value)}
                placeholder="e.g. 6 weeks"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Start Date</label>
              <input
                style={{ ...inputStyle, colorScheme: "dark" }}
                type="date"
                value={form.startDate}
                onChange={e => upd("startDate", e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {genError && (
        <div style={{
          padding: "10px 14px", borderRadius: 10,
          background: `${COLORS.red}18`, color: COLORS.red, fontSize: 13,
        }}>
          {genError}
        </div>
      )}

      <button
        onClick={generate}
        disabled={!canSubmit || generating}
        style={{
          padding: "14px", borderRadius: 12, border: "none",
          background: canSubmit && !generating ? COLORS.accent : COLORS.border,
          color: canSubmit && !generating ? "#000" : COLORS.textMuted,
          cursor: canSubmit && !generating ? "pointer" : "not-allowed",
          fontSize: 15, fontWeight: 700,
        }}
      >
        {generating ? "Generating…" : "✦ Generate Proposal"}
      </button>
    </div>
  );
}

// ─── Content Calendar Preview ────────────────────────────────────────────────

function ContentCalendarPreview({ calendar, onStartOver, onDownload }) {
  const canShare = typeof navigator !== "undefined" && !!navigator.share;

  const handleShare = async () => {
    try {
      await navigator.share({
        title: calendar.calendarTitle,
        text: `Content calendar for ${calendar.brandName} generated on Link-Ap`,
      });
    } catch {}
  };

  return (
    <div>
      {/* Action buttons */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <button
          onClick={onStartOver}
          style={{
            flex: 1, padding: "10px 14px", borderRadius: 10,
            border: `1px solid ${COLORS.border}`, background: "transparent",
            color: COLORS.textMuted, cursor: "pointer", fontSize: 13,
          }}
        >Start Over</button>
        {canShare && (
          <button
            onClick={handleShare}
            style={{
              flex: 1, padding: "10px 14px", borderRadius: 10,
              border: `1px solid ${COLORS.border}`, background: "transparent",
              color: COLORS.text, cursor: "pointer", fontSize: 13, fontWeight: 500,
            }}
          >Share</button>
        )}
        <button
          onClick={onDownload}
          style={{
            flex: 2, padding: "10px 18px", borderRadius: 10,
            border: "none", background: COLORS.accent,
            color: "#000", cursor: "pointer", fontSize: 13, fontWeight: 700,
          }}
        >Download PDF</button>
      </div>

      {/* Preview card */}
      <div style={{
        background: COLORS.card, border: `1px solid ${COLORS.border}`,
        borderRadius: 16, overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          background: COLORS.accent, padding: "16px 20px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#00000088", letterSpacing: 1 }}>
              CONTENT CALENDAR
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#000" }}>
              Link<span style={{ color: "#00000066" }}>-Ap</span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#000" }}>{calendar.brandName}</div>
            <div style={{ fontSize: 11, color: "#00000099" }}>{calendar.generatedDate}</div>
          </div>
        </div>

        <div style={{ padding: "20px 20px 24px" }}>
          {/* Title */}
          <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.text, marginBottom: 10 }}>
            {calendar.calendarTitle}
          </div>

          {/* Platform + tone pills */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
            {(calendar.platforms || []).map(p => (
              <span key={p} style={{
                fontSize: 11, padding: "3px 10px", borderRadius: 20,
                background: `${COLORS.accent}18`, border: `1px solid ${COLORS.accent}44`,
                color: COLORS.accent, fontWeight: 600,
              }}>{p}</span>
            ))}
            <span style={{
              fontSize: 11, padding: "3px 10px", borderRadius: 20,
              background: COLORS.border, color: COLORS.textMuted,
            }}>{calendar.tone}</span>
          </div>

          {/* Weeks */}
          {(calendar.weeks || []).map(week => (
            <div key={week.weekNumber} style={{ marginBottom: 24 }}>
              {/* Week header */}
              <div style={{
                display: "flex", alignItems: "center", gap: 10, marginBottom: 10,
                padding: "8px 12px", borderRadius: 10,
                background: COLORS.bg, border: `1px solid ${COLORS.border}`,
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: COLORS.accent, display: "flex",
                  alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 800, color: "#000", flexShrink: 0,
                }}>
                  {week.weekNumber}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>
                    Week {week.weekNumber}
                  </div>
                  <div style={{ fontSize: 11, color: COLORS.accent, fontWeight: 600 }}>
                    {week.theme}
                  </div>
                </div>
              </div>

              {/* Posts */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {(week.posts || []).map((post, i) => (
                  <div key={i} style={{
                    padding: "12px 14px", borderRadius: 12,
                    background: COLORS.bg, border: `1px solid ${COLORS.border}`,
                  }}>
                    {/* Meta row */}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8, alignItems: "center" }}>
                      {[post.day, post.platform, post.postType].map((tag, ti) => (
                        <span key={ti} style={{
                          fontSize: 10, padding: "2px 8px", borderRadius: 20,
                          background: COLORS.card, border: `1px solid ${COLORS.border}`,
                          color: COLORS.textMuted, fontWeight: 500,
                        }}>{tag}</span>
                      ))}
                      <span style={{
                        fontSize: 10, padding: "2px 8px", borderRadius: 20,
                        background: `${COLORS.accent}18`, color: COLORS.accent,
                        fontWeight: 600, marginLeft: "auto",
                      }}>⏰ {post.bestTimeToPost}</span>
                    </div>
                    {/* Topic */}
                    <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, marginBottom: 6 }}>
                      {post.topic}
                    </div>
                    {/* Caption */}
                    <div style={{ fontSize: 12, color: COLORS.textMuted, lineHeight: 1.6 }}>
                      {post.caption}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* General Tips */}
          {(calendar.generalTips || []).length > 0 && (
            <div style={{
              padding: "14px 16px", borderRadius: 12,
              background: COLORS.bg, border: `1px solid ${COLORS.border}`,
            }}>
              <div style={{
                fontSize: 11, color: COLORS.accent, fontWeight: 700,
                marginBottom: 10, letterSpacing: 0.5,
              }}>
                GENERAL TIPS
              </div>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {calendar.generalTips.map((tip, i) => (
                  <li key={i} style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.7 }}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Footer */}
          <div style={{
            marginTop: 20, paddingTop: 14,
            borderTop: `1px solid ${COLORS.border}`, textAlign: "center",
          }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: COLORS.accent }}>Link</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: COLORS.textMuted }}>-Ap</span>
            <span style={{ fontSize: 11, color: COLORS.textMuted }}> · link-ap.online</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Content Calendar Form ────────────────────────────────────────────────────

function ContentCalendarForm({ user }) {
  const [view, setView] = useState("form");
  const [form, setForm] = useState({
    brandName: user?.name || "",
    niche: "",
    targetAudience: "",
    platforms: ["LinkedIn"],
    tone: "Professional",
    goals: "",
    weekCount: 4,
  });
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [calendar, setCalendar] = useState(null);

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const togglePlatform = (p) => {
    setForm(f => ({
      ...f,
      platforms: f.platforms.includes(p)
        ? f.platforms.filter(x => x !== p)
        : [...f.platforms, p],
    }));
  };

  const canSubmit =
    form.brandName.trim() &&
    form.niche.trim() &&
    form.targetAudience.trim() &&
    form.platforms.length > 0;

  const generate = async () => {
    if (!canSubmit || generating) return;
    setGenerating(true);
    setGenError("");
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch("/api/tools/content-calendar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          brandName: form.brandName.trim(),
          niche: form.niche.trim(),
          targetAudience: form.targetAudience.trim(),
          platforms: form.platforms,
          tone: form.tone,
          goals: form.goals.trim(),
          weekCount: form.weekCount,
        }),
      });
      if (res.status === 403) {
        setGenError("Pro feature — upgrade to access AI tools.");
        return;
      }
      if (!res.ok) throw new Error("Generation failed");
      const data = await res.json();
      setCalendar(data);
      setView("preview");
    } catch {
      setGenError("Something went wrong. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const downloadPDF = () => {
    if (!calendar) return;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const W = 210;
    const M = 20;
    const CW = W - 2 * M;
    let y = 0;

    const checkPage = (needed = 10) => {
      if (y + needed > 272) { doc.addPage(); y = 20; }
    };

    // Amber header
    doc.setFillColor(245, 166, 35);
    doc.rect(0, 0, W, 20, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text("CONTENT CALENDAR", M, 8);
    doc.setFontSize(13);
    doc.text("Link-Ap", M, 15);
    doc.setFontSize(9);
    doc.text(calendar.brandName, W - M, 8, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(calendar.generatedDate, W - M, 15, { align: "right" });
    y = 30;

    // Platform + tone
    doc.setFontSize(8.5);
    doc.setTextColor(100, 100, 100);
    doc.text(`Platforms: ${(calendar.platforms || []).join(", ")}`, M, y);
    doc.text(`Tone: ${calendar.tone}`, W - M, y, { align: "right" });
    y += 14;

    // Weeks
    for (const week of (calendar.weeks || [])) {
      checkPage(20);

      // Week section header
      doc.setFillColor(245, 166, 35);
      doc.rect(M, y - 4, CW, 9, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text(`WEEK ${week.weekNumber} — ${(week.theme || "").toUpperCase()}`, M + 2, y);
      y += 10;

      for (const post of (week.posts || [])) {
        checkPage(32);

        // Post meta bar
        doc.setFillColor(248, 248, 248);
        doc.rect(M, y - 3, CW, 7, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(40, 40, 40);
        const metaLine = `${post.day}  ·  ${post.platform}  ·  ${post.postType}  ·  ${post.bestTimeToPost}`;
        doc.text(metaLine, M + 2, y);
        y += 8;

        // Topic
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(26, 26, 26);
        const topicLines = doc.splitTextToSize(post.topic || "", CW - 4);
        for (const line of topicLines) {
          checkPage(6);
          doc.text(line, M + 2, y);
          y += 5;
        }

        // Caption
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(90, 90, 90);
        const captionLines = doc.splitTextToSize(post.caption || "", CW - 4);
        for (const line of captionLines) {
          checkPage(5);
          doc.text(line, M + 2, y);
          y += 5;
        }
        y += 5;
      }
      y += 4;
    }

    // General Tips
    if ((calendar.generalTips || []).length > 0) {
      checkPage(14);
      doc.setFillColor(245, 166, 35);
      doc.rect(M, y - 4, CW, 7, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(0, 0, 0);
      doc.text("GENERAL TIPS", M + 2, y);
      y += 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(40, 40, 40);
      for (const tip of calendar.generalTips) {
        const lines = doc.splitTextToSize(`• ${tip}`, CW - 4);
        checkPage(lines.length * 5 + 3);
        doc.text(lines, M + 2, y);
        y += lines.length * 5 + 2;
      }
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

    doc.save(`ContentCalendar-${(calendar.brandName || "Brand").replace(/\s+/g, "-")}.pdf`);
  };

  const startOver = () => {
    setView("form");
    setCalendar(null);
    setGenError("");
  };

  if (view === "preview" && calendar) {
    return (
      <ContentCalendarPreview
        calendar={calendar}
        onStartOver={startOver}
        onDownload={downloadPDF}
      />
    );
  }

  // ── FORM VIEW ─────────────────────────────────────────────────────────────

  const pillStyle = (active) => ({
    padding: "7px 14px", borderRadius: 20, cursor: "pointer",
    fontSize: 13, fontWeight: 500,
    background: active ? COLORS.accent : COLORS.card,
    color: active ? "#000" : COLORS.textMuted,
    border: `1px solid ${active ? COLORS.accent : COLORS.border}`,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <p style={{ fontSize: 13, color: COLORS.textMuted, margin: 0 }}>
        Fill in the details below and let AI build a ready-to-use content calendar for your brand.
      </p>

      {/* Brand details */}
      <div style={{
        background: COLORS.card, border: `1px solid ${COLORS.border}`,
        borderRadius: 14, padding: 18,
      }}>
        <div style={{ fontSize: 11, color: COLORS.accent, fontWeight: 600, marginBottom: 14 }}>
          BRAND DETAILS
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={labelStyle}>Brand / Business Name</label>
            <input
              style={inputStyle}
              value={form.brandName}
              onChange={e => upd("brandName", e.target.value)}
              placeholder="e.g. Thapelo Designs"
            />
          </div>
          <div>
            <label style={labelStyle}>Your Niche</label>
            <input
              style={inputStyle}
              value={form.niche}
              onChange={e => upd("niche", e.target.value)}
              placeholder="e.g. Freelance design, B2B SaaS, Food & beverage"
            />
          </div>
          <div>
            <label style={labelStyle}>Target Audience</label>
            <input
              style={inputStyle}
              value={form.targetAudience}
              onChange={e => upd("targetAudience", e.target.value)}
              placeholder="e.g. Small business owners in South Africa"
            />
          </div>
        </div>
      </div>

      {/* Platforms */}
      <div style={{
        background: COLORS.card, border: `1px solid ${COLORS.border}`,
        borderRadius: 14, padding: 18,
      }}>
        <div style={{ fontSize: 11, color: COLORS.accent, fontWeight: 600, marginBottom: 14 }}>
          PLATFORMS
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {PLATFORM_OPTIONS.map(p => (
            <button
              key={p}
              onClick={() => togglePlatform(p)}
              style={pillStyle(form.platforms.includes(p))}
            >{p}</button>
          ))}
        </div>
        {form.platforms.length === 0 && (
          <div style={{ fontSize: 12, color: COLORS.red, marginTop: 8 }}>
            Select at least one platform
          </div>
        )}
      </div>

      {/* Tone */}
      <div style={{
        background: COLORS.card, border: `1px solid ${COLORS.border}`,
        borderRadius: 14, padding: 18,
      }}>
        <div style={{ fontSize: 11, color: COLORS.accent, fontWeight: 600, marginBottom: 14 }}>
          TONE
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {TONE_OPTIONS.map(t => (
            <button
              key={t}
              onClick={() => upd("tone", t)}
              style={pillStyle(form.tone === t)}
            >{t}</button>
          ))}
        </div>
      </div>

      {/* Goals */}
      <div>
        <label style={labelStyle}>Goals</label>
        <textarea
          style={{ ...inputStyle, resize: "none", lineHeight: 1.5 }}
          rows={3}
          value={form.goals}
          onChange={e => upd("goals", e.target.value)}
          placeholder="e.g. Build brand awareness, generate leads, grow following"
        />
      </div>

      {/* Calendar length */}
      <div style={{
        background: COLORS.card, border: `1px solid ${COLORS.border}`,
        borderRadius: 14, padding: 18,
      }}>
        <div style={{ fontSize: 11, color: COLORS.accent, fontWeight: 600, marginBottom: 14 }}>
          CALENDAR LENGTH
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[{ label: "2 Weeks", value: 2 }, { label: "4 Weeks", value: 4 }].map(opt => (
            <button
              key={opt.value}
              onClick={() => upd("weekCount", opt.value)}
              style={pillStyle(form.weekCount === opt.value)}
            >{opt.label}</button>
          ))}
        </div>
      </div>

      {genError && (
        <div style={{
          padding: "10px 14px", borderRadius: 10,
          background: `${COLORS.red}18`, color: COLORS.red, fontSize: 13,
        }}>
          {genError}
        </div>
      )}

      <button
        onClick={generate}
        disabled={!canSubmit || generating}
        style={{
          padding: "14px", borderRadius: 12, border: "none",
          background: canSubmit && !generating ? COLORS.accent : COLORS.border,
          color: canSubmit && !generating ? "#000" : COLORS.textMuted,
          cursor: canSubmit && !generating ? "pointer" : "not-allowed",
          fontSize: 15, fontWeight: 700,
        }}
      >
        {generating ? "Generating…" : "✦ Generate Calendar"}
      </button>
    </div>
  );
}

// ─── Tools (main export) ──────────────────────────────────────────────────────

export default function Tools({ user }) {
  const [subtab, setSubtab] = useState("founders");

  return (
    <div style={{ padding: "16px 20px", paddingBottom: 40 }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: COLORS.text }}>Tools</h2>
        <p style={{ color: COLORS.textMuted, fontSize: 13 }}>Resources for builders</p>
      </div>

      {/* Subtab pills */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {SUBTABS.map(s => (
          <button
            key={s.id}
            onClick={() => setSubtab(s.id)}
            style={{
              padding: "7px 16px", borderRadius: 20, cursor: "pointer",
              fontSize: 13, fontWeight: 500,
              background: subtab === s.id ? COLORS.accent : COLORS.card,
              color: subtab === s.id ? "#000" : COLORS.textMuted,
              border: `1px solid ${subtab === s.id ? COLORS.accent : COLORS.border}`,
            }}
          >{s.label}</button>
        ))}
      </div>

      {subtab === "founders" && <InvoiceForm user={user} />}
      {subtab === "freelancer" && <ProposalForm user={user} />}

      {subtab === "growth" && <ContentCalendarForm user={user} />}
    </div>
  );
}
