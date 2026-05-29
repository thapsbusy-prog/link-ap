import { useState } from "react";
import { COLORS, Avatar, Tag, LocationPin } from "./shared";

export function Matches({ matches, sent, received, firebaseUser, user, onChat, onViewProfile, onAcceptRequest, onDeclineRequest, onDiscover, blockedUids = new Set(), blockedByUids = [], onDisconnect }) {
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
            {user?.plan === "founding_member"
              ? "Founding Member — permanent free access."
              : "Free plan — static templates included. Upgrade to Pro for AI-powered tools."}
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
                  <button onClick={() => { console.log("[Accept] button clicked, requestUid:", req.uid); onAcceptRequest(req); }} style={{
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
