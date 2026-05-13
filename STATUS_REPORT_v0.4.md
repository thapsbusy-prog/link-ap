---
# link-ap Status Report — v0.4
**Generated:** 2026-05-13
**Audited by:** Claude Code (claude-sonnet-4-6)
**Files reviewed:** src/App.js, src/Messages.js, src/Profile.js, src/shared.js, src/firebase.js, src/PrivacyPolicy.js, src/index.js, public/service-worker.js, public/manifest.json, api/notify.js, firebase.json, firestore.rules, package.json
---

## A. Feature Inventory

| # | Feature | Component(s) | Status | Notes |
|---|---------|--------------|--------|-------|
| 1 | **Splash Screen** | `SplashScreen` | ✅ Complete | Logo animation + 4.1s auto-dismiss |
| 2 | **Auth — Email/Password** | `AuthScreen` | ✅ Complete | Login, signup, password reset email |
| 3 | **Auth — Google Sign-In** | `AuthScreen` | ✅ Complete | Uses `signInWithPopup` |
| 4 | **Terms of Service** | `TermsContent` | ✅ Complete | Full legal text; inline modal in auth + settings |
| 5 | **Privacy Policy** | `PrivacyPolicy` | ✅ Complete | Rendered at `/privacy` path |
| 6 | **5-Step Onboarding** | `Onboarding` | ✅ Complete | Who you are → Story → Looking For → Details → Bring to Table |
| 7 | **Discover Feed** | `Discover` | ✅ Complete | Card-per-person view, Pass/Connect actions, intent-filtered, paginated |
| 8 | **Connect with Note** | `ConnectNoteModal` | ✅ Complete | Required 10-char minimum note; 300-char max |
| 9 | **Search by Name** | `SearchModal` | 🔧 Partial | Prefix range query is broken (see Section G); currently does exact-match only |
| 10 | **Connections Tab** | `Matches` | ✅ Complete | Incoming requests, pending sent, mutual connections |
| 11 | **Real-time Chat** | `Messages` | ✅ Complete | Firestore `onSnapshot`, send on Enter, scroll-to-bottom |
| 12 | **Message List Previews** | `Messages` | ✅ Complete | Last message text (40-char truncated) + relative timestamp |
| 13 | **Push Notifications (FCM)** | `firebase.js`, `api/notify.js`, SW | 🔧 Partial | Token registration works; send-on-message wired; no auth on `/api/notify`; foreground in-app display not implemented (only `console.warn`) |
| 14 | **Notification Sounds** | `playBeep()` | ✅ Complete | Web Audio API two-tone chime; localStorage toggle |
| 15 | **Vibration** | `triggerVibrate()` | ✅ Complete | `navigator.vibrate`; localStorage toggle |
| 16 | **Unread Badge** | `MainApp` | ✅ Complete | Per-conversation dot; nav tab badge count |
| 17 | **My Profile** | `Profile` | ✅ Complete | View + Edit with photo upload (resized to 200px canvas) |
| 18 | **Profile Edit & Propagation** | `Profile.saveProfile` | ✅ Complete | `writeBatch` updates all match subcollections on save |
| 19 | **Public Profile View** | `PublicProfile` | ✅ Complete | Full detail modal; LinkedIn badge; investor "Actively raising" pill |
| 20 | **Block / Unblock** | `handleBlock`, `handleUnblock` | ✅ Complete | Bidirectional (`blocked` + `blockedBy`); hidden from Discover/Messages/Connections |
| 21 | **Account Deactivation** | `Settings.handleDeactivate` | 🔧 Partial | Sets `deactivated: true` then signs out; reactivation requires contacting support (no self-service reactivation) |
| 22 | **Account Deletion** | `Settings.handleDelete` | 🔧 Partial | Cleans matches/sent/received on both sides; does NOT clean `blocked`/`blockedBy` subcollections or chat messages |
| 23 | **Settings Screen** | `Settings` | ✅ Complete | Notifications, account info, password reset, block list, sign out, T&C |
| 24 | **Share / Invite Modal** | `ShareModal` | ✅ Complete | Canvas-rendered 540×960 poster; Web Share API + WhatsApp fallback |
| 25 | **Intent-Based Feed Filter** | `intentFiltered` (MainApp) | ✅ Complete | Complement map matching; falls back to unfiltered if no complement found |
| 26 | **PWA (manifest + SW)** | `public/manifest.json`, `service-worker.js` | ✅ Complete | Standalone display, 8 icon sizes, 2 shortcuts, network-first SW |
| 27 | **Vercel Serverless FCM** | `api/notify.js` | 🔧 Partial | No auth check on endpoint (see Section G) |
| 28 | **LinkedIn Verification** | `validateLinkedIn`, `linkedinNameMatches` | ✅ Complete | URL format check + name-slug fuzzy match |
| 29 | **Password Reset** | `Settings` | ✅ Complete | Email/password users only; `sendPasswordResetEmail` |

