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

const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

async function generateIdeas(db) {
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
      max_tokens: 8000,
      system: `You are the editor of "Funded Ideas" on Link-Ap, a business-idea tier for South Africans who have a modest amount of capital — savings, a small loan, a stokvel payout, or a bit of severance — and want to start something more substantial than a bootstrapped side hustle, but don't yet have the bigger capital base the "Strategic Ideas" tier assumes. Generate 5 fresh, viable business ideas for this batch.

Audience: people with roughly R15,000–R150,000 to invest. They want a real small business with some upfront investment in stock, equipment, a vehicle, or a small premises — not a R0-capital hustle, and not a R200,000+ capital-intensive operation. Tone should be practical and encouraging, speaking to someone serious about committing real savings to this.

Requirements:
- Ideas can come from any industry that fits this capital band — do not restrict to a fixed category list. Draw from retail, trades, food service, transport, beauty & wellness, repair & maintenance, small-scale manufacturing, equipment rental, education, agriculture, events, or any other industry that genuinely fits.
- The idea must require a meaningful upfront investment (stock, a vehicle, equipment, a small fitted-out space, or similar) that a pure bootstrapping hustle would skip — but must NOT require the kind of capital-intensive, multi-site, or heavily licensed operations that belong in the Strategic tier.
- Vary industries across the 5 ideas in this batch — don't repeat the same industry twice unless unavoidable. Vary further across batches over time.
- ZAR amounts in startupCost must be realistic ranges within roughly "R15,000 – R40,000" up to "R100,000 – R150,000".
- howToStart should assume the person has the stated capital in hand already (savings/loan/payout) and is deciding how to deploy it — not how to bootstrap without it.

Respond ONLY with valid JSON — an object with a single key "ideas", an array of exactly 5 objects, each with:
- "title": string — short, concrete idea name
- "category": string — a short, free-form industry label that best fits this specific idea (e.g. "Retail", "Trades & Repair", "Food Service", "Transport & Logistics", "Beauty & Wellness", "Agriculture", "Equipment Rental")
- "emoji": string — one relevant emoji
- "whatItIs": string — 2-3 sentences, plain language, explaining the idea
- "whyInDemand": string — 2-3 sentences on why this is in high demand in South Africa right now
- "startupCost": string — honest ZAR range to start, within the R15,000–R150,000 band
- "howToStart": array of 3-5 strings — concrete first steps assuming the capital is already in hand
- "whereTheMarket": string — where the customers physically or digitally are
- "howToFindClients": string — practical client-acquisition tactics appropriate for a small funded business
- "howToScale": string — the path from launch to a steadily growing business

No markdown. No preamble. No explanation. Output the JSON object only.`,
      messages: [{ role: "user", content: "Generate this batch's 5 funded business ideas." }],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Anthropic ${response.status}: ${body.slice(0, 200)}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text?.trim() || "";

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON object in Anthropic response");

  const parsed = JSON.parse(jsonMatch[0]);
  const ideas = parsed?.ideas;
  if (!Array.isArray(ideas) || ideas.length === 0) throw new Error("Empty ideas array");

  const valid = ideas.slice(0, 5).filter(idea =>
    idea
    && typeof idea.title === "string"
    && typeof idea.category === "string" && idea.category.trim().length > 0
    && typeof idea.emoji === "string"
    && typeof idea.whatItIs === "string"
    && typeof idea.whyInDemand === "string"
    && typeof idea.startupCost === "string"
    && Array.isArray(idea.howToStart) && idea.howToStart.every(s => typeof s === "string")
    && typeof idea.whereTheMarket === "string"
    && typeof idea.howToFindClients === "string"
    && typeof idea.howToScale === "string"
  );
  if (valid.length === 0) throw new Error("No valid idea objects");

  await db.doc("aiTrends/funded").set({
    ideas: valid,
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

  const forceRefresh = req.query.refresh === "true" && !isCron;

  // Try to serve from cache first (unless force-refresh requested)
  if (!forceRefresh) {
    try {
      const cacheSnap = await db.doc("aiTrends/funded").get();
      if (cacheSnap.exists) {
        const cached = cacheSnap.data();
        if (Array.isArray(cached.ideas)) {
          const generatedAt = cached.generatedAt?.toDate?.()?.getTime() || 0;
          if (Date.now() - generatedAt < CACHE_TTL_MS) {
            return res.status(200).json({ ideas: cached.ideas, generatedAt });
          }
        }
      }
    } catch (err) {
      console.error("Pulse funded cache read error:", err);
    }
  }

  // Generate fresh ideas
  try {
    const ideas = await generateIdeas(db);
    return res.status(200).json({ ideas, generatedAt: Date.now() });
  } catch (err) {
    console.error("Pulse funded generation error:", err);

    // Return stale cache as fallback rather than a blank screen
    try {
      const staleSnap = await db.doc("aiTrends/funded").get();
      if (staleSnap.exists) {
        const cached = staleSnap.data();
        if (Array.isArray(cached.ideas)) {
          return res.status(200).json({
            ideas: cached.ideas,
            generatedAt: cached.generatedAt?.toDate?.()?.getTime() || 0,
            stale: true,
          });
        }
      }
    } catch {}

    return res.status(500).json({ error: "Failed to generate ideas" });
  }
};
