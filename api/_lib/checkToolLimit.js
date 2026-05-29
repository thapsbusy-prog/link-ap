const admin = require("firebase-admin");

// Checks and increments monthly tool usage.
// Returns { allowed: true } or { allowed: false, message }.
module.exports = async function checkToolLimit(uid, toolKey, limit = 5) {
  const db = admin.firestore();
  const ref = db.collection("users").doc(uid).collection("private").doc("toolLimits");
  const monthKey = new Date().toISOString().slice(0, 7); // "YYYY-MM"

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.exists ? snap.data() : {};
    const tool = data[toolKey] || { count: 0, monthKey: "" };

    if (tool.monthKey !== monthKey) {
      tool.count = 0;
      tool.monthKey = monthKey;
    }

    if (tool.count >= limit) {
      return {
        allowed: false,
        message:
          "Monthly limit reached — 5 AI generations per tool per month are included with your plan. Resets on the 1st.",
      };
    }

    tool.count += 1;
    tx.set(ref, { [toolKey]: tool }, { merge: true });
    return { allowed: true };
  });
};
