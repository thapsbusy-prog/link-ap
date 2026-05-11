# V 0.2 Link-Ap Status Report

**Generated:** 11 May 2026  
**Codebase snapshot:** `main` branch — commit `7dfc925`  
**Live URL:** https://link-ap.online  

---

## 1. Project Overview

Link-Ap is a mobile-first professional networking Progressive Web App (PWA). Its core premise is quality over quantity: rather than a passive LinkedIn-style feed, users browse one profile at a time in a Discover queue, must write a personalised note before sending a connection request, and can only message someone once both sides have mutually accepted.

**Target users:** Entrepreneurs, founders, freelancers, investors, mentors, job seekers, and anyone seeking co-founders or collaborators — primarily in the early-stage startup and professional services space. The Terms of Service, governing law (South Africa), and early-access messaging ("first 100 people, free forever") all point to a South Africa-first launch with global ambition.

**Core value proposition:** Match people by *intent* (what they are actively looking for), not just title or industry. A job seeker sees only profiles from people who need talent; an investor sees founders who are raising — and so on.

---

## 2. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| UI Framework | React | 19.2.5 |
| Build tooling | Create React App (`react-scripts`) | 5.0.1 |
| Backend / Auth | Firebase Authentication | 12.12.1 (SDK) |
| Database | Cloud Firestore | 12.12.1 (SDK) |
| File Storage | Firebase Storage | **Configured but unused** (storageBucket set in `firebase.js`; Storage SDK never imported) |
| Hosting / Deploy | Vercel (auto-deploy on push to `main`) | — |
| PWA | Web App Manifest + custom Service Worker | — |
| Routing | None — `tab` state string in `MainApp` | — |
| Styling | 100% inline React styles | — |
| Language | JavaScript (no TypeScript) | — |
| Testing | `@testing-library/react` | 16.3.2 |

**Notable absences:** No routing library (React Router etc.), no state management library (Redux, Zustand), no CSS framework, no component library, no TypeScript, no linting config beyond the default CRA eslint preset.

---

## 3. Current Features

### Auth & Session
- Email/password sign-up and login
- Google OAuth (sign-in with popup, `select_account` prompt enforced)
- Password reset via Firebase email link
- Terms of Service checkbox required for sign-up; inline ToS text with full legal content
- `onAuthStateChanged` as the single source of truth — no manual auth state mutation

### Splash Screen
- Animated logo with scale-in and pulsing glow effect (~3.6 s display, 0.5 s fade-out)

### Onboarding (5 steps, linear)
See Section 4 for full detail.

### Discover Tab
- One-card-at-a-time browsing queue (not a swipe UI — action buttons)
- Intent-based pre-filtering: a `complementMap` matches the current user's intents against profiles whose intents are complementary (e.g. "A Job" sees "Clients" and "Collaboration")
- Falls back to showing all unmatched users if no complement matches exist
- Pass action: writes to `passed` subcollection; profile never reappears in this session
- Connect action: opens `ConnectNoteModal` requiring a personal note (10–300 characters) before the request is sent
- Pagination: 30 users per page, auto-loads next page when fewer than 5 unseen profiles remain
- `seenUids` set tracks browsed profiles in memory (not persisted — refreshing resets the queue to the top, though passed profiles remain filtered via Firestore)
- Invite / share poster accessible from Discover

### Connections Tab (labelled "Connections" in nav)
- **Incoming requests** section: shows requester avatar, role, location, and their personalised connection note; Accept / Decline actions
- **Mutual connections** section: tapping a connection opens their chat thread
- **Pending sent requests** section: shows the note you sent, greyed out, "Waiting for them to respond"
- Blocked users filtered from all three sections

### Messages Tab
- List view: all mutual connections (blocked users hidden); unread dot indicator per conversation
- Chat view: real-time Firestore `onSnapshot` messages; smooth-scroll to latest; Enter key sends
- Audio notification: two-tone descending chime (D6 → A5) via Web Audio API when a new message arrives while not viewing that chat — respects user toggle
- Vibration: `navigator.vibrate` pattern when a message arrives — respects user toggle
- Block guard: sending is disabled if either party has blocked the other; contextual message shown
- Messaging locked if connection request is still pending (one-way request state)

