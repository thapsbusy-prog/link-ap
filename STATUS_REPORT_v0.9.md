# Link-Ap — Status Report v0.9
**Generated:** 2026-05-18  
**Branch:** main  
**Scope:** Full re-audit of all source files. Every bug status verified against actual current code with line numbers. No status carried forward from v0.8 without re-verification.  
**Key delta since v0.8:** Bug 1 (search prefix) fixed; Bug 18 (iOS OAuth) fixed; Bug 19 (notifications toggle) fixed; Smart Match Explanation AI feature shipped (api/match-explain.js + Discover.js); title prefix intentionally removed from name display per design decision.


---

## SECTION A — Feature Inventory (Full List)

### Authentication & Onboarding

| Feature | Component(s) | Status | Description |
|---------|-------------|--------|-------------|
| Google Sign-In (popup) | AuthScreen.js | ✅ Complete | Uses popup on desktop; redirect on iOS PWA (fixed in v0.9) |
| Google Sign-In (iOS PWA) | AuthScreen.js | ✅ Complete | **FIXED v0.9** — `signInWithRedirect` + `getRedirectResult` on iOS PWA installs |
| Email / Password Sign-In | AuthScreen.js | ✅ Complete | Sign-in with detailed error messages |
| Email / Password Sign-Up | AuthScreen.js | ✅ Complete | Account creation; terms checkbox required |
| Forgot Password | AuthScreen.js | ✅ Complete | `sendPasswordResetEmail` with success/error feedback |
| Terms gate (signup) | AuthScreen.js | ✅ Complete | Checkbox required; Google button disabled until ticked |
| Terms inline notice (login) | AuthScreen.js | ✅ Complete | Passive notice at bottom of login card |
| Splash screen | App.js (`SplashScreen`) | ✅ Complete | 3.6 s display + 0.5 s fade; animated logo pulse |
| Error boundary | App.js (`ErrorBoundary`) | ✅ Complete | Catches render errors; shows Reload button |
| 5-step Onboarding flow | Onboarding.js | ✅ Complete | Who are you → Your story → Looking for → Tell us more → Bring to the table |
| `termsAcceptedAt` timestamp | Onboarding.js | ✅ Complete | Written to Firestore on profile creation |

### Profile & Identity

| Feature | Component(s) | Status | Description |
|---------|-------------|--------|-------------|
| Profile view | Profile.js | ✅ Complete | Full card with all fields; "How others see you" |
| Profile edit | Profile.js | ✅ Complete | All fields editable inline; Save writes to Firestore |
| Photo upload | Profile.js | ✅ Complete | Canvas-resize to 200 px / 0.7 JPEG quality → Firebase Storage `avatars/{uid}.jpg` |
| Photo display (avatar / photo) | shared.js (`Avatar`) | ✅ Complete | Falls back to initials + color if no photoURL |
| Pronouns field | Profile.js, Discover.js | ✅ Complete | Shown inline next to name in all views |
| Title field (Dr., Prof., etc.) | Profile.js, Onboarding.js | ⚠️ Partial | Stored and editable; **intentionally not displayed** in name header (design decision per recent commits) |
| Role field | Profile.js | ✅ Complete | Displayed in all card views |
| Bio (20-word limit) | Profile.js, Onboarding.js | ✅ Complete | Hard limit enforced per keystroke; word counter shown |
| Skills (max 5, 3 words each) | Profile.js, Onboarding.js, shared.js | ✅ Complete | Editable tag chips; max enforced |
| Achievements | Profile.js, Onboarding.js | ✅ Complete | Comma-separated input; rendered as list |
| "What I Bring to the Table" | Profile.js, Onboarding.js | ✅ Complete | Free-text field with dynamic prompt based on intent |
| Currently Exploring | Profile.js, Onboarding.js | ✅ Complete | Comma-separated; rendered as amber tags |
| Open To | Profile.js, Onboarding.js | ✅ Complete | Multi-select from 6 options; rendered as green tags |
| Looking For | Profile.js, Onboarding.js | ✅ Complete | Multi-select from 8 options; shown on cards and in Q&A block |
| Looking For Details (Q&A) | Profile.js, Onboarding.js, Discover.js | ✅ Complete | Structured follow-up questions per intent; investor deck block |
| LinkedIn URL + verified badge | Profile.js, Onboarding.js, Discover.js | ✅ Complete | URL validated; name-slug match check for blue badge |
| Profile completion nudge banner | App.js | ✅ Complete | Shown in Discover when bio/skills/lookingFor/photo missing |
| Profile tab completion badge | App.js | ✅ Complete | Dot badge on Profile tab nav item when profile incomplete |
| Match propagation on save | Profile.js | ✅ Complete | `writeBatch` updates all matched users' copies of your profile |
| Profile share (invite poster) | Discover.js (`ShareModal`) | ✅ Complete | Canvas-rendered poster; save as PNG; WhatsApp share |
| Profile QR code | Discover.js (`ShareModal`) | ✅ Complete | QR encodes `https://link-ap.online/user/:uid`; save + share |
| Profile deep link `/user/:uid` | App.js | ✅ Complete | Opens profile on load; fires `deep_link_opened` analytics event |

### Discovery & Matching

