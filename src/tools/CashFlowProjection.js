import { useState } from "react";
import { jsPDF } from "jspdf";
import { COLORS } from "../shared";
import {
  CURRENCY_OPTIONS, CURRENCY_SYMBOLS, inputStyle, labelStyle,
  sectionCardStyle, sectionLabelStyle, startOverBtnStyle, shareBtnStyle,
  primaryBtnStyle, generateBtnStyle, sharePdf,
} from "./toolsShared";

function defaultStartMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabelAt(startMonth, offset) {
  const [y, m] = (startMonth || defaultStartMonth()).split("-").map(Number);
  const d = new Date(y, (m - 1) + offset, 1);
  return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function seedMonths(form) {
  const revenue0 = Math.max(0, parseFloat(form.avgMonthlyRevenue) || 0);
  const expenses0 = Math.max(0, parseFloat(form.avgMonthlyExpenses) || 0);
  const revGrowth = (parseFloat(form.revenueGrowthPct) || 0) / 100;
  const expGrowth = (parseFloat(form.expenseGrowthPct) || 0) / 100;
  return Array.from({ length: 12 }, (_, i) => ({
    label: monthLabelAt(form.startMonth, i),
    revenue: (revenue0 * Math.pow(1 + revGrowth, i)).toFixed(2),
    expenses: (expenses0 * Math.pow(1 + expGrowth, i)).toFixed(2),
  }));
}

function computeRows(months, startingCash) {
  let balance = startingCash;
  return months.map(m => {
    const revenue = parseFloat(m.revenue) || 0;
    const expenses = parseFloat(m.expenses) || 0;
    const net = revenue - expenses;
    balance += net;
    return { label: m.label, revenue, expenses, net, balance };
  });
}

function fmtMoney(n, sym) {
  return `${n < 0 ? "-" : ""}${sym}${Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function buildExplanation(rows, totals, lowest, sym) {
  if (lowest.balance >= 0) {
    return `Your projected cash balance stays positive throughout the 12 months, ending at ${fmtMoney(totals.endingBalance, sym)}. Lowest point is ${fmtMoney(lowest.balance, sym)} in ${lowest.label}.`;
  }
  return `Your cash balance is projected to go negative — the lowest point is ${fmtMoney(lowest.balance, sym)} in ${lowest.label}. Plan to have financing, a credit line, or extra sales lined up before then. The 12-month balance ends at ${fmtMoney(totals.endingBalance, sym)}.`;
}

// ─── Builder (editable 12-month table) ─────────────────────────────────────────

function ProjectionBuilder({ businessName, currency, startingCash, months, onUpdateMonth, onReseed, onStartOver }) {
  const sym = CURRENCY_SYMBOLS[currency] || "";
  const rows = computeRows(months, startingCash);
  const totals = rows.reduce((acc, r) => ({
    totalRevenue: acc.totalRevenue + r.revenue,
    totalExpenses: acc.totalExpenses + r.expenses,
  }), { totalRevenue: 0, totalExpenses: 0 });
  totals.netTotal = totals.totalRevenue - totals.totalExpenses;
  totals.endingBalance = rows[rows.length - 1].balance;
  const lowest = rows.reduce((min, r) => (r.balance < min.balance ? r : min), rows[0]);
  const maxAbs = Math.max(1, ...rows.map(r => Math.abs(r.balance)));

  const buildPdf = () => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const W = 210;
    const M = 20;
    const CW = W - 2 * M;
    let y = 0;

    doc.setFillColor(245, 166, 35);
    doc.rect(0, 0, W, 16, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("12-MONTH CASH FLOW PROJECTION", M, 10);
    y = 28;

    doc.setFontSize(13);
    doc.setTextColor(26, 26, 26);
    doc.text(businessName || "Untitled Business", M, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(138, 138, 154);
    doc.text(`Starting cash balance: ${sym}${startingCash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, M, y);
    doc.text(`Generated ${new Date().toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}`, W - M, y, { align: "right" });
    y += 10;

    // Table header
    doc.setFillColor(245, 166, 35);
    doc.rect(M, y - 4, CW, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text("Month", M + 2, y);
    doc.text("Revenue", M + CW * 0.40, y, { align: "right" });
    doc.text("Expenses", M + CW * 0.58, y, { align: "right" });
    doc.text("Net", M + CW * 0.76, y, { align: "right" });
    doc.text("Balance", M + CW, y, { align: "right" });
    y += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    rows.forEach((r, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(248, 248, 248);
        doc.rect(M, y - 4, CW, 6.5, "F");
      }
      doc.setTextColor(26, 26, 26);
      doc.text(r.label, M + 2, y);
      doc.text(`${sym}${r.revenue.toFixed(2)}`, M + CW * 0.40, y, { align: "right" });
      doc.text(`${sym}${r.expenses.toFixed(2)}`, M + CW * 0.58, y, { align: "right" });
      doc.setTextColor(r.net < 0 ? 200 : 60, r.net < 0 ? 60 : 110, 60);
      doc.text(fmtMoney(r.net, sym), M + CW * 0.76, y, { align: "right" });
      doc.setTextColor(r.balance < 0 ? 200 : 26, r.balance < 0 ? 60 : 26, 26);
      doc.setFont("helvetica", "bold");
      doc.text(fmtMoney(r.balance, sym), M + CW, y, { align: "right" });
      doc.setFont("helvetica", "normal");
      y += 6.5;
    });

    y += 3;
    doc.setDrawColor(200, 200, 200);
    doc.line(M, y, M + CW, y);
    y += 6;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(26, 26, 26);
    doc.text("12-Month Totals", M + 2, y);
    doc.text(`${sym}${totals.totalRevenue.toFixed(2)}`, M + CW * 0.40, y, { align: "right" });
    doc.text(`${sym}${totals.totalExpenses.toFixed(2)}`, M + CW * 0.58, y, { align: "right" });
    doc.text(fmtMoney(totals.netTotal, sym), M + CW * 0.76, y, { align: "right" });
    doc.text(fmtMoney(totals.endingBalance, sym), M + CW, y, { align: "right" });
    y += 12;

    doc.setFillColor(250, 245, 232);
    doc.rect(M, y - 5, CW, 22, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(180, 130, 20);
    doc.text("WHAT THIS MEANS", M + 4, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(80, 80, 80);
    const explLines = doc.splitTextToSize(buildExplanation(rows, totals, lowest, sym), CW - 8);
    doc.text(explLines, M + 4, y);

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

  const fileName = `Cash-Flow-Projection-${(businessName || "Business").replace(/[^a-z0-9]+/gi, "-")}.pdf`;

  const handleDownload = () => buildPdf().save(fileName);
  const handleShare = () => sharePdf(
    buildPdf(),
    fileName,
    "12-Month Cash Flow Projection",
    `${businessName || "My business"}'s 12-month cash flow projection — ending balance ${fmtMoney(totals.endingBalance, sym)}`
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button onClick={onStartOver} style={startOverBtnStyle}>Start Over</button>
        <button onClick={handleShare} style={shareBtnStyle}>Share</button>
        <button onClick={handleDownload} style={primaryBtnStyle}>Download PDF</button>
      </div>

      <button
        onClick={onReseed}
        style={{
          alignSelf: "flex-start", background: "none", border: "none",
          color: COLORS.textMuted, fontSize: 12, cursor: "pointer", padding: 0,
          textDecoration: "underline",
        }}
      >↺ Reset all months to your assumptions</button>

      {/* Sparkline of closing balance */}
      <div style={sectionCardStyle}>
        <div style={sectionLabelStyle}>CLOSING BALANCE TREND</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 60 }}>
          {rows.map((r, i) => {
            const h = Math.max(3, (Math.abs(r.balance) / maxAbs) * 56);
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
                <div style={{
                  width: "100%", height: h, borderRadius: 3,
                  background: r.balance < 0 ? COLORS.red : COLORS.accent,
                }} title={`${r.label}: ${fmtMoney(r.balance, sym)}`} />
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
          {rows.map((r, i) => (
            <div key={i} style={{ flex: 1, fontSize: 8, color: COLORS.textMuted, textAlign: "center" }}>
              {r.label.split(" ")[0]}
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ padding: "14px 16px", borderRadius: 12, background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
          <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600, marginBottom: 6 }}>TOTAL REVENUE (12MO)</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.text }}>{fmtMoney(totals.totalRevenue, sym)}</div>
        </div>
        <div style={{ padding: "14px 16px", borderRadius: 12, background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
          <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600, marginBottom: 6 }}>TOTAL EXPENSES (12MO)</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.text }}>{fmtMoney(totals.totalExpenses, sym)}</div>
        </div>
        <div style={{ padding: "14px 16px", borderRadius: 12, background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
          <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600, marginBottom: 6 }}>ENDING BALANCE</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: totals.endingBalance < 0 ? COLORS.red : COLORS.accent }}>{fmtMoney(totals.endingBalance, sym)}</div>
        </div>
        <div style={{ padding: "14px 16px", borderRadius: 12, background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
          <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600, marginBottom: 6 }}>LOWEST POINT</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: lowest.balance < 0 ? COLORS.red : COLORS.text }}>{fmtMoney(lowest.balance, sym)}</div>
          <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{lowest.label}</div>
        </div>
      </div>

      <div style={{ padding: "12px 16px", borderRadius: 12, background: COLORS.bg, borderLeft: `3px solid ${COLORS.accent}` }}>
        <div style={{ fontSize: 10, color: COLORS.accent, fontWeight: 600, marginBottom: 6 }}>WHAT THIS MEANS</div>
        <p style={{ fontSize: 13, color: COLORS.textMuted, margin: 0, lineHeight: 1.7 }}>
          {buildExplanation(rows, totals, lowest, sym)}
        </p>
      </div>

      {/* Editable month-by-month rows */}
      <div style={sectionCardStyle}>
        <div style={sectionLabelStyle}>EDIT ANY MONTH</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {months.map((m, i) => (
            <div key={i} style={{
              padding: "10px 12px", borderRadius: 10,
              background: COLORS.bg, border: `1px solid ${COLORS.border}`,
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.text, marginBottom: 8 }}>
                Month {i + 1} · {m.label}
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ ...labelStyle, marginBottom: 3 }}>Revenue</label>
                  <input
                    style={{ ...inputStyle, padding: "8px 10px" }}
                    type="number"
                    value={m.revenue}
                    onChange={e => onUpdateMonth(i, "revenue", e.target.value)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ ...labelStyle, marginBottom: 3 }}>Expenses</label>
                  <input
                    style={{ ...inputStyle, padding: "8px 10px" }}
                    type="number"
                    value={m.expenses}
                    onChange={e => onUpdateMonth(i, "expenses", e.target.value)}
                  />
                </div>
              </div>
              <div style={{ fontSize: 12, color: rows[i].balance < 0 ? COLORS.red : COLORS.textMuted }}>
                Net: {fmtMoney(rows[i].net, sym)} · Balance: {fmtMoney(rows[i].balance, sym)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Cash Flow Projection (assumptions form + builder) ─────────────────────────

export default function CashFlowProjection({ user }) {
  const [form, setForm] = useState({
    businessName: user?.name ? `${user.name}'s Business` : "",
    currency: "ZAR",
    startMonth: defaultStartMonth(),
    startingCash: "",
    avgMonthlyRevenue: "",
    revenueGrowthPct: "",
    avgMonthlyExpenses: "",
    expenseGrowthPct: "",
  });
  const [months, setMonths] = useState(null);

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const canBuild =
    form.startingCash !== "" &&
    form.avgMonthlyRevenue !== "" &&
    form.avgMonthlyExpenses !== "";

  const build = () => setMonths(seedMonths(form));
  const reseed = () => setMonths(seedMonths(form));
  const startOver = () => setMonths(null);
  const updateMonth = (i, field, value) =>
    setMonths(ms => ms.map((m, idx) => (idx === i ? { ...m, [field]: value } : m)));

  if (months) {
    return (
      <ProjectionBuilder
        businessName={form.businessName.trim()}
        currency={form.currency}
        startingCash={Math.max(0, parseFloat(form.startingCash) || 0)}
        months={months}
        onUpdateMonth={updateMonth}
        onReseed={reseed}
        onStartOver={startOver}
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <p style={{ fontSize: 13, color: COLORS.textMuted, margin: 0 }}>
        Set your starting assumptions, then build and fine-tune a 12-month cash flow projection you can download or share.
      </p>

      <div style={sectionCardStyle}>
        <div style={sectionLabelStyle}>BUSINESS</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={labelStyle}>Business Name</label>
            <input
              style={inputStyle}
              value={form.businessName}
              onChange={e => upd("businessName", e.target.value)}
              placeholder="e.g. Thapelo's Catering"
            />
          </div>
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
              <label style={labelStyle}>Start Month</label>
              <input
                style={inputStyle}
                type="month"
                value={form.startMonth}
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
            value={form.startingCash}
            onChange={e => upd("startingCash", e.target.value)}
            placeholder="Cash available right now"
          />
        </div>
      </div>

      <div style={sectionCardStyle}>
        <div style={sectionLabelStyle}>REVENUE ASSUMPTIONS</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={labelStyle}>Average Monthly Revenue (Month 1)</label>
            <input
              style={inputStyle}
              type="number"
              min="0"
              value={form.avgMonthlyRevenue}
              onChange={e => upd("avgMonthlyRevenue", e.target.value)}
              placeholder="Revenue you expect in month 1"
            />
          </div>
          <div>
            <label style={labelStyle}>Monthly Revenue Growth % (optional)</label>
            <input
              style={inputStyle}
              type="number"
              value={form.revenueGrowthPct}
              onChange={e => upd("revenueGrowthPct", e.target.value)}
              placeholder="e.g. 5 for 5% growth each month"
            />
          </div>
        </div>
      </div>

      <div style={sectionCardStyle}>
        <div style={sectionLabelStyle}>EXPENSE ASSUMPTIONS</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={labelStyle}>Average Monthly Expenses (Month 1)</label>
            <input
              style={inputStyle}
              type="number"
              min="0"
              value={form.avgMonthlyExpenses}
              onChange={e => upd("avgMonthlyExpenses", e.target.value)}
              placeholder="Rent, stock, salaries, etc. in month 1"
            />
          </div>
          <div>
            <label style={labelStyle}>Monthly Expense Growth % (optional)</label>
            <input
              style={inputStyle}
              type="number"
              value={form.expenseGrowthPct}
              onChange={e => upd("expenseGrowthPct", e.target.value)}
              placeholder="e.g. 2 for 2% growth each month"
            />
          </div>
        </div>
      </div>

      <button
        onClick={build}
        disabled={!canBuild}
        style={generateBtnStyle(canBuild)}
      >Build 12-Month Projection</button>
    </div>
  );
}
