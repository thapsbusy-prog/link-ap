# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # dev server on localhost:3000
npm run build      # production build (output: /build)
npm test           # run tests in watch mode
npx vercel --prod  # deploy to production (link-ap.online)
```

Git + deploy shorthand used in this project:
```bash
git add . && git commit -m "description" && git push
# Vercel auto-deploys on every push to main
```

## Architecture

The app is split across several source files. There is no routing library — `MainApp` uses a `tab` state string (`"discover"`, `"matches"`, `"messages"`, `"profile"`, `"pulse"`, `"tools"`) to switch between screens.

**Source file map**
- `src/App.js` — `MainApp`, `SearchModal`, `SplashScreen`, `ErrorBoundary`, `App` root, and helpers (`playBeep`, `triggerVibrate`)
- `src/Discover.js` — `Discover`, `PublicProfile`, `ShareModal`, `ConnectNoteModal`, and canvas helpers (`roundRect`, `drawInvitePoster`)
- `src/Matches.js` — `Matches` component
- `src/Messages.js` — `Messages` component and `formatRelativeTime`
- `src/Profile.js` — `Profile` component
- `src/Settings.js` — `Settings` component
- `src/Tools.js` — `Tools` component (6th tab); three subtab pills: Founders Hub, Freelancer Kit, Growth Lab; shell only — placeholder cards
- `src/Pulse.js` — `Pulse` component (AI Pulse tab) and `TrendCard`, `SkeletonCard` sub-components
- `src/AuthScreen.js` — `AuthScreen` component
- `src/Onboarding.js` — `Onboarding` component
- `src/shared.js` — shared constants (`COLORS`, `USER_COLORS`, option arrays), shared helpers (`normalizeUrl`, `validateLinkedIn`, `linkedinNameMatches`, `getBringToTablePrompt`, `formatRelativeTime`), and shared UI components (`Avatar`, `Tag`, `Input`, `TextArea`, `Select`, `SkillsInput`, `LocationPin`, `LinkedInIcon`, `TermsContent`)

**Auth flow (`App` root component)**
- `firebaseUser` starts as `undefined` (loading), becomes `null` (signed out) or a Firebase user object (signed in).
- `onAuthStateChanged` is the single source of truth for auth state. It always resets `profile` to `null` and sets `loading = true` before fetching the user's Firestore doc, preventing stale profiles from a previous session.
- Screen decision: loading → `<AuthScreen>` → `<Onboarding>` → `<MainApp>`

**Membership model (as of 29 May 2026)**
- Two plans: `"founding_member"` (signup index ≤ 100) and `"free"` (index > 100). `"premium"` reserved for future paid tier.
- Plan is assigned at registration via a Firestore transaction on `meta/stats` (`totalUsers` counter). The transaction atomically increments and returns the user's `signupIndex` (1-based). No retroactive changes — existing docs keep whatever they have.
- New fields on `users/{uid}`: `signupIndex` (number), `plan` (string), `planAssignedAt` (timestamp).
- Founding Member copy: "You're a Founding Member. As one of Link-Ap's first 100 members, you have free access to all features — including AI-powered tools — for as long as Link-Ap offers a free tier. Fair use applies (50 AI calls/month)."
- Free plan copy: "Free plan — static templates included. Upgrade to Pro for AI-powered tools."
- Founding Member badge in Profile view: `⭐ Founding Member #[signupIndex]` in amber (`#F5A623`), shown only when `plan === "founding_member"`.
- API gate utility: `api/lib/getUserPlan.js` — fetches `plan` from Firestore via Admin SDK. All new AI tool routes must call this and return 403 if `plan !== "founding_member" && plan !== "premium"`. Existing AI features (Why Connect, Pulse, Profile Score, Starters) are NOT gated.

