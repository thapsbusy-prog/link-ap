# Link-Ap — Status Report v0.6
**Generated:** 2026-05-16  
**Branch:** main  
**Scope:** Full re-audit of all source files. Every bug status verified against actual code. All line numbers current.  
**Key delta since v0.5:** Firestore rules for `blocked`/`blockedBy` deployed; FCM token auto-refresh added; FCM notifications wired for connection request and accept events.

---

## A. Feature Inventory

| Feature | Component(s) | Status | Notes |
|---------|-------------|--------|-------|
| Auth — Google SSO | AuthScreen.js | ✅ Complete | `signInWithPopup` + GoogleAuthProvider |
| Auth — Email / Password | AuthScreen.js | ✅ Complete | create + sign-in |
| Auth — Terms gate (signup only) | AuthScreen.js | ✅ Complete | Checkbox required; login shows inline notice |
| Forgot password (login) | AuthScreen.js | ❌ Missing | **Still Present** — no "Forgot password" link on the login form |
| Splash screen | App.js (`SplashScreen`) | ✅ Complete | 3.6 s display + 0.5 s fade |
| Error boundary | App.js (`ErrorBoundary`) | ✅ Complete | Catches render errors |
| Onboarding — 5-step flow | Onboarding.js | ✅ Complete | See Section C |
| Profile — view | Profile.js | ✅ Complete | Fields rendered; `title` and `pronouns` still absent from own-profile view |
| Profile — edit | Profile.js | ✅ Complete | All fields editable |
| Profile — photo upload | Profile.js | ✅ Complete | Canvas resize 200 px → Storage `avatars/{uid}.jpg` |
| Profile — share / invite poster | Discover.js (`ShareModal`) | ✅ Complete | Canvas poster + Web Share API + WhatsApp fallback |
| LinkedIn URL validation + badge | Profile.js, Onboarding.js | ✅ Complete | `validateLinkedIn` + `linkedinNameMatches` |
| `title` field (Dr., Prof., etc.) | Profile.js, Onboarding.js | 🔧 Partial | **Still Present** — stored and editable; never rendered in any profile header |
| `pronouns` field | Profile.js, Discover.js | 🔧 Partial | **Still Present** — shown in PublicProfile and Discover card; absent from own-profile view |
| Discover feed — intent-filtered | Discover.js, App.js | ✅ Complete | `complementMap`; falls back to unfiltered if no intent matches |
| Discover feed — pagination | App.js (`loadMoreUsers`) | ✅ Complete | 30 per page, `startAfter` cursor |
| Discover — Pass | Discover.js | ✅ Complete | Writes to `users/{uid}/passed/{uid}` |
| Discover — Connect with note | Discover.js (`ConnectNoteModal`) | ✅ Complete | 10-char min, 300-char max; bilateral Firestore write |
| Connection requests — receive | Matches.js | ✅ Complete | Shows sender note with accent border |
| Connection requests — accept | App.js (`handleAcceptRequest`) | ✅ Complete | Bilateral match; FCM notification now sent to requester |
| Connection requests — decline | App.js (`handleDeclineRequest`) | ✅ Complete | Adds to `passed` |
| Pending sent requests list | Matches.js | ✅ Complete | Note preview shown |
| Mutual matches list | Matches.js | ✅ Complete | Tap → chat; `✕ remove` per card |
| Remove connection | App.js (`handleDisconnect`), Matches.js, Discover.js | ✅ Complete | Bilateral delete; local state updated; active chat cleared |
| Real-time messaging | Messages.js | ✅ Complete | `onSnapshot` per chat; Enter key sends |
| Messages — blocked state | Messages.js | ✅ Complete | Separate copy for iBlockedThem vs theyBlockedMe |
| Messages — pending state | Messages.js | 🔧 Partial | **Still Present** — `isPending` guard is dead code (see Bug 10) |
| Message preview + timestamp | App.js, Messages.js | ✅ Complete | 40-char truncate; `formatRelativeTime` |
| Unread indicators | App.js, Messages.js | ✅ Complete | Nav badge + dot on avatar |
| Block / Unblock user | App.js, Settings.js, Discover.js | ✅ Complete | **Fixed** — Firestore rules for `blocked`/`blockedBy` now deployed (was Bug 2) |
| Block list (Settings) | Settings.js | ✅ Complete | **Fixed** — reads and renders correctly now that rules are in place |
| Search by name | App.js (`SearchModal`) | 🔧 Partial | Permission error fixed (v0.5 Bug 11); but prefix range query still broken — returns exact matches only (Bug 1, still present) |
| FCM push notifications — messages | Messages.js | 🔧 Partial | Code correct; FCM 401 status unverifiable from code (Bug 3) |
| FCM push notifications — connection request | App.js (`handleSendRequestWithNote`) | ✅ Complete | **New in v0.6** — recipient notified on request sent |
| FCM push notifications — accept | App.js (`handleAcceptRequest`) | ✅ Complete | **New in v0.6** — requester notified on accept |
| FCM token auto-refresh | App.js | ✅ Complete | **New in v0.6** — refreshed on mount if permission granted |
| FCM — in-app foreground | App.js (`onMessage`) | ✅ Complete | Toast + beep + vibrate |
| FCM — background (SW) | public/service-worker.js | ✅ Complete | `onBackgroundMessage` registered |
| PWA — installable | manifest.json, service-worker.js | ✅ Complete | Offline fallback; network-first strategy |
| Push notifications — enable flow | Settings.js | ✅ Complete | Requests permission; stores `fcmToken` in Firestore |
| Notification sound toggle | Settings.js | ✅ Complete | Persisted in `localStorage` |
| Notification vibrate toggle | Settings.js | ✅ Complete | Persisted in `localStorage` |
| Account — Deactivate | Settings.js (`handleDeactivate`) | ✅ Complete | Sets `deactivated: true`; signs out |
| Account — Delete | Settings.js (`handleDelete`) | ✅ Complete | Full bilateral Firestore cleanup; deletes auth account |
| Account — Password reset | Settings.js | ✅ Complete | Email-only users; `sendPasswordResetEmail` |
| Sign out | Settings.js | ✅ Complete | |
| Privacy Policy route | App.js | ✅ Complete | `/privacy` path |
| Terms of Service modal | shared.js (`TermsContent`), AuthScreen.js, Settings.js | ✅ Complete | Full terms text inline |

