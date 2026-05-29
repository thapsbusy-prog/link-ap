import { useState, useRef, useEffect, useCallback } from "react";

const BG       = "#0A0A0F";
const BORDER   = "#2A2A3A";
const ACCENT   = "#F5A623";
const TEXT     = "#F0EEE8";
const MUTED    = "#8A8A9A";
const DIM      = "#C0BEB8";
const FONT_SYS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";

const W = 1080;
const H = 1350;

// ─── Intro card data ──────────────────────────────────────────────────────────
// Fields: { pill, what (problem headline), whatDesc (elaboration),
//           forWhom (audience title), forDesc, example (benefits) }

const INTRO_CARDS = [
  {
    pill: "WHAT IS LINK-AP",
    what: "Professional networking is broken.",
    whatDesc: "Most platforms reward presence over purpose — showing you who people have been, not who they need to meet or what they're actually trying to build together.",
    forWhom: "Builders, Founders, Freelancers & Job Seekers",
    forDesc: "Anyone who wants meaningful professional connections — not a feed of strangers collecting contacts they'll never act on.",
    example: "Link-Ap matches you with people based on shared goals and real intent. Every connection has a reason. AI surfaces the right people, your profile tells your full story, and every introduction is worth making.",
  },
  {
    pill: "FOR FOUNDERS",
    what: "Most founders build in the wrong rooms.",
    whatDesc: "Pitching investors who aren't interested. Searching for co-founders who don't share the vision. Solving alone what others have already figured out. The problem isn't the idea — it's who you can't reach.",
    forWhom: "Early-Stage Founders & Builders",
    forDesc: "Founders who need to find the right investors, co-founders, and collaborators — without wasting months in the wrong conversations.",
    example: "Link-Ap puts your full story in front of the right people before any meeting. Your vision, your skills, your why — visible to exactly the investors and builders who are looking for what you're building.",
  },
  {
    pill: "FOR FREELANCERS",
    what: "Freelancers spend more time chasing than building.",
    whatDesc: "Explaining yourself from scratch on every platform. Competing on price instead of value. Winning the wrong clients and losing the time you can never get back.",
    forWhom: "Freelancers & Independent Consultants",
    forDesc: "Professionals who want to attract the right clients consistently — based on real skills and clear value, not whoever finds them first.",
    example: "Link-Ap builds a complete picture of your offering and expertise so the right clients find you already convinced. Your profile works while you sleep — and everyone who reaches out already understands what you do.",
  },
  {
    pill: "FOR JOB SEEKERS",
    what: "CVs were never built to show who you are.",
    whatDesc: "Job seekers are reduced to titles and dates. Recruiters make decisions in seconds on documents that can't show potential, mindset, or where someone is actually headed.",
    forWhom: "Job Seekers & Career Pivoters",
    forDesc: "Professionals who want to be seen for their real skills, growth direction, and potential — not just their employment history.",
    example: "Link-Ap gives recruiters a full picture of you before the first conversation. Your strengths, your story, your intent — readable in minutes. Show up to every opportunity already known.",
  },
  {
    pill: "FOR INVESTORS",
    what: "Most great founders never reach the right investors.",
    whatDesc: "Cold pitches get ignored. Warm intros are gatekept. The result: investors waste time on the wrong meetings and miss the founders who are actually building something worth backing.",
    forWhom: "Investors, Angels & Scouts",
    forDesc: "Those who want to find the right founders early — based on substance, not surface-level pitch decks or who someone knows.",
    example: "Link-Ap gives you deep context on every founder before any conversation. Read their story, their skills, and their vision at a glance — so your time goes to the conversations that are already worth having.",
  },
  {
    pill: "BUILT FOR AFRICA",
    what: "Africa's biggest problems are its greatest opportunities.",
    whatDesc: "The solutions this continent needs won't come from outside. They'll come from the builders, founders, and thinkers already living the problems — who just need to find each other.",
    forWhom: "African Builders, Dreamers & Problem-Solvers",
    forDesc: "Those who see a broken system, a missing service, or an unmet need — and feel the pull to do something about it rather than wait for someone else to.",
    example: "Link-Ap connects the people asking the same questions, building in the same direction, and driven by the same urgency. Because the right co-founder, investor, or collaborator could be the only thing standing between an idea and a movement.",
  },
];

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

function drawSectionLabel(ctx, x, y, label) {
  ctx.fillStyle = ACCENT;
  ctx.fillRect(x, y, 3, 34);
  ctx.font         = `700 17px ${FONT_SYS}`;
  ctx.fillStyle    = ACCENT;
  ctx.textAlign    = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + 16, y + 17);
}

