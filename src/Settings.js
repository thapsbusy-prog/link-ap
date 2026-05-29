import { useState, useEffect } from "react";
import { db, auth, getFCMToken } from "./firebase";
import { doc, setDoc, collection, getDocs, deleteDoc, updateDoc, deleteField, arrayUnion, getDoc } from "firebase/firestore";
import { signOut, sendPasswordResetEmail } from "firebase/auth";
import { COLORS, Avatar, TermsContent } from "./shared";
import QuoteGenerator from "./LinkApQuoteGenerator";
import PurposeCardGenerator from "./PurposeCardGenerator";

// Props:
//   user          — Firestore profile object ({ name, ... })
//   firebaseUser  — Firebase Auth user ({ uid, email, providerData, delete() })
//   onEditProfile — () => void — navigate to profile editing
//   blocked       — array of blocked user objects ({ uid, avatar, color, photoURL, name, role })
//   onUnblock     — (uid: string) => void

export default function Settings({ user, firebaseUser, onEditProfile, blocked, onUnblock }) {
  const [showTerms, setShowTerms] = useState(false);
  const [showBlockList, setShowBlockList] = useState(false);
  const [showContentStudio, setShowContentStudio] = useState(false);
  const [showPurposeStudio, setShowPurposeStudio] = useState(false);
  const isAdmin = firebaseUser.email === "thaps.busy@gmail.com";
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [accountLoading, setAccountLoading] = useState(null);
  const [accountError, setAccountError] = useState("");
  const [pwResetMsg, setPwResetMsg] = useState("");
  const [pwResetLoading, setPwResetLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const v = localStorage.getItem("linkap_sound");
    if (v === null) { localStorage.setItem("linkap_sound", "true"); return true; }
    return v === "true";
  });
  const [vibrateEnabled, setVibrateEnabled] = useState(() => {
    const v = localStorage.getItem("linkap_vibrate");
    if (v === null) { localStorage.setItem("linkap_vibrate", "true"); return true; }
    return v === "true";
  });

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem("linkap_sound", String(next));
  };
  const toggleVibrate = () => {
    const next = !vibrateEnabled;
    setVibrateEnabled(next);
    localStorage.setItem("linkap_vibrate", String(next));
  };

  const [notifEnabled, setNotifEnabled] = useState(true);
  const [notifBlocked, setNotifBlocked] = useState(
    typeof Notification !== "undefined" && Notification.permission === "denied"
  );
  const [notifLoading, setNotifLoading] = useState(true);

  const doEnableNotifications = async () => {
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "denied") {
      setNotifBlocked(true);
      setNotifEnabled(false);
      return;
    }
    let perm = Notification.permission;
    if (perm === "default") perm = await Notification.requestPermission();
    if (perm === "granted") {
      const token = await getFCMToken();
      if (token) {
        await setDoc(doc(db, "users", firebaseUser.uid, "private", "push"), { fcmTokens: arrayUnion(token) }, { merge: true });
        setNotifEnabled(true);
        setNotifBlocked(false);
      }
    } else {
      setNotifBlocked(true);
      setNotifEnabled(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", firebaseUser.uid, "private", "push"));
        const d = snap.data();
        if (d?.fcmTokens?.length > 0) {
          setNotifEnabled(true);
        } else {
          await doEnableNotifications();
        }
      } catch {
        await doEnableNotifications();
      } finally {
        setNotifLoading(false);
      }
    })();
  }, [firebaseUser.uid]); // eslint-disable-line

  const doDisableNotifications = async () => {
    await setDoc(doc(db, "users", firebaseUser.uid, "private", "push"), { fcmTokens: [] }, { merge: true });
    try {
      await updateDoc(doc(db, "users", firebaseUser.uid), { fcmToken: deleteField() });
    } catch {}
  };

  const toggleNotifications = () => {
    if (notifLoading) return;
    const newValue = !notifEnabled;
    setNotifEnabled(newValue); // update visual immediately — same as Sound and Vibrate

    if (newValue) {
      doEnableNotifications().catch(err => {
        console.error("[Notifications] enable failed:", err);
      });
    } else {
      console.log("[Notifications] disable path triggered");
      doDisableNotifications().catch(err => {
        console.error("[Notifications] disable failed:", err);
        setNotifEnabled(true); // revert on actual failure
      });
    }
  };

  const toggle = (on) => (
    <div style={{ width: 44, height: 26, borderRadius: 13, background: on ? COLORS.accent : COLORS.border, position: "relative", cursor: "pointer" }}>
      <div style={{ position: "absolute", top: 4, left: on ? 22 : 4, width: 18, height: 18, borderRadius: "50%", background: COLORS.text, transition: "left 0.15s" }} />
    </div>
  );

  const isEmailUser = firebaseUser.providerData.some(p => p.providerId === "password");

  const sectionLabel = (text) => (
    <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>{text}</div>
  );

  const settingsRow = (label, right, onClick, extraStyle = {}) => (
    <button onClick={onClick} style={{
      width: "100%", background: "none", border: "none", cursor: "pointer",
      padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center",
      ...extraStyle,
    }}>
      <span style={{ fontSize: 14, color: COLORS.text }}>{label}</span>
      {right}
    </button>
  );

  async function handleSendPasswordReset() {
    setPwResetLoading(true);
    setPwResetMsg("");
    try {
      await sendPasswordResetEmail(auth, firebaseUser.email);
      setPwResetMsg("Reset email sent — check your inbox.");
    } catch {
      setPwResetMsg("Failed to send reset email. Please try again.");
    }
    setPwResetLoading(false);
  }

  async function handleDeactivate() {
    setAccountLoading("deactivate");
    setAccountError("");
    try {
      await setDoc(doc(db, "users", firebaseUser.uid), { deactivated: true }, { merge: true });
      await signOut(auth);
    } catch (e) {
      setAccountError("Something went wrong. Please try again.");
      setAccountLoading(null);
    }
  }

  async function handleDelete() {
    setAccountLoading("delete");
    setAccountError("");
    try {
      const uid = firebaseUser.uid;

      // Read all subcollections first so we have UIDs for bilateral cleanup
      const [matchesSnap, sentSnap, receivedSnap, blockedSnap, blockedBySnap, passedSnap] = await Promise.all([
        getDocs(collection(db, "users", uid, "matches")),
        getDocs(collection(db, "users", uid, "sent")),
        getDocs(collection(db, "users", uid, "received")),
        getDocs(collection(db, "users", uid, "blocked")),
        getDocs(collection(db, "users", uid, "blockedBy")),
        getDocs(collection(db, "users", uid, "passed")),
      ]);

      const matchUids = matchesSnap.docs.map(d => d.id);
      const sentUids = sentSnap.docs.map(d => d.id);
      const receivedUids = receivedSnap.docs.map(d => d.id);
      const blockedUids = blockedSnap.docs.map(d => d.id);
      const blockedByUids = blockedBySnap.docs.map(d => d.id);

      // Delete all of this user's own subcollection docs
      await Promise.all([
        ...matchesSnap.docs.map(d => deleteDoc(d.ref)),
        ...sentSnap.docs.map(d => deleteDoc(d.ref)),
        ...receivedSnap.docs.map(d => deleteDoc(d.ref)),
        ...blockedSnap.docs.map(d => deleteDoc(d.ref)),
        ...blockedBySnap.docs.map(d => deleteDoc(d.ref)),
        ...passedSnap.docs.map(d => deleteDoc(d.ref)),
      ]);

      // Bilateral cleanup on other users' subcollections
      await Promise.all([
        // Remove this user from matched users' match/sent/received docs
        ...matchUids.map(otherUid => deleteDoc(doc(db, "users", otherUid, "matches", uid))),
        ...matchUids.map(otherUid => deleteDoc(doc(db, "users", otherUid, "sent", uid))),
        ...matchUids.map(otherUid => deleteDoc(doc(db, "users", otherUid, "received", uid))),
        // Remove this user from pending sent/received on non-matched users
        ...sentUids.map(recipientUid => deleteDoc(doc(db, "users", recipientUid, "received", uid))),
        ...receivedUids.map(senderUid => deleteDoc(doc(db, "users", senderUid, "sent", uid))),
        // Remove this user from other users' blocked/blockedBy docs
        ...blockedUids.map(blockedUid => deleteDoc(doc(db, "users", blockedUid, "blockedBy", uid))),
        ...blockedByUids.map(blockerUid => deleteDoc(doc(db, "users", blockerUid, "blocked", uid))),
      ]);

      // Delete all chat messages for every conversation this user participated in
      // Chat IDs are the two participant UIDs sorted and joined with "_"
      await Promise.all(
        matchUids.map(async otherUid => {
          const chatId = [uid, otherUid].sort().join("_");
          const msgsSnap = await getDocs(collection(db, "chats", chatId, "messages"));
          await Promise.all(msgsSnap.docs.map(d => deleteDoc(d.ref)));
        })
      );

      // Delete the top-level user document, then the Firebase Auth account
      await deleteDoc(doc(db, "users", uid));
      await firebaseUser.delete();
    } catch (e) {
      if (e.code === "auth/requires-recent-login") {
        setAccountError("For security, please sign out and sign back in before deleting your account.");
      } else {
        setAccountError("Something went wrong. Please try again.");
      }
      setAccountLoading(null);
    }
  }

  if (showContentStudio) {
    return (
      <div style={{ background: COLORS.bg, minHeight: "100%" }}>
        <div style={{
          position: "sticky", top: 0, background: COLORS.bg, zIndex: 10,
          padding: "16px 20px", borderBottom: `1px solid ${COLORS.border}`,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <button
            onClick={() => setShowContentStudio(false)}
            style={{ background: "none", border: "none", color: COLORS.text, cursor: "pointer", padding: 0, fontSize: 22, lineHeight: 1 }}
          >‹</button>
          <div style={{ fontWeight: 700, color: COLORS.text, fontSize: 16 }}>Content Studio</div>
        </div>
        <QuoteGenerator />
      </div>
    );
  }

  if (showPurposeStudio) {
    return (
      <div style={{ background: COLORS.bg, minHeight: "100%" }}>
        <div style={{
          position: "sticky", top: 0, background: COLORS.bg, zIndex: 10,
          padding: "16px 20px", borderBottom: `1px solid ${COLORS.border}`,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <button
            onClick={() => setShowPurposeStudio(false)}
            style={{ background: "none", border: "none", color: COLORS.text, cursor: "pointer", padding: 0, fontSize: 22, lineHeight: 1 }}
          >‹</button>
          <div style={{ fontWeight: 700, color: COLORS.text, fontSize: 16 }}>Purpose Cards</div>
        </div>
        <PurposeCardGenerator />
      </div>
    );
  }

  if (showBlockList) {
    return (
      <div style={{ padding: "24px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <button onClick={() => setShowBlockList(false)} style={{ background: "none", border: "none", color: COLORS.text, cursor: "pointer", padding: 0, fontSize: 22, lineHeight: 1 }}>‹</button>
          <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.text }}>Block List</div>
        </div>
        {(!blocked || blocked.length === 0) ? (
          <div style={{ color: COLORS.textMuted, fontSize: 14, textAlign: "center", marginTop: 60 }}>No blocked users.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {blocked.map(u => (
              <div key={u.uid} style={{
                background: COLORS.card, border: `1px solid ${COLORS.border}`,
                borderRadius: 16, padding: 16, display: "flex", gap: 12, alignItems: "center",
              }}>
                <Avatar initials={u.avatar} color={u.color} size={44} photoURL={u.photoURL} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.text }}>{u.name}</div>
                  <div style={{ color: u.color, fontSize: 12 }}>{u.role}</div>
                </div>
                <button onClick={() => onUnblock(u.uid)} style={{
                  padding: "7px 14px", borderRadius: 10, border: `1px solid ${COLORS.border}`,
                  background: "transparent", color: COLORS.text, cursor: "pointer", fontSize: 12,
                }}>Unblock</button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const chevron = <span style={{ color: COLORS.textMuted, fontSize: 16 }}>›</span>;
  const rowDivider = { borderBottom: `1px solid ${COLORS.border}` };

  return (
    <div style={{ padding: "24px 16px" }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.text, marginBottom: 24 }}>Settings</div>

      {/* Notifications */}
      <div style={{ marginBottom: 24 }}>
        {sectionLabel("Notifications")}
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: "hidden" }}>
          <div onClick={toggleNotifications} style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${COLORS.border}`, cursor: notifLoading ? "default" : "pointer" }}>
            <span style={{ fontSize: 14, color: COLORS.text }}>Notifications</span>
            {toggle(notifEnabled)}
          </div>
          {notifBlocked && (
            <div style={{ padding: "8px 16px", fontSize: 12, color: COLORS.textMuted, borderBottom: `1px solid ${COLORS.border}` }}>
              Notifications are blocked in your browser. Go to browser Settings &gt; Site Settings to allow them.
            </div>
          )}
          <div onClick={toggleSound} style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${COLORS.border}`, cursor: "pointer" }}>
            <span style={{ fontSize: 14, color: COLORS.text }}>Message Sound</span>
            {toggle(soundEnabled)}
          </div>
          <div onClick={toggleVibrate} style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
            <span style={{ fontSize: 14, color: COLORS.text }}>Vibrate</span>
            {toggle(vibrateEnabled)}
          </div>
        </div>
      </div>

      {/* Account */}
      <div style={{ marginBottom: 24 }}>
        {sectionLabel("Account")}
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "14px 16px", borderBottom: `1px solid ${COLORS.border}` }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 2 }}>Name</div>
            <div style={{ fontSize: 14, color: COLORS.text }}>{user.name}</div>
          </div>
          <div style={{ padding: "14px 16px", borderBottom: `1px solid ${COLORS.border}` }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 2 }}>Email</div>
            <div style={{ fontSize: 14, color: COLORS.text }}>{firebaseUser.email}</div>
          </div>
          {settingsRow("Edit Profile", chevron, onEditProfile, isEmailUser ? rowDivider : {})}
          {isEmailUser && (
            <div style={{ padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, color: COLORS.text }}>Change Password</span>
                <button onClick={handleSendPasswordReset} disabled={pwResetLoading} style={{
                  background: "none", border: `1px solid ${COLORS.border}`, color: COLORS.accent,
                  borderRadius: 8, padding: "5px 12px", cursor: pwResetLoading ? "default" : "pointer", fontSize: 12,
                }}>{pwResetLoading ? "Sending…" : "Send Reset Email"}</button>
              </div>
              {pwResetMsg && <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 6 }}>{pwResetMsg}</div>}
            </div>
          )}
        </div>
      </div>

      {/* Privacy */}
      <div style={{ marginBottom: 24 }}>
        {sectionLabel("Privacy")}
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: "hidden" }}>
          {settingsRow("Block List", chevron, () => setShowBlockList(true))}
        </div>
      </div>

      {/* About */}
      <div style={{ marginBottom: 24 }}>
        {sectionLabel("About")}
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: "hidden" }}>
          {settingsRow("Terms of Service", chevron, () => setShowTerms(true), rowDivider)}
          <div style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14, color: COLORS.text }}>App Version</span>
            <span style={{ fontSize: 13, color: COLORS.textMuted }}>1.1.0 Beta</span>
          </div>
        </div>
      </div>

      {/* Creator Tools — admin only */}
      {isAdmin && (
        <div style={{ marginBottom: 24 }}>
          {sectionLabel("Creator Tools")}
          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: "hidden" }}>
            <button
              onClick={() => setShowContentStudio(true)}
              style={{
                width: "100%", background: "none", border: "none", cursor: "pointer",
                padding: "14px 16px", display: "flex", alignItems: "center", gap: 12,
              }}
            >
              <span style={{ fontSize: 18, lineHeight: 1 }}>✦</span>
              <span style={{ flex: 1, fontSize: 14, color: COLORS.text, textAlign: "left" }}>Quote Card Generator</span>
              <span style={{ color: COLORS.textMuted, fontSize: 16 }}>›</span>
            </button>
            <button
              onClick={() => setShowPurposeStudio(true)}
              style={{
                width: "100%", background: "none", border: "none", cursor: "pointer",
                padding: "14px 16px", display: "flex", alignItems: "center", gap: 12,
                borderTop: `1px solid ${COLORS.border}`,
              }}
            >
              <span style={{ fontSize: 18, lineHeight: 1 }}>◈</span>
              <span style={{ flex: 1, fontSize: 14, color: COLORS.text, textAlign: "left" }}>Purpose Card Generator</span>
              <span style={{ color: COLORS.textMuted, fontSize: 16 }}>›</span>
            </button>
          </div>
        </div>
      )}

      {/* Account Actions */}
      <div style={{ marginBottom: 24 }}>
        {sectionLabel("Account Actions")}
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: "hidden" }}>
          <button onClick={() => signOut(auth)} style={{
            width: "100%", background: "none", border: "none", cursor: "pointer",
            padding: "14px 16px", display: "flex", alignItems: "center", gap: 12,
            borderBottom: `1px solid ${COLORS.border}`,
          }}>
            <svg viewBox="0 0 24 24" fill={COLORS.red} width="20" height="20">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4C2.9 3 2 3.9 2 5v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
            </svg>
            <span style={{ flex: 1, fontSize: 14, color: COLORS.red, textAlign: "left" }}>Sign Out</span>
            <span style={{ color: COLORS.textMuted, fontSize: 18, lineHeight: 1 }}>›</span>
          </button>
          <button onClick={() => { setAccountError(""); setShowDeactivateConfirm(true); }} style={{
            width: "100%", background: "none", border: "none", cursor: "pointer",
            padding: "14px 16px", display: "flex", alignItems: "center", gap: 12,
            borderBottom: `1px solid ${COLORS.border}`,
          }}>
            <svg viewBox="0 0 24 24" fill={COLORS.accent} width="20" height="20">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <span style={{ flex: 1, fontSize: 14, color: COLORS.accent, textAlign: "left" }}>Deactivate Account</span>
            <span style={{ color: COLORS.textMuted, fontSize: 18, lineHeight: 1 }}>›</span>
          </button>
          <button onClick={() => { setAccountError(""); setShowDeleteConfirm(true); }} style={{
            width: "100%", background: "none", border: "none", cursor: "pointer",
            padding: "14px 16px", display: "flex", alignItems: "center", gap: 12,
          }}>
            <svg viewBox="0 0 24 24" fill={COLORS.red} width="20" height="20">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
            <span style={{ flex: 1, fontSize: 14, color: COLORS.red, textAlign: "left" }}>Delete Account</span>
            <span style={{ color: COLORS.textMuted, fontSize: 18, lineHeight: 1 }}>›</span>
          </button>
        </div>
      </div>

      {/* Terms modal */}
      {showTerms && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 50,
          display: "flex", alignItems: "flex-end", justifyContent: "center",
        }} onClick={() => setShowTerms(false)}>
          <div style={{
            background: COLORS.card, borderRadius: "16px 16px 0 0", width: "100%", maxWidth: 430,
            maxHeight: "80dvh", overflowY: "auto", padding: 24,
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontWeight: 700, color: COLORS.text }}>Terms of Service</div>
              <button onClick={() => setShowTerms(false)} style={{ background: "none", border: "none", color: COLORS.textMuted, fontSize: 20, cursor: "pointer" }}>×</button>
            </div>
            <TermsContent />
          </div>
        </div>
      )}

      {/* Deactivate confirmation */}
      {showDeactivateConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, width: "100%", maxWidth: 380, padding: 24 }}>
            <div style={{ fontWeight: 800, color: COLORS.text, fontSize: 17, marginBottom: 10 }}>Deactivate Account?</div>
            <p style={{ color: COLORS.textMuted, fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
              Your account will be hidden from all users. Your data is kept. To reactivate, email{" "}
              <a href="mailto:info@link-ap.online" style={{ color: COLORS.accent, textDecoration: "none" }}>info@link-ap.online</a>
            </p>
            {accountError && <div style={{ color: COLORS.red, fontSize: 13, marginBottom: 12 }}>{accountError}</div>}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowDeactivateConfirm(false)} style={{ flex: 1, padding: "12px", borderRadius: 10, border: `1px solid ${COLORS.border}`, background: "none", color: COLORS.text, cursor: "pointer", fontSize: 14 }}>Cancel</button>
              <button onClick={handleDeactivate} disabled={accountLoading === "deactivate"} style={{ flex: 1, padding: "12px", borderRadius: 10, border: "none", background: COLORS.accent, color: "#000", cursor: accountLoading === "deactivate" ? "default" : "pointer", fontSize: 14, fontWeight: 700 }}>
                {accountLoading === "deactivate" ? "Deactivating…" : "Deactivate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, width: "100%", maxWidth: 380, padding: 24 }}>
            <div style={{ fontWeight: 800, color: COLORS.red, fontSize: 17, marginBottom: 10 }}>Permanently Delete Account?</div>
            <p style={{ color: COLORS.textMuted, fontSize: 14, lineHeight: 1.6, marginBottom: 8 }}>
              This action is <strong style={{ color: COLORS.text }}>irreversible</strong>. Your profile, matches, messages, and all associated data will be permanently erased and cannot be recovered.
            </p>
            <p style={{ color: COLORS.textMuted, fontSize: 13, marginBottom: 20 }}>
              Deleting account for: <strong style={{ color: COLORS.text }}>{firebaseUser?.email}</strong>
            </p>
            {accountError && <div style={{ color: COLORS.red, fontSize: 13, marginBottom: 12 }}>{accountError}</div>}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowDeleteConfirm(false)} style={{ flex: 1, padding: "12px", borderRadius: 10, border: `1px solid ${COLORS.border}`, background: "none", color: COLORS.text, cursor: "pointer", fontSize: 14 }}>Cancel</button>
              <button onClick={handleDelete} disabled={accountLoading === "delete"} style={{ flex: 1, padding: "12px", borderRadius: 10, border: "none", background: COLORS.red, color: "#fff", cursor: accountLoading === "delete" ? "default" : "pointer", fontSize: 14, fontWeight: 700 }}>
                {accountLoading === "delete" ? "Deleting…" : "Delete Forever"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
