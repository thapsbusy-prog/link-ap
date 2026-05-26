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

const san = (s, max = 200) =>
  typeof s === "string" ? s.replace(/[<>]/g, "").trim().slice(0, max) : "";
const sanArr = (a, max = 10, itemMax = 60) =>
  Array.isArray(a) ? a.slice(0, max).map(s => san(s, itemMax)).filter(Boolean) : [];

async function generateStarters(profileA, profileB) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const describe = (p) =>
    `Name: ${san(p.name, 60)}, Role: ${san(p.role, 80)}, Skills: ${sanArr(p.skills).join(", ") || "not listed"}, Looking for: ${sanArr(p.lookingFor).join(", ") || "not listed"}, What they bring: ${san(p.bringToTable, 150) || "not listed"}, Currently exploring: ${sanArr(p.currentlyExploring).join(", ") || "not listed"}`;

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
      system: `You write conversation starters for two people who just connected on Link-Ap, a professional networking platform. Generate exactly 3 openers. Each must:
- Sound like something a real person would genuinely say, not a bot
- Be specific to their actual profiles — name a real skill, goal, or interest from their data
- Be under 12 words
- Be a question or a sharp observation that invites a reply
- Never start with "Hi", "Hey", or "Hello"

Respond ONLY with a JSON array of exactly 3 strings. No markdown. No explanation. Example format:
["opener one", "opener two", "opener three"]`,
      messages: [{
        role: "user",
        content: `Person A: ${describe(profileA)}\n\nPerson B: ${describe(profileB)}`,
      }],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Anthropic ${response.status}: ${body.slice(0, 200)}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text?.trim() || "";
  const jsonMatch = text.match(/\[[\s\S]*?\]/);
  if (!jsonMatch) throw new Error("No JSON array in response");

  const starters = JSON.parse(jsonMatch[0]);
  if (!Array.isArray(starters) || starters.length === 0) throw new Error("Empty starters array");

  return starters
    .filter(s => typeof s === "string" && s.trim().length > 0)
    .slice(0, 3)
    .map(s => s.trim());
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const idToken = (req.headers.authorization || "").replace("Bearer ", "");
  let currentUid;
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    currentUid = decoded.uid;
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { partnerUid } = req.query;
  if (!partnerUid || typeof partnerUid !== "string") {
    return res.status(400).json({ error: "partnerUid required" });
  }

  const chatId = [currentUid, partnerUid].sort().join("_");
  const db = admin.firestore();
  const cacheRef = db.doc(`chatStarters/${chatId}`);

  // Starters are generated once and never expire — permanent cache
  try {
    const snap = await cacheRef.get();
    if (snap.exists) {
      return res.status(200).json({ starters: snap.data().starters });
    }
  } catch (err) {
    console.error("Chat starters cache read error:", err);
  }

  // Fetch both profiles server-side
  let profileA, profileB;
  try {
    const [snapA, snapB] = await Promise.all([
      db.doc(`users/${currentUid}`).get(),
      db.doc(`users/${partnerUid}`).get(),
    ]);
    if (!snapA.exists || !snapB.exists) {
      return res.status(404).json({ error: "One or both users not found" });
    }
    profileA = snapA.data();
    profileB = snapB.data();
  } catch (err) {
    console.error("Profile fetch error:", err);
    return res.status(500).json({ error: "Failed to fetch profiles" });
  }

  // Generate starters
  try {
    const starters = await generateStarters(profileA, profileB);
    await cacheRef.set({
      starters,
      chatId,
      generatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return res.status(200).json({ starters });
  } catch (err) {
    console.error("Chat starters generation error:", err);
    return res.status(500).json({ error: "Failed to generate starters" });
  }
};
