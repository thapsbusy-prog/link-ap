import { useState, useEffect, useRef, Component } from "react";
import logoImg from "./link-ap-logo.png";
import { db, auth, messaging, onMessage, getFCMToken } from "./firebase";
import {
  collection, onSnapshot, query,
  orderBy, serverTimestamp, doc, setDoc, getDoc, deleteDoc,
  getDocs, startAfter, limit, where,
} from "firebase/firestore";
import {
  onAuthStateChanged,
} from "firebase/auth";
import PrivacyPolicy from './PrivacyPolicy';
import { COLORS, Avatar, LocationPin } from "./shared";
import { Messages } from "./Messages";
import { Profile } from "./Profile";
import AuthScreen from "./AuthScreen";
import Onboarding from "./Onboarding";
import Settings from "./Settings";
import { Matches } from "./Matches";
import { Discover, PublicProfile } from "./Discover";

function playBeep() {
  try {
    if (localStorage.getItem("linkap_sound") !== "true") return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const doPlay = () => {
      // Two-tone descending chime: D6 then A5
      [[1174, 0], [880, 0.18]].forEach(([freq, delay]) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0, ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + delay + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.35);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.4);
      });
    };
    if (ctx.state === "running") {
      doPlay();
    } else if (ctx.state === "suspended") {
      ctx.resume().then(doPlay).catch(() => {});
    }
  } catch {}
}

function triggerVibrate() {
  try {
    if (localStorage.getItem("linkap_vibrate") !== "true") return;
    if (!document.hasFocus()) return;
    navigator.vibrate([100, 50, 100, 50, 100, 50, 100, 50, 100]);
  } catch {}
}


