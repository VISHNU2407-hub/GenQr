import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC-PFRDkex47Yn-6y1fw5c36prPGURwnKU",
  authDomain: "genqr-7666a.firebaseapp.com",
  projectId: "genqr-7666a",
  storageBucket: "genqr-7666a.firebasestorage.app",
  messagingSenderId: "915173563435",
  appId: "1:915173563435:web:19598516dd68c8c1c91e6e",
  measurementId: "G-GR52V452Z9"
};

const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
