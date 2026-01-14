import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCrVIzjoWJqB-DNfnnK68K1rX3YOEUvBJs",
  authDomain: "club-rpg-60a43.firebaseapp.com",
  projectId: "club-rpg-60a43",
  storageBucket: "club-rpg-60a43.firebasestorage.app",
  messagingSenderId: "868108216926",
  appId: "1:868108216926:web:bfa435df6e4fea70ab22cf"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);