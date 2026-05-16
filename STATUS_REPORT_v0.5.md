# Link-Ap — Status Report v0.5
**Generated:** 2026-05-16  
**Last updated:** 2026-05-16 — Bug 11 fixed; search permissions resolved.  
**Branch:** main  
**Scope:** Full audit of App.js, Messages.js, Profile.js, shared.js, firebase.js, api/notify.js, firestore.rules, public/service-worker.js, public/manifest.json, package.json, plus all component files.

---

## A. Feature Inventory

| Feature | Component(s) | Status | Notes |
|---------|-------------|--------|-------|
| Auth — Google SSO | AuthScreen.js | ✅ Complete | `signInWithPopup` + GoogleAuthProvider |
| Auth — Email / Password | AuthScreen.js | ✅ Complete | `createUserWithEmailAndPassword` + `signInWithEmailAndPassword` |
| Auth — Terms gate (signup only) | AuthScreen.js | ✅ Complete | Checkbox required; login shows inline notice |
| Forgot password (login) | AuthScreen.js | ❌ Missing | No "Forgot password" link on the login form |
| Splash screen | App.js (`SplashScreen`) | ✅ Complete | 3.6 s display + 0.5 s fade; logo pulse animation |
| Error boundary | App.js (`ErrorBoundary`) | ✅ Complete | Catches render errors, shows reload button |
| Onboarding — 5-step flow | Onboarding.js | ✅ Complete | See Section C for detail |
| Profile — view | Profile.js | ✅ Complete | All stored fields rendered except `title` and `pronouns` in own-profile view |
| Profile — edit | Profile.js | ✅ Complete | All fields editable inline |
| Profile — photo upload | Profile.js | ✅ Complete | Canvas resize to 200 px → Storage `avatars/{uid}.jpg` |
| Profile — share / invite poster | Discover.js (`ShareModal`) | ✅ Complete | Canvas poster + Web Share API + WhatsApp fallback |
| LinkedIn URL validation + badge | Profile.js, Onboarding.js | ✅ Complete | `validateLinkedIn` + `linkedinNameMatches` for badge |
| `title` field (Dr., Prof., etc.) | Profile.js, Onboarding.js | 🔧 Partial | Stored and editable; **never rendered** in any profile header |
| `pronouns` field | Profile.js, Discover.js | 🔧 Partial | Shown in PublicProfile and Discover card; **absent from own-profile view** |
| Discover feed — intent-filtered | Discover.js, App.js | ✅ Complete | `complementMap`; falls back to unfiltered if no matches |
| Discover feed — pagination | App.js (`loadMoreUsers`) | ✅ Complete | 30 per page, `startAfter` cursor, auto-triggers at < 5 remaining |
| Discover — Pass | Discover.js | ✅ Complete | Writes to `users/{uid}/passed/{uid}` |
| Discover — Connect with note | Discover.js (`ConnectNoteModal`) | ✅ Complete | 10-char min, 300-char max; bilateral Firestore write |
| Connection requests — receive | Matches.js | ✅ Complete | Shows sender note with accent border |
| Connection requests — accept | App.js (`handleAcceptRequest`) | ✅ Complete | Bilateral match creation; cleans up sent/received both sides |
| Connection requests — decline | App.js (`handleDeclineRequest`) | ✅ Complete | Adds to `passed` |
| Pending sent requests list | Matches.js | ✅ Complete | Shown with note preview |
| Mutual matches list | Matches.js | ✅ Complete | Tap → chat; `✕ remove` button per card |
| Remove connection | App.js (`handleDisconnect`), Matches.js, Discover.js | ✅ Complete | Bilateral delete; local state updated; active chat cleared |
| Real-time messaging | Messages.js | ✅ Complete | `onSnapshot` per chat; Enter key sends |
| Messages — blocked state | Messages.js | ✅ Complete | Separate messages for iBlockedThem vs theyBlockedMe |
| Messages — pending state | Messages.js | 🔧 Partial | Dead code path — `isPending` is always false in practice (see Bug 10) |
| Message preview + timestamp | App.js, Messages.js | ✅ Complete | 40-char truncate; `formatRelativeTime` from shared.js |
| Unread indicators | App.js, Messages.js | ✅ Complete | Badge on nav tab; dot on avatar in Messages list |
| Block / Unblock user | App.js, Settings.js, Discover.js | 🔧 Partial | UI and handler code correct; **Firestore rules missing** for `blocked` and `blockedBy` — all writes denied (Bug 2) |
| Block list (Settings) | Settings.js | 🔧 Partial | Reads and renders correctly; writes silently fail due to missing rules |
| Search by name | App.js (`SearchModal`) | ✅ Complete | Permissions fixed (Bug 11); note: prefix range query still needs `end_` suffix fix (Bug 1) |
| FCM push notifications | App.js, firebase.js, api/notify.js, Settings.js | 🔧 Partial | Architecture complete; only chat messages trigger push; connection events do not; 401 issue unresolved per project memory |
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
| Privacy Policy route | App.js | ✅ Complete | `/privacy` path renders `<PrivacyPolicy />` |
| Terms of Service modal | shared.js (`TermsContent`), AuthScreen.js, Settings.js | ✅ Complete | Inline modal with full terms text |

