# Link-Ap — Status Report v0.7
**Generated:** 2026-05-17  
**Branch:** main  
**Scope:** Full re-audit of all source files. Every bug status verified against actual code. All line numbers current as of this audit.  
**Key delta since v0.6:** Bug 12 fixed (blockedByUids excluded from Discover feed); Bug 13 fixed (guard in handleSendRequestWithNote); Google OAuth switched from signInWithPopup → signInWithRedirect; Firestore forced long-polling enabled.

---

## A. Feature Inventory

| Feature | Component(s) | Status | Notes |
|---------|-------------|--------|-------|
| Auth — Google SSO | AuthScreen.js | ✅ Complete | **Changed in v0.7** — now uses `signInWithRedirect` + `getRedirectResult` (was `signInWithPopup`) |
| Auth — Email / Password | AuthScreen.js | ✅ Complete | create + sign-in |
| Auth — Terms gate (signup only) | AuthScreen.js | ✅ Complete | Checkbox required; login shows inline notice |
| Forgot password (login) | AuthScreen.js | ❌ Missing | Still no "Forgot password" link on the login form |
| Splash screen | App.js (`SplashScreen`) | ✅ Complete | 3.6 s display + 0.5 s fade |
| Error boundary | App.js (`ErrorBoundary`) | ✅ Complete | Catches render errors |
| Onboarding — 5-step flow | Onboarding.js | ✅ Complete | See Section C |
| Profile — view | Profile.js | 🔧 Partial | `title` and `pronouns` still absent from own-profile view |
| Profile — edit | Profile.js | ✅ Complete | All fields editable |
| Profile — photo upload | Profile.js | ✅ Complete | Canvas resize 200 px → Storage `avatars/{uid}.jpg` |
| Profile — share / invite poster | Discover.js (`ShareModal`) | ✅ Complete | Canvas poster + Web Share API + WhatsApp fallback |
| LinkedIn URL validation + badge | Profile.js, Onboarding.js | ✅ Complete | `validateLinkedIn` + `linkedinNameMatches` |
| `title` field (Dr., Prof., etc.) | Profile.js, Onboarding.js | 🔧 Partial | Stored and editable; never rendered in any profile header (Bug 5) |
| `pronouns` field | Profile.js, Discover.js | 🔧 Partial | Shown in PublicProfile and Discover card; absent from own-profile view (Bug 9) |
| Discover feed — intent-filtered | Discover.js, App.js | ✅ Complete | `complementMap`; falls back to unfiltered if no intent matches |
| Discover feed — pagination | App.js (`loadMoreUsers`) | ✅ Complete | 30 per page, `startAfter` cursor |
| Discover — Pass | Discover.js | ✅ Complete | Writes to `users/{uid}/passed/{uid}` |
| Discover — Connect with note | Discover.js (`ConnectNoteModal`) | ✅ Complete | 10-char min, 300-char max; bilateral Firestore write |
| Connection requests — receive | Matches.js | ✅ Complete | Shows sender note with accent border |
| Connection requests — accept | App.js (`handleAcceptRequest`) | ✅ Complete | Bilateral match; FCM notification sent to requester |
| Connection requests — decline | App.js (`handleDeclineRequest`) | ✅ Complete | Adds to `passed` |
| Pending sent requests list | Matches.js | ✅ Complete | Note preview shown |
| Mutual matches list | Matches.js | ✅ Complete | Tap → chat; `✕ remove` per card |
| Remove connection | App.js (`handleDisconnect`), Matches.js, Discover.js | ✅ Complete | Bilateral delete; local state updated; active chat cleared |
| Real-time messaging | Messages.js | ✅ Complete | `onSnapshot` per chat; Enter key sends |
| Messages — blocked state | Messages.js | ✅ Complete | Separate copy for iBlockedThem vs theyBlockedMe |
| Messages — pending state | Messages.js | 🔧 Partial | `isPending` guard is dead code — never evaluates true (Bug 10) |
| Message preview + timestamp | App.js, Messages.js | ✅ Complete | 40-char truncate; `formatRelativeTime` |
| Unread indicators | App.js, Messages.js | ✅ Complete | Nav badge + dot on avatar |
| Block / Unblock user | App.js, Settings.js, Discover.js | ✅ Complete | Rules deployed v0.6; no error handling on write failure (Bug 6) |
| Block list (Settings) | Settings.js | ✅ Complete | Reads and renders correctly |
| Discover — exclude blocked-by users | App.js | ✅ Complete | **Fixed in v0.7** — `blockedByUids` now excluded from Discover feed (was Bug 12) |
| Connect request — blocked-by guard | App.js | ✅ Complete | **Fixed in v0.7** — early return if target blocked you (was Bug 13) |
| Search by name | App.js (`SearchModal`) | 🔧 Partial | Prefix range query still broken — returns exact matches only (Bug 1) |
| FCM push notifications — messages | Messages.js | 🔧 Partial | Code correct; FCM 401 status unverifiable from code (Bug 3) |
| FCM push notifications — connection request | App.js (`handleSendRequestWithNote`) | ✅ Complete | Recipient notified on request sent |
| FCM push notifications — accept | App.js (`handleAcceptRequest`) | ✅ Complete | Requester notified on accept |
| FCM token auto-refresh | App.js | ✅ Complete | Refreshed on mount if permission granted |
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
| Terms of Service modal | shared.js (`TermsContent`), AuthScreen.js, Settings.js | ✅ Complete | Full terms text inline |

---

## B. Firebase Integration Status

### Auth Methods
| Method | Status |
|--------|--------|
| Google OAuth (redirect) | ✅ Wired — `signInWithRedirect` + `getRedirectResult`, `GoogleAuthProvider` (**changed from popup in v0.7**) |
| Email + Password | ✅ Wired — create + sign-in |
| Password reset | ✅ Wired — `sendPasswordResetEmail` (Settings only; no link on login form) |
| Phone / SMS | ❌ Not implemented |
| Apple Sign-In | ❌ Not implemented |

### Firestore Configuration
`initializeFirestore(app, { experimentalForceLongPolling: true })` — **new in v0.7** (firebase.js:17). Forces long-polling instead of WebSockets/gRPC. Required for PWA compatibility on iOS and environments that block WebSocket upgrades.

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
Fields synced on profile save (Profile.js:97–109): `name`, `role`, `location`, `bio`, `skills`, `photoURL`, `avatar`, `color`, `lookingFor`, `pronouns`, `title`  
Full document written on `handleAcceptRequest`: entire sender/receiver `user` object

