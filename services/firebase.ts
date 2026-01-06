import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// ⚠️ CSERÉLD LE EZEKET AZ ADATOKAT A SAJÁT FIREBASE PROJEKTED ADATAIRA!
// 1. Menj a https://console.firebase.google.com/ oldalra
// 2. Hozz létre egy projektet
// 3. Adj hozzá egy Web Appot (</> ikon)
// 4. Másold ki a config objektumot ide:
const firebaseConfig = {
  apiKey: "AIzaSyDPW7Q-Tqz7MR3Sf7dY3J5dntj8Ev1nwH8",
  authDomain: "misztikustarot-c4002.firebaseapp.com",
  projectId: "misztikustarot-c4002",
  storageBucket: "misztikustarot-c4002.firebasestorage.app",
  messagingSenderId: "243229244862",
  appId: "1:243229244862:web:78546bb360296fa7334def",
  measurementId: "G-KZ2TWQWG5X"
};

// Initialize Firebase
// We check if configs are placeholders to avoid crashing immediately
import { AuthProvider } from 'firebase/auth';

let app;
let auth: Auth | undefined;
let db: Firestore | undefined;
let googleProvider: AuthProvider | undefined;

try {
    if (firebaseConfig.apiKey === "API_KEY_HELYE") {
        console.warn("⚠️ Firebase nincs beállítva! Kérlek szerkeszd a services/firebase.ts fájlt.");
    } else {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        googleProvider = new GoogleAuthProvider();
    }
} catch (e) {
    console.error("Firebase init error:", e);
}

export { auth, db, googleProvider };
