const admin = require("firebase-admin");

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

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

async function generateTrends(db) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

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
      system: `You are the AI editor for Link-Ap, a professional networking app for African entrepreneurs, founders, and builders. Generate 6 AI trend cards for today. Each card must be directly relevant to how entrepreneurs, solo operators, or startup founders can benefit from AI tools. Keep language plain, practical, and jargon-free. Be specific — name actual tools, models, or techniques.

Exactly one of the 6 cards must use the category "Upskill". This card must feature a specific AI skill, certification, or short online course that makes someone highly competitive right now — in the job market, freelance market, or as a service provider. The summary must explain what the skill is and why employers or clients are paying a premium for it today. The howToUse must name the specific platform where you can get it (e.g. Coursera, DeepLearning.AI, Google, Hugging Face), roughly how long it takes, whether it is free or paid, and what concrete market opportunity or income it unlocks.

Respond ONLY with valid JSON — an array of exactly 6 objects, each with:
- "category": one of ["Productivity", "Tools", "Business", "Design", "Marketing", "Upskill", "Coding", "Strategy"]
- "headline": string, max 12 words, punchy and specific
- "summary": string, 2-3 plain English sentences explaining what is new or happening
- "howToUse": string, 1-2 sentences with a concrete practical tip for an entrepreneur or builder

No markdown. No preamble. No explanation. Output the JSON array only.`,
      messages: [{ role: "user", content: "Generate today's 6 AI trend cards." }],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Anthropic ${response.status}: ${body.slice(0, 200)}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text?.trim() || "";

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("No JSON array in Anthropic response");

  const trends = JSON.parse(jsonMatch[0]);
  if (!Array.isArray(trends) || trends.length === 0) throw new Error("Empty trends array");

  const valid = trends.slice(0, 6).filter(
    t => t && typeof t.headline === "string" && typeof t.summary === "string" && typeof t.howToUse === "string"
  );
  if (valid.length === 0) throw new Error("No valid trend objects");

  await db.doc("aiTrends/latest").set({
    trends: valid,
    generatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return valid;
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const db = admin.firestore();

  // Vercel cron sends no Authorization header; client requests must authenticate
  const authHeader = req.headers.authorization || "";
  const isCron = authHeader === "";

  if (!isCron) {
    const idToken = authHeader.replace("Bearer ", "");
    try {
      await admin.auth().verifyIdToken(idToken);
    } catch {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  // Try to serve from cache first
  try {
    const cacheSnap = await db.doc("aiTrends/latest").get();
    if (cacheSnap.exists) {
      const cached = cacheSnap.data();
      const generatedAt = cached.generatedAt?.toDate?.()?.getTime() || 0;
      if (Date.now() - generatedAt < CACHE_TTL_MS) {
        return res.status(200).json({ trends: cached.trends, generatedAt });
      }
    }
  } catch (err) {
    console.error("Pulse cache read error:", err);
  }

  // Generate fresh trends
  try {
    const trends = await generateTrends(db);
    return res.status(200).json({ trends, generatedAt: Date.now() });
  } catch (err) {
    console.error("Pulse generation error:", err);

    // Return stale cache as fallback rather than a blank screen
    try {
      const staleSnap = await db.doc("aiTrends/latest").get();
      if (staleSnap.exists) {
        const cached = staleSnap.data();
        return res.status(200).json({
          trends: cached.trends,
          generatedAt: cached.generatedAt?.toDate?.()?.getTime() || 0,
          stale: true,
        });
      }
    } catch {}

    return res.status(500).json({ error: "Failed to generate trends" });
  }
};
