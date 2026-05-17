import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyA4kG7r9eAsg0fONVB9-p4A3prvcGb4nOo",
  authDomain: "link-ap.firebaseapp.com",
  projectId: "link-ap",
  storageBucket: "link-ap.firebasestorage.app",
  messagingSenderId: "480905186078",
  appId: "1:480905186078:web:16bae391fc4c6361db570f"
};

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, { experimentalForceLongPolling: true });
export const auth = getAuth(app);
export const storage = getStorage(app);
export const messaging = getMessaging(app);

export async function getFCMToken() {
  try {
    const registration = await navigator.serviceWorker.register(
      '/firebase-messaging-sw.js'
    );
    const token = await getToken(messaging, {
      vapidKey: process.env.REACT_APP_VAPID_KEY || "BEIVCbXbvIz1ECF-6luz3TtsfihwFv_Of1XHnlOp87HQqOUNaWBW2apdO1w1sZi0IRFNypesgC-O0pwFmWh117g",
      serviceWorkerRegistration: registration,
    });
    return token || null;
  } catch (err) {
    console.warn("FCM token error:", err);
    return null;
  }
}

export { onMessage };