function drawBody(ctx, text, x, startY, maxWidth, fontSize, lineHeightMult, color, italic) {
  ctx.font         = `${italic ? "italic " : ""}${fontSize}px ${italic ? "'Playfair Display', Georgia, serif" : FONT_SYS}`;
  ctx.fillStyle    = color;
  ctx.textAlign    = "left";
  ctx.textBaseline = "top";
  const lines = wrapText(ctx, text, maxWidth);
  const lineH = fontSize * lineHeightMult;
  lines.forEach((ln, i) => ctx.fillText(ln, x, startY + i * lineH));
  return startY + lines.length * lineH;
}

// Draws the Google Play icon play triangle at given center
function drawPlayTriangle(ctx, cx, cy, size, color) {
  const h = size * 0.38, w = size * 0.34;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.38, cy - h);
  ctx.lineTo(cx + w,        cy);
  ctx.lineTo(cx - w * 0.38, cy + h);
  ctx.closePath();
  ctx.fill();
}

// Draws a simple globe outline (web icon)
function drawGlobeIcon(ctx, cx, cy, r, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth   = 1.5;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(cx, cy, r * 0.5, r, 0, 0, Math.PI * 2); ctx.stroke();
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function IntroCardGenerator() {
  const canvasRef = useRef(null);
  const logoRef   = useRef(null);

  const [cardIndex, setCardIndex] = useState(0);
  const [ready,     setReady]     = useState(false);

  const card  = INTRO_CARDS[cardIndex];
  const total = INTRO_CARDS.length;

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

    const glow = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, 500);
    glow.addColorStop(0, "rgba(245,166,35,0.09)");
    glow.addColorStop(1, "rgba(245,166,35,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, 500);

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

    ctx.font    = `600 17px ${FONT_SYS}`;
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

    // Header divider
    ctx.strokeStyle = BORDER;
    ctx.globalAlpha = 0.6;
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(56, 155);
    ctx.lineTo(W - 56, 155);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // ── Layout constants ─────────────────────────────────────────────────────
    const CX    = 72;
    const CW    = W - 144;
    const BSIZ  = 27;
    const BLH   = 1.55;
    const TSIZ  = 40;

    // ── Section 1 — THE PROBLEM ──────────────────────────────────────────────
    const S1_Y = 183;
    drawSectionLabel(ctx, CX, S1_Y, "THE PROBLEM");

    ctx.font         = `700 ${TSIZ}px ${FONT_SYS}`;
    ctx.fillStyle    = TEXT;
    ctx.textAlign    = "left";
    ctx.textBaseline = "top";
    const probLines = wrapText(ctx, card.what, CW);
    const probLH    = TSIZ * 1.25;
    probLines.forEach((ln, i) => ctx.fillText(ln, CX, S1_Y + 52 + i * probLH));
    const afterProb = S1_Y + 52 + probLines.length * probLH + 16;
    drawBody(ctx, card.whatDesc, CX, afterProb, CW, BSIZ, BLH, DIM, false);

    // Section divider
    ctx.strokeStyle = ACCENT;
    ctx.globalAlpha = 0.15;
    ctx.lineWidth   = 1;
    ctx.beginPath(); ctx.moveTo(56, 462); ctx.lineTo(W - 56, 462); ctx.stroke();
    ctx.globalAlpha = 1;

    // ── Section 2 — WHO IT'S FOR ─────────────────────────────────────────────
    const S2_Y = 490;
    drawSectionLabel(ctx, CX, S2_Y, "WHO IT'S FOR");

    ctx.font         = `700 ${TSIZ}px ${FONT_SYS}`;
    ctx.fillStyle    = ACCENT;
    ctx.textAlign    = "left";
    ctx.textBaseline = "top";
    const whoLines = wrapText(ctx, card.forWhom, CW);
    const whoLH    = TSIZ * 1.25;
    whoLines.forEach((ln, i) => ctx.fillText(ln, CX, S2_Y + 52 + i * whoLH));
    const afterWho = S2_Y + 52 + whoLines.length * whoLH + 16;
    drawBody(ctx, card.forDesc, CX, afterWho, CW, BSIZ, BLH, DIM, false);

    // Section divider
    ctx.strokeStyle = ACCENT;
    ctx.globalAlpha = 0.15;
    ctx.lineWidth   = 1;
    ctx.beginPath(); ctx.moveTo(56, 758); ctx.lineTo(W - 56, 758); ctx.stroke();
    ctx.globalAlpha = 1;

    // ── Section 3 — THE BENEFITS ─────────────────────────────────────────────
    const S3_Y = 786;
    drawSectionLabel(ctx, CX, S3_Y, "THE BENEFITS");
    drawBody(ctx, card.example, CX, S3_Y + 58, CW, BSIZ, BLH, TEXT, true);

    // ── CTA Footer ───────────────────────────────────────────────────────────
    const FDIV = H - 296;
    ctx.strokeStyle = ACCENT;
    ctx.globalAlpha = 0.20;
    ctx.lineWidth   = 1;
    ctx.beginPath(); ctx.moveTo(72, FDIV); ctx.lineTo(W - 72, FDIV); ctx.stroke();
    ctx.globalAlpha = 1;

    // "Join Link-Ap today"
    ctx.font         = `700 30px ${FONT_SYS}`;
    ctx.fillStyle    = TEXT;
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Join Link-Ap today", W / 2, FDIV + 46);

    // Platform badges
    const BW = 400, BH = 62, BGAP = 16;
    const BTOTAL = BW * 2 + BGAP;
    const BX = (W - BTOTAL) / 2;
    const BY = FDIV + 80;

    // — Google Play badge —
    rrect(ctx, BX, BY, BW, BH, 14);
    ctx.fillStyle   = "#000";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth   = 1;
    ctx.stroke();

    // GP play triangle (no inner square — white triangle on black badge)
    drawPlayTriangle(ctx, BX + 36, BY + BH / 2, 42, "#fff");

    // Badge text
    ctx.textAlign    = "left";
    ctx.textBaseline = "top";
    ctx.font         = `400 14px ${FONT_SYS}`;
    ctx.fillStyle    = "rgba(255,255,255,0.6)";
    ctx.fillText("Get it on", BX + 60, BY + 14);
    ctx.font      = `700 22px ${FONT_SYS}`;
    ctx.fillStyle = "#fff";
    ctx.fillText("Google Play", BX + 60, BY + 31);

    // — Web badge —
    const WBX = BX + BW + BGAP;
    rrect(ctx, WBX, BY, BW, BH, 14);
    ctx.fillStyle   = "rgba(245,166,35,0.08)";
    ctx.fill();
    ctx.strokeStyle = "rgba(245,166,35,0.5)";
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    // Globe icon
    drawGlobeIcon(ctx, WBX + 36, BY + BH / 2, 13, ACCENT);

    // Badge text
    ctx.textAlign    = "left";
    ctx.textBaseline = "top";
    ctx.font         = `400 14px ${FONT_SYS}`;
    ctx.fillStyle    = "rgba(245,166,35,0.6)";
    ctx.fillText("Available at", WBX + 60, BY + 14);
    ctx.font      = `700 22px ${FONT_SYS}`;
    ctx.fillStyle = ACCENT;
    ctx.fillText("link-ap.online", WBX + 60, BY + 31);

    // Tagline
    ctx.font         = `400 20px ${FONT_SYS}`;
    ctx.fillStyle    = MUTED;
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Connect with purpose", W / 2, BY + BH + 36);

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
      a.download = `Link-Ap-Intro-${cardIndex + 1}.png`;
      a.href     = canvasRef.current.toDataURL("image/png");
      a.click();
    }, 80);
  };

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
          Intro Card Generator
        </div>
        <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>
          {total} cards · 6 audiences · 1080 × 1350 portrait
        </div>
      </div>

      {/* Canvas */}
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

      {/* Navigation */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1rem" }}>
        <button
          onClick={prev}
          style={{
            width: 40, height: 40, borderRadius: 10,
            border: `1px solid ${BORDER}`, background: "transparent",
            color: TEXT, cursor: "pointer", fontFamily: FONT_SYS, fontSize: 18,
          }}
        >‹</button>

        <div style={{ fontSize: 13, color: MUTED, minWidth: 48, textAlign: "center" }}>
          {cardIndex + 1} / {total}
        </div>

        <button
          onClick={next}
          style={{
            width: 40, height: 40, borderRadius: 10,
            border: `1px solid ${BORDER}`, background: "transparent",
            color: TEXT, cursor: "pointer", fontFamily: FONT_SYS, fontSize: 18,
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

      {/* Card label */}
      <p style={{ fontSize: 12, color: MUTED, textAlign: "center", margin: 0 }}>
        {card.pill} — Portrait · Instagram, LinkedIn &amp; Stories
      </p>
    </div>
  );
}
