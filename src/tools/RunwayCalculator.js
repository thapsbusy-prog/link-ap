import { useState } from "react";
import { COLORS } from "../shared";
import {
  CURRENCY_OPTIONS, CURRENCY_SYMBOLS, inputStyle, labelStyle,
  sectionCardStyle, sectionLabelStyle, errorBoxStyle, startOverBtnStyle,
} from "./toolsShared";

const MAX_MONTHS = 60;
const VISUAL_SCALE_MONTHS = 24;

function fmtMoney(n, sym) {
  return `${sym}${Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function addMonthsAndDays(date, months) {
  const wholeMonths = Math.floor(months);
  const fracDays = Math.round((months - wholeMonths) * 30);
  const result = new Date(date);
  result.setMonth(result.getMonth() + wholeMonths);
  result.setDate(result.getDate() + fracDays);
  return result;
}

function formatDate(date) {
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function simulateRunway(cashOnHand, monthlyNet, onceOffInflow, onceOffInflowMonth, onceOffOutflow, onceOffOutflowMonth) {
  if (cashOnHand <= 0) return 0;

  let cash = cashOnHand;
  for (let m = 1; m <= MAX_MONTHS; m++) {
    const prevCash = cash;
    let net = monthlyNet;
    if (onceOffInflow > 0 && onceOffInflowMonth === m) net += onceOffInflow;
    if (onceOffOutflow > 0 && onceOffOutflowMonth === m) net -= onceOffOutflow;
    cash += net;
    if (cash <= 0) {
      const frac = net < 0 ? prevCash / -net : 0;
      return (m - 1) + Math.min(1, Math.max(0, frac));
    }
  }
  return null;
}

function buildExplanation(runway, monthlyNet, sym, runOutDateStr) {
  if (monthlyNet >= 0) {
    return `You're cash-flow positive, with a monthly surplus of ${fmtMoney(monthlyNet, sym)}. At this rate your cash balance will keep growing rather than running out — there's no runway limit to worry about right now.`;
  }
  const burn = Math.abs(monthlyNet);
  if (runway === null) {
    return `You're burning ${fmtMoney(burn, sym)} per month, but your cash on hand is large enough to cover more than ${MAX_MONTHS} months at this rate. To break even, you'd need an extra ${fmtMoney(burn, sym)} in monthly revenue (or an equivalent reduction in costs).`;
  }
  if (runway === 0) {
    return `Your cash on hand is already at or below zero. You're burning ${fmtMoney(burn, sym)} per month — to stop the bleed, you'd need an extra ${fmtMoney(burn, sym)} in monthly revenue (or an equivalent reduction in costs) right away.`;
  }
  return `You're burning ${fmtMoney(burn, sym)} per month. At this rate, your cash will run out in ${runway.toFixed(1)} months (around ${runOutDateStr}). To break even, you'd need an extra ${fmtMoney(burn, sym)} in monthly revenue (or an equivalent reduction in costs).`;
}

export default function RunwayCalculator() {
  const [form, setForm] = useState({
    cashOnHand: "",
    avgMonthlyIncome: "",
    fixedMonthlyCosts: "",
    onceOffInflow: "",
    onceOffInflowMonth: "1",
    onceOffOutflow: "",
    onceOffOutflowMonth: "1",
    currency: "ZAR",
  });
  const [results, setResults] = useState(null);
  const [calcError, setCalcError] = useState("");

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const sym = CURRENCY_SYMBOLS[form.currency] || "";

  const canCalculate =
    form.cashOnHand !== "" &&
    form.avgMonthlyIncome !== "" &&
    form.fixedMonthlyCosts !== "";

  const calculate = () => {
    setCalcError("");
    const cashOnHand = parseFloat(form.cashOnHand) || 0;
    const income = Math.max(0, parseFloat(form.avgMonthlyIncome) || 0);
    const costs = Math.max(0, parseFloat(form.fixedMonthlyCosts) || 0);
    const onceOffInflow = Math.max(0, parseFloat(form.onceOffInflow) || 0);
    const onceOffOutflow = Math.max(0, parseFloat(form.onceOffOutflow) || 0);
    const onceOffInflowMonth = Math.max(1, parseInt(form.onceOffInflowMonth, 10) || 1);
    const onceOffOutflowMonth = Math.max(1, parseInt(form.onceOffOutflowMonth, 10) || 1);

    const monthlyNet = income - costs;
    const runway = simulateRunway(cashOnHand, monthlyNet, onceOffInflow, onceOffInflowMonth, onceOffOutflow, onceOffOutflowMonth);

    let runOutDateStr = null;
    if (runway !== null && runway > 0) {
      runOutDateStr = formatDate(addMonthsAndDays(new Date(), runway));
    } else if (runway === 0) {
      runOutDateStr = formatDate(new Date());
    }

    const isPositive = monthlyNet >= 0 || runway === null;
    const visualMonths = runway === null ? VISUAL_SCALE_MONTHS : Math.min(runway, VISUAL_SCALE_MONTHS);
    const barPct = isPositive ? 100 : Math.max(0, (visualMonths / VISUAL_SCALE_MONTHS) * 100);

    setResults({
      runway,
      runOutDateStr,
      monthlyNet,
      isPositive,
      barPct,
      explanation: buildExplanation(runway, monthlyNet, sym, runOutDateStr),
    });
  };

  const startOver = () => {
    setResults(null);
    setCalcError("");
    setForm({
      cashOnHand: "", avgMonthlyIncome: "", fixedMonthlyCosts: "",
      onceOffInflow: "", onceOffInflowMonth: "1",
      onceOffOutflow: "", onceOffOutflowMonth: "1",
      currency: "ZAR",
    });
  };

  if (results) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{
          background: COLORS.card, border: `1px solid ${COLORS.border}`,
          borderRadius: 16, overflow: "hidden",
        }}>
          <div style={{ background: COLORS.accent, padding: "14px 20px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#00000088", letterSpacing: 0.5 }}>
              CASH FLOW RUNWAY
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#000" }}>Link-Ap</div>
          </div>
          <div style={{ padding: "20px 20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{
                padding: "14px 16px", borderRadius: 12,
                background: COLORS.bg, border: `1px solid ${COLORS.border}`,
              }}>
                <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600, marginBottom: 6 }}>
                  RUNWAY
                </div>
                <div style={{ fontSize: 24, fontWeight: 900, color: COLORS.accent }}>
                  {results.runway === null
                    ? "60+ mo"
                    : `${results.runway.toFixed(1)} mo`}
                </div>
              </div>
              <div style={{
                padding: "14px 16px", borderRadius: 12,
                background: COLORS.bg, border: `1px solid ${COLORS.border}`,
              }}>
                <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600, marginBottom: 6 }}>
                  PROJECTED RUN-OUT DATE
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.text }}>
                  {results.runOutDateStr || "—"}
                </div>
              </div>
              <div style={{
                padding: "14px 16px", borderRadius: 12,
                background: COLORS.bg, border: `1px solid ${COLORS.border}`,
                gridColumn: "1 / -1",
              }}>
                <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600, marginBottom: 6 }}>
                  {results.monthlyNet >= 0 ? "MONTHLY SURPLUS" : "MONTHLY BURN"}
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: results.monthlyNet >= 0 ? COLORS.accent : COLORS.text }}>
                  {fmtMoney(results.monthlyNet, sym)} / month
                </div>
              </div>
            </div>

            {/* Burn-down bar */}
            <div>
              <div style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: 600, marginBottom: 8 }}>
                {results.isPositive ? "RUNWAY" : `RUNWAY (OF ${VISUAL_SCALE_MONTHS}-MONTH VIEW)`}
              </div>
              <div style={{
                borderRadius: 8, overflow: "hidden",
                height: 28, display: "flex", border: `1px solid ${COLORS.border}`,
              }}>
                <div style={{
                  width: `${results.barPct}%`,
                  background: COLORS.accent,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 700, color: "#000",
                }}>
                  {results.isPositive
                    ? "No runway limit"
                    : `${results.runway.toFixed(1)} mo`}
                </div>
                {results.barPct < 100 && (
                  <div style={{
                    width: `${100 - results.barPct}%`,
                    background: COLORS.border,
                  }} />
                )}
              </div>
            </div>

            <div style={{
              padding: "12px 16px", borderRadius: 12,
              background: COLORS.bg, borderLeft: `3px solid ${COLORS.accent}`,
            }}>
              <div style={{ fontSize: 10, color: COLORS.accent, fontWeight: 600, marginBottom: 6 }}>
                WHAT THIS MEANS
              </div>
              <p style={{ fontSize: 13, color: COLORS.textMuted, margin: 0, lineHeight: 1.7 }}>
                {results.explanation}
              </p>
            </div>
          </div>
        </div>

        <button onClick={startOver} style={startOverBtnStyle}>Start Over</button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <p style={{ fontSize: 13, color: COLORS.textMuted, margin: 0 }}>
        See how many months your cash on hand will last at your current burn rate.
      </p>

      <div style={sectionCardStyle}>
        <div style={sectionLabelStyle}>CASH POSITION</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={labelStyle}>Cash on Hand</label>
            <input
              style={inputStyle}
              type="number"
              value={form.cashOnHand}
              onChange={e => upd("cashOnHand", e.target.value)}
              placeholder="Total cash available right now"
            />
          </div>
          <div>
            <label style={labelStyle}>Average Monthly Income</label>
            <input
              style={inputStyle}
              type="number"
              min="0"
              value={form.avgMonthlyIncome}
              onChange={e => upd("avgMonthlyIncome", e.target.value)}
              placeholder="Revenue you expect per month"
            />
          </div>
          <div>
            <label style={labelStyle}>Fixed Monthly Costs</label>
            <input
              style={inputStyle}
              type="number"
              min="0"
              value={form.fixedMonthlyCosts}
              onChange={e => upd("fixedMonthlyCosts", e.target.value)}
              placeholder="Rent, salaries, subscriptions, etc."
            />
          </div>
          <div>
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
      </div>

      <div style={sectionCardStyle}>
        <div style={sectionLabelStyle}>ONE-OFF EVENTS (OPTIONAL)</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 2 }}>
              <label style={labelStyle}>Once-off Inflow</label>
              <input
                style={inputStyle}
                type="number"
                min="0"
                value={form.onceOffInflow}
                onChange={e => upd("onceOffInflow", e.target.value)}
                placeholder="e.g. funding, big payment"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>In Month</label>
              <input
                style={inputStyle}
                type="number"
                min="1"
                value={form.onceOffInflowMonth}
                onChange={e => upd("onceOffInflowMonth", e.target.value)}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 2 }}>
              <label style={labelStyle}>Once-off Outflow</label>
              <input
                style={inputStyle}
                type="number"
                min="0"
                value={form.onceOffOutflow}
                onChange={e => upd("onceOffOutflow", e.target.value)}
                placeholder="e.g. tax bill, equipment purchase"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>In Month</label>
              <input
                style={inputStyle}
                type="number"
                min="1"
                value={form.onceOffOutflowMonth}
                onChange={e => upd("onceOffOutflowMonth", e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {calcError && <div style={errorBoxStyle}>{calcError}</div>}

      <button
        onClick={calculate}
        disabled={!canCalculate}
        style={{
          padding: "14px", borderRadius: 12, border: "none",
          background: canCalculate ? COLORS.accent : COLORS.border,
          color: canCalculate ? "#000" : COLORS.textMuted,
          cursor: canCalculate ? "pointer" : "not-allowed",
          fontSize: 15, fontWeight: 700,
        }}
      >Calculate Runway</button>
    </div>
  );
}