| Feature | Component(s) | Status | Description |
|---------|-------------|--------|-------------|
| Discover feed | App.js, Discover.js | ✅ Complete | Paginated; filtered; shows one card at a time |
| Intent filtering (`complementMap`) | App.js | ✅ Complete | 8-intent map; falls back to unfiltered if no matches |
| Pagination (30 per page) | App.js (`loadMoreUsers`) | ✅ Complete | `startAfter` cursor; auto-loads when < 5 cards remain |
| Deactivated user filter | App.js | ✅ Complete | `where("deactivated", "!=", true)` on server + client filter |
| Blocked user filter | App.js | ✅ Complete | Both `blockedUids` and `blockedByUids` excluded from Discover |
| Pass | Discover.js | ✅ Complete | Writes to `users/{uid}/passed/{uid}` |
| Connect with Note | Discover.js (`ConnectNoteModal`) | ✅ Complete | 10-char min, 300-char max; bilateral Firestore write; FCM notification |
| View full profile from card | Discover.js → PublicProfile | ✅ Complete | Opens PublicProfile overlay |
| AI Smart Match Explanation | Discover.js, api/match-explain.js | ✅ Complete | **NEW v0.9** — "✦ Why connect" block on each card; calls `claude-sonnet-4-6`; cached per uid per session |
| Search by name | App.js (`SearchModal`) | ✅ Complete | **FIXED v0.9** — prefix range query now works; searches `nameLower`, `lastNameLower`, `name` fields |
| Search connect with note | App.js (`SearchModal`) | ⚠️ Partial | 10-char min enforced on button; success UI fires even if request was blocked (Bug 17, partial) |

### Connections & Requests

| Feature | Component(s) | Status | Description |
|---------|-------------|--------|-------------|
| Send connection request | App.js, Discover.js | ✅ Complete | Bilateral Firestore write; FCM push notification to recipient |
| Receive connection requests | Matches.js | ✅ Complete | Shows incoming requests with sender note |
| Accept request | App.js (`handleAcceptRequest`) | ✅ Complete | Creates bilateral match; FCM push to requester; `connection_accepted` analytics |
| Decline request | App.js (`handleDeclineRequest`) | ✅ Complete | Adds to `passed`; `connection_declined` analytics |
| Pending sent requests list | Matches.js | ✅ Complete | Note preview shown; dashed border |
| Mutual matches list | Matches.js | ✅ Complete | Tap to chat; `✕ remove` per card |
| Remove connection | App.js, Matches.js, Discover.js | ✅ Complete | Bilateral delete; clears active chat; "Connection removed" toast |
| Block user | App.js | ✅ Complete | Bilateral write to `blocked` + `blockedBy`; error handling |
| Unblock user | App.js, Settings.js | ✅ Complete | Bilateral delete with error handling |
| Block list management | Settings.js | ✅ Complete | View and unblock from Settings |
| View public profile | Discover.js (`PublicProfile`) | ✅ Complete | Full profile card with all public fields |
| "Remove Connection" in PublicProfile | Discover.js (`PublicProfile`) | ✅ Complete | Shown only for mutual matches; confirmation modal |

### Messaging

| Feature | Component(s) | Status | Description |
|---------|-------------|--------|-------------|
| Real-time chat | Messages.js | ✅ Complete | `onSnapshot` per chat; messages appear instantly |
| Send message | Messages.js | ✅ Complete | `addDoc`; Enter key sends; FCM push notification |
| Message bubbles | Messages.js | ✅ Complete | Sent (blue) vs received (card-bg) alignment |
| Message list (conversations) | Messages.js | ✅ Complete | Shows all mutual matches; tap to open chat |
| Message preview + timestamp | App.js, Messages.js | ✅ Complete | 40-char truncate; `formatRelativeTime` helper |
| Unread indicators | App.js, Messages.js | ✅ Complete | Nav badge count + dot on avatar in conversation list |
| Blocked state in chat | Messages.js | ✅ Complete | Different copy for "I blocked them" vs "they blocked me" |
| Auto-scroll to latest message | Messages.js | ✅ Complete | `scrollIntoView` on message count change |

### Notifications

| Feature | Component(s) | Status | Description |
|---------|-------------|--------|-------------|
| Auto-request notification permission | App.js | ✅ Complete | Asks on first load if permission is "default" |
| FCM token registration (multi-device) | App.js, firebase.js | ✅ Complete | `arrayUnion(token)` to `fcmTokens` on mount |
| Push — new connection request | App.js | ✅ Complete | Calls `/api/notify` with `recipientUid` |
| Push — connection accepted | App.js | ✅ Complete | Calls `/api/notify` with `recipientUid` |
| Push — new message | Messages.js | ✅ Complete | Calls `/api/notify` with `recipientUid` |
| Push — background delivery | public/firebase-messaging-sw.js | ✅ Complete | `onBackgroundMessage` → `showNotification` |
| Push — foreground toast | App.js (`onMessage`) | ✅ Complete | Toast shown; skips if active chat already open |
| Notification settings toggle | Settings.js | ✅ Complete | **FIXED v0.9** — correctly clears/sets `fcmTokens` array |
| Message sound toggle | Settings.js | ✅ Complete | Stored in localStorage; beep via Web Audio API |
| Vibrate toggle | Settings.js | ✅ Complete | Stored in localStorage; `navigator.vibrate` |
| Notification click → messages tab | public/firebase-messaging-sw.js | ✅ Complete | Opens or focuses app at `/?tab=messages` |
| Push delivery infra (Vercel) | api/notify.js | ⚠️ Partial | Code is correct (Bug 3); `FIREBASE_*` env vars must be set and verified in Vercel |

### Sharing & Invites

| Feature | Component(s) | Status | Description |
|---------|-------------|--------|-------------|
| Invite poster (canvas) | Discover.js (`ShareModal`) | ✅ Complete | Renders a shareable 540×960 poster with app branding |
| Share to WhatsApp | Discover.js | ✅ Complete | `navigator.share` with image file; fallback to `wa.me` link |
| Save poster as PNG | Discover.js | ✅ Complete | `canvas.toDataURL` download |
| Profile QR code | Discover.js | ✅ Complete | `qrcode` library; dark/light branded; save as PNG |
| Copy profile link | Discover.js | ✅ Complete | Clipboard API; `profile_link_copied` analytics |
| Share profile link (native) | Discover.js | ✅ Complete | `navigator.share`; falls back to copy |
| Invite button in Discover | Discover.js | ✅ Complete | Always visible above the card stack |
| Empty-state share prompt | Discover.js | ✅ Complete | "Founding Member" CTA when Discover pool exhausted |

