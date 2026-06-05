// filepath: primemart/firebase.js
// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDaVAcwsRzVZDZY7FVURwZdcSZMa035EMQ",
  authDomain: "primemart-49775.firebaseapp.com",
  projectId: "primemart-49775",
  storageBucket: "primemart-49775.firebasestorage.app",
  messagingSenderId: "109416987490",
  appId: "1:109416987490:web:7aa73e3472651147220a3b",
  measurementId: "G-RGCX2ZQQZE"
};

// Initialize Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };