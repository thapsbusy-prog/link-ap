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
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  let uid;
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    uid = decoded.uid;
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }

  try {
    const db = admin.firestore();

    // Idempotency — if this user already has a signupIndex, return it without touching the counter.
    // Prevents double-counting if the client retries after a network failure between /api/register
    // succeeding and the subsequent setDoc completing.
    const userSnap = await db.collection("users").doc(uid).get();
    if (userSnap.exists && userSnap.data().signupIndex) {
      const d = userSnap.data();
      return res.status(200).json({ signupIndex: d.signupIndex, plan: d.plan });
    }

    const statsRef = db.collection("meta").doc("stats");

    let signupIndex;
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(statsRef);
      const current = snap.exists ? (snap.data().totalUsers || 0) : 0;
      signupIndex = current + 1;
      tx.set(statsRef, { totalUsers: signupIndex }, { merge: true });
    });

    const plan = signupIndex <= 100 ? "founding_member" : "free";
    return res.status(200).json({ signupIndex, plan });
  } catch (err) {
    console.error("register transaction error:", err);
    return res.status(500).json({ error: "Failed to assign signup index" });
  }
};
