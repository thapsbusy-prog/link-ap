# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

---

## Push Notifications — Critical Architecture Notes

### How it works
1. User opens app → auto notification useEffect requests permission → `getFCMToken()` generates device token → stored in `users/{uid}/fcmTokens[]` in Firestore
2. Sender sends message → `Messages.js` calls `/api/notify` with `recipientUid` → server fetches all device tokens → `sendEachForMulticast` sends to all devices
3. App open (foreground) → `onMessage` in `App.js` shows toast + beep via Firestore onSnapshot
4. App closed (background) → `firebase-messaging-sw.js` receives push → `showNotification` displays on lock screen

### Files involved (DO NOT break these)
- `public/firebase-messaging-sw.js` — MUST stay at this exact path; required by mobile browsers
- `src/firebase.js` — `getFCMToken` must register the SW explicitly with `navigator.serviceWorker.register`
- `src/App.js` — auto notification useEffect, `onMessage` handler, notify calls in `handleSendRequestWithNote` and `handleAcceptRequest`
- `src/Messages.js` — `send()` calls `/api/notify` with `recipientUid`
- `api/notify.js` — fetches `fcmTokens` array from Firestore, sends multicast push

### Vercel environment variables required
- `REACT_APP_VAPID_KEY` — Firebase Web Push Key Pair
  (Firebase Console > Project Settings > Cloud Messaging > Web Push certificates > Key pair)
- `FIREBASE_PROJECT_ID` — from service account JSON
- `FIREBASE_CLIENT_EMAIL` — from service account JSON
- `FIREBASE_PRIVATE_KEY` — from service account JSON
  (paste with surrounding quotes, `\n` as literal text, e.g. `"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"`)

### Testing push notifications
1. Open app on phone → allow notifications
2. Close the browser completely
3. Send a message from another account
4. Push should appear on the lock screen within 3 seconds

### Common failure modes
| Symptom | Cause | Fix |
|---------|-------|-----|
| No push on mobile | `firebase-messaging-sw.js` renamed/moved | Restore to `public/firebase-messaging-sw.js` |
| No push on mobile | Wrong VAPID key | Use Firebase Web Push Key Pair (starts with `B`, ~88 chars) |
| Only one device gets push | `fcmToken` string used instead of `fcmTokens` array | Use `arrayUnion` when saving; pass `recipientUid` to `/api/notify` |
| No push at all | `FIREBASE_PRIVATE_KEY` missing quotes in Vercel | Paste with surrounding double-quotes |
| 401 from `/api/notify` | Bearer token not sent | Ensure `firebaseUser.getIdToken()` result is the `Authorization` header |
