# Link-Ap — Status Report v1.0

**Prepared:** 2026-05-26
**Auditor:** Claude Code (claude-sonnet-4-6)
**Branch:** main
**Scope:** Full re-audit of all 19 source files. Every bug status verified against actual current code with line numbers. No status carried forward from v0.9 without re-verification.
**Key delta since v0.9:** 6 bugs fixed (Bug 4, 7, 8, 17, 21, 22); IntroScreen.js added; 6 new bugs found (Bug 25–30); 7 new security findings identified.

---

## SECTION A — Feature Inventory

### Authentication & Onboarding

| Feature | Component(s) | Status | Notes |
|---------|-------------|--------|-------|
| Google Sign-In (popup) | AuthScreen.js | ✅ Complete | `AuthScreen.js:79` — `signInWithPopup` |
| Google Sign-In (iOS PWA) | AuthScreen.js | ✅ Complete | `AuthScreen.js:77` — `signInWithRedirect` for `isIosPwa` |
| Email / Password Sign-In | AuthScreen.js | ✅ Complete | `AuthScreen.js:93` |
| Email / Password Sign-Up | AuthScreen.js | ✅ Complete | `AuthScreen.js:95` |
| Forgot Password | AuthScreen.js | ✅ Complete | `AuthScreen.js:104–116` |
| Terms gate (signup) | AuthScreen.js | ✅ Complete | `AuthScreen.js:126` — `canSubmit` gated on `termsChecked` |
| Terms inline notice (login) | AuthScreen.js | ✅ Complete | `AuthScreen.js:253–260` |
| Splash screen | App.js (`SplashScreen`) | ✅ Complete | `App.js:706–749` |
| Error boundary | App.js (`ErrorBoundary`) | ✅ Complete | `App.js:750–786` |
| 5-step Onboarding flow | Onboarding.js | ✅ Complete | `Onboarding.js:72–218` — 5-item steps array |
| `termsAcceptedAt` timestamp | Onboarding.js | ✅ Complete | `Onboarding.js:62` |
| IntroScreen landing page | IntroScreen.js | ✅ **NEW v1.0** | Shown to unauthenticated visitors; founding-member CTA, who-it's-for grid, how-it-works |

### Profile & Identity

| Feature | Component(s) | Status | Notes |
|---------|-------------|--------|-------|
| Profile view | Profile.js | ✅ Complete | `Profile.js:275–438` |
| Profile edit | Profile.js | ✅ Complete | `Profile.js:146–273` |
| Photo upload | Profile.js | ✅ Complete | `Profile.js:38–58` |
| Photo display (avatar / photo) | shared.js (`Avatar`) | ✅ Complete | `Profile.js:67–69` |
| Pronouns field | Profile.js, Discover.js | ✅ Complete | `Profile.js:178` |
| Title field | Profile.js, Onboarding.js | ⚠️ Partial | Stored and editable; intentionally not displayed in name header (design decision) |
| Role field | Profile.js | ✅ Complete | `Profile.js:179` |
| Bio (20-word limit) | Profile.js, Onboarding.js | ✅ Complete | `Profile.js:182` |
| Skills (max 5, 3 words each) | Profile.js, Onboarding.js, shared.js | ✅ Complete | `shared.js:147` |
| Achievements | Profile.js, Onboarding.js | ✅ Complete | `Profile.js:191` |
| "What I Bring to the Table" | Profile.js, Onboarding.js | ✅ Complete | `Profile.js:189` |
| Currently Exploring | Profile.js, Onboarding.js | ✅ Complete | `Profile.js:240` |
| Open To | Profile.js, Onboarding.js | ✅ Complete | `Profile.js:242–254` |
| Looking For | Profile.js, Onboarding.js | ✅ Complete | `Profile.js:199–211` |
| Looking For Details (Q&A) | Profile.js, Onboarding.js, Discover.js | ✅ Complete | `Profile.js:213–238` |
| LinkedIn URL + verified badge | Profile.js, Onboarding.js, Discover.js | ✅ Complete | `Profile.js:193–197`, `307–310` |
| Profile completion nudge banner | App.js | ✅ Complete | `App.js:437–450` |
| Profile tab completion badge | App.js | ✅ Complete | `App.js:484` |
| Match propagation on save | Profile.js | ✅ Complete | `Profile.js:96–117` (`writeBatch`) |
| Profile share (invite poster) | Discover.js (`ShareModal`) | ✅ Complete | `Discover.js:322–485` |
| Profile QR code | Discover.js (`ShareModal`) | ✅ Complete | `Discover.js:337–344` |
| Profile deep link `/user/:uid` | App.js | ✅ Complete | `App.js:76–84` |

### Discovery & Matching

| Feature | Component(s) | Status | Notes |
|---------|-------------|--------|-------|
| Discover feed | App.js, Discover.js | ✅ Complete | `Discover.js:583–780` |
| Intent filtering (`complementMap`) | App.js | ✅ Complete | `App.js:383–407` |
| Pagination (30 per page) | App.js (`loadMoreUsers`) | ✅ Complete | `App.js:95–110` |
| Deactivated user filter | App.js | ✅ Complete | `App.js:97–100` |
| Blocked user filter | App.js | ✅ Complete | `App.js:380` |
| Pass | Discover.js | ✅ Complete | `Discover.js:655–656` |
| Connect with Note | Discover.js (`ConnectNoteModal`) | ✅ Complete | `Discover.js:487–581` |
| View full profile from card | Discover.js → PublicProfile | ✅ Complete | `Discover.js:701–703` |
| AI Smart Match Explanation | Discover.js, api/match-explain.js | ✅ Complete | `Discover.js:586–631` |
| Search by name | App.js (`SearchModal`) | ✅ Complete | `App.js:513–701` |
| Search connect with note | App.js (`SearchModal`) | ✅ Complete | **FIXED v1.0** — success UI now gated on return value (Bug 17 fixed) |

### Connections & Requests

