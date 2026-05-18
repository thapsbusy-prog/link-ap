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
  try {
    await admin.auth().verifyIdToken(idToken);
  } catch {
    return res.status(200).json({ explanation: null });
  }

  const { currentUser, targetUser } = req.body || {};
  if (!currentUser || !targetUser) {
    return res.status(400).json({ explanation: null });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY not set");
    return res.status(200).json({ explanation: null });
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
    return res.status(200).json({ explanation });
  } catch (err) {
    console.error("match-explain error:", err);
    return res.status(200).json({ explanation: null });
  }
};