---

## B. Firebase Integration Status

### Auth Methods
| Method | Status |
|--------|--------|
| Google OAuth (popup) | ✅ Wired — `signInWithPopup`, `GoogleAuthProvider` |
| Email + Password | ✅ Wired — create + sign-in |
| Password reset | ✅ Wired — `sendPasswordResetEmail` |
| Phone / SMS | ❌ Not implemented |
| Apple Sign-In | ❌ Not implemented |
| Magic link / passwordless | ❌ Not implemented |

### Firestore Collections

**`users/{uid}`** (top-level profile document)
| Field | Type | Set by |
|-------|------|--------|
| uid | string | Onboarding |
| title | string | Onboarding / Profile edit |
| firstName | string | Onboarding |
| lastName | string | Onboarding |
| name | string | Onboarding / Profile edit (firstName + lastName) |
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
| color | string | Random from USER_COLORS (set at Onboarding) |
| nameLower | string | For search (name.toLowerCase()) |
| lastNameLower | string | For search (last word of name) |
| photoURL | string | Storage download URL or Google photoURL |
| createdAt | Timestamp | serverTimestamp() at Onboarding |
| termsAcceptedAt | Timestamp | serverTimestamp() at Onboarding |
| fcmToken | string | Set by Settings "Enable Notifications" |
| deactivated | boolean | Set by Settings "Deactivate Account" |

**`users/{uid}/matches/{matchedUid}`** — snapshot of matched user's profile at time of propagation  
Fields synced on profile save: `name`, `role`, `location`, `bio`, `skills`, `photoURL`, `avatar`, `color`, `lookingFor`, `pronouns`, `title`  
Full document written on `handleAcceptRequest`: entire sender/receiver `user` object

**`users/{uid}/sent/{targetUid}`** — outgoing connection request  
Fields: entire target user object + `note` (string) + `sentAt` (Timestamp)

**`users/{uid}/received/{senderUid}`** — incoming connection request  
Fields: entire sender `user` object + `note` (string) + `sentAt` (Timestamp)

**`users/{uid}/passed/{passedUid}`** — profiles swiped past or declined  
Fields: `{ passedAt: Timestamp }` for pass action; `{ uid }` for decline action (inconsistent)

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
| `users/{uid}` read | `isAuth() && (isOwner || !deactivated)` | ✅ Correct |
| `users/{uid}` create/update | `isAuth() && isOwner` | ✅ Correct |
| `users/{uid}` delete | `isAuth() && isOwner` | ✅ Correct |
| `users/{uid}/matches/{matchedUid}` | `isAuth() && (isOwner(uid) \|\| isOwner(matchedUid))` | ✅ Correct — allows bilateral writes |
| `users/{uid}/sent/{targetId}` | `isAuth() && (isOwner(uid) \|\| isOwner(targetId))` | ✅ Correct — sender can write to recipient |
| `users/{uid}/received/{senderId}` | `isAuth() && (isOwner(uid) \|\| isOwner(senderId))` | ✅ Correct |
| `users/{uid}/passed/{passedUid}` | `isAuth() && isOwner(uid)` | ✅ Correct — private |
| `users/{uid}/blocked/{blockedUid}` | **NO RULE** | ❌ **Defaults to DENY — block feature broken** |
| `users/{uid}/blockedBy/{blockerId}` | **NO RULE** | ❌ **Defaults to DENY — block feature broken** |
| `chats/{chatId}/messages/{msgId}` read | `isParticipant()` | ✅ Correct |
| `chats/{chatId}/messages/{msgId}` create | `isParticipant() && from == auth.uid` | ✅ Correct |
| `chats/{chatId}/messages/{msgId}` delete | No rule | ⚠️ Messages cannot be deleted (acceptable if by design) |
| `chats/{chatId}` root document | No rule | ⚠️ App never reads root chat doc; no impact |