| Feature | Component(s) | Status | Notes |
|---------|-------------|--------|-------|
| Send connection request | App.js, Discover.js | ✅ Complete | `App.js:292–315` |
| Receive connection requests | Matches.js | ✅ Complete | `Matches.js:44–89` |
| Accept request | App.js (`handleAcceptRequest`) | ✅ Complete | `App.js:322–348` |
| Decline request | App.js (`handleDeclineRequest`) | ✅ Complete | `App.js:350–357` |
| Pending sent requests list | Matches.js | ✅ Complete | `Matches.js:121–148` |
| Mutual matches list | Matches.js | ✅ Complete | `Matches.js:93–119` |
| Remove connection | App.js, Matches.js, Discover.js | ✅ Complete | `App.js:359–371` |
| Block user | App.js | ✅ Complete | `App.js:262–271` |
| Unblock user | App.js, Settings.js | ✅ Complete | `App.js:272–281` |
| Block list management | Settings.js | ✅ Complete | `Settings.js:205–236` |
| View public profile | Discover.js (`PublicProfile`) | ✅ Complete | `Discover.js:6–208` |
| "Remove Connection" in PublicProfile | Discover.js (`PublicProfile`) | ✅ Complete | `Discover.js:170–176` |

### Messaging

| Feature | Component(s) | Status | Notes |
|---------|-------------|--------|-------|
| Real-time chat | Messages.js | ✅ Complete | `Messages.js:17–25` |
| Send message | Messages.js | ✅ Complete | `Messages.js:31–59` |
| Message bubbles | Messages.js | ✅ Complete | `Messages.js:155–167` |
| Message list (conversations) | Messages.js | ✅ Complete | `Messages.js:66–113` |
| Message preview + timestamp | App.js, Messages.js | ✅ Complete | `Messages.js:97–107` |
| Unread indicators | App.js, Messages.js | ✅ Complete | `Messages.js:86–93`, `App.js:207–208` |
| Blocked state in chat | Messages.js | ✅ Complete | `Messages.js:135–145` |
| Auto-scroll to latest message | Messages.js | ✅ Complete | `Messages.js:27–29` |

### Notifications

| Feature | Component(s) | Status | Notes |
|---------|-------------|--------|-------|
| Auto-request notification permission | App.js | ✅ Complete | `App.js:129–151` |
| FCM token registration (multi-device) | App.js, firebase.js | ✅ Complete | `App.js:136`, `143` — `arrayUnion(token)` |
| Push — new connection request | App.js | ✅ Complete | `App.js:302–312` |
| Push — connection accepted | App.js | ✅ Complete | `App.js:337–347` |
| Push — new message | Messages.js | ✅ Complete | `Messages.js:44–58` |
| Push — background delivery | public/firebase-messaging-sw.js | ✅ Complete | `firebase-messaging-sw.js:46–55` |
| Push — foreground toast | App.js (`onMessage`) | ✅ Complete | `App.js:163–175` |
| Notification settings toggle | Settings.js | ✅ Complete | `Settings.js:51–87` |
| Message sound toggle | Settings.js | ✅ Complete | `Settings.js:34–38` |
| Vibrate toggle | Settings.js | ✅ Complete | `Settings.js:39–43` |
| Notification click → messages tab | public/firebase-messaging-sw.js | ✅ Complete | `firebase-messaging-sw.js:57–70` |
| Push delivery infra (Vercel) | api/notify.js | ⚠️ Partial | Code correct; `FIREBASE_*` env vars must be set and verified in Vercel |

### Sharing & Invites

| Feature | Component(s) | Status | Notes |
|---------|-------------|--------|-------|
| Invite poster (canvas) | Discover.js (`ShareModal`) | ✅ Complete | `Discover.js:225–320` |
| Share to WhatsApp | Discover.js | ✅ Complete | `Discover.js:373–381` |
| Save poster as PNG | Discover.js | ✅ Complete | `Discover.js:349–355` |
| Profile QR code | Discover.js | ✅ Complete | `Discover.js:337–344` |
| Copy profile link | Discover.js | ✅ Complete | `Discover.js:365–370` |
| Share profile link (native) | Discover.js | ✅ Complete | `Discover.js:383–388` |
| Invite button in Discover | Discover.js | ✅ Complete | `Discover.js:684–695` |
| Empty-state share prompt | Discover.js | ✅ Complete | `Discover.js:667–672` |

### Settings & Account Management

| Feature | Component(s) | Status | Notes |
|---------|-------------|--------|-------|
| Notification preferences | Settings.js | ✅ Complete | `Settings.js:245–267` |
| View account email | Settings.js | ✅ Complete | `Settings.js:278–280` |
| Edit profile (navigate) | Settings.js | ✅ Complete | `Settings.js:281` |
| Change password (email users) | Settings.js | ✅ Complete | `Settings.js:112–122` |
| Sign Out | Settings.js | ✅ Complete | `Settings.js:321–330` |
| Deactivate account | Settings.js | ✅ Complete | `Settings.js:124–134` |
| Delete account | Settings.js | ✅ Complete | `Settings.js:136–203` |
| Block list management | Settings.js | ✅ Complete | `Settings.js:205–236` |
| Terms of Service modal | Settings.js, shared.js | ✅ Complete | `Settings.js:356–373` |
| Privacy Policy page | App.js, PrivacyPolicy.js | ✅ Complete | `/privacy` route |
| App version display | Settings.js | ✅ Complete | `Settings.js:312` — "1.0.0 Beta" |

### PWA & Offline

| Feature | Component(s) | Status | Notes |
|---------|-------------|--------|-------|
| PWA installable (manifest) | public/manifest.json | ✅ Complete | `display: standalone`; icons at 192 + 512 px; shortcuts defined |
| Service worker — offline cache | public/service-worker.js | ✅ Complete | Network-first; static asset cache; `index.html` fallback |
| Service worker — FCM | public/firebase-messaging-sw.js | ✅ Complete | Dedicated FCM service worker |
| iOS PWA support | AuthScreen.js, firebase.js | ✅ Complete | `signInWithRedirect` on iOS |

