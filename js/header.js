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
  const headerContainer = document.getElementById("header");

  const headerUrl = new URL("../html/header.html", import.meta.url);

  fetch(headerUrl)
    .then((res) => {
      if (!res.ok) throw new Error("Erro ao carregar header");
      return res.text();
    })
    .then((html) => {
      headerContainer.innerHTML = html;

      // 🔥 DEFINE BASE PATH AUTOMÁTICO
      const basePath = window.location.pathname.includes("fichasClub")
        ? "/fichasClub"
        : "";

      // 🔥 CORRIGE TODOS LINKS DO HEADER
      headerContainer.querySelectorAll("a").forEach((a) => {
        const href = a.getAttribute("href");

        if (href && href.startsWith("/")) {
          a.href = basePath + href;
        }
      });

      // 🔥 CORRIGE IMAGENS
      headerContainer.querySelectorAll("img").forEach((img) => {
        const src = img.getAttribute("src");

        if (src && src.startsWith("/")) {
          img.src = basePath + src;
        }
      });

      // ELEMENTOS
      const userBox = document.getElementById("avatar-wrapper");
      const dropdown = document.querySelector(".dropdown");
      const loginBtn = document.getElementById("loginBtn");
      const userPic = document.getElementById("userPic");

      // DROPDOWN
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

      // AUTH
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
              userPic.src = basePath + "/assets/default-avatar.png";
            }

          } catch {
            userPic.src = basePath + "/assets/default-avatar.png";
          }

        } else {
          loginBtn.style.display = "block";
          userBox.classList.add("hidden");
        }
      });

      // LOGOUT
      document.getElementById("logoutBtn")?.addEventListener("click", async () => {
        await signOut(auth);
        window.location.href = basePath + "/login.html";
      });

      // 🔥 DISPARA EVENTO PRO RESTO DO SISTEMA
      window.dispatchEvent(new Event("headerReady"));
    })
    .catch((err) => console.error("Erro no header:", err));
});