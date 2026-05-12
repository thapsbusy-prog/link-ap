# V 0.3 Link-Ap Status Report

**Generated:** 12 May 2026  
**Codebase snapshot:** `main` branch — commit `c32286a`  
**Live URL:** https://link-ap.online  
**Contact:** info@link-ap.online  

---

## 1. Project Overview

Link-Ap is a mobile-first professional networking Progressive Web App (PWA). Its core premise is quality over quantity: rather than a passive LinkedIn-style feed, users browse one profile at a time in a Discover queue, must write a personalised note before sending a connection request, and can only message someone once both sides have mutually accepted.

**Target users:** Entrepreneurs, founders, freelancers, investors, mentors, job seekers, and anyone seeking co-founders or collaborators — primarily in the early-stage startup and professional services space. The Terms of Service, governing law (South Africa), and early-access messaging ("first 100 people, free forever") all point to a South Africa-first launch with global ambition.

**Core value proposition:** Match people by *intent* (what they are actively looking for), not just title or industry. A job seeker sees only profiles from people who need talent; an investor sees founders who are raising — and so on.

**Live URLs:**
- App: https://link-ap.online
- Contact / privacy rights: info@link-ap.online

---

## 2. Tech Stack

| Layer | Technology | Version / Notes |
|---|---|---|
| UI Framework | React | 19.2.5 |
| Build tooling | Create React App (`react-scripts`) | 5.0.1 |
| Backend / Auth | Firebase Authentication | 12.12.1 (SDK) |
| Database | Cloud Firestore | 12.12.1 (SDK) |
| File Storage | **Firebase Storage** | **12.12.1 (SDK) — active and in use as of 11 May 2026** |
| Hosting / Deploy | Vercel (auto-deploy on push to `main`) | — |
| PWA | Web App Manifest + custom Service Worker | — |
| Routing | None — `tab` state string in `MainApp` | — |
| Styling | 100% inline React styles | — |
| Language | JavaScript (no TypeScript) | — |
| Testing | `@testing-library/react` | 16.3.2 |
| Testing (DOM) | `@testing-library/dom` | 10.4.1 |
| Testing (utils) | `@testing-library/user-event` | 13.5.0 |
| Performance | `web-vitals` | 2.1.4 |

**Firebase project ID:** `link-ap`  
**Storage bucket:** `link-ap.firebasestorage.app`  
**Auth domain:** `link-ap.firebaseapp.com`

**Notable absences:** No routing library (React Router etc.), no state management library (Redux, Zustand), no CSS framework, no component library, no TypeScript, no linting config beyond the default CRA ESLint preset.

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
- Empty-queue state shows "Founding Member" badge and an invite prompt

### Connections Tab (labelled "Connections" in nav)
- **Incoming requests** section: shows requester avatar, role, location, and their personalised connection note; Accept / Decline actions
- **Mutual connections** section: tapping a connection opens their chat thread
- **Pending sent requests** section: shows the note you sent, greyed out, "Waiting for them to respond"
- Blocked users filtered from all three sections

### Messages Tab
- **List view:** all mutual connections (blocked users hidden); unread dot indicator per conversation; last-message preview (truncated to 40 characters) and relative timestamp per row (added 11 May 2026)
- **Chat view:** real-time Firestore `onSnapshot` messages; smooth-scroll to latest; Enter key sends
- Audio notification: two-tone descending chime (D6 → A5) via Web Audio API when a new message arrives while not viewing that chat — respects user toggle
- Vibration: `navigator.vibrate` pattern when a message arrives — respects user toggle
- Block guard: sending is disabled if either party has blocked the other; contextual message shown
- Messaging locked if connection request is still pending (one-way request state)
- Conversation rows fall back to "Start a conversation" text when no messages exist yet

### Profile Tab
- Read view: mirrors the `PublicProfile` layout exactly — users see themselves as others see them
- Edit view: full form to update all profile fields (name, title, pronouns, role, location, bio, skills, achievements, LinkedIn, lookingFor, lookingForDetails, bringToTable, currentlyExploring, openTo)
- Photo upload: client-side canvas resize to max 200×200 px at 70% JPEG quality; Blob held in `photoBlob` state until save; uploaded to Firebase Storage at `avatars/{uid}.jpg`; download URL stored in Firestore `photoURL` (migrated from base64 on 11 May 2026)
- On save: profile document updated in Firestore AND all `users/{uid}/matches/{targetUid}` snapshot docs batch-updated with the latest name, role, location, bio, skills, photoURL, avatar, color, lookingFor, pronouns, title (added 11 May 2026)
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
- Poster content: Link-Ap wordmark, tagline, 4 benefit bullet cards, italic statement, value categories, CTA URL (`link-ap.online`)
- Actions: Save as PNG (data URL download), Share via WhatsApp (Web Share API with image file if supported, URL fallback)