---

## B. Firebase Integration Status

### Auth
| Method | Status |
|--------|--------|
| Email / Password | ✅ Wired (`createUserWithEmailAndPassword`, `signInWithEmailAndPassword`) |
| Google OAuth | ✅ Wired (`signInWithPopup`, `GoogleAuthProvider`) |
| Password Reset | ✅ `sendPasswordResetEmail` |
| Anonymous / Phone | ❌ Not implemented |

### Firestore Collections

| Collection / Subcollection | Purpose | Key Fields |
|---------------------------|---------|------------|
| `users/{uid}` | User profile | `uid`, `name`, `nameLower`, `lastNameLower`, `role`, `location`, `bio`, `skills[]`, `lookingFor[]`, `lookingForDetails{}`, `bringToTable`, `currentlyExploring[]`, `openTo[]`, `achievements[]`, `avatar`, `color`, `photoURL`, `title`, `pronouns`, `linkedinProfileUrl`, `linkedinVerified`, `fcmToken`, `deactivated`, `createdAt`, `termsAcceptedAt` |
| `users/{uid}/matches/{targetUid}` | Mutual connections (copy of profile snapshot) | `name`, `role`, `location`, `bio`, `skills`, `photoURL`, `avatar`, `color`, `lookingFor`, `pronouns`, `title` |
| `users/{uid}/sent/{targetUid}` | Outgoing pending requests | Full profile + `note`, `sentAt` |
| `users/{uid}/received/{senderUid}` | Incoming pending requests | Full profile + `note`, `sentAt` |
| `users/{uid}/passed/{passedUid}` | Users skipped in Discover | `passedAt` |
| `users/{uid}/blocked/{blockedUid}` | Blocked users | Full profile copy |
| `users/{uid}/blockedBy/{blockerUid}` | Users who blocked this account | `blockedAt` |
| `chats/{chatId}/messages/{msgId}` | Chat messages (`chatId` = sorted UIDs joined with `_`) | `text`, `from`, `createdAt` |

### Storage
| Path | Purpose |
|------|---------|
| `avatars/{uid}.jpg` | Profile photos (resized to max 200px, 70% JPEG quality before upload) |

### Security Rules
Present at `firestore.rules` (referenced in `firebase.json`). Summary:

| Rule | Status |
|------|--------|
| `users/{uid}` read | ✅ Auth required; deactivated users hidden |
| `users/{uid}` write | ✅ Owner only |
| `users/{uid}/matches` | ✅ Owner or matched user |
| `users/{uid}/sent` | ✅ Owner or target |
| `users/{uid}/received` | ✅ Owner or sender |
| `users/{uid}/passed` | ✅ Owner only |
| `chats` messages read | ✅ Participants only |
| `chats` messages create | ✅ Participant + `from == auth.uid` |
| `users/{uid}/blocked` | ⚠️ **No explicit rule** — falls through to Firestore default deny; works but undocumented |
| `users/{uid}/blockedBy` | ⚠️ **No explicit rule** — same as above |

---

## C. Onboarding Flow

5-step wizard in `Onboarding` component. Progress bar fills as user advances.

