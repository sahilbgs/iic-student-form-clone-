// ============================================================================
// GTU-ITR Student Registration - Firebase Configuration
// ============================================================================
// निर्देश:
// 1. Firebase Console (https://console.firebase.google.com) par jayein.
// 2. Apna project select karein ya naya banayein -> Project Settings -> General -> Your apps -> Web app (</>).
// 3. Neeche diye gaye config object mein apni keys daalein:
// 4. Firestore Database ko enable karein: Firebase Console -> Build -> Firestore Database -> Create database (Start in production or test mode).
// ============================================================================

const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Helper: Check if genuine Firebase keys are provided
function isFirebaseConfigured() {
  return Boolean(
    firebaseConfig &&
    firebaseConfig.apiKey &&
    !firebaseConfig.apiKey.includes("YOUR_") &&
    firebaseConfig.projectId &&
    !firebaseConfig.projectId.includes("YOUR_")
  );
}

// Global Firebase Firestore references
let db = null;
let firebaseApp = null;
let isFirebaseReady = false;

try {
  if (typeof firebase !== 'undefined' && isFirebaseConfigured()) {
    firebaseApp = firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();

    // Firestore Offline Persistence enable
    db.enablePersistence({ synchronizeTabs: true }).catch(function (err) {
      if (err.code === 'failed-precondition') {
        console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
      } else if (err.code === 'unimplemented') {
        console.warn('The current browser does not support all of the features required to enable persistence.');
      }
    });

    isFirebaseReady = true;
    console.log('%c[Firebase]%c Connected successfully to Firestore!', 'color:#10b981;font-weight:bold;', 'color:inherit;');
  } else {
    console.warn('[Firebase] Placeholder keys detected. Form will save locally to LocalStorage until real keys are provided.');
  }
} catch (error) {
  console.error('[Firebase] Initialization error:', error);
}