### PWA
- `manifest.json`: standalone display, portrait orientation, theme/background colours, 8 icon sizes (72–512 px), 2 app shortcuts (Discover, Messages), categories: business/social/productivity
- Custom service worker: network-first fetch strategy, static asset pre-cache (`/`, `/index.html`, `/manifest.json`, `/icons/icon-192.png`, `/icons/icon-512.png`), offline fallback to `/index.html`
- Cache name: `link-ap-v1`; old caches cleaned on activate; `skipWaiting()` + `clients.claim()` for instant activation

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
On completion, `saveProfile()` constructs the full profile document and writes it to `users/{uid}` via `setDoc`. Assigns a random accent colour from `USER_COLORS`. Sets `linkedinVerified: true` only if the URL is valid AND the slug matches the user's first and last name (client-side). Profile photo at onboarding is set to `firebaseUser.photoURL` (Google account photo URL, if any); dedicated photo upload is only available post-onboarding in the Profile edit form.

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
| `lookingFor` | string[] | From `LOOKING_FOR_OPTIONS` |
| `lookingForDetails` | object | Keys match question keys from `LOOKING_FOR_QUESTIONS` |
| `achievements` | string[] | Parsed from comma-separated input |
| `bringToTable` | string | Free text pitch |
| `currentlyExploring` | string[] | Parsed from comma-separated input |
| `openTo` | string[] | From `OPEN_TO_OPTIONS` |
| `linkedinProfileUrl` | string | Normalised URL or empty string |
| `linkedinVerified` | boolean | Client-side name-match heuristic |
| `photoURL` | string | **Firebase Storage download URL** at `avatars/{uid}.jpg` (migrated from base64 on 11 May 2026); falls back to `firebaseUser.photoURL` (Google OAuth photo) or `""` |
| `avatar` | string | 1–2 initials from name |
| `color` | string | Random hex from `USER_COLORS` (assigned at onboarding, never changed) |
| `createdAt` | Timestamp | Firestore server timestamp |
| `termsAcceptedAt` | Timestamp | Firestore server timestamp |
| `deactivated` | boolean | Set to `true` on deactivation; absent on active accounts |

---

## 6. Authentication

**Providers supported:**
- Google OAuth (`signInWithPopup`, `select_account` prompt always shown)
- Email/password (`createUserWithEmailAndPassword`, `signInWithEmailAndPassword`)

**Sign-up gate:** Terms of Service checkbox must be checked before the sign-up button or Google button is active. Login path does not require re-checking but surfaces a "By signing in you are accepting our ToS" notice.

**Screen routing logic (in order):**
1. Splash screen shown until ~4.1 s timer completes (first load only)
2. `loading` → blank dark screen
3. `!firebaseUser` → `AuthScreen`
4. `!profile || profile.uid !== firebaseUser.uid` → `Onboarding`
5. Otherwise → `MainApp`

**Session persistence:** Handled entirely by Firebase Auth SDK; `onAuthStateChanged` is the sole source of truth. Auth handlers do not update app state directly — all state transitions flow from the listener.

**Initial tab on app load:** `MainApp` reads `?tab=` from the URL query string on mount; defaults to `"profile"` if the param is absent or unrecognised. Recognised values: `"discover"`, `"matches"`, `"messages"`, `"profile"`, `"settings"`.

---

## 7. Database & Storage Structure

### Firestore Collections

```
users/
  {uid}                            ← profile document (see Section 5)
  {uid}/matches/{targetUid}        ← snapshot of matched user's profile; synced on profile save via writeBatch
  {uid}/sent/{targetUid}           ← snapshot of target's profile + note + sentAt
  {uid}/received/{senderUid}       ← snapshot of sender's profile + note + sentAt
  {uid}/passed/{targetUid}         ← { passedAt: Timestamp } or { uid: string }
  {uid}/blocked/{targetUid}        ← snapshot of blocked user's profile
  {uid}/blockedBy/{blockerUid}     ← { blockedAt: Timestamp }

chats/
  {uid_a}_{uid_b}/                 ← chatId: two UIDs sorted alphabetically, joined with "_"
    messages/{msgId}               ← { text, from, createdAt }
```

### Firebase Storage

```
avatars/
  {uid}.jpg                        ← profile photo; JPEG, resized client-side to max 200×200 px at 70% quality
                                     upload path: ref(storage, `avatars/${uid}.jpg`)
                                     download URL stored in users/{uid}.photoURL
```

---

## 8. What Changed Since V0.2

All changes were made on **11 May 2026** and landed on `main` across four commits.

### a) Firebase Storage — Photo Upload Migration