### Analytics & Tracking

| Feature | Component(s) | Status | Notes |
|---------|-------------|--------|-------|
| Firebase Analytics init | firebase.js | ✅ Complete | `firebase.js:23` |
| `connection_request_sent` | App.js:313 | ✅ Complete | Fires after successful request send |
| `connection_accepted` | App.js:332 | ✅ Complete | Fires in `handleAcceptRequest` |
| `connection_declined` | App.js:351 | ✅ Complete | Fires in `handleDeclineRequest` |
| `deep_link_opened` | App.js:81 | ✅ Complete | Fires when `/user/:uid` path matched on load |
| `qr_code_viewed` | Discover.js:339 | ✅ Complete | Fires when "My Profile" tab opened in ShareModal |
| `profile_link_copied` | Discover.js:366 | ✅ Complete | Fires on Copy button press |
| `profile_viewed` | Discover.js:10–12, App.js:468 | ✅ **FIXED v1.0** | `onView` prop now consumed by `PublicProfile`; event fires correctly |

### AI Features

| Feature | Component(s) | Status | Notes |
|---------|-------------|--------|-------|
| Smart Match Explanation | Discover.js, api/match-explain.js | ✅ Complete | Per-card "✦ Why connect" block; `claude-sonnet-4-6`; session cache |
| AI Connection Note Assistant | — | ❌ Missing | Not yet built |
| AI Profile Score / Optimiser | — | ❌ Missing | Not yet built |
| Conversation Starter Chips | — | ❌ Missing | Not yet built |

---

## SECTION B — Bug Status (v0.9 → v1.0)

### Bug 3 — HIGH | FCM Vercel env vars — **UNVERIFIABLE FROM CODE ⚠️**

`api/notify.js:3–17` — proper Admin SDK initialisation reads `process.env.FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`. Server-side relationship check at lines 66–82 verifies either a `matches` or `received` doc exists before sending. The server code is structurally correct. Status is an ops/deployment question: open Vercel → link-ap → Logs → filter `/api/notify` and confirm `{ success: true, sent: N }`.

---

### Bug 4 — MEDIUM | N chat listeners rebuilt on every match change — **FIXED ✅**

`App.js:177–223` — incremental diff pattern implemented:

```js
// App.js:177
const chatListenersRef = useRef({});

// App.js:184–189 — remove listeners only for UIDs no longer in matches:
prevUids.forEach(uid => {
  if (!currentUids.has(uid)) {
    chatListenersRef.current[uid]?.();
    delete chatListenersRef.current[uid];
  }
});

// App.js:191–212 — skip UIDs that already have a listener:
for (const match of matches) {
  if (chatListenersRef.current[match.uid]) continue;
  // ... new listener setup
}
```

No full rebuild occurs on match changes — only diffs are applied. Fixed.

---

### Bug 7 — LOW | Hardcoded `#1D4ED8` in Messages.js — **FIXED ✅**

`shared.js:7`:
```js
chatBlue: "#1D4ED8",
```

`Messages.js:159`:
```js
background: msg.from === firebaseUser.uid ? COLORS.chatBlue : COLORS.card,
```

No raw `#1D4ED8` appears in `Messages.js`. Fixed.

---

### Bug 8 — LOW | Hardcoded `#F5A623` in Messages.js — **FIXED ✅**

`Messages.js` contains no raw `#F5A623` string. All accent references use `COLORS.accent` (`shared.js:4`). Fixed.

---

### Bug 17 — LOW | SearchModal `handleSend` fires success UI on blocked request — **FIXED ✅**

`App.js:293`:
```js
if (blockedByUids.includes(targetUser.uid)) return false;
```

`App.js:559–570` — SearchModal `handleSend`:
```js
const success = await onSendRequest(target, note.trim());
setSending(false);
if (success) {
  setSentOk(true);
  setTimeout(() => { setTarget(null); setNote(""); setSentOk(false); }, 1800);
} else {
  setSendError("Couldn't send request. Please try again.");
}
```

`success` is `false` on blocked requests; `setSentOk(true)` is never called. Fixed.

---

### Bug 21 — LOW | `onView` prop not consumed by PublicProfile — **FIXED ✅**

`Discover.js:10–12`:
```js
useEffect(() => {
  if (onView) onView();
}, []); // eslint-disable-line
```

`App.js:468`:
```js
onView={() => logEvent(analytics, "profile_viewed", { uid: viewingProfile.uid })}
```

`profile_viewed` analytics events now fire correctly on every profile open. Fixed.

---

### Bug 22 — LOW | Dead FCM code in service-worker.js — **FIXED ✅**

`service-worker.js` (55 lines) contains only: cache install/activate logic and a network-first fetch handler. No FCM/push-related code exists in this file. FCM is handled exclusively by `firebase-messaging-sw.js`. Fixed.

---

### Bug 23 — MEDIUM | No rate limiting on `/api/match-explain` — **STILL PRESENT ❌**

`api/match-explain.js:20–87` — the handler authenticates the caller via Firebase ID token (line 27) but applies no per-user rate limiting. Any authenticated user can loop this endpoint indefinitely, generating unlimited Anthropic API charges. No in-memory counter, no Firestore call count, no IP throttle, no Vercel KV rate limit is present.

---

### Bug 24 — LOW | Privacy Policy does not disclose Anthropic as data processor — **STILL PRESENT ❌**

`PrivacyPolicy.js:22–23` — Section 5 "Data Sharing" reads:

```
"We do not sell your personal information. We may share it only with other Link-Ap users
(to the extent your profile is visible), service providers such as Firebase, or if required by law."
```