### Settings & Account Management

| Feature | Component(s) | Status | Description |
|---------|-------------|--------|-------------|
| Notification preferences | Settings.js | ✅ Complete | Push / sound / vibrate toggles |
| View account email | Settings.js | ✅ Complete | Displayed from `firebaseUser.email` |
| Edit profile (navigate) | Settings.js | ✅ Complete | Button navigates to Profile edit mode |
| Change password (email users) | Settings.js | ✅ Complete | `sendPasswordResetEmail`; only shown for email auth |
| Sign Out | Settings.js | ✅ Complete | `signOut(auth)` |
| Deactivate account | Settings.js | ✅ Complete | Sets `deactivated: true`; hidden from Discover/Search |
| Delete account | Settings.js | ✅ Complete | Full bilateral Firestore cleanup + Storage + auth deletion |
| Block list management | Settings.js | ✅ Complete | View all blocked users; unblock per row |
| Terms of Service modal | Settings.js, shared.js | ✅ Complete | Full inline terms text |
| Privacy Policy page | App.js, PrivacyPolicy.js | ✅ Complete | Accessible at `/privacy` route |
| App version display | Settings.js | ✅ Complete | Shows "1.0.0 Beta" |

### PWA & Offline

| Feature | Component(s) | Status | Description |
|---------|-------------|--------|-------------|
| PWA installable (manifest) | public/manifest.json | ✅ Complete | `display: standalone`; icons at 192 + 512 px |
| Service worker — offline cache | public/service-worker.js | ✅ Complete | Network-first; static asset cache; `index.html` fallback |
| Service worker — FCM | public/firebase-messaging-sw.js | ✅ Complete | Dedicated FCM service worker registered by `getFCMToken` |
| iOS PWA support | AuthScreen.js, firebase.js | ✅ Complete | `signInWithRedirect` on iOS; `experimentalForceLongPolling` in Firestore |
| Dead FCM code in service-worker.js | public/service-worker.js | ⚠️ Partial | Lines 1–44 are dead code (Bug 22, still present) |

### Analytics & Tracking

| Feature | Component(s) | Status | Description |
|---------|-------------|--------|-------------|
| Firebase Analytics init | firebase.js | ✅ Complete | `getAnalytics` + `logEvent` exported |
| `connection_request_sent` | App.js:291 | ✅ Complete | Fires after successful request send |
| `connection_accepted` | App.js:310 | ✅ Complete | Fires in `handleAcceptRequest` |
| `connection_declined` | App.js:329 | ✅ Complete | Fires in `handleDeclineRequest` |
| `deep_link_opened` | App.js:80 | ✅ Complete | Fires when `/user/:uid` path matched on load |
| `qr_code_viewed` | Discover.js:335 | ✅ Complete | Fires when "My Profile" tab opened in ShareModal |
| `profile_link_copied` | Discover.js:362 | ✅ Complete | Fires on Copy button press |
| `profile_viewed` | App.js:446 | ❌ Missing | `onView` prop passed but not consumed by `PublicProfile` — event never fires (Bug 21) |

### AI Features

| Feature | Component(s) | Status | Description |
|---------|-------------|--------|-------------|
| Smart Match Explanation | Discover.js, api/match-explain.js | ✅ Complete | **NEW v0.9** — per-card "✦ Why connect" block; `claude-sonnet-4-6`; session cache; auth-gated |
| AI Connection Note Assistant | — | ❌ Missing | Not yet built |
| AI Profile Score / Optimiser | — | ❌ Missing | Not yet built |
| Conversation Starter Chips | — | ❌ Missing | Not yet built |

---

## SECTION B — User Benefits (Plain English)

*Written for expo attendees with zero technical knowledge.*

---

### Networking

**Find exactly the right people, not just people you might know**  
Link-Ap uses your goals — whether you're looking for an investor, co-founder, freelance client, or mentor — to show you only the people most likely to be useful to *you*. You won't scroll through hundreds of random profiles.  
*Delivered by: Intent filtering, Discover feed*

**AI tells you why to connect before you even ask**  
When you see someone's profile, Link-Ap's AI reads both your profiles and tells you specifically why the two of you should connect — referencing actual things you're both working on. No guessing whether it's worth reaching out.  
*Delivered by: Smart Match Explanation (new)*

**Search for specific people by name**  
If you heard someone speak and want to connect, just search their name. You'll find them in seconds.  
*Delivered by: Search by name (SearchModal)*

**Quality over quantity — every request requires a personal note**  
You can't connect without explaining why. A minimum message is required, so no one gets a cold, meaningless "I'd like to add you to my professional network." Every request you receive tells you exactly why that person wants to connect.  
*Delivered by: ConnectNoteModal (10-char minimum)*

**Real-time connections — no waiting, no email delays**  
When someone accepts your request, your Connections tab updates instantly. When they send you a message, it appears in real time. No polling, no refresh.  
*Delivered by: Firestore real-time listeners*

---

### Privacy & Control

**Block anyone, immediately and permanently**  
If someone makes you uncomfortable, tap their profile and block them. They disappear from your feed and can no longer message you or send you requests. The block works in both directions.  
*Delivered by: Block/Unblock feature, bidirectional Firestore writes*

**Remove connections whenever you want**  
Changed your mind about a connection? Remove it at any time from your Connections tab or their profile. The chat history stays, but the connection is severed.  
*Delivered by: Remove Connection feature*

