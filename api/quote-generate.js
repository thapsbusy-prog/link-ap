const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY
        ?.replace(/^"|"$/g, "")
        .replace(/\\n/g, "\n"),
    }),
  });
}

const CATEGORIES = {
  Inspire: "motivational and empowering, about purposeful professional growth and meaningful connections",
  Entice:
    "compelling, persuasive — making professionals feel they're missing out by not being on Link-Ap",
  Creative:
    "witty, clever, thought-provoking — a fresh perspective on professional networking",
};

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ quote: null });

  const authHeader = req.headers.authorization || "";
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!idToken) return res.status(401).json({ quote: null });
  try {
    await admin.auth().verifyIdToken(idToken);
  } catch {
    return res.status(401).json({ quote: null });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY not set");
    return res.status(200).json({ quote: null });
  }

  const { category } = req.body || {};
  const desc = CATEGORIES[category];
  if (!desc) return res.status(400).json({ quote: null });

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
        max_tokens: 300,
        system: `You write short, punchy quote cards for Link-Ap — a purpose-driven professional networking app based in Cape Town, South Africa. The tagline is "Connect with purpose". Link-Ap differentiates itself from LinkedIn by focusing on intentional, meaningful connections between builders, founders, investors, and collaborators.

Your quotes must:
- Be ${desc}
- Feel sharp and authentic — written by a human, not a bot
- Be concise: ideally under 25 words, never more than 35
- Be relevant to professional networking, career growth, or meaningful connections
- Never be generic or cliché

Return ONLY valid JSON with no markdown fences:
{"quote": "...", "attribution": "..."}

Attribution options (pick the most fitting):
- "Link-Ap" for original brand voice
- A relevant historical thinker, author, or entrepreneur (not living politicians)
- A short evocative role like "A Cape Town founder" or "A serial builder"`,
        messages: [
          {
            role: "user",
            content: `Generate a ${category.toLowerCase()} quote card.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("Anthropic error:", response.status);
      return res.status(200).json({ quote: null });
    }

    const data = await response.json();
    const raw = data.content?.[0]?.text?.trim() || "{}";

    let parsed;
    try {
      parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    } catch {
      console.error("JSON parse error:", raw);
      return res.status(200).json({ quote: null });
    }

    if (!parsed.quote) return res.status(200).json({ quote: null });

    return res.status(200).json({
      quote: String(parsed.quote).replace(/[<>]/g, "").trim().slice(0, 200),
      attribution: String(parsed.attribution || "Link-Ap")
        .replace(/[<>]/g, "")
        .trim()
        .slice(0, 60),
    });
  } catch (err) {
    console.error("quote-generate error:", err);
    return res.status(200).json({ quote: null });
  }
};