### Profile Tab
- Read view: mirrors the `PublicProfile` layout exactly — users see themselves as others see them
- Edit view: full form to update all profile fields (name, title, pronouns, role, location, bio, skills, achievements, LinkedIn, lookingFor, lookingForDetails, bringToTable, currentlyExploring, openTo)
- Photo upload: client-side canvas resize to max 200×200 px at 70% JPEG quality; stored as base64 data URL in Firestore
- LinkedIn badge: shown on profile if the URL contains `linkedin.com/in/` AND the slug name-matches the user's first + last name (client-side heuristic)
- "Actively raising" pulse badge if `lookingFor` includes `"Investor"`
- Share invite modal accessible from Profile

### Settings Tab
- **Notifications:** Sound toggle (localStorage `linkap_sound`), Vibrate toggle (`linkap_vibrate`)
- **Account:** Display name and email; Edit Profile (navigates to Profile edit mode); Change Password (sends Firebase reset email, email-auth users only)
- **Privacy:** Block list view with per-user unblock action
- **About:** Terms of Service (inline modal), App Version display (hardcoded "1.0.0 Beta")
- **Account Actions:** Sign Out; Deactivate Account (soft-hides profile, data retained); Delete Account (cascading Firestore cleanup + Firebase Auth user deletion, with `requires-recent-login` guard)

### Public Profile Modal
- Full-page overlay accessible from Discover, Connections, and Messages
- Displays: avatar, name, pronouns, role, location, bio, LinkedIn badge, "Actively raising" badge, skills, intent Q&A block (labelled "INVESTOR DECK" for investor intent), achievements, "What I Bring to the Table", Currently Exploring, Open To
- Block/Unblock button for other users' profiles

### Search Modal
- Accessible via the global header "🔍 Search" button
- Firestore name search: queries `nameLower`, `lastNameLower`, and `name` fields with prefix range queries (400 ms debounce)
- Shows connection status: Connected / Requested / Connect button
- Connect flow requires a personal note (same as Discover)
- Filters own profile and blocked users from results

### Invite / Share
- `ShareModal` generates a 540×960 px promotional poster using HTML Canvas
- Poster content: Link-Ap wordmark, tagline, 4 benefit bullet cards, italic statement, value categories, CTA URL
- Actions: Save as PNG (data URL download), Share via WhatsApp (Web Share API with image file if supported, URL fallback)

### PWA
- `manifest.json`: standalone display, portrait orientation, theme/background colours, 8 icon sizes (72–512 px), 2 app shortcuts (Discover, Messages), categories: business/social/productivity
- Custom service worker: network-first fetch strategy, static asset pre-cache, offline fallback to `/index.html`

### Block System
- Block writes to `users/{uid}/blocked/{targetUid}` (stores full profile snapshot) and `users/{targetUid}/blockedBy/{uid}`
- Unblock deletes both records
- Blocked users are filtered from: Discover queue, Connections tab, Messages list, Search results
- Users who have blocked you (`blockedBy`) are also filtered from Connections and Messages

### Privacy Policy
- `PrivacyPolicy` React component rendered at `/privacy` path (detected via `window.location.pathname`)
- Also a static `public/privacy.html` file (separate, potential duplication)

---

## 4. Onboarding Flow

The `Onboarding` component runs 5 sequential steps with a progress bar. It only renders if the authenticated Firebase user has no document in `users/{uid}`.

### Step 1 — "Who are you?"
Fields: Title (optional, dropdown: Mr/Mrs/Ms/Miss/Mx/Dr/Prof/Rev/Sir/Dame/Adv), First Name(s), Last Name, Pronouns/gender identity (optional, 9 options), "What do you do?" (role), Location, LinkedIn Profile URL (optional, validated against `linkedin.com/in/`)  
**Gate:** firstName, lastName, role, location required; LinkedIn URL must pass format check if provided.