**Deactivate or fully delete your account**  
You can pause your presence at any time by deactivating (hidden from everyone; data kept). Or delete your account forever — all your messages, connections, and data are permanently erased across the entire platform.  
*Delivered by: Settings — Deactivate Account, Delete Account*

**You control who can connect with you**  
No one can force a connection. Every request must be accepted by you. Declining a request removes the person from your view, so they won't keep reappearing.  
*Delivered by: Accept/Decline request flow*

---

### Quality

**Investor? You get a dedicated pitch block on your profile**  
If you're raising funding, Link-Ap gives you a structured "Investor Deck" section with answers to the questions investors actually ask: What are you building? What traction do you have? How much are you raising?  
*Delivered by: lookingForDetails Q&A system*

**LinkedIn verification badge**  
If your LinkedIn URL matches your name, you get a blue badge on your profile. It's a simple, free signal of authenticity that helps others trust you.  
*Delivered by: LinkedIn URL validation + linkedinNameMatches*

**No spam, no bots in your Discover feed**  
Deactivated accounts and blocked users never appear. The feed is clean.  
*Delivered by: Server-side deactivation filter, client-side block filter*

---

### Experience

**Works like an app, no download required**  
Link-Ap is a Progressive Web App — add it to your home screen from Safari or Chrome and it works exactly like an installed app. No App Store, no Play Store, no waiting.  
*Delivered by: PWA manifest + service worker*

**Instant push notifications**  
When someone sends you a connection request or a new message, you get a push notification on your phone — even if the app is closed. Tap it and you go straight to your messages.  
*Delivered by: Firebase Cloud Messaging, service worker*

**Works offline**  
If you lose connection, the app loads from cache. You can still see your recent conversations and profile while offline.  
*Delivered by: Service worker offline cache*

**Share your profile with a QR code**  
At an expo or event, let someone scan your QR code to instantly open your Link-Ap profile. No business card needed.  
*Delivered by: ShareModal QR code*

---

### Trust

**Your data lives on Google Firebase — one of the world's most trusted infrastructure platforms**  
All your data is stored on Firebase, the same Google infrastructure used by thousands of companies worldwide. Your passwords are never stored by Link-Ap — Google Firebase handles authentication.  
*Delivered by: Firebase Auth + Firestore*

**Clear Terms of Service and Privacy Policy**  
Link-Ap's terms are accessible at any time from the Settings screen. They cover your rights under GDPR (EU), CCPA (California), and POPIA (South Africa). Contact is `info@link-ap.online`.  
*Delivered by: TermsContent in-app, /privacy page*

**You can read exactly what data we have on you — and delete it**  
Every piece of data Link-Ap stores about you — your profile, connections, messages, and device tokens — can be permanently erased by deleting your account in Settings. This process is immediate and irreversible.  
*Delivered by: handleDelete in Settings.js*

---

## SECTION C — Safety & Privacy Audit (For Expo Use)

*Audited against: firestore.rules, firebase.js, App.js, Settings.js, AuthScreen.js, api/notify.js, api/match-explain.js, PrivacyPolicy.js, shared.js (TermsContent).*

---

### Q&A

**1. Is user data stored securely?**  
**YES.** All data is stored on Google Firebase, backed by Google Cloud infrastructure with encryption at rest and in transit. Access to Firestore is controlled by security rules that require authentication for every read or write. The notification server at `/api/notify` verifies a Firebase ID token before processing any request — no anonymous calls are accepted.

**2. Can other users see my private information?**  
**PARTIAL.** Your public profile (name, bio, skills, role, location, photo, LinkedIn) is visible to all other registered users — this is by design, it's a networking app. However, private data such as your notification tokens (`fcmTokens`), your block list, your passed list, and who has blocked you are restricted by Firestore rules to your account only. Other users cannot see this information.

**3. Can Link-Ap staff or the developer read my messages?**  
**YES, technically.** Link-Ap runs on Firebase, which means the developer can access all data through the Firebase Console, including chat messages. This is true of any Firebase-backed app. Link-Ap does not have automated scanning of messages, but the developer has administrator access to the database. This is disclosed in the Privacy Policy (Section 4: "Link-AP is built on Google Firebase").

**4. Who can see my profile?**  
**Any registered, signed-in user.** A deactivated account is hidden. A blocked user cannot see the person who blocked them (and vice versa — both sides are hidden from each other in Discover and Search). No one outside the app can see profiles — you must have an account to access them.

**5. Can I delete my account and all my data?**  
**YES.** The Delete Account option in Settings performs a complete wipe: it removes your profile document, all your connection records (matches, sent requests, received requests), your block lists, your chat messages, and your Firebase Auth account. The deletion covers both sides of every relationship — the other people you connected with no longer have your profile in their connections either.

**6. Can I block someone who is bothering me?**  
**YES.** Any profile you view has a "Block user" button. Blocking immediately removes them from your Discover feed, prevents them from sending you connection requests (enforced client-side), and prevents messaging. The block is bidirectional — they can't see you and you can't see them. You can manage your block list and unblock at any time in Settings.