---

## B. Firebase Integration Status

### Auth Methods
| Method | Status |
|--------|--------|
| Google OAuth (popup) | ✅ Wired — `signInWithPopup`, `GoogleAuthProvider` |
| Email + Password | ✅ Wired — create + sign-in |
| Password reset | ✅ Wired — `sendPasswordResetEmail` (Settings only; no link on login form) |
| Phone / SMS | ❌ Not implemented |
| Apple Sign-In | ❌ Not implemented |

### Firestore Collections

**`users/{uid}`** (top-level profile document)

| Field | Type | Set by |
|-------|------|--------|
| uid | string | Onboarding |
| title | string | Onboarding / Profile edit |
| firstName | string | Onboarding |
| lastName | string | Onboarding |
| name | string | Onboarding / Profile edit |
| pronouns | string | Onboarding / Profile edit |
| role | string | Onboarding / Profile edit |
| location | string | Onboarding / Profile edit |
| bio | string | Onboarding / Profile edit |
| skills | string[] | Onboarding / Profile edit (max 5) |
| lookingFor | string[] | Onboarding / Profile edit |
| achievements | string[] | Onboarding / Profile edit |
| bringToTable | string | Onboarding / Profile edit |
| currentlyExploring | string[] | Onboarding / Profile edit |
| openTo | string[] | Onboarding / Profile edit |
| lookingForDetails | map | Onboarding / Profile edit |
| linkedinProfileUrl | string | Onboarding / Profile edit |
| linkedinVerified | boolean | Onboarding / Profile edit |
| avatar | string | Computed initials (2 chars) |
| color | string | Random from USER_COLORS at Onboarding |
| nameLower | string | For search |
| lastNameLower | string | For search (last word of name) |
| photoURL | string | Storage download URL or Google photoURL |
| createdAt | Timestamp | serverTimestamp() at Onboarding |
| termsAcceptedAt | Timestamp | serverTimestamp() at Onboarding |
| fcmToken | string | Set by Settings "Enable Notifications" and auto-refreshed on mount |
| deactivated | boolean | Set by Settings "Deactivate Account" |

**`users/{uid}/matches/{matchedUid}`** — snapshot of matched user's profile  
Fields synced on profile save (`Profile.js:97–109`): `name`, `role`, `location`, `bio`, `skills`, `photoURL`, `avatar`, `color`, `lookingFor`, `pronouns`, `title`  
Full document written on `handleAcceptRequest`: entire sender/receiver `user` object

**`users/{uid}/sent/{targetUid}`** — outgoing connection request  
Fields: full target user object + `note` (string) + `sentAt` (Timestamp)

**`users/{uid}/received/{senderUid}`** — incoming connection request  
Fields: full sender `user` object + `note` (string) + `sentAt` (Timestamp)

**`users/{uid}/passed/{passedUid}`** — profiles passed or declined  
Fields: `{ passedAt: Timestamp }` when calling `handlePass`; `{ uid: string }` when calling `handleDeclineRequest` — **inconsistent** (see Bug 15)

**`users/{uid}/blocked/{blockedUid}`** — full user object of blocked person  
Fields: full target user object (from `handleBlock`)

**`users/{uid}/blockedBy/{blockerUid}`** — who blocked this user  
Fields: `{ blockedAt: Timestamp }`

**`chats/{chatId}/messages/{msgId}`** — real-time chat messages  
`chatId` = `[uid1, uid2].sort().join("_")`  
Fields: `text` (string), `from` (uid string), `createdAt` (Timestamp)

### Storage Paths
| Path | Purpose |
|------|---------|
| `avatars/{uid}.jpg` | Profile photo (JPEG, max 200 px, quality 0.7) |

### Firestore Security Rules Audit

