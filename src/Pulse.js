import { useState, useEffect, useCallback } from "react";
import { COLORS } from "./shared";

const CATEGORY_COLORS = {
  "Services":            "#0EA5E9",
  "Food & Trade":        "#F5A623",
  "Digital":             "#7C3AED",
  "Green/Agri":          "#10B981",
  "Skills & Education":  "#6366F1",
};

const DAY_MS = 24 * 60 * 60 * 1000;

const TIERS = [
  { id: "basic", label: "Basic Ideas", path: "/api/pulse", refreshDays: 5 },
  { id: "strategic", label: "Strategic Ideas", path: "/api/pulse-strategic", refreshDays: 7 },
];

function nextBatchLabel(ts, refreshDays) {
  if (!ts) return null;
  const elapsedDays = (Date.now() - ts) / DAY_MS;
  const remaining = Math.ceil(refreshDays - elapsedDays);
  if (remaining <= 0) return "Fresh today";
  return `Next batch in ${remaining} day${remaining === 1 ? "" : "s"}`;
}

function IconBulb({ size = 18, color = COLORS.accent }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
      <path d="M9 18h6"/>
      <path d="M10 22h4"/>
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>
    </svg>
  );
}

function IconCalendar({ size = 13, color = COLORS.accent }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}

function IconTag({ size = 12, color = COLORS.accent }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
      <path d="M12.59 2.59A2 2 0 0 0 11.17 2H4a2 2 0 0 0-2 2v7.17a2 2 0 0 0 .59 1.41l8.83 8.83a2 2 0 0 0 2.83 0l7.17-7.17a2 2 0 0 0 0-2.83z"/>
      <line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  );
}

function IdeaCard({ idea }) {
  const [expanded, setExpanded] = useState(false);
  const catColor = CATEGORY_COLORS[idea.category] || COLORS.accent;

  const handleShare = async (e) => {
    e.stopPropagation();
    const text = `${idea.title}\n\n${idea.whyInDemand}\n\nFound on Link-Ap — link-ap.online`;
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
          {idea.title}
        </h3>

        <span style={{
          display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: COLORS.accent,
          background: `${COLORS.accent}1A`, padding: "3px 8px", borderRadius: 6, marginBottom: 10,
        }}>
          <IconTag size={12} /> {idea.startupCost}
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

            {[
              ["Funding route", idea.fundingRoute],
              ["Competitive moat", idea.competitiveMoat],
              ["12/24-month scale timeline", idea.scaleTimeline],
            ].filter(([, body]) => !!body).map(([label, body]) => (
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

function usePulseFeed(firebaseUser, path) {
  const [ideas, setIdeas] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generatedAt, setGeneratedAt] = useState(null);
  const [stale, setStale] = useState(false);

  const fetchIdeas = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const token = await firebaseUser.getIdToken();
      const url = forceRefresh ? `${path}?refresh=true` : path;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      setIdeas(data.ideas || []);
      setGeneratedAt(data.generatedAt || null);
      setStale(!!data.stale);
    } catch (err) {
      console.error(`Pulse fetch error (${path}):`, err);
      setError("Couldn't load ideas right now.");
    } finally {
      setLoading(false);
    }
  }, [firebaseUser, path]);

  return { ideas, loading, error, generatedAt, stale, fetchIdeas };
}

export default function Pulse({ firebaseUser, user }) {
  const [activeTier, setActiveTier] = useState("basic");
  const basic = usePulseFeed(firebaseUser, "/api/pulse");
  const strategic = usePulseFeed(firebaseUser, "/api/pulse-strategic");
  const feed = activeTier === "basic" ? basic : strategic;
  const tier = TIERS.find(t => t.id === activeTier);

  useEffect(() => {
    if (feed.ideas === null && !feed.loading && !feed.error) feed.fetchIdeas();
  }, [activeTier, feed]);

  return (
    <div style={{ padding: "16px 20px", paddingBottom: 32 }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <IconBulb size={18} />
          <h2 style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, margin: 0 }}>Business Ideas</h2>
        </div>
        <p style={{ color: COLORS.textMuted, fontSize: 13, margin: 0 }}>
          Basic ideas for getting started, strategic ideas for growing with capital
        </p>
      </div>

      {/* Tier pills */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {TIERS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTier(t.id)}
            style={{
              padding: "7px 16px", borderRadius: 20, cursor: "pointer",
              fontSize: 13, fontWeight: 500,
              background: activeTier === t.id ? COLORS.accent : COLORS.card,
              color: activeTier === t.id ? "#000" : COLORS.textMuted,
              border: `1px solid ${activeTier === t.id ? COLORS.accent : COLORS.border}`,
            }}
          >{t.label}</button>
        ))}
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "flex-end" }}>
          {!feed.loading && (
            <button
              onClick={() => feed.fetchIdeas(true)}
              style={{
                background: "transparent", border: `1px solid ${COLORS.border}`,
                color: COLORS.textMuted, borderRadius: 8, padding: "6px 12px",
                fontSize: 12, cursor: "pointer", flexShrink: 0,
              }}
            >
              New batch
            </button>
          )}
        </div>
        {feed.generatedAt && (
          <div style={{ marginTop: 10 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontSize: 11, fontWeight: 700, color: COLORS.accent,
              background: `${COLORS.accent}1A`, padding: "4px 10px", borderRadius: 20,
            }}>
              <IconCalendar size={13} />
              {nextBatchLabel(feed.generatedAt, tier.refreshDays)}{feed.stale ? " · cached" : ""}
            </span>
          </div>
        )}
      </div>

      {/* Loading skeletons */}
      {feed.loading && [0, 1, 2, 3].map(i => <SkeletonCard key={i} index={i} />)}

      {/* Error state */}
      {!feed.loading && feed.error && (
        <div style={{
          padding: "24px 20px", borderRadius: 16, background: COLORS.card,
          border: `1px solid ${COLORS.border}`, textAlign: "center",
        }}>
          <p style={{ fontSize: 28, margin: "0 0 10px" }}>⚡</p>
          <p style={{ color: COLORS.textMuted, fontSize: 14, margin: "0 0 16px" }}>{feed.error}</p>
          <button
            onClick={() => feed.fetchIdeas()}
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
      {!feed.loading && !feed.error && feed.ideas && (
        <>
          {feed.ideas.map((idea, i) => <IdeaCard key={i} idea={idea} />)}
          <p style={{ textAlign: "center", fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>
            Tap any card for the full playbook · Share ideas with your network
          </p>
        </>
      )}
    </div>
  );
}