### Step 2 — "Your story"
Fields: Bio (hard capped at 20 words, word counter shown), Skills (up to 5, max 3 words each — add/remove chips), Notable achievements (comma-separated free text)  
**Gate:** bio and at least 1 skill required.

### Step 3 — "What are you looking for?"
Multi-select from 8 intents: `Investor`, `Co-founder`, `Mentor`, `Collaboration`, `Freelance Work`, `Startup to join`, `A Job`, `Clients`  
**Gate:** at least 1 selection required.

### Step 4 — "Tell us more" (dynamic)
Intent-based follow-up questions rendered only for selected intents that have questions defined. All fields are optional. If no selected intent has questions, a "No extra details needed" message is shown.

| Intent | Questions asked |
|---|---|
| A Job | Industry/role target, remote preference, notice period, culture preference, biggest professional win |
| Freelance Work | Services offered, industries worked in, project budget range, standout factor |
| Clients | Problem solved, ideal client (industry/size/role), results delivered, engagement model |
| Co-founder | What you're building, venture stage, skills sought, full/part-time commitment |
| Investor | Startup/project, problem and target user, traction/proof points, raise amount and purpose, investor type |
| Mentor | Area of guidance sought, journey stage, preferred engagement format |
| Collaboration | Project/idea, skills/roles sought, compensation model (paid/equity/passion) |
| Startup to join | *(no follow-up questions defined)* |

**Gate:** always valid (all optional).

### Step 5 — "What I bring to the table"
Fields: Free-text pitch (prompt adapts based on intent — e.g. "What's your unfair advantage?" for Investor seekers), Currently Exploring (comma-separated), Open To (multi-select: Coffee Chats, Mentorship, Partnerships, Beta Testing, Advisory Roles, Co-founder Conversations)  
**Gate:** always valid.

### Save
On completion, `saveProfile()` constructs the full profile document and writes it to `users/{uid}` via `setDoc`. Assigns a random accent colour from `USER_COLORS`. Sets `linkedinVerified: true` only if the URL is valid AND the slug matches the user's first and last name (client-side).

---

## 5. User Profile

### Firestore fields on `users/{uid}`

| Field | Type | Notes |
|---|---|---|
| `uid` | string | Firebase Auth UID |
| `title` | string | Optional: Mr/Mrs/etc. |
| `firstName` | string | From onboarding step 1 |
| `lastName` | string | From onboarding step 1 |
| `name` | string | `firstName + " " + lastName` (display name) |
| `nameLower` | string | `name.toLowerCase()` — Firestore search index |
| `lastNameLower` | string | Last token of name in lowercase — Firestore search index |
| `pronouns` | string | Optional |
| `role` | string | "What do you do?" free text |
| `location` | string | Free text |
| `bio` | string | Max 20 words |
| `skills` | string[] | Max 5, each max 3 words |
| `lookingFor` | string[] | From LOOKING_FOR_OPTIONS |
| `lookingForDetails` | object | Keys match question keys from LOOKING_FOR_QUESTIONS (e.g. `job_industry`, `investor_raise`) |
| `achievements` | string[] | Parsed from comma-separated input |
| `bringToTable` | string | Free text pitch |
| `currentlyExploring` | string[] | Parsed from comma-separated input |
| `openTo` | string[] | From OPEN_TO_OPTIONS |
| `linkedinProfileUrl` | string | Normalised URL or empty string |
| `linkedinVerified` | boolean | Client-side name-match heuristic |
| `photoURL` | string | Base64 data URL (resized to max 200×200 px) or Google OAuth photo URL |
| `avatar` | string | 1–2 initials from name |
| `color` | string | Random hex from USER_COLORS (assigned at onboarding, never changed) |
| `createdAt` | Timestamp | Firestore server timestamp |
| `termsAcceptedAt` | Timestamp | Firestore server timestamp |
| `deactivated` | boolean | Set to `true` on deactivation; absent on active accounts |