| Path | Rule | Assessment |
|------|------|------------|
| `users/{uid}` get | `isAuth() && (isOwner \|\| !deactivated)` | ✅ Correct |
| `users/{uid}` list | `isAuth()` | ✅ Correct (added v0.5 for search) |
| `users/{uid}` create/update | `isAuth() && isOwner` | ✅ Correct |
| `users/{uid}` delete | `isAuth() && isOwner` | ✅ Correct |
| `users/{uid}/matches/{matchedUid}` | `isOwner(uid) \|\| isOwner(matchedUid)` | ✅ Correct — bilateral writes |
| `users/{uid}/sent/{targetId}` | `isOwner(uid) \|\| isOwner(targetId)` | ✅ Correct |
| `users/{uid}/received/{senderId}` | `isOwner(uid) \|\| isOwner(senderId)` | ✅ Correct |
| `users/{uid}/passed/{passedUid}` | `isOwner(uid)` | ✅ Correct — private |
| `users/{uid}/blocked/{blockedUid}` | `read: isOwner(uid); write: isOwner(uid) \|\| isOwner(blockedUid)` | ✅ **Fixed in v0.6** (was ❌ DENY in v0.5) |
| `users/{uid}/blockedBy/{blockerId}` | `read: isOwner(uid); write: isOwner(uid) \|\| isOwner(blockerId)` | ✅ **Fixed in v0.6** (was ❌ DENY in v0.5) |
| `chats/{chatId}/messages/{msgId}` read | `isParticipant()` | ✅ Correct |
| `chats/{chatId}/messages/{msgId}` create | `isParticipant() && from == auth.uid` | ✅ Correct |
| `chats/{chatId}/messages/{msgId}` delete | No rule | ⚠️ Messages cannot be deleted (acceptable if by design) |
| `chats/{chatId}` root document | No rule | ⚠️ App never reads root chat doc; no impact |

**Remaining rules risk:** `chatId.split('_')` in `isParticipant()` — Firebase UIDs don't normally contain underscores so this is LOW risk in practice.

**Latent gap:** The `received` rule (`isOwner(senderId)`) allows a user to write to any other user's `received` subcollection, even if that user has blocked them. Firestore rules cannot enforce the app-level block relationship without cross-document reads, which are not supported in security rules. This means a blocked sender can still write a connection request to the blocker's `received`. See Bug 12.

---

## C. Onboarding Flow

**Step 0 — "Who are you?"** (`Onboarding.js:73–98`)
- Fields: `title` (optional Select), `firstName` (required), `lastName` (required), `pronouns` (optional Select), `role` (required), `location` (required), `linkedin` (optional, validated on input)
- Validation: `firstName && lastName && role && location && (!linkedin || validateLinkedIn(linkedin))`
- LinkedIn label says optional; `validateLinkedIn` only checks for `"linkedin.com/in/"` substring

**Step 1 — "Your story"** (`Onboarding.js:99–116`)
- Fields: `bio` (TextArea, 20-word hard limit enforced per keystroke), `skills` (SkillsInput max 5, 3 words each), `achievements` (comma-separated, optional)
- Validation: `bio && skills.length > 0`

**Step 2 — "What are you looking for?"** (`Onboarding.js:117–135`)
- Multi-select from `LOOKING_FOR_OPTIONS` in shared.js (8 options)
- Validation: `lookingFor.length > 0`

**Step 3 — "Tell us more"** (`Onboarding.js:136–168`)
- Dynamic questions from `LOOKING_FOR_QUESTIONS` keyed by `lookingFor` selections
- Intents with sub-questions: "A Job" (5 Qs), "Freelance Work" (4 Qs), "Clients" (4 Qs), "Co-founder" (4 Qs), "Investor" (5 Qs), "Mentor" (3 Qs), "Collaboration" (3 Qs)
- **"Startup to join"** has no entry in `LOOKING_FOR_QUESTIONS` → step shows "No extra details needed"
- Validation: always `true` (all optional)
- Answers stored in `lookingForDetails{}` map

**Step 4 — "What I bring to the table"** (`Onboarding.js:169–218`)
- Fields: `bringToTable` (free textarea), `currentlyExploring` (comma-separated, optional), `openTo[]` (multi-select, optional)
- Prompt adapts via `getBringToTablePrompt()` based on `lookingFor`
- Validation: always `true`

**Firestore write on complete** (`Onboarding.js:31–69`) — single `setDoc` to `users/{uid}` with all fields + `uid`, `color` (random), `avatar` (initials), `nameLower`, `lastNameLower`, `photoURL` (Google photoURL or `""`), `createdAt`, `termsAcceptedAt`.

**Gaps / issues:**
- Email users complete onboarding with no profile photo and no prompt to add one; must navigate to Profile edit
- `title` is stored but never rendered anywhere in any profile view
- Step 4 is always valid — users can complete onboarding with entirely empty optional fields, reducing profile richness

---

## D. Profile & Discovery

### Profile Fields: Stored vs Displayed

