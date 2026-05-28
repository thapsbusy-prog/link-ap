import { useState, useRef, useEffect, useCallback } from "react";

// Exact values from COLORS in shared.js
const BG       = "#0A0A0F";
const CARD     = "#13131A";
const BORDER   = "#2A2A3A";
const ACCENT   = "#F5A623";
const TEXT     = "#F0EEE8";
const MUTED    = "#8A8A9A";
const FONT_SYS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";

const CATEGORIES = [
  { label: "Inspire",  desc: "motivational and empowering" },
  { label: "Entice",   desc: "compelling and persuasive"   },
  { label: "Creative", desc: "witty and thought-provoking" },
];

const SEEDS = {
  Inspire:  { quote: "Your network is your net worth — but only when every connection has a reason.",         attribution: "Link-Ap"             },
  Entice:   { quote: "Stop collecting contacts. Start building relationships that open doors you didn't know existed.", attribution: "Link-Ap" },
  Creative: { quote: "LinkedIn shows you who people are. Link-Ap shows you why they want to connect.",       attribution: "Link-Ap"             },
};

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

// ─── Component ───────────────────────────────────────────────────────────────

export default function QuoteGenerator() {
  const canvasRef  = useRef(null);
  const logoRef    = useRef(null);

  const [quote,       setQuote]       = useState(SEEDS.Inspire.quote);
  const [attribution, setAttribution] = useState(SEEDS.Inspire.attribution);
  const [category,    setCategory]    = useState("Inspire");
  const [loading,     setLoading]     = useState(false);
  const [ready,       setReady]       = useState(false); // fonts + logo loaded

  // Load Playfair Display (quote text) and wait for fonts + logo in parallel
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
    img.onerror = () => {
      // proceed without logo — wordmark still renders
      document.fonts.ready.then(() => setReady(true));
    };
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

    // Subtle amber radial glow from top-centre
    const glow = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, 520);
    glow.addColorStop(0, "rgba(245,166,35,0.10)");
    glow.addColorStop(1, "rgba(245,166,35,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, 520);

    // ── Amber top bar ────────────────────────────────────────────────────────
    ctx.fillStyle = ACCENT;
    ctx.fillRect(0, 0, W, 4);

    // ── Header: logo + wordmark + category pill ──────────────────────────────
    const LOGO_SIZE = 84;
    const LOGO_X    = 56;
    const LOGO_Y    = 40;

    // Draw real logo PNG (black bg blends with card bg; white icon visible)
    if (logoRef.current) {
      // Ensure pixel-perfect black patch so the logo's square bg is seamless
      ctx.fillStyle = "#000";
      ctx.fillRect(LOGO_X, LOGO_Y, LOGO_SIZE, LOGO_SIZE);
      ctx.drawImage(logoRef.current, LOGO_X, LOGO_Y, LOGO_SIZE, LOGO_SIZE);
    }

    // Wordmark "Link-" (white) + "Ap" (amber) — matching app's drawInvitePoster
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

    // Category pill — dark bg, amber border + text (right-aligned in header)
    const cat    = category.toUpperCase();
    ctx.font     = `600 20px ${FONT_SYS}`;
    const pillW  = ctx.measureText(cat).width + 48;
    const pillH  = 40;
    const pillX  = W - pillW - 56;
    const pillY  = LOGO_Y + (LOGO_SIZE - pillH) / 2;
    rrect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
    ctx.fillStyle   = "rgba(245,166,35,0.12)";
    ctx.fill();
    ctx.strokeStyle = "rgba(245,166,35,0.45)";
    ctx.lineWidth   = 1.5;
    ctx.stroke();
    ctx.fillStyle   = ACCENT;
    ctx.textAlign   = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(cat, pillX + pillW / 2, pillY + pillH / 2);

    // ── Ghost opening quotation mark ─────────────────────────────────────────
    ctx.font         = `italic 320px 'Playfair Display', Georgia, serif`;
    ctx.fillStyle    = ACCENT;
    ctx.globalAlpha  = 0.055;
    ctx.textAlign    = "left";
    ctx.textBaseline = "top";
    ctx.fillText("“", 38, 150);
    ctx.globalAlpha  = 1;

    // ── Quote text ───────────────────────────────────────────────────────────
    const qLen   = quote.length;
    const qSize  = qLen < 60 ? 62 : qLen < 100 ? 54 : qLen < 150 ? 46 : 40;
    ctx.font     = `italic ${qSize}px 'Playfair Display', Georgia, serif`;
    ctx.fillStyle = TEXT;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const quoteZoneTop = 190;
    const quoteZoneBot = H - 220;
    const lines  = wrapText(ctx, `“${quote}”`, W - 200);
    const lineH  = qSize * 1.40;
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

    // Footer left: "Connect with purpose"
    ctx.font         = `400 26px ${FONT_SYS}`;
    ctx.fillStyle    = MUTED;
    ctx.textAlign    = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("Connect with purpose", 72, divY + 54);

    // Footer right: "link-ap.online" in amber
    ctx.font      = `700 26px ${FONT_SYS}`;
    ctx.fillStyle = ACCENT;
    ctx.textAlign = "right";
    ctx.fillText("link-ap.online", W - 72, divY + 54);

    // ── Amber bottom bar ─────────────────────────────────────────────────────
    ctx.fillStyle = ACCENT;
    ctx.fillRect(0, H - 4, W, 4);
  }, [quote, attribution, category, ready]);

  useEffect(() => { drawCard(); }, [drawCard]);

  // ── Generate via serverless endpoint ───────────────────────────────────────
  const generate = async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/quote-generate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ category }),
      });
      const data = await res.json();
      if (data.quote) {
        setQuote(data.quote);
        setAttribution(data.attribution || "Link-Ap");
      }
    } catch (e) {
      console.error("quote-generate failed:", e);
    }
    setLoading(false);
  };

  const download = () => {
    drawCard();
    setTimeout(() => {
      const a    = document.createElement("a");
      a.download = `Link-Ap-${category}-${Date.now()}.png`;
      a.href     = canvasRef.current.toDataURL("image/png");
      a.click();
    }, 80);
  };

  // ── UI ────────────────────────────────────────────────────────────────────
  return (
    <div style={{
      fontFamily: FONT_SYS,
      background: BG,
      minHeight:  "100vh",
      display:    "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem 1rem",
    }}>
      {/* Page title */}
      <div style={{ marginBottom: "1.5rem", textAlign: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: ACCENT, letterSpacing: "0.1em", marginBottom: 6 }}>
          CONTENT STUDIO
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: TEXT }}>
          Quote Card Generator
        </div>
      </div>

      {/* Card container */}
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
        {loading && (
          <div style={{
            position:       "absolute",
            inset:          0,
            borderRadius:   14,
            background:     "rgba(10,10,15,0.72)",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            backdropFilter: "blur(2px)",
          }}>
            <div style={{ color: ACCENT, fontSize: 14, fontWeight: 600, letterSpacing: "0.06em" }}>
              Generating…
            </div>
          </div>
        )}
      </div>

      {/* Category selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: "1.25rem" }}>
        {CATEGORIES.map(({ label }) => {
          const active = category === label;
          return (
            <button
              key={label}
              onClick={() => {
                setCategory(label);
                const s = SEEDS[label];
                setQuote(s.quote);
                setAttribution(s.attribution);
              }}
              style={{
                padding:     "8px 20px",
                borderRadius: 20,
                cursor:      "pointer",
                fontFamily:  FONT_SYS,
                fontSize:    13,
                fontWeight:  600,
                transition:  "all 0.15s",
                border:      `1px solid ${active ? ACCENT : BORDER}`,
                background:  active ? ACCENT : "transparent",
                color:       active ? "#000" : MUTED,
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 10, marginBottom: "1rem" }}>
        <button
          onClick={generate}
          disabled={loading}
          style={{
            padding:     "11px 28px",
            borderRadius: 10,
            cursor:      loading ? "not-allowed" : "pointer",
            fontFamily:  FONT_SYS,
            fontSize:    14,
            fontWeight:  600,
            transition:  "all 0.15s",
            border:      `1px solid ${ACCENT}`,
            background:  "transparent",
            color:       ACCENT,
            opacity:     loading ? 0.45 : 1,
          }}
        >
          {loading ? "Generating…" : "↺  New Quote"}
        </button>
        <button
          onClick={download}
          style={{
            padding:     "11px 28px",
            borderRadius: 10,
            cursor:      "pointer",
            fontFamily:  FONT_SYS,
            fontSize:    14,
            fontWeight:  700,
            border:      "none",
            background:  ACCENT,
            color:       "#000",
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
