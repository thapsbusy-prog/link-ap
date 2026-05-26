import { useState, useEffect, useCallback } from "react";
import { COLORS } from "./shared";

const CATEGORY_COLORS = {
  Productivity: "#7C3AED",
  Tools:        "#0EA5E9",
  Business:     "#F5A623",
  Design:       "#EC4899",
  Marketing:    "#10B981",
  Research:     "#6366F1",
  Coding:       "#14B8A6",
  Strategy:     "#F59E0B",
};

function formatAge(ts) {
  if (!ts) return null;
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function TrendCard({ card }) {
  const [expanded, setExpanded] = useState(false);
  const catColor = CATEGORY_COLORS[card.category] || COLORS.accent;

  const handleShare = async (e) => {
    e.stopPropagation();
    const text = `${card.headline}\n\n${card.summary}\n\nHow to use: ${card.howToUse}\n\nvia link-ap.online`;
    if (navigator.share) {
      try { await navigator.share({ text }); } catch {}
    } else {
      try { await navigator.clipboard.writeText(text); } catch {}
    }
  };

  return (
    <div
      onClick={() => setExpanded(e => !e)}
      style={{
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 16,
        marginBottom: 12,
        overflow: "hidden",
        cursor: "pointer",
        transition: "border-color 0.15s",
      }}
    >
      <div style={{ height: 3, background: catColor }} />
      <div style={{ padding: "16px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8,
            color: catColor, background: `${catColor}22`, padding: "3px 8px", borderRadius: 6,
          }}>
            {card.category}
          </span>
          <button
            onClick={handleShare}
            style={{
              background: "transparent", border: "none", cursor: "pointer",
              color: COLORS.textMuted, padding: "2px 6px", fontSize: 13,
            }}
            title="Share this trend"
          >
            ↗
          </button>
        </div>

        <h3 style={{ fontSize: 15, fontWeight: 700, color: COLORS.text, lineHeight: 1.35, margin: "0 0 10px" }}>
          {card.headline}
        </h3>

        <p style={{ fontSize: 13, color: COLORS.textMuted, lineHeight: 1.6, margin: 0 }}>
          {card.summary}
        </p>

        {expanded && (
          <div style={{
            marginTop: 14, padding: "12px 14px", borderRadius: 10,
            background: `${catColor}18`, border: `1px solid ${catColor}35`,
          }}>
            <p style={{
              fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8,
              color: catColor, margin: "0 0 6px",
            }}>
              How to use this
            </p>
            <p style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.6, margin: 0 }}>
              {card.howToUse}
            </p>
          </div>
        )}

        <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
          <span style={{ fontSize: 11, color: COLORS.textMuted }}>
            {expanded ? "Less ▲" : "How to use ▼"}
          </span>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard({ index }) {
  return (
    <div style={{
      background: COLORS.card, border: `1px solid ${COLORS.border}`,
      borderRadius: 16, marginBottom: 12, overflow: "hidden",
      opacity: 1 - index * 0.15,
    }}>
      <div style={{ height: 3, background: COLORS.border }} />
      <div style={{ padding: "16px 18px" }}>
        <div style={{ width: 64, height: 18, background: COLORS.border, borderRadius: 6, marginBottom: 12 }} />
        <div style={{ width: "80%", height: 16, background: COLORS.border, borderRadius: 6, marginBottom: 8 }} />
        <div style={{ width: "60%", height: 16, background: COLORS.border, borderRadius: 6, marginBottom: 14 }} />
        <div style={{ width: "100%", height: 12, background: COLORS.border, borderRadius: 4, marginBottom: 6 }} />
        <div style={{ width: "90%", height: 12, background: COLORS.border, borderRadius: 4, marginBottom: 6 }} />
        <div style={{ width: "70%", height: 12, background: COLORS.border, borderRadius: 4 }} />
      </div>
    </div>
  );
}

export default function Pulse({ firebaseUser }) {
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatedAt, setGeneratedAt] = useState(null);
  const [stale, setStale] = useState(false);

  const fetchTrends = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch("/api/pulse", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      setTrends(data.trends || []);
      setGeneratedAt(data.generatedAt || null);
      setStale(!!data.stale);
    } catch (err) {
      console.error("Pulse fetch error:", err);
      setError("Couldn't load trends right now.");
    } finally {
      setLoading(false);
    }
  }, [firebaseUser]);

  useEffect(() => { fetchTrends(); }, [fetchTrends]);

  return (
    <div style={{ padding: "16px 20px", paddingBottom: 32 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, margin: 0 }}>AI Pulse</h2>
              <span style={{
                fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1,
                color: COLORS.accent, background: `${COLORS.accent}22`, padding: "2px 6px", borderRadius: 4,
              }}>DAILY</span>
            </div>
            <p style={{ color: COLORS.textMuted, fontSize: 13, margin: 0 }}>
              What's moving in AI — explained for builders
            </p>
          </div>
          {!loading && (
            <button
              onClick={fetchTrends}
              style={{
                background: "transparent", border: `1px solid ${COLORS.border}`,
                color: COLORS.textMuted, borderRadius: 8, padding: "6px 12px",
                fontSize: 12, cursor: "pointer", flexShrink: 0,
              }}
            >
              Refresh
            </button>
          )}
        </div>
        {generatedAt && (
          <p style={{ fontSize: 11, color: COLORS.textMuted, margin: "8px 0 0" }}>
            Updated {formatAge(generatedAt)}{stale ? " · cached" : ""}
          </p>
        )}
      </div>

      {/* Loading skeletons */}
      {loading && [0, 1, 2, 3].map(i => <SkeletonCard key={i} index={i} />)}

      {/* Error state */}
      {!loading && error && (
        <div style={{
          padding: "24px 20px", borderRadius: 16, background: COLORS.card,
          border: `1px solid ${COLORS.border}`, textAlign: "center",
        }}>
          <p style={{ fontSize: 28, margin: "0 0 10px" }}>⚡</p>
          <p style={{ color: COLORS.textMuted, fontSize: 14, margin: "0 0 16px" }}>{error}</p>
          <button
            onClick={fetchTrends}
            style={{
              background: COLORS.accent, color: "#000", border: "none",
              borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      )}

      {/* Trend cards */}
      {!loading && !error && trends && (
        <>
          {trends.map((card, i) => <TrendCard key={i} card={card} />)}
          <p style={{ textAlign: "center", fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>
            Tap any card · Share trends with your network
          </p>
        </>
      )}
    </div>
  );
}
