const admin = require("firebase-admin");

/**
 * Returns the plan for a given uid: "founding_member", "free", or "premium".
 * For users created before plan logic was added, derives the plan from signupIndex
 * and backfills the field so future calls are instant.
 *
 * Usage in any AI tool API route:
 *   const plan = await getUserPlan(uid);
 *   if (plan !== "founding_member" && plan !== "premium") return res.status(403).json({ error: "Pro required" });
 */
module.exports = async function getUserPlan(uid) {
  const db = admin.firestore();
  const ref = db.collection("users").doc(uid);
  const snap = await ref.get();
  if (!snap.exists) return "free";

  const data = snap.data();

  if (data.plan) return data.plan;

  // Pre-plan user: derive from signupIndex.
  // No signupIndex means they registered before the counter existed — definitely founding member.
  const idx = data.signupIndex;
  const plan = !idx || idx <= 100 ? "founding_member" : "free";

  // Backfill so future calls skip this logic.
  ref
    .update({ plan, planAssignedAt: admin.firestore.FieldValue.serverTimestamp() })
    .catch(() => {});

  return plan;
};
