import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { analytics, logEvent, auth } from "./firebase";
import { COLORS, Avatar, Tag, LocationPin, LinkedInIcon, LOOKING_FOR_QUESTIONS, isProfileComplete } from "./shared";

const renderLookingForValue = (q, val) => {
  if (!val) return val;
  if (q.type === "email") return <a href={`mailto:${val}`} style={{ color: COLORS.accent, textDecoration: "none" }}>{val}</a>;
  if (q.type === "url") {
    const href = /^https?:\/\//i.test(val) ? val : `https://${val}`;
    return <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: COLORS.accent, textDecoration: "none" }}>{val}</a>;
  }
  return val;
};

export function PublicProfile({ profileUser, onClose, currentUserUid, blocked, onBlock, onUnblock, matches, onDisconnect, onView }) {
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const isMutualMatch = matches?.some(m => m.uid === profileUser.uid);

  useEffect(() => {
    if (onView) onView();
  }, []); // eslint-disable-line
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
                          <div style={{ fontSize: 14, color: COLORS.text, fontWeight: 600, lineHeight: 1.5 }}>{renderLookingForValue(q, profileUser.lookingForDetails[q.key])}</div>
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

  // Radial glow
  const glow = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, 420);
  glow.addColorStop(0, "rgba(245,166,35,0.18)");
  glow.addColorStop(1, "rgba(245,166,35,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, 420);

  // Gold top bar
  ctx.fillStyle = "#F5A623";
  ctx.fillRect(0, 0, W, 3);

  // "Link-Ap" wordmark
  ctx.textBaseline = "alphabetic";
  ctx.font = "bold 64px -apple-system, BlinkMacSystemFont, Arial, sans-serif";
  const lw = ctx.measureText("Link").width;
  const aw = ctx.measureText("-Ap").width;
  const tx = (W - lw - aw) / 2;
  ctx.textAlign = "left";
  ctx.fillStyle = "#F0EEE8"; ctx.fillText("Link", tx, 152);
  ctx.fillStyle = "#F5A623"; ctx.fillText("-Ap", tx + lw, 152);

  // "AI-Powered Networking" badge pill
  ctx.font = "bold 13px -apple-system, BlinkMacSystemFont, Arial, sans-serif";
  const badgeLabel = "AI-Powered Professional Networking";
  const badgeW = ctx.measureText(badgeLabel).width + 30;
  const badgeX = (W - badgeW) / 2;
  roundRect(ctx, badgeX, 170, badgeW, 26, 13);
  ctx.fillStyle = "rgba(245,166,35,0.14)"; ctx.fill();
  ctx.strokeStyle = "rgba(245,166,35,0.35)"; ctx.lineWidth = 1; ctx.stroke();
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillStyle = "#F5A623"; ctx.fillText(badgeLabel, W / 2, 183);

  // Divider
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#2A2A3A";
  ctx.fillRect(W * 0.18, 220, W * 0.64, 1);

  // Section label
  ctx.font = "bold 12px -apple-system, BlinkMacSystemFont, Arial, sans-serif";
  ctx.textAlign = "center"; ctx.fillStyle = "#F5A623";
  ctx.fillText("WHAT'S INSIDE", W / 2, 248);

  // AI feature cards (4 × 62px tall, 10px gap → period 72)
  const features = [
    { label: "AI Pulse", desc: "Daily AI trends explained for builders" },
    { label: "Profile Score", desc: "Know exactly how to stand out" },
    { label: "Note Assistant", desc: "AI drafts your connection note in one tap" },
    { label: "Chat Starters", desc: "Break the ice with every new match" },
  ];
  const CH = 62, GAP = 10, PERIOD = CH + GAP;
  features.forEach(({ label, desc }, i) => {
    const cy = 266 + i * PERIOD, cx = W * 0.07, cw = W * 0.86;
    ctx.fillStyle = "#13131A";
    roundRect(ctx, cx, cy, cw, CH, 12); ctx.fill();
    // Accent left bar
    ctx.fillStyle = "#F5A623";
    ctx.fillRect(cx, cy + 12, 3, CH - 24);
    // Label (bold)
    ctx.font = "bold 15px -apple-system, BlinkMacSystemFont, Arial, sans-serif";
    ctx.textAlign = "left"; ctx.textBaseline = "middle";
    ctx.fillStyle = "#F5A623"; ctx.fillText(label, cx + 20, cy + CH / 2 - 9);
    // Description
    ctx.font = "14px -apple-system, BlinkMacSystemFont, Arial, sans-serif";
    ctx.fillStyle = "#C0BEB8"; ctx.fillText(desc, cx + 20, cy + CH / 2 + 11);
    ctx.textBaseline = "alphabetic";
  });
  // Last card bottom: 266 + 3*72 + 62 = 266 + 216 + 62 = 544

  // Italic statement
  ctx.font = "italic 19px -apple-system, BlinkMacSystemFont, Arial, sans-serif";
  ctx.textAlign = "center"; ctx.fillStyle = "#F0EEE8";
  ctx.fillText("Where smart people connect smarter.", W / 2, 592);

  // Role / value lines
  ctx.font = "14px -apple-system, BlinkMacSystemFont, Arial, sans-serif";
  ctx.fillStyle = "#8A8A9A";
  ctx.fillText("Co-founders · Investors · Mentors · Collaborators", W / 2, 648);
  ctx.fillText("AI-matched. Intent-first. Free to join.", W / 2, 678);

  // Divider
  ctx.fillStyle = "#2A2A3A";
  ctx.fillRect(W * 0.18, 730, W * 0.64, 1);

  // CTA
  ctx.font = "13px -apple-system, BlinkMacSystemFont, Arial, sans-serif";
  ctx.fillStyle = "#8A8A9A";
  ctx.fillText("Join now at", W / 2, 772);

  ctx.font = "bold 38px -apple-system, BlinkMacSystemFont, Arial, sans-serif";
  ctx.fillStyle = "#F5A623";
  ctx.fillText("link-ap.online", W / 2, 824);

  // Gold footer bar
  ctx.fillStyle = "#F5A623";
  ctx.fillRect(0, 870, W, 90);

  ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, Arial, sans-serif";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillStyle = "#000000";
  ctx.fillText("Join Link-Ap  →", W / 2, 915);
}

