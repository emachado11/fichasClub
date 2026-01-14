import { auth } from "./firebase.js";
import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

auth.onAuthStateChanged(async (user) => {
  if (!user) return;

  const lista = document.getElementById("lista-campanhas");
  lista.innerHTML = "";

  const ref = collection(db, "users", user.uid, "campaigns");
  const snap = await getDocs(ref);

  document.querySelector(".qtd").textContent =
    `${snap.size} Campanha${snap.size !== 1 ? "s" : ""}`;

  snap.forEach((docSnap) => {
    const campanha = docSnap.data();

    const card = document.createElement("div");
    card.className = "campanha-card";

    card.innerHTML = `
      <div class="campanha-esq">
        <div class="campanha-img"
          style="background-image:url('${campanha.imagem || ""}')">
        </div>

        <div class="campanha-info">
          <h2>${campanha.nome}</h2>
          <p>${campanha.agentes?.length || 0} agentes</p>
          <button class="btn-ver">ver campanha</button>
        </div>
      </div>

      <button class="btn-deletar">✖</button>
    `;

    card.querySelector(".btn-ver").onclick = () => {
      window.location.href = `campanha.html?id=${docSnap.id}`;
    };

    card.querySelector(".btn-deletar").onclick = async () => {
      if (confirm("Apagar campanha?")) {
        await deleteDoc(
          doc(db, "users", user.uid, "campaigns", docSnap.id)
        );
        location.reload();
      }
    };

    lista.appendChild(card);
  });
});