**Risk: `chatId.split('_')` in `isParticipant()`** — Firebase UIDs do not normally contain underscores, so this is LOW risk in practice. However, if a future UID ever contained `_`, the rule would silently misidentify participants.

---

## C. Onboarding Flow

**Step 0 — "Who are you?"** (`Onboarding.js:73–98`)
- Fields: `title` (optional Select), `firstName` (required Input), `lastName` (required Input), `pronouns` (optional Select), `role` (required Input), `location` (required Input), `linkedin` (optional Input, validated)
- Validation: `firstName && lastName && role && location && (!linkedin || validateLinkedIn(linkedin))`
- Note: LinkedIn is optional here; a valid URL passes `validateLinkedIn` which checks for `"linkedin.com/in/"` substring

**Step 1 — "Your story"** (`Onboarding.js:99–116`)
- Fields: `bio` (TextArea, 20-word hard limit enforced on keystroke), `skills` (SkillsInput, max 5, 3 words each), `achievements` (comma-separated, optional)
- Validation: `bio && skills.length > 0`

**Step 2 — "What are you looking for?"** (`Onboarding.js:117–135`)
- Fields: `lookingFor[]` — multi-select from `LOOKING_FOR_OPTIONS` in shared.js (8 options)
- Validation: `lookingFor.length > 0`

**Step 3 — "Tell us more"** (`Onboarding.js:136–168`)
- Dynamic questions from `LOOKING_FOR_QUESTIONS` in shared.js, keyed by selected `lookingFor` values
- Intents with questions: "A Job" (5 Qs), "Freelance Work" (4 Qs), "Clients" (4 Qs), "Co-founder" (4 Qs), "Investor" (5 Qs), "Mentor" (3 Qs), "Collaboration" (3 Qs)
- **"Startup to join"** has no entry in `LOOKING_FOR_QUESTIONS` → step shows "No extra details needed — tap Continue."
- Validation: always `true` (all optional)
- All answers stored in `lookingForDetails{}` map with typed keys (e.g., `job_industry`, `cofounder_building`)

**Step 4 — "What I bring to the table"** (`Onboarding.js:169–218`)
- Fields: `bringToTable` (free textarea), `currentlyExploring` (comma-separated text input, optional), `openTo[]` (multi-select from `OPEN_TO_OPTIONS`, optional)
- Prompt text adapts to `lookingFor` via `getBringToTablePrompt()` in shared.js
- Validation: always `true` (entirely optional)

**Firestore write on complete** (`Onboarding.js:31–69`) — single `setDoc` to `users/{uid}` containing all fields above, plus:
- `uid`, `color` (random from `USER_COLORS`), `avatar` (initials), `nameLower`, `lastNameLower`
- `photoURL: firebaseUser.photoURL || ""` — email users get empty string, no UI to set photo at onboarding
- `createdAt: serverTimestamp()`, `termsAcceptedAt: serverTimestamp()`

**Gaps / issues:**
- Step 4 is always valid — users can complete onboarding with no `bringToTable`, `currentlyExploring`, or `openTo`; this is acceptable UX but reduces profile richness
- Email users land in the app with no profile photo and must go to Profile edit to add one; there's no prompt
- `title` field (Dr., Prof., etc.) is stored but never rendered anywhere in the profile view

---

## D. Profile & Discovery

### Profile Fields: Stored vs Displayed