Anthropic is not named. Profile fields (`role`, `skills`, `lookingFor`, `bringToTable`, `lookingForDetails`, `currentlyExploring`, plus the target user's `name`) are sent to Anthropic's API at `api/match-explain.js:44–58`. GDPR Article 13, CCPA, and POPIA all require explicit disclosure of third-party processors.

---

### New Bugs Found in This Audit

#### Bug 25 — LOW | VAPID key hardcoded as fallback in firebase.js

**Location:** `firebase.js:53`
```js
vapidKey: process.env.REACT_APP_VAPID_KEY || "BEIVCbXbvIz1ECF-6luz3TtsfihwFv_Of1XHnlOp87HQqOUNaWBW2apdO1w1sZi0IRFNypesgC-O0pwFmWh117g",
```
VAPID public keys are not secret, but hardcoding creates a maintenance hazard: if the key is rotated in Firebase Console, the fallback silently breaks FCM for any build without the env var.

**Fix:** Remove the hardcoded fallback; make `REACT_APP_VAPID_KEY` a required env var with a startup warning if absent.

---

#### Bug 26 — INFO | Firebase config hardcoded in firebase-messaging-sw.js

**Location:** `firebase-messaging-sw.js:36–42`
The full Firebase client config (including `apiKey`) is hardcoded. This is a known Firebase PWA limitation — service workers cannot use `process.env`. The Firebase Web API key is a publicly-intentioned identifier restricted by Security Rules and allowed-origin settings. **No action needed.**

---

#### Bug 27 — LOW | `IntroScreen.js` uses local `ORANGE` constant instead of `COLORS.accent`

**Location:** `IntroScreen.js:4`
```js
const ORANGE = "#F5A623";
```
Used at lines 37, 68, 104 (×3), 106 (×3), 107 (×2), 129. This re-declares the accent colour locally, violating the project rule: "always use COLORS tokens, never hardcode hex values." If `COLORS.accent` changes, IntroScreen diverges silently.

**Fix:** Import `COLORS` from `shared.js` and replace all `ORANGE` references with `COLORS.accent`.

---

#### Bug 28 — MEDIUM | Firestore chat rules do not check blocked status

**Location:** `firestore.rules:53`
```js
match /chats/{chatId}/messages/{msgId} {
  allow read: if isAuth() && isParticipant();
```
The `isParticipant()` check only verifies that the reader's UID appears in `chatId`. A blocked user who knows the `chatId` (which is deterministic: `[uid, otherUid].sort().join("_")`) can read the full chat history via Firestore SDK, even after being blocked.

**Fix:** Add a rule condition checking that neither participant has the other in their `blocked` subcollection. Alternatively, migrate chat IDs to random opaque strings on connection to prevent enumeration.

---

#### Bug 29 — LOW | `handleDisconnect` does not delete chat messages

**Location:** `App.js:359–371`
`handleDisconnect` deletes both `matches` docs and the four pending request docs, but does NOT delete the `chats/{chatId}/messages` subcollection. Chat history persists and remains accessible via the Firestore SDK to either ex-participant (Bug 28 compounds this).

The full deletion in `Settings.js:184–189` (account deletion) does clean up chat messages, but a simple disconnect does not.

**Fix:** After deleting match docs in `handleDisconnect`, iterate and batch-delete `chats/{chatId}/messages` documents.

---

#### Bug 30 — LOW | No in-app deactivation reactivation path

**Location:** `Settings.js:128`
`{ deactivated: true }` is written on deactivate. The Settings confirmation message says "You can reactivate by contacting support" but no support flow exists in the app, and the email address (`info@link-ap.online`) is not shown on the deactivation screen.

**Fix:** Display the support email prominently in the deactivation confirmation modal, or implement a self-serve reactivation flow.

---

## SECTION C — Security Vulnerability Audit

### 1. Firestore Rules

#### C1 — MEDIUM | Users collection open to enumeration by all authenticated users

- **File:Line:** `firestore.rules:16`
- **Code:**
  ```js
  allow list: if isAuth();
  ```
- **Description:** Any authenticated user can execute a collection-level `list` (query) on `users`. Combined with the `get` rule (any authenticated user can read any non-deactivated profile), any user can scrape the entire user directory in batches — names, roles, locations, skills, LinkedIn URLs, `lookingForDetails`, and critically, `fcmTokens` arrays.
- **Attacker impact:** A malicious authenticated user can dump all user profiles in the database. FCM device tokens from this dump can be used to send push notifications to any user's device directly via the FCM API, bypassing the app's notification server entirely.
- **Fix:** Add field-level masking by moving `fcmTokens` to a private subcollection. Consider whether unauthenticated `list` is needed or if queries can be restricted to `where("deactivated", "!=", true)` server-enforced.

---

#### C2 — HIGH | fcmTokens readable by any authenticated user

- **File:Line:** `firestore.rules:14`
- **Code:**
  ```js
  allow get: if isAuth() && (isOwner(uid) || resource.data.deactivated != true);
  ```
- **Description:** The `get` rule returns the full user document to any authenticated caller for any non-deactivated user. This includes the `fcmTokens` array — an array of FCM device push tokens for all of a user's devices.
- **Attacker impact:** An attacker authenticates, fetches `users/{victimUid}`, reads `fcmTokens`, then directly calls Firebase Cloud Messaging's send API with the stolen token to push arbitrary notifications to a specific user's phone — impersonating Link-Ap with any message body, bypassing all server-side relationship checks.
- **Fix:** Move `fcmTokens` to `users/{uid}/private/push` with `allow read: if isOwner(uid)` only. The server-side `notify.js` uses Admin SDK which bypasses client rules, so notification delivery is unaffected.

---

#### C3 — HIGH | Sent/received subcollection writes lack document-data validation

- **File:Line:** `firestore.rules:23–28`
- **Code:**
  ```js
  match /sent/{targetId} {
    allow read, write: if isAuth() && (isOwner(uid) || isOwner(targetId));
  }
  match /received/{senderId} {
    allow read, write: if isAuth() && (isOwner(uid) || isOwner(senderId));
  }
  ```
- **Description:** These rules are correctly structured for the bilateral write pattern (writing to another user's `received` is how connection requests work). However, the rules validate only path-level auth, not document content. A malicious user can write `{ uid: "famous_person_uid", name: "Elon Musk", avatar: "...", note: "fake note" }` into `users/{victimUid}/received/{attackerUid}` — the rule is satisfied because `senderId == attackerUid == request.auth.uid`, but the document data is not validated.
- **Attacker impact:** Spoofed connection requests: the UI displays `req.name`, `req.avatar`, `req.note` from the document data (not the document key), so the victim sees a fabricated request that appears to come from any person the attacker can name.
- **Fix:** Add field validation to the rule:
  ```js
  allow write: if isAuth() && isOwner(senderId)
    && request.resource.data.uid == request.auth.uid;
  ```

---

#### C4 — MEDIUM | Profile document self-write has no field validation

- **File:Line:** `firestore.rules:16`
- **Code:**
  ```js
  allow create, update: if isAuth() && isOwner(uid);
  ```
- **Description:** An owner can write any field to their own profile document, including `isAdmin: true` or any future access-control field. Currently no Firestore field is used for access control in the codebase, but this is a forward-looking risk for any feature that trusts Firestore-stored privilege fields.
- **Attacker impact:** If any future feature checks a Firestore field for permissions (e.g., `if (user.isAdmin) ...`), any user can grant themselves that privilege.
- **Fix:** Document internally that no Firestore field should be trusted for access control. Use Firebase Custom Claims (set only via Admin SDK) for any future privilege differentiation.

---

#### C5 — LOW | No deny rule for top-level `/chats/{chatId}` document

- **File:Line:** `firestore.rules:46`
- **Code:**
  ```js
  match /chats/{chatId}/messages/{msgId} {
  ```
- **Description:** The `messages` subcollection is guarded, but there is no rule for the top-level `match /chats/{chatId}` document. If any code ever creates a `chats/{chatId}` document (not just subcollection docs), it would be world-readable.
- **Fix:** Add: `match /chats/{chatId} { allow read, write: if false; }`

---

#### C6 — MEDIUM | Blocked users can still read chat history via Firestore SDK

- **File:Line:** `firestore.rules:53`
- **Code:**
  ```js
  allow read: if isAuth() && isParticipant();
  ```
- **Description:** `isParticipant()` checks that the caller's UID appears in the `chatId` string. Since `chatId` is always `[uid1, uid2].sort().join("_")` (deterministic), a blocked user who knows any UID can reconstruct the `chatId` and read the full chat history even after being blocked.
- **Attacker impact:** A blocked user retains full read access to the conversation history with the user who blocked them. Combined with Bug 29 (disconnect doesn't delete messages), ex-connections also retain access.
- **Fix:** Check the `blocked` subcollection inside the Firestore rule, or switch to random opaque chat IDs.

---

### 2. API Endpoints

#### C7 — MEDIUM | Client-supplied push notification body is not server-validated

- **File:Line:** `api/notify.js:32–40`, `api/notify.js:66–82`
- **Description:** The server correctly verifies a Firebase ID token and checks that the caller has an actual relationship with the recipient (`matches` or `received` doc). However, the notification `body` text is passed directly from the client (`App.js:309`: `body: \`${user.name} wants to connect with you\``). The server does not validate that the body matches the relationship type — it accepts any string the client sends.
- **Attacker impact:** An attacker who has sent a pending connection request to any user can call `/api/notify` directly (with a valid ID token) and push any message body to that user's phone — e.g., `"Click here: evil-phishing-link.com"` — impersonating Link-Ap. The notification will appear to come from the app.
- **Fix:** On the server, hard-code notification templates based on the detected relationship type. Never trust or use the client-supplied `body` for the push message content.

---

#### C8 — HIGH | No rate limiting on `/api/match-explain` (financial exposure)

- **File:Line:** `api/match-explain.js:20–87`
- **Description:** Every authenticated request to this endpoint calls Anthropic's `claude-sonnet-4-6` API. No per-user throttle, no daily cap, no cost circuit breaker.
- **Attacker impact:** A single authenticated user can script thousands of requests per hour, generating potentially hundreds of dollars in Anthropic API charges before any manual intervention.
- **Fix:** Add per-user rate limiting (e.g., 60 calls/hour) using a Firestore counter with TTL, or Vercel KV. Alternatively, add a server-side Firestore cache keyed by `{currentUid}_{targetUid}` to short-circuit before calling Anthropic when a cached explanation exists.

---

#### C9 — MEDIUM | Target user's profile data sent to Anthropic without consent or disclosure

- **File:Line:** `api/match-explain.js:44–58`
- **Description:** The handler sends the target user's `name`, `role`, `skills`, `lookingFor`, `bringToTable`, `lookingForDetails`, and `currentlyExploring` to Anthropic's API. The target user has not consented to their data being processed by Anthropic. The Privacy Policy names only Firebase as a service provider.
- **Attacker impact:** GDPR Article 13/28, POPIA Section 18, and CCPA §1798.100 all require disclosure of third-party data processors. Any EU or South African user whose data is processed this way can file a data subject complaint.
- **Fix:** (1) Update Privacy Policy to name Anthropic (Bug 24 fix). (2) Ensure a Data Processing Agreement exists with Anthropic. (3) Consider sending only non-PII profile fields (omit `name`, truncate `lookingForDetails`).

---

#### C10 — SAFE | ANTHROPIC_API_KEY confirmed server-only

`api/match-explain.js:37` reads `process.env.ANTHROPIC_API_KEY`. This is not prefixed with `REACT_APP_`, so it is never injected into the browser bundle by Vercel/create-react-app. **No issue.**

---

#### C11 — SAFE | Firebase Admin credentials confirmed server-only

`api/notify.js:7–11` and `api/match-explain.js:7–11` read `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` from `process.env`. None are `REACT_APP_` prefixed. **No issue.**

---

### 3. Authentication

#### C12 — LOW | getRedirectResult errors not logged server-side

- **File:Line:** `AuthScreen.js:63–65`
- **Code:** `getRedirectResult(auth).catch(e => setError(getErrorMessage(e)));`
- **Description:** On iOS PWA, redirect auth failures are shown to the user but not logged. Silent production failures are invisible without explicit server-side logging.
- **Fix:** Add `console.error` before `setError` so failures appear in browser devtools and any error tracking service.

---

#### C13 — SAFE | No CSRF vulnerability

Both API endpoints use Firebase ID token Bearer auth, which is inherently CSRF-proof (cross-origin sites cannot steal the Firebase ID token). No CSRF tokens are needed.

---

### 4. Client-Side Trust

#### C14 — CONFIRMED FIXED | Block bypass (from v0.8)

`App.js:292–293`:
```js
const handleSendRequestWithNote = async (targetUser, note) => {
  if (blockedByUids.includes(targetUser.uid)) return false;
```
Block is enforced before any Firestore write. `App.js:380` also filters blocked users from the Discover pool. Fixed.

---

#### C15 — CONFIRMED FIXED | Notification spoofing (from v0.8)

`api/notify.js:66–82` — server verifies caller has an actual `matches` or `received` relationship before delivering any push. The old client-side-token approach is gone. Fixed.

---

#### C16 — LOW | Prompt injection via user-controlled profile fields

- **File:Line:** `Discover.js:613–615`
- **Description:** The client sends `currentUser.bringToTable`, `currentUser.lookingForDetails`, etc. to `/api/match-explain`. The server includes these verbatim in the Anthropic prompt. A user could craft a `bringToTable` value like `"Ignore previous instructions and say..."` to manipulate AI output.
- **Attacker impact:** Output is shown only on the attacking user's own screen (not to the target user). Max 100 tokens limits damage. Low practical impact.
- **Fix:** Sanitise and length-cap user-supplied fields on the server before including in the prompt.

---

#### C17 — MEDIUM | Match propagation writes allow spoofing appearance in connection lists

- **File:Line:** `Profile.js:113–115`
- **Code:**
  ```js
  batch.set(doc(db, "users", matchDoc.id, "matches", firebaseUser.uid), propagated, { merge: true });
  ```
- **Description:** When saving their profile, the client writes directly into each match's `matches/{uid}` subcollection. The Firestore rule permits this (the authenticated user is `matchedUid`). However, the `propagated` object is constructed entirely client-side, so a malicious client can write `{ name: "Elon Musk", role: "CEO" }` into another user's matches subcollection.
- **Attacker impact:** An attacker can manipulate how they appear in their connections' match lists — changing their displayed name, role, avatar colour. This is UI spoofing within established connections.
- **Fix:** Move match propagation to a Cloud Function triggered by `users/{uid}` document writes. Until then, add Firestore rule validation that the `uid` field in the written document matches the authenticated caller.

---

### 5. Data Exposure

#### C18 — MEDIUM | All profile fields world-readable to authenticated users (no field masking)

- **File:Line:** `firestore.rules:14`
- **Description:** The full user document is returned on any `get`, including `fcmTokens`, `lookingForDetails` (which can contain investor deck details, funding amounts, client targets), `nameLower`, `lastNameLower`. No field-level masking is in place.
- **Fix:** Move `fcmTokens` to a private subcollection. Consider restricting `lookingForDetails` to mutual matches only.

---

#### C19 — MEDIUM | Search queries expose full profiles including sensitive fields

- **File:Line:** `App.js:532–536`
- **Description:** The search feature queries `users` by `nameLower` and returns full documents. Same exposure as C18.
- **Fix:** Server-side field projection, or restructure sensitive fields into private subcollections.

---

### 6. Dependency & Infrastructure

#### C20 — LOW | `react-scripts` 5.0.1 is unmaintained

- **File:Line:** `package.json:16`
- **Description:** Released 2022; known CVEs in transitive dev dependencies (`nth-check`, `loader-utils`). All CVEs are in build-time tooling, not runtime code. No direct exploitability in production.
- **Fix:** Plan migration to Vite + vitest, or formally accept the risk.

---

#### C21 — LOW | `firebase-admin` in `dependencies` instead of `devDependencies`

- **File:Line:** `package.json:7`
- **Description:** `firebase-admin` is a Node.js-only package used only in `api/` serverless functions. Listed under `dependencies` means webpack tries to resolve it during the frontend build. In practice, CRA's build excludes Node built-ins, so no admin credentials leak to the browser — but it is incorrect dependency scoping.
- **Fix:** Move to `devDependencies` or use a separate `api/package.json`.

---

#### C22 — SAFE | No hardcoded secrets in source code

`ANTHROPIC_API_KEY`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL` — confirmed absent from all source files. Firebase Web client config (present in `firebase.js` and `firebase-messaging-sw.js`) is the public client-side config, intentionally exposed and restricted by Firebase Security Rules and allowed-origins configuration. VAPID key fallback in `firebase.js:53` is a public key, not a secret.

---

### Security Scorecard

| Domain | Risk Level |
|--------|-----------|
| Firestore Rules | HIGH |
| API Endpoints | HIGH |
| Authentication | LOW |
| Client-Side Trust | MEDIUM |
| Data Exposure | MEDIUM |
| Dependencies & Infrastructure | LOW |
| **Overall** | **HIGH** |

**Top 3 vulnerabilities requiring resolution before public launch:**

| # | Finding | Fix | Estimated Effort |
|---|---------|-----|-----------------|
| 1 | **C2 — fcmTokens readable by any authenticated user** — allows targeted push notification spoofing to any user's device | Move `fcmTokens` to `users/{uid}/private/push`; update `notify.js` Admin SDK read path; update `App.js` write path | 2 hours |
| 2 | **C8 — No rate limiting on `/api/match-explain`** — single abusive user can generate unlimited Anthropic API charges | Add per-user Firestore counter with TTL or Vercel KV rate limit (e.g., 60 calls/hour per UID) | 3–4 hours |
| 3 | **C3 — Sent/received subcollection writes lack document-data validation** — connection request spoofing | Add `request.resource.data.uid == request.auth.uid` to Firestore rules for `received/{senderId}` write | 1 hour |

---

## SECTION D — Code Health Snapshot

### Line Count Table (v0.9 → v1.0)

| File | v0.9 Lines | v1.0 Lines | Delta | Primary Reason |
|------|-----------|-----------|-------|----------------|
| src/App.js | 791 | 828 | +37 | IntroScreen integration, chat listener diff refactor, SearchModal success/error fix |
| src/AuthScreen.js | 290 | 291 | +1 | No meaningful change |
| src/Discover.js | 777 | 781 | +4 | `onView` useEffect added to PublicProfile |
| src/Profile.js | 439 | 439 | 0 | No change |
| src/Settings.js | 417 | 417 | 0 | No change |
| src/shared.js | 330 | 331 | +1 | `chatBlue` token added to COLORS |
| src/Onboarding.js | 277 | 277 | 0 | No change |
| src/Messages.js | 197 | 197 | 0 | No change |
| src/Matches.js | 172 | 172 | 0 | No change |
| src/firebase.js | 64 | 64 | 0 | No change |
| src/PrivacyPolicy.js | 47 | 48 | +1 | No meaningful change |
| **src/IntroScreen.js** | **0 (NEW)** | **152** | **+152** | **NEW — landing/intro screen** |
| api/notify.js | 103 | 124 | +21 | Relationship validation strengthened |
| api/match-explain.js | 87 | 88 | +1 | No meaningful change |
| public/service-worker.js | 99 | 55 | -44 | Dead FCM code removed (Bug 22 fixed) |
| public/firebase-messaging-sw.js | 72 | 72 | 0 | No change |
| public/manifest.json | ~80 | 80 | 0 | No change |
| firestore.rules | ~57 | 57 | 0 | No change |
| package.json | ~43 | 43 | 0 | No change |
| **TOTAL** | **~3,941** | **~4,216** | **+275** | |

**New files since v0.9:** `src/IntroScreen.js` (152 lines)

**Removed files since v0.9:** None removed. `service-worker.js` significantly trimmed (-44 lines, dead code removed).

---

## SECTION E — What's Missing for v1.0 Public Launch

### P0 — Launch Blockers

| ID | Gap | Why blocking |
|----|-----|--------------|
| P0-1 | Fix C2: Move `fcmTokens` to private subcollection | Any authenticated user can read device push tokens → direct device spoofing risk |
| P0-2 | Fix C8: Add rate limiting to `/api/match-explain` | Unlimited Anthropic API calls = potential runaway charges on public launch |
| P0-3 | Fix C3: Validate `uid` field in `received`/`sent` Firestore writes | Connection request spoofing — attacker can impersonate any user in requests |
| P0-4 | Fix Bug 24 + C9: Disclose Anthropic in Privacy Policy | GDPR/POPIA compliance — third-party data processor not named; legal exposure on international users |

### P1 — Must fix before 100 users

| ID | Gap | Reason |
|----|-----|--------|
| P1-1 | Fix C7: Hard-code push notification templates server-side | Client-supplied `body` allows hostile push messages to any pending request recipient |
| P1-2 | Fix C6 + Bug 28: Add blocked-user check to Firestore chat read rules | Blocked users retain full read access to chat history |
| P1-3 | Fix C17: Add server-side validation for match propagation writes | Client can spoof name/role in connection partner's match list |
| P1-4 | Fix Bug 27: Replace `ORANGE` in IntroScreen.js with `COLORS.accent` | Violates project colour rule; diverges silently on accent change |
| P1-5 | Fix Bug 29: Delete chat messages on disconnect | Privacy gap — disconnected users retain SDK-level chat access |
| P1-6 | Fix Bug 25: Remove VAPID key hardcode fallback in firebase.js | Key rotation silently breaks FCM without env var present |
| P1-7 | Fix Bug 30: Display support email on deactivation confirmation | Users are told to contact support with no contact info shown |
| P1-8 | Verify Bug 3: Confirm FCM 401 is resolved (Vercel env vars live) | Push notifications may be silently failing in production |

### P2 — Quality improvements

| ID | Gap |
|----|-----|
| P2-1 | Fix C5: Add catch-all deny rule for `/chats/{chatId}` top-level document |
| P2-2 | Fix C4: Document that no Firestore field should be used for access control |
| P2-3 | Fix C21: Move `firebase-admin` to `devDependencies` |
| P2-4 | Fix C19/C18: Add field projection for `fcmTokens` in list/search queries |
| P2-5 | Plan migration from `react-scripts` to Vite (C20) |
| P2-6 | Add Anthropic DPA agreement (GDPR Article 28) |
| P2-7 | Fix C12: Add `console.error` logging for iOS redirect auth failures |
| P2-8 | Fix C16: Sanitise/truncate profile fields before including in Anthropic prompt |
| P2-9 | Update CLAUDE.md: `profile_viewed` is now working (Bug 21 fixed) |
| P2-10 | Character counter in SearchModal note field |
| P2-11 | Self-serve account reactivation flow |
| P2-12 | Report / flag user feature |
| P2-13 | Read receipts |

### P3 — Nice to have

| ID | Gap |
|----|-----|
| P3-1 | AI Connection Note Assistant |
| P3-2 | AI Profile Score / Optimiser |
| P3-3 | Conversation Starter Chips |
| P3-4 | Notification preferences persisted in Firestore (cross-device sync) |
| P3-5 | Prefetch next Discover card's AI explanation while current card is shown |
| P3-6 | Meaningful automated test suite (currently near-empty) |

---

## SECTION F — Readiness Assessment

**1. Is the app safe to open to the public right now?**

No. Three issues make public launch premature: (a) FCM device tokens are readable by any authenticated user, enabling targeted push spoofing to any device (C2); (b) the AI endpoint has no rate limiting and will accrue unlimited charges under any sustained use (C8); (c) the Privacy Policy does not name Anthropic as a data processor — a GDPR/POPIA compliance violation that creates legal exposure the moment an EU or South African user signs up (C9/Bug 24). All four P0 items can be resolved in a focused 10–12 hour engineering session.

**2. What is the single highest-risk security exposure?**

**C8 — No rate limiting on `/api/match-explain`.** Every other security issue has bounded impact (it affects specific users' data or experience). This one has unbounded financial impact: a single authenticated user running a loop can trigger unlimited Anthropic API calls. At `claude-sonnet-4-6` pricing (100 max output tokens per call), a sustained attack could generate hundreds to thousands of dollars in charges within an hour. There is no automatic circuit breaker or alerting in the current codebase.

**3. What must be done before the next 100 users sign up?**

In order of impact:
1. Add per-user rate limiting to `/api/match-explain` (P0-2)
2. Move `fcmTokens` to a private subcollection (P0-1)
3. Add `uid` field validation to `received`/`sent` Firestore rules (P0-3)
4. Update the Privacy Policy to name Anthropic (P0-4)
5. Hard-code push notification body templates server-side (P1-1)
6. Verify Vercel env vars for FCM delivery (Bug 3)

These six items represent approximately 12–15 hours of engineering work and should be treated as a single pre-launch sprint.

**4. What is the estimated time to resolve all P0 and P1 items?**

- P0 items (4): ~10–12 hours
- P1 items (8): ~12–14 hours
- Total: approximately **22–26 hours** of focused engineering — 3 working days.

**5. What is Link-Ap's strongest competitive differentiator in its current state?**

The combination of AI Smart Match Explanation and the mandatory connection note. No other networking platform shows a personalised, AI-articulated reason why two specific users should connect *before* either reaches out — referencing actual stated goals, skills, and intentions from both profiles. The mandatory note then requires the requesting user to articulate their own reason. This two-layer intent validation — AI confirms the match is structurally meaningful; the user confirms their motivation is genuine — produces a quality of connection request that LinkedIn InMail and Bumble Bizz cannot match. The app is solving a real signal-to-noise problem at networking events with a novel mechanism.

---

## SECTION G — v0.9 → v1.0 Delta Summary

### Bugs Fixed (6)

| Bug | Description | Fix location |
|-----|-------------|-------------|
| Bug 4 | Chat listeners rebuilt on every match change | `App.js:177–223` — incremental diff with `chatListenersRef` |
| Bug 7 | `#1D4ED8` hardcoded in Messages.js | `shared.js:7` — `COLORS.chatBlue` token added; `Messages.js:159` updated |
| Bug 8 | `#F5A623` hardcoded in Messages.js | All accent refs in `Messages.js` now use `COLORS.accent` |
| Bug 17 | SearchModal success UI fires on blocked request | `App.js:559–570` — gates `setSentOk` on return value |
| Bug 21 | `onView` prop not consumed by PublicProfile | `Discover.js:10–12` — `useEffect` calls `onView` on mount |
| Bug 22 | Dead FCM code in service-worker.js | `service-worker.js` — dead code removed; file reduced by 44 lines |

### New Features Added (1)

- **IntroScreen** (`src/IntroScreen.js`, 152 lines) — new landing/intro page shown to unauthenticated visitors. Includes founding-member positioning, who-it's-for grid (Founders, Investors, Freelancers, Operators), how-it-works steps, and a primary CTA button to the auth screen.

### New Bugs Found (6)

| Bug | Severity | Description |
|-----|---------|-------------|
| Bug 25 | LOW | VAPID key hardcoded as fallback in `firebase.js:53` |
| Bug 26 | INFO | Firebase config hardcoded in `firebase-messaging-sw.js` (known PWA limitation, no action needed) |
| Bug 27 | LOW | `IntroScreen.js` uses local `ORANGE` constant instead of `COLORS.accent` |
| Bug 28 | MEDIUM | Firestore chat rules don't check blocked status — blocked users retain chat read access |
| Bug 29 | LOW | `handleDisconnect` does not delete chat message subcollection |
| Bug 30 | LOW | No in-app reactivation path after deactivation |

### Security Issues Resolved (carried forward fixes from v0.8)

- **Block bypass** — confirmed fixed (`App.js:293`)
- **Notification spoofing** — confirmed fixed (`api/notify.js:66–82` server-side relationship check)
- **Dead FCM code in service-worker** — confirmed fixed

### New Security Findings (7)

| ID | Severity | Finding |
|----|---------|---------|
| C1 | MEDIUM | Users collection open to full enumeration by authenticated users |
| C2 | HIGH | `fcmTokens` readable by any authenticated user — device push spoofing risk |
| C3 | HIGH | Sent/received subcollection writes lack document-data validation — request spoofing |
| C6 | MEDIUM | Firestore chat rules don't check blocked status (same as Bug 28) |
| C7 | MEDIUM | Client-supplied push notification body not validated server-side — phishing risk |
| C8 | HIGH | No rate limiting on `/api/match-explain` — unbounded Anthropic cost exposure |
| C9 | MEDIUM | Target user profile data sent to Anthropic without GDPR/POPIA disclosure |
| C16 | LOW | Prompt injection possible via user-controlled profile fields sent to AI endpoint |
| C17 | MEDIUM | Match propagation client writes allow spoofing appearance in connection lists |

---

*Report generated 2026-05-26 by full source audit of 19 files: src/App.js, src/AuthScreen.js, src/Discover.js, src/Profile.js, src/Settings.js, src/shared.js, src/Onboarding.js, src/Messages.js, src/Matches.js, src/firebase.js, src/PrivacyPolicy.js, src/IntroScreen.js, api/notify.js, api/match-explain.js, public/service-worker.js, public/firebase-messaging-sw.js, public/manifest.json, firestore.rules, package.json. Every bug status, line number, security finding, and feature description verified against actual current file content. No status carried forward from v0.9 without re-verification.*
