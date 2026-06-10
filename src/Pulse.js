import { useState, useEffect, useCallback } from "react";
import { COLORS } from "./shared";

const CATEGORY_COLORS = {
  "Services":            "#0EA5E9",
  "Food & Trade":        "#F5A623",
  "Digital":             "#7C3AED",
  "Green/Agri":          "#10B981",
  "Skills & Education":  "#6366F1",
};

const REFRESH_DAYS = 5;
const DAY_MS = 24 * 60 * 60 * 1000;

function nextBatchLabel(ts) {
  if (!ts) return null;
  const elapsedDays = (Date.now() - ts) / DAY_MS;
  const remaining = Math.ceil(REFRESH_DAYS - elapsedDays);
  if (remaining <= 0) return "Fresh today";
  return `🌱 Next batch in ${remaining} day${remaining === 1 ? "" : "s"}`;
}

function IdeaCard({ idea }) {
  const [expanded, setExpanded] = useState(false);
  const catColor = CATEGORY_COLORS[idea.category] || COLORS.accent;

  const handleShare = async (e) => {
    e.stopPropagation();
    const text = `${idea.emoji} ${idea.title}\n\n${idea.whyInDemand}\n\nFound on Link-Ap — link-ap.online`;
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
            {idea.category}
          </span>
          <button
            onClick={handleShare}
            style={{
              background: "transparent", border: "none", cursor: "pointer",
              color: COLORS.textMuted, padding: "2px 6px", fontSize: 13,
            }}
            title="Share this idea"
          >
            ↗
          </button>
        </div>

        <h3 style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, lineHeight: 1.35, margin: "0 0 8px" }}>
          {idea.emoji} {idea.title}
        </h3>

        <span style={{
          display: "inline-block", fontSize: 11, fontWeight: 700, color: COLORS.accent,
          background: `${COLORS.accent}1A`, padding: "3px 8px", borderRadius: 6, marginBottom: 10,
        }}>
          💰 {idea.startupCost}
        </span>

        <p style={{ fontSize: 13, color: COLORS.textMuted, lineHeight: 1.6, margin: 0 }}>
          {idea.whyInDemand.split(/(?<=[.!?])\s+/)[0]}
        </p>

        {expanded && (
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              ["What it is", idea.whatItIs],
              ["Why it's in demand", idea.whyInDemand],
              ["Where the market is", idea.whereTheMarket],
              ["How to find clients", idea.howToFindClients],
              ["How to scale", idea.howToScale],
            ].map(([label, body]) => (
              <div key={label} style={{
                padding: "12px 14px", borderRadius: 10,
                background: `${catColor}18`, border: `1px solid ${catColor}35`,
              }}>
                <p style={{
                  fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8,
                  color: catColor, margin: "0 0 6px",
                }}>
                  {label}
                </p>
                <p style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.6, margin: 0 }}>
                  {body}
                </p>
              </div>
            ))}

            <div style={{
              padding: "12px 14px", borderRadius: 10,
              background: `${catColor}18`, border: `1px solid ${catColor}35`,
            }}>
              <p style={{
                fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8,
                color: catColor, margin: "0 0 8px",
              }}>
                How to start
              </p>
              <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
                {idea.howToStart.map((step, i) => (
                  <li key={i} style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.6 }}>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
          <span style={{ fontSize: 11, color: COLORS.textMuted }}>
            {expanded ? "Less ▲" : "Read the playbook ▼"}
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

export default function Pulse({ firebaseUser, user }) {
  const [ideas, setIdeas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatedAt, setGeneratedAt] = useState(null);
  const [stale, setStale] = useState(false);

  const fetchIdeas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch("/api/pulse", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      setIdeas(data.ideas || []);
      setGeneratedAt(data.generatedAt || null);
      setStale(!!data.stale);
    } catch (err) {
      console.error("Pulse fetch error:", err);
      setError("Couldn't load ideas right now.");
    } finally {
      setLoading(false);
    }
  }, [firebaseUser]);

  useEffect(() => { fetchIdeas(); }, [fetchIdeas]);

  return (
    <div style={{ padding: "16px 20px", paddingBottom: 32 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, margin: 0 }}>💡 Business Ideas</h2>
            </div>
            <p style={{ color: COLORS.textMuted, fontSize: 13, margin: 0 }}>
              5 fresh ideas every 5 days — built for South Africa
            </p>
          </div>
          {!loading && (
            <button
              onClick={fetchIdeas}
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
          <div style={{ marginTop: 10 }}>
            <span style={{
              fontSize: 11, fontWeight: 700, color: COLORS.accent,
              background: `${COLORS.accent}1A`, padding: "4px 10px", borderRadius: 20,
            }}>
              {nextBatchLabel(generatedAt)}{stale ? " · cached" : ""}
            </span>
          </div>
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
            onClick={fetchIdeas}
            style={{
              background: COLORS.accent, color: "#000", border: "none",
              borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      )}

      {/* Idea cards */}
      {!loading && !error && ideas && (
        <>
          {ideas.map((idea, i) => <IdeaCard key={i} idea={idea} />)}
          <p style={{ textAlign: "center", fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>
            Tap any card for the full playbook · Share ideas with your network
          </p>
        </>
      )}
    </div>
  );
}
