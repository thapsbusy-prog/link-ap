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

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ explanation: null });
  }

  const idToken = (req.headers.authorization || "").replace("Bearer ", "");
  let uid;
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    uid = decoded.uid;
  } catch {
    return res.status(200).json({ explanation: null });
  }

  const { currentUser, targetUser } = req.body || {};
  if (!currentUser || !targetUser || !targetUser.uid) {
    return res.status(400).json({ explanation: null });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY not set");
    return res.status(200).json({ explanation: null });
  }

  const db = admin.firestore();
  const FieldValue = admin.firestore.FieldValue;

  // LAYER 2: Per-user rate limit — 100 calls per 60-minute window
  try {
    const rateLimitsRef = db.doc(`users/${uid}/private/rateLimits`);
    const snap = await rateLimitsRef.get();
    const now = Date.now();
    const windowMs = 60 * 60 * 1000;

    if (!snap.exists) {
      await rateLimitsRef.set({
        matchExplainCount: 1,
        matchExplainWindowStart: FieldValue.serverTimestamp(),
      });
    } else {
      const data = snap.data();
      const windowStart = data.matchExplainWindowStart?.toDate?.()?.getTime() || 0;
      const count = data.matchExplainCount || 0;

      if (now - windowStart > windowMs) {
        await rateLimitsRef.update({
          matchExplainCount: 1,
          matchExplainWindowStart: FieldValue.serverTimestamp(),
        });
      } else if (count >= 100) {
        return res.status(429).json({ error: "Rate limit exceeded. Try again later." });
      } else {
        await rateLimitsRef.update({
          matchExplainCount: FieldValue.increment(1),
        });
      }
    }
  } catch (err) {
    console.error("Rate limit check error:", err);
    // Fail open — Firestore error shouldn't block the feature
  }

  // LAYER 1: Server-side Firestore cache — 7-day TTL per user-pair
  const currentUid = uid;
  const targetUid = targetUser.uid;
  const cacheKey = `${currentUid}_${targetUid}`;
  const cacheRef = db.doc(`matchExplanations/${cacheKey}`);

  try {
    const cacheSnap = await cacheRef.get();
    if (cacheSnap.exists) {
      const cached = cacheSnap.data();
      const createdAt = cached.createdAt?.toDate?.();
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      if (createdAt && Date.now() - createdAt.getTime() < sevenDaysMs) {
        return res.status(200).json({ explanation: cached.explanation });
      }
    }
  } catch (err) {
    console.error("Cache read error:", err);
    // Proceed to Anthropic on cache read failure
  }

  try {
    const userMessage = `Current user profile:
- Role: ${currentUser.role || "not specified"}
- Skills: ${(currentUser.skills || []).join(", ") || "not specified"}
- Looking for: ${(currentUser.lookingFor || []).join(", ") || "not specified"}
- What they bring: ${currentUser.bringToTable || "not specified"}
- Currently exploring: ${(currentUser.currentlyExploring || []).join(", ") || "not specified"}
- Looking for details: ${JSON.stringify(currentUser.lookingForDetails || {})}

Target user profile (${targetUser.name}):
- Role: ${targetUser.role || "not specified"}
- Skills: ${(targetUser.skills || []).join(", ") || "not specified"}
- Looking for: ${(targetUser.lookingFor || []).join(", ") || "not specified"}
- What they bring: ${targetUser.bringToTable || "not specified"}
- Currently exploring: ${(targetUser.currentlyExploring || []).join(", ") || "not specified"}
- Looking for details: ${JSON.stringify(targetUser.lookingForDetails || {})}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 100,
        system: `You are a professional networking assistant for Link-Ap, an intent-first networking platform. Your job is to write a single, specific 2-sentence explanation of why two people should connect, based on their actual profile data. Be specific — reference their actual fields. Never be generic. Never say "you both work in tech". Focus on the concrete overlap between what one person offers and what the other is seeking right now. Write in second person addressing the current user. Max 40 words.`,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!response.ok) {
      console.error("Anthropic API error:", response.status, await response.text());
      return res.status(200).json({ explanation: null });
    }

    const data = await response.json();
    const explanation = data.content?.[0]?.text?.trim() || null;

    // Write to cache after a successful Anthropic response
    if (explanation) {
      try {
        await cacheRef.set({
          explanation,
          createdAt: FieldValue.serverTimestamp(),
          currentUid,
          targetUid,
        });
      } catch (err) {
        console.error("Cache write error:", err);
      }
    }

    return res.status(200).json({ explanation });
  } catch (err) {
    console.error("match-explain error:", err);
    return res.status(200).json({ explanation: null });
  }
};
