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
      pill: "BUSINESS IDEAS",
      what: "Business Ideas — Empowerment Feed",
      whatDesc: "Every 5 days, Link-Ap surfaces 5 fresh, viable business ideas for South Africa — each one a practical mini playbook with startup costs, first steps, and where to find clients.",
      forWhom: "Job Seekers & The Unemployed",
      forDesc: "You don't need a degree or savings to get started. Every idea is realistic, low-capital, and comes with concrete steps you can take this week.",
      example: "You open the Business Ideas tab and find a mobile car wash concept with a startup cost under R500. The playbook tells you exactly where to find your first customers — office parks near you — and how to grow from one client to a small team.",
    },
    {
      pill: "BUSINESS IDEAS",
      what: "Business Ideas — Empowerment Feed",
      whatDesc: "Every 5 days, Link-Ap surfaces 5 fresh, viable business ideas for South Africa — each one a practical mini playbook with startup costs, first steps, and where to find clients.",
      forWhom: "Aspiring Founders",
      forDesc: "Not sure what to build yet? Each idea comes with a clear path from your first client to a real, scalable business — including where to get formal support from SEDA, NYDA, or the IDC.",
      example: "A Skills & Education idea catches your eye — running weekend coding workshops for matric students. The playbook shows how to find your first 10 students through WhatsApp groups and schools, then how to formalise and scale into a registered training provider.",
    },
    {
      pill: "BUSINESS IDEAS",
      what: "Business Ideas — Empowerment Feed",
      whatDesc: "Every 5 days, Link-Ap surfaces 5 fresh, viable business ideas for South Africa — each one a practical mini playbook with startup costs, first steps, and where to find clients.",
      forWhom: "Side-Hustlers",
      forDesc: "Already working but want extra income? Each idea is built to start small around your existing schedule, with realistic ZAR costs and no marketing budget required.",
      example: "You're employed but want extra income on weekends. A Food & Trade idea shows how to start a small meal-prep service from your kitchen for under R2,000 — with scripts for getting your first orders from coworkers and your local community WhatsApp group.",
    },
    {
      pill: "BUSINESS IDEAS",
      what: "Business Ideas — Empowerment Feed",
      whatDesc: "Every 5 days, Link-Ap surfaces 5 fresh, viable business ideas for South Africa — each one a practical mini playbook with startup costs, first steps, and where to find clients.",
      forWhom: "Recently Retrenched Workers",
      forDesc: "Losing a job doesn't mean losing your income — it means redirecting your existing skills. Every idea shows you how to turn what you already know into your own business, with a realistic budget for your situation.",
      example: "After 12 years in retail, you were retrenched last month. The feed surfaces a Services idea — home organising and decluttering — built on the customer-facing skills you already have, with a startup cost under R1,000 and a script for landing your first three clients in your old suburb.",
    },
    {
      pill: "BUSINESS IDEAS",
      what: "Business Ideas — Empowerment Feed",
      whatDesc: "Every 5 days, Link-Ap surfaces 5 fresh, viable business ideas for South Africa — each one a practical mini playbook with startup costs, first steps, and where to find clients.",
      forWhom: "Stay-at-Home Parents & Caregivers",
      forDesc: "Your time is limited and your income matters. Every idea is designed to fit around school runs and household routines — low-capital, home-based, and built to grow at your own pace.",
      example: "Between drop-offs and pick-ups, you've got a few free hours a day. A Food & Trade idea shows how to run a small home bakery for the school community — starting with under R800 in ingredients and a plan to get your first orders through the parents' WhatsApp group.",
    },
    {
      pill: "BUSINESS IDEAS",
      what: "Business Ideas — Empowerment Feed",
      whatDesc: "Every 5 days, Link-Ap surfaces 5 fresh, viable business ideas for South Africa — each one a practical mini playbook with startup costs, first steps, and where to find clients.",
      forWhom: "Matriculants Without Funding for Tertiary Study",
      forDesc: "No bursary or NSFAS spot doesn't mean a gap year has to be empty. Every idea gives you a real first step — something to build, earn from, and put on a CV while you reapply.",
      example: "Your NSFAS application didn't come through this year. The feed surfaces a Digital idea — managing social media pages for local businesses — with under R200 in startup costs and a clear pitch script for approaching shop owners in your area this week.",
    },
    {
      pill: "BUSINESS IDEAS",
      what: "Business Ideas — Empowerment Feed",
      whatDesc: "Every 5 days, Link-Ap surfaces 5 fresh, viable business ideas for South Africa — each one a practical mini playbook with startup costs, first steps, and where to find clients.",
      forWhom: "Township & Informal Traders",
      forDesc: "Already selling, but want to grow beyond one stall or one street corner? Every idea includes a 'how to scale' step — practical ways to formalise, add products, or reach more customers without big capital.",
      example: "You run a small spaza stall. A Food & Trade idea shows an add-on product line with high demand and low spoilage, plus a 'how to scale' step on registering with your local municipality so you can supply nearby tuck shops too.",
    },
    {
      pill: "BUSINESS IDEAS",
      what: "Business Ideas — Empowerment Feed",
      whatDesc: "Every 5 days, Link-Ap surfaces 5 fresh, viable business ideas for South Africa — each one a practical mini playbook with startup costs, first steps, and where to find clients.",
      forWhom: "Rural Entrepreneurs",
      forDesc: "Limited access to a big-city market doesn't mean limited opportunity. Every idea includes 'where the market is' guidance tailored to smaller towns — local demand, transport-light products, and community-based ways to find your first customers.",
      example: "You live in a small town outside Polokwane. A Green/Agri idea shows how to start a seedling nursery using space you already have, with a startup cost under R1,500 and a plan to sell to neighbours, local schools, and nearby farms.",
    },
    {
      pill: "BUSINESS IDEAS",
      what: "Business Ideas — Empowerment Feed",
      whatDesc: "Every 5 days, Link-Ap surfaces 5 fresh, viable business ideas for South Africa — each one a practical mini playbook with startup costs, first steps, and where to find clients.",
      forWhom: "Graduates Still Job Hunting",
      forDesc: "Months of applications with no offers is exhausting — and it doesn't have to be the only path forward. Every idea shows how to put your degree to work for yourself while you keep applying, turning idle time into income and experience.",
      example: "You graduated with a marketing degree eight months ago and haven't landed a job yet. The feed surfaces a Skills & Education idea — running a paid CV and LinkedIn profile clinic for fellow job seekers — with zero startup cost and a plan to find your first clients through your own university alumni group.",
    },
  ],

  "Why Connect": [
    {
      pill: "WHY CONNECT",
      what: "AI Match Explanation",
      whatDesc: "Before you send a connection request, Link-Ap tells you exactly why you and this person are worth connecting — based on your real goals and skills, not just job titles.",
      forWhom: "Founders & Builders",
      forDesc: "Stop guessing whether a connection is worth your time. See the specific overlap between your goals and theirs before you even reach out.",
      example: "You discover a product designer on Link-Ap. Before connecting, the AI insight shows they're exploring the exact market you're building in. Now your connection note writes itself — and it lands.",
    },
    {
      pill: "WHY CONNECT",
      what: "AI Match Explanation",
      whatDesc: "Before you send a connection request, Link-Ap tells you exactly why you and this person are worth connecting — based on your real goals and skills, not just job titles.",
      forWhom: "Investors & Mentors",
      forDesc: "Know the specific reason to connect with a founder before you commit an hour to a call that may go nowhere.",
      example: "Link-Ap surfaces a founder whose problem space overlaps directly with your portfolio thesis. The AI insight confirms it in two lines — so you reach out with intent, not just curiosity.",
    },
  ],

  "Note Assistant": [
    {
      pill: "NOTE ASSIST",
      what: "AI Connection Note Assistant",
      whatDesc: "Link-Ap drafts your connection note for you — specific, human-sounding, and grounded in both your profiles — in a single tap.",
      forWhom: "Everyone on Link-Ap",
      forDesc: "Never stare at a blank note field again. The AI writes a first-person opener that references real details from both your profiles, so it never reads like a template.",
      example: "You want to connect with a Cape Town-based growth marketer. Tap '✦ AI draft' and Link-Ap writes: 'Your B2B SaaS growth work maps directly to what I'm building right now — I'd love to explore the overlap.' Edit one word. Send.",
    },
    {
      pill: "NOTE ASSIST",
      what: "AI Connection Note Assistant",
      whatDesc: "Link-Ap drafts your connection note for you — specific, human-sounding, and grounded in both your profiles — in a single tap.",
      forWhom: "Introverts & First-Time Connectors",
      forDesc: "The hardest part of reaching out is finding the right words. Link-Ap does that for you, so you show up confident instead of hesitant.",
      example: "You found someone whose skills are exactly what your project needs, but you don't know how to start. One tap gives you a note that sounds like you at your best — not a cold message from a stranger.",
    },
  ],

  "Chat Starters": [
    {
      pill: "CHAT STARTERS",
      what: "AI Conversation Starter Chips",
      whatDesc: "The moment you open a new conversation on Link-Ap, three AI-generated openers appear — specific to both your profiles, never generic, never awkward.",
      forWhom: "Everyone Who Just Matched",
      forDesc: "Breaking the ice is the hardest part of a new connection. Link-Ap removes that friction entirely with openers that already know who you both are.",
      example: "You match with a UI designer exploring SaaS product work. Three chips appear above the text field. You tap: 'What's the product problem you're most excited to solve right now?' — conversation started in two seconds.",
    },
    {
      pill: "CHAT STARTERS",
      what: "AI Conversation Starter Chips",
      whatDesc: "The moment you open a new conversation on Link-Ap, three AI-generated openers appear — specific to both your profiles, never generic, never awkward.",
      forWhom: "Busy Founders & Operators",
      forDesc: "You matched with someone valuable but haven't had time to craft an opener. Link-Ap keeps the momentum going so great connections don't go cold.",
      example: "Three days after matching with a potential co-founder, you finally open the chat. The starters are already there, still relevant, still specific. You tap one — the conversation picks up like it was always going to happen.",
    },
  ],

  "Profile Score": [
    {
      pill: "PROFILE SCORE",
      what: "AI Profile Score",
      whatDesc: "Link-Ap scores your profile across 5 dimensions out of 100 and shows you exactly what to fix — so the right people actually stop on your card.",
      forWhom: "Anyone Building Their Presence",
      forDesc: "Stop guessing whether your profile is working. Get a score with specific quick-wins you can act on today, not vague advice.",
      example: "Your profile scores 67/100. The AI flags your 'Looking for' section as too vague. You update it in two minutes. The next person who discovers you immediately understands who you need to meet.",
    },
    {
      pill: "PROFILE SCORE",
      what: "AI Profile Score",
      whatDesc: "Link-Ap scores your profile across 5 dimensions out of 100 and shows you exactly what to fix — so the right people actually stop on your card.",
      forWhom: "Founders Before a Big Moment",
      forDesc: "Before a launch, a raise, or a speaking slot — make sure your profile is doing the work for you, not working against you.",
      example: "Before your product launch, you run your profile score. It flags your bio as generic. You sharpen it to one sentence about the exact problem you solve. Your next investor match reaches out first — without you having to pitch.",
    },
  ],
  "Proposal Generator": [
    {
      pill: "PROPOSAL GENERATOR",
      what: "AI Proposal Generator",
      whatDesc: "Describe your project and client, and Link-Ap writes a full professional proposal in seconds — introduction, scope, deliverables, timeline, investment, terms, and a confident close.",
      forWhom: "Freelancers Chasing New Clients",
      forDesc: "Stop losing work to clients who go with whoever sent the most polished proposal. Now you send that proposal every time — in minutes, not hours.",
      example: "A potential client asks for a proposal by end of day. You fill in the scope summary, click Generate, and send a seven-section PDF with your name on it before lunch. The client signs the same afternoon.",
    },
    {
      pill: "PROPOSAL GENERATOR",
      what: "AI Proposal Generator",
      whatDesc: "Describe your project and client, and Link-Ap writes a full professional proposal in seconds — introduction, scope, deliverables, timeline, investment, terms, and a confident close.",
      forWhom: "Consultants Pitching Corporates",
      forDesc: "Corporate clients expect polished, structured proposals. Now you look the part from day one — without a full-time proposal writer on staff.",
      example: "You're pitching a brand identity project to a corporate procurement team. The AI generates a formal proposal with deliverables and payment terms. You download the PDF, add your signature block, and submit it before the deadline.",
    },
    {
      pill: "PROPOSAL GENERATOR",
      what: "AI Proposal Generator",
      whatDesc: "Describe your project and client, and Link-Ap writes a full professional proposal in seconds — introduction, scope, deliverables, timeline, investment, terms, and a confident close.",
      forWhom: "Side-Hustlers Turning Pro",
      forDesc: "You've been doing great work informally. Now you want to charge what you're worth. A proper proposal signals professionalism and justifies your rate before the conversation starts.",
      example: "You've been doing social media content for a friend-of-a-friend at a low rate. A new lead asks for a formal proposal. You generate one in two minutes with a real scope and a proper budget range. They don't negotiate — they just say yes.",
    },
  ],

  "Pitch Deck Outline": [
    {
      pill: "PITCH DECK",
      what: "AI Pitch Deck Outline Generator",
      whatDesc: "Describe your business and Link-Ap generates a full 10-slide investor pitch outline — problem, solution, market, model, traction, ask, and speaker notes for every slide.",
      forWhom: "First-Time Founders",
      forDesc: "You've never pitched to an investor before. Now you walk in with a structured narrative, slide-by-slide bullet points, and speaker notes that tell you exactly what to say.",
      example: "You have a pitch meeting in three days and a blank deck. You fill in your business details, hit Generate, and get a 10-slide outline with a speaker note for every slide. You spend your time practising — not writing.",
    },
    {
      pill: "PITCH DECK",
      what: "AI Pitch Deck Outline Generator",
      whatDesc: "Describe your business and Link-Ap generates a full 10-slide investor pitch outline — problem, solution, market, model, traction, ask, and speaker notes for every slide.",
      forWhom: "Founders Refining Their Story",
      forDesc: "You've pitched before but the narrative hasn't quite landed. Use the AI outline to pressure-test your story structure and find the gaps before the next room.",
      example: "Your last pitch stalled on the market size slide. You run the deck generator, and the AI reframes your market opportunity with a bottom-up approach that your previous version missed. You walk into the next pitch with a sharper slide and a cleaner number.",
    },
    {
      pill: "PITCH DECK",
      what: "AI Pitch Deck Outline Generator",
      whatDesc: "Describe your business and Link-Ap generates a full 10-slide investor pitch outline — problem, solution, market, model, traction, ask, and speaker notes for every slide.",
      forWhom: "Operators Raising Internal Buy-In",
      forDesc: "Not all pitches are for investors. Use the outline to structure a compelling case for your leadership team, board, or corporate sponsor.",
      example: "You need budget approval for a new product line. You generate the deck outline as a framework for your internal presentation. The structured narrative lands, the budget is approved, and you have a head start on the external pitch when the time comes.",
    },
  ],

  "Quote Generator": [
    {
      pill: "QUOTE GENERATOR",
      what: "AI Quote Generator",
      whatDesc: "Fill in your line items and Link-Ap drafts a professional, branded price quote — complete with a quote number, validity period, optional deposit, and terms — ready to send before the client looks elsewhere.",
      forWhom: "Freelancers Fielding Quick Requests",
      forDesc: "A client wants a number today, not next week. Now you can send a polished quote in minutes, with a clear validity window so you're never locked into an old price.",
      example: "A prospective client DMs you asking 'how much for a logo + brand guide?' You add two line items, set the quote to expire in 14 days, and send a styled PDF quote within five minutes — while the conversation is still warm.",
    },
    {
      pill: "QUOTE GENERATOR",
      what: "AI Quote Generator",
      whatDesc: "Fill in your line items and Link-Ap drafts a professional, branded price quote — complete with a quote number, validity period, optional deposit, and terms — ready to send before the client looks elsewhere.",
      forWhom: "Founders Quoting Project Work",
      forDesc: "Bigger projects need a deposit upfront. Now you can specify a deposit percentage and have it calculated and presented automatically, so cash flow conversations happen before work starts, not after.",
      example: "You're scoping a three-month build for a client. You add the milestones as line items, set a 30% deposit, and generate the quote. The client approves it, pays the deposit, and you've secured working capital before writing a line of code.",
    },
    {
      pill: "QUOTE GENERATOR",
      what: "AI Quote Generator",
      whatDesc: "Fill in your line items and Link-Ap drafts a professional, branded price quote — complete with a quote number, validity period, optional deposit, and terms — ready to send before the client looks elsewhere.",
      forWhom: "Operators Moving from Quote to Invoice",
      forDesc: "Once a quote is accepted, retyping everything into an invoice wastes time and risks mismatched numbers. Now one tap carries the line items straight across.",
      example: "Your client replies 'looks good, go ahead.' You open the accepted quote and tap 'Convert to Invoice →' — the same line items and client details land in the Invoice Generator, ready to add a due date and send.",
    },
  ],

  "Payment Chaser": [
    {
      pill: "PAYMENT CHASER",
      what: "AI Payment Chaser",
      whatDesc: "Tell Link-Ap who owes you, how much, and how overdue they are, and it writes a polite-but-firm follow-up message — matched to your tone and channel — ready to copy and send.",
      forWhom: "Freelancers Avoiding Awkward Conversations",
      forDesc: "Chasing late payments feels uncomfortable, so it gets put off — and the invoice gets put off too. Now you get a message that's firm without being awkward, in seconds.",
      example: "An invoice is 10 days overdue. You select 'Gentle nudge' and 'WhatsApp', and Link-Ap writes a short, warm reminder. You copy it, paste it into the chat, and the client pays within the hour.",
    },
    {
      pill: "PAYMENT CHASER",
      what: "AI Payment Chaser",
      whatDesc: "Tell Link-Ap who owes you, how much, and how overdue they are, and it writes a polite-but-firm follow-up message — matched to your tone and channel — ready to copy and send.",
      forWhom: "Small Business Owners Managing Multiple Clients",
      forDesc: "When several invoices are overdue at once, writing individual follow-ups is the first thing to slip. Now each one takes seconds, so nothing falls through the cracks.",
      example: "You have three invoices overdue by different amounts. For each one you set the days overdue and escalation level, generate the message, and send it by email — all before your morning coffee is finished.",
    },
    {
      pill: "PAYMENT CHASER",
      what: "AI Payment Chaser",
      whatDesc: "Tell Link-Ap who owes you, how much, and how overdue they are, and it writes a polite-but-firm follow-up message — matched to your tone and channel — ready to copy and send.",
      forWhom: "Founders Escalating Without Burning Bridges",
      forDesc: "A client who's gone quiet for weeks needs a firmer message — but an overly aggressive one can damage the relationship. Now the escalation tone is calibrated for you.",
      example: "An invoice is now 45 days overdue and the client has stopped responding. You select 'Final notice', and Link-Ap drafts a serious but professional email referencing next steps — firm enough to prompt action, without making threats.",
    },
  ],

  "Runway Calculator": [
    {
      pill: "RUNWAY CALCULATOR",
      what: "Cash Flow Runway Calculator",
      whatDesc: "Enter your cash on hand, monthly income, and fixed costs, and Link-Ap shows exactly how many months your runway lasts, your projected run-out date, and what it would take to break even.",
      forWhom: "Founders Watching the Bank Balance",
      forDesc: "Knowing your runway in your head is risky — a clear number changes how you plan hiring, spending, and fundraising timelines.",
      example: "You check your numbers and see you have 4.2 months of runway, running out around late October. That's enough warning to start fundraising conversations now instead of in a panic next month.",
    },
    {
      pill: "RUNWAY CALCULATOR",
      what: "Cash Flow Runway Calculator",
      whatDesc: "Enter your cash on hand, monthly income, and fixed costs, and Link-Ap shows exactly how many months your runway lasts, your projected run-out date, and what it would take to break even.",
      forWhom: "Freelancers Planning Around Slow Months",
      forDesc: "Income can be unpredictable. Now you can see how long your savings cover a quiet period — and what extra income would close the gap.",
      example: "Work has dried up for the month. You plug in your savings and fixed costs and see you have 3.5 months before things get tight, plus the exact amount of extra monthly income that would stop the burn — so you know what to aim for.",
    },
    {
      pill: "RUNWAY CALCULATOR",
      what: "Cash Flow Runway Calculator",
      whatDesc: "Enter your cash on hand, monthly income, and fixed costs, and Link-Ap shows exactly how many months your runway lasts, your projected run-out date, and what it would take to break even.",
      forWhom: "Founders Planning Around a Big Expense",
      forDesc: "A large one-off cost — like a tax bill or new equipment — can blindside an otherwise healthy cash position. Now you can model it before it happens.",
      example: "You know a tax payment is due in month 4. You add it as a once-off outflow and see your runway shorten from 'no limit' to 7 months — giving you time to plan ahead instead of being caught off guard.",
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
