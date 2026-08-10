// Konfigurace Firebase projektu.
// Hodnoty najdeš ve Firebase Console: Project settings (ozubené kolo) > General >
// sekce "Your apps" > Web app > SDK setup and configuration > Config.
window.FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Interní e-mail jediného sdíleného účtu (Firebase Auth vyžaduje e-mail + heslo,
// zaměstnanci ale při přihlašování do appky zadávají jen heslo).
window.SHARED_LOGIN_EMAIL = "tym@udolecka-smeny.app";