| Field | Stored | Rendered in Own Profile | Rendered in PublicProfile | In Discover Card |
|-------|--------|------------------------|--------------------------|-----------------|
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
| photoURL | ✅ | ✅ (avatar) | ✅ (avatar) | ✅ (avatar) |
| color | ✅ | ✅ (accent bar + role color) | ✅ | ✅ |
| fcmToken | ✅ | ❌ | ❌ | ❌ |
| deactivated | ✅ | ❌ | ❌ | ❌ |

### Discovery Logic

1. **Server-side fetch** (`App.js:78–98`, `loadMoreUsers`):
   - Query: `where("deactivated", "!=", true)` + `orderBy("deactivated")` + `orderBy("createdAt")` + `limit(30)`
   - Note: `orderBy("deactivated")` is a Firestore requirement when using inequality on that field. Users without a `deactivated` field (null/undefined) sort before `false` in Firestore's ordering, making the effective order non-deterministic for the first results.
   - Cursor: `startAfter(lastDocRef.current)` — works correctly
   - Client filter: excludes current user and deactivated (redundant with server filter)

2. **Client-side exclusion** (`App.js:263–265`):
   - Excludes: `matches`, `sent`, `passed`, `received`, `blocked`
   - Result: `unmatched` array

3. **Intent filtering** (`App.js:267–291`):
   - Skipped if `user.lookingFor` is empty
   - Uses `complementMap` — 8 keys, each mapping to compatible intents
   - Falls back to full `unmatched` if no intent-filtered results

4. **Session-level deduplication** (`seenUids` Set):
   - Tracks who's been shown this session; cleared on page refresh or component unmount
   - Separate from `passed` (Firestore-persisted, permanent)

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

| File | Lines |
|------|-------|
| src/App.js | 683 |
| src/Discover.js | 614 |
| src/Profile.js | 435 |
| src/Settings.js | 393 |
| src/shared.js | 330 |
| src/Onboarding.js | 277 |
| src/Messages.js | 207 |
| src/AuthScreen.js | 183 |
| src/Matches.js | 172 |
| src/firebase.js | 37 |
| api/notify.js | 52 |

### Hook Counts in App.js

| Hook | Count | Location |
|------|-------|----------|
| `useState` | 22 total | 18 in `MainApp`, 4 in `App` root |
| `useEffect` | 12 total | 11 in `MainApp`, 1 in `App` root |
| `useRef` | 5 total | `lastDocRef`, `hasMoreRef`, `loadingMoreRef`, `tabRef`, `activeChatRef` — all in `MainApp` |

### Hardcoded Hex Values Not in COLORS

| Value | File | Line | Should Be |
|-------|------|------|-----------|
| `"#1D4ED8"` | Messages.js | 161 | New constant `COLORS.chatBlue` or `COLORS.blue` |
| `"#F5A623"` | Messages.js | 91 | `COLORS.accent` |
| `"#16161F"` | Discover.js (PublicProfile) | 25 | New constant (profile header bg) |
| `"#16161F"` | Profile.js | 294 | Same new constant |
| `"#1A2E4A"` | Profile.js | 337; Discover.js | New constant (skills bg) |
| `"#1A2A4A"` | Profile.js | 383 | New constant (achievement icon bg) |
| `"#2A1A00"` | Profile.js | 410; Discover.js | New constant (exploring tag bg) |
| `"#0A2015"` | Profile.js | 415; Discover.js | New constant (openTo tag bg) |
| `"#2D1F00"` | Profile.js; Discover.js | multiple | New constant (Q&A badge bg) |
| `"#6B4A00"` | Profile.js; Discover.js | multiple | New constant (Q&A badge border) |
| `"#15532E"` | Discover.js | 44 | New constant (Investor badge border) |
| `"#0A0A0F"` | App.js (`SplashScreen`) | 592 | `COLORS.bg` (already defined) |

### eslint-disable Suppressions