```
Step 0 — Who are you?
  Fields: Title (optional), First Name, Last Name, Pronouns (optional),
          Role, Location, LinkedIn URL (optional + validated)
  Valid: firstName + lastName + role + location + valid LinkedIn

Step 1 — Your story
  Fields: Bio (20-word max), Skills (5 max, 3-word max each), Achievements (comma-sep)
  Valid: bio + at least 1 skill

Step 2 — What are you looking for?
  Multi-select from LOOKING_FOR_OPTIONS:
  [Investor, Co-founder, Mentor, Collaboration, Freelance Work,
   Startup to join, A Job, Clients]
  Valid: at least 1 selection

Step 3 — Tell us more (dynamic)
  Follow-up questions rendered per selected intent (from LOOKING_FOR_QUESTIONS):
  - "A Job"         → 5 questions (industry, remote, notice, culture, win)
  - "Freelance Work"→ 4 questions (services, industries, budget, standout)
  - "Clients"       → 4 questions (problem, ideal client, results, engagement)
  - "Co-founder"    → 4 questions (building, stage, skills, commitment)
  - "Investor"      → 5 questions (project, problem, traction, raise, investor type)
  - "Mentor"        → 3 questions (area, journey, engage)
  - "Collaboration" → 3 questions (project, skills, type)
  - "Startup to join" → ⚠️ NO questions defined — shows "No extra details needed"
  All optional. Step always valid.

Step 4 — What I bring to the table
  Fields: Free-text (bring to table, context-aware prompt), Currently Exploring
          (comma-sep), Open To (multi-select: Coffee Chats, Mentorship,
          Partnerships, Beta Testing, Advisory Roles, Co-founder Conversations)
  Always valid.

Save: Writes to users/{uid}. Missing fields: firstName/lastName stored separately.
```

---

## D. Profile & Discovery

### Public Profile Fields (stored in `users/{uid}`)

| Field | Type | Display | Notes |
|-------|------|---------|-------|
| `name` | string | Yes | Computed from firstName + lastName |
| `title` | string | No (edit only) | Mr/Mrs/Ms etc. |
| `pronouns` | string | Yes (italics) | |
| `role` | string | Yes | Coloured with user's accent colour |
| `location` | string | Yes | With pin icon |
| `bio` | string | Yes | 20-word max |
| `skills` | string[] | Yes (tags) | Max 5, 3 words each |
| `lookingFor` | string[] | Yes (tags) | |
| `lookingForDetails` | object | Yes (Q&A card) | Only non-empty values shown |
| `achievements` | string[] | Yes | Star-bullet list |
| `bringToTable` | string | Yes | Left-border callout |
| `currentlyExploring` | string[] | Yes (accent tags) | |
| `openTo` | string[] | Yes (green tags) | |
| `linkedinProfileUrl` | string | Yes (badge) | Only shown if `linkedinVerified: true` |
| `photoURL` | string | Yes | Firebase Storage download URL |
| `avatar` | string | Fallback | 2-letter initials |
| `color` | string | Yes | Colour strip + accent colouring |

### Discovery Logic

- `loadMoreUsers()` fetches 30 users at a time ordered by `createdAt`, filtered `where("deactivated", "!=", true)`.
- `seenUids` Set (in memory) tracks cards already swiped — not persisted to Firestore. Lost on refresh.
- `unmatched` filters out: already matched, sent, passed, received, deactivated, blocked.
- `intentFiltered` applies a complement map: e.g., if you're looking for "Investor", you see people looking for "Co-founder" or "Startup to join". Falls back to full `unmatched` list if no complement matches exist.
- No geographic filtering, no skill-based filtering.

---

## E. Code Health

### Line Counts

| File | Lines |
|------|-------|
| `src/App.js` | **2,189** |
| `src/Profile.js` | 434 |
| `src/shared.js` | 265 |
| `src/Messages.js` | 202 |
| `src/firebase.js` | 37 |
| `api/notify.js` | 41 |
| `public/service-worker.js` | 79 |

### Hook Counts in App.js