| Field | Stored | Own Profile View | PublicProfile | Discover Card |
|-------|--------|-----------------|---------------|---------------|
| name | ✅ | ✅ | ✅ | ✅ |
| title | ✅ | ❌ | ❌ | ❌ |
| role | ✅ | ✅ | ✅ | ✅ |
| pronouns | ✅ | ❌ | ✅ | ✅ |
| location | ✅ | ✅ | ✅ | ✅ |
| bio | ✅ | ✅ | ✅ | ✅ |
| skills | ✅ | ✅ | ✅ | ✅ |
| lookingFor | ✅ | ✅ (Q&A block) | ✅ (Q&A block) | ✅ (tags) |
| lookingForDetails | ✅ | ✅ (Q&A block) | ✅ (Q&A block) | ❌ |
| achievements | ✅ | ✅ | ✅ | ✅ |
| bringToTable | ✅ | ✅ | ✅ | ❌ |
| currentlyExploring | ✅ | ✅ | ✅ | ❌ |
| openTo | ✅ | ✅ | ✅ | ❌ |
| linkedinProfileUrl | ✅ | ✅ (badge if verified) | ✅ (badge if verified) | ❌ |
| linkedinVerified | ✅ | ✅ (controls badge) | ✅ (controls badge) | ❌ |
| photoURL | ✅ | ✅ | ✅ | ✅ |
| color | ✅ | ✅ | ✅ | ✅ |
| fcmToken | ✅ | ❌ | ❌ | ❌ |
| deactivated | ✅ | ❌ | ❌ | ❌ |

### Discovery Logic

1. **Server fetch** (`App.js:78–98`):  
   - Query: `where("deactivated", "!=", true)` + `orderBy("deactivated")` + `orderBy("createdAt")` + `limit(30)`  
   - Users without a `deactivated` field (null/undefined) sort before `false` in Firestore's ordering, so initial ordering is non-deterministic for existing users who predate the `deactivated` field.

2. **Client-side exclusion** (`App.js:304–306`):  
   - Excludes: `matches`, `sent`, `passed`, `received`, `blocked` (own blocked list)  
   - **Does NOT exclude `blockedByUids`** — users who blocked you still appear in your Discover feed (Bug 12)

3. **Intent filtering** (`App.js:309–333`):  
   - Skipped if `user.lookingFor` is empty  
   - Uses `complementMap` — 8 keys; falls back to full `unmatched` if no results after filtering

4. **Session deduplication** (`seenUids` Set):  
   - Tracks seen profiles this session; cleared on refresh  
   - Separate from Firestore-persisted `passed`

5. **Auto-load trigger** (`Discover.js:485–488`):  
   - Fires when `remaining.length < 5` and `hasMore && !loadingMore`

### In-Memory vs Firestore-Persisted State

| State | Location | Persisted |
|-------|----------|-----------|
| `allUsers` | `MainApp` useState | No — rebuilt on page load |
| `seenUids` | `MainApp` useState | No — reset on refresh |
| `matches` | `MainApp` useState | Yes — Firestore `onSnapshot` |
| `sent` | `MainApp` useState | Yes — Firestore `onSnapshot` |
| `received` | `MainApp` useState | Yes — Firestore `onSnapshot` |
| `passed` | `MainApp` useState | Yes — Firestore `onSnapshot` |
| `blocked` | `MainApp` useState | Yes — Firestore `onSnapshot` |
| `blockedByUids` | `MainApp` useState | Yes — Firestore `onSnapshot` |
| `lastMessages` | `MainApp` useState | No — derived from chat `onSnapshot` |
| `unreadChats` | `MainApp` useState | No — reset on refresh |

---

## E. Code Health

### Line Count per File

| File | v0.5 Lines | v0.6 Lines | Delta |
|------|-----------|-----------|-------|
| src/App.js | 683 | 725 | +42 (FCM notify additions) |
| src/Discover.js | 614 | 614 | — |
| src/Profile.js | 435 | 434 | -1 |
| src/Settings.js | 393 | 393 | — |
| src/shared.js | 330 | 330 | — |
| src/Onboarding.js | 277 | 277 | — |
| src/Messages.js | 207 | 207 | — |
| src/AuthScreen.js | 183 | 183 | — |
| src/Matches.js | 172 | 172 | — |
| src/firebase.js | 37 | 37 | — |
| api/notify.js | 52 | 52 | — |

### Hook Counts in App.js

| Hook | Count | Notes |
|------|-------|-------|
| `useState` | 22 total | 18 in `MainApp`, 4 in `App` root — unchanged from v0.5 |
| `useEffect` | 13 total | 12 in `MainApp` (+1 FCM refresh vs v0.5), 1 in `App` root |
| `useRef` | 5 total | `lastDocRef`, `hasMoreRef`, `loadingMoreRef`, `tabRef`, `activeChatRef` — unchanged |

### Hardcoded Hex Values Not in COLORS

All v0.5 hardcoded values are **still present** — none were consolidated into COLORS.

