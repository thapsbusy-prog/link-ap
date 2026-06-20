const admin = require("firebase-admin");
const getUserPlan = require("../_lib/getUserPlan");
const checkToolLimit = require("../_lib/checkToolLimit");

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

const VIBES = ["Casual & funny", "Real & raw (no filter)", "Chill & low-key", "Hype & energetic"];
const ANGLE_TYPES = [
  "Surprise me",
  "Behind-the-scenes",
  "Customer story/results",
  "Myth-busting / hot take",
  "Day-in-the-life",
  "Before & after",
  "Price/value breakdown",
  "FAQ they keep asking me",
];

const VIBE_GUIDES = {
  "Casual & funny": "Tone: relaxed, conversational, light humour. Like texting a friend who happens to sell something. Short punchy sentences, no corporate energy.",
  "Real & raw (no filter)": "Tone: honest and unfiltered. Share real experiences, don't sugarcoat. First-person, grounded, sometimes vulnerable. No polish.",
  "Chill & low-key": "Tone: effortless and understated. No hype, no urgency. Like mentioning it in passing — 'oh yeah I also make these if you need one'.",
  "Hype & energetic": "Tone: enthusiastic and bold. Energy is high, pacing is fast. Short punchy sentences with impact. Makes people feel excited to act.",
};

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

  const limitResult = await checkToolLimit(uid, "daily-angle");
  if (!limitResult.allowed) return res.status(429).json({ error: limitResult.message });

  const { productOrService, audience, currentVibe, angleType, lastAngleLabel } = req.body || {};

  if (!productOrService) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  const safeProduct = san(productOrService, 200);
  const safeAudience = san(audience, 150);
  const safeVibe = VIBES.includes(currentVibe) ? currentVibe : "Casual & funny";
  const safeAngleType = ANGLE_TYPES.includes(angleType) ? angleType : "Surprise me";
  const safeLastAngle = san(lastAngleLabel, 100);

  if (!safeProduct) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const vibeGuide = VIBE_GUIDES[safeVibe];

  const angleInstruction = safeAngleType === "Surprise me"
    ? `Pick one angle type from this list (vary genuinely each call — do NOT default to the same type repeatedly): behind-the-scenes, customer story/results, myth-busting/hot take, day-in-the-life, before & after, price/value breakdown, FAQ they keep asking me.${safeLastAngle ? ` The last angle shown was "${safeLastAngle}" — pick a distinctly different one this time.` : ""}`
    : `Use this specific angle type: "${safeAngleType}"`;

  const prompt = `You are a TikTok content strategist helping a creator talk about their product or service in a fresh, authentic way — without ever sounding like a corporate brand.

Product/service: ${safeProduct}${safeAudience ? `\nTarget audience: ${safeAudience}` : ""}
Creator's vibe: ${safeVibe}

Tone guidance: ${vibeGuide}

Angle selection: ${angleInstruction}

Hard rules:
- NEVER use corporate or marketing language ("elevate your brand", "synergize", "unlock your potential", "game-changer", "transform your life"). Keep it human.
- Beats must be SHORT talking-point prompts of 5–10 words each — NOT a full script. The creator riffs on them in their own words on camera.
- Hook must be TikTok-native: under 15 words, punchy, makes someone stop mid-scroll.
- Caption must match the creator's vibe: short, authentic, max 3 relevant hashtags if used at all.
- CTA drives one clear action suited to product/service promotion (DMs, link in bio, saves, comments).
- angleLabel must be plain English, e.g. "Today: Bust a myth about your product" or "Today: Take them behind the scenes".

Return ONLY valid JSON, no markdown, no code blocks, no preamble:
{
  "angleLabel": "Today: [brief plain-English angle description]",
  "whyItWorks": "One sentence on why this angle builds trust or interest for this creator's audience.",
  "hook": "The opening line for camera, in the creator's voice.",
  "beats": ["talking point 1", "talking point 2", "talking point 3"],
  "caption": "Caption text matching the creator's vibe.",
  "cta": "A single clear call-to-action line."
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
        max_tokens: 700,
        system:
          "You are a TikTok content strategist for African creators and small business owners. You help people talk about what they sell in their own authentic voice — never corporate, never generic. Return only valid JSON.",
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

    const result = JSON.parse(jsonMatch[0]);

    return res.status(200).json({
      angleLabel: result.angleLabel || "",
      whyItWorks: result.whyItWorks || "",
      hook: result.hook || "",
      beats: Array.isArray(result.beats) ? result.beats.slice(0, 3) : [],
      caption: result.caption || "",
      cta: result.cta || "",
    });
  } catch (err) {
    console.error("Daily angle generation error:", err);
    return res.status(500).json({ error: "Failed to generate angle" });
  }
};
