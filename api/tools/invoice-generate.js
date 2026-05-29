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

  const limitResult = await checkToolLimit(uid, "invoice");
  if (!limitResult.allowed) return res.status(429).json({ error: limitResult.message });

  const { fromName, fromEmail, clientName, clientEmail, currency, dueDate, lineItems } =
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

  let dueDateStr = todayStr;
  if (dueDate) {
    try { dueDateStr = formatDate(new Date(dueDate)); } catch {}
  }

  const subtotal = Math.round(
    safeItems.reduce((s, i) => s + i.qty * i.unitPrice, 0) * 100
  ) / 100;
  const tax = safeCurrency === "ZAR" ? Math.round(subtotal * 0.15 * 100) / 100 : 0;
  const total = Math.round((subtotal + tax) * 100) / 100;

  const itemsText = safeItems
    .map(i => `- ${i.description}: qty ${i.qty} × ${sym}${i.unitPrice.toFixed(2)} = ${sym}${(i.qty * i.unitPrice).toFixed(2)}`)
    .join("\n");

  const prompt = `Generate a professional invoice. Return ONLY valid JSON, no markdown, no code blocks, no preamble.

Invoice details:
From: ${safeFrom}${safeFromEmail ? ` <${safeFromEmail}>` : ""}
To: ${safeClient}${safeClientEmail ? ` <${safeClientEmail}>` : ""}
Currency: ${safeCurrency} (symbol: ${sym})
Invoice date: ${todayStr}
Due date: ${dueDateStr}
Line items:
${itemsText}
Subtotal: ${sym}${subtotal.toFixed(2)}${tax > 0 ? `\nVAT (15%): ${sym}${tax.toFixed(2)}` : ""}
Total: ${sym}${total.toFixed(2)}

Generate: a unique invoice number (format INV-${today.getFullYear()}-NNN with a 3-digit random suffix), a professional closing note (1-2 sentences specific to the services described), and appropriate payment terms.

Return exactly this JSON structure:
{
  "invoiceNumber": "INV-${today.getFullYear()}-NNN",
  "invoiceDate": "${todayStr}",
  "dueDate": "${dueDateStr}",
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
  "notes": "...",
  "paymentTerms": "..."
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
          "You are a professional invoice generator for an African entrepreneur platform. Return only valid JSON. All numeric fields must be numbers, not strings. Be specific and professional in notes and payment terms. Tailor the notes to the actual services described.",
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

    const invoice = JSON.parse(jsonMatch[0]);

    // Override all computed fields — never trust Claude's arithmetic
    invoice.subtotal = subtotal;
    invoice.tax = tax;
    invoice.total = total;
    invoice.currency = safeCurrency;
    invoice.currencySymbol = sym;
    invoice.invoiceDate = todayStr;
    invoice.dueDate = dueDateStr;
    invoice.fromName = safeFrom;
    invoice.fromEmail = safeFromEmail;
    invoice.clientName = safeClient;
    invoice.clientEmail = safeClientEmail;
    invoice.lineItems = safeItems.map(i => ({
      description: i.description,
      qty: i.qty,
      unitPrice: i.unitPrice,
      total: Math.round(i.qty * i.unitPrice * 100) / 100,
    }));

    return res.status(200).json(invoice);
  } catch (err) {
    console.error("Invoice generation error:", err);
    return res.status(500).json({ error: "Failed to generate invoice" });
  }
};
