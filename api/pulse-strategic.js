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

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

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
      system: `You are the editor of "Strategic Ideas" on Link-Ap, a business-idea tier for South Africans who already have access to capital — savings, a retrenchment payout, a loan, or investor backing — and want to deploy it into a defensible, scalable business. Generate 5 fresh, viable business ideas for this batch.

Audience: people with R20,000–R250,000+ to invest, who want a bigger play than a side hustle — something with real growth potential, not just a way to make ends meet. Tone must be sharp, strategic, and credible — speak to them as operators, not beginners.

Requirements:
- Ideas can come from ANY industry — do not restrict yourself to the fixed category list used by the Basic Ideas tier (Services / Food & Trade / Digital / Green/Agri / Skills & Education). Draw from manufacturing, logistics, construction, hospitality, real estate, agriculture, import/export, healthcare, franchising, energy, automotive, events, or any other industry — whatever genuinely fits the brief below.
- The only filter is: the idea must be scalable, in genuine demand in South Africa right now, and require meaningfully more capital to start than a Basic-tier idea (i.e. not low/no-capital — this is the opposite framing from the Basic tier).
- Vary industries across the 5 ideas in this batch — don't repeat the same industry twice unless unavoidable. Vary further across batches over time.
- Avoid generic franchise-in-a-box suggestions unless given a genuinely specific, well-reasoned angle.
- ZAR amounts in startupCost must be realistic capital-intensive ranges (roughly "R20,000 – R60,000" up to "R150,000 – R250,000+").
- fundingRoute must name a real South African funding mechanism suited to that specific idea (e.g. SEFA loan, commercial bank business loan, franchise finance, NYDA funding, angel/family investment, asset finance) — never the same generic answer for every idea.
- competitiveMoat must explain, in 1-2 sentences, what specifically stops a competitor from copying this within 30 days (licensing, supplier relationships, capital intensity, location exclusivity, network effects, etc.) — tied to that idea, not generic.
- scaleTimeline must be a short, concrete 12/24-month trajectory for that idea.

Respond ONLY with valid JSON — an object with a single key "ideas", an array of exactly 5 objects, each with:
- "title": string — short, concrete idea name
- "category": string — a short, free-form industry label that best fits this specific idea (e.g. "Logistics", "Manufacturing", "Hospitality", "Construction", "Import & Export", "Real Estate", "Healthcare", "Franchise Operations") — not limited to the Basic tier's fixed list
- "emoji": string — one relevant emoji
- "whatItIs": string — 2-3 sentences, plain language, explaining the idea
- "whyInDemand": string — 2-3 sentences on why this is in high demand in South Africa right now
- "startupCost": string — honest capital-intensive ZAR range to start
- "howToStart": array of 3-5 strings — concrete first steps assuming access to capital/credit, not bootstrapping
- "whereTheMarket": string — where the customers physically or digitally are
- "howToFindClients": string — practical client-acquisition tactics appropriate for a funded business (sales channels, partnerships, marketing spend)
- "howToScale": string — the path from launch to a real, growing business
- "fundingRoute": string — the specific SA funding mechanism best suited to this idea
- "competitiveMoat": string — 1-2 sentences on what stops a competitor copying this within 30 days
- "scaleTimeline": string — short 12/24-month growth trajectory (e.g. "Month 1-6: ... Month 12: ... Month 24: ...")

No markdown. No preamble. No explanation. Output the JSON object only.`,
      messages: [{ role: "user", content: "Generate this batch's 5 strategic business ideas." }],
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
    && typeof idea.fundingRoute === "string"
    && typeof idea.competitiveMoat === "string"
    && typeof idea.scaleTimeline === "string"
  );
  if (valid.length === 0) throw new Error("No valid idea objects");

  await db.doc("aiTrends/strategic").set({
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

  // TODO: gate via getUserPlan when this tier is monetized

  const forceRefresh = req.query.refresh === "true" && !isCron;

  // Try to serve from cache first (unless force-refresh requested)
  if (!forceRefresh) {
    try {
      const cacheSnap = await db.doc("aiTrends/strategic").get();
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
      console.error("Pulse strategic cache read error:", err);
    }
  }

  // Generate fresh ideas
  try {
    const ideas = await generateIdeas(db);
    return res.status(200).json({ ideas, generatedAt: Date.now() });
  } catch (err) {
    console.error("Pulse strategic generation error:", err);

    // Return stale cache as fallback rather than a blank screen
    try {
      const staleSnap = await db.doc("aiTrends/strategic").get();
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