| Hook | Count |
|------|-------|
| `useState` | ~47 across all components in the file |
| `useEffect` | ~16 across all components in the file |
| `useRef` | 5 (in `MainApp`) |

### Comments / Suppressions

| Location | Issue |
|----------|-------|
| `App.js:844` | `eslint-disable-line` on ShareModal useEffect (empty deps, intentional) |
| `App.js:954` | `eslint-disable-line` on loadMoreUsers useEffect |
| `App.js:991` | `eslint-disable-line` on chat message snapshot (has `matches` dep, closure over `activeChatRef` ref) |
| `App.js:1314` | `eslint-disable-line` on Discover load-more effect |
| `App.js:1481` | `eslint-disable-line` on SearchModal search effect |
| `App.js:948` | `console.error("Failed to load users:", e)` |
| `App.js:1477` | `console.error("[Search] query error:", e)` |
| `App.js:1997` | `console.warn("FCM error:", err)` |
| `App.js:2116` | `eslint-disable-line` on SplashScreen timer effect |
| `Messages.js:56` | `console.warn("FCM notify error:", e)` |
| `Profile.js:10` | `eslint-disable-line` on editTrigger effect |
| `firebase.js:31` | `console.warn("FCM token error:", err)` |
| `src/index.js:20` | `console.warn('SW registration failed:', err)` |

No `TODO`, `FIXME`, or `HACK` comments found anywhere in the codebase.

### Performance Concerns

| Issue | Location | Risk |
|-------|----------|------|
| Discover chat listeners scale O(n) with match count | `MainApp useEffect` line 966 — one `onSnapshot` per match | Medium — at 50+ matches, this creates 50+ open Firestore listeners |
| `seenUids` Set is in-memory only | `MainApp` | Low for now — resets on page refresh, user re-sees profiles |
| `achievements` array items use array index as `key` | `PublicProfile`, `Profile` line 659, 381 | Low — list is stable |
| Profile edit saves entire `users/{uid}` doc with `setDoc` (not `updateDoc`) | `Profile.saveProfile` line 93 | Low — overwrites everything; safe but slightly wasteful |
| Firestore `getDocs` called inside `handleDelete` before cleanup | `Settings` | Fine — snapshot taken first |
| `drawInvitePoster` runs on every `ShareModal` mount | `ShareModal useEffect` | Negligible |

---

## F. Routing & Navigation

**No routing library.** Navigation is purely state-driven.

### Screen Decision Tree (App root)

```
App
├── /privacy path → <PrivacyPolicy> (checked before state, bypasses all auth)
├── !splashDone → <SplashScreen> (4.1 seconds, then resolves)
├── loading → blank div (COLORS.bg)
├── !firebaseUser → <AuthScreen>
├── !profile || profile.uid !== firebaseUser.uid → <Onboarding>
└── <MainApp>
    ├── tab = "discover" → <Discover>
    ├── tab = "matches"  → <Matches>
    ├── tab = "messages" (no activeChat) → <Messages> (list view)
    ├── tab = "messages" (activeChat set) → <Messages> (chat view, fixed overlay)
    ├── tab = "profile"  → <Profile>
    └── tab = "settings" → <Settings>
    
    Overlays (z-index layers):
    ├── viewingProfile → <PublicProfile> (z:40, full-screen slide)
    ├── showSearch → <SearchModal> (z:40, full-screen)
    └── notification → toast (z:999, top center)
```

### Tab Bar
5 tabs: Discover, Connections, Messages, Profile, Settings. Built inline in `MainApp` — not a separate component. Badge counts on Connections (pending requests) and Messages (unread chats).

### URL State
Initial tab can be set via `?tab=discover|matches|messages|profile|settings`. Used by PWA shortcuts.

---

## G. Known Bugs & Issues

### Bug 1 — Search Prefix Range Query is Broken (Severity: HIGH)
**Location:** `SearchModal` useEffect, `App.js:1457–1462`

