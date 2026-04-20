import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  console.log("header.js foi carregado!");

  const headerContainer = document.getElementById("header");

  // 🔥 CAMINHO ROBUSTO (funciona local + deploy)
  const headerUrl = new URL("../html/header.html", import.meta.url);

  fetch(headerUrl)
    .then((res) => {
      if (!res.ok) throw new Error("Erro ao carregar header");
      return res.text();
    })
    .then((html) => {
      headerContainer.innerHTML = html;

      // ELEMENTOS (só existem depois do innerHTML)
      const userBox = document.getElementById("avatar-wrapper");
      const dropdown = document.querySelector(".dropdown");
      const loginBtn = document.getElementById("loginBtn");
      const userPic = document.getElementById("userPic");

      // ===== DROPDOWN =====
      userBox.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdown.style.display =
          dropdown.style.display === "flex" ? "none" : "flex";
      });

      document.addEventListener("click", (e) => {
        if (!userBox.contains(e.target)) {
          dropdown.style.display = "none";
        }
      });

      // ===== AUTH =====
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          loginBtn.style.display = "none";
          userBox.classList.remove("hidden");

          try {
            const docRef = doc(db, "users", user.uid);
            const snap = await getDoc(docRef);

            if (snap.exists() && snap.data().avatar) {
              userPic.src = snap.data().avatar;
            } else {
              userPic.src = "./assets/default-avatar.png";
            }

          } catch (err) {
            console.error("Erro ao pegar avatar:", err);
            userPic.src = "./assets/default-avatar.png";
          }

        } else {
          loginBtn.style.display = "block";
          userBox.classList.add("hidden");
        }
      });

      // ===== LOGOUT =====
      document
        .getElementById("logoutBtn")
        ?.addEventListener("click", async () => {
          await signOut(auth);
          window.location.href = "./login.html";
        });
    })
    .catch((err) => console.error("Erro no header:", err));
});