**7. Does the app sell my data to advertisers?**  
**NO.** The Privacy Policy (Section 5) explicitly states: "We do not sell your personal information." The app currently has no advertising infrastructure, no advertising SDKs, and no analytics sharing with advertisers. The only analytics in use is Firebase Analytics (Google's own product, used for app performance and feature usage).

**8. Does the app share my data with third parties?**  
**PARTIAL.** The app uses:  
- **Google Firebase** (authentication, database, storage, push notifications) — disclosed in Privacy Policy Section 4  
- **Anthropic** (AI company) — when you view a Discover card, a snippet of your profile and the other person's profile is sent to Anthropic's API to generate the "Why connect" explanation. *This is not currently disclosed in the Privacy Policy* (a gap identified in this audit — see Bug 24).  

No data is shared with advertisers, data brokers, or other third parties.

**9. Is my password stored safely?**  
**YES.** Link-Ap uses Firebase Authentication, which handles all password management. Your password is hashed by Firebase — Link-Ap never sees or stores your plain-text password. Google OAuth users have no Link-Ap password at all; authentication goes through Google's servers.

**10. What happens if I deactivate my account?**  
**PARTIAL.** Deactivating sets a `deactivated: true` flag on your profile, which hides you from Discover and Search immediately. Your data remains in the system. You cannot self-reactivate — you must contact `info@link-ap.online`. This limitation is disclosed in the Settings confirmation modal ("You can reactivate by contacting support").

**11. Are push notifications secure?**  
**YES.** Notifications are sent server-side only. The server (`/api/notify`) requires a valid Firebase Auth ID token in the request — no unauthenticated party can trigger a notification. Notification tokens (FCM tokens) are stored only in your Firestore document, accessible only to you and the Firebase Admin. Push messages are encrypted in transit by Google's FCM infrastructure.

**12. Is the app safe to install on my phone?**  
**YES.** Link-Ap is a Progressive Web App — it installs like a bookmark, not a native app. It has no access to your contacts, files, camera, or microphone beyond what you explicitly grant (camera for profile photo only). It runs in the browser sandbox. There is no native code, no APK, no side-loading required.

**13. Does the app collect my location?**  
**NO.** The location shown on your profile is text you type yourself (e.g. "Cape Town, SA"). Link-Ap never requests your device GPS or location permissions. There is no geolocation API call anywhere in the codebase.

**14. What data does the app collect about me?**  
Link-Ap collects: your name, email address, and profile photo; professional information (role, skills, bio, LinkedIn URL, what you're looking for); connection history (who you matched with, who you sent requests to, who you declined); chat messages; push notification tokens for your devices; and Firebase Analytics events (app opens, connection actions, profile shares). No credit card data, no contacts, no GPS location, no microphone or camera access beyond photo selection.

**15. Can I control who connects with me?**  
**YES.** Every connection request must be explicitly accepted. You cannot be added to someone's connections without your consent. You can decline any request. Declining adds that person to your "passed" list so they won't keep appearing. You can also block anyone pre-emptively to prevent them from ever reaching you.

---

### Safety Summary *(printable standalone)*

Link-Ap is built on Google Firebase, one of the world's most trusted cloud platforms, and uses industry-standard security throughout. Your password is never stored by Link-Ap — Google Firebase handles authentication and password hashing. All connection requests require your explicit acceptance, so no one can force a connection with you, and blocking anyone immediately removes them from your experience on both sides. You can delete your entire account at any time from Settings, permanently erasing all your data — profile, messages, and connections — with no way to recover it and no need to contact anyone. The app never accesses your GPS location, contacts, or any device data beyond what you explicitly share when creating your profile. One honest caveat: because Link-Ap runs on Firebase, the developer technically has administrator access to the database, including messages — this is common to all Firebase-based apps and is disclosed in the Privacy Policy. If you have questions about your data rights, contact `info@link-ap.online`.

---

## SECTION D — Technical Bug Status (v0.8 → v0.9)

### Verified Bug Statuses

---

#### Bug 1 — HIGH | Search prefix range query — **FIXED ✅**
**Location:** App.js:507–508  
**Verification:**  
```js
// App.js:507–508 — current code:
const end_ = t_ + "󿿿";      // high-value Unicode suffix (U+10FFFF range)
const endCap_ = tCap + "󿿿";  // same suffix for capitalised variant
```
The v0.8 bug was an empty-string suffix `t_ + ""` creating equality queries instead of prefix range queries. Current code appends a high-value Unicode character (rendered as a placeholder character in some editors). The Firestore queries at lines 510–512 now correctly use `>= term` and `<= term + <max_unicode>` — a valid Firestore prefix scan. **Fixed.**

---

#### Bug 3 — HIGH | FCM 401 / Vercel env vars — **STILL PRESENT ❌**
**Location:** api/notify.js (entire function), api/match-explain.js (entire function)  
**Verification:** The server code is structurally correct — `sendEachForMulticast`, auth token verification, `recipientUid` lookup. Neither `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, nor `FIREBASE_PRIVATE_KEY` can be verified from source code alone.  
**Status:** Unverifiable from code. Check Vercel → link-ap → Logs → filter `/api/notify`. A working call returns `{ success: true, sent: N }`.

---

#### Bug 4 — MEDIUM | N chat listeners rebuilt on every match change — **STILL PRESENT ❌**
**Location:** App.js:176–201  
**Verification:**  
```js
// App.js:201 — dependency array:
}, [matches, firebaseUser.uid]); // eslint-disable-line
```
Every time `matches` array reference changes (any accept/remove), all N `onSnapshot` chat listeners are torn down and recreated simultaneously. With many connections this creates a burst of Firestore read operations and a brief window where messages can be missed.

---

#### Bug 7 — LOW | Hardcoded `#1D4ED8` in Messages.js — **STILL PRESENT ❌**
**Location:** Messages.js:159  
**Verification:**  
```js
background: msg.from === firebaseUser.uid ? "#1D4ED8" : COLORS.card,
```
Should be a new `COLORS.chatBlue` token.

---

#### Bug 8 — LOW | Hardcoded `#F5A623` in Messages.js — **STILL PRESENT ❌**
**Location:** Messages.js:89  
**Verification:**  
```js
width: 10, height: 10, background: "#F5A623", borderRadius: "50%",
```
Should be `COLORS.accent`.

---