| Value | File | Line | Should Be |
|-------|------|------|-----------|
| `"#1D4ED8"` | Messages.js | 161 | `COLORS.chatBlue` (new) |
| `"#F5A623"` | Messages.js | 91 | `COLORS.accent` |
| `"#16161F"` | Discover.js (PublicProfile) | 25 | New constant |
| `"#16161F"` | Profile.js | 294 | Same new constant |
| `"#1A2E4A"` | Profile.js | 337; Discover.js | New constant (skills bg) |
| `"#1A2A4A"` | Profile.js | 383 | New constant (achievement icon bg) |
| `"#2A1A00"` | Profile.js | 410; Discover.js | New constant (exploring tag bg) |
| `"#0A2015"` | Profile.js | 415; Discover.js | New constant (openTo tag bg) |
| `"#2D1F00"` | Profile.js; Discover.js | multiple | New constant (Q&A badge bg) |
| `"#6B4A00"` | Profile.js; Discover.js | multiple | New constant (Q&A badge border) |
| `"#15532E"` | Discover.js | 44 | New constant (Investor badge border) |
| `"#0A0A0F"` | App.js (`SplashScreen`) | 635 | `COLORS.bg` |

### eslint-disable Suppressions

| File | Line | Suppressed Rule | Justification |
|------|------|-----------------|---------------|
| App.js | 100 | react-hooks/exhaustive-deps | `loadMoreUsers` intentionally called once |
| App.js | 110 | react-hooks/exhaustive-deps | FCM token refresh once on mount |
| App.js | 133 | react-hooks/exhaustive-deps | `onMessage` listener; re-register on deps would break |
| App.js | 160 | react-hooks/exhaustive-deps | Stale-closure refs for `tabRef`/`activeChatRef` |
| Profile.js | 10 | react-hooks/exhaustive-deps | `editTrigger` counter pattern |
| Discover.js | 324 | react-hooks/exhaustive-deps | `drawInvitePoster` called once on mount |
| Discover.js | 488 | react-hooks/exhaustive-deps | Load-more effect deps intentionally limited |

All suppressions appear intentional and justified.

### console.warn / console.error Calls

| File | Line | Call | Condition |
|------|------|------|-----------|
| App.js | 94 | `console.error("Failed to load users:", e)` | `loadMoreUsers` catch |
| App.js | 461 | `console.error("[Search] query error:", e)` | SearchModal search catch |
| App.js | 657 | `console.error("ErrorBoundary caught:", error, info)` | `componentDidCatch` |
| Messages.js | 60 | `console.warn("FCM notify error:", e)` | FCM notify in `send()` |
| firebase.js | 31 | `console.warn("FCM token error:", err)` | `getFCMToken` catch |
| Settings.js | 281 | `console.warn("FCM error:", err)` | Enable notifications catch |
| api/notify.js | 49 | `console.error("FCM send error:", err)` | Server-side FCM send catch |

**New in v0.6 — silent FCM errors:** The two new FCM notify calls at `handleSendRequestWithNote` (App.js:226–241) and `handleAcceptRequest` (App.js:259–274) both use empty `catch {}` with no logging. Messages.js's equivalent call uses `console.warn`. This is inconsistent and makes FCM failure invisible for connection events.

### Performance Concerns

1. **N chat listeners re-registered on every match change** (`App.js:135–160`): `useEffect` depends on `[matches, firebaseUser.uid]`. Every Firestore change to `matches` (incoming message, new connection) causes all N chat listeners to tear down and recreate simultaneously. A user with 20 matches registers 20 new listeners for every incoming message. Still present from v0.5.

2. **O(N) re-filter on every Discover advance** (`Discover.js`): `advance()` calls `setSeenUids` on every pass/connect, causing the full Discover component to re-render and re-filter `remaining`. For large `allUsers` arrays this is O(N) per swipe.

3. **`writeBatch` profile propagation without batch size guard** (`Profile.js:94–113`): No check against the 500-write Firestore batch limit. Irrelevant at current scale.

---

## F. Routing & Navigation

### App Root Screen Decision Tree

```
App root
├── window.location.pathname === "/privacy"
│   └── <PrivacyPolicy />
├── !splashDone
│   └── <SplashScreen onDone={() => setSplashDone(true)} />  (4.1 s total)
├── loading (firebaseUser === undefined)
│   └── blank <div style={{ background: COLORS.bg }} />
├── !firebaseUser (null — signed out)
│   └── <AuthScreen />
│       ├── mode: "login"  — email + password + Google
│       └── mode: "signup" — email + password + Google (terms required)
├── !profile || profile.uid !== firebaseUser.uid
│   └── <Onboarding firebaseUser onComplete={setProfile} />  (5 steps)
└── else
    └── <MainApp user={profile} firebaseUser onProfileUpdate={setProfile} />
```

### MainApp Tab System

Default tab: `"profile"` (unless `?tab=` URL param is one of the 5 valid values)  
Valid URL tabs: `discover`, `matches`, `messages`, `profile`, `settings`

```
MainApp
├── tab === "discover"    → <Discover />
│   └── connectTarget set → <ConnectNoteModal /> (z=50)
├── tab === "matches"     → <Matches />
│   └── disconnectTarget  → disconnect confirm modal (z=50)
├── tab === "messages" && !activeChat → <Messages /> (conversation list)
├── tab === "messages" && activeChat  → <Messages /> in fixed overlay (z=20)
├── tab === "profile"     → <Profile />
│   └── showShare         → <ShareModal /> (z=50)
└── tab === "settings"    → <Settings />
    ├── showBlockList     → block list view (replaces page content)
    ├── showDeactivateConfirm → modal (z=50)
    ├── showDeleteConfirm     → modal (z=50)
    └── showTerms             → bottom sheet (z=50)

Global overlays (any tab):
├── viewingProfile → <PublicProfile /> (z=40)
│   └── showDisconnectConfirm → modal (z=50)
├── showSearch    → <SearchModal /> (z=40)
│   └── target set → connect note sub-view
└── notification  → toast (position: fixed, z=999)
```

