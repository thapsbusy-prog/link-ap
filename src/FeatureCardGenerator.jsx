import { useState, useRef, useEffect, useCallback } from "react";

const BG       = "#0A0A0F";
const BORDER   = "#2A2A3A";
const ACCENT   = "#F5A623";
const TEXT     = "#F0EEE8";
const MUTED    = "#8A8A9A";
const DIM      = "#C0BEB8";
const FONT_SYS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";

// Canvas dimensions — 4:5 portrait (Instagram portrait / LinkedIn portrait)
const W = 1080;
const H = 1350;

// ─── Feature card data ────────────────────────────────────────────────────────
// Add new features here as they ship. Each entry in a feature array is one card
// (one persona variation). Structure: { pill, what, whatDesc, forWhom, forDesc, example }

const FEATURE_CARDS = {
  "Profile PDF": [
    {
      pill: "PROFILE PDF",
      what: "Share Your Profile as a PDF",
      whatDesc: "Export your full Link-Ap profile as a clean, branded PDF — everything someone needs to know about you, in one shareable document.",
      forWhom: "Founders Pitching Investors",
      forDesc: "Your pitch is always ready. No slides, no scrambling — just send your profile the night before and walk in already known.",
      example: "Walking into an investor meeting tomorrow? Send your Link-Ap PDF tonight. They already know your vision, your problem, and why you're the right founder — before you say a word.",
    },
    {
      pill: "PROFILE PDF",
      what: "Share Your Profile as a PDF",
      whatDesc: "Export your full Link-Ap profile as a clean, branded PDF — your skills, offering, and story in one document that works for you.",
      forWhom: "Freelancers & Consultants",
      forDesc: "Your full value proposition, ready to send to any prospect — before they even ask for a proposal.",
      example: "A potential client asks what you do. Instead of a long email, you forward your Link-Ap PDF. They get your skills, your story, and your offer in under 30 seconds.",
    },
    {
      pill: "PROFILE PDF",
      what: "Share Your Profile as a PDF",
      whatDesc: "Export your full Link-Ap profile as a clean, branded PDF — a living document that goes far beyond a standard CV.",
      forWhom: "Job Seekers",
      forDesc: "A document that shows your skills, intent, and personality — not just titles and dates that every other CV has.",
      example: "You spot the perfect role on the go. Send your Link-Ap PDF as a first impression before the formal application lands — and stand out from the very first touch.",
    },
  ],
  "AI Pulse": [
    {
      pill: "AI PULSE",
      what: "Daily AI Trend Cards",
      whatDesc: "Every morning, Link-Ap surfaces fresh AI-curated trend cards built for builders, founders, and operators in your ecosystem.",
      forWhom: "Founders & Builders",
      forDesc: "Stay ahead of what's moving in your space — without drowning in feeds that were never built for people who are actually building.",
      example: "You open Link-Ap on a Monday and find a trend card on the rise of micro-SaaS in emerging markets — exactly the direction your product is already heading. Now you have context, language, and confidence.",
    },
    {
      pill: "AI PULSE",
      what: "Daily AI Trend Cards",
      whatDesc: "Every morning, Link-Ap surfaces fresh AI-curated trend cards built for builders, founders, and operators in your ecosystem.",
      forWhom: "Investors & Scouts",
      forDesc: "Spot the sectors and signals that are moving early — before everyone is talking about them at the next pitch event.",
      example: "A Pulse card surfaces an emerging fintech pattern in Cape Town. You reach out to three founders already building in that direction on Link-Ap — before anyone else has made the connection.",
    },
  ],
};

const FEATURES = Object.keys(FEATURE_CARDS);

// ─── Canvas helpers ───────────────────────────────────────────────────────────

function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? line + " " + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// Draws an amber accent bar + uppercase section label
function drawSectionLabel(ctx, x, y, label) {
  ctx.fillStyle = ACCENT;
  ctx.fillRect(x, y, 3, 34);
  ctx.font         = `700 17px ${FONT_SYS}`;
  ctx.fillStyle    = ACCENT;
  ctx.textAlign    = "left";
  ctx.textBaseline = "middle";
  ctx.letterSpacing = "0.08em";
  ctx.fillText(label, x + 16, y + 17);
}

