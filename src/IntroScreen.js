import logoImg from "./link-ap-logo.png";
import { COLORS } from "./shared";

const NETWORKING_FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke={COLORS.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
    title: "Why Connect — AI",
    desc: "AI explains exactly why each match matters for what you're building right now",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke={COLORS.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    title: "AI Pulse",
    desc: "Daily AI & startup trends explained for builders — shareable in one tap",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill={COLORS.accent} width="16" height="16">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    ),
    title: "Profile Score",
    desc: "AI scores your profile /100 across 5 dimensions and tells you exactly how to improve",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill={COLORS.accent} width="16" height="16">
        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
      </svg>
    ),
    title: "Note Assistant",
    desc: "AI drafts a personal, specific connection note — never copy-pasted",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill={COLORS.accent} width="16" height="16">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
      </svg>
    ),
    title: "Chat Starters",
    desc: "3 profile-specific openers appear the moment you match — break the ice instantly",
  },
];

const TOOL_FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill={COLORS.accent} width="15" height="15">
        <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
      </svg>
    ),
    title: "AI Invoice Generator",
    desc: "Professional invoices with AI-written payment terms — PDF download in seconds",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill={COLORS.accent} width="15" height="15">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z"/>
      </svg>
    ),
    title: "Pitch Deck Outline",
    desc: "10-slide investor-ready deck outline with speaker notes — generated in one click",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill={COLORS.accent} width="15" height="15">
        <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-2 .89-2 2v11c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zM10 4h4v2h-4V4zm10 15H4V8h16v11z"/>
      </svg>
    ),
    title: "AI Proposal Generator",
    desc: "Winning client proposals tailored to every project — close more deals",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill={COLORS.accent} width="15" height="15">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/>
      </svg>
    ),
    title: "Day Rate Calculator",
    desc: "Price yourself right — never undercharge again with profit-margin built in",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill={COLORS.accent} width="15" height="15">
        <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
      </svg>
    ),
    title: "AI Content Calendar",
    desc: "2–4 week social strategy with 3 posts/week per platform — built for your brand",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill={COLORS.accent} width="15" height="15">
        <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
      </svg>
    ),
    title: "Break-Even Calculator",
    desc: "Instant clarity on your numbers — know your floor before you price anything",
  },
];

const FOUNDING_PERKS = [
  "Founding Member badge (#1–100) on your profile",
  "Free lifetime access to all 6 AI business tools",
  "50 AI-powered actions per month — no credit card",
  "Shape the product from day one",
  "First-mover advantage in the network",
];

