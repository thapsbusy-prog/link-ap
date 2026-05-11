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
| `lookingForDetails` | object | Keys match question keys from LOOKING_FOR_QUESTIONS |
| `achievements` | string[] | Parsed from comma-separated input |
| `bringToTable` | string | Free text pitch |
| `currentlyExploring` | string[] | Parsed from comma-separated input |
| `openTo` | string[] | From OPEN_TO_OPTIONS |
| `linkedinProfileUrl` | string | Normalised URL or empty string |
| `linkedinVerified` | boolean | Client-side name-match heuristic |
| `photoURL` | string | Firebase Storage download URL (migrated from base64 on 11 May 2026) |
| `avatar` | string | 1–2 initials from name |
| `color` | string | Random hex from USER_COLORS (assigned at onboarding, never changed) |
| `createdAt` | Timestamp | Firestore server timestamp |
| `termsAcceptedAt` | Timestamp | Firestore server timestamp |
| `deactivated` | boolean | Set to `true` on deactivation; absent on active accounts |

---

## 6. Authentication

**Providers supported:**
- Google OAuth (`signInWithPopup`, `select_account` prompt always shown)
- Email/password (`createUserWithEmailAndPassword`, `signInWithEmailAndPassword`)

**Sign-up gate:** Terms of Service checkbox must be checked before the sign-up button or Google button is active.

**Screen routing logic (in order):**
1. Splash screen shown until 4.1 s timer completes (first load only)
2. `loading` → blank dark screen
3. `!firebaseUser` → `AuthScreen`
4. `!profile || profile.uid !== firebaseUser.uid` → `Onboarding`
5. Otherwise → `MainApp`

---

## 7. Database Structure

```
users/
  {uid}                          ← profile document
  {uid}/matches/{targetUid}      ← snapshot of matched user's profile
  {uid}/sent/{targetUid}         ← snapshot of target's profile + note + sentAt
  {uid}/received/{senderUid}     ← snapshot of sender's profile + note + sentAt
  {uid}/passed/{targetUid}       ← { passedAt: Timestamp } or { uid: string }
  {uid}/blocked/{targetUid}      ← snapshot of blocked user's profile
  {uid}/blockedBy/{blockerUid}   ← { blockedAt: Timestamp }

chats/
  {uid_a}_{uid_b}/
    messages/{msgId}             ← { text, from, createdAt }

storage/
  avatars/{uid}.jpg              ← profile photo (migrated 11 May 2026)
```

---

## 8. Known Issues / Incomplete Features

### Critical
1. ~~**Photo storage via base64 in Firestore**~~ — **FIXED 11 May 2026.** Photos now upload to Firebase Storage at `avatars/{uid}.jpg`. Download URL stored in Firestore.

2. **Search prefix matching** — confirmed working in testing; partial name search returns results correctly.

### Moderate
3. ~~**Stale match snapshots**~~ — **FIXED 11 May 2026.** `saveProfile` now batch-updates all matched users' snapshot docs when a profile is edited.

4. **`seenUids` resets on page refresh** — browsed profiles reset on refresh; passed profiles still filtered via Firestore.

5. **Deactivation doesn't hide user from active chats and match lists.**

6. **No cascading chat deletion** on account delete.

7. **`blockedBy` users not filtered from Search results.**

8. **Passed profiles are unrecoverable** — no undo pass mechanism.

### Minor
9. **Version mismatch** — `package.json` has `"version": "0.1.0"` but Settings displays "1.0.0 Beta".

10. **No push notifications** — audio/vibration only fires when app is foregrounded.

11. ~~**No last-message preview in Messages list**~~ — **FIXED 11 May 2026.** Last message text and relative timestamp now shown per conversation row.

12. **No read receipts or typing indicators** in chat.

13. **LinkedIn verification is client-side only.**

---

## 9. Recommended Next Steps

1. ~~Migrate photo storage to Firebase Storage~~ — **Done**
2. ~~Add last-message preview to Messages list~~ — **Done**
3. ~~Propagate profile updates to match snapshots~~ — **Done**
4. **Implement push notifications via FCM** — remaining top priority
5. **Fix cascading deletion** on account delete to include chats and blocked subcollections