**Tools Tab (as of 29 May 2026)**
- `src/Tools.js` — 6th tab (after Pulse); subtabs: Founders Hub, Freelancer Kit, Growth Lab. Accepts `user` prop.
- Bottom nav wrench icon (inline SVG), label "Tools", tab id `"tools"`.
- **Founders Hub** and **Freelancer Kit** now use a tool picker pattern: a list of cards (emoji + name + desc) where tapping opens the selected tool with a "← Back" link. Growth Lab remains a direct single-tool view.
- **Founders Hub tools** (3): AI Invoice Generator, Pitch Deck Outline Generator, Break-Even Calculator.
- **Freelancer Kit tools** (2): AI Proposal Generator, Day Rate Calculator.
- **Founders Hub — AI Invoice Generator**: form view collects from/client details, currency (ZAR/USD/GBP/EUR), due date, line items (add/remove rows, running subtotal with ZAR VAT preview). Calls `POST /api/tools/invoice-generate`. Preview view shows styled invoice card with Download PDF (jsPDF A4), Share (Web Share API), and Start Over.
- **Founders Hub — Pitch Deck Outline Generator**: form collects businessName (pre-filled from user.name), oneLiner, problem, solution, targetMarket (required), revenueModel, traction, askAmount, currency (optional). Calls `POST /api/tools/pitch-deck`. Preview shows 10 slides (numbered amber circle + title, key message italic, bullet list, speaker note box). Download PDF (jsPDF multi-page with checkPage), Share, Start Over.
- **Founders Hub — Break-Even Calculator**: pure client-side, no API. Form: fixedCosts, variableUnitCost, sellingPrice, currency. Results: breakEvenUnits, breakEvenRevenue, contributionMargin, contributionMarginPct, visual stacked bar (amber=fixed, muted=variable), plain-English explanation. Formulas: CM = price - varCost; units = ceil(fixed / CM); revenue = units × price.
- **Freelancer Kit — Day Rate Calculator**: pure client-side, no API. Form: annualIncome, billableDays (default 220), annualExpenses, profitBuffer % (default 20), currency. Results: dayRate (rounded to nearest 50), halfDayRate, hourlyRate, project rate guidance (3/10/20 days), plain-English explanation. Formula: base = (income + expenses) / days; dayRate = round50(base × (1 + buffer/100)).
- `api/tools/invoice-generate.js` — POST; verifies auth; gates via `getUserPlan` (403 for free users); sanitizes all inputs; computes subtotal/VAT/total server-side (overrides Claude's arithmetic); prompts Claude for `invoiceNumber`, `notes`, `paymentTerms` only.
- `api/tools/pitch-deck.js` — POST; verifies auth; gates via `getUserPlan`; sanitizes all inputs; prompts Claude to return 10-slide JSON (`deckTitle`, `generatedDate`, `businessName`, `slides[]`, `pitchTips[]`); overrides identity fields server-side.
- `api/lib/getUserPlan.js` — shared Admin SDK plan-gate utility for all tool routes.

**Onboarding design (as of 29 May 2026)**
- `Onboarding` is intentionally minimal: collects only First Name, Last Name, Role, and Location (plus optional Title). All other profile fields default to empty/`[]`.
- On completion a full Firestore profile doc is created with empty `bio`, `skills`, `lookingFor`, `bringToTable`, etc., so the rest of the app works immediately.
- Richer profile data (bio, skills, looking for, what you bring, LinkedIn, pronouns) is collected **inside the app** via the Profile edit flow.
- `ProfileCompletePrompt` (in `Profile.js`) shows in view mode whenever any of the four key sections are empty (bio, skills, lookingFor, bringToTable). It displays a percentage ring and a checklist, and opens edit mode on tap. It auto-hides once all four are filled.

**Firestore data model**
- `users/{uid}` — user profile document (fields: `uid`, `name`, `role`, `location`, `bio`, `skills[]`, `lookingFor[]`, `achievements[]`, `linkedin`, `avatar`, `color`, `createdAt`, `pronouns`, `title`, `photoURL`, `signupIndex`, `plan`, `planAssignedAt`)
- `users/{uid}/matches/{targetUid}` — a copy of the matched user's profile document; updated on every profile save via `writeBatch` (fields synced: `name`, `role`, `location`, `bio`, `skills`, `photoURL`, `avatar`, `color`, `lookingFor`, `pronouns`, `title`)
- `chats/{chatId}/messages/{msgId}` — real-time chat messages; `chatId` is the two UIDs sorted and joined with `_`
- `meta/stats` — global counters; field `totalUsers` (number) incremented atomically via `runTransaction` on each new registration

**Firebase Storage**
- `firebase.js` exports `storage` (via `getStorage`); `App.js` imports it alongside `ref`, `uploadBytes`, and `getDownloadURL` from `firebase/storage`.
- Profile photos are uploaded to `avatars/{uid}.jpg`; `photoURL` in Firestore stores the resulting download URL (not a base64 string).

**Key design decisions**
- All styling is inline — no CSS files are used for component styles (`App.css` and `index.css` only handle body resets).
- `COLORS` and `USER_COLORS` constants at the top of `App.js` are the single source of styling truth — always use these, never hardcode hex values.
- `Discover` tracks seen profiles via a `seenUids` Set (not an index) so it stays correct when the `users` list updates reactively from Firestore.
- `AuthScreen` handlers do NOT update app state directly — they just call Firebase auth and let `onAuthStateChanged` drive all state transitions.

**State inventory (key additions — 11 May 2026)**
- `MainApp`: `lastMessages` — `{ [uid]: { text, createdAt } }` map, one entry per conversation, used to drive the Messages list preview.
- `Profile` component: `photoBlob` — resized image `Blob` held in state until `saveProfile` uploads it to Storage.

**State inventory (key additions — 13 May 2026)**
- `Matches` component: `disconnectTarget` — the match user object selected for removal; drives the in-component confirmation modal.
- `PublicProfile` component: `showDisconnectConfirm` (bool), `isMutualMatch` (bool derived from `matches` prop) — controls the Remove Connection confirmation modal.

**AI Connection Note Assistant feature (26 May 2026)**
- `api/note-assist.js` — serverless POST `{ targetUid }`; verifies auth token; fetches both profiles from Firestore server-side; calls Anthropic `claude-sonnet-4-6` to generate a 80–200 char first-person note draft (specific, human-sounding, never generic); returns `{ note: string | null }`; no caching — always fresh.
- `src/Discover.js` `ConnectNoteModal` — added `drafting` + `draftError` state; "✦ AI draft" button in the label row (uses `auth.currentUser.getIdToken()` — no prop changes to Discover); on success pre-fills textarea (user can edit); on failure shows inline fallback message; button shows "Drafting…" during generation.

**Conversation Starter Chips feature (26 May 2026)**
- `api/chat-starters.js` — serverless GET `?partnerUid={uid}`; verifies auth token; fetches both profiles from Firestore server-side; calls Anthropic `claude-sonnet-4-6` to generate 3 specific openers (under 12 words each, profile-specific, never generic); cached permanently in `chatStarters/{chatId}` — generated once per pair, never regenerated.
- `src/Messages.js` — `starters` state (`null` = loading, `[]` = dismissed/hidden, `string[]` = available); fetch triggered on `chatId` change; chip strip renders above the input bar only when `chatMessages.length === 0 && starters?.length > 0`; tapping a chip pre-fills the input and focuses it; `×` dismisses the strip; chips auto-hide once the first message is sent.
- `inputRef` added to the input element for programmatic focus from chip tap.
- `firestore.rules`: `chatStarters/{docId}` blocked from all client reads/writes.
- `chatStarters/{chatId}` — permanent cache, one doc per connected pair.

**AI Profile Score feature (26 May 2026)**
- `api/profile-score.js` — serverless GET handler; verifies auth token; fetches profile from Firestore server-side; calls Anthropic `claude-sonnet-4-6` to score 5 dimensions (Identity, Story, Skills & Value, Intent, Trust) each out of 20; total score /100; cached in `users/{uid}/private/profileScore` with 7-day TTL; `?refresh=true` forces regeneration.
- `src/Profile.js` — `ProfileScoreCard` component (score ring, dimension bars, quick-win tips, Share button); `SCORE_COLOR` helper; `scoreData`/`scoreLoading` state; `fetchScore(forceRefresh)` called on mount and after every successful profile save; score card rendered between page header and profile card in view mode.
- Share button uses Web Share API (`navigator.share`) with fallback to clipboard; text format: `"My Link-Ap profile scored X/100 — see how yours compares"`.
- Cache lives in `users/{uid}/private/profileScore` — already readable/writable by the owner per existing Firestore rules (no rule changes needed).

**AI Pulse Tab feature (26 May 2026)**
- `src/Pulse.js` — default export `Pulse` component; fetches from `/api/pulse` with Firebase ID token; renders `TrendCard` (expandable, with share) and `SkeletonCard` loading state.
- `api/pulse.js` — Vercel serverless GET handler; Firestore cache (`aiTrends/latest`, 24-hour TTL); calls Anthropic `claude-sonnet-4-6` to generate 6 trend cards (fields: `category`, `headline`, `summary`, `howToUse`); serves stale cache on generation failure.
- `vercel.json` — cron `0 6 * * *` hits `/api/pulse` daily to refresh cache before users wake up.
- Bottom nav: **Settings removed from nav bar** — now accessed via gear icon (⚙) in Profile view header (`onSettings` prop). Pulse tab added in its place with an EKG-line icon.
- `Profile` now accepts `onSettings` prop (optional); renders a gear icon button next to Share/Edit when prop is provided.
- Firestore collection `aiTrends/latest` — single doc with `trends[]` array and `generatedAt` timestamp; Admin SDK only (client read/write blocked).

**Smart Match Explanation feature (18 May 2026)**
- `api/match-explain.js` — new Vercel serverless function; accepts `POST { currentUser, targetUser }`, calls Anthropic `claude-sonnet-4-6` (raw fetch, no SDK), returns `{ explanation: string | null }`. Requires `ANTHROPIC_API_KEY` Vercel env var. Never throws — always returns 200 with `{ explanation: null }` on any failure.
- `Discover` component: `explanation` (string|null), `loadingExplanation` (bool) — drive the "✦ Why connect" block rendered between the card header and bio. `explanationCache` ref (plain object keyed by uid) prevents re-fetching the same card.
- Fetch fires on card mount via `useEffect([currentUid])`. `currentUid` is derived from `users.find(u => !seenUids.has(u.uid))?.uid` before early returns, so the effect dep tracks card changes correctly.
- If the API returns null, nothing renders — no error state shown to the user.
- **Rate limiting (26 May 2026):** Two-layer protection added:
  - Layer 1 — Firestore cache: results stored in `matchExplanations/{currentUid}_{targetUid}` with a 7-day TTL; cache hit returns immediately without calling Anthropic.
  - Layer 2 — Per-user rate limit: `users/{uid}/private/rateLimits` doc tracks `matchExplainCount` + `matchExplainWindowStart`; enforces 100 calls per 60-minute rolling window, returns HTTP 429 on breach.
  - Execution order: token verify → rate limit check/increment → cache check → Anthropic call → cache write.
  - `matchExplanations` collection is Admin SDK only; `firestore.rules` blocks all client reads and writes.

**Disconnect / Remove Connection feature (13 May 2026)**
- `handleDisconnect(targetUid)` lives in `MainApp`. It deletes both sides of the match, plus any stale sent/received docs, updates local `matches` state immediately, clears `activeChat` if the disconnected user was active, and shows a "Connection removed" toast.
- `Matches` receives `onDisconnect` prop; each card in the Connected section has a `✕ remove` button that opens a confirmation modal before calling `onDisconnect`.
- `PublicProfile` receives `matches` and `onDisconnect` props; shows a "Remove Connection" button only when `isMutualMatch` is true. Confirmation modal closes the profile on confirm.

**Messages component**
- Accepts `lastMessages` prop from `MainApp`.
- `formatRelativeTime(ts)` helper (defined before the component) converts a Firestore `Timestamp` to a human-readable string: `"Xm ago"`, `"Xh ago"`, `"Yesterday"`, weekday name, or a date string.
- Conversation rows display a 40-character-truncated last-message preview and a relative timestamp instead of static "Tap to chat" text.

**Account deletion (13 May 2026)**
- `handleDelete` in `Settings` performs full Firestore cleanup before calling `firebaseUser.delete()`.
- Reads `matches`, `sent`, `received`, `blocked`, `blockedBy`, and `passed` subcollections first to collect UIDs for bilateral cleanup.
- Deletes the user's own subcollection docs in all six subcollections, then does bilateral cleanup on other users' `matches`, `sent`, `received`, `blocked`, and `blockedBy` docs.
- Deletes all messages in `chats/{chatId}/messages/` for each matched conversation (chatId = sorted `[uid, otherUid].join("_")`).
- Deletes `users/{uid}` last, then calls `firebaseUser.delete()`.

## Project Rules

- **Never rewrite the entire App.js** unless explicitly asked.
- **Never remove existing features** when adding new ones.
- **Never change `src/firebase.js`** — Firebase config is fixed.
- Make small, focused changes — don't touch unrelated code.
- `npm run eject` is never used.

**Component & File Structure**
- Every new screen, major component, or feature gets its own file in `src/` from day one — never add new components directly into `App.js`.
- `App.js` is reserved for: `MainApp` state and handlers, `ErrorBoundary`, `App` root, and top-level constants only.
- New files follow the established naming pattern: `PascalCase.js` (e.g. `src/NewFeature.js`).
- Each new file must have a default export unless it exports multiple related components (like `Discover.js` exports `Discover` and `PublicProfile`).
- Shared constants, helpers, and UI primitives go in `src/shared.js`.

## After every feature change

After completing any feature addition or fix, update CLAUDE.md to reflect new state variables, new imports, new Firebase collections or storage paths, and any new architectural decisions.

## Content Studio — Feature Card rule

After shipping any **materially new feature** that drives user acquisition or retention, add it to `src/FeatureCardGenerator.jsx` — specifically the `FEATURE_CARDS` object. Write 2–3 persona cards covering the distinct user types who benefit most.

**Qualifies** — new AI capabilities, new sharing or export flows, new discovery or matching mechanics, new engagement loops.
**Does not qualify** — bug fixes, UI tweaks, copy changes, security patches, or internal-only changes.

Card structure: `{ pill, what, whatDesc, forWhom, forDesc, example }`. Adding a new key to `FEATURE_CARDS` is all that's needed — the tab and navigation appear automatically. Keep `what` and `whatDesc` consistent across persona variations of the same feature; only `forWhom`, `forDesc`, and `example` change per card.

## Color Scheme

| Token | Value |
|-------|-------|
| `COLORS.bg` | `#0A0A0F` |
| `COLORS.card` | `#13131A` |
| `COLORS.border` | `#2A2A3A` |
| `COLORS.accent` | `#F5A623` |
| `COLORS.text` | `#F0EEE8` |
| `COLORS.textMuted` | `#8A8A9A` |

---

## Current State (as of v1.0 audit — 2026-05-26)

This section is the live project health snapshot. Update it after every fix or feature addition.

---

### Open Bugs

| ID | Severity | Description | Location |
|----|----------|-------------|----------|
| Bug 23 | MEDIUM | ~~No rate limiting on `/api/match-explain`~~ FIXED — superseded by C8 (two-layer rate limiting) | api/match-explain.js |
| Bug 24 | LOW | ~~Privacy Policy does not disclose Anthropic~~ FIXED — section 5 names Anthropic | PrivacyPolicy.js:22–23 |
| Bug 25 | LOW | ~~VAPID key hardcoded as fallback~~ NOT REPRODUCIBLE — firebase.js reads env var, warns if missing, no hardcoded value | firebase.js:52–56 |
| Bug 27 | LOW | ~~`IntroScreen.js` uses local `ORANGE`~~ FIXED — no local colour constant found; uses `COLORS` from shared | IntroScreen.js:4 |
| Bug 28 | MEDIUM | ~~Firestore chat rules don't check blocked status~~ FIXED — notBlocked() check on read and create | firestore.rules:53 |
| Bug 29 | LOW | ~~`handleDisconnect` does not delete chat message subcollection~~ FIXED — App.js already batch-deletes all messages on disconnect | App.js:404–409 |
| Bug 30 | LOW | ~~No in-app reactivation path~~ FIXED — deactivation modal already shows "email info@link-ap.online to reactivate" | Settings.js:407–409 |

---

### Open Security Vulnerabilities

#### P0 — Launch Blockers (fix before any public traffic)

| ID | Severity | Description | Fix |
|----|----------|-------------|-----|
| C2 | HIGH | `fcmTokens` readable by any authenticated user — enables push spoofing to any device | FIXED 2026-05-26 — App.js writes to `private/push`; notify.js reads from `private/push`; migration cleans up legacy top-level tokens on every app open |
| C8 | HIGH | No rate limiting on `/api/match-explain` — unbounded Anthropic API cost exposure | FIXED 2026-05-26 — two-layer protection: Firestore cache (7-day TTL at `matchExplanations/{currentUid}_{targetUid}`) + per-user rate limit (100 calls/60 min at `users/{uid}/private/rateLimits`) |
| C3 | HIGH | `received`/`sent` subcollection writes lack document-data validation — request spoofing | FIXED 2026-05-26 — `received` validates `request.resource.data.uid == request.auth.uid`; `sent` now validates `request.resource.data.uid == targetId` |
| C9/Bug 24 | MEDIUM | Target user profile data sent to Anthropic without GDPR/POPIA disclosure | FIXED — PrivacyPolicy.js section 5 already names Anthropic as data processor |

#### P1 — Fix before 100 users

| ID | Severity | Description | Fix |
|----|----------|-------------|-----|
| C7 | MEDIUM | Client-supplied push notification `body` not validated server-side — phishing risk | FIXED — api/notify.js uses hard-coded templates; senderName is sanitised and length-capped |
| C6/Bug 28 | MEDIUM | Firestore chat rules don't check blocked status | FIXED — firestore.rules notBlocked() function checks both directions on read and create |
| C17 | MEDIUM | Match propagation writes are client-side — attacker can spoof name/role in partner's match list | FIXED 2026-05-26 — matches rule requires request.resource.data.uid == matchedUid; Profile.js propagated object now includes uid field |
| C1 | MEDIUM | Users collection open to full enumeration by authenticated users — `fcmTokens` scraping risk | FIXED — fcmTokens moved to private subcollection (same fix as C2) |

#### P2 — Quality / compliance

| ID | Description |
|----|-------------|
| C5 | FIXED — `/chats/{chatId}` top-level already has `allow read, write: if false` |
| C16 | FIXED 2026-05-26 — san/sanArr helpers in match-explain.js strip `<>`, trim, and cap all fields before Anthropic prompt |
| C18/C19 | RESOLVED — `fcmTokens` moved to private subcollection; no longer present in list-queryable user docs |
| C12 | FIXED 2026-05-26 — AuthScreen.js iOS redirect catch now calls `console.error` before `setError` |
| C21 | SKIPPED — `firebase-admin` is used in production Vercel serverless functions; moving to devDependencies would break deployment |

---

### Vercel Environment Variables

| Variable | Status | Used by |
|----------|--------|---------|
| `ANTHROPIC_API_KEY` | ⚠️ Pending activation | api/match-explain.js |
| `FIREBASE_PROJECT_ID` | ⚠️ Verify live | api/notify.js |
| `FIREBASE_CLIENT_EMAIL` | ⚠️ Verify live | api/notify.js |
| `FIREBASE_PRIVATE_KEY` | ⚠️ Verify live | api/notify.js |
| `REACT_APP_VAPID_KEY` | ⚠️ Has hardcoded fallback (Bug 25) | firebase.js |

---

### Feature Roadmap

#### Missing AI features

| Feature | Status | Notes |
|---------|--------|-------|
| AI Pulse feed | ✅ Shipped (26 May 2026) | `src/Pulse.js` + `api/pulse.js`; daily Vercel cron at 06:00 UTC; 24h Firestore cache at `aiTrends/latest` |
| AI Profile Score | ✅ Shipped (26 May 2026) | `src/Profile.js` + `api/profile-score.js`; 5 dimensions × 20pts; 7-day cache; refreshes on profile save |
| AI Connection Note Assistant | ✅ Shipped (26 May 2026) | `ConnectNoteModal` in `Discover.js` + `api/note-assist.js`; "✦ AI draft" button pre-fills textarea |
| AI Profile Score / Optimiser | ❌ Not built | — |
| Conversation Starter Chips | ✅ Shipped (26 May 2026) | `src/Messages.js` + `api/chat-starters.js`; permanent cache in `chatStarters/{chatId}`; chips shown above input bar on empty chats |

#### Tools Tab (as of 29 May 2026)

| Tool | Subtab | Status | Notes |
|------|--------|--------|-------|
| AI Invoice Generator | Founders Hub | ✅ Shipped | Form → Preview; jsPDF download; Web Share API; plan-gated |
| Pitch Deck Outline Generator | Founders Hub | ✅ Shipped | 10-slide AI outline; speaker notes per slide; jsPDF multi-page; Web Share API; plan-gated |
| Break-Even Calculator | Founders Hub | ✅ Shipped | Client-side only; no API; visual stacked bar; instant results |
| AI Proposal Generator | Freelancer Kit | ✅ Shipped | Form → Preview; 7-section AI proposal; jsPDF multi-page; Web Share API; plan-gated |
| Day Rate Calculator | Freelancer Kit | ✅ Shipped | Client-side only; no API; rounds to nearest 50; project rate guidance |
| AI Content Calendar Generator | Growth Lab | ✅ Shipped | Form → Preview; 2 or 4 weeks; 3 posts/week/platform; jsPDF multi-page; plan-gated |

#### Revenue features (ideated, not built)

| Feature | Status |
|---------|--------|
| Back a Builder | ❌ Not built |
| Reputation Bonds | ❌ Not built |
| The Growth Bet | ❌ Not built |

#### General P2/P3 gaps

| ID | Gap |
|----|-----|
| P2-10 | Character counter in SearchModal note field |
| P2-11 | Self-serve account reactivation flow |
| P2-12 | Report / flag user feature |
| P2-13 | Read receipts |
| P3-4 | Notification preferences persisted in Firestore (cross-device sync) |
| P3-5 | Prefetch next Discover card's AI explanation while current card is shown |
| P3-6 | Automated test suite |

---

### New Firestore Collections (v1.0)

| Collection | Purpose | Access |
|------------|---------|--------|
| `matchExplanations/{currentUid}_{targetUid}` | AI match explanation cache (7-day TTL) | Admin SDK only — client read/write blocked in firestore.rules |
| `users/{uid}/private/rateLimits` | Per-user API rate limit counters | Admin SDK only |
| `aiTrends/latest` | AI Pulse daily trend cards (24-hour TTL, single doc) | Admin SDK only — client read/write blocked in firestore.rules |
| `meta/stats` | Global counters; `totalUsers` field drives `signupIndex` at registration | Admin SDK write (via `runTransaction` in Onboarding); no client read needed |
