// =====================================================
//  EatClub — Firebase Configuration
//  Project: eatclub-app (console.firebase.google.com)
// =====================================================

const firebaseConfig = {
    apiKey: "AIzaSyA_JAVdtO2sJ9JX3BamSm1kLGewwbG9FpA",
    authDomain: "eatclub-app.firebaseapp.com",
    projectId: "eatclub-app",
    storageBucket: "eatclub-app.firebasestorage.app",
    messagingSenderId: "8131427840",
    appId: "1:8131427840:web:52e9eb6c07c05d3a3262e5"
};

// Initialise Firebase — AUTH and DB are used throughout the app
firebase.initializeApp(firebaseConfig);
const AUTH = firebase.auth();
const DB = firebase.firestore();

// SESSION persistence: each browser tab has its own independent login session.
// This allows customer in Tab 1 and admin in Tab 2 without them interfering.
AUTH.setPersistence(firebase.auth.Auth.Persistence.SESSION);
