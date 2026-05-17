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
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization || "";
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!idToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    await admin.auth().verifyIdToken(idToken);
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { token, title, body } = req.body;

  if (!token || !title) {
    return res.status(400).json({ error: "Missing token or title" });
  }

  try {
    await admin.messaging().send({
      token,
      notification: { title, body: body || "" },
      data: {
        title,
        body: body || "",
        url: "/?tab=messages",
      },
      webpush: {
        fcmOptions: {
          link: "/?tab=messages",
        },
        notification: {
          icon: "/icons/icon-192.png",
          badge: "/icons/icon-192.png",
          requireInteraction: false,
        },
      },
    });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("FCM send error:", err);
    return res.status(500).json({ error: err.message });
  }
};