### Visibility
Every field written to `users/{uid}` is effectively public to other authenticated users, since Discover, Search, and profile views all read directly from this document. There is no private/public field split and no Firestore Security Rules visible in the codebase — rules are managed outside the repo in the Firebase console.

---

## 6. Authentication

**Providers supported:**
- Google OAuth (`signInWithPopup`, `select_account` prompt always shown)
- Email/password (`createUserWithEmailAndPassword`, `signInWithEmailAndPassword`)

**Sign-up gate:** Terms of Service checkbox must be checked before the sign-up button or Google button is active. The `termsAcceptedAt` timestamp is written to Firestore at profile creation.

**Session management:** `onAuthStateChanged` in the root `App` component is the only state driver. On every auth change it:
1. Sets `loading = true` and clears `profile` to prevent stale data
2. Fetches the user's Firestore doc
3. Back-fills `nameLower`/`lastNameLower` if they are missing (migration shim for early users)
4. Sets `loading = false` and renders the correct screen

**Screen routing logic (in order):**
1. Splash screen shown until 4.1 s timer completes (first load only)
2. `loading` → blank dark screen
3. `!firebaseUser` → `AuthScreen`
4. `!profile || profile.uid !== firebaseUser.uid` → `Onboarding`
5. Otherwise → `MainApp`

**Password reset:** Available in Settings for email-auth users only. Sends Firebase's built-in reset email.

**Account deletion:** Calls `firebaseUser.delete()`. Handles `auth/requires-recent-login` error with a human-readable message.

---

## 7. Database Structure

All data lives in Cloud Firestore under the `link-ap` project.

```
users/
  {uid}                          ← profile document (see Section 5)
  {uid}/matches/{targetUid}      ← snapshot of the matched user's profile at time of match
  {uid}/sent/{targetUid}         ← snapshot of target's profile + note + sentAt
  {uid}/received/{senderUid}     ← snapshot of sender's profile + note + sentAt
  {uid}/passed/{targetUid}       ← { passedAt: Timestamp } or { uid: string }
  {uid}/blocked/{targetUid}      ← snapshot of blocked user's profile
  {uid}/blockedBy/{blockerUid}   ← { blockedAt: Timestamp }

chats/
  {uid_a}_{uid_b}/               ← chatId: two UIDs sorted alphabetically, joined with "_"
    messages/{msgId}             ← { text: string, from: uid, createdAt: Timestamp }
```

**Key design decisions:**
- Match subcollections store a **snapshot** of the matched profile, not a reference. This means if someone updates their profile, their appearance in your matches list becomes stale.
- There is no top-level `chats` document — only the `messages` subcollection exists.
- `passed` writes use either `{ passedAt }` (for user-initiated passes) or `{ uid }` (for declined requests), inconsistently.
- No Firestore Security Rules are visible in the codebase. They live externally in the Firebase console.

**Queries in use:**
- `where("deactivated", "!=", true)` + `orderBy("deactivated") + orderBy("createdAt")` on `users` (requires a composite Firestore index)
- Range prefix search on `nameLower`, `lastNameLower`, `name` in SearchModal
- `orderBy("createdAt")` on `chats/{chatId}/messages`

---

## 8. Known Issues / Incomplete Features

### Critical
1. **Photo storage via base64 in Firestore.** Profile photos are resized to 200×200 px and stored as base64 data URLs directly in the `users/{uid}` document. A Firestore document has a 1 MB maximum size. A 200×200 JPEG at 70% quality is typically 10–30 KB in base64 (~40 KB), which is within limits for now, but any profile that uses a high-entropy image could approach the cap. More critically, every Discover card read, match list read, and search result downloads the full base64 string, creating unnecessary bandwidth overhead. Firebase Storage is already configured in `firebase.js` but the SDK is never imported.

