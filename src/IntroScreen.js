import logoImg from "./link-ap-logo.png";
import { COLORS } from "./shared";

const HIGHLIGHTS = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill={COLORS.accent} width="15" height="15">
        <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z"/>
      </svg>
    ),
    title: "Business Ideas Feed",
    desc: "5 SA business ideas every 5 days — real costs & how-to-start steps",
    badge: "NEW",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke={COLORS.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
        <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
    title: "Why Connect — AI",
    desc: "AI explains exactly why each match matters for what you're building",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill={COLORS.accent} width="15" height="15">
        <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
      </svg>
    ),
    title: "Quotes & Invoices",
    desc: "AI-drafted quotes and invoices, sent as branded PDFs in seconds",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill={COLORS.accent} width="15" height="15">
        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
      </svg>
    ),
    title: "Payment Chaser",
    desc: "AI writes your follow-up message — polite but firm, ready to send",
    badge: "NEW",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill={COLORS.accent} width="15" height="15">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z"/>
      </svg>
    ),
    title: "Pitch & Runway Tools",
    desc: "10-slide pitch outlines plus a cash flow runway calculator, built in",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill={COLORS.accent} width="15" height="15">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
      </svg>
    ),
    title: "Smart Chat Tools",
    desc: "AI-drafted notes and conversation starters break the ice instantly",
  },
];

const FOUNDING_PERKS = [
  "Founding Member badge (#1–100) on your profile",
  "Free access to all AI tools & the Business Ideas feed",
  "50 AI-powered actions per month — no credit card",
];

