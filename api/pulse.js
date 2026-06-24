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

const VALID_CATEGORIES = ["Services", "Food & Trade", "Digital", "Green/Agri", "Skills & Education"];

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
      max_tokens: 3000,
      system: `You are the editor of "Business Ideas" on Link-Ap, an empowerment feed for unemployed and aspiring entrepreneurs in South Africa. Generate 5 fresh, viable business ideas for this batch.

Audience: people with little to no capital, who may be unemployed, between jobs, or looking to start a side hustle. Tone must be plain, encouraging, and dignified — never patronising, never preachy.

Requirements:
- Ideas must be realistic for South Africa in 2026.
- Weight the batch toward low-capital and skills-accessible ideas — most South Africans starting out have very little money to invest.
- Mix the 5 ideas across different categories — don't repeat the same category twice unless unavoidable.
- Vary the ideas across batches. Avoid generic, overused suggestions (e.g. "start a blog", "become a social media influencer", "start a YouTube channel") unless given a genuinely fresh, specific angle.
- ZAR amounts in startupCost must be realistic for the South African context (e.g. "R0 – R500", "R2,000 – R5,000", "R15,000 – R30,000").

Respond ONLY with valid JSON — an object with a single key "ideas", an array of exactly 5 objects, each with:
- "title": string — short, concrete idea name (e.g. "Mobile Car Wash for Office Parks")
- "category": one of ["Services", "Food & Trade", "Digital", "Green/Agri", "Skills & Education"]
- "emoji": string — one relevant emoji
- "whatItIs": string — 2-3 sentences, plain language, explaining the idea
- "whyInDemand": string — 2-3 sentences on why this is in high demand in South Africa right now
- "startupCost": string — honest ZAR range to start
- "howToStart": array of 3-5 strings — concrete first steps an unemployed person with little money can take this week
- "whereTheMarket": string — where the customers physically or digitally are (e.g. townships, office parks, schools, Facebook Marketplace, WhatsApp groups, churches, taxi ranks, complexes)
- "howToFindClients": string — practical client-acquisition tactics for someone with no marketing budget (word of mouth scripts, WhatsApp status, community groups, flyers, partnerships)
- "howToScale": string — the path from first client to a real business (hiring, equipment, pricing up, formalising), pointing to SEDA/NYDA/IDC support where relevant

No markdown. No preamble. No explanation. Output the JSON object only.`,
      messages: [{ role: "user", content: "Generate this batch's 5 business ideas." }],
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
    && VALID_CATEGORIES.includes(idea.category)
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

  await db.doc("aiTrends/latest").set({
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
      const cacheSnap = await db.doc("aiTrends/latest").get();
      if (cacheSnap.exists) {
        const cached = cacheSnap.data();
        // Migration: old shape used `trends` — treat as expired and regenerate
        if (Array.isArray(cached.ideas)) {
          const generatedAt = cached.generatedAt?.toDate?.()?.getTime() || 0;
          if (Date.now() - generatedAt < CACHE_TTL_MS) {
            return res.status(200).json({ ideas: cached.ideas, generatedAt });
          }
        }
      }
    } catch (err) {
      console.error("Pulse cache read error:", err);
    }
  }

  // Generate fresh ideas
  try {
    const ideas = await generateIdeas(db);
    return res.status(200).json({ ideas, generatedAt: Date.now() });
  } catch (err) {
    console.error("Pulse generation error:", err);

    // Return stale cache as fallback rather than a blank screen
    try {
      const staleSnap = await db.doc("aiTrends/latest").get();
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
