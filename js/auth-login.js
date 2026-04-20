import { auth } from "./firebase.js";

import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const form = document.querySelector("form");
const googleBtn = document.querySelector("#google-login");

// EMAIL LOGIN
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = form.querySelector("input[type='email']").value;
  const password = form.querySelector("input[type='password']").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = "./index.html";
  } catch (err) {
    alert(err.message);
  }
});

// GOOGLE LOGIN
googleBtn.addEventListener("click", async () => {
  const provider = new GoogleAuthProvider();

  try {
    await signInWithPopup(auth, provider);
    window.location.href = "./index.html";
  } catch (err) {
    alert(err.message);
  }
});