**Before (V0.2):** Profile photos were resized client-side to 200×200 px and stored as a base64 data URL directly in the Firestore `photoURL` field. This caused Firestore documents to balloon in size, exceeded Firestore's recommended per-document limits for binary data, and added latency to every profile fetch.

**After (V0.3):**
- `firebase.js` now exports `storage` (via `getStorage`), activating Firebase Storage for the project.
- `App.js` imports `storage` from `./firebase` and `{ ref, uploadBytes, getDownloadURL }` from `firebase/storage`.
- `Profile` component holds a `photoBlob` state (a Blob of the resized JPEG) instead of a base64 string.
- `saveProfile()` in `Profile`: if `photoBlob` is set, uploads to `avatars/{uid}.jpg` using `uploadBytes`, retrieves the download URL via `getDownloadURL`, and stores the URL in `photoURL`. Existing download URLs (unchanged photos) are preserved as-is.
- `photoURL` in Firestore now always holds an HTTPS download URL from Firebase Storage (or a Google OAuth photo URL for users who haven't set a custom photo).

### b) Messages List — Last-Message Preview and Relative Timestamp

**Before (V0.2):** Each conversation row in the Messages list showed static "Tap to chat" subtext and no timestamp, providing no signal about conversation recency or content.

**After (V0.3):**
- `lastMessages` state added to `MainApp`: a `{ [uid]: { text, createdAt } }` map, one entry per mutual connection.
- `MainApp` subscribes to a Firestore `onSnapshot` on the last message of each match's chat (ordered by `createdAt`, limit 1). Each snapshot update writes to `lastMessages` via `setLastMessages(prev => ({ ...prev, [match.uid]: lastData }))`.
- `formatRelativeTime(ts)` helper added immediately before the `Messages` component. Converts a Firestore `Timestamp` to a human-readable string using the following ladder:
  - `< 60 min` → `"Xm ago"`
  - `< 24 h` → `"Xh ago"`
  - `< 48 h` → `"Yesterday"`
  - `< 168 h (7 days)` → short weekday name (e.g. `"Mon"`)
  - `else` → short date string (e.g. `"Apr 30"`)
- `Messages` component now accepts `lastMessages` as a prop. Each conversation row displays:
  - Last message text truncated to 40 characters (appended with `"..."` if longer), or `"Start a conversation"` if no messages exist yet.
  - Relative timestamp aligned right on the name row, shown only when `createdAt` is available.

### c) Profile Update Propagation to Match Snapshots

**Before (V0.2):** When a user edited their profile, only their own `users/{uid}` document was updated. Any `users/{otherUid}/matches/{uid}` snapshot docs held by their mutual connections retained stale data (old name, photo, role, etc.).

**After (V0.3):**
- After `setDoc(doc(db, "users", firebaseUser.uid), updated)` completes, `saveProfile()` fetches all docs in `users/{uid}/matches/` via `getDocs`.
- If any match docs exist, a `writeBatch` is used to `batch.update()` each `users/{matchDoc.id}/matches/{uid}` document with the following propagated fields: `name`, `role`, `location`, `bio`, `skills`, `photoURL`, `avatar`, `color`, `lookingFor`, `pronouns`, `title`.
- The batch is committed atomically. Matches now always see the current profile snapshot.

### d) CLAUDE.md Updated

CLAUDE.md was updated to document:
- `storage` export in `firebase.js` and the Storage import in `App.js`
- `photoBlob` state in `Profile`
- `lastMessages` state in `MainApp`
- `formatRelativeTime` helper
- Firebase Storage path `avatars/{uid}.jpg`
- Match snapshot propagation via `writeBatch`

---

## 9. Known Issues / Incomplete Features

### Resolved since V0.1
- ~~**Photo storage via base64 in Firestore**~~ — **Fixed 11 May 2026.** Photos now live in Firebase Storage.
- ~~**Stale match snapshots**~~ — **Fixed 11 May 2026.** `saveProfile` batch-updates all match snapshot docs.
- ~~**No last-message preview in Messages list**~~ — **Fixed 11 May 2026.** Preview and relative timestamp now shown per row.

### Critical
1. **No push notifications.** Audio and vibration only fire when the app is foregrounded. Background and lock-screen notifications require Firebase Cloud Messaging (FCM), which is not yet integrated.

### Moderate
2. **`seenUids` resets on page refresh.** Browsed profiles in the current session are forgotten on reload; passed profiles are still permanently filtered via Firestore, but unpassed profiles reappear at the top.

3. **Deactivation does not hide the user from active chat threads or existing match lists.** A deactivated user's profile snapshots remain in their connections' `matches/` subcollections.

4. **No cascading chat deletion on account delete.** The delete flow removes the user's own Firestore documents and Firebase Auth account, but does not delete `chats/` documents where that user was a participant.

5. **`blockedBy` users not filtered from Search results.** A user you've been blocked by can still find you via the Search modal and attempt to send a request (though the request would be one-directional since you'd never see it in Received).

