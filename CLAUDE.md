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

Everything lives in a single file: `src/App.js`. There is no routing library — the app uses a `tab` state string (`"discover"`, `"matches"`, `"messages"`, `"profile"`) in `MainApp` to switch between screens.

**Auth flow (`App` root component)**
- `firebaseUser` starts as `undefined` (loading), becomes `null` (signed out) or a Firebase user object (signed in).
- `onAuthStateChanged` is the single source of truth for auth state. It always resets `profile` to `null` and sets `loading = true` before fetching the user's Firestore doc, preventing stale profiles from a previous session.
- Screen decision: loading → `<AuthScreen>` → `<Onboarding>` → `<MainApp>`

**Firestore data model**
- `users/{uid}` — user profile document (fields: `uid`, `name`, `role`, `location`, `bio`, `skills[]`, `lookingFor[]`, `achievements[]`, `linkedin`, `avatar`, `color`, `createdAt`)
- `users/{uid}/matches/{targetUid}` — a copy of the matched user's profile document
- `chats/{chatId}/messages/{msgId}` — real-time chat messages; `chatId` is the two UIDs sorted and joined with `_`

**Key design decisions**
- All styling is inline — no CSS files are used for component styles (`App.css` and `index.css` only handle body resets).
- `COLORS` and `USER_COLORS` constants at the top of `App.js` are the single source of styling truth — always use these, never hardcode hex values.
- `Discover` tracks seen profiles via a `seenUids` Set (not an index) so it stays correct when the `users` list updates reactively from Firestore.
- `AuthScreen` handlers do NOT update app state directly — they just call Firebase auth and let `onAuthStateChanged` drive all state transitions.

## Project Rules

- **Never rewrite the entire App.js** unless explicitly asked.
- **Never remove existing features** when adding new ones.
- **Never change `src/firebase.js`** — Firebase config is fixed.
- Make small, focused changes — don't touch unrelated code.
- `npm run eject` is never used.

## Color Scheme

| Token | Value |
|-------|-------|
| `COLORS.bg` | `#0A0A0F` |
| `COLORS.card` | `#13131A` |
| `COLORS.border` | `#2A2A3A` |
| `COLORS.accent` | `#F5A623` |
| `COLORS.text` | `#F0EEE8` |
| `COLORS.textMuted` | `#8A8A9A` |
