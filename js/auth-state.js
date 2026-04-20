import { auth } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

window.addEventListener("headerReady", () => {
  const loginBtn = document.getElementById("loginBtn");
  const userBox = document.getElementById("avatar-wrapper"); // 🔥 CORRIGIDO
  const userPic = document.getElementById("userPic");
  const logoutBtn = document.getElementById("logoutBtn");

  onAuthStateChanged(auth, (user) => {
    if (user) {
      loginBtn.style.display = "none";
      userBox.classList.remove("hidden");
      userPic.src = user.photoURL || "./assets/default-avatar.png";
    } else {
      loginBtn.style.display = "block";
      userBox.classList.add("hidden");
    }
  });

  logoutBtn?.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "./login.html";
  });
});