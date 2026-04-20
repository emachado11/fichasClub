import { auth } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Aqui escutamos o evento que disparamos no header.js
window.addEventListener("headerReady", () => {
  const loginBtn = document.getElementById("loginBtn");
  const userBox = document.getElementById("userBox");
  const userPic = document.getElementById("userPic");
  const logoutBtn = document.getElementById("logoutBtn");

  // Verifica o estado do usuário
  onAuthStateChanged(auth, (user) => {
    if (user) {
      loginBtn.style.display = "none"; // Esconde o botão de login
      userBox.classList.remove("hidden"); // Exibe o avatar
      userPic.src = user.photoURL || "./assets/default.png"; // Usa a foto do Google ou uma foto padrão
    } else {
      loginBtn.style.display = "block"; // Mostra o botão de login
      userBox.classList.add("hidden"); // Esconde o avatar
    }
  });

  // Logout
  logoutBtn?.addEventListener("click", async () => {
    await signOut(auth); // Faz logout
    window.location.href = "./login.html"; // Redireciona para o login
  });
});