2. **Search is broken for prefix matching.** In `SearchModal`, the upper bound for the Firestore range query is set to the exact same string as the lower bound (`end_ = t_ + ""`). This means `where('nameLower', '>=', 'ali'), where('nameLower', '<=', 'ali')` only returns exact matches for `"ali"` — it does not return `"alice"`, `"alison"`, etc. The standard fix is `end_ = t_ + ""`. The search effectively only works for users who type someone's full first or last name exactly.

### Moderate
3. **Stale match snapshots.** When two users match, a snapshot of each profile is written to the other's `matches` subcollection. Subsequent profile edits are not propagated to existing matches. A matched user's name, role, photo, and skills shown in the Connections and Messages tabs can be permanently stale.

4. **`seenUids` resets on page refresh.** The set of Discover profiles already browsed is held in React state only. Refreshing the page resets it, so users see already-passed-on profiles again (unless they clicked "Pass", which writes to Firestore). This could be confusing.

5. **Deactivation doesn't hide user from active chats and match lists.** Setting `deactivated: true` filters the user from Discover and Search queries, but their snapshot in other users' `matches` subcollections is untouched. Deactivated users remain visible in Connections and Messages until the data is manually cleaned up.

6. **No cascading chat deletion.** `handleDelete` cleans up `matches`, `sent`, and `received` subcollections, but does NOT delete `chats/{chatId}/messages` documents or `blocked`/`blockedBy` subcollections.

7. **`blockedBy` users not filtered from Search results.** The SearchModal filters users you have blocked, but does not filter users who have blocked you (the `blockedByUids` array is not passed into `SearchModal`).

8. **Passed profiles are unrecoverable.** Once a user clicks "Pass", the target UID is added to the `passed` subcollection and is excluded from Discover forever (for that user). There is no "undo pass" mechanism.

### Minor
9. **Version mismatch.** `package.json` has `"version": "0.1.0"` but the Settings screen displays "1.0.0 Beta".

10. **`/privacy` route handled via `window.location.pathname` check.** This is checked before the splash screen and before auth checks. The `public/privacy.html` file also exists as a static alternative — these serve different content (one is the React component, one is a static HTML page) and may diverge.

11. **No last-message preview in Messages list.** The conversation list shows only the contact's name and "Tap to chat 💬". There is no preview of the last message or timestamp.

12. **No push notifications.** Audio and vibration only fire when the app is open and in focus on the messages tab for another chat. There is no mechanism to notify users of new connections or messages when the app is backgrounded or closed.

13. **No read receipts or typing indicators** in chat.

14. **Intentional complement filter fallback may be confusing.** If no complementary profiles exist in Discover, the filter silently falls back to showing all unmatched users. A user looking for "A Job" could end up seeing other job seekers with no explanation.

15. **LinkedIn verification is client-side only.** The name-matching heuristic runs entirely in the browser. It can be spoofed by editing the URL slug on LinkedIn or using an alias profile. The verified badge may mislead other users.

---

## 9. Code Quality Notes

### Monolith structure
The entire application — ~2,965 lines — lives in a single file, `src/App.js`. This includes utility functions, SVG icon components, UI primitives (Input, TextArea, Select, Tag, Avatar, SkillsInput), business logic components (Onboarding, Discover, Matches, Messages, Profile, Settings), modal components (ConnectNoteModal, SearchModal, ShareModal, PublicProfile), canvas drawing code (`drawInvitePoster`, `roundRect`), and the root `App` component. This makes it difficult to navigate, test in isolation, or onboard contributors.

### Inline styles throughout
All component styles are written as inline React style objects. There are no CSS modules, no CSS-in-JS library, no Tailwind, and no design tokens beyond the `COLORS` and `USER_COLORS` constants. While this eliminates class-name conflicts and keeps styles co-located with components, it produces verbose JSX, duplicates common patterns across components (border-radius, padding, borderRadius values repeated dozens of times), and is not amenable to theming or responsive breakpoints.