// Draws multi-line body text and returns the y position after last line
function drawBody(ctx, text, x, startY, maxWidth, fontSize, lineHeightMult, color, italic) {
  ctx.font         = `${italic ? "italic " : ""}${fontSize}px ${italic ? "'Playfair Display', Georgia, serif" : FONT_SYS}`;
  ctx.fillStyle    = color;
  ctx.textAlign    = "left";
  ctx.textBaseline = "top";
  const lines  = wrapText(ctx, text, maxWidth);
  const lineH  = fontSize * lineHeightMult;
  lines.forEach((ln, i) => ctx.fillText(ln, x, startY + i * lineH));
  return startY + lines.length * lineH;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FeatureCardGenerator() {
  const canvasRef = useRef(null);
  const logoRef   = useRef(null);

  const [feature,   setFeature]   = useState("Profile PDF");
  const [cardIndex, setCardIndex] = useState(0);
  const [ready,     setReady]     = useState(false);

  const cards = FEATURE_CARDS[feature];
  const card  = cards[cardIndex];
  const total = cards.length;

  useEffect(() => setCardIndex(0), [feature]);

  useEffect(() => {
    if (!document.getElementById("la-fonts")) {
      const link = document.createElement("link");
      link.id   = "la-fonts";
      link.rel  = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital@0;1&display=swap";
      document.head.appendChild(link);
    }
    const img = new Image();
    img.onload  = () => { logoRef.current = img; document.fonts.ready.then(() => setReady(true)); };
    img.onerror = () => document.fonts.ready.then(() => setReady(true));
    img.src = "/link-ap-logo.png";
  }, []);

  const drawCard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width  = W;
    canvas.height = H;

    // ── Background ──────────────────────────────────────────────────────────
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);

    const glow = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, 480);
    glow.addColorStop(0, "rgba(245,166,35,0.09)");
    glow.addColorStop(1, "rgba(245,166,35,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, 480);

    // ── Amber top bar ────────────────────────────────────────────────────────
    ctx.fillStyle = ACCENT;
    ctx.fillRect(0, 0, W, 4);

    // ── Header: logo + wordmark + pill ───────────────────────────────────────
    const LOGO_SZ = 76;
    const LOGO_X  = 56;
    const LOGO_Y  = 38;

    if (logoRef.current) {
      ctx.fillStyle = "#000";
      ctx.fillRect(LOGO_X, LOGO_Y, LOGO_SZ, LOGO_SZ);
      ctx.drawImage(logoRef.current, LOGO_X, LOGO_Y, LOGO_SZ, LOGO_SZ);
    }

    ctx.textBaseline = "middle";
    ctx.textAlign    = "left";
    ctx.font         = `bold 52px ${FONT_SYS}`;
    const linkW = ctx.measureText("Link-").width;
    const wordX = LOGO_X + LOGO_SZ + 16;
    const wordY = LOGO_Y + LOGO_SZ / 2;
    ctx.fillStyle = TEXT;
    ctx.fillText("Link-", wordX, wordY);
    ctx.fillStyle = ACCENT;
    ctx.fillText("Ap", wordX + linkW, wordY);

    // Pill
    ctx.font    = `600 18px ${FONT_SYS}`;
    const pillW = ctx.measureText(card.pill).width + 44;
    const pillH = 36;
    const pillX = W - pillW - 56;
    const pillY = LOGO_Y + (LOGO_SZ - pillH) / 2;
    rrect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
    ctx.fillStyle   = "rgba(245,166,35,0.12)";
    ctx.fill();
    ctx.strokeStyle = "rgba(245,166,35,0.45)";
    ctx.lineWidth   = 1.5;
    ctx.stroke();
    ctx.fillStyle    = ACCENT;
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(card.pill, pillX + pillW / 2, pillY + pillH / 2);

    // ── Header divider ───────────────────────────────────────────────────────
    const HDR_BOT = 155;
    ctx.strokeStyle = BORDER;
    ctx.globalAlpha = 0.6;
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(56, HDR_BOT);
    ctx.lineTo(W - 56, HDR_BOT);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // ── Layout constants ─────────────────────────────────────────────────────
    const CONTENT_X = 72;          // left margin for all text
    const CONTENT_W = W - 144;     // text wrap width
    const BODY_SIZE = 27;          // body font size
    const BODY_LH   = 1.55;        // line-height multiplier
    const TITLE_SIZE = 40;         // section title font size

    // Section 1 — WHAT'S NEW ─────────────────────────────────────────────────
    const S1_Y = HDR_BOT + 28;
    drawSectionLabel(ctx, CONTENT_X, S1_Y, "WHAT'S NEW");

    // Feature title
    ctx.font         = `700 ${TITLE_SIZE}px ${FONT_SYS}`;
    ctx.fillStyle    = TEXT;
    ctx.textAlign    = "left";
    ctx.textBaseline = "top";
    const whatLines  = wrapText(ctx, card.what, CONTENT_W);
    const whatLH     = TITLE_SIZE * 1.25;
    whatLines.forEach((ln, i) => ctx.fillText(ln, CONTENT_X, S1_Y + 52 + i * whatLH));
    const afterWhat  = S1_Y + 52 + whatLines.length * whatLH + 18;

    // Feature description
    drawBody(ctx, card.whatDesc, CONTENT_X, afterWhat, CONTENT_W, BODY_SIZE, BODY_LH, DIM, false);

    // Section divider ─────────────────────────────────────────────────────────
    const DIV1_Y = 460;
    ctx.strokeStyle = ACCENT;
    ctx.globalAlpha = 0.15;
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(56, DIV1_Y);
    ctx.lineTo(W - 56, DIV1_Y);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Section 2 — FOR WHOM ───────────────────────────────────────────────────
    const S2_Y = DIV1_Y + 28;
    drawSectionLabel(ctx, CONTENT_X, S2_Y, "FOR");

    // Persona title
    ctx.font         = `700 ${TITLE_SIZE}px ${FONT_SYS}`;
    ctx.fillStyle    = ACCENT;
    ctx.textAlign    = "left";
    ctx.textBaseline = "top";
    ctx.fillText(card.forWhom, CONTENT_X, S2_Y + 52);
    const afterForTitle = S2_Y + 52 + TITLE_SIZE * 1.25 + 18;

    // Benefit text
    drawBody(ctx, card.forDesc, CONTENT_X, afterForTitle, CONTENT_W, BODY_SIZE, BODY_LH, DIM, false);

    // Section divider ─────────────────────────────────────────────────────────
    const DIV2_Y = 755;
    ctx.strokeStyle = ACCENT;
    ctx.globalAlpha = 0.15;
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(56, DIV2_Y);
    ctx.lineTo(W - 56, DIV2_Y);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Section 3 — IN PRACTICE ────────────────────────────────────────────────
    const S3_Y = DIV2_Y + 28;
    drawSectionLabel(ctx, CONTENT_X, S3_Y, "IN PRACTICE");

    // Example text — italic for narrative feel
    drawBody(ctx, card.example, CONTENT_X, S3_Y + 58, CONTENT_W, BODY_SIZE, BODY_LH, TEXT, true);

    // ── Footer ───────────────────────────────────────────────────────────────
    const DIV_F = H - 188;
    ctx.strokeStyle = ACCENT;
    ctx.globalAlpha = 0.20;
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(72, DIV_F);
    ctx.lineTo(W - 72, DIV_F);
    ctx.stroke();
    ctx.globalAlpha = 1;

    const footerY = DIV_F + 56;

    // Footer left
    ctx.font         = `400 24px ${FONT_SYS}`;
    ctx.fillStyle    = MUTED;
    ctx.textAlign    = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("Connect with purpose", 72, footerY);

    // Footer right: GP icon + URL
    const iconSz = 26;
    const gpGap  = 9;
    ctx.font = `700 24px ${FONT_SYS}`;
    const urlW  = ctx.measureText("link-ap.online").width;
    const iconX = (W - 72) - urlW - gpGap - iconSz;
    const iconY = footerY - iconSz / 2;

    rrect(ctx, iconX, iconY, iconSz, iconSz, iconSz * 0.25);
    ctx.fillStyle   = "#000";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth   = 1;
    ctx.stroke();

    const triCx = iconX + iconSz * 0.54;
    const triCy = iconY + iconSz * 0.50;
    const triH  = iconSz * 0.33;
    const triW  = iconSz * 0.30;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.moveTo(triCx - triW * 0.38, triCy - triH);
    ctx.lineTo(triCx + triW,        triCy);
    ctx.lineTo(triCx - triW * 0.38, triCy + triH);
    ctx.closePath();
    ctx.fill();

    ctx.font         = `700 24px ${FONT_SYS}`;
    ctx.fillStyle    = ACCENT;
    ctx.textAlign    = "right";
    ctx.textBaseline = "middle";
    ctx.fillText("link-ap.online", W - 72, footerY);

    // ── Amber bottom bar ─────────────────────────────────────────────────────
    ctx.fillStyle = ACCENT;
    ctx.fillRect(0, H - 4, W, 4);
  }, [card]);

  useEffect(() => { drawCard(); }, [drawCard]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { drawCard(); }, [ready]);

  const prev = () => setCardIndex(i => (i - 1 + total) % total);
  const next = () => setCardIndex(i => (i + 1) % total);

  const download = () => {
    drawCard();
    setTimeout(() => {
      const a    = document.createElement("a");
      a.download = `Link-Ap-Feature-${feature.replace(" ", "-")}-${cardIndex + 1}.png`;
      a.href     = canvasRef.current.toDataURL("image/png");
      a.click();
    }, 80);
  };

  // ── UI ────────────────────────────────────────────────────────────────────
  return (
    <div style={{
      fontFamily:     FONT_SYS,
      background:     BG,
      minHeight:      "100vh",
      display:        "flex",
      flexDirection:  "column",
      alignItems:     "center",
      justifyContent: "center",
      padding:        "2rem 1rem",
    }}>
      {/* Title */}
      <div style={{ marginBottom: "1.5rem", textAlign: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: ACCENT, letterSpacing: "0.1em", marginBottom: 6 }}>
          CONTENT STUDIO
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: TEXT }}>
          Feature Card Generator
        </div>
        <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>
          {Object.values(FEATURE_CARDS).reduce((n, a) => n + a.length, 0)} cards · {FEATURES.length} features · 1080 × 1350 portrait
        </div>
      </div>

      {/* Canvas preview */}
      <div style={{ position: "relative", width: "100%", maxWidth: 400, marginBottom: "1.25rem" }}>
        <canvas
          ref={canvasRef}
          style={{
            display:      "block",
            width:        "100%",
            height:       "auto",
            borderRadius: 14,
            border:       `1px solid ${BORDER}`,
            boxShadow:    "0 8px 40px rgba(0,0,0,0.5)",
          }}
        />
      </div>

      {/* Feature tabs */}
      <div style={{
        width: "100%", maxWidth: 400,
        overflowX: "auto", display: "flex", gap: 8,
        paddingBottom: 4, marginBottom: "1rem",
        scrollbarWidth: "none",
      }}>
        {FEATURES.map(f => {
          const active = feature === f;
          return (
            <button
              key={f}
              onClick={() => setFeature(f)}
              style={{
                flexShrink:   0,
                padding:      "7px 18px",
                borderRadius: 20,
                cursor:       "pointer",
                fontFamily:   FONT_SYS,
                fontSize:     13,
                fontWeight:   600,
                whiteSpace:   "nowrap",
                transition:   "all 0.15s",
                border:       `1px solid ${active ? ACCENT : BORDER}`,
                background:   active ? ACCENT : "transparent",
                color:        active ? "#000" : MUTED,
              }}
            >
              {f}
            </button>
          );
        })}
      </div>

      {/* Navigation + download */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1rem" }}>
        <button
          onClick={prev}
          disabled={total <= 1}
          style={{
            width: 40, height: 40, borderRadius: 10,
            border: `1px solid ${BORDER}`, background: "transparent",
            color: TEXT, cursor: total <= 1 ? "not-allowed" : "pointer",
            fontFamily: FONT_SYS, fontSize: 18, opacity: total <= 1 ? 0.3 : 1,
          }}
        >‹</button>

        <div style={{ fontSize: 13, color: MUTED, minWidth: 48, textAlign: "center" }}>
          {cardIndex + 1} / {total}
        </div>

        <button
          onClick={next}
          disabled={total <= 1}
          style={{
            width: 40, height: 40, borderRadius: 10,
            border: `1px solid ${BORDER}`, background: "transparent",
            color: TEXT, cursor: total <= 1 ? "not-allowed" : "pointer",
            fontFamily: FONT_SYS, fontSize: 18, opacity: total <= 1 ? 0.3 : 1,
          }}
        >›</button>

        <button
          onClick={download}
          style={{
            padding:      "11px 28px",
            borderRadius: 10,
            cursor:       "pointer",
            fontFamily:   FONT_SYS,
            fontSize:     14,
            fontWeight:   700,
            border:       "none",
            background:   ACCENT,
            color:        "#000",
            marginLeft:   8,
          }}
        >
          ↓  Download PNG
        </button>
      </div>

      <p style={{ fontSize: 12, color: MUTED, textAlign: "center", margin: 0 }}>
        Portrait format — optimised for Instagram, LinkedIn, and Stories.
      </p>
    </div>
  );
}