6. **Passed profiles are unrecoverable** — no undo pass mechanism.

### Minor
7. **Version mismatch.** `package.json` has `"version": "0.1.0"` but Settings displays `"1.0.0 Beta"`.

8. **No read receipts or typing indicators** in chat.

9. **LinkedIn verification is client-side only.** The `linkedinVerified` flag is set by a name-slug heuristic at profile save time, with no server-side validation.

10. **`public/privacy.html` and `PrivacyPolicy.js` may diverge.** There are two separate implementations of the privacy policy — the static HTML file and the React component — with no mechanism to keep them in sync.

---

## 10. Code Quality Notes

### File Size and Structure
- `src/App.js`: **3,027 lines** — the entire application lives in a single file. This includes all constants, helper functions, all UI components, all Firebase interactions, and the root `App` component. There is no component folder structure.
- `src/firebase.js`: 18 lines — initialises the Firebase app and exports `db`, `auth`, and `storage`.
- `src/PrivacyPolicy.js`: separate component file for the privacy policy route (only exception to the single-file pattern).

### Inline Styles
All component styles are inline React style objects. `App.css` and `index.css` contain only body resets. This makes styles co-located with their components but creates significant verbosity; some components have 15–20 props of inline style per element.

### Hooks and Helpers Added in V0.3
- `formatRelativeTime(ts)` — standalone utility function defined at module scope before the `Messages` component.
- `photoBlob` state — `useState(null)` in `Profile`; holds a `Blob` between canvas resize and Firebase Storage upload.
- `lastMessages` state — `useState({})` in `MainApp`; accumulates per-conversation last-message data via reactive Firestore subscriptions.

### Constants
- `COLORS` — 9-key object; single source of truth for all UI colours.
- `USER_COLORS` — 6-item array of hex strings for user accent colours.
- `LOOKING_FOR_OPTIONS`, `LOOKING_FOR_QUESTIONS`, `OPEN_TO_OPTIONS`, `TITLE_OPTIONS`, `PRONOUN_OPTIONS` — all defined at module scope.

### Patterns
- No TypeScript; no prop-types.
- No custom hooks beyond `useState`, `useEffect`, and `useRef`.
- All Firebase reads and writes are co-located with the component that triggers them — no service layer.
- ESLint dependency warnings in `useEffect` hooks are suppressed with `// eslint-disable-line` in several places rather than correcting the dependency arrays.

---

## 11. Recommended Next Steps

Listed in priority order.

### 1. Implement Push Notifications via Firebase Cloud Messaging (FCM) ← Top Priority
This is the most impactful missing feature. Currently, a user who does not have the app open in a foreground tab receives no notification when a message or connection request arrives. FCM would enable background push notifications on both Android (as a PWA install) and desktop browsers. Implementation involves: registering a service worker messaging handler, requesting notification permission, storing FCM tokens per user in Firestore, and triggering sends from a Cloud Function on new message/request writes.

### 2. Fix Cascading Deletion on Account Delete
When a user deletes their account, `chats/` documents they participated in are left orphaned. Additionally, the `matches/` and `received/` subcollections of other users still contain snapshots pointing to the deleted user. A Cloud Function triggered on user deletion should clean up: all `chats/{chatId}` where the user is a participant, and `users/{otherUid}/matches/{deletedUid}`, `users/{otherUid}/received/{deletedUid}`, etc.

### 3. Filter `blockedBy` Users from Search Results
A user who has been blocked by another user can still discover them via Search and send a connection request that will never be seen. The Search query should cross-reference the current user's `blockedBy` subcollection and exclude those UIDs from results — mirroring the filtering already applied in Discover, Connections, and Messages.

### 4. Persist `seenUids` Across Sessions
Currently, browsed (but not passed) profiles reappear at the top of the Discover queue after a page refresh. Writing seen UIDs to a `users/{uid}/seen/{targetUid}` subcollection (similar to `passed`) would make the queue stateful across sessions, preventing users from repeatedly encountering the same profiles they've already viewed.

### 5. Refactor App.js into Multiple Files
At 3,027 lines, `App.js` is difficult to navigate and maintain. Splitting into component files (e.g. `Discover.js`, `Messages.js`, `Profile.js`, `Onboarding.js`, `Settings.js`, `Matches.js`, `PublicProfile.js`, `ShareModal.js`, `AuthScreen.js`, `constants.js`) would dramatically improve developer experience with no user-facing impact. This is a prerequisite for adding TypeScript or more rigorous prop validation.
