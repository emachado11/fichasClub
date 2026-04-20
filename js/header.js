// IMPORTAÇÕES DEVEM SER FEITAS NO INÍCIO DO ARQUIVO
import { auth } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
  console.log("header.js foi carregado!");

  // Seleciona o elemento onde o header será injetado
  const headerContainer = document.getElementById("header");

  // Carrega o conteúdo do header.html
  fetch("./html/header.html")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Erro ao carregar o header: " + response.statusText);
      }
      return response.text();
    })
    .then((html) => {
      console.log("header.html carregado com sucesso!");
      headerContainer.innerHTML = html;  // Injeta o HTML do header

      // Agora que o header foi carregado, configuramos o comportamento do dropdown
      const userBox = document.getElementById("avatar-wrapper");
      const dropdown = document.querySelector(".dropdown");

      // Lógica para alternar o dropdown
      userBox.addEventListener("click", (e) => {
        e.stopPropagation(); // Impede o clique de se propagar para o body
        if (dropdown.style.display === "none" || dropdown.style.display === "") {
          dropdown.style.display = "flex"; // Mostra o dropdown
        } else {
          dropdown.style.display = "none"; // Esconde o dropdown
        }
      });

      // Fechar o dropdown ao clicar fora do avatar
      document.addEventListener("click", (e) => {
        if (!userBox.contains(e.target)) {
          dropdown.style.display = "none"; // Fecha o dropdown
        }
      });

      // Verifica se o usuário está logado
      onAuthStateChanged(auth, (user) => {
        const loginBtn = document.getElementById("loginBtn");
        const userPic = document.getElementById("userPic");

        if (user) {
          loginBtn.style.display = "none"; // Esconde o botão de login
          userBox.classList.remove("hidden"); // Exibe o avatar
          userPic.src = user.photoURL || "../assets/default.png"; // Foto do Google ou padrão
        } else {
          loginBtn.style.display = "block"; // Mostra o botão de login
          userBox.classList.add("hidden"); // Esconde o avatar
        }
      });

      // Logout
      const logoutBtn = document.getElementById("logoutBtn");
      logoutBtn?.addEventListener("click", async () => {
        await signOut(auth); // Realiza o logout
        window.location.href = "../login.html"; // Redireciona para a página de login
      });
    })
    .catch((error) => {
      console.error("Erro ao carregar o header:", error);
    });
});