| File | Line | Suppressed Rule | Reason |
|------|------|-----------------|--------|
| App.js | 100 | react-hooks/exhaustive-deps | `loadMoreUsers` intentionally called once |
| App.js | 123 | react-hooks/exhaustive-deps | `onMessage` listener; deps would cause re-register |
| App.js | 150 | react-hooks/exhaustive-deps | Stale-closure refs used for `tabRef`/`activeChatRef` |
| Profile.js | 10 | react-hooks/exhaustive-deps | `editTrigger` incrementing counter pattern |
| Discover.js | 324 | react-hooks/exhaustive-deps | `drawInvitePoster` called once on mount |
| Discover.js | 488 | react-hooks/exhaustive-deps | Load-more effect deps intentionally limited |

All suppressions appear intentional and justified. No reckless suppression detected.

### console.warn / console.error Calls

| File | Line | Call | Condition |
|------|------|------|-----------|
| App.js | 94 | `console.error("Failed to load users:", e)` | `loadMoreUsers` catch |
| App.js | 419 | `console.error("[Search] query error:", e)` | SearchModal search catch |
| App.js | 616 | `console.error("ErrorBoundary caught:", error, info)` | `componentDidCatch` |
| Messages.js | 60 | `console.warn("FCM notify error:", e)` | FCM notify catch in `send()` |
| firebase.js | 31 | `console.warn("FCM token error:", err)` | `getFCMToken` catch |
| Settings.js | 281 | `console.warn("FCM error:", err)` | Enable notifications catch |
| api/notify.js | 49 | `console.error("FCM send error:", err)` | Server-side FCM send catch |

### Performance Concerns

1. **N chat listeners** — `App.js:125–150`. One `onSnapshot` per match, torn down and rebuilt every time `matches` array changes. A user with 50 matches registers 50 listeners on every new message (since any `docChange` updates `matches`... actually wait — `matches` changes via its own listener at line 102–107; those changes cascade to the chat listener `useEffect`. This is a compound re-register problem.

2. **`loadingMore` state in `Discover`** — `advance()` in Discover.js:500 calls `setSeenUids` on every pass/connect, which re-renders the full Discover component. Each re-render re-filters `remaining`. For large `allUsers` arrays this is O(N) on every swipe.

3. **`writeBatch` profile propagation** — Profile.js:94–113. Batch is correct, but there's no guard against the 500-write batch limit. Relevant only if a user has 500+ matches (negligible for current scale).

4. **`handleBlock` / `handleUnblock` write to 2 paths in parallel** — fine as written, but both fail silently due to missing Firestore rules (see Bug 2).

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
│   └── blank <div> (COLORS.bg background)
├── !firebaseUser (firebaseUser === null)
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
    ├── showBlockList     → block list view (replaces content)
    ├── showDeactivateConfirm → modal (z=50)
    ├── showDeleteConfirm     → modal (z=50)
    └── showTerms             → bottom sheet (z=50)

Global overlays (any tab):
├── viewingProfile → <PublicProfile /> (z=40)
│   └── showDisconnectConfirm → modal (z=50)
├── showSearch    → <SearchModal /> (z=40)
│   └── target set → connect note sub-view
└── notification  → toast (fixed, z=999)
```

### Manifest Shortcuts
- `/?tab=discover` — "Discover"
- `/?tab=messages` — "Messages"

---

## G. Known Bugs & Issues

> **Note:** No v0.4 status report is available in this session. Bugs are identified from direct code inspection. The FCM 401 issue is carried forward from project memory.

---

### Bug 1 — HIGH | Search prefix range query broken
**Location:** App.js:399–404 (`SearchModal` useEffect)  
**Description:**
```js
const end_ = t_ + "";      // equals t_ exactly
const endCap_ = tCap + ""; // equals tCap exactly
```
`end_` is assigned `t_ + ""` which is string concatenation with an empty string — it equals `t_`. Firestore `where('nameLower', '>=', t_)` AND `where('nameLower', '<=', t_)` is an **equality** match, not a prefix/startsWith range. The search only returns users whose `nameLower` or `name` exactly equals the search term. Typing "tha" will never find "thapelo".  
**Fix:**
```js
const end_ = t_ + "";
const endCap_ = tCap + "";
```

---

### Bug 2 — HIGH | Firestore rules missing for `blocked` and `blockedBy`
**Location:** firestore.rules (missing match blocks)  
**Description:** `handleBlock` (App.js:189–194) writes to `users/{uid}/blocked/{targetUid}` and `users/{targetUid}/blockedBy/{uid}`. Neither subcollection has a security rule. Firestore defaults to DENY for unmatched paths. Every block and unblock operation silently fails with a permissions error. The block list UI reads from a `onSnapshot` listener (App.js:174–179) which also returns zero documents.  
**Fix:** Add to `firestore.rules` inside `match /users/{uid}`:
```
match /blocked/{blockedUid} {
  allow read: if isAuth() && isOwner(uid);
  allow write: if isAuth() && (isOwner(uid) || isOwner(blockedUid));
}
match /blockedBy/{blockerId} {
  allow read: if isAuth() && isOwner(uid);
  allow write: if isAuth() && (isOwner(uid) || isOwner(blockerId));
}
```

---

### Bug 3 — HIGH | FCM push notifications: 401 / unresolved setup
**Location:** api/notify.js; project memory  
**Description:** Project memory records: "FCM push notifications broken; configs confirmed OK, 4 console steps pending before any code changes." The `api/notify.js` implementation is structurally correct (verifies Firebase ID token before sending). The probable cause is missing or malformed Vercel environment variables (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`). The `console.warn("FCM notify error:", e)` at Messages.js:60 swallows the error silently on the client.  
**Fix:** Complete the 4 console verification steps from the diagnosis session; confirm env vars are set in Vercel dashboard with the private key newlines correctly escaped.

