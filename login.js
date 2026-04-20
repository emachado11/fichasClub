import { auth } from "./firebase.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const form = document.querySelector("form");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = form.querySelector("input[type='email']").value;
  const password = form.querySelector("input[type='password']").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("Login realizado!");
    window.location.href = "/"; // volta pro home
  } catch (err) {
    alert("Erro no login: " + err.message);
  }
});