### Manifest Shortcuts
- `/?tab=discover` — "Discover"
- `/?tab=messages` — "Messages"

---

## G. Known Bugs & Issues

### v0.5 Bugs — Status in v0.6

---

#### Bug 1 — HIGH | Search prefix range query broken — **STILL PRESENT**
**Location:** App.js:441–442 (`SearchModal` useEffect)  
**Verification:**
```js
const end_ = t_ + "";      // string concatenation with "" → equals t_ exactly
const endCap_ = tCap + ""; // same — equals tCap exactly
```
`where('nameLower', '>=', t_)` AND `where('nameLower', '<=', end_)` is a Firestore **equality** match, not a prefix range. Searching "tha" only returns users whose `nameLower` equals exactly "tha". "thapelo" is never found.  
**Fix:** Change to `const end_ = t_ + "";` and same for `endCap_`. The `` Unicode ceiling character makes it a proper startsWith prefix range.

---

#### Bug 2 — HIGH | Firestore rules missing for `blocked` and `blockedBy` — **FIXED ✅**
**Status:** `firestore.rules` now contains proper `match /blocked/{blockedUid}` and `match /blockedBy/{blockerId}` blocks with correct read/write rules. Block and unblock operations succeed. The block list in Settings reads correctly. Fixed in v0.6 (commit `acd25d9`).

---

#### Bug 3 — HIGH | FCM push notifications: connection events missing / 401 unresolved — **PARTIALLY FIXED**
**What changed:**
- FCM token is now auto-refreshed on mount (`App.js:102–110`) when permission is granted
- Connection request triggers FCM notify to recipient (`App.js:226–241`)
- Connection accept triggers FCM notify to requester (`App.js:259–274`)