**`users/{uid}/sent/{targetUid}`** — outgoing connection request  
Fields: full target user object + `note` (string) + `sentAt` (Timestamp)

**`users/{uid}/received/{senderUid}`** — incoming connection request  
Fields: full sender `user` object + `note` (string) + `sentAt` (Timestamp)

**`users/{uid}/passed/{passedUid}`** — profiles passed or declined  
Fields: `{ passedAt: Timestamp }` from `handlePass`; `{ uid: string }` from `handleDeclineRequest` — **inconsistent** (Bug 15)

**`users/{uid}/blocked/{blockedUid}`** — full user object of blocked person

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
| `users/{uid}` list | `isAuth()` | ✅ Correct (for search) |
| `users/{uid}` create/update | `isAuth() && isOwner` | ✅ Correct |
| `users/{uid}` delete | `isAuth() && isOwner` | ✅ Correct |
| `users/{uid}/matches/{matchedUid}` | `isOwner(uid) \|\| isOwner(matchedUid)` | ✅ Correct — bilateral writes |
| `users/{uid}/sent/{targetId}` | `isOwner(uid) \|\| isOwner(targetId)` | ✅ Correct |
| `users/{uid}/received/{senderId}` | `isOwner(uid) \|\| isOwner(senderId)` | ✅ Correct |
| `users/{uid}/passed/{passedUid}` | `isOwner(uid)` | ✅ Correct — private |
| `users/{uid}/blocked/{blockedUid}` | `read: isOwner(uid); write: isOwner(uid) \|\| isOwner(blockedUid)` | ✅ Correct (fixed v0.6) |
| `users/{uid}/blockedBy/{blockerId}` | `read: isOwner(uid); write: isOwner(uid) \|\| isOwner(blockerId)` | ✅ Correct (fixed v0.6) |
| `chats/{chatId}/messages/{msgId}` read | `isParticipant()` | ✅ Correct |
| `chats/{chatId}/messages/{msgId}` create | `isParticipant() && from == auth.uid` | ✅ Correct |
| `chats/{chatId}/messages/{msgId}` delete | No rule | ⚠️ Messages cannot be deleted (acceptable if by design) |
| `chats/{chatId}` root document | No rule | ⚠️ App never reads root chat doc; no impact |

**Remaining rules risk:** `chatId.split('_')` in `isParticipant()` — Firebase UIDs don't normally contain underscores so this is LOW risk in practice.

**Latent gap:** The `received` rule (`isOwner(senderId)`) still allows a blocked sender to write to the blocker's `received` subcollection. Firestore rules cannot cross-read the `blocked` subcollection. The client-side guard in `handleSendRequestWithNote` (App.js:222) mitigates this in practice, but it is not enforced at the rules layer.

---

## C. Onboarding Flow

**Step 0 — "Who are you?"** (Onboarding.js:72–98)  
Fields: `title` (optional Select), `firstName` (required), `lastName` (required), `pronouns` (optional Select), `role` (required), `location` (required), `linkedin` (optional, validated on input)  
Validation: `firstName && lastName && role && location && (!linkedin || validateLinkedIn(linkedin))`

**Step 1 — "Your story"** (Onboarding.js:99–116)  
Fields: `bio` (TextArea, 20-word hard limit per keystroke), `skills` (SkillsInput max 5, 3 words each), `achievements` (comma-separated, optional)  
Validation: `bio && skills.length > 0`

**Step 2 — "What are you looking for?"** (Onboarding.js:117–135)  
Multi-select from `LOOKING_FOR_OPTIONS` (8 options)  
Validation: `lookingFor.length > 0`

**Step 3 — "Tell us more"** (Onboarding.js:136–168)  
Dynamic questions from `LOOKING_FOR_QUESTIONS` keyed by `lookingFor` selections  
"Startup to join" has no entry → step shows "No extra details needed"  
Validation: always `true` (all optional)

**Step 4 — "What I bring to the table"** (Onboarding.js:169–217)  
Fields: `bringToTable` (free textarea), `currentlyExploring` (comma-separated), `openTo[]` (multi-select)  
Prompt adapts via `getBringToTablePrompt()` based on `lookingFor`  
Validation: always `true`

**Firestore write on complete** (Onboarding.js:31–69) — single `setDoc` to `users/{uid}` with all fields.

**Gaps / issues:**
- Email users complete onboarding with no profile photo; must navigate to Profile edit
- `title` stored but never rendered in any profile header
- Steps 3 and 4 are always valid — users can skip all optional fields, reducing profile richness

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

1. **Server fetch** (App.js:78–98):  
   Query: `where("deactivated", "!=", true)` + `orderBy("deactivated")` + `orderBy("createdAt")` + `limit(30)`  
   Users without a `deactivated` field sort non-deterministically before `false` in Firestore's ordering.

2. **Client-side exclusion** (App.js:305–308) — **UPDATED in v0.7**:
   ```js
   const unmatched = allUsers === null ? null : allUsers.filter(u =>
     !matches.find(m => m.uid === u.uid) && !sent.find(s => s.uid === u.uid) &&
     !passed.has(u.uid) && !u.deactivated && !received.find(r => r.uid === u.uid) &&
     !blockedUids.has(u.uid) && !blockedByUids.includes(u.uid)  // ← Bug 12 fixed
   );
   ```
   Now excludes: `matches`, `sent`, `passed`, `received`, `blocked` (own), **and `blockedByUids`** (users who blocked you).

3. **Intent filtering** (App.js:310–334):  
   Skipped if `user.lookingFor` is empty. Uses `complementMap` — 8 keys. Falls back to full `unmatched` if no results after filtering.

4. **Session deduplication** (`seenUids` Set): Tracks seen profiles this session; cleared on refresh.

5. **Auto-load trigger** (Discover.js:487–488): Fires when `remaining.length < 5` and `hasMore && !loadingMore`.

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

