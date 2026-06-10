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

const CURRENCY_SYMBOLS = { ZAR: "R", USD: "$", GBP: "£", EUR: "€" };
const ESCALATION_LEVELS = ["Gentle nudge", "Firm reminder", "Final notice"];
const CHANNELS = ["Email", "WhatsApp"];

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

  const limitResult = await checkToolLimit(uid, "payment-chase");
  if (!limitResult.allowed) return res.status(429).json({ error: limitResult.message });

  const { clientFirstName, fromName, invoiceNumber, amount, currency, daysOverdue, escalationLevel, channel } =
    req.body || {};

  if (!clientFirstName || !fromName || amount === undefined || amount === null) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  const safeClientFirstName = san(clientFirstName, 60);
  const safeFromName = san(fromName, 100);
  const safeInvoiceNumber = san(invoiceNumber, 40);
  const safeCurrency = ["ZAR", "USD", "GBP", "EUR"].includes(currency) ? currency : "ZAR";
  const sym = CURRENCY_SYMBOLS[safeCurrency] || safeCurrency;
  const safeAmount = Math.max(0, parseFloat(amount) || 0);
  const safeDaysOverdue = Math.max(0, parseInt(daysOverdue, 10) || 0);
  const safeEscalation = ESCALATION_LEVELS.includes(escalationLevel) ? escalationLevel : "Gentle nudge";
  const safeChannel = CHANNELS.includes(channel) ? channel : "Email";

  if (!safeClientFirstName || !safeFromName || safeAmount <= 0) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const channelInstructions = safeChannel === "WhatsApp"
    ? "Write a short, warm, conversational WhatsApp message under 80 words. No subject line — return an empty string for subject."
    : "Write a professional email. Include a concise subject line.";

  const escalationInstructions = {
    "Gentle nudge": "Tone: friendly reminder, assume it was an oversight. Light and warm.",
    "Firm reminder": "Tone: clear and direct, but still polite and professional. State the amount and overdue period plainly.",
    "Final notice": "Tone: firm and serious, but professional and never threatening or legally prescriptive. May reference next steps such as interest per any prior agreement or handing the matter to a collections process, phrased generally and without legal claims.",
  }[safeEscalation];

  const prompt = `Write a payment follow-up message for a freelancer/business owner to send to a client. Return ONLY valid JSON, no markdown, no code blocks, no preamble.

From: ${safeFromName}
To: ${safeClientFirstName}
${safeInvoiceNumber ? `Invoice number: ${safeInvoiceNumber}\n` : ""}Amount owed: ${sym}${safeAmount.toFixed(2)}
Days overdue: ${safeDaysOverdue}
Escalation level: ${safeEscalation}
Channel: ${safeChannel}

${channelInstructions}
${escalationInstructions}

Write in first person as ${safeFromName}, addressing ${safeClientFirstName} by name. Be specific about the amount${safeInvoiceNumber ? " and invoice number" : ""} and days overdue. Never threaten legal action explicitly or cite specific laws.

Return exactly this JSON structure:
{
  "subject": "...",
  "message": "..."
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
        max_tokens: 600,
        system:
          "You are a helpful assistant that writes polite-but-effective payment follow-up messages for freelancers and small business owners on an African entrepreneur platform. Return only valid JSON. Always remain professional and never make explicit legal threats.",
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

    const result = JSON.parse(jsonMatch[0]);

    return res.status(200).json({
      subject: safeChannel === "Email" ? (result.subject || "") : "",
      message: result.message || "",
    });
  } catch (err) {
    console.error("Payment chase generation error:", err);
    return res.status(500).json({ error: "Failed to generate message" });
  }
};