function MainApp({ user, firebaseUser, onProfileUpdate }) {
  const [tab, setTab] = useState(() => {
    const urlTab = new URLSearchParams(window.location.search).get("tab");
    return ["discover", "matches", "messages", "profile", "settings"].includes(urlTab) ? urlTab : "profile";
  });
  const [allUsers, setAllUsers] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [matches, setMatches] = useState([]);
  const [sent, setSent] = useState([]);
  const [passed, setPassed] = useState(new Set());
  const [received, setReceived] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  const [notification, setNotification] = useState(null);
  const [unreadChats, setUnreadChats] = useState(new Set());
  const [lastMessages, setLastMessages] = useState({});
  const [viewingProfile, setViewingProfile] = useState(null);
  const [profileEditTrigger, setProfileEditTrigger] = useState(0);
  const [seenUids, setSeenUids] = useState(new Set());

  const lastDocRef = useRef(null);
  const hasMoreRef = useRef(true);
  const loadingMoreRef = useRef(false);
  const tabRef = useRef(tab);
  const activeChatRef = useRef(activeChat);

  const loadMoreUsers = async () => {
    if (loadingMoreRef.current || !hasMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const PAGE = 30;
      const q = lastDocRef.current
        ? query(collection(db, "users"), where("deactivated", "!=", true), orderBy("deactivated"), orderBy("createdAt"), startAfter(lastDocRef.current), limit(PAGE))
        : query(collection(db, "users"), where("deactivated", "!=", true), orderBy("deactivated"), orderBy("createdAt"), limit(PAGE));
      const snap = await getDocs(q);
      const newUsers = snap.docs.map(d => d.data()).filter(u => u.uid !== firebaseUser.uid && !u.deactivated);
      lastDocRef.current = snap.docs[snap.docs.length - 1] ?? null;
      hasMoreRef.current = snap.docs.length === PAGE;
      setHasMore(hasMoreRef.current);
      setAllUsers(prev => [...(prev ?? []), ...newUsers]);
    } catch (e) {
      console.error("Failed to load users:", e);
    }
    loadingMoreRef.current = false;
    setLoadingMore(false);
  };

  useEffect(() => { loadMoreUsers(); }, []); // eslint-disable-line

  useEffect(() => {
    (async () => {
      try {
        if (typeof Notification === "undefined") return;
        if (Notification.permission === "granted") {
          const token = await getFCMToken();
          if (token && !user.fcmToken) {
            await setDoc(doc(db, "users", firebaseUser.uid), { fcmToken: token }, { merge: true });
          }
        } else if (Notification.permission === "default") {
          const permission = await Notification.requestPermission();
          if (permission === "granted") {
            const token = await getFCMToken();
            if (token) {
              await setDoc(doc(db, "users", firebaseUser.uid), { fcmToken: token }, { merge: true });
            }
          }
        }
      } catch (e) {
        console.warn("Auto notification setup error:", e);
      }
    })();
  }, []); // eslint-disable-line

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users", firebaseUser.uid, "matches"), snap => {
      setMatches(snap.docs.map(d => d.data()));
    });
    return unsub;
  }, [firebaseUser.uid]);

  useEffect(() => { tabRef.current = tab; }, [tab]);
  useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);

  useEffect(() => {
    const unsub = onMessage(messaging, (payload) => {
      const isInActiveChat = tabRef.current === "messages" && activeChatRef.current !== null;
      if (isInActiveChat) return;
      const title = payload?.notification?.title || "New message";
      const body = payload?.notification?.body;
      showNotif(body ? `${title}: ${body}` : title);
      // playBeep/triggerVibrate intentionally omitted here — the Firestore
      // onSnapshot listener handles audio+haptics for foreground messages,
      // so calling them here too would double-fire for foreground users.
    });
    return unsub;
  }, []); // eslint-disable-line

  useEffect(() => {
    if (!matches.length) return;
    const unsubs = matches.map(match => {
      const chatId = [firebaseUser.uid, match.uid].sort().join("_");
      const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt"));
      let initialized = false;
      return onSnapshot(q, snap => {
        if (snap.docs.length > 0) {
          const lastData = snap.docs[snap.docs.length - 1].data();
          setLastMessages(prev => ({ ...prev, [match.uid]: lastData }));
        }
        if (!initialized) { initialized = true; return; }
        snap.docChanges().forEach(change => {
          if (change.type !== "added") return;
          if (change.doc.data().from === firebaseUser.uid) return;
          const isViewingThisChat = tabRef.current === "messages" && activeChatRef.current === match.uid;
          if (!isViewingThisChat) {
            playBeep();
            triggerVibrate();
            setUnreadChats(prev => new Set([...prev, match.uid]));
          }
        });
      });
    });
    return () => unsubs.forEach(u => u());
  }, [matches, firebaseUser.uid]); // eslint-disable-line

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users", firebaseUser.uid, "sent"), snap => {
      setSent(snap.docs.map(d => d.data()));
    });
    return unsub;
  }, [firebaseUser.uid]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users", firebaseUser.uid, "passed"), snap => {
      setPassed(new Set(snap.docs.map(d => d.id)));
    });
    return unsub;
  }, [firebaseUser.uid]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users", firebaseUser.uid, "received"), snap => {
      setReceived(snap.docs.map(d => d.data()));
    });
    return unsub;
  }, [firebaseUser.uid]);

  const [blocked, setBlocked] = useState([]);
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users", firebaseUser.uid, "blocked"), snap => {
      setBlocked(snap.docs.map(d => d.data()));
    });
    return unsub;
  }, [firebaseUser.uid]);

  const [blockedByUids, setBlockedByUids] = useState([]);
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users", firebaseUser.uid, "blockedBy"), snap => {
      setBlockedByUids(snap.docs.map(d => d.id));
    });
    return unsub;
  }, [firebaseUser.uid]);

  const handleBlock = async (targetUser) => {
    await Promise.all([
      setDoc(doc(db, "users", firebaseUser.uid, "blocked", targetUser.uid), targetUser),
      setDoc(doc(db, "users", targetUser.uid, "blockedBy", firebaseUser.uid), { blockedAt: serverTimestamp() }),
    ]);
  };
  const handleUnblock = async (targetUid) => {
    await Promise.all([
      deleteDoc(doc(db, "users", firebaseUser.uid, "blocked", targetUid)),
      deleteDoc(doc(db, "users", targetUid, "blockedBy", firebaseUser.uid)),
    ]);
  };

  const handlePass = async (targetUser) => {
    await setDoc(doc(db, "users", firebaseUser.uid, "passed", targetUser.uid), { passedAt: serverTimestamp() });
  };

  const showNotif = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSendRequestWithNote = async (targetUser, note) => {
    if (blockedByUids.includes(targetUser.uid)) return;
    await Promise.all([
      setDoc(doc(db, "users", firebaseUser.uid, "sent", targetUser.uid), { ...targetUser, note, sentAt: serverTimestamp() }),
      setDoc(doc(db, "users", targetUser.uid, "received", firebaseUser.uid), { ...user, note, sentAt: serverTimestamp() }),
    ]);
    try {
      const targetDoc = await getDoc(doc(db, "users", targetUser.uid));
      const fcmToken = targetDoc.data()?.fcmToken;
      if (fcmToken) {
        const idToken = await firebaseUser.getIdToken();
        await fetch("/api/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
          body: JSON.stringify({
            token: fcmToken,
            title: "New Connection Request",
            body: `${user.name} wants to connect with you`,
          }),
        });
      }
    } catch {}
  };

  const handleConnectWithNote = async (targetUser, note) => {
    await handleSendRequestWithNote(targetUser, note);
    showNotif(`Request sent to ${targetUser.name}!`);
  };

  const handleAcceptRequest = async (senderUser) => {
    await Promise.all([
      setDoc(doc(db, "users", firebaseUser.uid, "matches", senderUser.uid), senderUser),
      setDoc(doc(db, "users", senderUser.uid, "matches", firebaseUser.uid), user),
      deleteDoc(doc(db, "users", senderUser.uid, "sent", firebaseUser.uid)),
      deleteDoc(doc(db, "users", firebaseUser.uid, "received", senderUser.uid)),
      deleteDoc(doc(db, "users", firebaseUser.uid, "sent", senderUser.uid)),
      deleteDoc(doc(db, "users", senderUser.uid, "received", firebaseUser.uid)),
    ]);
    showNotif(`Connected with ${senderUser.name}! 🎉`);
    try {
      const senderDoc = await getDoc(doc(db, "users", senderUser.uid));
      const fcmToken = senderDoc.data()?.fcmToken;
      if (fcmToken) {
        const idToken = await firebaseUser.getIdToken();
        await fetch("/api/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
          body: JSON.stringify({
            token: fcmToken,
            title: "Connection Accepted",
            body: `${user.name} accepted your connection request`,
          }),
        });
      }
    } catch {}
  };

  const handleDeclineRequest = async (senderUser) => {
    await Promise.all([
      deleteDoc(doc(db, "users", firebaseUser.uid, "received", senderUser.uid)),
      deleteDoc(doc(db, "users", senderUser.uid, "sent", firebaseUser.uid)),
      setDoc(doc(db, "users", firebaseUser.uid, "passed", senderUser.uid), { uid: senderUser.uid }),
    ]);
  };

  const handleDisconnect = async (targetUid) => {
    await Promise.all([
      deleteDoc(doc(db, "users", firebaseUser.uid, "matches", targetUid)),
      deleteDoc(doc(db, "users", targetUid, "matches", firebaseUser.uid)),
      deleteDoc(doc(db, "users", firebaseUser.uid, "sent", targetUid)),
      deleteDoc(doc(db, "users", targetUid, "sent", firebaseUser.uid)),
      deleteDoc(doc(db, "users", firebaseUser.uid, "received", targetUid)),
      deleteDoc(doc(db, "users", targetUid, "received", firebaseUser.uid)),
    ]);
    setMatches(prev => prev.filter(m => m.uid !== targetUid));
    if (activeChat === targetUid) setActiveChat(null);
    showNotif("Connection removed");
  };

  const handleOpenChat = (uid) => {
    setActiveChat(uid);
    if (uid) setUnreadChats(prev => { const s = new Set(prev); s.delete(uid); return s; });
  };

  const blockedUids = new Set(blocked.map(b => b.uid));
  const unmatched = allUsers === null ? null : allUsers.filter(u =>
    !matches.find(m => m.uid === u.uid) && !sent.find(s => s.uid === u.uid) && !passed.has(u.uid) && !u.deactivated && !received.find(r => r.uid === u.uid) && !blockedUids.has(u.uid) && !blockedByUids.includes(u.uid)
  );

  const intentFiltered = unmatched === null ? null : (() => {
    const myIntents = user?.lookingFor || [];
    if (myIntents.length === 0) return unmatched;

    const complementMap = {
      "Investor":        ["Co-founder", "Startup to join", "Collaboration"],
      "Co-founder":      ["Co-founder", "Investor", "Startup to join"],
      "Mentor":          ["Mentor", "Collaboration"],
      "Collaboration":   ["Collaboration", "Mentor", "Freelance Work", "Clients"],
      "Freelance Work":  ["Clients", "Collaboration"],
      "Startup to join": ["Investor", "Co-founder"],
      "A Job":           ["Clients", "Collaboration"],
      "Clients":         ["A Job", "Freelance Work", "Collaboration"],
    };

    const relevantIntents = new Set(
      myIntents.flatMap(intent => complementMap[intent] || [])
    );

    const matched = unmatched.filter(u =>
      (u.lookingFor || []).some(i => relevantIntents.has(i))
    );

    return matched.length > 0 ? matched : unmatched;
  })();

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, maxWidth: 430, margin: "0 auto", position: "relative" }}>
      {notification && (
        <div style={{
          position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
          background: COLORS.accent, color: "#000", padding: "10px 20px", borderRadius: 12,
          fontSize: 13, fontWeight: 600, zIndex: 999, whiteSpace: "nowrap",
        }}>{notification}</div>
      )}

      <div style={{
        padding: "20px 20px 12px", display: "flex", justifyContent: "space-between",
        alignItems: "center", borderBottom: `1px solid ${COLORS.border}`,
        position: "sticky", top: 0, background: COLORS.bg, zIndex: 10,
      }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.text }}>
          Link<span style={{ color: COLORS.accent }}>-Ap</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setShowSearch(true)} style={{
            background: "none", border: `1px solid ${COLORS.border}`, color: COLORS.text,
            borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13,
          }}>🔍 Search</button>
          <Avatar initials={user.avatar} color={user.color} size={36} photoURL={user.photoURL} />
        </div>
      </div>

      <div style={{ paddingBottom: 90 }}>
        {tab === "discover" && <Discover users={intentFiltered} onConnect={handleConnectWithNote} onPass={handlePass} onViewProfile={setViewingProfile} onLoadMore={loadMoreUsers} loadingMore={loadingMore} hasMore={hasMore} user={user} seenUids={seenUids} setSeenUids={setSeenUids} />}
        {tab === "matches" && <Matches matches={matches} sent={sent} received={received} firebaseUser={firebaseUser} onChat={(uid) => { handleOpenChat(uid); setTab("messages"); }} onViewProfile={setViewingProfile} onAcceptRequest={handleAcceptRequest} onDeclineRequest={handleDeclineRequest} onDiscover={() => setTab("discover")} blockedUids={blockedUids} blockedByUids={blockedByUids} onDisconnect={handleDisconnect} />}
        {tab === "messages" && !activeChat && <Messages matches={matches} sent={sent} firebaseUser={firebaseUser} activeChat={null} setActiveChat={handleOpenChat} unreadChats={unreadChats} onViewProfile={setViewingProfile} blockedUids={blockedUids} blockedByUids={blockedByUids} lastMessages={lastMessages} />}
        {tab === "profile" && <Profile user={user} firebaseUser={firebaseUser} onProfileUpdate={onProfileUpdate} editTrigger={profileEditTrigger} />}
        {tab === "settings" && <Settings user={user} firebaseUser={firebaseUser} onEditProfile={() => { setProfileEditTrigger(t => t + 1); setTab("profile"); }} blocked={blocked} onUnblock={handleUnblock} />}
      </div>

      {tab === "messages" && activeChat && (
        <div style={{
          position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)",
          width: "100%", maxWidth: 430, height: "100dvh", zIndex: 20,
          background: COLORS.bg, display: "flex", flexDirection: "column",
        }}>
          <Messages matches={matches} sent={sent} firebaseUser={firebaseUser} activeChat={activeChat} setActiveChat={handleOpenChat} unreadChats={unreadChats} onViewProfile={setViewingProfile} blockedUids={blockedUids} blockedByUids={blockedByUids} lastMessages={lastMessages} />
        </div>
      )}

      {viewingProfile && <PublicProfile profileUser={viewingProfile} onClose={() => setViewingProfile(null)} currentUserUid={firebaseUser.uid} blocked={blocked} onBlock={handleBlock} onUnblock={handleUnblock} matches={matches} onDisconnect={handleDisconnect} />}
      {showSearch && <SearchModal currentUser={user} sent={sent} matches={matches} onClose={() => setShowSearch(false)} onSendRequest={handleSendRequestWithNote} blocked={blocked} blockedByUids={blockedByUids} />}

      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 430,
        background: COLORS.card, borderTop: `1px solid ${COLORS.border}`,
        display: "flex", padding: "10px 0 20px",
      }}>
        {[
          { id: "discover", label: "Discover",
            icon: c => <svg viewBox="0 0 24 24" fill={c} width="22" height="22"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> },
          { id: "matches", label: "Connections", badge: received.length,
            icon: c => <svg viewBox="0 0 24 24" fill={c} width="22" height="22"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg> },
          { id: "messages", label: "Messages", badge: unreadChats.size,
            icon: c => <svg viewBox="0 0 24 24" fill={c} width="22" height="22"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg> },
          { id: "profile", label: "Profile",
            icon: c => <svg viewBox="0 0 24 24" fill={c} width="22" height="22"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg> },
          { id: "settings", label: "Settings",
            icon: c => <svg viewBox="0 0 24 24" fill={c} width="22" height="22"><path d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.56-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.07.63-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.11-.21.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg> },
        ].map(item => {
          const color = tab === item.id ? COLORS.accent : COLORS.textMuted;
          return (
            <button key={item.id} onClick={() => setTab(item.id)} style={{
              flex: 1, background: "none", border: "none", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4, position: "relative",
            }}>
              {item.icon(color)}
              <span style={{ fontSize: 10, color, fontWeight: 500 }}>{item.label}</span>
              {item.badge > 0 && (
                <div style={{
                  position: "absolute", top: 0, right: "calc(50% - 18px)",
                  background: COLORS.accent, color: "#000", borderRadius: 10,
                  width: 16, height: 16, fontSize: 9, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>{item.badge}</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SearchModal({ currentUser, sent, matches, onClose, onSendRequest, blocked, blockedByUids = [] }) {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [target, setTarget] = useState(null);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [sentOk, setSentOk] = useState(false);

  useEffect(() => {
    if (term.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const t_ = term.trim().toLowerCase();
        const tCap = t_.charAt(0).toUpperCase() + t_.slice(1);
        const end_ = t_ + "";
        const endCap_ = tCap + "";
        const [s1, s2, s3] = await Promise.all([
          getDocs(query(collection(db, 'users'), where('nameLower', '>=', t_), where('nameLower', '<=', end_), limit(15))),
          getDocs(query(collection(db, 'users'), where('lastNameLower', '>=', t_), where('lastNameLower', '<=', end_), limit(15))),
          getDocs(query(collection(db, 'users'), where('name', '>=', tCap), where('name', '<=', endCap_), limit(15))),
        ]);
        const seen = new Set();
        const blockedSet = new Set([
          ...(blocked || []).map(b => b.uid),
          ...(blockedByUids || []),
        ]);
        const merged = [...s1.docs, ...s2.docs, ...s3.docs]
          .map(d => d.data())
          .filter(u => {
            if (u.uid === currentUser.uid || seen.has(u.uid) || u.deactivated || blockedSet.has(u.uid)) return false;
            seen.add(u.uid);
            return true;
          });
        setResults(merged);
      } catch (e) { console.error("[Search] query error:", e); setResults([]); }
      setSearching(false);
    }, 400);
    return () => clearTimeout(t);
  }, [term]); // eslint-disable-line

  const isMatched = (uid) => matches.some(m => m.uid === uid);
  const isSent = (uid) => sent.some(s => s.uid === uid);

  const handleSend = async () => {
    if (!note.trim() || !target || sending) return;
    setSending(true);
    await onSendRequest(target, note.trim());
    setSending(false);
    setSentOk(true);
    setTimeout(() => { setTarget(null); setNote(""); setSentOk(false); }, 1800);
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 430, height: "100dvh", zIndex: 40,
      background: COLORS.bg, display: "flex", flexDirection: "column",
    }}>
      <div style={{
        padding: "16px 20px", borderBottom: `1px solid ${COLORS.border}`,
        display: "flex", alignItems: "center", gap: 12, flexShrink: 0, background: COLORS.bg,
      }}>
        <button
          onClick={target ? () => { setTarget(null); setNote(""); } : onClose}
          style={{ background: "none", border: "none", color: COLORS.accent, cursor: "pointer", fontSize: 18 }}
        >←</button>
        <div style={{ fontWeight: 700, color: COLORS.text, fontSize: 16 }}>
          {target ? "Send Connection Request" : "Find Someone"}
        </div>
      </div>

      {!target && (
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            autoFocus
            type="text"
            value={term}
            onChange={e => setTerm(e.target.value)}
            placeholder="Search by name or surname..."
            style={{
              width: "100%", padding: "12px 16px", borderRadius: 12,
              background: COLORS.card, border: `1px solid ${COLORS.border}`,
              color: COLORS.text, fontSize: 15, outline: "none", boxSizing: "border-box",
            }}
          />
          {term.trim().length < 2 && (
            <p style={{ color: COLORS.textMuted, fontSize: 13, textAlign: "center", marginTop: 40 }}>
              Type a name to find people on Link-Ap.
            </p>
          )}
          {searching && <p style={{ color: COLORS.textMuted, fontSize: 13, textAlign: "center" }}>Searching...</p>}
          {!searching && term.trim().length >= 2 && results.length === 0 && (
            <p style={{ color: COLORS.textMuted, fontSize: 13, textAlign: "center" }}>No results for "{term}".</p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {results.map(u => (
              <div key={u.uid} style={{
                background: COLORS.card, border: `1px solid ${COLORS.border}`,
                borderRadius: 16, padding: 16, display: "flex", gap: 12, alignItems: "center",
              }}>
                <Avatar initials={u.avatar} color={u.color} size={48} photoURL={u.photoURL} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.text }}>{u.name}</div>
                  <div style={{ color: u.color, fontSize: 12 }}>{u.role}</div>
                  <div style={{ color: COLORS.textMuted, fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}><LocationPin /> {u.location}</div>
                </div>
                {isMatched(u.uid) ? (
                  <span style={{ fontSize: 11, color: COLORS.green, fontWeight: 600, flexShrink: 0 }}>Connected ✓</span>
                ) : isSent(u.uid) ? (
                  <span style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: 500, flexShrink: 0 }}>Requested</span>
                ) : (
                  <button onClick={() => setTarget(u)} style={{
                    padding: "8px 14px", borderRadius: 10, border: "none",
                    background: COLORS.accent, color: "#000", cursor: "pointer",
                    fontSize: 12, fontWeight: 700, flexShrink: 0,
                  }}>Connect</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {target && (
        <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{
            background: COLORS.card, border: `1px solid ${COLORS.border}`,
            borderRadius: 16, padding: 16, display: "flex", gap: 12, alignItems: "center",
          }}>
            <Avatar initials={target.avatar} color={target.color} size={52} photoURL={target.photoURL} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: COLORS.text }}>{target.name}</div>
              <div style={{ color: target.color, fontSize: 13 }}>{target.role}</div>
              <div style={{ color: COLORS.textMuted, fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}><LocationPin /> {target.location}</div>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 6, display: "block" }}>
              Why do you want to connect? <span style={{ color: COLORS.red }}>*</span>
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder={`Tell ${target.name.split(" ")[0]} why you'd like to connect — be specific and genuine.`}
              rows={5}
              autoFocus
              style={{
                width: "100%", padding: "12px 16px", borderRadius: 12,
                background: COLORS.bg, border: `1px solid ${COLORS.border}`,
                color: COLORS.text, fontSize: 14, outline: "none", resize: "none", boxSizing: "border-box",
              }}
            />
            <p style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>
              A personal note greatly increases your chances of a response.
            </p>
          </div>
          <button
            onClick={handleSend}
            disabled={!note.trim() || sending || sentOk}
            style={{
              padding: "14px", borderRadius: 12, border: "none",
              background: sentOk ? COLORS.green : note.trim() && !sending ? COLORS.accent : COLORS.border,
              color: sentOk || (note.trim() && !sending) ? "#000" : COLORS.textMuted,
              cursor: note.trim() && !sending && !sentOk ? "pointer" : "not-allowed",
              fontSize: 14, fontWeight: 700,
            }}
          >
            {sentOk ? "Request Sent ✓" : sending ? "Sending..." : `Send Request to ${target.name.split(" ")[0]}`}
          </button>
        </div>
      )}
    </div>
  );
}




function SplashScreen({ onDone }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), 3600);
    const t2 = setTimeout(() => onDone(), 4100);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []); // eslint-disable-line

  return (
    <>
      <style>{`
        @keyframes splashLogoIn {
          from { opacity: 0; transform: scale(0.82); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes splashPulse {
          0%   { filter: drop-shadow(0 0 0px rgba(245,166,35,0)); }
          50%  { filter: drop-shadow(0 0 28px rgba(245,166,35,0.55)); }
          100% { filter: drop-shadow(0 0 0px rgba(245,166,35,0)); }
        }
        .splash-logo {
          animation:
            splashLogoIn 0.6s cubic-bezier(0.22,1,0.36,1) forwards,
            splashPulse   0.85s ease-in-out 0.6s 4;
        }
      `}</style>
      <div style={{
        position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
        zIndex: 9999, background: "#0A0A0F",
        display: "flex", alignItems: "center", justifyContent: "center",
        opacity: fading ? 0 : 1, transition: "opacity 0.5s ease",
        pointerEvents: fading ? "none" : "all",
      }}>
        <img
          src={logoImg}
          alt="Link-Ap"
          className="splash-logo"
          style={{ width: 160, height: 160, objectFit: "contain" }}
        />
      </div>
    </>
  );
}
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh", background: COLORS.bg,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 12,
        }}>
          <p style={{ color: COLORS.text, fontSize: 18, margin: 0 }}>Something went wrong</p>
          <p style={{ color: COLORS.textMuted, fontSize: 14, margin: 0 }}>Tap below to reload</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 8, padding: "10px 24px", borderRadius: 8,
              background: COLORS.accent, color: "#fff", border: "none",
              fontSize: 15, fontWeight: 600, cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState(undefined);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      setProfile(null);
      setFirebaseUser(user ?? null);
      if (user) {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          if ((!data.nameLower || !data.lastNameLower) && data.name) {
            const nameLower = data.name.toLowerCase();
            const lastNameLower = data.name.trim().split(/\s+/).pop()?.toLowerCase() || "";
            await setDoc(doc(db, "users", user.uid), { nameLower, lastNameLower }, { merge: true });
            setProfile({ ...data, nameLower, lastNameLower });
          } else {
            setProfile(data);
          }
        }
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  let content;
  if (window.location.pathname === "/privacy") content = <PrivacyPolicy />;
  else if (!splashDone) content = <SplashScreen onDone={() => setSplashDone(true)} />;
  else if (loading) content = <div style={{ minHeight: "100vh", background: COLORS.bg }} />;
  else if (!firebaseUser) content = <AuthScreen />;
  else if (!profile || profile.uid !== firebaseUser.uid) content = <Onboarding firebaseUser={firebaseUser} onComplete={setProfile} />;
  else content = <MainApp user={profile} firebaseUser={firebaseUser} onProfileUpdate={setProfile} />;
  return <ErrorBoundary>{content}</ErrorBoundary>;
}