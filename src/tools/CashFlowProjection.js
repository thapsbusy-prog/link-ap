import { useState } from "react";
import { jsPDF } from "jspdf";
import { COLORS } from "../shared";
import {
  CURRENCY_OPTIONS, CURRENCY_SYMBOLS, inputStyle, labelStyle,
  sectionCardStyle, sectionLabelStyle, startOverBtnStyle, shareBtnStyle,
  primaryBtnStyle, generateBtnStyle, sharePdf,
} from "./toolsShared";

const MONTHS_COUNT = 12;
const LABEL_COL_WIDTH = 150;
const MONTH_COL_WIDTH = 84;

function defaultStartMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabelAt(startMonth, offset) {
  const [y, m] = (startMonth || defaultStartMonth()).split("-").map(Number);
  const d = new Date(y, (m - 1) + offset, 1);
  return d.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
}

function newLineItem() {
  return {
    id: `${Date.now()}-${Math.random()}`,
    description: "",
    amounts: Array.from({ length: MONTHS_COUNT }, () => ""),
  };
}

function fmtMoney(n, sym) {
  return `${n < 0 ? "-" : ""}${sym}${Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function computeTotals(statement, startingCash) {
  const totalRevenue = Array(MONTHS_COUNT).fill(0);
  const totalExpenses = Array(MONTHS_COUNT).fill(0);
  statement.revenueItems.forEach(item => {
    item.amounts.forEach((v, i) => { totalRevenue[i] += parseFloat(v) || 0; });
  });
  statement.expenseItems.forEach(item => {
    item.amounts.forEach((v, i) => { totalExpenses[i] += parseFloat(v) || 0; });
  });
  const net = totalRevenue.map((r, i) => r - totalExpenses[i]);
  const opening = Array(MONTHS_COUNT).fill(0);
  const closing = Array(MONTHS_COUNT).fill(0);
  let bal = startingCash;
  for (let i = 0; i < MONTHS_COUNT; i++) {
    opening[i] = bal;
    bal += net[i];
    closing[i] = bal;
  }
  return { totalRevenue, totalExpenses, net, opening, closing };
}

function buildExplanation(totals, lowestMonth, sym) {
  const endingBalance = totals.closing[totals.closing.length - 1];
  const lowestBalance = Math.min(...totals.closing);
  if (lowestBalance >= 0) {
    return `Your projected cash balance stays positive throughout the 12 months, ending at ${fmtMoney(endingBalance, sym)}. Lowest point is ${fmtMoney(lowestBalance, sym)} in ${lowestMonth}.`;
  }
  return `Your cash balance is projected to go negative — the lowest point is ${fmtMoney(lowestBalance, sym)} in ${lowestMonth}. Plan to have financing, a credit line, or extra sales lined up before then. The 12-month balance ends at ${fmtMoney(endingBalance, sym)}.`;
}

// ─── PDF builder ────────────────────────────────────────────────────────────────

function buildStatementPDF({ businessName, startingCash, months, statement, totals, sym }) {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  const W = 297;
  const H = 210;
  const M = 12;
  const labelW = 42;
  const monthW = (W - 2 * M - labelW) / MONTHS_COUNT;
  const colX = i => M + labelW + i * monthW;
  let y = 0;

  doc.setFillColor(245, 166, 35);
  doc.rect(0, 0, W, 14, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text("12-MONTH CASH FLOW STATEMENT", M, 9);
  y = 22;

  doc.setFontSize(11);
  doc.setTextColor(26, 26, 26);
  doc.text(businessName || "Untitled Business", M, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(138, 138, 154);
  doc.text(`Starting cash: ${fmtMoney(startingCash, sym)}`, W - M, y, { align: "right" });
  y += 8;

  const drawHeaderRow = () => {
    doc.setFillColor(245, 166, 35);
    doc.rect(M, y - 4, W - 2 * M, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0);
    doc.text("Line Item", M + 2, y);
    months.forEach((mLabel, i) => doc.text(mLabel, colX(i) + monthW - 2, y, { align: "right" }));
    y += 6;
  };

  const checkPage = () => {
    if (y > H - 25) {
      doc.addPage();
      y = 16;
      drawHeaderRow();
    }
  };

  drawHeaderRow();

  const drawSectionLabel = (label) => {
    checkPage();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(180, 130, 20);
    doc.text(label, M + 2, y);
    y += 5.5;
  };

  const drawItemRow = (item) => {
    checkPage();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(60, 60, 60);
    doc.text((item.description || "Untitled").slice(0, 24), M + 2, y);
    item.amounts.forEach((v, i) => {
      doc.text(fmtMoney(parseFloat(v) || 0, sym), colX(i) + monthW - 2, y, { align: "right" });
    });
    y += 5.5;
  };

  const drawTotalRow = (label, arr, { bold = true, signed = false } = {}) => {
    checkPage();
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(26, 26, 26);
    doc.text(label, M + 2, y);
    arr.forEach((v, i) => {
      if (signed) doc.setTextColor(v < 0 ? 200 : 26, v < 0 ? 60 : 26, 26);
      doc.text(fmtMoney(v, sym), colX(i) + monthW - 2, y, { align: "right" });
    });
    y += 6;
  };

  drawSectionLabel("REVENUE");
  statement.revenueItems.forEach(drawItemRow);
  drawTotalRow("Total Revenue", totals.totalRevenue);
  y += 2;

  drawSectionLabel("EXPENSES");
  statement.expenseItems.forEach(drawItemRow);
  drawTotalRow("Total Expenses", totals.totalExpenses);
  y += 2;

  drawTotalRow("Net Cash Flow", totals.net, { signed: true });
  drawTotalRow("Opening Balance", totals.opening, { bold: false });
  drawTotalRow("Closing Balance", totals.closing, { signed: true });

  y += 4;
  if (y > H - 30) { doc.addPage(); y = 16; }
  const lowestIdx = totals.closing.indexOf(Math.min(...totals.closing));
  const explanation = buildExplanation(totals, months[lowestIdx], sym);
  doc.setFillColor(250, 245, 232);
  doc.rect(M, y - 4, W - 2 * M, 16, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(180, 130, 20);
  doc.text("WHAT THIS MEANS", M + 3, y);
  y += 4.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text(doc.splitTextToSize(explanation, W - 2 * M - 6), M + 3, y);

  doc.setFillColor(19, 19, 26);
  doc.rect(0, H - 10, W, 10, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(245, 166, 35);
  doc.text("Link-Ap", W / 2 - 8, H - 4);
  doc.setTextColor(138, 138, 154);
  doc.setFont("helvetica", "normal");
  doc.text(" · link-ap.online", W / 2 - 1, H - 4);

  return doc;
}

// ─── Statement (editable line-item table) ──────────────────────────────────────

function StatementTable({ section, title, placeholder, items, onAdd, onRemove, onDescChange, onAmountChange }) {
  return (
    <>
      <tr>
        <td colSpan={MONTHS_COUNT + 1} style={{ padding: "10px 8px 4px", background: COLORS.card }}>
          <span style={{ fontSize: 11, color: COLORS.accent, fontWeight: 700, letterSpacing: 0.5 }}>{title}</span>
        </td>
      </tr>
      {items.map(item => (
        <tr key={item.id}>
          <td style={{
            position: "sticky", left: 0, zIndex: 2, background: COLORS.card,
            padding: "4px 8px", borderBottom: `1px solid ${COLORS.border}33`,
            minWidth: LABEL_COL_WIDTH,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <input
                value={item.description}
                onChange={e => onDescChange(section, item.id, e.target.value)}
                placeholder={placeholder}
                style={{
                  flex: 1, background: COLORS.bg, border: `1px solid ${COLORS.border}`,
                  borderRadius: 6, color: COLORS.text, fontSize: 12, padding: "5px 7px", outline: "none",
                }}
              />
              <button
                onClick={() => onRemove(section, item.id)}
                style={{ background: "none", border: "none", color: COLORS.textMuted, cursor: "pointer", fontSize: 16, padding: "0 2px", flexShrink: 0 }}
              >×</button>
            </div>
          </td>
          {item.amounts.map((v, i) => (
            <td key={i} style={{ padding: "4px 6px", borderBottom: `1px solid ${COLORS.border}33`, minWidth: MONTH_COL_WIDTH }}>
              <input
                type="number"
                value={v}
                onChange={e => onAmountChange(section, item.id, i, e.target.value)}
                placeholder="0"
                style={{
                  width: "100%", background: COLORS.bg, border: `1px solid ${COLORS.border}`,
                  borderRadius: 6, color: COLORS.text, fontSize: 12, padding: "5px 6px",
                  textAlign: "right", outline: "none", boxSizing: "border-box",
                }}
              />
            </td>
          ))}
        </tr>
      ))}
      <tr>
        <td colSpan={MONTHS_COUNT + 1} style={{ padding: "6px 8px 10px", background: COLORS.card }}>
          <button
            onClick={() => onAdd(section)}
            style={{
              width: "100%", padding: "8px", borderRadius: 8, border: `1px dashed ${COLORS.border}`,
              background: "transparent", color: COLORS.textMuted, cursor: "pointer", fontSize: 12, fontWeight: 500,
            }}
          >+ Add {title === "REVENUE" ? "Revenue" : "Expense"} Item</button>
        </td>
      </tr>
    </>
  );
}

function TotalRow({ label, values, sym, bold = true, signed = false, sticky = true }) {
  return (
    <tr>
      <td style={{
        position: sticky ? "sticky" : "static", left: 0, zIndex: 2, background: COLORS.card,
        padding: "8px 8px", borderBottom: `1px solid ${COLORS.border}`,
        fontSize: 12, fontWeight: bold ? 700 : 500, color: COLORS.text, minWidth: LABEL_COL_WIDTH,
      }}>{label}</td>
      {values.map((v, i) => (
        <td key={i} style={{
          padding: "8px 6px", borderBottom: `1px solid ${COLORS.border}`,
          textAlign: "right", fontSize: 12, fontWeight: bold ? 700 : 500,
          color: signed && v < 0 ? COLORS.red : COLORS.text, minWidth: MONTH_COL_WIDTH, whiteSpace: "nowrap",
        }}>{fmtMoney(v, sym)}</td>
      ))}
    </tr>
  );
}

function Statement({ setup, statement, setStatement, onStartOver }) {
  const sym = CURRENCY_SYMBOLS[setup.currency] || "";
  const startingCash = Math.max(0, parseFloat(setup.startingCash) || 0);
  const months = Array.from({ length: MONTHS_COUNT }, (_, i) => monthLabelAt(setup.startMonth, i));
  const totals = computeTotals(statement, startingCash);

  const totalRevenueSum = totals.totalRevenue.reduce((a, b) => a + b, 0);
  const totalExpensesSum = totals.totalExpenses.reduce((a, b) => a + b, 0);
  const endingBalance = totals.closing[totals.closing.length - 1];
  const lowestBalance = Math.min(...totals.closing);
  const lowestIdx = totals.closing.indexOf(lowestBalance);
  const lowestMonth = months[lowestIdx];
  const maxAbs = Math.max(1, ...totals.closing.map(Math.abs));

  const addItem = (section) => setStatement(s => ({ ...s, [section]: [...s[section], newLineItem()] }));
  const removeItem = (section, id) => setStatement(s => ({ ...s, [section]: s[section].filter(it => it.id !== id) }));
  const updateDesc = (section, id, value) => setStatement(s => ({
    ...s, [section]: s[section].map(it => it.id === id ? { ...it, description: value } : it),
  }));
  const updateAmount = (section, id, monthIdx, value) => setStatement(s => ({
    ...s,
    [section]: s[section].map(it => it.id === id
      ? { ...it, amounts: it.amounts.map((v, i) => i === monthIdx ? value : v) }
      : it),
  }));

  const businessName = setup.businessName.trim();
  const fileName = `Cash-Flow-Statement-${(businessName || "Business").replace(/[^a-z0-9]+/gi, "-")}.pdf`;

  const buildPdf = () => buildStatementPDF({ businessName, startingCash, months, statement, totals, sym });
  const handleDownload = () => buildPdf().save(fileName);
  const handleShare = () => sharePdf(
    buildPdf(),
    fileName,
    "12-Month Cash Flow Statement",
    `${businessName || "My business"}'s 12-month cash flow statement — ending balance ${fmtMoney(endingBalance, sym)}`
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button onClick={onStartOver} style={startOverBtnStyle}>Start Over</button>
        <button onClick={handleShare} style={shareBtnStyle}>Share</button>
        <button onClick={handleDownload} style={primaryBtnStyle}>Download PDF</button>
      </div>

      <p style={{ fontSize: 12, color: COLORS.textMuted, margin: 0 }}>
        Scroll sideways to see all 12 months. Add as many revenue and expense line items as you need — rent, electricity, interest, salaries, anything — and edit any month's amount directly.
      </p>

      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                <th style={{
                  position: "sticky", left: 0, top: 0, zIndex: 3, background: COLORS.card,
                  padding: "10px 8px", borderBottom: `1px solid ${COLORS.border}`,
                  textAlign: "left", fontSize: 10, color: COLORS.textMuted, fontWeight: 700, minWidth: LABEL_COL_WIDTH,
                }}>LINE ITEM</th>
                {months.map((m, i) => (
                  <th key={i} style={{
                    padding: "10px 6px", borderBottom: `1px solid ${COLORS.border}`,
                    textAlign: "right", fontSize: 10, color: COLORS.textMuted, fontWeight: 700,
                    minWidth: MONTH_COL_WIDTH, whiteSpace: "nowrap",
                  }}>{m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <StatementTable
                section="revenueItems" title="REVENUE" placeholder="e.g. Product Sales"
                items={statement.revenueItems}
                onAdd={addItem} onRemove={removeItem} onDescChange={updateDesc} onAmountChange={updateAmount}
              />
              <TotalRow label="Total Revenue" values={totals.totalRevenue} sym={sym} />

              <StatementTable
                section="expenseItems" title="EXPENSES" placeholder="e.g. Rent, Electricity, Interest"
                items={statement.expenseItems}
                onAdd={addItem} onRemove={removeItem} onDescChange={updateDesc} onAmountChange={updateAmount}
              />
              <TotalRow label="Total Expenses" values={totals.totalExpenses} sym={sym} />

              <TotalRow label="Net Cash Flow" values={totals.net} sym={sym} signed />
              <TotalRow label="Opening Balance" values={totals.opening} sym={sym} bold={false} />
              <TotalRow label="Closing Balance" values={totals.closing} sym={sym} signed />
            </tbody>
          </table>
        </div>
      </div>

      {/* Sparkline of closing balance */}
      <div style={sectionCardStyle}>
        <div style={sectionLabelStyle}>CLOSING BALANCE TREND</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 60 }}>
          {totals.closing.map((bal, i) => {
            const h = Math.max(3, (Math.abs(bal) / maxAbs) * 56);
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
                <div style={{
                  width: "100%", height: h, borderRadius: 3,
                  background: bal < 0 ? COLORS.red : COLORS.accent,
                }} title={`${months[i]}: ${fmtMoney(bal, sym)}`} />
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
          {months.map((m, i) => (
            <div key={i} style={{ flex: 1, fontSize: 8, color: COLORS.textMuted, textAlign: "center" }}>
              {m.split(" ")[0]}
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ padding: "14px 16px", borderRadius: 12, background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
          <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600, marginBottom: 6 }}>TOTAL REVENUE (12MO)</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.text }}>{fmtMoney(totalRevenueSum, sym)}</div>
        </div>
        <div style={{ padding: "14px 16px", borderRadius: 12, background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
          <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600, marginBottom: 6 }}>TOTAL EXPENSES (12MO)</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.text }}>{fmtMoney(totalExpensesSum, sym)}</div>
        </div>
        <div style={{ padding: "14px 16px", borderRadius: 12, background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
          <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600, marginBottom: 6 }}>ENDING BALANCE</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: endingBalance < 0 ? COLORS.red : COLORS.accent }}>{fmtMoney(endingBalance, sym)}</div>
        </div>
        <div style={{ padding: "14px 16px", borderRadius: 12, background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
          <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600, marginBottom: 6 }}>LOWEST POINT</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: lowestBalance < 0 ? COLORS.red : COLORS.text }}>{fmtMoney(lowestBalance, sym)}</div>
          <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{lowestMonth}</div>
        </div>
      </div>

      <div style={{ padding: "12px 16px", borderRadius: 12, background: COLORS.bg, borderLeft: `3px solid ${COLORS.accent}` }}>
        <div style={{ fontSize: 10, color: COLORS.accent, fontWeight: 600, marginBottom: 6 }}>WHAT THIS MEANS</div>
        <p style={{ fontSize: 13, color: COLORS.textMuted, margin: 0, lineHeight: 1.7 }}>
          {buildExplanation(totals, lowestMonth, sym)}
        </p>
      </div>
    </div>
  );
}