export function ShareModal({ user, onClose }) {
  const canvasRef = useRef(null);
  const qrCanvasRef = useRef(null);
  const [posterBlob, setPosterBlob] = useState(null);
  const [view, setView] = useState("invite");
  const [copied, setCopied] = useState(false);

  const profileUrl = `https://link-ap.online/user/${user.uid}`;

  useEffect(() => {
    if (!canvasRef.current) return;
    drawInvitePoster(canvasRef.current);
    canvasRef.current.toBlob(blob => setPosterBlob(blob));
  }, []); // eslint-disable-line

  useEffect(() => {
    if (view !== "profile" || !qrCanvasRef.current) return;
    logEvent(analytics, "qr_code_viewed");
    QRCode.toCanvas(qrCanvasRef.current, "https://link-ap.online", {
      width: 220,
      margin: 2,
      color: { dark: "#F0EEE8", light: "#13131A" },
    });
  }, [view, profileUrl]);

  const linkMessage = `Hey! Join me on Link-Ap - a networking app that connects you with the right people - https://link-ap.online`;

  const handleSave = () => {
    if (!canvasRef.current) return;
    const a = document.createElement("a");
    a.download = "link-ap-invite.png";
    a.href = canvasRef.current.toDataURL("image/png");
    a.click();
  };

  const handleSaveQR = () => {
    if (!qrCanvasRef.current) return;
    const a = document.createElement("a");
    a.download = "link-ap-profile-qr.png";
    a.href = qrCanvasRef.current.toDataURL("image/png");
    a.click();
  };

  const handleCopy = () => {
    logEvent(analytics, "profile_link_copied");
    navigator.clipboard.writeText(profileUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
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

  const handleShareProfile = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: `${user.name} on Link-Ap`, url: profileUrl }); return; } catch (err) { if (err.name === "AbortError") return; }
    }
    handleCopy();
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
          <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.text }}>Share</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: COLORS.textMuted, cursor: "pointer", fontSize: 24, lineHeight: 1 }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, background: COLORS.bg, borderRadius: 12, padding: 4 }}>
          {[{ id: "invite", label: "Invite Someone" }, { id: "profile", label: "My Profile" }].map(t => (
            <button key={t.id} onClick={() => setView(t.id)} style={{
              flex: 1, padding: "8px 0", borderRadius: 10, border: "none", cursor: "pointer",
              background: view === t.id ? COLORS.card : "transparent",
              color: view === t.id ? COLORS.text : COLORS.textMuted,
              fontSize: 13, fontWeight: view === t.id ? 700 : 500,
              boxShadow: view === t.id ? `0 1px 4px rgba(0,0,0,0.3)` : "none",
            }}>{t.label}</button>
          ))}
        </div>

        {view === "invite" && (
          <>
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
          </>
        )}

        {view === "profile" && (
          <>
            <p style={{ fontSize: 13, color: COLORS.textMuted, margin: 0, lineHeight: 1.6 }}>
              Share your profile link or invite someone to join Link-Ap and connect with you.
            </p>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, background: COLORS.bg, borderRadius: 14, padding: 20 }}>
              <canvas ref={qrCanvasRef} style={{ borderRadius: 8, display: "block" }} />
              <div style={{ fontSize: 12, color: COLORS.textMuted, textAlign: "center" }}>
                Scan to discover Link-Ap and connect with {user.name.split(" ")[0]}
              </div>
            </div>
            <div style={{
              background: COLORS.bg, border: `1px solid ${COLORS.border}`,
              borderRadius: 12, padding: "12px 14px",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
            }}>
              <div style={{ fontSize: 12, color: COLORS.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                {profileUrl}
              </div>
              <button onClick={handleCopy} style={{
                padding: "6px 14px", borderRadius: 8, border: "none", flexShrink: 0,
                background: copied ? COLORS.green : COLORS.accent,
                color: "#000", cursor: "pointer", fontSize: 12, fontWeight: 700,
              }}>{copied ? "Copied ✓" : "Copy"}</button>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleSaveQR} style={{
                flex: 1, padding: "12px 8px", borderRadius: 12,
                border: `1px solid ${COLORS.border}`, background: "transparent",
                color: COLORS.text, cursor: "pointer", fontSize: 13, fontWeight: 500,
              }}>Save QR</button>
              <button onClick={handleShareProfile} style={{
                flex: 2, padding: "12px 8px", borderRadius: 12, border: "none",
                background: COLORS.accent, color: "#000", cursor: "pointer",
                fontSize: 13, fontWeight: 700,
              }}>Share Link-Ap</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ConnectNoteModal({ target, onSend, onCancel, aiEnabled = true }) {
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [sentOk, setSentOk] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [draftError, setDraftError] = useState(false);
  const [sendError, setSendError] = useState(false);
  const MAX = 300;
  const MIN = 10;

  const handleSend = async () => {
    if (note.trim().length < MIN || sending) return;
    setSending(true);
    setSendError(false);
    try {
      await onSend(note.trim());
      setSending(false);
      setSentOk(true);
    } catch (e) {
      setSending(false);
      setSendError(true);
      setTimeout(() => setSendError(false), 4000);
    }
  };

  const handleDraftWithAI = async () => {
    if (drafting) return;
    setDrafting(true);
    setDraftError(false);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch("/api/note-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ targetUid: target.uid }),
      });
      const data = await res.json();
      if (data.note) {
        setNote(data.note.slice(0, MAX));
      } else {
        setDraftError(true);
      }
    } catch {
      setDraftError(true);
    } finally {
      setDrafting(false);
    }
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <label style={{ fontSize: 12, color: COLORS.textMuted }}>
              Why do you want to connect with {target.name.split(" ")[0]}? <span style={{ color: COLORS.red }}>*</span>
            </label>
            {aiEnabled ? (
              <button
                onClick={handleDraftWithAI}
                disabled={drafting || sentOk}
                style={{
                  background: "transparent", border: `1px solid ${COLORS.accent}66`,
                  borderRadius: 8, padding: "3px 10px",
                  color: drafting ? COLORS.textMuted : COLORS.accent,
                  fontSize: 11, fontWeight: 600, cursor: drafting ? "default" : "pointer",
                  flexShrink: 0,
                }}
              >
                {drafting ? "Drafting…" : "✦ AI draft"}
              </button>
            ) : (
              <span style={{
                fontSize: 10, color: COLORS.textMuted,
                display: "flex", alignItems: "center", gap: 4,
              }}>
                <svg viewBox="0 0 24 24" fill="none" stroke={COLORS.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="10" height="10">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Complete profile to use AI draft
              </span>
            )}
          </div>
          {draftError && (
            <p style={{ fontSize: 11, color: COLORS.textMuted, margin: "0 0 6px" }}>
              Couldn't generate a draft — write your own below.
            </p>
          )}
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

        {sendError && (
          <p style={{ fontSize: 12, color: COLORS.red, textAlign: "center", margin: 0 }}>
            Failed to send — please try again.
          </p>
        )}
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

export function Discover({ users, onConnect, onPass, onViewProfile, onLoadMore, loadingMore, hasMore, user, seenUids, setSeenUids }) {
  const [showShare, setShowShare] = useState(false);
  const [connectTarget, setConnectTarget] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const explanationCache = useRef({});

  const DAILY_LIMIT = 3;
  const getToday = () => new Date().toISOString().slice(0, 10);

  const [dailyActedCount, setDailyActedCount] = useState(() => {
    if (!user?.uid) return 0;
    try {
      const stored = JSON.parse(localStorage.getItem(`dailyDiscover_${user.uid}`) || "null");
      if (stored?.date === getToday()) return stored.actedUids?.length || 0;
    } catch {}
    return 0;
  });

  // Restore today's acted UIDs into seenUids on mount so they don't reappear after refresh
  useEffect(() => {
    if (!user?.uid) return;
    try {
      const stored = JSON.parse(localStorage.getItem(`dailyDiscover_${user.uid}`) || "null");
      if (stored?.date === getToday() && stored.actedUids?.length > 0) {
        setSeenUids(prev => {
          const next = new Set(prev);
          stored.actedUids.forEach(uid => next.add(uid));
          return next;
        });
      }
    } catch {}
  }, []); // eslint-disable-line

  const recordDailyAct = (uid) => {
    if (!user?.uid) return;
    const today = getToday();
    const key = `dailyDiscover_${user.uid}`;
    try {
      const stored = JSON.parse(localStorage.getItem(key) || "null");
      const prev = stored?.date === today ? (stored.actedUids || []).filter(u => u !== uid) : [];
      const actedUids = [...prev, uid];
      localStorage.setItem(key, JSON.stringify({ date: today, actedUids }));
      setDailyActedCount(actedUids.length);
    } catch {}
  };

  const firstUnseen = users ? users.find(u => !seenUids.has(u.uid)) : null;
  const currentUid = firstUnseen?.uid ?? null;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!currentUid || !user || !isProfileComplete(user)) { setExplanation(null); setLoadingExplanation(false); return; }
      if (explanationCache.current[currentUid] !== undefined) {
        setExplanation(explanationCache.current[currentUid]);
        setLoadingExplanation(false);
        return;
      }
      setExplanation(null);
      setLoadingExplanation(true);
      const targetUser = users.find(u => u.uid === currentUid);
      if (!targetUser) { setLoadingExplanation(false); return; }
      const idToken = await auth.currentUser?.getIdToken().catch(() => null);
      if (cancelled) return;
      try {
        const r = await fetch("/api/match-explain", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(idToken ? { "Authorization": `Bearer ${idToken}` } : {}) },
          body: JSON.stringify({
            currentUser: { lookingFor: user.lookingFor, bringToTable: user.bringToTable, lookingForDetails: user.lookingForDetails, currentlyExploring: user.currentlyExploring, skills: user.skills, role: user.role },
            targetUser: { uid: targetUser.uid, lookingFor: targetUser.lookingFor, bringToTable: targetUser.bringToTable, lookingForDetails: targetUser.lookingForDetails, currentlyExploring: targetUser.currentlyExploring, skills: targetUser.skills, role: targetUser.role, name: targetUser.name },
          }),
        });
        const data = await r.json();
        if (cancelled) return;
        const result = data.explanation ?? null;
        explanationCache.current[currentUid] = result;
        setExplanation(result);
        setLoadingExplanation(false);
      } catch {
        if (cancelled) return;
        explanationCache.current[currentUid] = null;
        setExplanation(null);
        setLoadingExplanation(false);
      }
    })();
    return () => { cancelled = true; };
  }, [currentUid]); // eslint-disable-line

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
    recordDailyAct(targetUser.uid);
    if (users.filter(u => !next.has(u.uid)).length < 5 && hasMore && !loadingMore) onLoadMore();
  };

  const act = (action) => {
    if (action === "pass") onPass(current);
    advance(current);
  };

  if (dailyActedCount >= DAILY_LIMIT) return (
    <div style={{ padding: 24, textAlign: "center", paddingTop: 80, color: COLORS.textMuted }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🌙</div>
      <h3 style={{ fontSize: 20, marginBottom: 8, color: COLORS.text }}>That's your 3 for today.</h3>
      {user?.plan === "founding_member"
        ? <p style={{ fontSize: 14, marginBottom: 6, lineHeight: 1.6 }}>Founding Member — permanent free access. You get 3 curated connections per day — quality over quantity.</p>
        : <p style={{ fontSize: 14, marginBottom: 6, lineHeight: 1.6 }}>Free plan — static templates included. Upgrade to Pro for AI-powered tools.</p>
      }
      <p style={{ fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>Come back tomorrow for more.</p>
      <div style={{ display: "inline-block", padding: "6px 14px", borderRadius: 20, border: `1px solid ${COLORS.border}`, fontSize: 13, color: COLORS.textMuted, backgroundColor: COLORS.card }}>Resets at midnight</div>
    </div>
  );

  if (!current) return (
    <div style={{ padding: 24, textAlign: "center", paddingTop: 80, color: COLORS.textMuted }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🐦</div>
      <h3 style={{ fontSize: 20, marginBottom: 8, color: COLORS.text }}>You're one of the first.</h3>
      {user?.plan === "founding_member"
        ? <p style={{ fontSize: 14, marginBottom: 6 }}>You're a Founding Member. As one of Link-Ap's first 100 members, you have free access to all features — including AI-powered tools — for as long as Link-Ap offers a free tier. Fair use applies (50 AI calls/month).</p>
        : <p style={{ fontSize: 14, marginBottom: 6 }}>Free plan — static templates included. Upgrade to Pro for AI-powered tools.</p>
      }
      <p style={{ fontSize: 14, marginBottom: 16 }}>We'll notify you the moment someone worth connecting with joins. Sit tight.</p>
      {user?.plan === "founding_member" && (
        <p style={{ fontSize: 14, marginBottom: 16 }}>Share Link-Ap with someone and help them discover who's building something worth joining.</p>
      )}
      <button onClick={() => setShowShare(true)} style={{
        display: "block", margin: "0 auto 20px", padding: "10px 24px",
        borderRadius: 12, border: `1px solid ${COLORS.border}`,
        background: "transparent", color: COLORS.text, cursor: "pointer",
        fontSize: 14, fontWeight: 500,
      }}>Share with someone</button>
      <div style={{ display: "inline-block", padding: "6px 14px", borderRadius: 20, border: `1px solid ${COLORS.border}`, fontSize: 13, color: COLORS.textMuted, backgroundColor: COLORS.card }}>
        {user?.plan === "founding_member" ? "⭐ Founding Member" : "Free plan"}
      </div>
      {showShare && user && <ShareModal user={user} onClose={() => setShowShare(false)} />}
    </div>
  );

  return (
    <div style={{ padding: "16px 20px" }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: COLORS.text }}>Discover People</h2>
        <p style={{ color: COLORS.textMuted, fontSize: 13 }}>{DAILY_LIMIT - dailyActedCount} of {DAILY_LIMIT} left today</p>
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
          {!isProfileComplete(user) ? (
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 14px", marginBottom: 20,
              background: "rgba(245,166,35,0.07)",
              border: "1px solid rgba(245,166,35,0.2)",
              borderRadius: 10,
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke={COLORS.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" style={{ flexShrink: 0 }}>
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <span style={{ fontSize: 11, color: COLORS.textMuted, lineHeight: 1.5 }}>
                Complete your profile to unlock <span style={{ color: COLORS.accent, fontWeight: 600 }}>✦ Why Connect</span> AI insights
              </span>
            </div>
          ) : (
            <>
              {loadingExplanation && (
                <div style={{ marginBottom: 20 }}>
                  <style>{`@keyframes matchExplainPulse { 0%,100%{opacity:0.25} 50%{opacity:0.6} }`}</style>
                  <div style={{ height: 10, borderRadius: 4, background: COLORS.border, marginBottom: 6, width: "90%", animation: "matchExplainPulse 1.4s ease-in-out infinite" }} />
                  <div style={{ height: 10, borderRadius: 4, background: COLORS.border, width: "65%", animation: "matchExplainPulse 1.4s ease-in-out infinite 0.2s" }} />
                </div>
              )}
              {!loadingExplanation && explanation && (
                <div style={{
                  borderLeft: `2px solid ${COLORS.accent}`,
                  background: COLORS.bg,
                  borderRadius: "0 8px 8px 0",
                  padding: "10px 14px",
                  marginBottom: 20,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.accent, marginBottom: 6 }}>✦ Why connect</div>
                  <p style={{ fontSize: 13, lineHeight: 1.5, color: COLORS.text, margin: 0 }}>{explanation}</p>
                </div>
              )}
            </>
          )}
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
          aiEnabled={isProfileComplete(user)}
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
