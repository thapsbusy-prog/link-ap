import logoImg from "./link-ap-logo.png";
import { COLORS } from "./shared";

const ORANGE = "#F97316";

export function IntroScreen({ onContinue }) {
  return (
    <div style={{
      minHeight: "100vh", background: COLORS.bg,
      display: "flex", flexDirection: "column",
      alignItems: "center", overflowY: "auto",
    }}>
      <div style={{ width: "100%", maxWidth: 430, padding: "0 20px 40px", boxSizing: "border-box" }}>

        {/* Status bar padding */}
        <div style={{ height: 48 }} />

        {/* Logo block */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 20 }}>
          <img
            src={logoImg}
            alt="Link-Ap"
            style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "contain", marginBottom: 8 }}
          />
          <div style={{ fontSize: 13, letterSpacing: 3, textTransform: "uppercase", fontWeight: 700 }}>
            <span style={{ color: COLORS.text }}>Link</span>
            <span style={{ color: ORANGE }}>-Ap</span>
          </div>
        </div>

        {/* Badge pill */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <span style={{
            background: "rgba(249,115,22,0.15)",
            border: "1px solid rgba(249,115,22,0.3)",
            color: ORANGE,
            fontSize: 12, fontWeight: 600,
            padding: "5px 14px", borderRadius: 99,
          }}>
            Professional Networking
          </span>
        </div>

        {/* Headline */}
        <h1 style={{
          color: COLORS.text, fontSize: 20, fontWeight: 500,
          textAlign: "center", margin: "0 0 12px", lineHeight: 1.4,
        }}>
          Meet the right people for where you're going
        </h1>

        {/* Subline */}
        <p style={{
          color: COLORS.textMuted, fontSize: 12, textAlign: "center",
          margin: "0 0 24px", lineHeight: 1.7,
        }}>
          Link-AP matches you with founders, investors, mentors, and
          collaborators based on what you're actually building and who
          you're looking for.
        </p>

        {/* Founding member callout */}
        <div style={{
          background: "rgba(249,115,22,0.1)",
          border: "1px solid rgba(249,115,22,0.25)",
          borderRadius: 14, padding: "14px 16px", marginBottom: 24,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 16 }}>★</span>
            <span style={{ color: ORANGE, fontSize: 13, fontWeight: 700 }}>Founding member opportunity</span>
          </div>
          <p style={{ color: COLORS.textMuted, fontSize: 12, margin: 0, lineHeight: 1.6 }}>
            We're just getting started. Join now and shape the network from day
            one — early members get the most visibility.
          </p>
        </div>

        {/* 2×2 who-it's-for grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
          {[
            { icon: "🚀", title: "Founders", desc: "Find co-founders, clients & backers" },
            { icon: "💼", title: "Investors", desc: "Discover early-stage opportunities" },
            { icon: "🎓", title: "Mentors", desc: "Guide ambitious builders" },
            { icon: "🔍", title: "Job seekers", desc: "Connect with the people who hire" },
          ].map(card => (
            <div key={card.title} style={{
              background: COLORS.card,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 12, padding: "12px 14px",
            }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{card.icon}</div>
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
              "Tell us what you're building and who you need to meet",
              "We match you by intent — no random scrolling, just relevant people",
              "Connect with a personal note — every request means something",
            ].map((step, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                  background: "rgba(249,115,22,0.15)",
                  border: "1px solid rgba(249,115,22,0.3)",
                  color: ORANGE, fontSize: 12, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {i + 1}
                </div>
                <p style={{ color: COLORS.textMuted, fontSize: 12, margin: 0, lineHeight: 1.6 }}>{step}</p>
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
            background: ORANGE, color: "#fff",
            fontSize: 15, fontWeight: 700,
            cursor: "pointer", marginBottom: 14,
          }}
        >
          Join the network — it's free
        </button>

        {/* Secondary sign-in text */}
        <p style={{ textAlign: "center", margin: 0, fontSize: 13, color: COLORS.textMuted }}>
          Already a member?{" "}
          <span
            onClick={onContinue}
            style={{ color: ORANGE, cursor: "pointer", fontWeight: 600 }}
          >
            Sign in
          </span>
        </p>

      </div>
    </div>
  );
}
