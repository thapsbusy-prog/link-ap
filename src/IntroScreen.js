import logoImg from "./link-ap-logo.png";
import { COLORS } from "./shared";

const AI_FEATURES = [
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke={COLORS.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    title: "AI Pulse",
    desc: "Daily AI trends explained for builders — shareable in one tap",
  },
  {
    icon: <svg viewBox="0 0 24 24" fill={COLORS.accent} width="16" height="16"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
    title: "Profile Score",
    desc: "AI scores your profile /100 and tells you exactly how to improve",
  },
  {
    icon: <svg viewBox="0 0 24 24" fill={COLORS.accent} width="16" height="16"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>,
    title: "Note Assistant",
    desc: "AI drafts a specific, personal connection note in one tap",
  },
  {
    icon: <svg viewBox="0 0 24 24" fill={COLORS.accent} width="16" height="16"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>,
    title: "Chat Starters",
    desc: "3 profile-specific openers appear the moment you connect with someone",
  },
];

export function IntroScreen({ onContinue }) {
  return (
    <div style={{
      minHeight: "100vh", background: COLORS.bg,
      display: "flex", flexDirection: "column",
      alignItems: "center", overflowY: "auto",
    }}>
      <div style={{ width: "100%", maxWidth: 430, padding: "0 20px 40px", boxSizing: "border-box" }}>

        <div style={{ height: 48 }} />

        {/* Logo block */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <img
            src={logoImg}
            alt="Link-Ap"
            style={{ width: 90, height: 90, objectFit: "contain", marginBottom: 8 }}
          />
          <div style={{ fontSize: 28, fontWeight: 800, color: COLORS.text, marginBottom: 4 }}>
            Link<span style={{ color: COLORS.accent }}>-Ap</span>
          </div>
        </div>

        {/* Badge pill */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <span style={{
            background: "rgba(245,166,35,0.15)",
            border: "1px solid rgba(245,166,35,0.3)",
            color: COLORS.accent,
            fontSize: 12, fontWeight: 600,
            padding: "5px 14px", borderRadius: 99,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke={COLORS.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="11" height="11"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            AI-Powered Professional Networking
          </span>
        </div>

        {/* Headline */}
        <h1 style={{
          color: COLORS.text, fontSize: 20, fontWeight: 500,
          textAlign: "center", margin: "0 0 12px", lineHeight: 1.4,
        }}>
          Meet the right people — with AI working for you
        </h1>

        {/* Subline */}
        <p style={{
          color: COLORS.textMuted, fontSize: 12, textAlign: "center",
          margin: "0 0 24px", lineHeight: 1.7,
        }}>
          Link-Ap matches you with founders, investors, mentors, and
          collaborators based on what you're actually building. AI helps
          you show up sharp, connect meaningfully, and stay ahead of what's
          happening in tech.
        </p>

        {/* AI Features section */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
            <div style={{ flex: 1, height: 1, background: COLORS.border }} />
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: COLORS.textMuted }}>
              What's inside
            </span>
            <div style={{ flex: 1, height: 1, background: COLORS.border }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {AI_FEATURES.map(f => (
              <div key={f.title} style={{
                background: COLORS.card, border: `1px solid ${COLORS.border}`,
                borderRadius: 12, padding: "12px 14px",
                display: "flex", gap: 12, alignItems: "flex-start",
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: "rgba(245,166,35,0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {f.icon}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, marginBottom: 2 }}>{f.title}</div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, lineHeight: 1.5 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Founding member callout */}
        <div style={{
          background: "rgba(245,166,35,0.1)",
          border: "1px solid rgba(245,166,35,0.25)",
          borderRadius: 14, padding: "14px 16px", marginBottom: 24,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill={COLORS.accent} style={{ flexShrink: 0 }}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <span style={{ color: COLORS.accent, fontSize: 13, fontWeight: 700 }}>Founding member opportunity</span>
          </div>
          <p style={{ color: COLORS.textMuted, fontSize: 12, margin: 0, lineHeight: 1.6 }}>
            We're just getting started. Join now and shape the network from day
            one — early members get the most visibility.
          </p>
        </div>

        {/* Who it's for grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
          {[
            { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill={COLORS.accent}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>, title: "Founders", desc: "Find co-founders, clients & backers" },
            { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill={COLORS.accent}><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/></svg>, title: "Investors", desc: "Discover early-stage opportunities" },
            { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill={COLORS.accent}><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>, title: "Mentors", desc: "Guide ambitious builders" },
            { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill={COLORS.accent}><path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-2 .89-2 2v11c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zM10 4h4v2h-4V4zm10 15H4V8h16v11z"/></svg>, title: "Job seekers", desc: "Connect with the people who hire" },
          ].map(card => (
            <div key={card.title} style={{
              background: COLORS.card,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 12, padding: "12px 14px",
            }}>
              <div style={{ marginBottom: 4 }}>{card.icon}</div>
              <div style={{ color: COLORS.text, fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{card.title}</div>
              <div style={{ color: COLORS.textMuted, fontSize: 11, lineHeight: 1.5 }}>{card.desc}</div>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ color: COLORS.text, fontSize: 13, fontWeight: 700, marginBottom: 14 }}>
            How it works
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { text: "Tell us what you're building and who you need to meet", icon: <svg width="12" height="12" viewBox="0 0 24 24" fill={COLORS.accent}><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg> },
              { text: "AI explains exactly why each match makes sense for you right now", icon: <svg width="12" height="12" viewBox="0 0 24 24" fill={COLORS.accent}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0-12c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></svg> },
              { text: "AI drafts your connection note — personalised, not copy-pasted", icon: <svg width="12" height="12" viewBox="0 0 24 24" fill={COLORS.accent}><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg> },
              { text: "Chat starters break the ice — every new connection starts strong", icon: <svg width="12" height="12" viewBox="0 0 24 24" fill={COLORS.accent}><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg> },
            ].map((step, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                  background: "rgba(245,166,35,0.15)",
                  border: "1px solid rgba(245,166,35,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {step.icon}
                </div>
                <p style={{ color: COLORS.textMuted, fontSize: 12, margin: 0, lineHeight: 1.6 }}>{step.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Primary CTA */}
        <button
          onClick={onContinue}
          style={{
            width: "100%", padding: "14px",
            borderRadius: 14, border: "none",
            background: COLORS.accent, color: "#fff",
            fontSize: 15, fontWeight: 700,
            cursor: "pointer", marginBottom: 14,
          }}
        >
          Join the network — it's free
        </button>

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