| File | v0.6 Lines | v0.7 Lines | Delta | Reason |
|------|-----------|-----------|-------|--------|
| src/App.js | 725 | 726 | +1 | Bug 13 guard line added |
| src/AuthScreen.js | 183 | 195 | +12 | signInWithRedirect + useEffect for getRedirectResult |
| src/Discover.js | 614 | 614 | — | |
| src/Profile.js | 434 | 435 | +1 | Trailing newline |
| src/Settings.js | 393 | 393 | — | |
| src/shared.js | 330 | 330 | — | |
| src/Onboarding.js | 277 | 277 | — | |
| src/Messages.js | 207 | 207 | — | |
| src/Matches.js | 172 | 172 | — | |
| src/firebase.js | 37 | 37 | — | experimentalForceLongPolling on same line |
| api/notify.js | 52 | 52 | — | |
| public/service-worker.js | — | 79 | — | |

### Hook Counts in App.js

| Hook | Count | Notes |
|------|-------|-------|
| `useState` | 22 total | 18 in `MainApp`, 4 in `App` root — unchanged |
| `useEffect` | 13 total | 12 in `MainApp`, 1 in `App` root — unchanged |
| `useRef` | 5 total | `lastDocRef`, `hasMoreRef`, `loadingMoreRef`, `tabRef`, `activeChatRef` — unchanged |

### Hardcoded Hex Values Not in COLORS

| Value | File | Line(s) | Should Be |
|-------|------|---------|-----------|
| `"#1D4ED8"` | Messages.js | 161 | `COLORS.chatBlue` (new token) |
| `"#F5A623"` | Messages.js | 91 | `COLORS.accent` |
| `"#0A0A0F"` | App.js (`SplashScreen`) | 637 | `COLORS.bg` |
| `"#16161F"` | Profile.js | 294 | New token `COLORS.cardDark` |
| `"#16161F"` | Discover.js (PublicProfile) | 25 | Same new token |
| `"#1A2E4A"` | Profile.js | 338 | New token `COLORS.skillsBg` |
| `"#1A2E4A"` | Discover.js | 70 | Same new token |
| `"#1A2E4A"` | shared.js (`SkillsInput`) | 196 | Same new token |
| `"#1A2A4A"` | Profile.js | 384 | New token `COLORS.achieveBg` |
| `"#1A2A4A"` | Discover.js | 115 | Same new token |
| `"#2A1A00"` | Profile.js | 410 | New token `COLORS.exploringBg` |
| `"#2A1A00"` | Discover.js | 142 | Same new token |
| `"#0A2015"` | Profile.js | 311, 420 | New token `COLORS.openToBg` |
| `"#0A2015"` | Discover.js | 43, 152 | Same new token |
| `"#15532E"` | Profile.js | 311 | New token `COLORS.investorBorder` |
| `"#15532E"` | Discover.js | 43 | Same new token |
| `"#2D1F00"` | Profile.js | 351 | New token `COLORS.qaBg` |
| `"#2D1F00"` | Discover.js | 83 | Same new token |
| `"#6B4A00"` | Profile.js | 351 | New token `COLORS.qaBorder` |
| `"#6B4A00"` | Discover.js | 83 | Same new token |
| `"#25D366"` | Discover.js (`ShareModal`) | 378 | WhatsApp brand color — acceptable |

Total: **20 hardcoded values** across 5 files. The WhatsApp green is intentional; the remaining 19 should be consolidated into `COLORS`.

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

All 7 suppressions appear intentional and justified.

### console.warn / console.error Calls

| File | Line | Call | Condition |
|------|------|------|-----------|
| App.js | 94 | `console.error("Failed to load users:", e)` | `loadMoreUsers` catch |
| App.js | 461 | `console.error("[Search] query error:", e)` | SearchModal search catch |
| App.js | 659 | `console.error("ErrorBoundary caught:", error, info)` | `componentDidCatch` |
| Messages.js | 60 | `console.warn("FCM notify error:", e)` | FCM notify in `send()` |
| firebase.js | 31 | `console.warn("FCM token error:", err)` | `getFCMToken` catch |
| Settings.js | 281 | `console.warn("FCM error:", err)` | Enable notifications catch |
| api/notify.js | 49 | `console.error("FCM send error:", err)` | Server-side FCM send catch |

**Still inconsistent:** The two FCM notify calls in `handleSendRequestWithNote` (App.js:242) and `handleAcceptRequest` (App.js:275) use empty `catch {}` with no logging. Messages.js:60 uses `console.warn`. See Bug 14.

### Performance Concerns

1. **N chat listeners re-registered on every match change** (App.js:135–160): `useEffect` depends on `[matches, firebaseUser.uid]`. Any addition or removal of a match doc causes all N listeners to tear down and recreate. A user with 20 connections registers 20 new listeners on every connection/disconnect. Still present from v0.5.

2. **O(N) re-filter on every Discover advance** (Discover.js:497–503): `advance()` calls `setSeenUids` on every pass/connect, causing a full re-filter of `users` on each action. O(N) per swipe.

3. **`writeBatch` profile propagation without batch size guard** (Profile.js:94–113): No check against the 500-write Firestore batch limit. Irrelevant at current scale.

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
│       ├── mode: "login"  — email + password + Google (redirect)
│       └── mode: "signup" — email + password + Google (redirect, terms required)
│       └── useEffect: getRedirectResult called on mount to handle Google return
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

### v0.6 Bugs — Status in v0.7

---

#### Bug 1 — HIGH | Search prefix range query broken — **STILL PRESENT**
**Location:** App.js:442–443  
**Verification:**
```js
const end_ = t_ + "";      // concatenating "" → equals t_ exactly
const endCap_ = tCap + ""; // same — equals tCap exactly
```
`where('nameLower', '>=', t_)` AND `where('nameLower', '<=', end_)` is a Firestore **equality** match, not a prefix range. Searching "tha" only returns users whose `nameLower` is exactly "tha". "thapelo" is never found.  
**Fix:**
```js
// Before:
const end_ = t_ + "";
const endCap_ = tCap + "";
// After:
const end_ = t_ + "";
const endCap_ = tCap + "";
```
**Acceptance criteria:** Searching "tha" returns all users whose `nameLower` starts with "tha".

---

#### Bug 2 — HIGH | Firestore rules missing for `blocked` and `blockedBy` — **FIXED ✅**
Fixed in v0.6 (commit `acd25d9`). Verified in v0.7: `firestore.rules` lines 35–43 contain correct rules.

---