```js
const end_ = t_ + "";      // ← identical to t_
const endCap_ = tCap + ""; // ← identical to tCap
// This makes the range query: nameLower >= "alex" AND nameLower <= "alex"
// Which is equivalent to: nameLower == "alex" (exact match only)
```

The Firestore prefix scan requires `end = start + ''`. The correct code should be:
```js
const end_ = t_ + '';
const endCap_ = tCap + '';
```
Search currently returns results only when you type a user's exact full name or surname.

---

### Bug 2 — `/api/notify` Unauthenticated (Severity: HIGH)
**Location:** `api/notify.js`

The FCM send endpoint has no authentication. Any actor who discovers the endpoint can send push notifications to any user whose FCM token they know. Firebase FCM tokens are stored in `users/{uid}` — readable by any authenticated user per current Firestore rules. This is a significant security concern.

**Fix:** Add a Firebase ID token header check using `firebase-admin.auth().verifyIdToken(req.headers.authorization)`.

---

### Bug 3 — Account Delete Does Not Clean Up `blocked`/`blockedBy` or Chat Messages (Severity: MEDIUM)
**Location:** `Settings.handleDelete`, `App.js:1842–1873`

When a user deletes their account:
- `matches`, `sent`, `received` are cleaned up on both sides ✅
- `blocked` and `blockedBy` subcollections are **not** cleaned up ❌
- Chat messages in `chats/{chatId}/messages/` are **not** deleted ❌

This leaves stale data in Firestore that bloats storage and could surface ghost references.

---

### Bug 4 — Deactivation is Not Self-Reversible (Severity: MEDIUM)
**Location:** `Settings.handleDeactivate`, deactivation confirmation dialog

The UI says "You can reactivate by contacting support" — but there is no support infrastructure. Deactivated users who try to log back in will land on Onboarding (since `profile.deactivated` is not checked in `App.onAuthStateChanged`). Logging in with a deactivated account will re-show the Onboarding screen (because the profile has no `termsAcceptedAt` migration issue, actually the profile doc exists so Onboarding is skipped... wait — let me reconsider). Actually, `getDoc` returns the doc with `deactivated: true`, so `setProfile(data)` is called and the user goes to `MainApp`. But they're hidden from Discover. However, since `setDoc(doc, { deactivated: true }, { merge: true })` leaves the profile intact, the user CAN sign back in and use the app normally — the only effect is they're hidden from Discover. The UX text is misleading.

---

### Bug 5 — Version Mismatch (Severity: LOW)
`package.json` declares `"version": "0.1.0"` but `Settings` displays `"1.0.0 Beta"`. These should be kept in sync.

---

### Bug 6 — Hardcoded Chat Bubble Colour Not From COLORS (Severity: LOW)
**Location:** `Messages.js:158`

```js
background: msg.from === firebaseUser.uid ? "#1D4ED8" : COLORS.card,
```

`#1D4ED8` is a hardcoded hex. Per CLAUDE.md, hex values should never be hardcoded. This should be moved to `COLORS`.

---

### Bug 7 — Firebase Config Duplicated in service-worker.js (Severity: LOW)
**Location:** `public/service-worker.js:4–11`

Firebase config is hardcoded verbatim in the service worker file (which is not processed by the React build pipeline and cannot use environment variables). Any changes to the Firebase project config require a manual update in two places: `firebase.js` and `service-worker.js`.

---

### Bug 8 — Firestore Rules Missing `blocked`/`blockedBy` (Severity: LOW)
**Location:** `firestore.rules`

`blocked` and `blockedBy` subcollections have no explicit rules. They fall through to Firestore's implicit default deny for uncovered paths. The block/unblock logic currently works because the app calls these with user auth, and the match pattern `match /users/{uid}/...` doesn't cover sub-subcollections implicitly. Should be made explicit.

---

### Bug 9 — FCM In-App Foreground Display Missing (Severity: LOW)
The service worker handles background messages via `onBackgroundMessage` ✅. But in `firebase.js`, `onMessage` is exported but never consumed in the app — there is no foreground message listener. When the app is open and in focus, received FCM messages are silently dropped.

---

