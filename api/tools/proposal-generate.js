const admin = require("firebase-admin");
const getUserPlan = require("../lib/getUserPlan");
const checkToolLimit = require("../lib/checkToolLimit");

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY
          ?.replace(/^"|"$/g, "")
          .replace(/\\n/g, "\n"),
      }),
    });
  } catch (err) {
    console.error("Firebase Admin init error:", err);
    throw err;
  }
}

const san = (s, max = 200) =>
  typeof s === "string" ? s.replace(/[<>]/g, "").trim().slice(0, max) : "";

const CURRENCY_SYMBOLS = { ZAR: "R", USD: "$", GBP: "£", EUR: "€" };

const formatDate = (d) =>
  d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const idToken = (req.headers.authorization || "").replace("Bearer ", "");
  let uid;
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    uid = decoded.uid;
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const plan = await getUserPlan(uid);
  if (plan !== "founding_member" && plan !== "premium") {
    return res.status(403).json({ error: "Pro feature — upgrade to access AI tools" });
  }

  const limitResult = await checkToolLimit(uid, "proposal");
  if (!limitResult.allowed) return res.status(429).json({ error: limitResult.message });

  const {
    fromName, fromEmail, clientName, clientEmail,
    projectType, scopeSummary, budget, currency, timeline, startDate,
  } = req.body || {};

  if (!fromName || !clientName || !projectType || !scopeSummary) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  const safeFrom = san(fromName, 100);
  const safeFromEmail = san(fromEmail, 150);
  const safeClient = san(clientName, 100);
  const safeClientEmail = san(clientEmail, 150);
  const safeProjectType = san(projectType, 150);
  const safeScopeSummary = san(scopeSummary, 1000);
  const safeBudget = san(budget, 100);
  const safeCurrency = ["ZAR", "USD", "GBP", "EUR"].includes(currency) ? currency : "ZAR";
  const sym = CURRENCY_SYMBOLS[safeCurrency] || safeCurrency;
  const safeTimeline = san(timeline, 100);

  let safeStartDate = "";
  if (startDate) {
    try { safeStartDate = formatDate(new Date(startDate)); } catch {}
  }

  const today = new Date();
  const todayStr = formatDate(today);
  const validUntilDate = new Date(today);
  validUntilDate.setDate(validUntilDate.getDate() + 30);
  const validUntilStr = formatDate(validUntilDate);

  const prompt = `Generate a professional project proposal for a freelancer/consultant. Return ONLY valid JSON, no markdown, no code blocks, no preamble.

Proposal details:
From: ${safeFrom}${safeFromEmail ? ` <${safeFromEmail}>` : ""}
To (Client): ${safeClient}${safeClientEmail ? ` <${safeClientEmail}>` : ""}
Project Type: ${safeProjectType}
Scope Summary: ${safeScopeSummary}
Budget: ${safeBudget || "To be discussed"}
Currency: ${safeCurrency} (symbol: ${sym})
Timeline: ${safeTimeline || "To be discussed"}
Proposed Start Date: ${safeStartDate || "To be confirmed"}
Proposal Date: ${todayStr}
Valid Until: ${validUntilStr}

Generate a unique proposal number (format PROP-${today.getFullYear()}-NNN with a random 3-digit suffix), and write all 7 sections professionally.

Return exactly this JSON structure:
{
  "proposalNumber": "PROP-${today.getFullYear()}-NNN",
  "proposalDate": "${todayStr}",
  "validUntil": "${validUntilStr}",
  "fromName": "${safeFrom}",
  "fromEmail": "${safeFromEmail}",
  "clientName": "${safeClient}",
  "clientEmail": "${safeClientEmail}",
  "projectType": "${safeProjectType}",
  "currency": "${safeCurrency}",
  "currencySymbol": "${sym}",
  "sections": {
    "introduction": "2-3 sentences, professional and warm, specific to the project type and client",
    "scopeOfWork": "A detailed paragraph expanding on the scope summary with professional language",
    "deliverables": ["Deliverable 1", "Deliverable 2", "Deliverable 3", "Deliverable 4", "Deliverable 5"],
    "timeline": "Structured breakdown, e.g. Week 1-2: Discovery and planning. Week 3-5: Design and development. Week 6: Review and handover.",
    "investment": "Professional framing of the budget, referencing the currency and amount",
    "terms": "2-3 sentences covering payment terms (e.g. 50% upfront), number of revision rounds, and IP ownership on full payment",
    "closing": "1-2 sentences, confident and warm, encouraging the client to move forward"
  },
  "budget": "${safeBudget}",
  "timeline": "${safeTimeline}"
}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1500,
        system:
          "You are a professional proposal writer for African freelancers and consultants. Return only valid JSON. Write in a confident, professional, and warm tone. Be specific to the project details provided. The deliverables field must be an array of strings.",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Anthropic ${response.status}: ${body.slice(0, 200)}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text?.trim() || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in Anthropic response");

    const proposal = JSON.parse(jsonMatch[0]);

    // Override identity fields — never trust Claude on these
    proposal.fromName = safeFrom;
    proposal.fromEmail = safeFromEmail;
    proposal.clientName = safeClient;
    proposal.clientEmail = safeClientEmail;
    proposal.projectType = safeProjectType;
    proposal.currency = safeCurrency;
    proposal.currencySymbol = sym;
    proposal.proposalDate = todayStr;
    proposal.validUntil = validUntilStr;
    proposal.budget = safeBudget;
    proposal.timeline = safeTimeline;

    // Ensure deliverables is always an array
    if (!Array.isArray(proposal.sections?.deliverables)) {
      proposal.sections = proposal.sections || {};
      proposal.sections.deliverables = [];
    }

    return res.status(200).json(proposal);
  } catch (err) {
    console.error("Proposal generation error:", err);
    return res.status(500).json({ error: "Failed to generate proposal" });
  }
};
