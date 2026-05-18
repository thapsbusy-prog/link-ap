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

The app is split across several source files. There is no routing library — `MainApp` uses a `tab` state string (`"discover"`, `"matches"`, `"messages"`, `"profile"`) to switch between screens.

**Source file map**
- `src/App.js` — `MainApp`, `SearchModal`, `SplashScreen`, `ErrorBoundary`, `App` root, and helpers (`playBeep`, `triggerVibrate`)
- `src/Discover.js` — `Discover`, `PublicProfile`, `ShareModal`, `ConnectNoteModal`, and canvas helpers (`roundRect`, `drawInvitePoster`)
- `src/Matches.js` — `Matches` component
- `src/Messages.js` — `Messages` component and `formatRelativeTime`
- `src/Profile.js` — `Profile` component
- `src/Settings.js` — `Settings` component
- `src/AuthScreen.js` — `AuthScreen` component
- `src/Onboarding.js` — `Onboarding` component
- `src/shared.js` — shared constants (`COLORS`, `USER_COLORS`, option arrays), shared helpers (`normalizeUrl`, `validateLinkedIn`, `linkedinNameMatches`, `getBringToTablePrompt`, `formatRelativeTime`), and shared UI components (`Avatar`, `Tag`, `Input`, `TextArea`, `Select`, `SkillsInput`, `LocationPin`, `LinkedInIcon`, `TermsContent`)

**Auth flow (`App` root component)**
- `firebaseUser` starts as `undefined` (loading), becomes `null` (signed out) or a Firebase user object (signed in).
- `onAuthStateChanged` is the single source of truth for auth state. It always resets `profile` to `null` and sets `loading = true` before fetching the user's Firestore doc, preventing stale profiles from a previous session.
- Screen decision: loading → `<AuthScreen>` → `<Onboarding>` → `<MainApp>`

**Firestore data model**
- `users/{uid}` — user profile document (fields: `uid`, `name`, `role`, `location`, `bio`, `skills[]`, `lookingFor[]`, `achievements[]`, `linkedin`, `avatar`, `color`, `createdAt`, `pronouns`, `title`, `photoURL`)
- `users/{uid}/matches/{targetUid}` — a copy of the matched user's profile document; updated on every profile save via `writeBatch` (fields synced: `name`, `role`, `location`, `bio`, `skills`, `photoURL`, `avatar`, `color`, `lookingFor`, `pronouns`, `title`)
- `chats/{chatId}/messages/{msgId}` — real-time chat messages; `chatId` is the two UIDs sorted and joined with `_`

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

**Smart Match Explanation feature (18 May 2026)**
- `api/match-explain.js` — new Vercel serverless function; accepts `POST { currentUser, targetUser }`, calls Anthropic `claude-sonnet-4-6` (raw fetch, no SDK), returns `{ explanation: string | null }`. Requires `ANTHROPIC_API_KEY` Vercel env var. Never throws — always returns 200 with `{ explanation: null }` on any failure.
- `Discover` component: `explanation` (string|null), `loadingExplanation` (bool) — drive the "✦ Why connect" block rendered between the card header and bio. `explanationCache` ref (plain object keyed by uid) prevents re-fetching the same card.
- Fetch fires on card mount via `useEffect([currentUid])`. `currentUid` is derived from `users.find(u => !seenUids.has(u.uid))?.uid` before early returns, so the effect dep tracks card changes correctly.
- If the API returns null, nothing renders — no error state shown to the user.

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

## Color Scheme

| Token | Value |
|-------|-------|
| `COLORS.bg` | `#0A0A0F` |
| `COLORS.card` | `#13131A` |
| `COLORS.border` | `#2A2A3A` |
| `COLORS.accent` | `#F5A623` |
| `COLORS.text` | `#F0EEE8` |
| `COLORS.textMuted` | `#8A8A9A` |