---

### Bug 4 — MEDIUM | N chat listeners torn down and rebuilt on every match change
**Location:** App.js:125–150  
**Description:** The `useEffect` that sets up chat listeners depends on `[matches, firebaseUser.uid]`. Every `onSnapshot` update to the `matches` subcollection (e.g., when a new message updates `lastMessages`) triggers the matches listener to fire, which updates `matches` state, which tears down and recreates all N chat listeners simultaneously. For a user with 20 matches this means 20 listeners are destroyed and recreated for every incoming message.  
**Fix:** Track active chat subscriptions in a `useRef` map keyed by chatId; only add/remove listeners for the diff (new matches and removed matches), not the whole set.

---

### Bug 5 — MEDIUM | `title` field stored but never displayed
**Location:** Profile.js view section; Discover.js `PublicProfile`  
**Description:** The `title` field (Mr, Dr, Prof, etc.) is saved to Firestore by both Onboarding.js (`saveProfile`:37) and Profile.js (`saveProfile`:73). It is propagated to match documents (`propagated` object at Profile.js:103). However, no rendering path shows it. Profile.js:300 renders `{user.name}` and PublicProfile Discover.js:32 renders `{profileUser.name}`. The `name` field does not include the title prefix.  
**Fix:** In Profile.js:300 and Discover.js:32, render `{[user.title, user.name].filter(Boolean).join(" ")}`.

---

### Bug 6 — MEDIUM | `handleBlock` and `handleUnblock` have no error handling
**Location:** App.js:189–200  
**Description:** Both functions are `async` with `await Promise.all(...)` but have no `try/catch`. When Firestore rejects the writes (due to Bug 2), the thrown error propagates uncaught and could trigger the `ErrorBoundary`. No toast or UI feedback is shown to the user.  
**Fix:** Wrap in `try/catch`; call `showNotif(...)` on error.

---

### Bug 7 — LOW | `#1D4ED8` hardcoded for sent message bubble
**Location:** Messages.js:161  
**Description:** `background: msg.from === firebaseUser.uid ? "#1D4ED8" : COLORS.card` — the blue chat bubble colour is not in `COLORS` or any constant. It would need a manual search to update.  
**Fix:** Add `chatBlue: "#1D4ED8"` to `COLORS` in shared.js and replace inline.

---

### Bug 8 — LOW | `#F5A623` hardcoded for unread dot in Messages.js
**Location:** Messages.js:91  
**Description:** `background: "#F5A623"` instead of `COLORS.accent`. If the accent colour ever changes, the unread indicator won't update.  
**Fix:** Replace with `COLORS.accent`.

---

### Bug 9 — LOW | `pronouns` not shown in own Profile view
**Location:** Profile.js (view section, lines 271–433)  
**Description:** Pronouns are displayed in the Discover card (Discover.js:561) and in PublicProfile (Discover.js:33), but the own-profile view in Profile.js has no render path for `user.pronouns`.  
**Fix:** Add pronouns display next to or below the name in Profile.js:300, consistent with PublicProfile.