export function IntroScreen({ onContinue }) {
  return (
    <div style={{
      minHeight: "100vh", background: COLORS.bg,
      display: "flex", flexDirection: "column",
      alignItems: "center", overflowY: "auto",
    }}>
      <div style={{ width: "100%", maxWidth: 430, padding: "0 20px 40px", boxSizing: "border-box" }}>

        <div style={{ height: 40 }} />

        {/* Logo block */}
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <img
            src={logoImg}
            alt="Link-Ap"
            style={{ width: 76, height: 76, objectFit: "contain", marginBottom: 6 }}
          />
          <div style={{ fontSize: 26, fontWeight: 800, color: COLORS.text, marginBottom: 2 }}>
            Link<span style={{ color: COLORS.accent }}>-Ap</span>
          </div>
        </div>

        {/* Badge pill */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
          <span style={{
            background: "rgba(245,166,35,0.15)",
            border: "1px solid rgba(245,166,35,0.3)",
            color: COLORS.accent,
            fontSize: 11, fontWeight: 700,
            padding: "5px 14px", borderRadius: 99,
            display: "flex", alignItems: "center", gap: 6,
            textTransform: "uppercase", letterSpacing: 0.5,
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke={COLORS.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="11" height="11">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            AI-Powered Professional Networking
          </span>
        </div>

        {/* Headline */}
        <h1 style={{
          color: COLORS.text, fontSize: 21, fontWeight: 800,
          textAlign: "center", margin: "0 0 8px", lineHeight: 1.35,
        }}>
          The network that works<br />
          <span style={{ color: COLORS.accent }}>as hard as you do</span>
        </h1>

        {/* Subline */}
        <p style={{
          color: COLORS.textMuted, fontSize: 13, textAlign: "center",
          margin: "0 0 20px", lineHeight: 1.7,
        }}>
          AI-matched connections, plus a growing toolkit — quotes, invoices,
          pitch decks and a fresh business idea feed for South Africa.
        </p>

        {/* ─── Founding Member FOMO block ─── */}
        <div style={{
          background: "linear-gradient(135deg, rgba(245,166,35,0.14) 0%, rgba(245,166,35,0.06) 100%)",
          border: "1.5px solid rgba(245,166,35,0.4)",
          borderRadius: 16, padding: "16px 18px", marginBottom: 22,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill={COLORS.accent} style={{ flexShrink: 0 }}>
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <span style={{ color: COLORS.accent, fontSize: 14, fontWeight: 800 }}>
              First 100 members only
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {FOUNDING_PERKS.map((perk, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <svg viewBox="0 0 24 24" fill={COLORS.accent} width="13" height="13" style={{ flexShrink: 0, marginTop: 2 }}>
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                <span style={{ color: COLORS.textMuted, fontSize: 12, lineHeight: 1.5 }}>{perk}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Highlights ─── */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <div style={{ flex: 1, height: 1, background: COLORS.border }} />
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: COLORS.textMuted }}>
              What's Inside
            </span>
            <div style={{ flex: 1, height: 1, background: COLORS.border }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {HIGHLIGHTS.map(f => (
              <div key={f.title} style={{
                background: COLORS.card, border: `1px solid ${COLORS.border}`,
                borderRadius: 12, padding: "12px 12px",
                display: "flex", flexDirection: "column", gap: 6, position: "relative",
              }}>
                {f.badge && (
                  <span style={{
                    position: "absolute", top: 10, right: 10,
                    background: COLORS.accent, color: "#000",
                    fontSize: 9, fontWeight: 800, letterSpacing: 0.5,
                    padding: "2px 6px", borderRadius: 6,
                  }}>{f.badge}</span>
                )}
                <div style={{
                  width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                  background: "rgba(245,166,35,0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {f.icon}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.text, lineHeight: 1.3, paddingRight: f.badge ? 30 : 0 }}>{f.title}</div>
                <div style={{ fontSize: 11, color: COLORS.textMuted, lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div style={{ marginBottom: 26 }}>
          <div style={{ color: COLORS.text, fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
            How it works
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { num: "1", text: "Tell us what you're building and who you need to meet" },
              { num: "2", text: "AI finds your matches, explains why, and breaks the ice for you" },
              { num: "3", text: "Use the built-in tools and Business Ideas feed to grow — without leaving the app" },
            ].map((step) => (
              <div key={step.num} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                  background: "rgba(245,166,35,0.15)",
                  border: "1px solid rgba(245,166,35,0.35)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 800, color: COLORS.accent,
                }}>
                  {step.num}
                </div>
                <p style={{ color: COLORS.textMuted, fontSize: 12, margin: 0, lineHeight: 1.65 }}>{step.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Primary CTA */}
        <button
          onClick={onContinue}
          style={{
            width: "100%", padding: "15px",
            borderRadius: 14, border: "none",
            background: COLORS.accent, color: "#0A0A0F",
            fontSize: 15, fontWeight: 800,
            cursor: "pointer", marginBottom: 10,
            letterSpacing: 0.2,
          }}
        >
          Claim your Founding Member spot — it's free
        </button>

        <p style={{
          textAlign: "center", margin: "0 0 22px",
          fontSize: 11, color: COLORS.textMuted, lineHeight: 1.5,
        }}>
          No credit card. Spots assigned automatically — first come, first served.
        </p>

        {/* ─── Platform availability ─── */}
        <div style={{ marginBottom: 20 }}>
          {/* Google Play button — official badge */}
          <a
            href="https://play.google.com/store/apps/details?id=online.linkap.app"
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "none", display: "block", marginBottom: 8 }}
          >
            <div style={{
              background: "#000", borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.25)",
              padding: "9px 16px",
              display: "flex", alignItems: "center", gap: 12,
              cursor: "pointer",
            }}>
              <img src="/google-play-logo.png" alt="Google Play" style={{ width: 32, height: 32, objectFit: "contain" }} />
              <div>
                <div style={{ color: "rgba(255,255,255,0.72)", fontSize: 10, fontWeight: 400, letterSpacing: 0.4, lineHeight: 1.3 }}>GET IT ON</div>
                <div style={{ color: "#fff", fontSize: 18, fontWeight: 700, letterSpacing: -0.3, lineHeight: 1.2 }}>Google Play</div>
              </div>
            </div>
          </a>

          {/* Web app */}
          <div
            onClick={onContinue}
            style={{ textDecoration: "none", display: "block", cursor: "pointer" }}
          >
            <div style={{
              background: "rgba(245,166,35,0.07)",
              border: "1px solid rgba(245,166,35,0.25)",
              borderRadius: 12, padding: "11px 18px",
              display: "flex", alignItems: "center", gap: 14,
              cursor: "pointer",
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={COLORS.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              <div>
                <div style={{ color: COLORS.textMuted, fontSize: 10, fontWeight: 500, lineHeight: 1 }}>ALSO AVAILABLE AS A</div>
                <div style={{ color: COLORS.accent, fontSize: 16, fontWeight: 700, lineHeight: 1.3 }}>Web App — link-ap.online</div>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary sign-in */}
        <p style={{ textAlign: "center", margin: 0, fontSize: 13, color: COLORS.textMuted }}>
          Already a member?{" "}
          <span
            onClick={onContinue}
            style={{ color: COLORS.accent, cursor: "pointer", fontWeight: 600 }}
          >
            Sign in
          </span>
        </p>

      </div>
    </div>
  );
}
