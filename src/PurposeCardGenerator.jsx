import { useState, useRef, useEffect, useCallback } from "react";

const BG       = "#0A0A0F";
const BORDER   = "#2A2A3A";
const ACCENT   = "#F5A623";
const TEXT     = "#F0EEE8";
const MUTED    = "#8A8A9A";
const FONT_SYS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";

// ─── 20 curated purpose cards across 9 personas ──────────────────────────────

const CARDS = {
  Founder: [
    {
      text: "Investors on Link-Ap see your entire vision before you say a word — your problem, your drive, your why.",
      attribution: "For Founders",
    },
    {
      text: "Your Link-Ap profile tells investors exactly what problem you're solving and why you're the right person to solve it.",
      attribution: "For Founders",
    },
    {
      text: "The best investors don't fund ideas — they fund founders. Link-Ap lets them know you before the pitch.",
      attribution: "For Founders",
    },
  ],
  "Co-Founder": [
    {
      text: "Finding a co-founder who truly gets your vision is nearly impossible. Link-Ap changes that by showing intent first.",
      attribution: "For Founders",
    },
    {
      text: "Your next co-founder is already on Link-Ap. They're looking for someone building exactly what you're building.",
      attribution: "For Founders",
    },
  ],
  Investor: [
    {
      text: "Link-Ap lets you read a founder's story, skills, and ambition in depth — before a single call is booked.",
      attribution: "For Investors",
    },
    {
      text: "The best deals come from knowing the founder first. Link-Ap gives you that insight before the first meeting.",
      attribution: "For Investors",
    },
  ],
  Freelancer: [
    {
      text: "Your Link-Ap profile works while you sleep — telling the right clients exactly what you do and why you do it best.",
      attribution: "For Freelancers",
    },
    {
      text: "Stop chasing clients who don't understand your value. Link-Ap attracts the ones who already do.",
      attribution: "For Freelancers",
    },
    {
      text: "Freelancers on Link-Ap don't pitch themselves — their profile does, clearly, to the exact people looking for them.",
      attribution: "For Freelancers",
    },
  ],
  "Job Seeker": [
    {
      text: "Recruiters on Link-Ap don't see a CV — they read your actual strengths, story, and what you're capable of building.",
      attribution: "For Job Seekers",
    },
    {
      text: "Your next opportunity doesn't come from applying — it comes from being seen. Link-Ap makes sure the right people see you.",
      attribution: "For Job Seekers",
    },
  ],
  Recruiter: [
    {
      text: "Before any interview, Link-Ap gives you a real picture of the candidate — their mindset, skills, and what drives them.",
      attribution: "For Recruiters",
    },
    {
      text: "Stop guessing from CVs. Link-Ap shows you how candidates think, what they value, and whether they're the right fit.",
      attribution: "For Recruiters",
    },
  ],
  Mentor: [
    {
      text: "The right mentor changes everything. Link-Ap connects you with people who've been exactly where you're trying to go.",
      attribution: "For Mentees",
    },
    {
      text: "Great mentors don't find talent by accident. Link-Ap surfaces the right people worth investing your time in.",
      attribution: "For Mentors",
    },
  ],
  Builder: [
    {
      text: "The best collaborations start with shared intent. Link-Ap shows you who's already building toward the same thing as you.",
      attribution: "For Builders",
    },
    {
      text: "Building something that needs more hands? Link-Ap finds the exact skills you're missing and the people who want to build.",
      attribution: "For Builders",
    },
  ],
  "Career Pivot": [
    {
      text: "Switching careers means people judge your past over your potential. Link-Ap lets you be seen for where you're going.",
      attribution: "For Career Pivoters",
    },
    {
      text: "Link-Ap doesn't care where you've been — it shows the world where you're headed and who you're becoming.",
      attribution: "For Career Pivoters",
    },
  ],
};

const PERSONAS = Object.keys(CARDS);

// ─── Canvas helpers (shared with QuoteGenerator) ──────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