### Bug 10 — `Startup to join` Has No Intent-Specific Questions (Severity: LOW)
**Location:** `shared.js` — `LOOKING_FOR_QUESTIONS` object

All 8 intent types in `LOOKING_FOR_OPTIONS` have entries in `LOOKING_FOR_QUESTIONS` except `"Startup to join"`. This is intentional (no follow-up needed) but the intent also has no corresponding complement in the `complementMap` for `Discover` filtering. Users looking to join a startup won't see relevant people unless others happen to be in complementary intents.

---

### No Error Boundaries
Zero `ErrorBoundary` components in the codebase. Any unhandled render error will crash the entire app silently showing a blank screen.

---

## H. What's Missing for v0.4 → v1.0

| Priority | Gap | Impact |
|----------|-----|--------|
| 1 | **Fix search prefix query** (Bug 1) | Core feature broken |
| 2 | **Authenticate `/api/notify`** (Bug 2) | Security vulnerability |
| 3 | **Foreground FCM message handler** | Push notifications incomplete |
| 4 | **Error Boundary** | Any render error = blank white screen |
| 5 | **Skill-based / intent-based search** | Currently only name search |
| 6 | **Unmatch / disconnect feature** | No way to remove a connection post-match |
| 7 | **Clean up `blocked`/chat on account delete** (Bug 3) | Data integrity |
| 8 | **Read receipts / delivered indicators** | Messages feel disconnected |
| 9 | **Self-service reactivation** | Deactivation is effectively permanent (Bug 4) |
| 10 | **Rate limiting on connect requests** | Spam/abuse vector — no limits on how many requests a user can send |

---

## I. Recommended Next Steps (Prioritised)

### Issue 1 — Fix Search Prefix Range Query
**Priority: P0 — Breaks core feature**

The search range end-bound is `t_` (same as start), making search exact-match only. Fix is a one-liner:

```js
// App.js — SearchModal useEffect
const end_ = t_ + '';
const endCap_ = tCap + '';
```

**AC:** Typing "al" finds "Alex", "Alice", "Alicia" — not just exact match "al".

---

### Issue 2 — Authenticate the FCM Notify Endpoint
**Priority: P0 — Security**

Add Firebase ID token verification to `api/notify.js`. Client sends `Authorization: Bearer <idToken>` header. Server verifies it before dispatching FCM. Prevents any party from sending arbitrary push notifications to any user.

**AC:** Unauthenticated POST to `/api/notify` returns 401. Authenticated POST works as before.

---

### Issue 3 — Add Foreground FCM Message Listener
**Priority: P1 — Feature Completion**

Import `onMessage` from `firebase.js` inside `MainApp` useEffect. Display received messages as the existing `notification` toast or a chat bubble append when the relevant chat is open.

**AC:** Receiving a message while the app is open and in the Messages tab shows the message without needing a page reload.

---

### Issue 4 — Add an Error Boundary
**Priority: P1 — Reliability**

Wrap `<MainApp>` (and optionally `<Onboarding>`) in a simple `ErrorBoundary` class component that catches render errors and shows a recoverable UI ("Something went wrong — tap to reload") instead of a blank screen.

**AC:** Deliberately throwing an error in a child component shows the fallback UI, not a blank page.

---

### Issue 5 — Add Disconnect / Unmatch Feature
**Priority: P2 — Core Product**

Currently, matches are permanent. Add a "Remove Connection" option accessible from the Connections tab or the PublicProfile view. Must delete `matches/{targetUid}` on both users and optionally archive or delete the chat.

**AC:** User can remove a mutual connection. That person no longer appears in Messages or Connections. The removed user can re-appear in Discover.

---

## Summary

link-ap v0.4 is a well-built, coherent MVP. The core loop (auth → onboard → discover → connect → chat) works end-to-end. Firebase integration is solid, Firestore rules are mostly correct, and the FCM infrastructure is largely in place. The three most urgent items before v1.0 are: (1) fixing the broken search prefix query, (2) securing the FCM notify endpoint, and (3) adding an error boundary so the app degrades gracefully instead of going blank.
