import { auth } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const form = document.querySelector("form");
const googleBtn = document.querySelector("#google-signup");

// EMAIL SIGNUP
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = form.querySelector("input[type='email']").value;
  const password = form.querySelector("input[type='password']").value;

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    window.location.href = "/html/index.html";
  } catch (err) {
    alert(err.message);
  }
});

// GOOGLE SIGNUP
googleBtn.addEventListener("click", async () => {
  const provider = new GoogleAuthProvider();

  try {
    await signInWithPopup(auth, provider);
    window.location.href = "/html/index.html";
  } catch (err) {
    alert(err.message);
  }
});