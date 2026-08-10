// Konfigurace Firebase projektu.
// Hodnoty najdeš ve Firebase Console: Project settings (ozubené kolo) > General >
// sekce "Your apps" > Web app > SDK setup and configuration > Config.
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyD3ZGXyRRFTf9GrxwfGo3JpBNYznPi5HXs",
  authDomain: "u-dolecka-smeny.firebaseapp.com",
  projectId: "u-dolecka-smeny",
  storageBucket: "u-dolecka-smeny.firebasestorage.app",
  messagingSenderId: "435834667051",
  appId: "1:435834667051:web:81d6a85ca58edd64412a6e"
};

// Interní e-mail jediného sdíleného účtu (Firebase Auth vyžaduje e-mail + heslo,
// zaměstnanci ale při přihlašování do appky zadávají jen heslo).
window.SHARED_LOGIN_EMAIL = "tym@udolecka-smeny.app";