### Photo storage as base64 in Firestore
As noted in Section 8, storing base64-encoded images in Firestore documents is a structural issue that will become a reliability and performance problem at scale. The Firebase Storage bucket is already configured — migrating to Storage + a URL reference would resolve this cleanly.

### No custom hooks
Multiple `onSnapshot` subscriptions follow an identical pattern (`useEffect` → subscribe → return unsubscribe). These could be extracted into a reusable `useFirestoreCollection` hook. Similarly, the intent-filtering logic in `MainApp` and the profile-save logic in both `Onboarding` and `Profile` share significant structure.

### Suppressed ESLint warnings
There are multiple `// eslint-disable-line` comments on `useEffect` dependency arrays throughout the file, indicating hooks with intentionally incomplete dependency arrays. These are worth auditing to confirm they do not introduce stale closure bugs.

### Canvas drawing in main bundle
The `drawInvitePoster` and `roundRect` functions (~100 lines of canvas code) are loaded for every user even if they never open the Share modal. This is minor in isolation but symptomatic of the monolith pattern.

### Inconsistent `passed` document shape
`handlePass` writes `{ passedAt: serverTimestamp() }` while `handleDeclineRequest` writes `{ uid: senderUser.uid }`. Both land in the same `passed` subcollection. The shape inconsistency is harmless now (only `d.id` is read from these docs) but is a latent data quality issue.

### Missing `firstName`/`lastName` in Profile edit
The Profile edit form uses a single `name` field (full name combined), while the onboarding form captures `firstName` and `lastName` separately. Editing a profile via the Profile tab will recompute `lastNameLower` as the last word of the combined name string, which may produce unexpected search results for names that don't follow a first-last pattern.

---

## 10. Recommended Next Steps

Listed in order of impact relative to what is already built.

### 1. Migrate photo storage to Firebase Storage
**Why:** The current approach (base64 in Firestore) risks hitting the 1 MB document limit, bloats every read that touches a user doc, and does not scale. Firebase Storage is already configured.  
**What to build:** On photo select, upload to `gs://link-ap.firebasestorage.app/avatars/{uid}.jpg`, store the download URL in `users/{uid}.photoURL`. Add a `storage` export to `firebase.js`. This change is backwards-compatible — existing base64 values continue to render until overwritten.

### 2. Fix the search prefix query
**Why:** The search is functionally broken for prefix matching — it only returns exact-string matches. This silently disappoints users who type partial names.  
**What to fix:** Change `end_ = t_ + ""` to `end_ = t_ + ""` (and same for `endCap_`). This is a one-line fix that makes the search work as intended.

### 3. Add a last-message preview and timestamp to the Messages list
**Why:** The Messages tab currently shows every conversation as "Tap to chat 💬". Users cannot tell which conversations have unread messages, how recent they are, or what was last said. This is a high-frequency friction point.  
**What to build:** On each chat snapshot subscription (already running in `MainApp`), store the last message text and timestamp alongside the `unreadChats` set. Render a 1-line preview and a relative timestamp ("2 min ago", "Yesterday") in the Messages list row.

### 4. Propagate profile updates to existing match snapshots
**Why:** Because matches store a profile snapshot, anyone who edits their name, photo, or role is invisible to their existing connections (they see an outdated version forever).  
**What to build:** When `saveProfile` in `Profile` is called, after saving `users/{uid}`, fetch the current user's `matches` subcollection and batch-update each matched user's `users/{matchedUid}/matches/{uid}` document with the updated profile fields. This keeps the denormalised data fresh.

### 5. Implement push notifications via Firebase Cloud Messaging (FCM)
**Why:** New connection requests and messages currently only produce audio/vibration when the app is foregrounded. Users who close the tab or minimise the browser receive no signal — a critical gap for a networking app where timely responses drive engagement.  
**What to build:** Register a FCM service worker, request notification permission during onboarding or Settings, store the FCM token in `users/{uid}.fcmToken`, and trigger a Cloud Function (or a Vercel Edge Function) that sends a push notification when a `received` or `messages` document is created. The service worker is already registered — it only needs FCM integrated.