**Still unknown from code inspection:** Whether the Vercel env vars (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`) are correctly set. The `api/notify.js` implementation is structurally correct. If the 401 was an env var issue, it is now either fixed (if vars were set) or still present (if not). Cannot verify from code alone — requires checking Vercel function logs.  
**New concern:** The two new FCM notify calls in connection handlers use empty `catch {}` with no logging, making any failure completely invisible.

---

#### Bug 4 — MEDIUM | N chat listeners torn down and rebuilt on every match change — **STILL PRESENT**
**Location:** App.js:135–160  
**Verification:** `useEffect` depends on `[matches, firebaseUser.uid]`. Every `onSnapshot` update to `matches` (triggered by any incoming message, since messages update `lastMessages` which is in a separate effect — actually it's the `matches` onSnapshot at line 112–117 that re-fires only on match additions/removals). On re-inspection: the chat listener `useEffect` depends on `[matches]`, not `[lastMessages]`. The `matches` snapshot fires when a match doc is added or removed, which is infrequent. However, any match addition/removal still causes all N listeners to be re-registered simultaneously rather than a targeted diff. The performance impact is lower than described in v0.5 but the correctness concern remains.

---

#### Bug 5 — MEDIUM | `title` field stored but never displayed — **STILL PRESENT**
**Location:** Profile.js (view section ~line 300); Discover.js (`PublicProfile` ~line 32)  
**Verification:** Profile.js view renders `{user.name}` at line 300 — no title prefix. PublicProfile renders `{profileUser.name}` at Discover.js line 32 — no title prefix. The `title` field is stored at Onboarding.js:39, edited at Profile.js:73, and propagated to match docs at Profile.js:108. It is never displayed anywhere.  
**Fix:** In both locations, replace `{user.name}` / `{profileUser.name}` with `{[user.title, user.name].filter(Boolean).join(" ")}`.

---

#### Bug 6 — MEDIUM | `handleBlock` and `handleUnblock` have no error handling — **STILL PRESENT (lower impact)**
**Location:** App.js:199–210  
**Verification:** Both `async` functions use `await Promise.all(...)` with no `try/catch`. Now that the Firestore rules are fixed (Bug 2), writes will normally succeed — but network errors or rule violations still propagate uncaught. No toast or feedback is shown on failure.  
**Fix:** Wrap both in `try/catch`; call `showNotif(...)` on error.

---

#### Bug 7 — LOW | `#1D4ED8` hardcoded for sent message bubble — **STILL PRESENT**
**Location:** Messages.js:161  
**Verification:** `background: msg.from === firebaseUser.uid ? "#1D4ED8" : COLORS.card` — blue not in COLORS.  
**Fix:** Add `chatBlue: "#1D4ED8"` to COLORS in shared.js and replace.

---

#### Bug 8 — LOW | `#F5A623` hardcoded for unread dot — **STILL PRESENT**
**Location:** Messages.js:91  
**Verification:** `background: "#F5A623"` instead of `COLORS.accent`.  
**Fix:** Replace with `{COLORS.accent}`.

---

#### Bug 9 — LOW | `pronouns` not shown in own Profile view — **STILL PRESENT**
**Location:** Profile.js (view section, around line 299–308)  
**Verification:** The own-profile view renders the name (`{user.name}`) with no pronouns adjacent. PublicProfile at Discover.js:33 shows `{profileUser.pronouns}` next to the name. Discover card at Discover.js:561 shows `{current.pronouns}`. Only the own-profile view is missing it.  
**Fix:** In Profile.js view section after `{user.name}`, add `{user.pronouns && <span style={{ fontSize: 11, color: COLORS.textMuted, fontStyle: "italic" }}>{user.pronouns}</span>}`.

---

#### Bug 10 — LOW | `isPending` check in Messages.js is dead code — **STILL PRESENT**
**Location:** Messages.js:12, 174–179  
**Verification:** `const isPending = sent.some(u => u.uid === activeChat)`. `activeChat` is only set via `handleOpenChat`, which is called from `Matches.onChat` — which only fires on match UIDs (Connected section), never sent UIDs. A user in `sent` can never become `activeChat`. The "Messaging unlocks once X connects back" UI at line 174 never renders.

---

#### Bug 11 — HIGH | Search Firestore permissions error — **FIXED in v0.5, confirmed fixed in v0.6 ✅**
The `allow list: if isAuth()` rule in `firestore.rules` is present and unchanged. Search collection queries function correctly.

---

### New Bugs Found in v0.6 Audit

---

#### Bug 12 — MEDIUM | Users who blocked you appear in Discover feed
**Location:** App.js:304–306 (`unmatched` filter)  
**Description:**
```js
const blockedUids = new Set(blocked.map(b => b.uid));
const unmatched = allUsers === null ? null : allUsers.filter(u =>
  !matches.find(m => m.uid === u.uid) && !sent.find(s => s.uid === u.uid) &&
  !passed.has(u.uid) && !u.deactivated && !received.find(r => r.uid === u.uid) &&
  !blockedUids.has(u.uid)
  // ← blockedByUids NOT excluded here
);
```
`blockedByUids` is tracked in state (App.js:191–197) but not included in the Discover feed filter. Users who blocked you can still appear in your Discover card. Contrast with `SearchModal` at App.js:449–451 which correctly builds a combined `blockedSet` excluding both directions before filtering results.  
**Fix:** Add `&& !blockedByUids.includes(u.uid)` to the `unmatched` filter at App.js:306.

---

#### Bug 13 — MEDIUM | Connection request can be sent to users who blocked you
**Location:** App.js:221–242 (`handleSendRequestWithNote`)  
**Description:** No guard checks whether the target user has blocked the current user before writing to their `received` subcollection. Because the `received` Firestore rule allows `isOwner(senderId)` to write, the request lands in the blocked user's inbox. This is related to Bug 12 (they can appear in your Discover feed) but is a separate issue — even if Bug 12 is fixed, this handler would still need its own guard.  
**Fix:** Before the `Promise.all` in `handleSendRequestWithNote`, check `blockedByUids.includes(targetUser.uid)` and return early without writing if true.

---

#### Bug 14 — LOW | FCM notify on connection events swallows errors silently
**Location:** App.js:226–241, 259–274  
**Description:** Both new FCM notify calls (`handleSendRequestWithNote` and `handleAcceptRequest`) use empty `catch {}`:
```js
try {
  ... fetch("/api/notify", ...) ...
} catch {}  // no logging — failure is invisible
```
The equivalent call in `Messages.js:59–61` uses `console.warn("FCM notify error:", e)`. The inconsistency means failures in connection-event notifications are undetectable without Vercel function logs.  
**Fix:** Replace empty `catch {}` with `catch (e) { console.warn("FCM notify error (connection event):", e); }`.

---

#### Bug 15 — LOW | `passed` document data inconsistent between handlers
**Location:** App.js:213–214 (`handlePass`); App.js:281–282 (`handleDeclineRequest`)  
**Description:**
- `handlePass`: writes `{ passedAt: serverTimestamp() }` to `passed/{uid}`
- `handleDeclineRequest`: writes `{ uid: senderUser.uid }` to `passed/{uid}`

The `passed` collection is read only as a Set of doc IDs (`snap.docs.map(d => d.id)`), so neither field actually affects functionality. But the inconsistency is confusing and could break any future code that reads `passed` document data.  
**Fix:** Standardise to `{ passedAt: serverTimestamp() }` in both handlers.

---

## H. What's Missing for v1.0

| Priority | Gap | Status vs v0.5 |
|----------|-----|----------------|
| P0 | Fix Search prefix range query (`` suffix) | Still open — Bug 1 |
| P0 | Resolve FCM 401 / Vercel env var verification | Partially addressed — Bug 3 |
| P0 | Filter blockedByUids from Discover feed | **New** — Bug 12 |
| P0 | Guard `handleSendRequestWithNote` against blocked-by users | **New** — Bug 13 |
| P1 | Display `title` in profile header | Still open — Bug 5 |
| P1 | Error handling on block/unblock | Still open — Bug 6 |
| P1 | Forgot password link on login form | Still open — no bug number |
| P1 | FCM token refresh logging / error handling | **New** — Bug 14 |
| P1 | FCM token: auto-refresh handles revoked permissions | Partially open — revoked permission returns null from `getFCMToken` but `setDoc` is still attempted (`if (token)` guards it) — this is fine |
| P2 | Move all hardcoded hex values into COLORS | Still open — ~12 values across 4 files |
| P2 | Show `pronouns` in own Profile view | Still open — Bug 9 |
| P2 | Standardise `passed` document data | Still open — Bug 15 |
| P2 | Optimise chat listeners (diff-based) | Still open — Bug 4 |
| P2 | Account reactivation self-serve flow | Still open |
| P2 | Report / flag user feature | Still open |
| P2 | Add logging to FCM notify connection-event catch blocks | **New** — Bug 14 |
| P3 | Read receipts | Still open |
| P3 | Deep link to profile (`/user/:uid`) | Still open |
| P3 | Notification preferences in Firestore (cross-device) | Still open |
| P3 | Meaningful test suite | Still open |
| P3 | Profile completion nudge | Still open |
| P3 | Analytics integration | Still open |

---

## I. Recommended Next Steps

### P0 — Ship blockers

**1. Fix Search prefix range query**  
`App.js:441–442`: change both `const end_ = t_ + "";` to `const end_ = t_ + "";` and same for `endCap_`.  
**Acceptance criteria:** Searching "tha" returns all users whose `nameLower` starts with "tha" (e.g. "thapelo").

**2. Filter blockedByUids from Discover feed**  
`App.js:305–306`: add `&& !blockedByUids.includes(u.uid)` to the `unmatched` filter.  
**Acceptance criteria:** A user who has been blocked by person X no longer sees person X in their Discover feed.

**3. Guard connection requests against blocked-by users**  
`App.js:221`: add `if (blockedByUids.includes(targetUser.uid)) return;` at the start of `handleSendRequestWithNote`.  
**Acceptance criteria:** Sending a connection request to a user who blocked you is silently rejected client-side; no Firestore writes occur.

**4. Verify FCM env vars in Vercel**  
Confirm `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` are set in the Vercel project dashboard. Test: send a message from Device A while Device B is backgrounded and verify push arrives.  
**Acceptance criteria:** Vercel function logs show `{ success: true }` for `/api/notify`; push notification appears on a locked device.

### P1 — Important UX gaps

**5. Display `title` in profile header**  
Profile.js (view, ~line 300) and Discover.js (PublicProfile, ~line 32): replace `{user.name}` / `{profileUser.name}` with `{[user.title, user.name].filter(Boolean).join(" ")}`.  
**Acceptance criteria:** A user with title "Dr." sees "Dr. Jane Smith" in their own profile and in others' views.

**6. Add "Forgot password" to login form**  
AuthScreen.js: add a small link below the Sign In button calling `sendPasswordResetEmail(auth, email)` when `email` is non-empty.  
**Acceptance criteria:** User can trigger a password reset from the login screen.

### P2 — Polish

**7. Add FCM error logging to connection event handlers**  
App.js:241, 274: replace `catch {}` with `catch (e) { console.warn("FCM notify error:", e); }`.  
**Acceptance criteria:** FCM failures for connection events appear in the browser console and can be correlated with Vercel logs.

---

## J. v0.5 → v0.6 Delta Summary

**Added / Fixed:**
- Firestore security rules for `users/{uid}/blocked/{blockedUid}` and `users/{uid}/blockedBy/{blockerId}` — Bug 2 resolved; block/unblock feature now fully functional
- FCM token auto-refresh on mount (`App.js:102–110`) — fires when Notification permission is already granted; updates `fcmToken` in Firestore
- FCM push notification on connection request sent (`App.js:226–241`) — recipient receives "New Connection Request" push
- FCM push notification on connection accepted (`App.js:259–274`) — requester receives "Connection Accepted" push
- STATUS_REPORT_v0.5.md added to repo

**Still present from v0.5 (not fixed):**
- Bug 1 — Search prefix range query returns exact matches only
- Bug 3 — FCM 401 / Vercel env var status unverifiable from code (partially mitigated by new auto-refresh + connection events)
- Bug 4 — N chat listeners re-registered on every match change
- Bug 5 — `title` field stored but never rendered
- Bug 6 — `handleBlock`/`handleUnblock` no error handling
- Bugs 7, 8 — Hardcoded hex values in Messages.js
- Bug 9 — `pronouns` absent from own-profile view
- Bug 10 — `isPending` dead code in Messages.js
- All 12 hardcoded hex values in COLORS still not consolidated

**Newly discovered in v0.6 audit:**
- Bug 12 (MEDIUM) — `blockedByUids` not excluded from Discover feed; blocked-you users appear in your card stack
- Bug 13 (MEDIUM) — Connection requests can be sent to users who blocked you; no guard in `handleSendRequestWithNote`
- Bug 14 (LOW) — New FCM notify calls for connection events use empty `catch {}` with no logging
- Bug 15 (LOW) — `passed` document data written inconsistently between `handlePass` and `handleDeclineRequest` (no functional impact but data is misleading)

---

*Report generated by reading all specified source files in full. All line numbers and field names verified against actual source code. No assumptions made about unfiled issues.*
