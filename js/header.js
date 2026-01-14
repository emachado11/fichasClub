import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

async function carregarHeader() {
  const res = await fetch("components/header.html");
  const html = await res.text();

  document.body.insertAdjacentHTML("afterbegin", html);

  const nameEl = document.getElementById("user-name");
  const avatarEl = document.getElementById("user-avatar");
  const logoutBtn = document.getElementById("btn-logout");
  const headerRight = document.querySelector(".header-right");

  onAuthStateChanged(auth, (user) => {
    if (!user) {
      headerRight.innerHTML = `
        <a href="login.html" class="login-link">Entrar</a>
      `;
      return;
    }

    nameEl.textContent = user.displayName || user.email;
    avatarEl.src = user.photoURL || "assets/avatar-default.png";

    nameEl.textContent = limitarNome(
        user.displayName || user.email
    );

    logoutBtn.onclick = async () => {
      await signOut(auth);
      window.location.href = "login.html";
    };
  });
}

function limitarNome(nome) {
  if (nome.length <= 12) return nome;
  return nome.slice(0, 9) + "...";
}


carregarHeader();