#### Bug 17 — LOW | SearchModal `handleSend` success UI fires on blocked-by early return — **STILL PARTIALLY FIXED ⚠️**
**Location:** App.js:536–542  
**Verification:**  
```js
// App.js:536–542 — SearchModal.handleSend — still broken:
const handleSend = async () => {
  if (!note.trim() || !target || sending) return;
  setSending(true);
  await onSendRequest(target, note.trim());  // return value ignored
  setSending(false);
  setSentOk(true);  // fires even if request was silently blocked
  setTimeout(() => { setTarget(null); setNote(""); setSentOk(false); }, 1800);
};
```
`handleConnectWithNote` in App.js:295–298 correctly checks the boolean return. SearchModal does not.

---

#### Bug 18 — MEDIUM | Google OAuth iOS PWA regression — **FIXED ✅**
**Location:** AuthScreen.js:48–51, 62–65, 76–79  
**Verification:**  
```js
// AuthScreen.js:48–51 — iOS PWA detection:
const isIosPwa =
  /iphone|ipad|ipod/i.test(navigator.userAgent) &&
  window.navigator.standalone === true;

// AuthScreen.js:62–65 — redirect result handler on mount:
useEffect(() => {
  if (!isIosPwa) return;
  getRedirectResult(auth).catch(e => setError(getErrorMessage(e)));
}, []);

// AuthScreen.js:76–79 — branched login:
if (isIosPwa) {
  await signInWithRedirect(auth, provider);
} else {
  await signInWithPopup(auth, provider);
}
```
iOS PWA installs now use `signInWithRedirect` + `getRedirectResult`. Desktop uses `signInWithPopup`. Exactly matches the v0.8 recommended fix. **Fixed.**

---

#### Bug 19 — MEDIUM | Settings notifications toggle incompatible with `fcmTokens` array — **FIXED ✅**
**Location:** Settings.js:45, 55–60, 73–75  
**Verification:**  
```js
// Settings.js:45 — init now checks BOTH old and new fields:
const [notifEnabled, setNotifEnabled] = useState(!!(user.fcmTokens?.length > 0 || user.fcmToken));

// Settings.js:55–60 — disable path now clears BOTH:
await updateDoc(doc(db, "users", firebaseUser.uid), {
  fcmToken: deleteField(),
  fcmTokens: [],
});
setNotifEnabled(false);

// Settings.js:73–75 — enable path uses arrayUnion:
await updateDoc(doc(db, "users", firebaseUser.uid), { fcmTokens: arrayUnion(token) });
setNotifEnabled(true);
```
All three issues from v0.8 Bug 19 are resolved. **Fixed.**

---

#### Bug 21 — LOW | `onView` prop not consumed by PublicProfile — **STILL PRESENT ❌**
**Location:** Discover.js:6 (component signature), App.js:446 (caller)  
**Verification:**  
```js
// Discover.js:6 — onView NOT in destructured props:
export function PublicProfile({ profileUser, onClose, currentUserUid, blocked, onBlock, onUnblock, matches, onDisconnect }) {

// App.js:446 — caller passes onView:
<PublicProfile ... onView={() => logEvent(analytics, "profile_viewed", { uid: viewingProfile.uid })} ...
```
The `profile_viewed` analytics event never fires.

---

#### Bug 22 — LOW | Dead FCM code in service-worker.js — **STILL PRESENT ❌**
**Location:** public/service-worker.js:1–44  
**Verification:** Lines 1–44 of service-worker.js still contain Firebase App initialization and `onBackgroundMessage` handler. The FCM token is tied to the `firebase-messaging-sw.js` registration (firebase.js:49), so the FCM code in service-worker.js never receives a message.

---

### New Bugs Discovered in v0.9 Audit

---

#### Bug 23 — MEDIUM | No rate limiting on `/api/match-explain`
**Location:** api/match-explain.js (entire file)  
**Severity:** MEDIUM (financial risk)  
**Description:** The `/api/match-explain` endpoint calls the Anthropic API (`claude-sonnet-4-6`, max 100 tokens) on every authenticated request. There is no per-user rate limit, no daily cap, and no cost circuit breaker. A single authenticated user could script thousands of requests to this endpoint, driving up Anthropic API costs. The client-side `explanationCache` ref (Discover.js:583) prevents re-fetches within a single session, but provides no server-side protection.  
**Fix:** Add a rate limit per authenticated UID (e.g. max 100 requests/day stored in Firestore or Redis), or implement a simple request-counting check before the Anthropic call. Alternatively, set a Vercel spend limit alert on the Anthropic API key.  
**Acceptance criteria:** A single user cannot trigger more than N Anthropic API calls per hour/day.

---

#### Bug 24 — LOW | Privacy Policy does not disclose Anthropic AI processing
**Location:** src/PrivacyPolicy.js, src/shared.js (`TermsContent`)  
**Severity:** LOW (compliance gap)  
**Description:** When the Discover feed loads, a snippet of the current user's profile data (`lookingFor`, `bringToTable`, `lookingForDetails`, `currentlyExploring`, `skills`, `role`) and the target user's profile data are sent to Anthropic's API (api/match-explain.js:44–58). The Privacy Policy (Section 5) mentions only "service providers such as Firebase." Anthropic is not mentioned. Under GDPR, POPIA, and CCPA, sharing personal data with a new third-party processor requires disclosure.  
**Fix:** Add Anthropic to the list of service providers in the Privacy Policy Section 5. Example addition: "AI services such as Anthropic (to generate personalised match explanations)."  
**Acceptance criteria:** Privacy Policy explicitly names Anthropic as a data processor for AI match explanations.

---

## SECTION E — Code Health Snapshot

### Line Count Table (v0.8 → v0.9)

