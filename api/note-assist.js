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
const sanArr = (a, max = 8, itemMax = 60) =>
  Array.isArray(a) ? a.slice(0, max).map(s => san(s, itemMax)).filter(Boolean) : [];

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ note: null });
  }

  const idToken = (req.headers.authorization || "").replace("Bearer ", "");
  let currentUid;
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    currentUid = decoded.uid;
  } catch {
    return res.status(401).json({ note: null });
  }

  const { targetUid } = req.body || {};
  if (!targetUid || typeof targetUid !== "string") {
    return res.status(400).json({ note: null });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY not set");
    return res.status(200).json({ note: null });
  }

  const db = admin.firestore();

  // Fetch both profiles server-side
  let sender, recipient;
  try {
    const [snapA, snapB] = await Promise.all([
      db.doc(`users/${currentUid}`).get(),
      db.doc(`users/${targetUid}`).get(),
    ]);
    if (!snapA.exists || !snapB.exists) return res.status(200).json({ note: null });
    sender = snapA.data();
    recipient = snapB.data();
  } catch (err) {
    console.error("Profile fetch error:", err);
    return res.status(200).json({ note: null });
  }

  const describe = (p) => [
    `Role: ${san(p.role, 80) || "not listed"}`,
    `Skills: ${sanArr(p.skills).join(", ") || "not listed"}`,
    `Looking for: ${sanArr(p.lookingFor).join(", ") || "not listed"}`,
    `What they bring: ${san(p.bringToTable, 150) || "not listed"}`,
    `Currently exploring: ${sanArr(p.currentlyExploring).join(", ") || "not listed"}`,
  ].join("; ");

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
        max_tokens: 200,
        system: `You write first-person connection notes for professionals on Link-Ap, an intent-first networking platform. The note is from the sender to the recipient. Write exactly one note. It must:
- Be 80–200 characters total (short — like a message, not an essay)
- Sound like a real person wrote it, not a bot
- Reference something specific from the sender's goals and the recipient's profile (skill, role, or what they're looking for)
- End with a clear reason or question that invites a reply
- Never start with "Hi" or "Hey" or "Hello"
- Never be generic ("I saw your profile", "I'd love to connect")

Output only the note text. No quotes. No explanation.`,
        messages: [{
          role: "user",
          content: `Sender (writing the note): ${describe(sender)}\n\nRecipient (${san(recipient.name, 60)}): ${describe(recipient)}`,
        }],
      }),
    });

    if (!response.ok) {
      console.error("Anthropic error:", response.status);
      return res.status(200).json({ note: null });
    }

    const data = await response.json();
    const note = data.content?.[0]?.text?.trim() || null;
    return res.status(200).json({ note });
  } catch (err) {
    console.error("note-assist error:", err);
    return res.status(200).json({ note: null });
  }
};
