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

const san = (s, max = 300) =>
  typeof s === "string" ? s.replace(/[<>]/g, "").trim().slice(0, max) : "";
const sanArr = (a, max = 15, itemMax = 80) =>
  Array.isArray(a) ? a.slice(0, max).map(s => san(s, itemMax)).filter(Boolean) : [];

async function scoreProfile(profile) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const profileText = `
Name: ${san(profile.name, 80)}
Title: ${san(profile.title, 80)}
Role: ${san(profile.role, 80)}
Pronouns: ${san(profile.pronouns, 30)}
Location: ${san(profile.location, 80)}
Bio: ${san(profile.bio, 500)}
Skills: ${sanArr(profile.skills).join(", ") || "none"}
What they bring: ${san(profile.bringToTable, 300)}
Looking for: ${sanArr(profile.lookingFor).join(", ") || "none"}
Currently exploring: ${sanArr(profile.currentlyExploring).join(", ") || "none"}
Achievements: ${sanArr(profile.achievements).join(", ") || "none"}
LinkedIn linked: ${profile.linkedinProfileUrl ? "yes" : "no"}
Photo uploaded: ${profile.photoURL ? "yes" : "no"}
`.trim();

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 800,
      system: `You are a professional profile coach for Link-Ap, an intent-first networking platform for African entrepreneurs and builders. Score the given profile across 5 dimensions, each out of 20 points. Be honest and specific — a good score should feel earned.

Dimensions:
1. Identity — photo uploaded, name, title/role, pronouns present and specific
2. Story — bio quality: is it specific, personal, and memorable? Does it say something real?
3. Skills & Value — skills listed, "what they bring" field is specific and compelling
4. Intent — lookingFor is clear and specific, currentlyExploring filled, details provided
5. Trust — LinkedIn linked, achievements listed

Respond ONLY with valid JSON, no markdown, no explanation:
{
  "dimensions": [
    { "name": "Identity", "score": <0-20>, "tip": "<one specific improvement, or null if score is 18+>" },
    { "name": "Story", "score": <0-20>, "tip": "<one specific improvement, or null if score is 18+>" },
    { "name": "Skills & Value", "score": <0-20>, "tip": "<one specific improvement, or null if score is 18+>" },
    { "name": "Intent", "score": <0-20>, "tip": "<one specific improvement, or null if score is 18+>" },
    { "name": "Trust", "score": <0-20>, "tip": "<one specific improvement, or null if score is 18+>" }
  ]
}`,
      messages: [{ role: "user", content: profileText }],
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

  const parsed = JSON.parse(jsonMatch[0]);
  const dims = parsed.dimensions;
  if (!Array.isArray(dims) || dims.length !== 5) throw new Error("Invalid dimensions");

  const total = dims.reduce((sum, d) => sum + (Number(d.score) || 0), 0);
  return { dimensions: dims, total };
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
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

  const db = admin.firestore();
  const cacheRef = db.doc(`users/${uid}/private/profileScore`);
  const forceRefresh = req.query.refresh === "true";

  // Serve from cache unless forceRefresh
  if (!forceRefresh) {
    try {
      const snap = await cacheRef.get();
      if (snap.exists) {
        const cached = snap.data();
        const scoredAt = cached.scoredAt?.toDate?.()?.getTime() || 0;
        if (Date.now() - scoredAt < CACHE_TTL_MS) {
          return res.status(200).json({
            total: cached.total,
            dimensions: cached.dimensions,
            scoredAt,
          });
        }
      }
    } catch (err) {
      console.error("Profile score cache read error:", err);
    }
  }

  // Fetch user profile from Firestore (server-side — never trust client-supplied data)
  let profile;
  try {
    const userSnap = await db.doc(`users/${uid}`).get();
    if (!userSnap.exists) return res.status(404).json({ error: "User not found" });
    profile = userSnap.data();
  } catch (err) {
    console.error("Profile fetch error:", err);
    return res.status(500).json({ error: "Failed to fetch profile" });
  }

  // Generate score
  try {
    const { dimensions, total } = await scoreProfile(profile);
    await cacheRef.set({
      total,
      dimensions,
      scoredAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return res.status(200).json({ total, dimensions, scoredAt: Date.now() });
  } catch (err) {
    console.error("Profile score generation error:", err);

    // Return stale cache rather than a blank card
    try {
      const staleSnap = await cacheRef.get();
      if (staleSnap.exists) {
        const cached = staleSnap.data();
        return res.status(200).json({
          total: cached.total,
          dimensions: cached.dimensions,
          scoredAt: cached.scoredAt?.toDate?.()?.getTime() || 0,
          stale: true,
        });
      }
    } catch {}

    return res.status(500).json({ error: "Failed to generate score" });
  }
};
