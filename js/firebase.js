import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBx4U6QR_ZivYy4Bx7OR96wwY0LHBrFWpg",
  authDomain: "the-club-091.firebaseapp.com",
  projectId: "the-club-091",
  storageBucket: "the-club-091.firebasestorage.app",
  messagingSenderId: "845649488799",
  appId: "1:845649488799:web:2cdf26b8941b595ef1abaa"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);