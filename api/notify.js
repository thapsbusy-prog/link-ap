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

/**
 * CRITICAL — FCM Notification Server Function
 *
 * Accepts: { recipientUid, title, body }
 * Fetches: fcmTokens array from Firestore for that user
 * Sends:   push to ALL of the user's devices simultaneously
 *
 * Uses sendEachForMulticast (not send) to support multiple
 * device tokens per user. Falls back to legacy fcmToken
 * string for accounts created before the array migration.
 *
 * Required Vercel environment variables:
 * - FIREBASE_PROJECT_ID
 * - FIREBASE_CLIENT_EMAIL
 * - FIREBASE_PRIVATE_KEY (must include quotes when pasting,
 *   e.g. "-----BEGIN PRIVATE KEY-----\n...\n-----END...")
 *
 * If notifications stop working, check Vercel function logs
 * at: vercel.com > link-ap > Logs > filter by /api/notify
 * A working call returns: { success: true, sent: N }
 * where N is the number of devices notified.
 */
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization || "";
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!idToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  let callerUid;
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    callerUid = decoded.uid;
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { recipientUid, title, body } = req.body;

  if (!recipientUid || !title) {
    return res.status(400).json({ error: "Missing recipientUid or title" });
  }

  const [matchDoc, receivedDoc] = await Promise.all([
    admin.firestore()
      .collection("users")
      .doc(recipientUid)
      .collection("matches")
      .doc(callerUid)
      .get(),
    admin.firestore()
      .collection("users")
      .doc(recipientUid)
      .collection("received")
      .doc(callerUid)
      .get(),
  ]);

  if (!matchDoc.exists && !receivedDoc.exists) {
    return res.status(403).json({ error: "Forbidden: no relationship with recipient" });
  }

  try {
    const userDoc = await admin.firestore()
      .collection("users")
      .doc(recipientUid)
      .collection("private")
      .doc("push")
      .get();

    const userData = userDoc.data();
    const tokens = userData?.fcmTokens ||
      (userData?.fcmToken ? [userData.fcmToken] : []);

    if (!tokens.length) {
      return res.json({ success: false, reason: "no_token" });
    }

    const message = {
      tokens,
      notification: { title, body: body || "" },
      data: {
        title,
        body: body || "",
        url: "/?tab=messages",
      },
      webpush: {
        fcmOptions: { link: "/?tab=messages" },
        notification: {
          icon: "/icons/icon-192.png",
          badge: "/icons/icon-192.png",
          requireInteraction: false,
        },
      },
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    return res.status(200).json({ success: true, sent: response.successCount, failed: response.failureCount });
  } catch (err) {
    console.error("FCM send error:", err);
    return res.status(500).json({ error: err.message });
  }
};
