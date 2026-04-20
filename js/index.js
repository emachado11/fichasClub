import { auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const greeting = document.getElementById("greeting");
const userNickname = document.getElementById("user-nickname");

onAuthStateChanged(auth, (user) => {
  if (user) {
    userNickname.textContent = user.displayName || "Anônimo"; // Exibe o nome ou "Anônimo"
  }
});