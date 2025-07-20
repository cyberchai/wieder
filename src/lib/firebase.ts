// import { initializeApp, getApps, getApp } from "firebase/app";
// import { getAuth } from "firebase/auth";
// import { getFirestore } from "firebase/firestore";
// import { getStorage } from "firebase/storage";

// const firebaseConfig = {
//   apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyA8QnWttpP1FPpnycW2ifbrFpMbQm6vlP8",
//   authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "your-auth-domain",
//   projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "your-project-id",
//   storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "your-storage-bucket",
//   messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "your-messaging-sender-id",
//   appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "your-app-id",
// };

// const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
// const auth = getAuth(app);
// const db = getFirestore(app);
// const storage = getStorage(app);

// export { app, auth, db, storage };


// for firebase.ts

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Optional: only if you're using Analytics
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAuVMgtMJDQF27KZPfJLrZUPA8uKMbx-fM",
  authDomain: "wieder-9deef.firebaseapp.com",
  projectId: "wieder-9deef",
  storageBucket: "wieder-9deef.appspot.com",  // fixed from `.firebasestorage.app`
  messagingSenderId: "212469872084",
  appId: "1:212469872084:web:e4423a21016b6a705a9241",
  measurementId: "G-0DM61FVYK4",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services you’ll use
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Optional analytics setup
let analytics;
isSupported().then((yes) => {
  if (yes) analytics = getAnalytics(app);
});
