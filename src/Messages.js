import { useState, useEffect, useRef } from "react";
import { db } from "./firebase";
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from "firebase/firestore";
import { COLORS, Avatar, formatRelativeTime } from "./shared";

export function Messages({ matches, sent = [], firebaseUser, activeChat, setActiveChat, unreadChats = new Set(), onViewProfile, blockedUids = new Set(), blockedByUids = [], lastMessages = {} }) {
  const [input, setInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const bottomRef = useRef(null);

  const chatUser = matches.find(u => u.uid === activeChat);
  const chatId = activeChat ? [firebaseUser.uid, activeChat].sort().join("_") : null;
  const iBlockedThem = activeChat ? blockedUids.has(activeChat) : false;
  const theyBlockedMe = activeChat ? blockedByUids.includes(activeChat) : false;
  const isBlocked = iBlockedThem || theyBlockedMe;

  useEffect(() => {
    setChatMessages([]);
    if (!chatId) return;
    const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt"));
    const unsub = onSnapshot(q, snap => {
      setChatMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages.length]);

  const send = async () => {
    if (!input.trim() || !chatUser || iBlockedThem) return;
    await addDoc(collection(db, "chats", chatId, "messages"), {
      text: input.trim(),
      from: firebaseUser.uid,
      createdAt: serverTimestamp(),
    });
    setInput("");
    // CRITICAL — pass recipientUid to /api/notify
    // Server fetches fcmTokens array from Firestore.
    // Do not revert to passing a single fcmToken from client.
    // Single token approach breaks multi-device notifications.
    try {
      const idToken = await firebaseUser.getIdToken();
      await fetch("/api/notify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          recipientUid: activeChat,
          title: "New message on Link-Ap",
          body: input.trim().slice(0, 100),
        }),
      });
    } catch (e) {
      console.warn("FCM notify error:", e);
    }
  };

  if (activeChat && !chatUser) return null;

  const visibleMatches = matches.filter(u => !blockedUids.has(u.uid) && !blockedByUids.includes(u.uid));

  if (!activeChat) return (
    <div style={{ padding: "16px 20px" }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: COLORS.text }}>Messages</h2>
        <p style={{ color: COLORS.textMuted, fontSize: 13 }}>Your conversations</p>
      </div>
      {visibleMatches.length === 0 && (
        <div style={{ textAlign: "center", paddingTop: 60, color: COLORS.textMuted }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
          <p>Connect with people to start chatting</p>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {visibleMatches.map(u => (
          <div key={u.uid} onClick={() => setActiveChat(u.uid)} style={{
            background: COLORS.card, border: `1px solid ${COLORS.border}`,
            borderRadius: 16, padding: 16, display: "flex", gap: 14, alignItems: "center", cursor: "pointer",
          }}>
            <div onClick={(e) => { e.stopPropagation(); onViewProfile && onViewProfile(u); }} style={{ flexShrink: 0, position: "relative" }}>
              <Avatar initials={u.avatar} color={u.color} size={48} photoURL={u.photoURL} />
              {unreadChats.has(u.uid) && (
                <div style={{
                  position: "absolute", top: 0, right: 0,
                  width: 10, height: 10, background: COLORS.accent, borderRadius: "50%",
                  border: `2px solid ${COLORS.card}`,
                }} />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</div>
                {lastMessages[u.uid]?.createdAt && (
                  <div style={{ color: COLORS.textMuted, fontSize: 11, flexShrink: 0 }}>{formatRelativeTime(lastMessages[u.uid].createdAt)}</div>
                )}
              </div>
              <div style={{ color: COLORS.textMuted, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {lastMessages[u.uid]?.text
                  ? lastMessages[u.uid].text.length > 40
                    ? lastMessages[u.uid].text.slice(0, 40) + "..."
                    : lastMessages[u.uid].text
                  : "Start a conversation"}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh" }}>
      <div style={{
        padding: "12px 20px", borderBottom: `1px solid ${COLORS.border}`,
        display: "flex", gap: 12, alignItems: "center", background: COLORS.card,
        position: "sticky", top: 0, zIndex: 9, flexShrink: 0,
      }}>
        <button onClick={() => setActiveChat(null)} style={{ background: "none", border: "none", color: COLORS.accent, cursor: "pointer", fontSize: 18 }}>←</button>
        <div
          onClick={() => onViewProfile && onViewProfile(chatUser)}
          style={{ display: "flex", gap: 12, alignItems: "center", cursor: "pointer", flex: 1 }}
        >
          <Avatar initials={chatUser?.avatar} color={chatUser?.color} size={40} photoURL={chatUser?.photoURL} />
          <div>
            <div style={{ fontWeight: 700, color: COLORS.text }}>{chatUser?.name}</div>
            <div style={{ color: COLORS.textMuted, fontSize: 12 }}>{chatUser?.role}</div>
          </div>
        </div>
      </div>

      {isBlocked ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 32px" }}>
          <div style={{ textAlign: "center", color: COLORS.textMuted }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🚫</div>
            <p style={{ fontSize: 14, lineHeight: 1.6 }}>
              {iBlockedThem
                ? "You have blocked this person. Unblock them to send messages."
                : "This conversation is unavailable."}
            </p>
          </div>
        </div>
      ) : (
        <>
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            {chatMessages.length === 0 && (
              <div style={{ textAlign: "center", color: COLORS.textMuted, marginTop: 40 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>👋</div>
                <p style={{ fontSize: 13 }}>Say hello to {chatUser?.name}!</p>
              </div>
            )}
            {chatMessages.map(msg => (
              <div key={msg.id} style={{ display: "flex", justifyContent: msg.from === firebaseUser.uid ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "75%",
                  background: msg.from === firebaseUser.uid ? COLORS.chatBlue : COLORS.card,
                  color: COLORS.text,
                  border: msg.from === firebaseUser.uid ? "none" : `1px solid ${COLORS.border}`,
                  borderRadius: msg.from === firebaseUser.uid ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  padding: "10px 14px", fontSize: 14, lineHeight: 1.5,
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

            <div style={{ padding: "12px 16px", borderTop: `1px solid ${COLORS.border}`, display: "flex", gap: 10, background: COLORS.card }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && send()}
                placeholder="Type a message..."
                style={{
                  flex: 1, padding: "12px 16px", borderRadius: 24,
                  background: COLORS.bg, border: `1px solid ${COLORS.border}`,
                  color: COLORS.text, fontSize: 14, outline: "none",
                }}
              />
              <button onClick={send} style={{
                width: 44, height: 44, borderRadius: "50%", border: "none",
                background: input.trim() ? COLORS.accent : COLORS.border,
                color: input.trim() ? "#000" : COLORS.textMuted,
                cursor: input.trim() ? "pointer" : "default",
                fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>→</button>
            </div>
        </>
      )}
    </div>
  );
}