export function IntroScreen({ onContinue }) {
  return (
    <div style={{
      minHeight: "100vh", background: COLORS.bg,
      display: "flex", flexDirection: "column",
      alignItems: "center", overflowY: "auto",
    }}>
      <div style={{ width: "100%", maxWidth: 430, padding: "0 20px 48px", boxSizing: "border-box" }}>

        <div style={{ height: 48 }} />

        {/* Logo block */}
        <div style={{ textAlign: "center", marginBottom: 16 }}>
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
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
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
          color: COLORS.text, fontSize: 22, fontWeight: 800,
          textAlign: "center", margin: "0 0 10px", lineHeight: 1.35,
        }}>
          The network that works<br />
          <span style={{ color: COLORS.accent }}>as hard as you do</span>
        </h1>

        {/* Subline */}
        <p style={{
          color: COLORS.textMuted, fontSize: 13, textAlign: "center",
          margin: "0 0 24px", lineHeight: 1.75,
        }}>
          Link-Ap matches founders, freelancers, investors, and collaborators
          using AI — then hands you the tools to win the room once you're in it.
        </p>

        {/* ─── Founding Member FOMO block ─── */}
        <div style={{
          background: "linear-gradient(135deg, rgba(245,166,35,0.14) 0%, rgba(245,166,35,0.06) 100%)",
          border: "1.5px solid rgba(245,166,35,0.4)",
          borderRadius: 16, padding: "18px 18px 16px", marginBottom: 28,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill={COLORS.accent} style={{ flexShrink: 0 }}>
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <span style={{ color: COLORS.accent, fontSize: 14, fontWeight: 800 }}>
              First 100 members only — Founding Access
            </span>
          </div>
          <p style={{ color: COLORS.text, fontSize: 12, margin: "0 0 14px", lineHeight: 1.65 }}>
            Spots are filling automatically as people sign up. Once 100 are
            gone, new members join on the free plan. Lock yours in now.
          </p>
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

        {/* ─── AI Networking Features ─── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
            <div style={{ flex: 1, height: 1, background: COLORS.border }} />
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: COLORS.textMuted }}>
              AI Networking
            </span>
            <div style={{ flex: 1, height: 1, background: COLORS.border }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {NETWORKING_FEATURES.map(f => (
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

        {/* ─── Business Tools ─── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
            <div style={{ flex: 1, height: 1, background: COLORS.border }} />
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: COLORS.textMuted }}>
              Founder & Freelancer Tools
            </span>
            <div style={{ flex: 1, height: 1, background: COLORS.border }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {TOOL_FEATURES.map(f => (
              <div key={f.title} style={{
                background: COLORS.card, border: `1px solid ${COLORS.border}`,
                borderRadius: 12, padding: "12px 12px",
                display: "flex", flexDirection: "column", gap: 6,
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                  background: "rgba(245,166,35,0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {f.icon}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.text, lineHeight: 1.3 }}>{f.title}</div>
                <div style={{ fontSize: 11, color: COLORS.textMuted, lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            ))}
          </div>
          <div style={{
            marginTop: 10, padding: "9px 12px",
            background: "rgba(245,166,35,0.07)",
            border: "1px solid rgba(245,166,35,0.2)",
            borderRadius: 10, textAlign: "center",
          }}>
            <span style={{ fontSize: 11, color: COLORS.accent, fontWeight: 600 }}>
              All tools free for Founding Members — Pro plan required after
            </span>
          </div>
        </div>

        {/* Who it's for */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 28 }}>
          {[
            { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill={COLORS.accent}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>, title: "Founders", desc: "Find co-founders, clients & backers" },
            { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill={COLORS.accent}><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/></svg>, title: "Investors", desc: "Discover early-stage opportunities" },
            { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill={COLORS.accent}><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>, title: "Mentors", desc: "Guide ambitious builders" },
            { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill={COLORS.accent}><path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-2 .89-2 2v11c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zM10 4h4v2h-4V4zm10 15H4V8h16v11z"/></svg>, title: "Freelancers", desc: "Tools + connections to grow your client list" },
          ].map(card => (
            <div key={card.title} style={{
              background: COLORS.card,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 12, padding: "12px 14px",
            }}>
              <div style={{ marginBottom: 6 }}>{card.icon}</div>
              <div style={{ color: COLORS.text, fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{card.title}</div>
              <div style={{ color: COLORS.textMuted, fontSize: 11, lineHeight: 1.5 }}>{card.desc}</div>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ color: COLORS.text, fontSize: 13, fontWeight: 700, marginBottom: 14 }}>
            How it works
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { num: "1", text: "Tell us what you're building and who you need to meet" },
              { num: "2", text: "AI explains why each match is worth your time — right now" },
              { num: "3", text: "AI drafts your connection note — personal, not generic" },
              { num: "4", text: "Chat starters break the ice the moment you both connect" },
              { num: "5", text: "Use the built-in tools to invoice, pitch, and grow — without leaving the app" },
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
            cursor: "pointer", marginBottom: 12,
            letterSpacing: 0.2,
          }}
        >
          Claim your Founding Member spot — it's free
        </button>

        <p style={{
          textAlign: "center", margin: "0 0 10px",
          fontSize: 11, color: COLORS.textMuted, lineHeight: 1.5,
        }}>
          No credit card. Spots assigned automatically — first come, first served.
        </p>

        {/* ─── Platform availability ─── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
            <div style={{ flex: 1, height: 1, background: COLORS.border }} />
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: COLORS.textMuted }}>
              Available on
            </span>
            <div style={{ flex: 1, height: 1, background: COLORS.border }} />
          </div>

          {/* Google Play button */}
          <a
            href="https://play.google.com/store/apps/details?id=online.linkap.app"
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "none", display: "block", marginBottom: 10 }}
          >
            <div style={{
              background: "#000", borderRadius: 12,
              border: "1px solid #2A2A2A",
              padding: "10px 18px",
              display: "flex", alignItems: "center", gap: 14,
              cursor: "pointer",
            }}>
              {/* Google Play logo */}
              <svg width="28" height="28" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                <path d="M48 432L240 256 48 80v352z" fill="#EA4335"/>
                <path d="M48 80l272 176-70 70L48 80z" fill="#FBBC04"/>
                <path d="M48 432l202-176 70 70L48 432z" fill="#34A853"/>
                <path d="M320 256L48 80l192 176-192 176 272-176z" fill="#4285F4"/>
              </svg>
              <div>
                <div style={{ color: "#9A9A9A", fontSize: 10, fontWeight: 500, lineHeight: 1 }}>GET IT ON</div>
                <div style={{ color: "#fff", fontSize: 17, fontWeight: 700, lineHeight: 1.3 }}>Google Play</div>
              </div>
            </div>
          </a>

          {/* Apple App Store — coming soon */}
          <div style={{
            background: COLORS.card,
            borderRadius: 12,
            border: `1px solid ${COLORS.border}`,
            padding: "10px 18px",
            display: "flex", alignItems: "center", gap: 14,
            opacity: 0.55,
            marginBottom: 14,
          }}>
            {/* Apple logo */}
            <svg width="28" height="28" viewBox="0 0 814 1000" xmlns="http://www.w3.org/2000/svg" fill={COLORS.textMuted}>
              <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.6 0 695.7 0 605.4 0 434.9 116.4 345.7 230.8 345.7c63 0 115.3 41.6 154.8 41.6 37.8 0 97.2-44.2 168.3-44.2zm-41.2-168C767 110 790 58.4 790 28.4c0-3.2-.3-6.4-.9-9.2-57.1 2.2-125.3 38.2-166.1 85.8-35.2 40.8-63.7 95-63.7 149.5 0 3.5.6 7 .9 8.3 3.5.6 9.2 1.3 14.8 1.3 51.6 0 117.3-34.2 152.8-82.2z"/>
            </svg>
            <div>
              <div style={{ color: COLORS.textMuted, fontSize: 10, fontWeight: 500, lineHeight: 1 }}>COMING SOON TO THE</div>
              <div style={{ color: COLORS.text, fontSize: 17, fontWeight: 700, lineHeight: 1.3 }}>App Store</div>
            </div>
          </div>

          {/* Web app */}
          <a
            href="https://link-ap.online"
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "none", display: "block" }}
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
          </a>
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