export default function PurposeCardGenerator() {
  const canvasRef = useRef(null);
  const logoRef   = useRef(null);

  const [persona,    setPersona]    = useState("Founder");
  const [cardIndex,  setCardIndex]  = useState(0);
  const [ready,      setReady]      = useState(false);

  const cards   = CARDS[persona];
  const { text, attribution } = cards[cardIndex];
  const total   = cards.length;

  // Reset index when persona changes
  useEffect(() => setCardIndex(0), [persona]);

  // Load Playfair + real logo
  useEffect(() => {
    if (!document.getElementById("la-fonts")) {
      const link = document.createElement("link");
      link.id   = "la-fonts";
      link.rel  = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital@0;1&display=swap";
      document.head.appendChild(link);
    }
    const img = new Image();
    img.onload = () => {
      logoRef.current = img;
      document.fonts.ready.then(() => setReady(true));
    };
    img.onerror = () => document.fonts.ready.then(() => setReady(true));
    img.src = "/link-ap-logo.png";
  }, []);

  const drawCard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = 1080, H = 1080;
    canvas.width = W;
    canvas.height = H;

    // ── Background ──────────────────────────────────────────────────────────
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);

    const glow = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, 520);
    glow.addColorStop(0, "rgba(245,166,35,0.10)");
    glow.addColorStop(1, "rgba(245,166,35,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, 520);

    // ── Amber top bar ────────────────────────────────────────────────────────
    ctx.fillStyle = ACCENT;
    ctx.fillRect(0, 0, W, 4);

    // ── Header: logo + wordmark + persona pill ───────────────────────────────
    const LOGO_SIZE = 84;
    const LOGO_X    = 56;
    const LOGO_Y    = 40;

    if (logoRef.current) {
      ctx.fillStyle = "#000";
      ctx.fillRect(LOGO_X, LOGO_Y, LOGO_SIZE, LOGO_SIZE);
      ctx.drawImage(logoRef.current, LOGO_X, LOGO_Y, LOGO_SIZE, LOGO_SIZE);
    }

    ctx.textBaseline = "middle";
    ctx.textAlign    = "left";
    ctx.font         = `bold 58px ${FONT_SYS}`;
    const linkW = ctx.measureText("Link-").width;
    const wordX = LOGO_X + LOGO_SIZE + 18;
    const wordY = LOGO_Y + LOGO_SIZE / 2;
    ctx.fillStyle = TEXT;
    ctx.fillText("Link-", wordX, wordY);
    ctx.fillStyle = ACCENT;
    ctx.fillText("Ap", wordX + linkW, wordY);

    // Persona pill
    const pillLabel = persona.toUpperCase();
    ctx.font    = `600 20px ${FONT_SYS}`;
    const pillW = ctx.measureText(pillLabel).width + 48;
    const pillH = 40;
    const pillX = W - pillW - 56;
    const pillY = LOGO_Y + (LOGO_SIZE - pillH) / 2;
    rrect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
    ctx.fillStyle   = "rgba(245,166,35,0.12)";
    ctx.fill();
    ctx.strokeStyle = "rgba(245,166,35,0.45)";
    ctx.lineWidth   = 1.5;
    ctx.stroke();
    ctx.fillStyle    = ACCENT;
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(pillLabel, pillX + pillW / 2, pillY + pillH / 2);

    // ── Purpose text (no ghost mark, no curly quotes) ────────────────────────
    const tLen  = text.length;
    const tSize = tLen < 70 ? 60 : tLen < 110 ? 52 : tLen < 150 ? 45 : 39;
    ctx.font     = `italic ${tSize}px 'Playfair Display', Georgia, serif`;
    ctx.fillStyle = TEXT;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const quoteZoneTop = 175;
    const quoteZoneBot = H - 220;
    const lines  = wrapText(ctx, text, W - 200);
    const lineH  = tSize * 1.42;
    const blockH = lines.length * lineH;
    const midY   = quoteZoneTop + (quoteZoneBot - quoteZoneTop) / 2;
    const startY = midY - blockH / 2 + lineH / 2;
    lines.forEach((ln, i) => ctx.fillText(ln, W / 2, startY + i * lineH));

    // ── Attribution ──────────────────────────────────────────────────────────
    const attrY = startY + blockH - lineH / 2 + 70;
    ctx.font      = `500 30px ${FONT_SYS}`;
    ctx.fillStyle = ACCENT;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`— ${attribution}`, W / 2, attrY);

    // ── Footer divider ───────────────────────────────────────────────────────
    const divY = H - 168;
    ctx.strokeStyle = ACCENT;
    ctx.globalAlpha = 0.20;
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(72, divY);
    ctx.lineTo(W - 72, divY);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Footer left
    ctx.font         = `400 26px ${FONT_SYS}`;
    ctx.fillStyle    = MUTED;
    ctx.textAlign    = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("Connect with purpose", 72, divY + 54);

    // Footer right: Google Play icon badge + URL
    const footerY = divY + 54;
    const iconSz  = 28;
    const gpGap   = 10;
    ctx.font = `700 26px ${FONT_SYS}`;
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
    const triH  = iconSz * 0.34;
    const triW  = iconSz * 0.32;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.moveTo(triCx - triW * 0.38, triCy - triH);
    ctx.lineTo(triCx + triW,        triCy);
    ctx.lineTo(triCx - triW * 0.38, triCy + triH);
    ctx.closePath();
    ctx.fill();

    ctx.font         = `700 26px ${FONT_SYS}`;
    ctx.fillStyle    = ACCENT;
    ctx.textAlign    = "right";
    ctx.textBaseline = "middle";
    ctx.fillText("link-ap.online", W - 72, footerY);

    // ── Amber bottom bar ─────────────────────────────────────────────────────
    ctx.fillStyle = ACCENT;
    ctx.fillRect(0, H - 4, W, 4);
  }, [text, attribution, persona]);

  useEffect(() => { drawCard(); }, [drawCard]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { drawCard(); }, [ready]);

  const prev = () => setCardIndex(i => (i - 1 + total) % total);
  const next = () => setCardIndex(i => (i + 1) % total);

  const download = () => {
    drawCard();
    setTimeout(() => {
      const a    = document.createElement("a");
      a.download = `Link-Ap-${persona.replace(" ", "-")}-${cardIndex + 1}.png`;
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
      {/* Page title */}
      <div style={{ marginBottom: "1.5rem", textAlign: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: ACCENT, letterSpacing: "0.1em", marginBottom: 6 }}>
          CONTENT STUDIO
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: TEXT }}>
          Purpose Card Generator
        </div>
        <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>
          20 cards · 9 personas · ready to post
        </div>
      </div>

      {/* Canvas */}
      <div style={{ position: "relative", width: "100%", maxWidth: 520, marginBottom: "1.25rem" }}>
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

      {/* Persona tabs — horizontal scroll */}
      <div style={{
        width: "100%", maxWidth: 520,
        overflowX: "auto", display: "flex", gap: 8,
        paddingBottom: 4, marginBottom: "1rem",
        scrollbarWidth: "none",
      }}>
        {PERSONAS.map(p => {
          const active = persona === p;
          return (
            <button
              key={p}
              onClick={() => setPersona(p)}
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
              {p}
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
        Exports at 1080 × 1080 px — ready for LinkedIn, Instagram, or Twitter/X.
      </p>
    </div>
  );
}