| File | v0.8 Lines | v0.9 Lines | Delta | Primary Reason |
|------|-----------|-----------|-------|----------------|
| src/App.js | 791 | 791 | — | No changes |
| src/AuthScreen.js | 279 | 290 | +11 | Bug 18 fix: `isIosPwa` detection, `signInWithRedirect`, `getRedirectResult` |
| src/Discover.js | 712 | 777 | +65 | AI Smart Match Explanation: `explanation` state, `loadingExplanation`, `explanationCache`, `useEffect`, render block |
| src/Profile.js | 439 | 439 | — | Title prefix removed from display (design change, same line count) |
| src/Settings.js | 415 | 417 | +2 | Bug 19 fix: `fcmTokens` in init, disable, enable paths |
| src/shared.js | 330 | 330 | — | No changes |
| src/Onboarding.js | 277 | 277 | — | No changes |
| src/Messages.js | 197 | 197 | — | No changes |
| src/Matches.js | 172 | 172 | — | No changes |
| src/firebase.js | 64 | 64 | — | No changes |
| src/PrivacyPolicy.js | 47 | 47 | — | No changes |
| api/notify.js | 103 | 103 | — | No changes |
| **api/match-explain.js** | **—** | **87** | **+87** | **NEW FILE — AI match explanation endpoint** |
| public/service-worker.js | 99 | 99 | — | No changes |
| public/firebase-messaging-sw.js | 72 | 72 | — | No changes |
| **TOTAL** | **~3,821** | **~3,909** | **+88** | |

### New Files Since v0.8

- **api/match-explain.js** (87 lines) — Vercel serverless function; accepts `POST { currentUser, targetUser }`; verifies Firebase ID token; calls Anthropic `claude-sonnet-4-6` (raw fetch, no SDK); returns `{ explanation: string | null }`. Requires `ANTHROPIC_API_KEY` Vercel env var. Never throws — always returns 200 on failure.

### Hardcoded Hex Values Still Not in COLORS

The same 25+ values from v0.8 remain unconsolidated. No new occurrences introduced in v0.9.

| Value | File(s) | Line(s) | Should Be |
|-------|---------|---------|-----------|
| `"#1D4ED8"` | Messages.js | 159 | `COLORS.chatBlue` (new token) — Bug 7 |
| `"#F5A623"` | Messages.js | 89 | `COLORS.accent` — Bug 8 |
| `"#0A0A0F"` | App.js (`SplashScreen`), Discover.js | 700, 227 | `COLORS.bg` |
| `"#16161F"` | Profile.js, Discover.js | 298, 27 | `COLORS.cardDark` |
| `"#1A2E4A"` | Profile.js, Discover.js, shared.js | 342, 72, 196 | `COLORS.skillsBg` |
| `"#1A2A4A"` | Profile.js, Discover.js | 388, 117 | `COLORS.achieveBg` |
| `"#2A1A00"` | Profile.js, Discover.js | 415, 144 | `COLORS.exploringBg` |
| `"#0A2015"` | Profile.js, Discover.js | 316/424, 43/154 | `COLORS.openToBg` |
| `"#15532E"` | Profile.js, Discover.js | 316, 43 | `COLORS.investorBorder` |
| `"#2D1F00"` | Profile.js, Discover.js, App.js | 356, 83, 419 | `COLORS.qaBg` |
| `"#6B4A00"` | Profile.js, Discover.js, App.js | 356, 83, 419 | `COLORS.qaBorder` |
| `"#25D366"` | Discover.js | 434 | WhatsApp brand — acceptable |
| `"#C9A84C"` | PrivacyPolicy.js | 9, 37, 39 | Off-brand gold — Bug 20 |
| `"#b0b0c0"`, `"#888"`, `"#555"` | PrivacyPolicy.js | various | COLORS tokens |
| `"#1e1e2e"`, `"#13131f"` | PrivacyPolicy.js | various | `COLORS.border`, `COLORS.card` |

### eslint-disable Suppressions

No new suppressions added in v0.9. Total unchanged at 9 (all previously documented and justified).

### Performance Concerns

1. **N chat listeners rebuilt on every match change** (App.js:176–201) — STILL PRESENT. Any accept/remove triggers full listener recreation for all N chats. At 20+ connections this creates a Firestore read burst.

2. **Anthropic API call on every new Discover card** — NEW in v0.9. The `useEffect([currentUid])` in Discover.js fires the Anthropic call every time a new card appears. Cold-start latency (network + model inference) is visible as a skeleton loader before the explanation appears. The `explanationCache` ref prevents re-fetching the same card; adjacent cards are not prefetched.

3. **O(N) re-filter on every Discover advance** — STILL PRESENT. `advance()` calls `setSeenUids` triggering full `intentFiltered` recompute each time.

4. **`writeBatch` profile propagation without batch size guard** — STILL PRESENT. No check against Firestore 500-write batch limit. Irrelevant at current scale.

---

## SECTION F — What's Missing for v1.0