---

### Bug 11 — HIGH | ✅ FIXED | Search returns Firestore permissions error
**Location:** firestore.rules (`match /users/{uid}`)  
**Description:** The search feature (`SearchModal`, App.js:443–448) runs three parallel `getDocs` collection queries against `users`. The existing rule `allow read:` was split into `allow get:` (single-document reads, with the deactivated check preserved) and a new `allow list: if isAuth();` (collection-level queries). Without a `list` rule, Firestore denied all collection queries with "Missing or insufficient permissions."  
**Fix:** Replaced `allow read:` with separate `allow get:` and `allow list: if isAuth()` inside `match /users/{uid}`. Deployed via `firebase deploy --only firestore:rules`.

---

### Bug 10 — LOW | `isPending` check in Messages.js is dead code
**Location:** Messages.js:12, 174–179  
**Description:** `const isPending = sent.some(u => u.uid === activeChat)`. The `activeChat` UID is only ever set via `handleOpenChat` which is called from `Matches.onChat` — which only receives match UIDs, not sent UIDs. A user in `sent` (but not yet in `matches`) can never become the `activeChat`. The "messaging unlocks once X connects back" UI block at line 174 therefore never renders.  
**This is dead code, not a crash.** It may have been intended as a safeguard. If it's meant to show, the Messages list would need to expose sent users as clickable, which is not the current design.

---

## H. What's Missing for v1.0

| Priority | Gap | Notes |
|----------|-----|-------|
| P0 | Fix Firestore rules for `blocked`/`blockedBy` | Block feature is currently broken in production |
| P0 | Fix Search prefix range query (`` suffix) | Search returns exact matches only |
| P0 | Resolve FCM 401 / env var issue | Push notifications broken for all users |
| P1 | Display `title` in profile header | Stored and editable, invisible to users |
| P1 | Error handling on block/unblock | Silent failures |
| P1 | Forgot password link on login form | UX gap; users must know to sign up for email reset |
| P1 | FCM for connection events | New request / accepted request notifications missing |
| P1 | FCM token refresh mechanism | Token can expire; no auto-update |
| P2 | Move all hardcoded hex values into COLORS | ~12 unique values across 4 files |
| P2 | Show `pronouns` in own Profile view | Inconsistent display across screens |
| P2 | Optimize chat listeners (diff-based) | Current approach re-registers all N on any match change |
| P2 | Account reactivation self-serve flow | Currently requires contacting support |
| P2 | Report / flag user feature | No abuse reporting mechanism |
| P3 | Read receipts | No delivery/seen indicators |
| P3 | Deep link to profile (`/user/:uid`) | No shareable profile URL |
| P3 | Notification preferences in Firestore | Currently localStorage-only; not cross-device |
| P3 | Meaningful test suite | `react-scripts test` exists but no component tests written |
| P3 | Profile completion nudge | No prompt to fill sparse profiles |
| P3 | Analytics integration | No usage telemetry |

---

## I. Recommended Next Steps

### P0 — Ship blockers

**1. Fix Firestore security rules for `blocked` / `blockedBy`**  
Add two `match` blocks to `firestore.rules` inside `match /users/{uid}`. The `blocked` subcollection should be readable/writable by the owner; `blockedBy` should be writable by the blocker (the other party). Deploy with `firebase deploy --only firestore:rules`.  
**Acceptance criteria:** A user can block another; the blocked user disappears from Discover; the block list in Settings shows the blocked user; unblock works bilaterally.

**2. Fix Search prefix range query**  
`App.js:399–404` — change `const end_ = t_ + "";` to `const end_ = t_ + "";` and same for `endCap_`. Two-character change.  
**Acceptance criteria:** Searching "tha" returns all users whose `nameLower` or `name` starts with "tha".

**3. Diagnose and fix FCM 401**  
Per project memory: complete the 4 Vercel console verification steps. Confirm `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` are set as environment variables in the Vercel project dashboard. Test with a real device by sending a message and confirming the push arrives.  
**Acceptance criteria:** `/api/notify` returns `{ success: true }` in Vercel function logs; push notification appears on a locked device.

