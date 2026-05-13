import { useState, useEffect, useRef, Component } from "react";
import logoImg from "./link-ap-logo.png";
import { db, auth, messaging, onMessage } from "./firebase";
import {
  collection, onSnapshot, query,
  orderBy, serverTimestamp, doc, setDoc, getDoc, deleteDoc,
  getDocs, startAfter, limit, where,
} from "firebase/firestore";
import {
  onAuthStateChanged,
} from "firebase/auth";
import PrivacyPolicy from './PrivacyPolicy';
import { COLORS, Avatar, Tag, LocationPin, LinkedInIcon, LOOKING_FOR_QUESTIONS } from "./shared";
import { Messages } from "./Messages";
import { Profile } from "./Profile";
import AuthScreen from "./AuthScreen";
import Onboarding from "./Onboarding";
import Settings from "./Settings";

function playBeep() {
  try {
    if (localStorage.getItem("linkap_sound") !== "true") return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
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
  } catch {}
}

function triggerVibrate() {
  try {
    if (localStorage.getItem("linkap_vibrate") !== "true") return;
    navigator.vibrate([100, 50, 100, 50, 100, 50, 100, 50, 100]);
  } catch {}
}


function PublicProfile({ profileUser, onClose, currentUserUid, blocked, onBlock, onUnblock, matches, onDisconnect }) {
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const isMutualMatch = matches?.some(m => m.uid === profileUser.uid);
  return (
    <div style={{
      position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 430, height: "100dvh", zIndex: 40,
      background: COLORS.bg, overflowY: "auto",
    }}>
      <style>{`@keyframes linkApPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }`}</style>
      <div style={{
        position: "sticky", top: 0, background: COLORS.bg, zIndex: 10,
        padding: "16px 20px", borderBottom: `1px solid ${COLORS.border}`,
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <button onClick={onClose} style={{ background: "none", border: "none", color: COLORS.accent, cursor: "pointer", fontSize: 18 }}>←</button>
        <div style={{ fontWeight: 700, color: COLORS.text, fontSize: 16 }}>Profile</div>
      </div>
      <div style={{ height: 4, background: profileUser.color }} />
      <div>
        {/* Header */}
        <div style={{ background: "#16161F", padding: "24px 24px 20px" }}>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 16 }}>
            <Avatar initials={profileUser.avatar} color={profileUser.color} size={72} photoURL={profileUser.photoURL} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <div style={{ fontSize: 19, fontWeight: 800, color: COLORS.text }}>{profileUser.name}</div>
                    {profileUser.pronouns && <span style={{ fontSize: 11, color: COLORS.textMuted, fontStyle: "italic" }}>{profileUser.pronouns}</span>}
                    {profileUser.linkedinVerified && profileUser.linkedinProfileUrl && (
                      <a href={profileUser.linkedinProfileUrl} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center" }}>
                        <LinkedInIcon />
                      </a>
                    )}
                  </div>
                  <div style={{ color: profileUser.color, fontSize: 13, marginTop: 2 }}>{profileUser.role}</div>
                </div>
                {profileUser.lookingFor?.includes("Investor") && (
                  <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#0A2015", border: "1px solid #15532E", borderRadius: 20, padding: "4px 10px", flexShrink: 0 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.green, display: "inline-block", animation: "linkApPulse 2s ease-in-out infinite" }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.green }}>Actively raising</span>
                  </div>
                )}
              </div>
              <div style={{ color: COLORS.textMuted, fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}>
                <LocationPin />
                {profileUser.location}
              </div>
            </div>
          </div>
          {profileUser.bio && (
            <p style={{ fontSize: 14, lineHeight: 1.7, color: COLORS.text, margin: 0 }}>{profileUser.bio}</p>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: "0 24px 28px" }}>

          {/* Skills */}
          {profileUser.skills?.length > 0 && (
            <div style={{ paddingTop: 20, paddingBottom: 20, borderBottom: `1px solid ${COLORS.border}` }}>
              <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 10, fontWeight: 600 }}>SKILLS</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {profileUser.skills.map(s => (
                  <span key={s} style={{ background: "#1A2E4A", color: COLORS.blue, padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500 }}>{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Q&A / Looking For block */}
          {profileUser.lookingFor?.length > 0 && profileUser.lookingForDetails && Object.values(profileUser.lookingForDetails).some(v => v) && (
            <div style={{ paddingTop: 20, paddingBottom: 20, borderBottom: `1px solid ${COLORS.border}` }}>
              <div style={{ background: COLORS.card, borderRadius: 12, padding: 16, border: `1px solid ${COLORS.border}` }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, letterSpacing: "0.08em" }}>
                    {profileUser.lookingFor.includes("Investor") ? "INVESTOR DECK" : profileUser.lookingFor.map(lf => lf.toUpperCase()).join(" · ")}
                  </div>
                  <div style={{ background: "#2D1F00", border: "1px solid #6B4A00", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600, color: COLORS.accent }}>
                    Open to conversations
                  </div>
                </div>
                {profileUser.lookingFor.filter(lf => LOOKING_FOR_QUESTIONS[lf]?.some(q => profileUser.lookingForDetails?.[q.key])).map((lf, lfIdx, filteredArr) => (
                  <div key={lf}>
                    {filteredArr.length > 1 && (
                      <div style={{ fontSize: 10, color: COLORS.accent, fontWeight: 600, marginBottom: 8 }}>{lf.toUpperCase()}</div>
                    )}
                    {LOOKING_FOR_QUESTIONS[lf].filter(q => profileUser.lookingForDetails?.[q.key]).map((q, qIdx, qArr) => (
                      <div key={q.key}>
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 2 }}>{q.label}</div>
                          <div style={{ fontSize: 14, color: COLORS.text, fontWeight: 600, lineHeight: 1.5 }}>{profileUser.lookingForDetails[q.key]}</div>
                        </div>
                        {(qIdx < qArr.length - 1 || lfIdx < filteredArr.length - 1) && (
                          <div style={{ height: 1, background: COLORS.border, marginBottom: 10 }} />
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Achievements (full width) */}
          {profileUser.achievements?.length > 0 && (
            <div style={{ paddingTop: 20, paddingBottom: 20, borderBottom: `1px solid ${COLORS.border}` }}>
              <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 10, fontWeight: 600 }}>ACHIEVEMENTS</div>
              {profileUser.achievements.map((a, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ width: 18, height: 18, minWidth: 18, background: "#1A2A4A", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
                    <svg width="10" height="10" viewBox="0 0 16 16" fill={COLORS.blue}><path d="M8 1l1.85 3.75L14 5.5l-3 2.93.71 4.12L8 10.5l-3.71 2.05L5 8.43 2 5.5l4.15-.75z"/></svg>
                  </div>
                  <div style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.5 }}>{a}</div>
                </div>
              ))}
            </div>
          )}

          {/* What I bring to the table */}
          {profileUser.bringToTable && (
            <div style={{ paddingTop: 20, paddingBottom: (profileUser.currentlyExploring?.length > 0 || profileUser.openTo?.length > 0) ? 20 : 0, borderBottom: (profileUser.currentlyExploring?.length > 0 || profileUser.openTo?.length > 0) ? `1px solid ${COLORS.border}` : "none" }}>
              <div style={{ paddingLeft: 14, borderLeft: `3px solid ${COLORS.blue}` }}>
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 6, fontWeight: 600 }}>WHAT I BRING TO THE TABLE</div>
                <p style={{ fontSize: 14, color: COLORS.text, lineHeight: 1.7, margin: 0 }}>{profileUser.bringToTable}</p>
              </div>
            </div>
          )}

          {/* Currently Exploring + Open To */}
          {(profileUser.currentlyExploring?.length > 0 || profileUser.openTo?.length > 0) && (
            <div style={{ paddingTop: 20 }}>
              {profileUser.currentlyExploring?.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 8, fontWeight: 600 }}>CURRENTLY EXPLORING</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {profileUser.currentlyExploring.map(s => (
                      <span key={s} style={{ background: "#2A1A00", color: COLORS.accent, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 500 }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {profileUser.openTo?.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 8, fontWeight: 600 }}>OPEN TO</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {profileUser.openTo.map(s => (
                      <span key={s} style={{ background: "#0A2015", color: COLORS.green, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 500 }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {currentUserUid && currentUserUid !== profileUser.uid && (() => {
            const isBlocked = blocked && blocked.some(b => b.uid === profileUser.uid);
            return (
              <div style={{ paddingTop: 24, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                {isMutualMatch && onDisconnect && (
                  <button
                    onClick={() => setShowDisconnectConfirm(true)}
                    style={{ background: "none", border: `1px solid ${COLORS.red}55`, borderRadius: 10, color: COLORS.red, cursor: "pointer", fontSize: 13, fontWeight: 600, padding: "9px 20px" }}
                  >
                    Remove Connection
                  </button>
                )}
                <button
                  onClick={() => isBlocked ? onUnblock(profileUser.uid) : onBlock(profileUser)}
                  style={{ background: "none", border: "none", color: COLORS.red, cursor: "pointer", fontSize: 12, opacity: 0.6, textDecoration: "underline" }}
                >
                  {isBlocked ? "Unblock user" : "Block user"}
                </button>
              </div>
            );
          })()}
        </div>
      </div>

      {showDisconnectConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, width: "100%", maxWidth: 360, padding: 24 }}>
            <div style={{ fontWeight: 700, color: COLORS.text, fontSize: 17, marginBottom: 10 }}>Remove {profileUser.name.split(" ")[0]}?</div>
            <p style={{ color: COLORS.textMuted, fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
              They will be removed from your connections. Your chat history is kept. They can reappear in Discover.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowDisconnectConfirm(false)} style={{ flex: 1, padding: "12px", borderRadius: 10, border: `1px solid ${COLORS.border}`, background: "none", color: COLORS.text, cursor: "pointer", fontSize: 14 }}>Cancel</button>
              <button
                onClick={() => { onDisconnect(profileUser.uid); setShowDisconnectConfirm(false); onClose(); }}
                style={{ flex: 1, padding: "12px", borderRadius: 10, border: "none", background: COLORS.red, color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700 }}
              >Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawInvitePoster(canvas) {
  const W = 540, H = 960;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#0A0A0F";
  ctx.fillRect(0, 0, W, H);

  // Subtle top radial glow
  const glow = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, 400);
  glow.addColorStop(0, "rgba(245,166,35,0.15)");
  glow.addColorStop(1, "rgba(245,166,35,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, 400);

  // Gold top bar
  ctx.fillStyle = "#F5A623";
  ctx.fillRect(0, 0, W, 3);

  // "Link-Ap" wordmark at y=160
  ctx.textBaseline = "alphabetic";
  ctx.font = "bold 64px -apple-system, BlinkMacSystemFont, Arial, sans-serif";
  const lw = ctx.measureText("Link").width;
  const aw = ctx.measureText("-Ap").width;
  const tx = (W - lw - aw) / 2;
  ctx.textAlign = "left";
  ctx.fillStyle = "#F0EEE8"; ctx.fillText("Link", tx, 160);
  ctx.fillStyle = "#F5A623"; ctx.fillText("-Ap", tx + lw, 160);

  // Tagline at y=210
  ctx.font = "18px -apple-system, BlinkMacSystemFont, Arial, sans-serif";
  ctx.textAlign = "center"; ctx.fillStyle = "#8A8A9A";
  ctx.fillText("Connect with the right people", W / 2, 210);

  // Divider at y=260
  ctx.fillStyle = "#2A2A3A";
  ctx.fillRect(W * 0.2, 260, W * 0.6, 1);

  // Section label at y=290
  ctx.font = "bold 14px -apple-system, BlinkMacSystemFont, Arial, sans-serif";
  ctx.textAlign = "center"; ctx.fillStyle = "#F5A623";
  ctx.fillText("WHY YOU SHOULD JOIN", W / 2, 290);

  // Bullet cards: cy=316, ch=56, gap=10 (period=66)
  const bullets = [
    "Discover co-founders, investors & freelance work",
    "Connect with people building real things",
    "Find exactly who you're looking for",
    "Show what you bring to the table",
  ];
  bullets.forEach((text, i) => {
    const cy = 316 + i * 66, ch = 56, cx = W * 0.07, cw = W * 0.86;
    ctx.fillStyle = "#13131A";
    roundRect(ctx, cx, cy, cw, ch, 12); ctx.fill();
    ctx.fillStyle = "rgba(245,166,35,0.5)";
    ctx.fillRect(cx, cy + 10, 3, ch - 20);
    ctx.font = "16px -apple-system, BlinkMacSystemFont, Arial, sans-serif";
    ctx.textAlign = "left"; ctx.textBaseline = "middle";
    ctx.fillStyle = "#F0EEE8"; ctx.fillText(text, cx + 20, cy + ch / 2);
    ctx.textBaseline = "alphabetic";
  });

  // Italic statement at y=624
  ctx.font = "italic 20px -apple-system, BlinkMacSystemFont, Arial, sans-serif";
  ctx.textAlign = "center"; ctx.fillStyle = "#F0EEE8";
  ctx.fillText("Where the right people find each other.", W / 2, 624);

  // Value lines centred between italic and divider
  ctx.font = "15px -apple-system, BlinkMacSystemFont, Arial, sans-serif";
  ctx.fillStyle = "#8A8A9A";
  ctx.fillText("Co-founders · Investors · Collaborators · Advisory Roles", W / 2, 686);
  ctx.fillText("Coffee Chats · Jobs · Clients", W / 2, 718);

  // Divider at y=780
  ctx.fillStyle = "#2A2A3A";
  ctx.fillRect(W * 0.2, 780, W * 0.6, 1);

  // CTA text
  ctx.font = "13px -apple-system, BlinkMacSystemFont, Arial, sans-serif";
  ctx.fillStyle = "#8A8A9A";
  ctx.fillText("Join now at", W / 2, 820);

  ctx.font = "bold 38px -apple-system, BlinkMacSystemFont, Arial, sans-serif";
  ctx.fillStyle = "#F5A623";
  ctx.fillText("link-ap.online", W / 2, 872);

  // Gold footer bar
  ctx.fillStyle = "#F5A623";
  ctx.fillRect(0, 910, W, 50);

  ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, Arial, sans-serif";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillStyle = "#000000";
  ctx.fillText("Join Link-Ap  →", W / 2, 935);
}

export function ShareModal({ user, onClose }) {
  const canvasRef = useRef(null);
  const [posterBlob, setPosterBlob] = useState(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    drawInvitePoster(canvasRef.current);
    canvasRef.current.toBlob(blob => setPosterBlob(blob));
  }, []); // eslint-disable-line

  const linkMessage = `Hey! Join me on Link-Ap - a networking app that connects you with the right people - https://link-ap.online`;

  const handleSave = () => {
    if (!canvasRef.current) return;
    const a = document.createElement("a");
    a.download = "link-ap-invite.png";
    a.href = canvasRef.current.toDataURL("image/png");
    a.click();
  };

  const handleWhatsApp = async () => {
    if (posterBlob && navigator.share && navigator.canShare) {
      const file = new File([posterBlob], "link-ap-invite.png", { type: "image/png" });
      if (navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], text: linkMessage }); return; } catch (err) { if (err.name === "AbortError") return; }
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(linkMessage)}`, "_blank");
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 50,
      background: "rgba(0,0,0,0.88)", display: "flex",
      alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{
        background: COLORS.card, border: `1px solid ${COLORS.border}`,
        borderRadius: 24, padding: 24, width: "100%", maxWidth: 380,
        display: "flex", flexDirection: "column", gap: 18,
        maxHeight: "92dvh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.text }}>Invite someone</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: COLORS.textMuted, cursor: "pointer", fontSize: 24, lineHeight: 1 }}>×</button>
        </div>
        <p style={{ fontSize: 13, color: COLORS.textMuted, margin: 0, lineHeight: 1.6 }}>
          Share this with someone you think belongs on Link-Ap. On mobile, tap Share to send the image directly via WhatsApp.
        </p>
        <div style={{ display: "flex", justifyContent: "center", background: COLORS.bg, borderRadius: 14, padding: 10 }}>
          <canvas ref={canvasRef} style={{ width: 240, height: 427, borderRadius: 8, display: "block" }} />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={handleSave} style={{
            flex: 1, padding: "12px 8px", borderRadius: 12,
            border: `1px solid ${COLORS.border}`, background: "transparent",
            color: COLORS.text, cursor: "pointer", fontSize: 13, fontWeight: 500,
          }}>Save Poster</button>
          <button onClick={handleWhatsApp} style={{
            flex: 2, padding: "12px 8px", borderRadius: 12, border: "none",
            background: "#25D366", color: "#fff", cursor: "pointer",
            fontSize: 13, fontWeight: 700,
          }}>Share on WhatsApp</button>
        </div>
      </div>
    </div>
  );
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
      playBeep();
      triggerVibrate();
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
    await Promise.all([
      setDoc(doc(db, "users", firebaseUser.uid, "sent", targetUser.uid), { ...targetUser, note, sentAt: serverTimestamp() }),
      setDoc(doc(db, "users", targetUser.uid, "received", firebaseUser.uid), { ...user, note, sentAt: serverTimestamp() }),
    ]);
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
    !matches.find(m => m.uid === u.uid) && !sent.find(s => s.uid === u.uid) && !passed.has(u.uid) && !u.deactivated && !received.find(r => r.uid === u.uid) && !blockedUids.has(u.uid)
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

function ConnectNoteModal({ target, onSend, onCancel }) {
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [sentOk, setSentOk] = useState(false);
  const MAX = 300;
  const MIN = 10;

  const handleSend = async () => {
    if (note.trim().length < MIN || sending) return;
    setSending(true);
    await onSend(note.trim());
    setSending(false);
    setSentOk(true);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      background: "rgba(0,0,0,0.72)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }}>
      <div style={{
        width: "100%", maxWidth: 430,
        background: COLORS.card, border: `1px solid ${COLORS.border}`,
        borderRadius: "20px 20px 0 0",
        padding: "20px 20px 36px",
        display: "flex", flexDirection: "column", gap: 16,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 700, color: COLORS.text, fontSize: 16 }}>Send Connection Request</div>
          <button onClick={onCancel} style={{ background: "none", border: "none", color: COLORS.textMuted, cursor: "pointer", fontSize: 22, lineHeight: 1 }}>×</button>
        </div>

        <div style={{
          background: COLORS.bg, border: `1px solid ${COLORS.border}`,
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
            Why do you want to connect with {target.name.split(" ")[0]}? <span style={{ color: COLORS.red }}>*</span>
          </label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value.slice(0, MAX))}
            placeholder={`Tell ${target.name.split(" ")[0]} why you'd like to connect — be specific and genuine.`}
            rows={5}
            autoFocus
            style={{
              width: "100%", padding: "12px 16px", borderRadius: 12,
              background: COLORS.bg, border: `1px solid ${COLORS.border}`,
              color: COLORS.text, fontSize: 14, outline: "none", resize: "none", boxSizing: "border-box",
            }}
          />
          <p style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4, textAlign: "right" }}>
            {note.length} / {MAX}
          </p>
        </div>

        <button
          onClick={handleSend}
          disabled={note.trim().length < MIN || sending || sentOk}
          style={{
            padding: "14px", borderRadius: 12, border: "none",
            background: sentOk ? COLORS.green : note.trim().length >= MIN && !sending ? COLORS.accent : COLORS.border,
            color: sentOk || (note.trim().length >= MIN && !sending) ? "#000" : COLORS.textMuted,
            cursor: note.trim().length >= MIN && !sending && !sentOk ? "pointer" : "not-allowed",
            fontSize: 14, fontWeight: 700,
          }}
        >
          {sentOk ? "Request Sent ✓" : sending ? "Sending..." : `Send Request to ${target.name.split(" ")[0]}`}
        </button>

        <button
          onClick={onCancel}
          style={{
            padding: "12px", borderRadius: 12,
            border: `1px solid ${COLORS.border}`,
            background: "transparent", color: COLORS.textMuted,
            cursor: "pointer", fontSize: 14,
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function Discover({ users, onConnect, onPass, onViewProfile, onLoadMore, loadingMore, hasMore, user, seenUids, setSeenUids }) {
  const [showShare, setShowShare] = useState(false);
  const [connectTarget, setConnectTarget] = useState(null);

  useEffect(() => {
    if (!users || loadingMore || !hasMore) return;
    if (users.filter(u => !seenUids.has(u.uid)).length < 5) onLoadMore();
  }, [users?.length, loadingMore, hasMore]); // eslint-disable-line

  if (users === null) return (
    <div style={{ padding: 24, textAlign: "center", paddingTop: 80, color: COLORS.textMuted }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
      <p>Finding people...</p>
    </div>
  );

  const remaining = users.filter(u => !seenUids.has(u.uid));
  const current = remaining[0];

  const advance = (targetUser) => {
    const next = new Set([...seenUids, targetUser.uid]);
    setSeenUids(next);
    if (users.filter(u => !next.has(u.uid)).length < 5 && hasMore && !loadingMore) onLoadMore();
  };

  const act = (action) => {
    if (action === "pass") onPass(current);
    advance(current);
  };

  if (!current) return (
    <div style={{ padding: 24, textAlign: "center", paddingTop: 80, color: COLORS.textMuted }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🐦</div>
      <h3 style={{ fontSize: 20, marginBottom: 8, color: COLORS.text }}>You're one of the first.</h3>
      <p style={{ fontSize: 14, marginBottom: 6 }}>You're among the first 100 people on Link-Ap — which means you get access to everything, free forever.</p>
      <p style={{ fontSize: 14, marginBottom: 16 }}>We'll notify you the moment someone worth connecting with joins. Sit tight.</p>
      <p style={{ fontSize: 14, marginBottom: 16 }}>Share Link-Ap with someone and they'll also qualify for free access — forever.</p>
      <button onClick={() => setShowShare(true)} style={{
        display: "block", margin: "0 auto 20px", padding: "10px 24px",
        borderRadius: 12, border: `1px solid ${COLORS.border}`,
        background: "transparent", color: COLORS.text, cursor: "pointer",
        fontSize: 14, fontWeight: 500,
      }}>Share with someone</button>
      <div style={{ display: "inline-block", padding: "6px 14px", borderRadius: 20, border: `1px solid ${COLORS.border}`, fontSize: 13, color: COLORS.textMuted, backgroundColor: COLORS.card }}>🎟 Founding Member</div>
      {showShare && user && <ShareModal user={user} onClose={() => setShowShare(false)} />}
    </div>
  );

  return (
    <div style={{ padding: "16px 20px" }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: COLORS.text }}>Discover People</h2>
        <p style={{ color: COLORS.textMuted, fontSize: 13 }}>{remaining.length} people to explore</p>
      </div>

      <button
        onClick={() => setShowShare(true)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 10,
          background: COLORS.card, border: `1px solid ${COLORS.border}`,
          borderRadius: 12, padding: "10px 14px", cursor: "pointer",
          marginBottom: 16, color: COLORS.textMuted, fontSize: 13, fontWeight: 500,
        }}
      >
        <span style={{ fontSize: 16 }}>📲</span>
        <span style={{ color: COLORS.text }}>Invite someone to Link-Ap</span>
      </button>
      {showShare && user && <ShareModal user={user} onClose={() => setShowShare(false)} />}

      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 24, overflow: "hidden" }}>
        <div style={{ height: 4, background: current.color }} />
        <div style={{ padding: 24 }}>
          <div
            onClick={() => onViewProfile && onViewProfile(current)}
            style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 20, cursor: "pointer" }}
          >
            <Avatar initials={current.avatar} color={current.color} size={60} photoURL={current.photoURL} />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.text }}>{current.name}</div>
                {current.pronouns && <span style={{ fontSize: 11, color: COLORS.textMuted, fontStyle: "italic" }}>{current.pronouns}</span>}
              </div>
              <div style={{ color: current.color, fontSize: 13, marginBottom: 4 }}>{current.role}</div>
              <div style={{ color: COLORS.textMuted, fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}><LocationPin /> {current.location}</div>
            </div>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: COLORS.text, marginBottom: 20 }}>{current.bio}</p>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 8, fontWeight: 600 }}>SKILLS</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {current.skills?.map(s => <Tag key={s} label={s} color={current.color} />)}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 8, fontWeight: 600 }}>LOOKING FOR</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {current.lookingFor?.map(s => <Tag key={s} label={s} color={COLORS.accent} />)}
            </div>
          </div>
          {current.achievements?.length > 0 && (
            <div style={{ background: COLORS.bg, borderRadius: 12, padding: 14, border: `1px solid ${COLORS.border}` }}>
              <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 8, fontWeight: 600 }}>ACHIEVEMENTS</div>
              {current.achievements.map((a, i) => (
                <div key={i} style={{ fontSize: 13, color: COLORS.text, marginBottom: 4 }}>✦ {a}</div>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 12, padding: "0 24px 24px" }}>
          <button onClick={() => act("pass")} style={{
            flex: 1, padding: 14, borderRadius: 14, border: `1px solid ${COLORS.border}`,
            background: "transparent", color: COLORS.textMuted, cursor: "pointer", fontSize: 14,
          }}>Pass</button>
          <button onClick={() => setConnectTarget(current)} style={{
            flex: 2, padding: 14, borderRadius: 14, border: "none",
            background: COLORS.accent, color: "#000", cursor: "pointer", fontSize: 14, fontWeight: 700,
          }}>Connect ⚡</button>
        </div>
      </div>
      {connectTarget && (
        <ConnectNoteModal
          target={connectTarget}
          onSend={async (note) => {
            await onConnect(connectTarget, note);
            advance(connectTarget);
            setConnectTarget(null);
          }}
          onCancel={() => setConnectTarget(null)}
        />
      )}
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


function Matches({ matches, sent, received, firebaseUser, onChat, onViewProfile, onAcceptRequest, onDeclineRequest, onDiscover, blockedUids = new Set(), blockedByUids = [], onDisconnect }) {
  const [disconnectTarget, setDisconnectTarget] = useState(null);
  const hasActivity = matches.length > 0 || sent.length > 0 || received.length > 0;

  return (
    <div style={{ padding: "16px 20px" }}>
      {hasActivity && (
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: COLORS.text }}>Your Connections</h2>
          <p style={{ color: COLORS.textMuted, fontSize: 13 }}>{matches.length} mutual connections</p>
        </div>
      )}

      {!hasActivity && (
        <div style={{ textAlign: "center", paddingTop: 52, paddingBottom: 32, paddingLeft: 24, paddingRight: 24 }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%", margin: "0 auto 20px",
            background: COLORS.card, border: `1px solid ${COLORS.border}`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28,
          }}>🤝</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, margin: "0 0 10px" }}>
            No connections yet
          </h3>
          <p style={{ fontSize: 14, color: COLORS.textMuted, lineHeight: 1.7, margin: "0 0 6px" }}>
            You're one of the first 100 people on Link-Ap — which means free access, forever.
          </p>
          <p style={{ fontSize: 14, color: COLORS.textMuted, lineHeight: 1.7, margin: "0 0 28px" }}>
            Your next connection is one Discover away.
          </p>
          <button onClick={onDiscover} style={{
            padding: "12px 28px", borderRadius: 12, border: "none",
            background: COLORS.accent, color: "#000", cursor: "pointer",
            fontSize: 14, fontWeight: 700,
          }}>Go to Discover</button>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

        {/* ── Incoming connection requests ── */}
        {received.length > 0 && (
          <>
            <div style={{ fontSize: 11, color: COLORS.accent, fontWeight: 600 }}>
              CONNECTION REQUESTS — {received.length}
            </div>
            {received.map(req => (
              <div key={req.uid} style={{
                background: COLORS.card, border: `1px solid ${COLORS.accent}44`,
                borderRadius: 16, padding: 16, display: "flex", flexDirection: "column", gap: 12,
              }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div onClick={() => onViewProfile && onViewProfile(req)} style={{ cursor: "pointer", flexShrink: 0 }}>
                    <Avatar initials={req.avatar} color={req.color} size={48} photoURL={req.photoURL} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.text }}>{req.name}</div>
                    <div style={{ color: req.color, fontSize: 12 }}>{req.role}</div>
                    <div style={{ color: COLORS.textMuted, fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}><LocationPin /> {req.location}</div>
                  </div>
                </div>

                {req.note && (
                  <div style={{
                    background: COLORS.bg, borderRadius: 10, padding: "10px 14px",
                    borderLeft: `3px solid ${COLORS.accent}`,
                  }}>
                    <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 4, fontWeight: 600 }}>REASON FOR CONNECTING</div>
                    <p style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.6, margin: 0 }}>{req.note}</p>
                  </div>
                )}

                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => onAcceptRequest(req)} style={{
                    flex: 2, padding: "9px 0", borderRadius: 10, border: "none",
                    background: COLORS.accent, color: "#000", cursor: "pointer", fontSize: 12, fontWeight: 700,
                  }}>Accept ✓</button>
                  <button onClick={() => onDeclineRequest(req)} style={{
                    flex: 1, padding: "9px 0", borderRadius: 10,
                    border: `1px solid ${COLORS.red}44`, background: "transparent",
                    color: COLORS.red, cursor: "pointer", fontSize: 12,
                  }}>Decline</button>
                </div>
              </div>
            ))}
            {matches.length > 0 && <div style={{ height: 1, background: COLORS.border, margin: "4px 0" }} />}
          </>
        )}

        {/* ── Mutual matches ── */}
        {matches.filter(u => !sent.find(s => s.uid === u.uid) && !blockedUids.has(u.uid) && !blockedByUids.includes(u.uid)).map(u => (
          <div key={u.uid} onClick={() => onChat(u.uid)} style={{
            background: COLORS.card, border: `1px solid ${COLORS.border}`,
            borderRadius: 16, padding: 16, display: "flex", gap: 14, alignItems: "center", cursor: "pointer",
          }}>
            <div onClick={(e) => { e.stopPropagation(); onViewProfile && onViewProfile(u); }} style={{ flexShrink: 0 }}>
              <Avatar initials={u.avatar} color={u.color} size={48} photoURL={u.photoURL} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.text }}>{u.name}</div>
              <div style={{ color: u.color, fontSize: 12, marginBottom: 6 }}>{u.role}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {u.lookingFor?.slice(0, 2).map(l => <Tag key={l} label={l} color={COLORS.accent} />)}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
              <div style={{ color: COLORS.textMuted, fontSize: 20 }}>→</div>
              {onDisconnect && (
                <button
                  onClick={(e) => { e.stopPropagation(); setDisconnectTarget(u); }}
                  style={{ background: "none", border: "none", color: COLORS.red, cursor: "pointer", fontSize: 11, opacity: 0.65, padding: "2px 4px", lineHeight: 1 }}
                  title="Remove connection"
                >✕ remove</button>
              )}
            </div>
          </div>
        ))}

        {/* ── Pending sent requests ── */}
        {sent.length > 0 && (
          <>
            <div style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: 600, marginTop: 8 }}>PENDING REQUESTS</div>
            {sent.map(u => (
              <div key={u.uid} style={{
                background: COLORS.card, border: `1px dashed ${COLORS.border}`,
                borderRadius: 16, padding: 16, display: "flex", flexDirection: "column", gap: 10,
                opacity: 0.7,
              }}>
                <div style={{ display: "flex", gap: 14, alignItems: "center", cursor: "pointer" }}
                  onClick={() => onViewProfile && onViewProfile(u)}>
                  <Avatar initials={u.avatar} color={u.color} size={48} photoURL={u.photoURL} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.text }}>{u.name}</div>
                    <div style={{ color: u.color, fontSize: 12, marginBottom: 2 }}>{u.role}</div>
                    <div style={{ fontSize: 12, color: COLORS.textMuted }}>Waiting for them to respond...</div>
                  </div>
                </div>
                {u.note && (
                  <div style={{ background: COLORS.bg, borderRadius: 10, padding: "8px 12px", borderLeft: `3px solid ${COLORS.border}` }}>
                    <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 2, fontWeight: 600 }}>YOUR NOTE</div>
                    <p style={{ fontSize: 12, color: COLORS.textMuted, lineHeight: 1.5, margin: 0 }}>{u.note}</p>
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>

      {disconnectTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, width: "100%", maxWidth: 360, padding: 24 }}>
            <div style={{ fontWeight: 700, color: COLORS.text, fontSize: 17, marginBottom: 10 }}>Remove {disconnectTarget.name.split(" ")[0]}?</div>
            <p style={{ color: COLORS.textMuted, fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
              They will be removed from your connections. Your chat history is kept. They can reappear in Discover.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setDisconnectTarget(null)} style={{ flex: 1, padding: "12px", borderRadius: 10, border: `1px solid ${COLORS.border}`, background: "none", color: COLORS.text, cursor: "pointer", fontSize: 14 }}>Cancel</button>
              <button
                onClick={() => { onDisconnect(disconnectTarget.uid); setDisconnectTarget(null); }}
                style={{ flex: 1, padding: "12px", borderRadius: 10, border: "none", background: COLORS.red, color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700 }}
              >Remove</button>
            </div>
          </div>
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