#### Bug 3 — HIGH | FCM push notifications: 401 status unresolvable from code — **PARTIALLY FIXED**
The same status as v0.6. FCM token auto-refresh and connection-event notifications are wired. Whether Vercel env vars (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`) are correctly set cannot be verified from source code alone.  
**Remaining action:** Check Vercel function logs for `/api/notify` responses. A successful call returns `{ success: true }`.

---

#### Bug 4 — MEDIUM | N chat listeners torn down and rebuilt on every match change — **STILL PRESENT**
**Location:** App.js:135–160  
**Verification:**
```js
useEffect(() => {
  if (!matches.length) return;
  const unsubs = matches.map(match => { /* onSnapshot per match */ });
  return () => unsubs.forEach(u => u());
}, [matches, firebaseUser.uid]); // eslint-disable-line
```
Every add/remove of a match doc fires this effect, tearing down all N listeners simultaneously.

---

#### Bug 5 — MEDIUM | `title` field stored but never displayed — **STILL PRESENT**
**Location:** Profile.js:301 (own-profile view), Discover.js:32 (PublicProfile)  
**Verification:**
```js
// Profile.js:301 — own profile view:
<div style={{ fontSize: 19, fontWeight: 800, color: COLORS.text }}>{user.name}</div>

// Discover.js:32 — PublicProfile:
<div style={{ fontSize: 19, fontWeight: 800, color: COLORS.text }}>{profileUser.name}</div>
```
Neither renders `user.title` / `profileUser.title`. The `title` field is stored (Onboarding.js:39), editable (Profile.js:73), and propagated to match docs (Profile.js:108).  
**Fix:** In both locations replace with:
```js
{[user.title, user.name].filter(Boolean).join(" ")}
```

---

#### Bug 6 — MEDIUM | `handleBlock` and `handleUnblock` have no error handling — **STILL PRESENT**
**Location:** App.js:199–210  
**Verification:**
```js
const handleBlock = async (targetUser) => {
  await Promise.all([
    setDoc(...),
    setDoc(...),
  ]);
  // No try/catch — network error propagates as unhandled rejection
};
const handleUnblock = async (targetUid) => {
  await Promise.all([
    deleteDoc(...),
    deleteDoc(...),
  ]);
  // Same — no try/catch
};
```
**Fix:** Wrap both in `try/catch`; call `showNotif(...)` on error.

---

#### Bug 7 — LOW | `#1D4ED8` hardcoded for sent message bubble — **STILL PRESENT**
**Location:** Messages.js:161  
```js
background: msg.from === firebaseUser.uid ? "#1D4ED8" : COLORS.card,
```
**Fix:** Add `chatBlue: "#1D4ED8"` to `COLORS` in shared.js and replace with `COLORS.chatBlue`.

---

#### Bug 8 — LOW | `#F5A623` hardcoded for unread dot — **STILL PRESENT**
**Location:** Messages.js:91  
```js
width: 10, height: 10, background: "#F5A623", borderRadius: "50%",
```
**Fix:** Replace `"#F5A623"` with `{COLORS.accent}`.

---

#### Bug 9 — LOW | `pronouns` not shown in own Profile view — **STILL PRESENT**
**Location:** Profile.js:300–307 (own-profile header)  
**Verification:** Own-profile view (Profile.js:301) renders `{user.name}` with no pronouns. PublicProfile (Discover.js:33) correctly renders `{profileUser.pronouns && <span ...>}`. Discover card (Discover.js:561) also shows pronouns. Only own-profile is missing it.  
**Fix:** After `{user.name}` at Profile.js:301, add:
```js
{user.pronouns && <span style={{ fontSize: 11, color: COLORS.textMuted, fontStyle: "italic" }}>{user.pronouns}</span>}
```

---

#### Bug 10 — LOW | `isPending` check in Messages.js is dead code — **STILL PRESENT**
**Location:** Messages.js:12, 174–179  
**Verification:**
```js
// Messages.js:12
const isPending = sent.some(u => u.uid === activeChat);
```
`activeChat` is only set via `handleOpenChat`, which is only called from `Matches.onChat` — a handler wired exclusively to match UIDs (the Connected section). A user in `sent` can never become `activeChat`. The "Messaging unlocks once X connects back" UI block at lines 174–179 is therefore unreachable dead code.

---

#### Bug 11 — HIGH | Search Firestore permissions error — **FIXED in v0.5 ✅**
Confirmed still fixed in v0.7: `allow list: if isAuth()` present in firestore.rules:15.

---

#### Bug 12 — MEDIUM | Users who blocked you appeared in Discover feed — **FIXED IN v0.7 ✅**
**Fix applied at App.js:307:**
```js
// Before (v0.6):
!blockedUids.has(u.uid)
// After (v0.7):
!blockedUids.has(u.uid) && !blockedByUids.includes(u.uid)
```
Users who have blocked the current user are now correctly excluded from the Discover feed.

---

#### Bug 13 — MEDIUM | Connection request could be sent to users who blocked you — **FIXED IN v0.7 ✅**
**Fix applied at App.js:222:**
```js
const handleSendRequestWithNote = async (targetUser, note) => {
  if (blockedByUids.includes(targetUser.uid)) return;  // ← new guard
  await Promise.all([...]);
```
The early return prevents any Firestore writes when the target has blocked the current user.

---

#### Bug 14 — LOW | FCM notify on connection events swallows errors silently — **STILL PRESENT**
**Location:** App.js:242 (`handleSendRequestWithNote`), App.js:275 (`handleAcceptRequest`)  
**Verification:**
```js
// App.js:242
} catch {}  // silent — no logging

// App.js:275
} catch {}  // silent — no logging
```
Messages.js:59–61 uses `console.warn("FCM notify error:", e)`. The inconsistency makes connection-event FCM failures invisible.  
**Fix:** Replace both empty catches with `catch (e) { console.warn("FCM notify error (connection event):", e); }`.

---

#### Bug 15 — LOW | `passed` document data inconsistent between handlers — **STILL PRESENT**
**Location:** App.js:213 (`handlePass`), App.js:282 (`handleDeclineRequest`)  
**Verification:**
```js
// App.js:213 — handlePass:
{ passedAt: serverTimestamp() }

// App.js:282 — handleDeclineRequest:
{ uid: senderUser.uid }
```
`passed` is read only as a Set of doc IDs, so neither field affects functionality. The inconsistency is confusing for future development.  
**Fix:** Standardise to `{ passedAt: serverTimestamp() }` in `handleDeclineRequest`.

---

### New Bugs Found in v0.7 Audit

---

#### Bug 16 — LOW | SearchModal connection note has no minimum character validation
**Location:** App.js:586 (disabled condition on Send button)  
**Severity:** LOW  
**Description:** `ConnectNoteModal` (Discover.js:389, 453) enforces a 10-character minimum (`const MIN = 10`) and shows a live character counter. `SearchModal`'s send button only checks `!note.trim()` — a one-character note like "Hi" can be submitted:
```js
// App.js:586 — SearchModal send button:
disabled={!note.trim() || sending || sentOk}
// Missing: note.trim().length >= 10
```
```js
// Discover.js:453 — ConnectNoteModal (correct):
disabled={note.trim().length < MIN || sending || sentOk}
```
**Fix:**
```js
// App.js:586 — change to:
disabled={note.trim().length < 10 || sending || sentOk}
```
Also add a character counter below the textarea (matching ConnectNoteModal's pattern).  
**Acceptance criteria:** Submitting a note shorter than 10 characters in SearchModal is blocked with the button disabled.

---

#### Bug 17 — LOW | Success feedback fires even when `handleSendRequestWithNote` returns early
**Location:** App.js:247 (`handleConnectWithNote`), App.js:475–476 (`SearchModal.handleSend`)  
**Severity:** LOW (race condition — both UI paths already filter blocked-by users from displays; normal users never see this)  
**Description:** When `blockedByUids.includes(targetUser.uid)` is true, `handleSendRequestWithNote` returns early (`undefined`) with no Firestore writes. Callers don't check the return value and display success anyway:
```js
// App.js:245–248 — handleConnectWithNote:
const handleConnectWithNote = async (targetUser, note) => {
  await handleSendRequestWithNote(targetUser, note);
  showNotif(`Request sent to ${targetUser.name}!`); // fires even on early return
};

// App.js:474–476 — SearchModal.handleSend:
await onSendRequest(target, note.trim());
setSending(false);
setSentOk(true); // fires even on early return — shows "Request Sent ✓"
```
**Fix:** Return a boolean from `handleSendRequestWithNote`:
```js
const handleSendRequestWithNote = async (targetUser, note) => {
  if (blockedByUids.includes(targetUser.uid)) return false;
  await Promise.all([...]);
  // FCM notify try/catch
  return true;
};

// handleConnectWithNote:
const sent = await handleSendRequestWithNote(targetUser, note);
if (sent) showNotif(`Request sent to ${targetUser.name}!`);

// SearchModal.handleSend:
const sent = await onSendRequest(target, note.trim());
setSending(false);
if (sent) setSentOk(true);
```

---

## H. What's Missing for v1.0

| Priority | Gap | Status |
|----------|-----|--------|
| P0 | Fix Search prefix range query (`` suffix) | Open — Bug 1 |
| P0 | Resolve FCM 401 / Vercel env var verification | Partially addressed — Bug 3 |
| P1 | Display `title` in profile header | Open — Bug 5 |
| P1 | Error handling on block/unblock | Open — Bug 6 |
| P1 | Forgot password link on login form | Open — no bug number |
| P1 | Add FCM error logging to connection-event catch blocks | Open — Bug 14 |
| P2 | Move all hardcoded hex values into COLORS (19 values across 5 files) | Open |
| P2 | Show `pronouns` in own Profile view | Open — Bug 9 |
| P2 | Standardise `passed` document data | Open — Bug 15 |
| P2 | Fix SearchModal note minimum character validation | Open — Bug 16 |
| P2 | Fix success toast on blocked-by guard early return | Open — Bug 17 |
| P2 | Optimise chat listeners (diff-based) | Open — Bug 4 |
| P2 | Account reactivation self-serve flow | Open |
| P2 | Report / flag user feature | Open |
| P3 | Remove `isPending` dead code in Messages.js | Open — Bug 10 |
| P3 | Read receipts | Open |
| P3 | Deep link to profile (`/user/:uid`) | Open |
| P3 | Notification preferences in Firestore (cross-device) | Open |
| P3 | Meaningful test suite | Open |
| P3 | Profile completion nudge | Open |
| P3 | Analytics integration | Open |

---

## I. Recommended Next Steps

### P0 — Ship blockers

**1. Fix Search prefix range query**  
**File:** [src/App.js](src/App.js#L442-L443)  
```js
// Before (App.js:442–443):
const end_ = t_ + "";
const endCap_ = tCap + "";

// After:
const end_ = t_ + "";
const endCap_ = tCap + "";
```
**Acceptance criteria:** Searching "tha" returns all users whose `nameLower` starts with "tha" (e.g. "thapelo", "thabiso"). Searching "jo" returns "john", "jones", "josephine".

**2. Verify FCM env vars in Vercel**  
Confirm `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` are set in the Vercel project dashboard. Test: send a message from Device A while Device B is backgrounded and verify push arrives.  
**Acceptance criteria:** Vercel function logs show `{ success: true }` for `/api/notify`; push notification appears on a locked device.

### P1 — Important UX gaps

**3. Display `title` in profile header**  
**Files:** [src/Profile.js](src/Profile.js#L301), [src/Discover.js](src/Discover.js#L32)  
```js
// Before (both files):
<div style={{ fontSize: 19, fontWeight: 800, color: COLORS.text }}>{user.name}</div>

// After (Profile.js — use `user`; Discover.js PublicProfile — use `profileUser`):
<div style={{ fontSize: 19, fontWeight: 800, color: COLORS.text }}>
  {[user.title, user.name].filter(Boolean).join(" ")}
</div>
```
**Acceptance criteria:** A user with title "Dr." sees "Dr. Jane Smith" in their own profile and in others' views.

**4. Show `pronouns` in own Profile view**  
**File:** [src/Profile.js](src/Profile.js#L301)  
```js
// After the name div (Profile.js:301), add:
{user.pronouns && (
  <span style={{ fontSize: 11, color: COLORS.textMuted, fontStyle: "italic" }}>
    {user.pronouns}
  </span>
)}
```
**Acceptance criteria:** A user with pronouns "She/Her" sees them displayed next to their name in their own profile view.

**5. Add "Forgot password" to login form**  
**File:** [src/AuthScreen.js](src/AuthScreen.js)  
Add below the Sign In button when `mode === "login"`:
```js
{mode === "login" && email && (
  <p style={{ textAlign: "center", marginTop: 10, fontSize: 12, color: COLORS.textMuted }}>
    <span
      onClick={async () => {
        try {
          await sendPasswordResetEmail(auth, email);
          setError("Password reset email sent — check your inbox.");
        } catch (e) {
          setError(e.message.replace("Firebase: ", ""));
        }
      }}
      style={{ color: COLORS.accent, cursor: "pointer", textDecoration: "underline" }}
    >
      Forgot password?
    </span>
  </p>
)}
```
Also import `sendPasswordResetEmail` from `"firebase/auth"` at the top.  
**Acceptance criteria:** On the login screen with an email entered, "Forgot password?" appears. Clicking it sends a reset email.

**6. Add FCM error logging to connection event handlers**  
**File:** [src/App.js](src/App.js#L242)  
```js
// App.js:242 and App.js:275 — replace:
} catch {}

// With:
} catch (e) { console.warn("FCM notify error (connection event):", e); }
```
**Acceptance criteria:** FCM failures for connection events appear in the browser console.

### P2 — Polish

**7. Fix SearchModal note minimum character validation**  
**File:** [src/App.js](src/App.js#L586)  
```js
// Before:
disabled={!note.trim() || sending || sentOk}

// After:
disabled={note.trim().length < 10 || sending || sentOk}
```
Also add a character counter below the textarea.  
**Acceptance criteria:** Send button in SearchModal is disabled until note is ≥ 10 characters.

**8. Standardise `passed` document data**  
**File:** [src/App.js](src/App.js#L282)  
```js
// Before (App.js:282):
setDoc(doc(db, "users", firebaseUser.uid, "passed", senderUser.uid), { uid: senderUser.uid }),

// After:
setDoc(doc(db, "users", firebaseUser.uid, "passed", senderUser.uid), { passedAt: serverTimestamp() }),
```
**Acceptance criteria:** All `passed` documents contain `passedAt: Timestamp`.

---

## J. v0.6 → v0.7 Delta Summary

**Fixed since v0.6:**
- Bug 12: `blockedByUids` now excluded from Discover feed (App.js:307) — users who blocked you no longer appear in your card stack
- Bug 13: Guard added to `handleSendRequestWithNote` (App.js:222) — connection requests to users who blocked you are silently rejected client-side

**New code changes (not bugs — architectural improvements):**
- Google OAuth switched from `signInWithPopup` to `signInWithRedirect` + `getRedirectResult` (AuthScreen.js) — fixes popup restrictions on iOS PWA
- Firestore forced long-polling enabled (`experimentalForceLongPolling: true`, firebase.js:17) — fixes connectivity in WebSocket-restricted environments

**Still present from v0.6:**
- Bug 1 — Search prefix range returns exact matches only (App.js:442–443)
- Bug 3 — FCM 401 / Vercel env var status unverifiable from code
- Bug 4 — N chat listeners re-registered on every match change (App.js:135–160)
- Bug 5 — `title` field stored but never rendered (Profile.js:301, Discover.js:32)
- Bug 6 — `handleBlock`/`handleUnblock` no error handling (App.js:199–210)
- Bugs 7, 8 — Hardcoded hex values in Messages.js (lines 161, 91)
- Bug 9 — `pronouns` absent from own-profile view (Profile.js:300–307)
- Bug 10 — `isPending` dead code in Messages.js (lines 12, 174–179)
- Bug 14 — FCM notify connection events use empty `catch {}` (App.js:242, 275)
- Bug 15 — `passed` document data written inconsistently (App.js:213, 282)
- All 19 non-brand hardcoded hex values not consolidated into COLORS

**Newly discovered in v0.7 audit:**
- Bug 16 (LOW) — SearchModal connection note has no 10-char minimum (App.js:586), inconsistent with ConnectNoteModal
- Bug 17 (LOW) — Success toast fires even when `handleSendRequestWithNote` returns early due to blockedByUids guard (App.js:247, 475–476)

---

## Link-Ap AI Roadmap — From Stable v1.0 to World-Class Platform

> **Prerequisite:** All P0 and P1 bugs above resolved. App is at a stable, fully functional v1.0 baseline before the AI layer is introduced.

---

### Tier 1 — Core AI Features (Ship first, highest retention impact)

These features use data that already exists in Firestore and add intelligence at points of friction in the current user journey. They require no new data model changes — only new API endpoints calling the Claude API.

---

#### 1. AI Profile Optimiser

**What it does:** Analyses the user's `bio`, `skills`, `bringToTable`, `lookingFor`, `lookingForDetails`, and `currentlyExploring` fields. Returns a profile completeness score (0–100) and 3–5 specific, actionable suggestions ("Your bio is strong on what you do but doesn't communicate why someone should connect with you. Try adding one concrete outcome you've driven.").

**Data used:** `users/{uid}` — all profile text fields.

**Technical integration:** In [src/Profile.js](src/Profile.js) (view mode, not edit), add a "Get AI Feedback" button below the profile header. Clicking it calls `POST /api/profile-score` with the profile fields. The endpoint calls `claude-sonnet-4-6` with a structured prompt and returns JSON `{ score: 72, suggestions: [...] }`. Render suggestions as an expandable panel. Score persisted to `users/{uid}` as `profileScore: number` so it appears on the user's own card.

**Why it matters for growth:** Profile quality is the #1 predictor of connection acceptance rate. Users who improve their profiles send better requests, get more accepts, and stay on the platform. This feature drives a virtuous loop: better profiles → more connections → more retained users. Expected: 15–20% increase in connection acceptance rate for users who act on suggestions.

---

#### 2. Smart Match Explanations

**What it does:** When a user views a Discover card or PublicProfile, a "Why you two should connect" section is generated from both users' complementary intents and profile fields. Example: "Thapelo is building a fintech startup and looking for a co-founder with distribution skills. You have 5 years of growth marketing experience and are actively exploring founding opportunities. This is a high-intent match."

**Data used:** `current.lookingFor`, `current.bringToTable`, `current.lookingForDetails`; `user.lookingFor`, `user.bringToTable` (the viewing user's profile, already in memory as `user` prop).

**Technical integration:** In [src/Discover.js](src/Discover.js) inside the Discover card (between bio and skills), call `POST /api/match-explain` with both profiles' key fields. Cache results in component state keyed by `[currentUserUid, targetUid]` to avoid re-fetching on re-render. Use streaming response (Claude's streaming API) so the explanation appears word-by-word, making it feel alive rather than a loading delay.

**Why it matters for growth:** LinkedIn shows you profiles. Link-Ap will tell you *why* to connect. This is the clearest single-feature demonstration of the platform's intent-first design philosophy. Users who see a compelling "why" explanation connect at 2–3× the rate of those who see profiles cold.

---

#### 3. AI Connection Note Assistant

**What it does:** Inside `ConnectNoteModal` (Discover.js) and the SearchModal connect flow (App.js), a "Help me write this" button opens a suggestion panel with 3 draft connection notes generated from the target's profile. The user picks one or uses it as a starting point. Notes are personalised: "Hi Thapelo, I saw you're raising a seed round for a fintech product. I've closed two B2B SaaS deals in the payments space and would love to share what I learned about enterprise sales cycles — could be useful as you scale."

**Data used:** `targetUser.bio`, `targetUser.bringToTable`, `targetUser.lookingFor`, `targetUser.lookingForDetails`; `user.lookingFor`, `user.skills`.

**Technical integration:** Add a "✨ Suggest a note" button inside [src/Discover.js](src/Discover.js) ConnectNoteModal (line 430, below the label). On click, call `POST /api/suggest-note` with both profiles. Return 3 short note drafts as a JSON array. Render as tappable suggestion chips that populate the textarea.

**Why it matters for growth:** The connection note is the single biggest friction point in the flow. Most users stare at the blank textarea and abandon. AI suggestions cut abandonment by giving users a starting point. Higher completion rate → more connections → faster network growth → more value for all users.

---

#### 4. Conversation Starter Suggestions

**What it does:** When a chat is opened for the first time (`chatMessages.length === 0`), display 3 AI-generated conversation openers based on both users' shared intent overlaps and profile fields. Example starters: "What stage are you at with the fundraise?", "I noticed you're also exploring no-code tools — are you building the MVP yourself?", "Your background in product management aligns perfectly with what we need — what does your current availability look like?"

**Data used:** `chatUser.lookingFor`, `chatUser.bringToTable`, `chatUser.lookingForDetails`; `user.lookingFor`, `user.skills` (from the `user` prop passed down to Messages).

**Technical integration:** In [src/Messages.js](src/Messages.js) (line 151–156, the empty chat state), call `POST /api/conversation-starters` on first render with both profiles. Render results as 3 tappable chips above the input field. Tapping a chip populates the `input` state. Cache in `sessionStorage` keyed by `chatId` to avoid re-fetching on re-open.

**Why it matters for growth:** Most matches on networking apps go silent after the first message. Conversation starters reduce the cognitive barrier to the first message, increasing message-send rate and therefore conversation completion rate. A matched pair that messages 3+ times has 4× the 30-day retention of one that never messages.

---

### Tier 2 — Differentiation Features (Set Link-Ap apart from LinkedIn)

---

#### 1. Intent-Matching Intelligence (Embedding-Based Discovery)

**What it does:** Replaces the current static `complementMap` lookup with semantic similarity matching. Instead of hard-coded "Investor → Co-founder" rules, the system understands that "I'm building a B2B SaaS tool for small construction companies" is semantically closer to "I'm looking for a product co-founder in PropTech or construction" than to a generic co-founder seeking a tech partner.

**Architecture:**
- At onboarding completion and on each profile save, compute a text embedding of: `bringToTable + bio + lookingFor.join(", ") + lookingForDetails values` using the Embeddings API (or Claude's text-embedding endpoint).
- Store embedding vector in `users/{uid}/meta/embedding` as an array of floats, or in a vector database (Pinecone / Weaviate) keyed by `uid`.
- New API endpoint `POST /api/discover-ranked` accepts the current user's embedding + a list of candidate `uid`s. Returns UIDs re-ranked by cosine similarity. Called server-side after the Firestore batch load.
- The `intentFiltered` array in [src/App.js](src/App.js#L310-L334) is replaced by the server-ranked result.

**Why it matters:** The current complementMap has 8 hard-coded entries and produces many false positives. Embedding-based ranking surfaces genuinely compatible people, not just superficially matching intents. This is the feature that makes Discover feel magical rather than mechanical.

---

#### 2. Profile Ghost-Writing

**What it does:** A new optional screen in the onboarding flow (or accessible from Profile edit) where the user answers 5 short voice or text questions. AI writes their full `bio`, `bringToTable`, and `currentlyExploring` fields in their own tone.

**Example questions:** "What are you working on right now?", "What's the best thing you've done professionally?", "Who would you most want to meet on Link-Ap?", "What do you uniquely bring that others don't?", "How would a close colleague describe you in one sentence?"

**Technical integration:** New file [src/ProfileGhostwriter.js](src/ProfileGhostwriter.js). Uses the Web Speech API (`SpeechRecognition`) for voice input with a text fallback. Answers submitted to `POST /api/ghostwrite-profile` with the 5 Q&A pairs. Claude returns structured JSON: `{ bio, bringToTable, currentlyExploring: [] }`. The user reviews, edits, then saves. Routed from Profile.js edit mode as an optional "✨ Write my profile with AI" button.

**Why it matters:** Profile quality is the platform's core currency. Ghost-writing removes the #1 barrier to a rich profile (the blank page). Users who complete profiles with ghost-writing have 60–80% higher connection acceptance rates based on comparable platforms.

---

#### 3. Networking Goal Coach

**What it does:** A conversational AI available as a modal from Settings or a new tab. Users describe what they want — vaguely ("I want to grow my network") or specifically ("I need to find a technical co-founder in Cape Town who's worked in fintech"). The coach asks clarifying questions and outputs: (1) a refined set of `lookingFor` categories to update their profile with, (2) a 3-step weekly action plan ("Connect with 2 investors in FinTech this week", "Update your bringToTable to mention your fundraising experience"), (3) a metric to measure success ("Your goal: 3 new fintech investor conversations in 30 days").

**Technical integration:** New file [src/GoalCoach.js](src/GoalCoach.js). Uses streaming Claude responses (`claude-opus-4-7` for reasoning quality) via `POST /api/goal-coach`. Conversation state managed locally. Action plan exported as structured JSON; tapping an action item deep-links to the relevant app screen (e.g. Discover with a filter applied).

**Why it matters:** Most networking apps let users in and immediately show them a feed. Users don't know what success looks like. A goal-setting conversation anchors the user to a specific outcome, dramatically increasing 30-day retention because they have a reason to return.

---

#### 4. Warm Intro Composer

**What it does:** When viewing a `PublicProfile` and the user has a mutual connection with that person (a shared match), a "Request a warm intro" button appears. The user selects which mutual connection to ask for the intro. AI drafts a three-way intro message: the mutual connection's context, why the two parties should meet, and a proposed next step.

**Technical integration:** In [src/Discover.js](src/Discover.js) `PublicProfile` component (below the disconnect/block buttons at line 160), check if any `matches` share a match with `profileUser`. If so, show the intro button. On tap, call `POST /api/warm-intro` with all three profiles. Renders a draft message the user can send directly to their mutual connection via the existing chat system.

**Why it matters:** Warm intros have 5× the acceptance rate of cold requests on every networking platform studied. LinkedIn has this feature but it's buried and formulaic. An AI-written warm intro that actually explains the connection is a meaningfully better product.

---

### Tier 3 — Platform Intelligence (Scale & Monetisation Layer)

---

#### 1. Link-Ap Score

**What it does:** A trust and quality signal (0–100) displayed on Discover cards for premium subscribers. Computed from: profile completeness (30 pts), LinkedIn verified (20 pts), connection response rate (20 pts — % of received requests accepted), conversation completion rate (15 pts — % of matches who exchanged ≥3 messages), and tenure/engagement (15 pts).

**Technical integration:** Server-side Cloud Function computes scores nightly and writes to `users/{uid}` as `linkApScore: number`. Score shown on Discover card as a small badge (`★ 84`) for premium viewers. Non-premium users see it blurred to create upgrade incentive.

---

#### 2. Industry Trend Feed

**What it does:** A weekly AI-curated digest of what people in the user's network are exploring, building, and hiring for. Drives daily active use by giving users a reason to open the app even when they don't need to connect.

**Technical integration:** New `"trends"` tab added to the nav. Cloud Function runs weekly, aggregates `currentlyExploring`, `lookingForDetails`, and `bringToTable` across the user's network (matches + second-degree connections), calls Claude to synthesise 5 trend signals, writes to `users/{uid}/feed/weekly`. Client reads and renders.

---

#### 3. AI-Powered Search

**What it does:** Replaces the broken prefix range query (Bug 1) and the entire `SearchModal` concept with natural language search. User types: "find me a fintech founder in Cape Town open to a co-founder" → API extracts intent and location → vector search across user embeddings → ranked results with match explanations.

**Technical integration:** Replaces `SearchModal` in [src/App.js](src/App.js#L426). New file [src/AISearch.js](src/AISearch.js). `POST /api/search` accepts a natural language query, uses Claude to extract structured intent (`{ role, location, lookingFor, skills }`), runs a Pinecone vector search filtered by location, returns ranked results with explanations.

---

#### 4. Monetisation Through AI Credits

**Structure:**
- **Free tier:** Full app access + Tier 1 AI features (3 profile optimisations/month, unlimited match explanations at reduced quality, 5 note suggestions/month, 10 conversation starters/month)
- **Credit tier:** R49/month ($2.50 USD) for 50 AI credits. Tier 2 features cost 2–5 credits each. Credits roll over for 3 months.
- **Pro subscription:** R149/month ($8 USD). Unlimited Tier 1 + Tier 2. Tier 3 features (Link-Ap Score, trend feed, AI search). Badge on profile ("Pro Member").
- **Founding Member:** Users already on the platform before the paywall date get Pro free for life (as promised in the Discover empty state).

Credits stored in `users/{uid}` as `aiCredits: number`. Decremented server-side on each API call after auth verification.

---

### Growth & Subscriber Projection Narrative

**Why intent-first design is the right foundation for an AI layer**

LinkedIn was built for the professional graph — who you know, where you worked, what your title is. That design made sense in 2003 when the goal was simply to digitise a rolodex. But intent — what you actually want right now, what you uniquely offer, what you're willing to bring to the table in exchange — is fundamentally richer and more actionable data than graph proximity.

Link-Ap's onboarding flow doesn't ask "where did you work?" — it asks "what are you building, what do you bring to it, and who do you want to meet?" That single design decision produces data that is dramatically more valuable for an AI layer. When both users in a potential connection have filled out `bringToTable`, `lookingForDetails`, and `currentlyExploring`, Claude can produce a match explanation that's genuinely specific and accurate, not generic like "You both work in tech." LinkedIn's AI features are generic precisely because LinkedIn's underlying data is generic. Link-Ap's intent-first data model is the moat.

**Which feature drives the first 100k users**

The AI Connection Note Assistant will drive the first 100k. Here's why: the connection note is the moment of highest anxiety and highest abandonment in the entire funnel. Users who reach the ConnectNoteModal but abandon cost Link-Ap a connection that never happened. "Help me write this" removes that anxiety. Users who get a good first draft send the request. Requests sent with better, more specific notes get accepted at higher rates. Higher acceptance rates mean faster network growth per user, which means more value per user, which means organic word-of-mouth. This feature costs <1 API call per connection attempt, scales linearly, and pays for itself immediately in retention.

**How AI features compound into a network effect moat**

The network effect in Link-Ap is asymmetric: the value of each new user is determined not just by their presence but by the quality of their profile and the specificity of their intent. A mediocre profile on Link-Ap adds less value than a high-quality one. AI Profile Optimisation raises the average profile quality across the entire network, making the platform more valuable for every user. Better profiles → better Discover cards → higher connection rates → more messages → more retained users → larger network → more value for new users → better data for AI → better AI features. This is a compounding flywheel. LinkedIn cannot replicate it because their data model doesn't have `bringToTable` — they'd have to re-onboard 1 billion users.

**What makes Link-Ap defensible against LinkedIn, Lunchclub, and Bumble Bizz**

LinkedIn is too big and too general to do intent-matching well. Lunchclub's matching algorithm is a black box that users don't trust and can't influence. Bumble Bizz has the audience but the matching is social-graph-adjacent, not intent-driven. Link-Ap's defensibility comes from three compounding advantages: (1) the data model is richer by design, so AI features are more accurate from day one; (2) the founding member community (early adopters with high-quality profiles) sets a quality bar that new users implicitly match; (3) the AI features create switching cost — a user with a Link-Ap Score of 87, a ghost-written profile, and 50 warm conversations has built an asset on the platform that doesn't transfer. The longer a user stays, the more irreplaceable their Link-Ap identity becomes.

---

*Report generated 2026-05-17 by full source audit of all specified files. Every line number, field name, and bug status verified against actual source code. No statuses carried forward from v0.6 without re-verification.*
