// =====================================================
//  EatClub — Firebase Configuration
//  Project: eatclub-app (console.firebase.google.com)
// =====================================================

const firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_FIREBASE_AUTH_DOMAIN",
    projectId: "YOUR_FIREBASE_PROJECT_ID",
    storageBucket: "YOUR_FIREBASE_STORAGE_BUCKET",
    messagingSenderId: "YOUR_FIREBASE_MESSAGING_SENDER_ID",
    appId: "YOUR_FIREBASE_APP_ID"
};

// Initialise Firebase — AUTH and DB are used throughout the app
firebase.initializeApp(firebaseConfig);
const AUTH = firebase.auth();
const DB = firebase.firestore();

// SESSION persistence: each browser tab has its own independent login session.
// This allows customer in Tab 1 and admin in Tab 2 without them interfering.
AUTH.setPersistence(firebase.auth.Auth.Persistence.SESSION);
