import { initializeApp, getApps } from "firebase/app";
import { getFirestore, connectFirestoreEmulator, initializeFirestore } from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";

import { setLogLevel } from "firebase/firestore";
setLogLevel("debug");

const testApp = initializeApp(
  {
    projectId: "demo-courtrank",
    apiKey: "fake",
    authDomain: "localhost",
  },
  "test-app"
);

export const db = initializeFirestore(testApp, {
  experimentalForceLongPolling: true,
  
});

export const auth = getAuth(testApp);

// 🔥 Attach emulator IMMEDIATELY
connectFirestoreEmulator(db, "127.0.0.1", 8080);
connectAuthEmulator(auth, "http://127.0.0.1:9000");

console.log("🔥 Firebase TEST emulator connected");
