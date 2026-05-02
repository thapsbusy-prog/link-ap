import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA4kG7r9eAsg0fONVB9-p4A3prvcGb4nOo",
  authDomain: "link-ap.firebaseapp.com",
  projectId: "link-ap",
  storageBucket: "link-ap.firebasestorage.app",
  messagingSenderId: "480905186078",
  appId: "1:480905186078:web:16bae391fc4c6361db570f"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);