// ─── Cash Flow Projection (setup + statement) ──────────────────────────────────

export default function CashFlowProjection({ user }) {
  const [setup, setSetup] = useState({
    businessName: user?.name ? `${user.name}'s Business` : "",
    currency: "ZAR",
    startMonth: defaultStartMonth(),
    startingCash: "",
  });
  const [statement, setStatement] = useState(null);

  const upd = (k, v) => setSetup(f => ({ ...f, [k]: v }));

  const canBuild = setup.startingCash !== "";

  const build = () => setStatement({
    revenueItems: [newLineItem()],
    expenseItems: [newLineItem()],
  });
  const startOver = () => setStatement(null);

  if (statement) {
    return (
      <Statement
        setup={setup}
        statement={statement}
        setStatement={setStatement}
        onStartOver={startOver}
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <p style={{ fontSize: 13, color: COLORS.textMuted, margin: 0 }}>
        Set up your business and starting cash, then build a 12-month cash flow statement with your own line items — rent, electricity, interest, sales, anything.
      </p>

      <div style={sectionCardStyle}>
        <div style={sectionLabelStyle}>BUSINESS</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={labelStyle}>Business Name</label>
            <input
              style={inputStyle}
              value={setup.businessName}
              onChange={e => upd("businessName", e.target.value)}
              placeholder="e.g. Thapelo's Catering"
            />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Currency</label>
              <select
                value={setup.currency}
                onChange={e => upd("currency", e.target.value)}
                style={{ ...inputStyle, appearance: "none", WebkitAppearance: "none" }}
              >
                {CURRENCY_OPTIONS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Start Month</label>
              <input
                style={inputStyle}
                type="month"
                value={setup.startMonth}
                onChange={e => upd("startMonth", e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div style={sectionCardStyle}>
        <div style={sectionLabelStyle}>CASH POSITION</div>
        <div>
          <label style={labelStyle}>Starting Cash Balance</label>
          <input
            style={inputStyle}
            type="number"
            value={setup.startingCash}
            onChange={e => upd("startingCash", e.target.value)}
            placeholder="Cash available right now"
          />
        </div>
      </div>

      <button
        onClick={build}
        disabled={!canBuild}
        style={generateBtnStyle(canBuild)}
      >Build Cash Flow Statement</button>
    </div>
  );
}
