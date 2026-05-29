const admin = require("firebase-admin");
const getUserPlan = require("../lib/getUserPlan");

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY
          ?.replace(/^"|"$/g, "")
          .replace(/\\n/g, "\n"),
      }),
    });
  } catch (err) {
    console.error("Firebase Admin init error:", err);
    throw err;
  }
}

const san = (s, max = 200) =>
  typeof s === "string" ? s.replace(/[<>]/g, "").trim().slice(0, max) : "";

const formatDate = (d) =>
  d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const VALID_PLATFORMS = ["LinkedIn", "Instagram", "X", "Facebook"];
const VALID_TONES = ["Professional", "Casual", "Inspirational", "Educational"];

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const idToken = (req.headers.authorization || "").replace("Bearer ", "");
  let uid;
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    uid = decoded.uid;
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const plan = await getUserPlan(uid);
  if (plan !== "founding_member" && plan !== "premium") {
    return res.status(403).json({ error: "Pro feature — upgrade to access AI tools" });
  }

  const {
    brandName, niche, targetAudience, platforms, tone, goals, weekCount,
  } = req.body || {};

  if (!brandName || !niche || !targetAudience || !Array.isArray(platforms) || platforms.length === 0) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  const safeBrand = san(brandName, 100);
  const safeNiche = san(niche, 200);
  const safeAudience = san(targetAudience, 300);
  const safePlatforms = platforms.filter(p => VALID_PLATFORMS.includes(p));
  if (safePlatforms.length === 0) {
    return res.status(400).json({ error: "At least one valid platform is required" });
  }
  const safeTone = VALID_TONES.includes(tone) ? tone : "Professional";
  const safeGoals = san(goals, 500);
  const safeWeekCount = Math.min(4, Math.max(1, parseInt(weekCount, 10) || 4));

  const today = new Date();
  const todayStr = formatDate(today);
  const platformList = safePlatforms.join(", ");
  const totalPosts = safeWeekCount * safePlatforms.length * 3;

  const prompt = `Generate a ${safeWeekCount}-week social media content calendar. Return ONLY valid JSON, no markdown, no code blocks, no preamble.

Brand: ${safeBrand}
Niche: ${safeNiche}
Target Audience: ${safeAudience}
Platforms: ${platformList}
Tone: ${safeTone}
Goals: ${safeGoals || "Build brand awareness and grow following"}
Total posts: ${totalPosts} (${safeWeekCount} weeks × ${safePlatforms.length} platform${safePlatforms.length > 1 ? "s" : ""} × 3 posts per week per platform)

For each week, generate exactly 3 posts per platform. Spread posts across different days (Monday, Wednesday, Friday work well). Vary post types (Carousel, Short video, Poll, Quote graphic, Infographic, Story, Thread, etc.). Make captions ready-to-use with relevant hashtags.

Return exactly this JSON structure:
{
  "calendarTitle": "${safeWeekCount}-Week Content Calendar — ${safeBrand}",
  "generatedDate": "${todayStr}",
  "brandName": "${safeBrand}",
  "platforms": ${JSON.stringify(safePlatforms)},
  "tone": "${safeTone}",
  "weeks": [
    {
      "weekNumber": 1,
      "theme": "e.g. Brand Awareness",
      "posts": [
        {
          "day": "Monday",
          "platform": "${safePlatforms[0]}",
          "postType": "Carousel",
          "topic": "One sentence describing the specific post topic",
          "caption": "Ready-to-use caption with 2-3 sentences and relevant hashtags",
          "bestTimeToPost": "08:00–09:00"
        }
      ]
    }
  ],
  "generalTips": ["Platform-specific tip 1", "Tip 2", "Tip 3", "Tip 4"]
}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 4000,
        system:
          "You are a social media strategist for African entrepreneurs and brands. Return only valid JSON. Generate specific, actionable content ideas tailored to the brand's niche and audience. Captions must be ready to copy-paste with appropriate hashtags. Never use placeholder text — every field must contain real, usable content.",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Anthropic ${response.status}: ${body.slice(0, 200)}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text?.trim() || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in Anthropic response");

    const calendar = JSON.parse(jsonMatch[0]);

    // Override identity fields — never trust Claude on these
    calendar.calendarTitle = `${safeWeekCount}-Week Content Calendar — ${safeBrand}`;
    calendar.generatedDate = todayStr;
    calendar.brandName = safeBrand;
    calendar.platforms = safePlatforms;
    calendar.tone = safeTone;

    if (!Array.isArray(calendar.weeks)) calendar.weeks = [];
    if (!Array.isArray(calendar.generalTips)) calendar.generalTips = [];

    return res.status(200).json(calendar);
  } catch (err) {
    console.error("Content calendar generation error:", err);
    return res.status(500).json({ error: "Failed to generate content calendar" });
  }
};
