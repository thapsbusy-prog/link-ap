const admin = require("firebase-admin");
const getUserPlan = require("../_lib/getUserPlan");
const checkToolLimit = require("../_lib/checkToolLimit");

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

const formatDate = (d) =>
  d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const VALID_CURRENCIES = ["ZAR", "USD", "GBP", "EUR"];

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

  const limitResult = await checkToolLimit(uid, "pitchDeck");
  if (!limitResult.allowed) return res.status(429).json({ error: limitResult.message });

  const {
    businessName, oneLiner, problem, solution, targetMarket,
    revenueModel, traction, askAmount, currency,
  } = req.body || {};

  if (!businessName || !oneLiner || !problem || !solution || !targetMarket) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  const safeName = san(businessName, 100);
  const safeOneLiner = san(oneLiner, 300);
  const safeProblem = san(problem, 600);
  const safeSolution = san(solution, 600);
  const safeMarket = san(targetMarket, 300);
  const safeRevenue = san(revenueModel, 300);
  const safeTraction = san(traction, 300);
  const safeAsk = san(askAmount, 100);
  const safeCurrency = VALID_CURRENCIES.includes(currency) ? currency : "ZAR";

  const today = new Date();
  const todayStr = formatDate(today);
  const slide9Title = safeAsk ? "The Ask" : "Why Now";

  const prompt = `Generate a 10-slide investor pitch deck outline. Return ONLY valid JSON, no markdown, no code blocks, no preamble.

Business: ${safeName}
One-liner: ${safeOneLiner}
Problem: ${safeProblem}
Solution: ${safeSolution}
Target Market: ${safeMarket}
Revenue Model: ${safeRevenue || "To be defined"}
Traction: ${safeTraction || "Pre-revenue, building"}
Funding Ask: ${safeAsk || "Not specified"}
Currency: ${safeCurrency}

Generate exactly 10 slides in this order:
1. Cover (business name + one liner)
2. The Problem
3. Our Solution
4. Market Opportunity
5. Product / How It Works
6. Business Model
7. Traction & Validation
8. Go-To-Market Strategy
9. ${slide9Title}${safeAsk ? ` (ask: ${safeAsk} ${safeCurrency})` : ""}
10. Team & Vision

Return exactly this JSON structure:
{
  "deckTitle": "${safeName} — Investor Pitch",
  "generatedDate": "${todayStr}",
  "businessName": "${safeName}",
  "slides": [
    {
      "slideNumber": 1,
      "title": "Cover",
      "keyMessage": "One sentence key message for this slide",
      "bulletPoints": ["bullet 1", "bullet 2", "bullet 3"],
      "speakerNote": "2-3 sentences on what to say when presenting this slide"
    }
  ],
  "pitchTips": ["Tip 1", "Tip 2", "Tip 3", "Tip 4"]
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
        max_tokens: 4000,
        system:
          "You are an expert startup pitch deck consultant for African entrepreneurs. Return only valid JSON. Generate specific, compelling slide content tailored to the business. Every bullet point must be ready-to-present — never use placeholder text. Speaker notes should sound natural when spoken aloud.",
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

    const deck = JSON.parse(jsonMatch[0]);

    // Override identity fields server-side — never trust Claude on these
    deck.deckTitle = `${safeName} — Investor Pitch`;
    deck.generatedDate = todayStr;
    deck.businessName = safeName;

    if (!Array.isArray(deck.slides)) deck.slides = [];
    if (!Array.isArray(deck.pitchTips)) deck.pitchTips = [];

    return res.status(200).json(deck);
  } catch (err) {
    console.error("Pitch deck generation error:", err);
    return res.status(500).json({ error: "Failed to generate pitch deck" });
  }
};
