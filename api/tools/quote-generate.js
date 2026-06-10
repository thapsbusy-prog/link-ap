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
const VALIDITY_OPTIONS = [7, 14, 30];

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

  const limitResult = await checkToolLimit(uid, "quote");
  if (!limitResult.allowed) return res.status(429).json({ error: limitResult.message });

  const { fromName, fromEmail, clientName, clientEmail, currency, lineItems, validityDays, depositPercent } =
    req.body || {};

  if (!fromName || !clientName || !Array.isArray(lineItems) || lineItems.length === 0) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  const safeFrom = san(fromName, 100);
  const safeFromEmail = san(fromEmail, 150);
  const safeClient = san(clientName, 100);
  const safeClientEmail = san(clientEmail, 150);
  const safeCurrency = ["ZAR", "USD", "GBP", "EUR"].includes(currency) ? currency : "ZAR";
  const sym = CURRENCY_SYMBOLS[safeCurrency] || safeCurrency;
  const safeValidityDays = VALIDITY_OPTIONS.includes(parseInt(validityDays, 10))
    ? parseInt(validityDays, 10)
    : 14;
  const safeDepositPercent = Math.min(100, Math.max(0, parseFloat(depositPercent) || 0));

  const safeItems = lineItems
    .slice(0, 20)
    .map(i => ({
      description: san(i.description || "", 150),
      qty: Math.max(0.01, parseFloat(i.qty) || 1),
      unitPrice: Math.max(0, parseFloat(i.unitPrice) || 0),
    }))
    .filter(i => i.description && i.unitPrice > 0);

  if (safeItems.length === 0) {
    return res.status(400).json({ error: "No valid line items" });
  }

  const today = new Date();
  const todayStr = formatDate(today);
  const validUntilDate = new Date(today);
  validUntilDate.setDate(validUntilDate.getDate() + safeValidityDays);
  const validUntilStr = formatDate(validUntilDate);

  const subtotal = Math.round(
    safeItems.reduce((s, i) => s + i.qty * i.unitPrice, 0) * 100
  ) / 100;
  const tax = safeCurrency === "ZAR" ? Math.round(subtotal * 0.15 * 100) / 100 : 0;
  const total = Math.round((subtotal + tax) * 100) / 100;
  const depositAmount = safeDepositPercent > 0
    ? Math.round(total * (safeDepositPercent / 100) * 100) / 100
    : 0;

  const itemsText = safeItems
    .map(i => `- ${i.description}: qty ${i.qty} × ${sym}${i.unitPrice.toFixed(2)} = ${sym}${(i.qty * i.unitPrice).toFixed(2)}`)
    .join("\n");

  const prompt = `Generate a professional price quotation. Return ONLY valid JSON, no markdown, no code blocks, no preamble.

Quote details:
From: ${safeFrom}${safeFromEmail ? ` <${safeFromEmail}>` : ""}
To: ${safeClient}${safeClientEmail ? ` <${safeClientEmail}>` : ""}
Currency: ${safeCurrency} (symbol: ${sym})
Quote date: ${todayStr}
Valid until: ${validUntilStr} (${safeValidityDays} days)
Line items:
${itemsText}
Subtotal: ${sym}${subtotal.toFixed(2)}${tax > 0 ? `\nVAT (15%): ${sym}${tax.toFixed(2)}` : ""}
Total: ${sym}${total.toFixed(2)}
${depositAmount > 0 ? `Deposit required: ${safeDepositPercent}% (${sym}${depositAmount.toFixed(2)})` : "No deposit required"}

Generate: a unique quote number (format QUO-${today.getFullYear()}-NNN with a 3-digit random suffix), a professional closing note (1-2 sentences specific to the services described), and short quote-appropriate terms and conditions covering validity period, deposit (if any), and acceptance process.

Return exactly this JSON structure:
{
  "quoteNumber": "QUO-${today.getFullYear()}-NNN",
  "quoteDate": "${todayStr}",
  "validUntil": "${validUntilStr}",
  "fromName": "${safeFrom}",
  "fromEmail": "${safeFromEmail}",
  "clientName": "${safeClient}",
  "clientEmail": "${safeClientEmail}",
  "currency": "${safeCurrency}",
  "currencySymbol": "${sym}",
  "lineItems": [{"description": "...", "qty": 1, "unitPrice": 0.00, "total": 0.00}],
  "subtotal": ${subtotal},
  "tax": ${tax},
  "total": ${total},
  "depositPercent": ${safeDepositPercent},
  "depositAmount": ${depositAmount},
  "notes": "...",
  "termsAndConditions": "..."
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
        max_tokens: 1000,
        system:
          "You are a professional quotation generator for an African entrepreneur platform. Return only valid JSON. All numeric fields must be numbers, not strings. Be specific and professional in notes and terms. Tailor the notes to the actual services described.",
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

    const quote = JSON.parse(jsonMatch[0]);

    // Override all computed fields — never trust Claude's arithmetic
    quote.subtotal = subtotal;
    quote.tax = tax;
    quote.total = total;
    quote.depositPercent = safeDepositPercent;
    quote.depositAmount = depositAmount;
    quote.currency = safeCurrency;
    quote.currencySymbol = sym;
    quote.quoteDate = todayStr;
    quote.validUntil = validUntilStr;
    quote.fromName = safeFrom;
    quote.fromEmail = safeFromEmail;
    quote.clientName = safeClient;
    quote.clientEmail = safeClientEmail;
    quote.lineItems = safeItems.map(i => ({
      description: i.description,
      qty: i.qty,
      unitPrice: i.unitPrice,
      total: Math.round(i.qty * i.unitPrice * 100) / 100,
    }));

    return res.status(200).json(quote);
  } catch (err) {
    console.error("Quote generation error:", err);
    return res.status(500).json({ error: "Failed to generate quote" });
  }
};