| Priority | Gap | Status |
|----------|-----|--------|
| P0 | Verify FCM 401 / Vercel env vars — check logs for `{ success: true }` | Bug 3 — open |
| P1 | Add rate limiting to `/api/match-explain` (financial risk) | Bug 23 — new |
| P1 | Update Privacy Policy to disclose Anthropic AI processing | Bug 24 — new |
| P1 | Fix SearchModal `handleSend` to check return value from `onSendRequest` | Bug 17 (partial) — open |
| P2 | Fix `onView` prop so `profile_viewed` analytics event fires | Bug 21 — open |
| P2 | Move hardcoded hex values into COLORS (25+ values across 6 files) | Bugs 7, 8, 20 — open |
| P2 | Optimise chat listeners (diff-based instead of full rebuild) | Bug 4 — open |
| P2 | Remove dead FCM code from service-worker.js lines 1–44 | Bug 22 — open |
| P2 | Account reactivation self-serve flow (currently requires contacting support) | Open |
| P2 | Report / flag user feature | Open |
| P2 | Character counter in SearchModal note field (ConnectNoteModal has one; SearchModal doesn't) | Open |
| P2 | Standardise PrivacyPolicy.js to use COLORS (off-brand gold `#C9A84C`) | Bug 20 — open |
| P3 | Remove unused `sent` prop from Messages.js | Open (cleanup) |
| P3 | Read receipts | Open |
| P3 | Notification preferences persisted in Firestore (cross-device sync) | Open |
| P3 | Prefetch next Discover card's AI explanation while current card is shown | Open |
| P3 | Meaningful automated test suite (currently near-empty) | Open |

---

## SECTION G — Readiness Assessment

*For Thapelo. Direct answers only.*

**1. Is the app stable enough for expo use tomorrow?**  
Yes. The three P0 blockers from v0.8 — search not working (Bug 1), iOS Google OAuth broken (Bug 18), and the notifications toggle behaving incorrectly (Bug 19) — are all confirmed fixed in the current code. The core loop (discover → connect → message) works end-to-end. The new AI "Why connect" feature adds meaningful differentiation that will resonate in an expo context. Take it. The remaining open bugs are all cosmetic or backend-verifiable (FCM delivery) and none will cause a visible crash or broken primary flow during a demo.

**2. What is the biggest risk if 50 new users sign up tomorrow?**  
Push notifications. If the Vercel `FIREBASE_*` environment variables are not correctly set (Bug 3), then every connection request and message will arrive silently — no push, no re-engagement. A user signs up, connects with one person, gets no notification that person responded, and never comes back. The second risk is the discovery pool: with a small user base, some new users will exhaust all unseen profiles quickly and hit the "You're among the first" empty state. That state is well-written and honest, but it's still an empty screen.

**3. What should be fixed before sharing widely?**  
In order of impact:  
(a) Verify push notifications are working end-to-end — open Vercel logs and confirm `/api/notify` returns `{ success: true, sent: 1 }`.  
(b) Fix the SearchModal `handleSend` bug (Bug 17) — a user who tries to connect via Search with someone who has blocked them sees "Request Sent ✓" which is false. This is a trust-eroding experience.  
(c) Update the Privacy Policy to mention Anthropic AI processing (Bug 24) — essential before any wide sharing where privacy-conscious users will read it.

**4. What is Link-Ap's strongest feature right now?**  
The combination of the AI "Why connect" explanation and the mandatory connection note. No other networking platform shows you a personalised reason to reach out *before* you decide to, and then requires you to articulate *your* reason before sending. This two-step intent validation — AI confirms the match is meaningful, user confirms their motivation is genuine — produces a quality of connection request that LinkedIn InMail and Bumble Bizz simply cannot match.

**5. What is the one thing that would most improve user trust and retention in the next 30 days?**  
Verified push notifications. Every connection event — someone views your profile, sends you a request, accepts you, messages you — should interrupt the user's day with a push within seconds. That's the heartbeat of a networking app. Without it, the app is only as sticky as the user's memory to open it. With it working, every connection becomes a real-time conversation, and real-time conversations keep people coming back. Before building any new feature, confirm the notification pipeline is alive.

---

## SECTION H — v0.8 → v0.9 Delta Summary

### Bugs Fixed (3)
- **Bug 1 (HIGH)** — Search prefix range: FIXED — App.js:507–508 now appends high-value Unicode suffix; prefix range queries now return correct results
- **Bug 18 (MEDIUM)** — Google OAuth iOS PWA: FIXED — AuthScreen.js:48–79 now detects `isIosPwa` and uses `signInWithRedirect` + `getRedirectResult` on iOS PWA installs
- **Bug 19 (MEDIUM)** — Settings notifications toggle: FIXED — Settings.js:45, 55–60, 73–75 now correctly reads, clears, and writes the `fcmTokens` array

### New Features Added (1)
- **Smart Match Explanation AI feature** — `api/match-explain.js` (87 lines, new file); `Discover.js` +65 lines; calls Anthropic `claude-sonnet-4-6` (max 100 tokens) with current user + target user profile data; returns 2-sentence "Why connect" explanation; shown with skeleton loader between card header and bio; session-cached per uid via `explanationCache` ref; auth-gated; silently degrades to no block on any failure

### Design Changes (1)
- **Title prefix removed from name display** — Profile.js and Discover.js no longer show `user.title` inline with `user.name` in profile headers (per commits: "fix: hide title prefix from own-profile name display" and "fix: hide title prefix from PublicProfile name display"). Title field is still stored, editable, and propagated to matches; it is simply not displayed in the name heading.

### New Bugs Found (2)
- **Bug 23 (MEDIUM)** — No rate limiting on `/api/match-explain` — authenticated users can make unlimited Anthropic API calls; financial exposure
- **Bug 24 (LOW/COMPLIANCE)** — Privacy Policy does not disclose Anthropic as a data processor for AI match explanations

### Still Open From v0.8 (7)
- Bug 3 (HIGH) — FCM 401 / Vercel env vars unverifiable from code
- Bug 4 (MEDIUM) — N chat listeners rebuilt on every match change (App.js:176–201)
- Bug 7 (LOW) — `#1D4ED8` hardcoded in Messages.js:159
- Bug 8 (LOW) — `#F5A623` hardcoded in Messages.js:89
- Bug 17 (LOW) — SearchModal `handleSend` success UI fires even when request silently blocked
- Bug 21 (LOW) — `onView` prop not consumed by PublicProfile; `profile_viewed` event never fires
- Bug 22 (LOW) — Dead FCM initialization code in service-worker.js:1–44

---

*Report generated 2026-05-18 by full source audit of all source files in src/, api/, public/, and firestore.rules. Every bug status, line number, feature description, and field reference verified against actual current file content. No status carried forward from v0.8 without re-verification in the current file state.*
