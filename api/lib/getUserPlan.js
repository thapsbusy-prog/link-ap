const admin = require("firebase-admin");

/**
 * Returns the plan for a given uid: "founding_member", "free", or "premium".
 * Usage in any AI tool API route:
 *   const plan = await getUserPlan(uid);
 *   if (plan !== "founding_member" && plan !== "premium") return res.status(403).json({ error: "Pro required" });
 */
module.exports = async function getUserPlan(uid) {
  const db = admin.firestore();
  const snap = await db.collection("users").doc(uid).get();
  if (!snap.exists) return "free";
  return snap.data().plan || "free";
};