### P1 — Important UX gaps

**4. Display `title` in profile header**  
Profile.js:300 — change `{user.name}` to `{[user.title, user.name].filter(Boolean).join(" ")}`. Same fix in PublicProfile (Discover.js:32).  
**Acceptance criteria:** A user with title "Dr." sees "Dr. Jane Smith" in their profile and in others' views of their profile.

**5. Add "Forgot password" to login form**  
Add a small link below the Sign In button in AuthScreen.js that calls `sendPasswordResetEmail(auth, email)`.  
**Acceptance criteria:** User can trigger a password reset from the login screen without first needing to navigate to Settings.

### P2 — Polish

**6. Consolidate hardcoded hex values into COLORS**  
Add `chatBlue`, `profileHeaderBg`, `skillsBg`, `exploringBg`, `openToBg`, and Q&A constants to `COLORS` in shared.js. Replace all inline occurrences.  
**Acceptance criteria:** `grep -r '"#` across `src/` returns only values already in COLORS.

---

## J. v0.4 → v0.5 Delta Summary

The following changes are observed in the current codebase relative to documented v0.4 architecture:

**Added / Implemented:**
- `blocked` and `blockedBy` subcollections with `handleBlock` / `handleUnblock` in `MainApp`
- Block list screen in `Settings.js`
- Block/unblock buttons in `PublicProfile` (Discover.js)
- `handleDisconnect` in `MainApp`; Remove Connection buttons in `Matches.js` and `PublicProfile`
- `disconnectTarget` state in `Matches.js` with confirmation modal
- `showDisconnectConfirm` + `isMutualMatch` in `PublicProfile`
- `lastMessages` state map in `MainApp` with chat listener per match
- `formatRelativeTime` in shared.js; message preview + timestamp in Messages.js
- `seenUids` / `setSeenUids` props threading through `Discover`
- `ConnectNoteModal` in Discover.js (replaces in-card connect button)
- `SearchModal` in App.js (name search with bilateral note flow)
- `ShareModal` + `drawInvitePoster` canvas in Discover.js
- FCM infrastructure: `api/notify.js`, `getFCMToken` in firebase.js, in-app `onMessage` listener, "Enable Notifications" button in Settings.js
- `playBeep` + `triggerVibrate` sound/haptic helpers in App.js
- Sound/vibrate toggles with `localStorage` persistence in Settings.js
- Password reset for email users in Settings.js
- `handleDeactivate` / `handleDelete` with full bilateral cleanup in Settings.js
- `profileEditTrigger` counter pattern for cross-tab profile edit navigation
- `PrivacyPolicy` route at `/privacy` in App.js
- `openTo` field in profile (Onboarding, Profile edit, display)
- `bringToTable` field in profile (Onboarding, Profile edit, display)
- `currentlyExploring` field in profile (Onboarding, Profile edit, display)
- `lookingForDetails` Q&A block on profile cards
- `LOOKING_FOR_QUESTIONS` constant in shared.js
- `OPEN_TO_OPTIONS`, `TITLE_OPTIONS`, `PRONOUN_OPTIONS` constants in shared.js
- `title` and `pronouns` fields in Onboarding and Profile edit
- `nameLower` / `lastNameLower` backfill logic in App.js `onAuthStateChanged`
- Intent-filtering `complementMap` in `MainApp`
- Service worker: FCM background message handling + offline cache strategy

**Bugs newly discovered in this audit (not previously documented):**
- Search prefix range query broken (`end_ = t_ + ""` → equality match only) — Bug 1
- Firestore rules missing for `blocked` / `blockedBy` — Bug 2
- `title` field stored but never displayed anywhere — Bug 5
- `isPending` block in Messages.js is unreachable dead code — Bug 10
- N chat listeners torn down and rebuilt on every match change — Bug 4
- ~12 hardcoded hex values not in COLORS across 4 files

**Carried forward from project memory (unresolved):**
- FCM 401 / environment variable issue — Bug 3

---

*Report generated by reading all specified source files in full. No assumptions were made about unfiled issues. All line numbers and field names are verified against the actual source.*
